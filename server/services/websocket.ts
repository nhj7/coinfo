import type { ServerWebSocket } from 'bun';
import { encode } from '@msgpack/msgpack';
import {getTickerData} from "~~/server/store/marketData";


/**
 * 서버 인스턴스를 globalThis에 저장하기 위한 고유 키
 * Nitro close 훅과 함께 사용하여 핫 리로드 시 서버 정리
 */
const GLOBAL_SERVER_KEY = '__COINFO_WEBSOCKET_SERVER__';

// h3의 WebSocket 핸들러에서 peer 객체의 타입을 추론합니다.
type H3WebSocketPeer = Parameters<NonNullable<Parameters<typeof defineWebSocketHandler>[0]['open']>>[0];

// Bun 또는 h3 WebSocket 객체를 나타내는 통합 타입
export type AnyWebSocket = ServerWebSocket<ClientData> | H3WebSocketPeer;

/**
 * 클라이언트 연결 맵
 */
export const clients = new Map<AnyWebSocket, ClientData>();

/**
 * 역인덱스: 심볼 → 구독 중인 클라이언트들
 * Key: "exchange:symbol", Value: Set of WebSocket clients
 */
export const symbolSubscribers = new Map<string, Set<AnyWebSocket>>();

/**
 * 변경된 심볼 키 저장 (중복 제거)
 * 333ms마다 플러시
 */
const changedSymbolKeys = new Set<string>();
/**
 * 브로드캐스트 타이머
 */
let broadcastTimer: Timer | null = null;
const BROADCAST_INTERVAL = 333; // ms

/**
 * 서버 시작 시각
 */
const serverStartTime = Date.now();

/**
 * 브로드캐스트 통계
 */
const broadcastStats = {
    totalFlushes: 0,           // 누적 플러시 횟수
    totalBroadcasts: 0,        // 누적 전송 메시지 수
    lastFlushTime: 0,          // 마지막 플러시 시각
    totalChanges: 0,           // 누적 변경 건수
};

/**
 * 성능 메트릭
 */
const performanceMetrics = {
    flushDurations: [] as number[],  // 최근 100개 플러시 처리 시간
    lastFlushDuration: 0,
    maxFlushDuration: 0,
};

/**
 * globalThis에서 서버 인스턴스 가져오기
 */
function getServerInstance() {
  // @ts-expect-error - globalThis에 커스텀 속성 추가
  return globalThis[GLOBAL_SERVER_KEY] || null;
}

/**
 * globalThis에 서버 인스턴스 저장
 */
function setServerInstance(instance: Bun.Server | null): void {
  // @ts-expect-error - globalThis에 커스텀 속성 추가
  globalThis[GLOBAL_SERVER_KEY] = instance;
}

const PORT = 3003;


export interface ClientData {
    id: string;
    subscriptions: Set<string>; // "exchange:symbol" 형식
    remoteAddress?: string;
}

/**
 * WebSocket 서버 시작 함수
 */
export function startWebSocketServer(): void {
    console.log('[WebSocket] Deprecated Bun WebSocket server...')
    return;
    console.log('[WebSocket] Starting Bun WebSocket server...')
    console.log('[WebSocket] prerender:', import.meta.prerender)
    console.log('[WebSocket] dev:', import.meta.dev)

    // 빌드 시에만 스킵 (개발/운영 모두 실행)
    if (import.meta.prerender) {
        console.log('[WebSocket] Server skipped (build/prerender mode)')
        return
    }

    // Bun 런타임 체크
    if (typeof globalThis.Bun === 'undefined') {
        console.error('[WebSocket] Bun runtime not available', globalThis.Bun);
        return
    }

    // 기존 서버가 실행 중이면 먼저 종료 (핫 리로드 대응)
    const existingServer = getServerInstance();

    if (existingServer) {
        console.log('[WebSocket] Found existing server, stopping for hot reload....');
        try {
            existingServer.stop();
            setServerInstance(null);
            console.log('[WebSocket] Existing server stopped successfully');
        } catch (error) {
            console.error('[WebSocket] Error stopping existing server:', error);
        }
    }

    console.log(`[WebSocket] Starting server on port ${PORT}...`)
    const serverInstance = globalThis.Bun.serve({
        port: PORT,
        fetch(req, server) {
            const url = new URL(req.url);
            //const pathParts = url.pathname.split('/').filter(Boolean);

            // WebSocket 업그레이드
            if (url.pathname === '/ws') {
                const upgraded = server.upgrade(req, {
                    data: {
                        id: crypto.randomUUID(),
                        subscriptions: new Set<string>(),
                    },
                });
                if (!upgraded) {
                    return new Response('WebSocket upgrade failed', { status: 400 });
                }
                return undefined;
            }
            // Health check
            if (url.pathname === '/health') {
                return new Response('OK', { status: 200 });
            }
            return new Response('Not Found', { status: 404 });
        },

        websocket: {
            open(ws: ServerWebSocket<ClientData>): void {
                console.log("open");
                handleOpen(ws, ws.data.id, ws.remoteAddress);
            },

            message(ws: ServerWebSocket<ClientData>, message: string | Buffer): void {
                console.log("message", message);
                handleMessage(ws, message);
            },

            close(ws: ServerWebSocket<ClientData>): void {
                console.log("close");
                handleClose(ws, ws.data.id);
            },
        },

    });

    // globalThis에 서버 인스턴스 저장
    setServerInstance(serverInstance);

    console.log(`[WebSocket] ✅ Server started successfully on port ${PORT}`)
    console.log(`[WebSocket] WebSocket endpoint: ws://localhost:${PORT}/ws`)
    console.log(`[WebSocket] Health check: http://localhost:${PORT}/health`)
}

/**
 * WebSocket 메시지 압축 사용 여부
 */
const USE_COMPRESSION = true;

/** WebSocket 메시지 전송 래퍼 함수 */
function send(ws: AnyWebSocket, data: object): void {
    const binaryData = encode(data);
    ws.send(binaryData, USE_COMPRESSION);
}


/**
 * WebSocket 연결 핸들러
 */
export function handleOpen(ws: AnyWebSocket, id: string, remoteAddress: string | undefined): void {
    console.log(`[Server] Client connected : ${( id )} ${remoteAddress}`);
    clients.set(ws, { id : id, subscriptions : new Set<string>(), remoteAddress : remoteAddress});

    // PM2 메트릭 업데이트
    //updateActiveConnections(clients.size);
    send(ws, {
        t: 'connected',
        id: id,
        message: 'Connected to coin WebSocket server',
    } as WebSocketMessage);
}

/**
 * WebSocket 메시지 핸들러
 */
export function handleMessage(ws: AnyWebSocket, message: string | Buffer): void {
    try {
        const data = JSON.parse(message.toString());
        console.log("handleMessage", data);

        switch (data.type) {
            case 'subscribe':
                console.log("subscribe");
                handleSubscribe(ws, data.exchange, data.symbols);
                break;
            case 'unsubscribe':
                console.log("unsubscribe");
                //handleUnsubscribe(ws, data.exchange, data.symbols);
                break;
            case 'snapshot':
                console.log("snapshot");
                //handleSnapshot(ws, data.exchange);
                break;
            case 'ping':
                send(ws, { type: 'pong' });
                break;
            default:
                send(ws, {
                    type: 'error',
                    message: `Unknown message type ${data}`,
                });
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        send(ws, {
            type: 'error',
            message: 'Invalid JSON',
        });
    }
}

/**
 * 구독 처리
 */
function handleSubscribe(
    ws: AnyWebSocket,
    exchange: ExchangeType,
    symbols: string[]
): void {

    //ExchangeType 검사.
    if (!EXCHANGES.includes(exchange)) {
        send(ws, {
            t: 'error',
            code : '400',
            message: `Invalid exchange ${exchange}`,
        } as WebSocketMessage);
        return;
    }

    if (!Array.isArray(symbols)) {
        send(ws, {
            t: 'error',
            code: '400',
            message: 'symbols must be an array',
        } as WebSocketMessage); // WsErrorMessage는 code와 message 속성을 포함하므로, t: 'error'와 함께 사용될 때 WebSocketMessage 타입으로 캐스팅하는 것이 더 적절합니다.
        return;
    }

    symbols.forEach((symbol) => {
        const key = `${exchange}:${symbol}`;

        // 클라이언트 구독 목록에 추가
        clients.get(ws)!.subscriptions.add(key);
        //ws.data.subscriptions.add(key);

        // 역인덱스에 추가
        if (!symbolSubscribers.has(key)) {
            symbolSubscribers.set(key, new Set());
        }
        symbolSubscribers.get(key)!.add(ws);
    });

    send(ws, {
        type: 'subscribed',
        exchange,
        symbols,
        subscriptions: Array.from(clients.get(ws)!.subscriptions),
    });
}

/**
 * WebSocket 연결 종료 핸들러
 */
export function handleClose(ws: AnyWebSocket, id : string): void {
    console.log(`[Server] Client disconnected: ${id}`);

    //역인덱스에서 제거
    clients.get(ws)!.subscriptions.forEach(symbolKey => {
        const subscribers = symbolSubscribers.get(symbolKey);
        if (subscribers) {
            subscribers.delete(ws);
            // 구독자가 없으면 맵에서 제거
            if (subscribers.size === 0) {
                symbolSubscribers.delete(symbolKey);
            }
        }
    });
    //
    clients.delete(ws);
    // PM2 메트릭 업데이트
    //updateActiveConnections(clients.size);
}

/**
 * 티커 업데이트 발생 시 호출 (즉시 전송하지 않고 버퍼에 추가)
 */
export function broadcastUpdate(
    exchange: ExchangeType,
    symbol: string
): void {
    const key = `${exchange}:${symbol}`;

    // 변경된 심볼 키 추가 (Set이므로 자동 중복 제거)
    changedSymbolKeys.add(key);

    // 타이머가 없으면 시작
    if (!broadcastTimer) {
        broadcastTimer = setTimeout(() => {
            flushBroadcast();
        }, BROADCAST_INTERVAL);
    }
}

/**
 * 버퍼에 쌓인 변경사항을 클라이언트들에게 전송 (333ms마다 실행)
 */
function flushBroadcast(): void {
    const flushStartTime = Date.now();

    //console.log(`[websocket.ts] Flush broadcast: ${changedSymbolKeys.size}`);
    if (changedSymbolKeys.size === 0) {
        broadcastTimer = null;
        return;
    }

    // 통계: 변경 건수 기록
    const changeCount = changedSymbolKeys.size;
    broadcastStats.totalChanges += changeCount;

    // 1. 변경된 심볼들의 TickerCompact 데이터를 미리 한 번만 생성합니다.
    const tickerDataCache = new Map<string, TickerCompact>();
    changedSymbolKeys.forEach(key => {
        const [exchange, symbol] = key.split(':') as [ExchangeType, string];
        const tickerData = getTickerData(exchange, symbol);

        if (tickerData) {
            const compactData: TickerCompact = [
                EXCHANGE_TO_ID[exchange],
                symbol,
                tickerData.p,
                tickerData.d,
                tickerData.c24,
                tickerData.cp24,
                tickerData.p24,
            ];
            tickerDataCache.set(key, compactData);
        }
    });

    // 만약 캐시된 데이터가 없다면 더 이상 진행할 필요가 없습니다.
    if (tickerDataCache.size === 0) {
        changedSymbolKeys.clear();
        broadcastTimer = null;
        return;
    }

    // 클라이언트별로 어떤 심볼 키가 변경되었는지 수집 (심볼 키만 저장하여 메모리 효율)
    const clientChangedKeys = new Map<AnyWebSocket, string[]>();

    // 변경된 심볼들을 순회하며 구독자 찾기
    changedSymbolKeys.forEach(symbolKey => {
        // 이 심볼을 구독 중인 클라이언트들 조회 (역인덱스 활용)
        const subscribers = symbolSubscribers.get(symbolKey);

        if (subscribers && subscribers.size > 0) {
            // 각 구독자에게 변경된 심볼 키 추가
            subscribers.forEach(ws => {
                if (!clientChangedKeys.has(ws)) {
                    clientChangedKeys.set(ws, []);
                }
                clientChangedKeys.get(ws)!.push(symbolKey);  // 심볼 키만 저장 (티커 데이터는 나중에 조회)
            });
        }
    });

    // 클라이언트별로 변경된 티커 배치 전송
    const now = Date.now();
    let totalBroadcastCount = 0;

    clientChangedKeys.forEach((symbolKeys, ws) => {
        // 2. 미리 생성된 TickerCompact 데이터를 조회하여 메시지를 구성합니다.
        const updates: TickerCompact[] = symbolKeys
            .map(key => tickerDataCache.get(key))
            .filter((data): data is TickerCompact => data !== undefined);

        // 변경된 티커들을 배열로 묶어서 1번에 전송
        if (updates.length > 0) {
            send(ws, {
                t: 'tickers',        // type: 메시지 타입
                d: updates,          // data: 티커 배열
                ts: now,      // timestamp: 전송 시각
            } as WebSocketMessage);
            totalBroadcastCount++;
        }
    });

    // 버퍼 초기화
    changedSymbolKeys.clear();
    broadcastTimer = null;

    // 통계 업데이트
    broadcastStats.totalFlushes++;
    broadcastStats.totalBroadcasts += totalBroadcastCount;
    broadcastStats.lastFlushTime = now;

    // 성능 메트릭 업데이트
    const flushDuration = Date.now() - flushStartTime;
    performanceMetrics.lastFlushDuration = flushDuration;
    performanceMetrics.maxFlushDuration = Math.max(performanceMetrics.maxFlushDuration, flushDuration);

    // 최근 100개만 유지 (링버퍼)
    performanceMetrics.flushDurations.push(flushDuration);
    if (performanceMetrics.flushDurations.length > 100) {
        performanceMetrics.flushDurations.shift();
    }
}



/**
 * 서버 종료
 */
export function stopServer(): void {
    const serverInstance = getServerInstance();
    if (serverInstance) {
        console.log('[WebSocket] Stopping server...');
        try {
            serverInstance.stop();
            setServerInstance(null);
            console.log('[WebSocket] Server stopped successfully');
        } catch (error) {
            console.error('[WebSocket] Error stopping server:', error);
        }
    }
}

// 프로세스 종료 시그널 처리
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
    console.log(`\n🛑 ${signal} Shutting down gracefully...`);
    stopServer();
    process.exit(0);
};

/**
 * WebSocket 서버 상태 조회
 */
export async function getWebSocketStats() {
    const now = Date.now();
    const uptimeMs = now - serverStartTime;

    // uptime을 일/시/분/초로 변환
    const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((uptimeMs % (1000 * 60)) / 1000);

    const uptime = days > 0
        ? `${days}일 ${hours}시간 ${minutes}분 ${seconds}초`
        : hours > 0
        ? `${hours}시간 ${minutes}분 ${seconds}초`
        : minutes > 0
        ? `${minutes}분 ${seconds}초`
        : `${seconds}초`;

    // Connections 정보
    const clientsList = Array.from(clients.entries()).map(([_ws, data]) => ({
        id: data.id,
        subscriptions: data.subscriptions.size,
        remoteAddress: data.remoteAddress,
    }));

    // Subscriptions 정보
    const bySymbol: Record<string, number> = {};
    symbolSubscribers.forEach((subscribers, symbolKey) => {
        bySymbol[symbolKey] = subscribers.size;
    });

    // Broadcast 정보
    const avgChangesPerFlush = broadcastStats.totalFlushes > 0
        ? Math.round((broadcastStats.totalChanges / broadcastStats.totalFlushes) * 100) / 100
        : 0;

    const timeSinceLastFlush = broadcastStats.lastFlushTime > 0
        ? now - broadcastStats.lastFlushTime
        : 0;

    // Performance 정보
    const avgFlushDuration = performanceMetrics.flushDurations.length > 0
        ? Math.round((performanceMetrics.flushDurations.reduce((a, b) => a + b, 0) / performanceMetrics.flushDurations.length) * 100) / 100
        : 0;

    const avgBroadcastPerSecond = uptimeMs > 0
        ? Math.round((broadcastStats.totalBroadcasts / (uptimeMs / 1000)) * 100) / 100
        : 0;

    // Exchange 정보 (동적으로 가져오기)
    const exchanges: Record<string, unknown> = {};

    // upbit 상태 가져오기
    try {
        const { getUpbitStatus } = await import('./upbit');
        exchanges.upbit = getUpbitStatus();
    } catch (error) {
        exchanges.upbit = {
            error: 'Failed to get upbit status',
        };
        console.error(error);
    }

    // binance는 아직 미구현
    exchanges.binance = {
        connected: false,
        error: 'Not implemented yet',
    };

    // Memory 정보
    const { getAllMarketData } = await import('../store/marketData');
    const marketDataStore = getAllMarketData();
    const marketDataStoreSize: Record<string, number> = {};
    marketDataStore.forEach((exchangeData, exchange) => {
        marketDataStoreSize[exchange] = exchangeData.size;
    });

    return {
        server: {
            uptime,
            startTime: new Date(serverStartTime).toLocaleString('ko-KR'),
        },
        connections: {
            total: clients.size,
            clients: clientsList,
        },
        subscriptions: {
            totalSymbols: symbolSubscribers.size,
            bySymbol,
        },
        broadcast: {
            lastFlushTime: broadcastStats.lastFlushTime > 0
                ? new Date(broadcastStats.lastFlushTime).toLocaleString('ko-KR')
                : null,
            timeSinceLastFlush,
            pendingChanges: changedSymbolKeys.size,
            isTimerActive: broadcastTimer !== null,
            stats: {
                totalFlushes: broadcastStats.totalFlushes,
                totalBroadcasts: broadcastStats.totalBroadcasts,
                averageChangesPerFlush: avgChangesPerFlush,
            },
        },
        exchanges,
        performance: {
            avgFlushDuration,
            lastFlushDuration: performanceMetrics.lastFlushDuration,
            maxFlushDuration: performanceMetrics.maxFlushDuration,
            avgBroadcastPerSecond,
        },
        memory: {
            clientsMapSize: clients.size,
            symbolSubscribersMapSize: symbolSubscribers.size,
            changedSymbolKeysSize: changedSymbolKeys.size,
            marketDataStoreSize,
        },
    };
}