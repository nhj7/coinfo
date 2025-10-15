import { getExchangeData } from '../server/store/marketData';
import type { Ticker } from '../shared/types';

/**
 * 업비트 티커 통합 API
 *
 * 지원 엔드포인트:
 * - GET /api/upbit/tickers                          # 특정 심볼 조회
 * - GET /api/upbit/tickers/hot                      # HOT 리스트
 * - GET /api/upbit/tickers/quote/{quote}            # 쿼트별 전체 조회
 *
 * @example
 * GET /api/upbit/tickers?symbols=KRW-BTC,KRW-ETH
 * GET /api/upbit/tickers/hot?type=volume&quote=KRW&limit=20
 * GET /api/upbit/tickers/quote/KRW?sort=volume&limit=50
 */
export default defineEventHandler((event) => {

    const path = event.path;
    const query = getQuery(event);
    console.log(`[...slug.ts] ${path} ${JSON.stringify(query)}`);

    // 경로 파싱: /api/upbit 이후의 경로를 추출 (쿼리 파라미터 제거)
    const pathWithoutQuery = path.split('?')[0];
    const pathSegments = pathWithoutQuery.replace('/api/upbit', '').split('/').filter(Boolean);
    console.log(`[pathSegments] ${JSON.stringify(pathSegments)}`);

    // Route 1: /api/upbit/tickers?symbols=... (특정 심볼 조회)
    if (pathSegments.length === 1 && pathSegments[0] === 'tickers') {
        return handleSymbols(query);
    }

    // Route 2: /api/upbit/tickers/hot
    if (pathSegments.length === 2 && pathSegments[0] === 'tickers' && pathSegments[1] === 'hot') {
        return handleHot(query);
    }

    // Route 3: /api/upbit/tickers/quote/{quote}
    if (pathSegments.length === 3 && pathSegments[0] === 'tickers' && pathSegments[1] === 'quote' && pathSegments[2]) {
        return handleQuote(pathSegments[2], query);
    }

    // 매칭되는 라우트 없음
    throw createError({
        statusCode: 404,
        statusMessage: 'Route not found'
    });
});

/**
 * 특정 심볼 조회
 * GET /api/upbit/tickers?symbols=KRW-BTC,KRW-ETH (특정 심볼)
 * GET /api/upbit/tickers (전체 심볼)
 */
function handleSymbols(query: Record<string, unknown>) {
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
    const symbols = symbolsParam.split(',').map(s => s.trim());
    const results: Ticker[] = [];

    for (const symbol of symbols) {
        const ticker = exchangeData.get(symbol);
        if (ticker) {
            results.push(ticker);
        }
    }

    return results;
}

/**
 * HOT 리스트 처리
 * GET /api/upbit/tickers/hot?type=volume&quote=KRW&limit=20
 *
 * @param query.type - volume | gainers | losers | active (기본값: volume)
 * @param query.quote - KRW | BTC | USDT (선택사항)
 * @param query.limit - 개수 (기본값: 20)
 */
function handleHot(query: Record<string, unknown>) {
    const type = (query.type as string) || 'volume';
    const quote = query.quote as string | undefined;
    const limit = Number(query.limit) || 20;

    const exchangeData = getExchangeData('upbit');
    if (!exchangeData) {
        return [];
    }

    let tickers = Array.from(exchangeData.values());

    // 쿼트 필터링
    if (quote) {
        tickers = filterByQuote(tickers, quote);
    }

    // 타입별 정렬 및 반환
    switch (type) {
        case 'volume':
            // 거래량 Top
            return tickers
                .sort((a, b) => b.p24 - a.p24)
                .slice(0, limit)
                .map(t => ({ ...t, hotType: 'volume' }));

        case 'gainers':
            // 상승 Top
            return tickers
                .filter(t => t.c24 > 0)
                .sort((a, b) => b.c24 - a.c24)
                .slice(0, limit)
                .map(t => ({ ...t, hotType: 'gainer' }));

        case 'losers':
            // 하락 Top
            return tickers
                .filter(t => t.c24 < 0)
                .sort((a, b) => a.c24 - b.c24)
                .slice(0, limit)
                .map(t => ({ ...t, hotType: 'loser' }));

        case 'active':
            // 활발 Top (거래량 + 등락률 복합 점수)
            return tickers
                .map(t => ({
                    ...t,
                    activityScore: calculateActivityScore(t, tickers),
                    hotType: 'active'
                }))
                .sort((a, b) => b.activityScore - a.activityScore)
                .slice(0, limit);

        default:
            throw createError({
                statusCode: 400,
                statusMessage: `Invalid type: ${type}. Use volume, gainers, losers, or active.`
            });
    }
}

/**
 * 쿼트별 티커 전체 조회
 * GET /api/upbit/tickers/quote/KRW?sort=volume&limit=50
 *
 * @param quote - KRW | BTC | USDT
 * @param query - 쿼리 파라미터 객체
 * @param query.sort - volume | name | change (기본값: volume)
 * @param query.limit - 개수 (선택사항, 없으면 전체)
 */
function handleQuote(quote: string, query: Record<string, unknown>) {
    const sort = (query.sort as string) || 'volume';
    const limit = query.limit ? Number(query.limit) : undefined;

    const exchangeData = getExchangeData('upbit');
    if (!exchangeData) {
        return [];
    }

    let tickers = Array.from(exchangeData.values());

    // 쿼트 필터링
    tickers = filterByQuote(tickers, quote.toUpperCase());

    // 정렬
    switch (sort) {
        case 'volume':
            tickers.sort((a, b) => b.p24 - a.p24);
            break;
        case 'name':
            tickers.sort((a, b) => a.s.localeCompare(b.s));
            break;
        case 'change':
            tickers.sort((a, b) => b.c24 - a.c24);
            break;
        default:
            throw createError({
                statusCode: 400,
                statusMessage: `Invalid sort: ${sort}. Use volume, name, or change.`
            });
    }

    // 개수 제한
    if (limit && limit > 0) {
        tickers = tickers.slice(0, limit);
    }

    return tickers;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 쿼트 통화별 필터링
 */
function filterByQuote(tickers: Ticker[], quote: string): Ticker[] {
    return tickers.filter(ticker => {
        const [quoteCurrency] = ticker.s.split('-');
        return quoteCurrency === quote.toUpperCase();
    });
}

/**
 * 활동 점수 계산 (Binance 방식)
 * 거래량 60% + 등락률 절대값 40%
 */
function calculateActivityScore(ticker: Ticker, allTickers: Ticker[]): number {
    // 거래량 백분위 계산 (0-100)
    const volumePercentile = getPercentile(
        ticker.p24,
        allTickers.map(t => t.p24)
    );

    // 등락률 절대값 백분위 계산 (0-100)
    const changePercentile = getPercentile(
        Math.abs(ticker.c24),
        allTickers.map(t => Math.abs(t.c24))
    );

    // 가중 평균: 거래량 60%, 변동성 40%
    return (volumePercentile * 0.6) + (changePercentile * 0.4);
}

/**
 * 백분위 계산 헬퍼
 * @param value - 대상 값
 * @param values - 전체 값 배열
 * @returns 백분위 점수 (0-100)
 */
function getPercentile(value: number, values: number[]): number {
    if (values.length === 0) return 0;

    const sorted = values.slice().sort((a, b) => a - b);
    const index = sorted.findIndex(v => v >= value);

    if (index === -1) return 100;
    if (index === 0) return 0;

    return (index / sorted.length) * 100;
}