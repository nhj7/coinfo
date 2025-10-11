import {getWebSocketStats} from '~~/server/services/websocket';

/**
 * WebSocket 서버 상태 조회 API
 * GET /api/websocket/stats
 */
export default defineEventHandler(async () => {
    try {
        return await getWebSocketStats();
    } catch (error) {
        console.error('[API] Error fetching WebSocket stats:', error);
        return {
            error: 'Failed to fetch WebSocket stats',
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
});