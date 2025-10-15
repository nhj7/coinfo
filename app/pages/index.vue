<script setup lang="ts">
import { useTickerStore } from '~/stores/tickers';
import { storeToRefs } from 'pinia';
import type { Ticker } from '#shared/types';

// Pinia 스토어 사용
const tickerStore = useTickerStore();
// storeToRefs를 사용해 스토어의 상태를 반응성을 유지하며 가져옵니다.
const { items: tickers } = storeToRefs(tickerStore);

// 가격 포맷팅 (천 단위 콤마)
const formatPrice = (price: number): string => {
  return price.toLocaleString('ko-KR');
};

// 거래액 포맷팅 (억 단위)
const formatVolume = (volume: number): string => {
  const billion = volume / 100000000;
  return `${billion.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}억`;
};

// 전일대비 클래스 (상승/하락 색상)
const changeClass = (change: number) => {
  if (change > 0) return 'text-red-500';
  if (change < 0) return 'text-blue-500';
  return '';
};

// 전일대비 퍼센트 포맷팅
const formatChange = (change: number): string => {
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
};

// 김프 계산 (임시 - 나중에 바이낸스 데이터와 비교)
const calculateKimchi = (_ticker: Ticker): string => {
  // TODO: 바이낸스 데이터와 비교하여 실제 김프 계산
  return '-';
};

// 가격 변동 방향 아이콘
const directionIcon = (direction: number) => {
  if (direction > 0) return '▲';
  if (direction < 0) return '▼';
  return '-';
};
</script>

<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">실시간 시세</h1>

    <div class="overflow-x-auto">
      <table class="table table-sm table-pin-rows">
        <thead>
          <tr>
            <th class="text-left">코인명</th>
            <th class="text-right">현재가</th>
            <th class="text-right">전일대비</th>
            <th class="text-right">김프</th>
            <th class="text-right">거래액</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="tickers.length === 0">
            <td colspan="5" class="text-center">데이터를 불러오는 중입니다...</td>
          </tr>
          <tr
            v-for="ticker in tickers"
            :key="ticker.s"
            v-memo="[ticker.p, ticker.c24, ticker.d]"
            class="hover"
          >
            <!-- 코인명 -->
            <td class="text-left font-medium">
              {{ ticker.s }}
              <span
                class="ml-2"
                :class="changeClass(ticker.d)"
              >
                {{ directionIcon(ticker.d) }}
              </span>
            </td>

            <!-- 현재가 -->
            <td class="text-right font-mono">
              {{ formatPrice(ticker.p) }}
            </td>

            <!-- 전일대비 -->
            <td
              class="text-right font-mono"
              :class="changeClass(ticker.c24)"
            >
              <div>{{ formatChange(ticker.c24) }}</div>
              <div class="text-xs opacity-70">
                {{ formatPrice(Math.abs(ticker.cp24)) }}
              </div>
            </td>

            <!-- 김프 -->
            <td class="text-right">
              {{ calculateKimchi(ticker) }}
            </td>

            <!-- 거래액 -->
            <td class="text-right font-mono">
              {{ formatVolume(ticker.p24) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 연결 상태 표시 (나중에 WebSocket 상태와 연동) -->
    <div class="mt-4 text-sm text-gray-500">
      총 {{ tickers?.length ?? 0 }}개 코인
    </div>
  </div>
</template>

<style scoped>
/* 테이블 행 호버 효과 */
.table tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* 다크모드 대응 */
@media (prefers-color-scheme: dark) {
  .table tbody tr:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
}
</style>