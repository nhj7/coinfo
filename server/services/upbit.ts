/**
 * 업비트 거래소 모니터링
 */
export function startUpbitMonitoring() {
  console.log('[Upbit] Starting monitoring...');

  const interval = setInterval(() => {
    console.log('[Upbit] Check:', new Date().toLocaleString());

    // TODO: 실제 업비트 API 호출
    // TODO: coinPrices 스토어 업데이트
    // TODO: WebSocket 클라이언트에게 브로드캐스트
  }, 5000);

  console.log('[Upbit] Monitoring started');

  return interval;
}

/**
 * 업비트 모니터링 중지
 */
export function stopUpbitMonitoring(interval: NodeJS.Timeout) {
  console.log('[Upbit] Stopping monitoring...');
  clearInterval(interval);
  console.log('[Upbit] Monitoring stopped');
}