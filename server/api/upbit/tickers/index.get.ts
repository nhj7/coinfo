import { getExchangeData } from '~~/server/store/marketData';
import type { Ticker } from '~~/shared/types';

/**
 * 특정 심볼 또는 전체 티커 조회
 * GET /api/upbit/tickers?symbols=KRW-BTC,KRW-ETH (특정 심볼)
 * GET /api/upbit/tickers (전체 심볼)
 */
export default defineEventHandler((event) => {
    const query = getQuery(event);
    const symbolsParam = query.symbols as string | undefined;

    const exchangeData = getExchangeData('upbit');
    if (!exchangeData) {
        return [];
    }

    // symbols 파라미터가 없으면 전체 심볼 리턴
    if (!symbolsParam) {
        return Array.from(exchangeData.values());
    }

    // symbols 파라미터가 있으면 지정된 심볼만 리턴
    const symbols = symbolsParam.split(',').map(s => s.trim()).filter(Boolean);
    const results: Ticker[] = [];

    for (const symbol of symbols) {
        const ticker = exchangeData.get(symbol);
        if (ticker) {
            results.push(ticker);
        }
    }

    return results;
});
