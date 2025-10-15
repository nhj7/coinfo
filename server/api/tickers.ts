import {getTickerData} from "~~/server/store/marketData";

/**
 * 여러 거래소에 걸쳐 특정 심볼 목록의 티커 정보를 한번에 조회하는 API
 * GET /api/tickers
 *
 * @param {string} symbols - 조회할 특정 심볼 목록 (쉼표로 구분)
 *   - 형식: {exchange}:{symbol}
 *   - 예시: upbit:KRW-BTC,binance:ETH-USDT
 */
export default defineEventHandler((event) => {
    const query = getQuery(event);
    const symbolsParam = query.symbols as string | undefined;
    console.log(`/server/api/tickers.ts] ${JSON.stringify(query)}`);
    if (!symbolsParam) {
        // symbols 파라미터가 없으면 빈 배열을 반환하거나, 에러를 발생시킬 수 있습니다.
        return [];
    }

    const symbolKeys = symbolsParam.split(',').map(s => s.trim());

    const results: Ticker[] = symbolKeys
        .map(key => {
            const [exchange, symbol] = key.split(':') as [ExchangeType, string];
            // 서버 메모리에서 직접 데이터를 조회합니다.
            return getTickerData(exchange, symbol);
        })
        // 데이터가 없는 경우 (잘못된 심볼 등)를 필터링합니다.
        .filter((ticker): ticker is Ticker => ticker !== undefined);

    return results;
});
