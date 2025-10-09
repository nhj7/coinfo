/**
 * 타이머 타입 (setTimeout, setInterval 반환값)
 * Bun과 Node.js 모두 호환
 */
export type Timer = ReturnType<typeof setTimeout>;

/**
 * 거래소 타입
 */
export type ExchangeType = 'upbit' | 'binance';

export interface UpbitMarket {
    market: string;
    korean_name: string;
    english_name: string;
}

/**
 * 가격 변동 방향 (1=u=up, -1=d=down, 0=e=even)
 */
export type PriceDirection = -1 /*down*/ | 0 /*even*/ | 1 /*up*/;

/**
 * 심볼별 시세 데이터
 * @interface Ticker
 * @property {string} e - exchange: 거래소 (예: upbit, binance)
 * @property {string} s - symbol: 심볼 (예: KRW-BTC, BTCUSDT)
 * @property {number} p - price: 현재가
 * @property {PriceDirection} d - priceDirection: 직전 대비 가격 변동 방향 (1=상승, -1=하락, 0=보합)
 * @property {number} c24 - change24h: 전일대비 변화율 (%)
 * @property {number} cp24 - changePrice24h: 전일대비 변화 금액
 * @property {number} p24 - price24h: 24시간 거래금액
 * @property {number} ts - timestamp: 업데이트 시각 (ms)
 */
export interface Ticker {
    /** exchange: 거래소 */
    e: string;
    /** symbol: 심볼 */
    s: string;
    /** price: 현재가 */
    p: number;
    /** priceDirection: 가격 변동 방향 (1=u=up, -1=d=down, 0=e=even) */
    d : PriceDirection;
    /** change24h: 전일대비 변화율 (%) */
    c24: number;
    /** changePrice24h: 전일대비 변화 금액 */
    cp24: number;
    /** price24h: 24시간 거래금액 */
    p24: number;
    /** high24h: 24시간 최고가 */
    //h24: number;
    /** low24h: 24시간 최저가 */
    //l24: number;
    /** timestamp: 업데이트 시각 (ms) */
    //ts: number;
}
export type TickerArrayEnum = {
    /** exchange: 거래소 */
    exchange: 0
    /** symbol: 심볼 */
    symbol: 1
    price: 2
    priceDirection: 3
    change24h: 4
    changePrice24h: 5
    price24h: 6
}
export type TickerArray = [
    /** exchange: 거래소 */
    string
    /** symbol: 심볼 */
    , string
    /** price: 현재가 */
    , number
    /** priceDirection: 가격 변동 방향 (u=up, d=down, e=even) */
    , PriceDirection
    /** change24h: 전일대비 변화율 (%) */
    , number
    /** changePrice24h: 전일대비 변화 금액 */
    , number
    /** price24h: 24시간 거래금액 */
    , number
]


/**
 * 마켓 정보
 * @interface MarketInfo
 * @property {string} symbol - 심볼 (e.g., KRW-BTC)
 * @property {string} korean_name - 한글명
 * @property {string} english_name - 영문명
 */
export interface MarketInfo {
    symbol: string;
    korean_name: string;
    english_name: string;
}

/**
 * 거래소별 마켓 정보 맵
 */
export type MarketInfoStore = Map<ExchangeType, MarketInfo[]>;


/**
 * 거래소별 시세 데이터 맵
 */
export type ExchangeData = Map<string, Ticker>;

/**
 * 전체 마켓 데이터 (거래소 > 심볼 > 데이터)
 */
export type MarketDataStore = Map<ExchangeType, ExchangeData>;

/**
 * WebSocket 티커 메시지
 */
export interface TickerMessage {
    /** type: 'tickers' */
    t: 'tickers';
    /** data: 티커 배열 */
    d: Ticker[];
    /** count: 티커 개수 */
    c: number;
    /** timestamp: 전송 시각 */
    ts: number;
}

/**
 * 업비트 WebSocket 티커 응답 데이터
 * @interface UpbitTickerResponse
 * @description 업비트 WebSocket API에서 전송되는 실시간 티커 데이터 구조
 */
export interface UpbitTickerResponse {
    /** @type {string} 타입 ('ticker') */
    ty: string;
    /** @type {string} 페어 코드 (예: KRW-BTC) */
    cd: string;
    /** @type {number} 시가 */
    op: number;
    /** @type {number} 고가 */
    hp: number;
    /** @type {number} 저가 */
    lp: number;
    /** @type {number} 현재가 */
    tp: number;
    /** @type {number} 전일 종가 */
    pcp: number;
    /** @type {'RISE' | 'EVEN' | 'FALL'} 전일 종가 대비 가격 변동 방향 */
    c: 'RISE' | 'EVEN' | 'FALL';
    /** @type {number} 전일 대비 가격 변동의 절대값 */
    cp: number;
    /** @type {number} 전일 대비 가격 변동 값 */
    scp: number;
    /** @type {number} 전일 대비 등락율의 절대값 */
    cr: number;
    /** @type {number} 전일 대비 등락율 */
    scr: number;
    /** @type {number} 가장 최근 거래량 */
    tv: number;
    /** @type {number} 누적 거래량(UTC 0시 기준) */
    atv: number;
    /** @type {number} 24시간 누적 거래량 */
    atv24h: number;
    /** @type {number} 누적 거래대금(UTC 0시 기준) */
    atp: number;
    /** @type {number} 24시간 누적 거래대금 */
    atp24h: number;
    /** @type {string} 최근 거래 일자(UTC) (yyyyMMdd) */
    tdt: string;
    /** @type {string} 최근 거래 시각(UTC) (HHmmss) */
    ttm: string;
    /** @type {number} 체결 타임스탬프(ms) */
    ttms: number;
    /** @type {'ASK' | 'BID'} 매수/매도 구분 */
    ab: 'ASK' | 'BID';
    /** @type {number} 누적 매도량 */
    aav: number;
    /** @type {number} 누적 매수량 */
    abv: number;
    /** @type {number} 52주 최고가 */
    h52wp: number;
    /** @type {string} 52주 최고가 달성일 (yyyy-MM-dd) */
    h52wdt: string;
    /** @type {number} 52주 최저가 */
    l52wp: number;
    /** @type {string} 52주 최저가 달성일 (yyyy-MM-dd) */
    l52wdt: string;
    /** @type {string} [거래상태] (Deprecated) */
    ts?: string;
    /** @type {'PREVIEW' | 'ACTIVE' | 'DELISTED'} 거래상태 */
    ms: 'PREVIEW' | 'ACTIVE' | 'DELISTED';
    /** @type {string} [거래 상태] (Deprecated) */
    msfi?: string;
    /** @type {boolean} [거래 정지 여부] (Deprecated) */
    its?: boolean;
    /** @type {string} [거래지원 종료일] */
    dd?: string;
    /** @type {'NONE' | 'CAUTION'} 유의 종목 여부 */
    mw: 'NONE' | 'CAUTION';
    /** @type {number} 타임스탬프 (ms) */
    tms: number;
    /** @type {'SNAPSHOT' | 'REALTIME'} 스트림 타입 */
    st: 'SNAPSHOT' | 'REALTIME';
}

/**
 * 거래소 커넥터 베이스 인터페이스
 */
export interface ExchangeConnector {
    name: ExchangeType;
    connect(): void | Promise<void>;
    disconnect(): void;
    isConnected(): boolean;
}