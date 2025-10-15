import { queryTickers } from '~~/server/store/marketData';

/**
 * 쿼트별 티커 전체 조회
 * GET /api/upbit/tickers/quote/KRW?sort=volume&limit=50
 *
 * @param quote - KRW | BTC | USDT
 * @param query.sort - volume | name | change (기본값: volume)
 * @param query.limit - 개수 (선택사항, 없으면 전체)
 */
export default defineEventHandler((event) => {
  const quote = event.context.params?.quote;

  if (!quote) {
    throw createError({ statusCode: 400, statusMessage: 'Quote parameter is required.' });
  }

  const query = getQuery(event);
  const sortOption = query.sort as string || 'volume';
  const limit = query.limit ? Number(query.limit) : undefined;

  // 유효한 정렬 옵션인지 확인
  if (!['volume', 'name', 'change'].includes(sortOption)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid sort option: ${sortOption}.` });
  }

  return queryTickers('upbit', {
    quote,
    sort: sortOption as 'volume' | 'name' | 'change',
    limit,
  });
});