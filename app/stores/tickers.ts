import { defineStore } from 'pinia';
import type { Ticker } from '#shared/types';

/**
 * 클라이언트 사이드 Ticker 데이터 전역 저장소 (Pinia)
 *
 * 이 스토어는 서버로부터 받은 티커 목록을 저장하고 관리합니다.
 * 여러 컴포넌트에서 동일한 데이터에 접근하고,
 * 향후 WebSocket을 통한 실시간 업데이트를 중앙에서 처리하는 역할을 합니다.
 */
export const useTickerStore = defineStore('tickers', {
    /**
     * State: 티커 목록을 저장하는 배열
     */
    state: () => ({
        items: [] as Ticker[],
    }),

    /**
     * Actions: 상태를 변경하는 메서드
     */
    actions: {
        /**
         * 티커 목록 전체를 새로운 데이터로 교체합니다.
         * 페이지 진입 시 초기 데이터 로딩에 사용됩니다.
         * @param tickers - 새로운 Ticker 배열
         */
        setTickers(tickers: Ticker[]) {
            this.items = tickers;
        },
    },
});