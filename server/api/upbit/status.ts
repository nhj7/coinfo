import { getUpbitStatus } from '../../services/upbit';

/**
 * 업비트 WebSocket 상태 조회 API
 * GET /api/upbit/status
 */
export default defineEventHandler(() => {
  return getUpbitStatus();
});