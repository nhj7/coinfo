import { defineNuxtPlugin } from 'nuxt/app';
import { useWebSocket } from '~/composables/useWebSocket';
export default defineNuxtPlugin(() => {
    // 테스트 환경에서는 실행하지 않음
    if (import.meta.env.TEST || process.env.VITEST) {
        return;
    }
    // Doing something with nuxtApp
    console.log('[Plugin] WebSocket connecting...');

    // 전역 WebSocket 연결 시작
    const { connect } = useWebSocket();
    connect();
})