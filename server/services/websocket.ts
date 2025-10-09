
// @ts-expect-error - Bun types may not be available in all environments
import type { ServerWebSocket } from 'bun';
import { encode } from '@msgpack/msgpack';

/**
 * 서버 인스턴스를 globalThis에 저장하기 위한 고유 키
 * Nitro close 훅과 함께 사용하여 핫 리로드 시 서버 정리
 */
const GLOBAL_SERVER_KEY = '__COINFO_WEBSOCKET_SERVER__';

/**
 * globalThis에서 서버 인스턴스 가져오기
 */
function getServerInstance(): any {
  // @ts-expect-error - globalThis에 커스텀 속성 추가
  return globalThis[GLOBAL_SERVER_KEY] || null;
}

/**
 * globalThis에 서버 인스턴스 저장
 */
function setServerInstance(instance: any): void {
  // @ts-expect-error - globalThis에 커스텀 속성 추가
  globalThis[GLOBAL_SERVER_KEY] = instance;
}

const PORT = 3003;
/**
 * 클라이언트 연결 맵
 */
export const clients = new Map<ServerWebSocket<ClientData>, ClientData>();

export interface ClientData {
    id: string;
    subscriptions: Set<string>; // "exchange:symbol" 형식
}

/**
 * WebSocket 서버 시작 함수
 */
export function startWebSocketServer(): void {
    console.log('[WebSocket] Starting Bun WebSocket server...')
    console.log('[WebSocket] prerender:', import.meta.prerender)
    console.log('[WebSocket] dev:', import.meta.dev)

    // 빌드 시에만 스킵 (개발/운영 모두 실행)
    if (import.meta.prerender) {
        console.log('[WebSocket] Server skipped (build/prerender mode)')
        return
    }

    // Bun 런타임 체크
    // @ts-expect-error - Bun specific option
    if (typeof globalThis.Bun === 'undefined') {
        // @ts-expect-error - Bun specific option
        console.error('[WebSocket] Bun runtime not available', globalThis.Bun, Bun);
        return
    }

    // 기존 서버가 실행 중이면 먼저 종료 (핫 리로드 대응)
    const existingServer = getServerInstance();

    if (existingServer) {
        console.log('[WebSocket] Found existing server, stopping for hot reload....');
        try {
            existingServer.stop();
            setServerInstance(null);
            console.log('[WebSocket] Existing server stopped successfully');
        } catch (error) {
            console.error('[WebSocket] Error stopping existing server:', error);
        }
    }

    console.log(`[WebSocket] Starting server on port ${PORT}...`)
    // @ts-expect-error - Bun specific option
    const serverInstance = globalThis.Bun.serve({
        port: PORT,

        compression: true,
        // @ts-expect-error - Bun specific option
        fetch(req, server) {
            const url = new URL(req.url);
            const pathParts = url.pathname.split('/').filter(Boolean);

            // WebSocket 업그레이드
            if (url.pathname === '/ws') {
                const upgraded = server.upgrade(req, {
                    data: {
                        id: crypto.randomUUID(),
                        subscriptions: new Set<string>(),
                    },
                });

                if (!upgraded) {
                    return new Response('WebSocket upgrade failed', { status: 400 });
                }

                return undefined;
            }

            // Health check
            if (url.pathname === '/health') {
                return new Response('OK', { status: 200 });
            }



            return new Response('Not Found', { status: 404 });
        },

        websocket: {
            open(ws: ServerWebSocket): void {
                console.log("open");
                handleOpen(ws);
            },

            message(ws: ServerWebSocket, message: object): void {
                console.log("message");
                //handleMessage(ws, message);
                send(ws,message);
            },

            close(ws: ServerWebSocket): void {
                console.log("3");
            },
        },

    });

    // globalThis에 서버 인스턴스 저장
    setServerInstance(serverInstance);

    console.log(`[WebSocket] ✅ Server started successfully on port ${PORT}`)
    console.log(`[WebSocket] WebSocket endpoint: ws://localhost:${PORT}/ws`)
    console.log(`[WebSocket] Health check: http://localhost:${PORT}/health`)
}

/**
 * WebSocket 메시지 압축 사용 여부
 */
const USE_COMPRESSION = true;

/** WebSocket 메시지 전송 래퍼 함수 */
function send(ws: ServerWebSocket<ClientData>, data: object): void {
    const binaryData = encode(data);
    ws.send(binaryData, USE_COMPRESSION);
}

/**
 * WebSocket 연결 핸들러
 */
function handleOpen(ws: ServerWebSocket<ClientData>): void {
    console.log(`[Server] Client connected: ${ws.data.id}`);
    clients.set(ws, ws.data);

    // PM2 메트릭 업데이트
    //updateActiveConnections(clients.size);

    send(ws, {
        type: 'connected',
        id: ws.data.id,
        message: 'Connected to coin WebSocket server',
    });
}

/**
 * WebSocket 메시지 핸들러
 */
export function handleMessage(ws: ServerWebSocket<ClientData>, message: string | Buffer): void {
    try {
        const data = JSON.parse(message.toString());
        console.log("handleMessage", data);

        switch (data.type) {
            case 'subscribe':
                console.log("subscribe");
                //handleSubscribe(ws, data.exchange, data.symbols);
                break;
            case 'unsubscribe':
                console.log("unsubscribe");
                //handleUnsubscribe(ws, data.exchange, data.symbols);
                break;
            case 'snapshot':
                console.log("snapshot");
                //handleSnapshot(ws, data.exchange);
                break;
            case 'ping':
                send(ws, { type: 'pong' });
                break;
            default:
                send(ws, {
                    type: 'error',
                    message: 'Unknown message type',
                });
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        send(ws, {
            type: 'error',
            message: 'Invalid JSON',
        });
    }
}

/**
 * WebSocket 연결 종료 핸들러
 */
export function handleClose(ws: ServerWebSocket<ClientData>): void {
    console.log(`[Server] Client disconnected: ${ws.data.id}`);

    // 역인덱스에서 제거
    // ws.data.subscriptions.forEach(symbolKey => {
    //     const subscribers = symbolSubscribers.get(symbolKey);
    //
    //     if (subscribers) {
    //         subscribers.delete(ws);
    //         // 구독자가 없으면 맵에서 제거
    //         if (subscribers.size === 0) {
    //             symbolSubscribers.delete(symbolKey);
    //         }
    //     }
    // });
    //
    clients.delete(ws);

    // PM2 메트릭 업데이트
    //updateActiveConnections(clients.size);
}

/**
 * 서버 종료
 */
export function stopServer(): void {
    const serverInstance = getServerInstance();
    if (serverInstance) {
        console.log('[WebSocket] Stopping server...');
        try {
            serverInstance.stop();
            setServerInstance(null);
            console.log('[WebSocket] Server stopped successfully');
        } catch (error) {
            console.error('[WebSocket] Error stopping server:', error);
        }
    }
}

// 프로세스 종료 시그널 처리
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
    console.log(`\n🛑 ${signal} Shutting down gracefully...`);
    stopServer();
    process.exit(0);
};