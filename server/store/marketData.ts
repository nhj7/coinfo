import type {
    MarketDataStore,
    MarketInfoStore,
    ExchangeType,
    Ticker,
    MarketInfo,
    ExchangeData
} from "#shared/types";
/**
 * 전역 마켓 데이터 저장소
 * 구조: 거래소 > 심볼 > 시세 데이터
 */
export const marketDataStore: MarketDataStore = new Map();

/**
 * 전역 마켓 정보 저장소
 * 구조: 거래소 > 마켓 정보 배열
 */
export const marketInfoStore: MarketInfoStore = new Map();

/**
 * 브로드캐스트 콜백 (순환 참조 방지를 위해 동적 설정)
 */
let broadcastCallback: ((exchange: ExchangeType, symbol: string) => void) | null = null;

/**
 * 브로드캐스트 콜백 설정
 */
export function setBroadcastCallback(
  callback: (exchange: ExchangeType, symbol: string) => void
): void {
  broadcastCallback = callback;
}

/**
 * 거래소의 마켓 정보 업데이트
 */
export function setMarketInfo(
  exchange: ExchangeType,
  markets: MarketInfo[]
): void {
  marketInfoStore.set(exchange, markets);
}

/**
 * 특정 거래소의 마켓 정보 조회
 */
export function getMarketInfo(exchange: ExchangeType): MarketInfo[] | undefined {
  return marketInfoStore.get(exchange);
}

/**
 * 거래소의 심볼 데이터 업데이트
 */
export function updateTickerData(
  exchange: ExchangeType,
  symbol: string,
  data: Ticker
): void {
  let exchangeData = marketDataStore.get(exchange);

  if (!exchangeData) {
    exchangeData = new Map();
    marketDataStore.set(exchange, exchangeData);
  }

  exchangeData.set(symbol, data);

  // 브로드캐스트 트리거
  if (broadcastCallback) {
    broadcastCallback(exchange, symbol);
  }
}

/**
 * 특정 거래소의 심볼 데이터 조회
 */
export function getTickerData(
  exchange: ExchangeType,
  symbol: string
): Ticker | undefined {
  return marketDataStore.get(exchange)?.get(symbol);
}

/**
 * 특정 거래소의 모든 데이터 조회
 */
export function getExchangeData(exchange: ExchangeType): ExchangeData | undefined {
  //console.log('[MarketData] getExchangeData:', marketDataStore);
  return marketDataStore.get(exchange);
}

/**
 * 전체 마켓 데이터 조회
 */
export function getAllMarketData(): MarketDataStore {
  return marketDataStore;
}

/**
 * 특정 거래소 데이터 초기화
 */
export function clearExchangeData(exchange: ExchangeType): void {
  marketDataStore.delete(exchange);
}
