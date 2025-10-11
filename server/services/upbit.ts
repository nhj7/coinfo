import { updateTickerData, getTickerData, setMarketInfo } from '../store/marketData';
import type {
    ExchangeConnector,
    Ticker,
    UpbitTickerResponse,
    PriceDirection,
    MarketInfo,
    Timer,
    UpbitMarket
} from "#shared/types";

const UPBIT_WS_URL = 'wss://api.upbit.com/websocket/v1';
const UPBIT_MARKET_API = 'https://api.upbit.com/v1/market/all';



/**
 * 업비트 WebSocket 커넥터
 */
class UpbitConnector implements ExchangeConnector {
    name = 'upbit' as const;
    private ws: WebSocket | null = null;
    private reconnectTimer: Timer | null = null;
    private symbols: string[] = ['KRW-BTC', 'KRW-ETH', 'KRW-XRP'];
    private tickerBuffer: UpbitTickerResponse[] = [];
    private flushTimer: Timer | null = null;
    private readonly FLUSH_INTERVAL = 333; // ms

    // 상태 추적 필드
    private lastUpdateTime: number | null = null;      // 마지막 업데이트 시각
    private lastReconnectAttempt: number | null = null; // 마지막 재연결 시도 시각
    private connectedAt: number | null = null;          // 연결 시작 시각

    async connect(): Promise<void> {
        // 마켓 목록 먼저 가져오기
        await this.fetchMarkets();

        if (this.ws?.readyState === WebSocket.OPEN) {
            console.log('[Upbit] Already connected');
            return;
        }

        console.log('[Upbit] Connecting to Upbit WebSocket...');

        this.ws = new WebSocket(UPBIT_WS_URL);

        this.ws.onopen = () => {
            const implementation = this.ws?.constructor?.name || 'Unknown';
            console.log(`[Upbit] Connected using '${implementation}' implementation.`);
            this.connectedAt = Date.now();
            this.subscribe();
        };

        this.ws.onmessage = async (event) => {
            try {
                let text: string;

                // event.data 타입에 따라 처리
                if (typeof event.data === 'string') {
                    // 이미 문자열인 경우
                    text = event.data;
                } else if (event.data instanceof ArrayBuffer) {
                    // ArrayBuffer인 경우
                    text = new TextDecoder().decode(event.data);
                } else if (event.data instanceof Blob) {
                    // Blob인 경우 (브라우저 환경)
                    text = await event.data.text();
                } else {
                    // 기타: Buffer 등
                    text = event.data.toString();
                }

                const tickers: UpbitTickerResponse[] = JSON.parse(text);

                if (tickers && tickers.length > 0 && tickers[0].ty === 'ticker') {
                    // 버퍼에 추가
                    this.tickerBuffer.push(...tickers);

                    // 플러시 타이머 시작 (이미 실행 중이면 무시)
                    if (!this.flushTimer) {
                        this.flushTimer = setTimeout(() => {
                            this.flushTickerBuffer();
                        }, this.FLUSH_INTERVAL);
                    }
                }
            } catch (error) {
                console.error('[Upbit] Message parse error:', error);
            }
        };

        this.ws.onerror = (error) => {
            console.error('[Upbit] WebSocket error:', error);
        };

        this.ws.onclose = () => {
            console.log('[Upbit] Disconnected');
            this.ws = null;
            this.connectedAt = null;
            this.scheduleReconnect();
        };
    }

    disconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.flushTimer) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    /**
     * 심볼 구독
     */
    private subscribe(): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        const subscribeMessage = [
            { ticket: 'unique-ticket' },
            {
                type: 'ticker',
                codes: this.symbols,
            },
            { format: 'SIMPLE_LIST' }
        ];

        this.ws.send(JSON.stringify(subscribeMessage));
        console.log('[Upbit] Subscribed length:', this.symbols.length);
    }

    /**
     * 버퍼에 모인 티커 데이터 플러시
     */
    private flushTickerBuffer(): void {
        if (this.tickerBuffer.length === 0) {
            this.flushTimer = null;
            return;
        }

        //console.log(`[Upbit] Flushing tickers`, this.tickerBuffer.length);

        // 중복 심볼 제거 - 최신 데이터만 유지
        const latestTickers = new Map<string, UpbitTickerResponse>();
        this.tickerBuffer.forEach(ticker => {
            latestTickers.set(ticker.cd, ticker);
        });

        // 업데이트 처리
        this.handleTickerUpdate(Array.from(latestTickers.values()));

        // 버퍼 초기화
        this.tickerBuffer = [];
        this.flushTimer = null;
    }

    /**
     * 티커 데이터 업데이트 처리
     */
    private handleTickerUpdate(tickers: UpbitTickerResponse[]): void {
        //console.log('[Upbit] Handling tickers:', tickers.length);

        // 마지막 업데이트 시각 기록
        this.lastUpdateTime = Date.now();

        tickers.forEach(ticker => {
            // 이전 가격 조회하여 방향 계산
            const prevData = getTickerData('upbit', ticker.cd);
            const prevPrice = prevData?.p;

            // 가격 변동 방향 결정 (u=상승, d=하락, e=보합)
            let priceDirection: PriceDirection = 0;
            if (prevPrice !== undefined) {
                if (ticker.tp > prevPrice) {
                    priceDirection = 1;
                } else if (ticker.tp < prevPrice) {
                    priceDirection = -1;
                }
            }
            
            // 가격 변동이 없으면 업데이트를 건너뜁니다.
            // 이는 불필요한 데이터 생성 및 브로드캐스트를 방지하여 성능을 향상시킵니다.
            if (prevPrice && priceDirection === 0) {
                return; // forEach 루프의 다음 아이템으로 넘어갑니다.
            }

            // 티커 데이터 생성
            const tickerData: Ticker = {
                e: 'upbit',                                     // exchange: 거래소
                s: ticker.cd,                                   // symbol: 심볼 (KRW-BTC)
                p: ticker.tp,                                   // price: 현재가
                d: priceDirection,                             // priceDirection: 가격 방향
                c24: Math.round(ticker.scr * 100 * 100) / 100,  // change24h: 전일대비 변화율(%), 소수점 2자리
                cp24: ticker.scp,                               // changePrice24h: 전일대비 변화 금액
                p24: Math.floor(ticker.atp24h),                 // volume24h: 24시간 거래량(정수)
                /* h24: ticker.hp,                                 // high24h: 24시간 최고가
                l24: ticker.lp                                  // low24h: 24시간 최저가
                ts: ticker.tms,                                 // timestamp: 타임스탬프 */
            };

            // 전역 store에 저장 및 브로드캐스트 트리거
            updateTickerData('upbit', ticker.cd, tickerData);
        });
    }

    /**
     * 마켓 목록 가져오기
     */
    private async fetchMarkets(): Promise<void> {
        try {
            console.log('[Upbit] Fetching market list...');
            const response = await fetch(UPBIT_MARKET_API);
            const markets = await response.json() as UpbitMarket[];

            // KRW 마켓만 필터링
            this.symbols = markets
                //.filter((market) => market.market.startsWith('KRW-'))
                .map((market) => market.market);

            const marketInfo: MarketInfo[] = markets.map(market => ({
                symbol: market.market,
                korean_name: market.korean_name,
                english_name: market.english_name,
            }));
            setMarketInfo('upbit', marketInfo);

            console.log(`[Upbit] Found ${this.symbols.length} KRW markets`);
        } catch (error) {

            console.error('[Upbit] Failed to fetch markets:', error);
            // 기본 심볼 사용
            this.symbols = ['KRW-BTC', 'KRW-ETH', 'KRW-XRP'];
        }
    }

    /**
     * 재연결 스케줄
     */
    private scheduleReconnect(): void {
        if (this.reconnectTimer) {
            return;
        }

        // 재연결 시도 시각 기록
        this.lastReconnectAttempt = Date.now();

        console.log('[Upbit] Reconnecting in 5 seconds...');
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, 5000);
    }

    /**
     * 구독 심볼 추가
     */
    addSymbols(symbols: string[]): void {
        this.symbols = [...new Set([...this.symbols, ...symbols])];
        if (this.isConnected()) {
            this.subscribe();
        }
    }

    /**
     * Status 계산
     */
    private calculateStatus(): 'healthy' | 'degraded' | 'unhealthy' {
        // 연결 안됨 = unhealthy
        if (!this.isConnected()) {
            return 'unhealthy';
        }

        // 업데이트가 한번도 없음 = degraded (초기 연결 중)
        if (!this.lastUpdateTime) {
            return 'degraded';
        }

        const timeSinceUpdate = Date.now() - this.lastUpdateTime;

        // 10초 이상 업데이트 없음 = unhealthy
        if (timeSinceUpdate > 10000) {
            return 'unhealthy';
        }

        // 5초 이상 업데이트 없음 = degraded
        if (timeSinceUpdate > 5000) {
            return 'degraded';
        }

        // 정상
        return 'healthy';
    }

    /**
     * 연결 유지 시간 계산 (ms)
     */
    private getUptime(): number {
        if (!this.connectedAt) {
            return 0;
        }
        return Date.now() - this.connectedAt;
    }

    /**
     * 쿼트(Quote) 기준 심볼 개수 집계
     */
    private getSymbolsByQuote(): Record<string, number> {
        const quoteCounts: Record<string, number> = {};

        this.symbols.forEach(symbol => {
            // "KRW-BTC" => ["KRW", "BTC"]
            const parts = symbol.split('-');
            if (parts.length >= 1) {
                const quote = parts[0]; // KRW, BTC, USDT 등
                quoteCounts[quote] = (quoteCounts[quote] || 0) + 1;
            }
        });

        return quoteCounts;
    }

    /**
     * 상태 조회
     */
    getStatus() {
        return {
            status: this.calculateStatus(),
            connected: this.isConnected(),
            uptime: this.getUptime(),
            symbols: {
                total: this.symbols.length,
                ...this.getSymbolsByQuote()
            },
            lastUpdate: this.lastUpdateTime
                ? new Date(this.lastUpdateTime).toLocaleString('ko-KR')
                : null,
            lastAttempt: this.lastReconnectAttempt
                ? new Date(this.lastReconnectAttempt).toLocaleString('ko-KR')
                : null,
            timestamp: new Date().toLocaleString('ko-KR')
        };
    }
}

// 싱글톤 인스턴스
const upbitConnector = new UpbitConnector();

export async function connectUpbit(): Promise<void> {
    await upbitConnector.connect();
}

export function disconnectUpbit(): void {
    upbitConnector.disconnect();
}

export function addUpbitSymbols(symbols: string[]): void {
    upbitConnector.addSymbols(symbols);
}

export function getUpbitStatus() {
    return upbitConnector.getStatus();
}
