import {connectUpbit, disconnectUpbit} from '../services/upbit';
import {broadcastUpdate, startWebSocketServer, stopServer} from '../services/websocket';
import {closePeers} from "~~/server/routes/ws";
import {setBroadcastCallback} from "~~/server/store/marketData";

export default defineNitroPlugin((nitroApp) => {
    console.log('Nitro plugin init')
    console.log('Nitro preset:', process.env.NITRO_PRESET)
    console.log('Node env:', process.env.NODE_ENV)
    console.log('Bun version:', process.versions.bun)
    console.log('Is development:', import.meta.dev)

    // @ts-expect-error - checking nitro options
    console.log('Nitro options:', nitroApp.options)

    // 빌드 시에만 스킵
    if (import.meta.prerender) {
        console.log('[Plugin] Exchanges skipped (build/prerender mode)');
        return;
    }

    // ✅ Broadcast callback 등록 (Store → WebSocket)
    setBroadcastCallback(broadcastUpdate);

    // 거래소 연결
    connectUpbit();

    // WebSocket 서버 시작
    startWebSocketServer();

    // Nitro 훅: 서버 종료 시 WebSocket 서버도 종료
    nitroApp.hooks.hook('close', () => {
        console.log('[Plugin] Nitro close hook called, stopping WebSocket server...');
        stopServer();
        disconnectUpbit();
        closePeers();
    });

    // Nitro 훅: 개발 모드 리로드 전 정리
    if (import.meta.dev) {
        // 'dev:reload'은 공식 타입에 없으므로, @ts-expect-error로 무시
        // @ts-expect-error - 'dev:reload' is a valid hook in dev mode
        nitroApp.hooks.hook('dev:reload', () => {
            console.log('[Plugin] Nitro dev:reload hook called, stopping WebSocket server...');
            stopServer();
        });
    }
})
