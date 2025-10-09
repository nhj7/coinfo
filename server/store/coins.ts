/**
 * 코인 시세 데이터 스토어
 */

/**
 * 실시간 코인 시세
 * Key: "exchange:symbol" (예: "upbit:BTC-KRW")
 * Value: 가격 정보
 */
export const coinPrices = new Map<string, {
  price: number;
  volume: number;
  timestamp: number;
}>();

/**
 * 마지막 업데이트 시간
 */
export let lastUpdate = new Date();

/**
 * 마지막 업데이트 시간 갱신
 */
export function updateTimestamp() {
  lastUpdate = new Date();
}