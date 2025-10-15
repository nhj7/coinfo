import { defineVitestConfig } from '@nuxt/test-utils/config';

export default defineVitestConfig({
    test: {
        globals: true,
        environment: 'nuxt',
    },
    resolve: {
        alias: {
            // 클라이언트 플러그인을 테스트 환경에서 무시
            '~/plugins/websocket.client': '/dev/null',
        },
    },
});