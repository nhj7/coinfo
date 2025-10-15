import { defineNuxtPlugin } from '#app';
import { useTickerStore } from '~/stores/tickers';
import type { Ticker } from '#shared/types';

/**
 * 애플리케이션 초기화 시 서버로부터 Ticker 데이터를 가져와 Pinia 스토어에 저장하는 플러그인입니다.
 * 이 로직은 서버 사이드 렌더링 시 한 번 실행되며,
 * 클라이언트에서는 서버로부터 전달받은 상태를 그대로 이어받습니다.
 */
export default defineNuxtPlugin(async (nuxtApp) => {
    // 서버 사이드에서만 데이터를 가져옵니다.
    // Nuxt는 서버에서 변경된 Pinia 상태를 자동으로 직렬화하여 클라이언트로 전달합니다.
    if (import.meta.server) {
        // 플러그인 컨텍스트에서 스토어를 사용할 때는 nuxtApp.$pinia를 전달해야 합니다.
        const tickerStore = useTickerStore(nuxtApp.$pinia);
        try {
            console.log('[Plugin:init-data] Fetching initial tickers on server...');
            const tickers = await $fetch<Ticker[]>('/api/upbit/tickers/hot?type=volume&limit=20&quote=KRW');

            // 가져온 데이터로 스토어 상태를 설정합니다.
            tickerStore.setTickers(tickers);
            console.log(`[Plugin:init-data] Successfully set ${tickers.length} tickers in store on server.`);
        } catch (error) {
            console.error('[Plugin:init-data] Failed to fetch initial tickers:', error);
            // 에러 발생 시 스토어를 빈 배열로 설정할 수 있습니다.
            tickerStore.setTickers([]);
        }
    }
});