import { defineNuxtPlugin } from 'nuxt/app';
import { useWebSocket } from '~/composables/useWebSocket';
export default defineNuxtPlugin(() => {
    // Doing something with nuxtApp
    console.log('[Plugin] WebSocket connecting...');

    // 전역 WebSocket 연결 시작
    const { connect } = useWebSocket();
    connect();
})