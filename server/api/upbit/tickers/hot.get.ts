import { queryTickers } from '~~/server/store/marketData';


/**
 * HOT 리스트 처리
 * GET /api/upbit/tickers/hot?type=volume&quote=KRW&limit=20
 *
 * @param query.type - volume | gainers | losers | active (기본값: volume)
 * @param query.quote - KRW | BTC | USDT (선택사항)
 * @param query.limit - 개수 (기본값: 20)
 */
export default defineEventHandler((event) => {
  const query = getQuery(event);
  const type = (query.type as 'volume' | 'gainers' | 'losers' | 'active') || 'volume';
  const quote = query.quote as string | undefined;
  const limit = Number(query.limit) || 20;

  // 유효한 type인지 확인
  if (!['volume', 'gainers', 'losers', 'active'].includes(type)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid type: ${type}. Use volume, gainers, losers, or active.`,
    });
  }

  // queryTickers 헬퍼 함수를 사용하여 로직 단순화
  return queryTickers('upbit', {
    quote,
    sort: type,
    limit,
  });
});