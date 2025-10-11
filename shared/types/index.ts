/**
 * 타이머 타입 (setTimeout, setInterval 반환값)
 * Bun과 Node.js 모두 호환
 */
export type Timer = ReturnType<typeof setTimeout>;

/**
 * 지원하는 거래소 목록 (런타임용)
 * 배열 인덱스 = 거래소 ID (0: upbit, 1: binance)
 */
export const EXCHANGES =  ['upbit', 'binance'] as const;

/**
 * 지원하는 거래소 타입 (타입스크립트용)
 * 'upbit' | 'binance'
 */
export type ExchangeType = typeof EXCHANGES[number];

/**
 * 거래소 ID 타입 (배열 인덱스)
 */
export type ExchangeIdType = 0 | 1;

/**
 * 거래소명 → ID 매핑 (O(1))
 */
export const EXCHANGE_TO_ID: Record<ExchangeType, ExchangeIdType> = {
    upbit: 0,
    binance: 1,
} as const;

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
/**
 * 티커 압축 배열 스키마 (단일 진실의 원천)
 * 여기만 수정하면 TickerCompact 타입과 TickerCompactIndex가 자동으로 동기화됩니다
 */
export const TickerCompactSchema = {
    exchange: { index: 0, type: 0 as ExchangeIdType },
    symbol: { index: 1, type: '' as string },
    price: { index: 2, type: 0 as number },
    priceDirection: { index: 3, type: 0 as PriceDirection },
    change24h: { index: 4, type: 0 as number },
    changePrice24h: { index: 5, type: 0 as number },
    price24h: { index: 6, type: 0 as number }
} as const;

/**
 * 티커 압축 배열 인덱스 (자동 생성)
 */
export const TickerCompactIndex = {
    exchange: TickerCompactSchema.exchange.index,
    symbol: TickerCompactSchema.symbol.index,
    price: TickerCompactSchema.price.index,
    priceDirection: TickerCompactSchema.priceDirection.index,
    change24h: TickerCompactSchema.change24h.index,
    changePrice24h: TickerCompactSchema.changePrice24h.index,
    price24h: TickerCompactSchema.price24h.index
} as const;

/**
 * 티커 압축 배열 타입 (자동 생성)
 */
export type TickerCompact = [
    typeof TickerCompactSchema.exchange.type,
    typeof TickerCompactSchema.symbol.type,
    typeof TickerCompactSchema.price.type,
    typeof TickerCompactSchema.priceDirection.type,
    typeof TickerCompactSchema.change24h.type,
    typeof TickerCompactSchema.changePrice24h.type,
    typeof TickerCompactSchema.price24h.type
];


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

/** 기본 WebSocket 메시지 인터페이스 */
interface BaseWebSocketMessage {
    /** 메시지 타입 */
    t: string;
}

/** 연결 완료 메시지 */
export interface WsConnectedMessage extends BaseWebSocketMessage {
    t: 'connected';
    /** 연결 id */
    id: string;
    /** 연결 메세지 */
    message: string;
}

/** Symbol Dictionary 메시지 */
export interface WsSymbolDictMessage extends BaseWebSocketMessage {
    t: 'symbolDict';
    /** Symbol 목록 */
    data: string[];
}

/** Symbol 추가 메시지 */
export interface WsSymbolAddMessage extends BaseWebSocketMessage {
    t: 'symbolAdd';
    /** Symbol ID */
    id: number;
    /** Symbol 이름 */
    symbol: string;
}

/** 티커 메시지 */
export interface WsTickersMessage extends BaseWebSocketMessage {
    t: 'tickers';
    /** 티커 배열 (압축 형식) */
    d: TickerCompact[];
    /** 전송 시각 */
    ts: number;
}

/** 에러 메시지 */
export interface WsErrorMessage extends BaseWebSocketMessage {
    t: 'error';
    /** 에러 코드 */
    code: string;
    /** 에러 메시지 */
    message: string;
}

/** WebSocket 메시지 Union 타입 */
export type WebSocketMessage =
    | WsConnectedMessage
    | WsSymbolDictMessage
    | WsSymbolAddMessage
    | WsTickersMessage
    | WsErrorMessage;