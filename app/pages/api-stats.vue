<script setup lang="ts">

useHead({
    title: 'API Stats'
})
// SSR을 사용하여 데이터 fetch
const { data: upbitData, refresh: refreshUpbit, error: upbitError } = await useFetch('/api/upbit/status');
const { data: websocketData, refresh: refreshWebsocket, error: websocketError } = await useFetch('/api/websocket/stats');

const isLoading = ref(false);

// 에러 메시지 계산
const error = computed(() => {
  if (upbitError.value) return `Upbit API Error: ${upbitError.value.message}`;
  if (websocketError.value) return `WebSocket API Error: ${websocketError.value.message}`;
  return null;
});

// 데이터 새로고침 함수
const refreshData = async () => {
  isLoading.value = true;

  try {
    await Promise.all([refreshUpbit(), refreshWebsocket()]);
  } catch (err) {
    console.error('Error refreshing API stats:', err);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="container mx-auto p-4">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">API Stats</h1>
      <button
        :disabled="isLoading"
        class="btn btn-primary"
        @click="refreshData"
      >
        <span v-if="isLoading" class="loading loading-spinner loading-sm"/>
        {{ isLoading ? 'Loading...' : 'Refresh' }}
      </button>
    </div>

    <div v-if="error" class="alert alert-error mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ error }}</span>
    </div>

    <div class="space-y-6">
      <!-- WebSocket Stats -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-xl">
            <Icon name="mdi:websocket" size="1.5em" />
            /api/websocket/stats
          </h2>
          <div v-if="websocketData" class="overflow-x-auto">
            <pre class="bg-base-300 p-4 rounded-lg text-sm overflow-auto max-h-96"><code>{{ JSON.stringify(websocketData, null, 2) }}</code></pre>
          </div>
          <div v-else class="flex justify-center py-8">
            <span class="loading loading-spinner loading-lg"/>
          </div>
        </div>
      </div>

      <!-- Upbit Status -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-xl">
            <Icon name="mdi:api" size="1.5em" />
            /api/upbit/status
          </h2>
          <div v-if="upbitData" class="overflow-x-auto">
            <pre class="bg-base-300 p-4 rounded-lg text-sm overflow-auto max-h-96"><code>{{ JSON.stringify(upbitData, null, 2) }}</code></pre>
          </div>
          <div v-else class="flex justify-center py-8">
            <span class="loading loading-spinner loading-lg"/>
          </div>
        </div>
      </div>



    </div>
  </div>
</template>

<style scoped>
pre {
  font-family: 'Courier New', Courier, monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
}

code {
  color: inherit;
}
</style>