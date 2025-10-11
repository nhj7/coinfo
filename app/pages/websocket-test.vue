<template>
  <div class="container mx-auto p-8">
    <h1 class="text-3xl font-bold mb-6">WebSocket Test</h1>

    <div class="mb-4">
      <div class="badge" :class="connected ? 'badge-success' : 'badge-error'">
        {{ connected ? 'Connected' : 'Disconnected' }}
      </div>
    </div>

    <div class="mb-4">
      <button
        class="btn btn-primary mr-2"
        :disabled="connected"
        @click="connect"
      >
        Connect
      </button>
      <button
        class="btn btn-error"
        :disabled="!connected"
        @click="disconnect"
      >
        Disconnect
      </button>
    </div>

    <div class="mb-4">
      <input
        v-model="message"
        type="text"
        placeholder="Type a message..."
        class="input input-bordered w-full max-w-xs mr-2"
        @keyup.enter="sendMessage"
      >
      <button
        class="btn btn-secondary"
        :disabled="!connected"
        @click="sendMessage"
      >
        Send Echo
      </button>
      <button
        class="btn btn-info ml-2"
        :disabled="!connected"
        @click="sendSubscriptionTest"
      >
        Subscribe Test
      </button>
    </div>

    <div class="mb-4 p-4 border rounded-lg bg-base-100">
      <div class="font-bold mb-2">Subscription Symbols</div>
      <div class="flex items-center gap-6">
        <div v-for="symbol in availableSymbols" :key="symbol" class="form-control">
          <label class="label cursor-pointer gap-2">
            <span class="label-text">{{ symbol }}</span>
            <input
              v-model="selectedSymbols"
              type="checkbox"
              :value="symbol"
              class="checkbox checkbox-primary"
            />
          </label>
        </div>
      </div>
    </div>

    <div class="card bg-base-200 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Messages</h2>
        <div ref="messageContainer" class="overflow-y-auto max-h-96 bg-base-100 rounded-lg p-4">
          <div v-for="(msg, index) in messages" :key="index" class="mb-2">
            <span class="text-sm opacity-60">{{ msg.time }}</span> - {{ msg.text }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { decode } from '@msgpack/msgpack';

const ws = ref<WebSocket | null>(null);
const connected = ref(false);
const message = ref('');
const messages = ref<{ time: string; text: string }[]>([]);
const messageContainer = ref<HTMLDivElement | null>(null);
const availableSymbols = ref(['KRW-BTC', 'KRW-ETH', 'KRW-XRP']);
const selectedSymbols = ref(['KRW-BTC']); // 기본적으로 BTC 선택

const connect = () => {
  // WebSocket URL (개발: ws://localhost:3000, 운영: wss://...)
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'http:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  console.log('Connecting to:', wsUrl);

  ws.value = new WebSocket(wsUrl);

  // MessagePack 바이너리 데이터를 위해 ArrayBuffer로 설정
  ws.value.binaryType = 'arraybuffer';

  console.log('WebSocket created, readyState:', ws.value.readyState);
  // 0: CONNECTING, 1: OPEN, 2: CLOSING, 3: CLOSED

  // 상태 체크
  setTimeout(() => {
    console.log('After 1s, readyState:', ws.value?.readyState);
  }, 1000);

  setTimeout(() => {
    console.log('After 3s, readyState:', ws.value?.readyState);
  }, 3000);

  ws.value.addEventListener('open', (event) => {
    console.log('ws.onopen (addEventListener)', event);
    console.log('WebSocket readyState after open:', ws.value?.readyState);
    connected.value = true;
    addMessage('Connected to WebSocket server');

    // 연결 확인용 메시지 전송
    setTimeout(() => {
      if (ws.value?.readyState === 1) {
        console.log('Sending test message...');
        ws.value.send('Hello from client!');
      }
    }, 100);
  });

  ws.value.addEventListener('message', (event) => {
    console.log('ws.onmessage - event.data type:', typeof event.data, event.data);

    // binaryType이 'arraybuffer'이므로 바로 디코드 가능
    const json = decode(new Uint8Array(event.data)) as WebSocketMessage;
    console.log('ws.onmessage - json:', json);
    if (json.t === "tickers") {
      // json.d가 배열이므로 각 요소를 순회하며 로그를 남깁니다.
      json.d.forEach((ticker, index) => {
        console.log(`Server (Ticker ${index}): ${ticker[TickerCompactIndex.symbol]}`);
      });

    }
    addMessage(`Server: ${JSON.stringify(json)}`);
  });

  ws.value.addEventListener('close', (event) => {
    console.log('ws.onclose (addEventListener)', event);
    connected.value = false;
    addMessage(`Disconnected: ${event.code} - ${event.reason}`);
  });

  ws.value.addEventListener('error', (error) => {
    console.error('ws.onerror (addEventListener)', error);
    addMessage('Error occurred - check console');
  });
};

const disconnect = () => {
  if (ws.value) {
    ws.value.close();
    ws.value = null;
  }
};

const sendMessage = () => {
  if (ws.value && message.value.trim()) {
    // 서버가 JSON 형식을 기대하므로, echo 타입으로 감싸서 전송
    const echoMessage = {
      type: 'echo',
      payload: message.value,
    };
    const messageString = JSON.stringify(echoMessage);
    ws.value.send(messageString);
    addMessage(`You (echo): ${message.value}`);
    message.value = '';
  }
};

const sendSubscriptionTest = () => {
  if (ws.value && connected.value) {
    if (selectedSymbols.value.length === 0) {
      addMessage('Error: Please select at least one symbol to subscribe.');
      return;
    }

    const subscriptionMessage = {
      type: 'subscribe',
      exchange: 'upbit',
      // 선택된 심볼 목록을 사용
      symbols: selectedSymbols.value,
    };
    const messageString = JSON.stringify(subscriptionMessage);
    ws.value.send(messageString);
    addMessage(`You (subscribe): ${messageString}`);
  }
};

const addMessage = (text: string) => {
  messages.value.push({
    time: new Date().toLocaleTimeString(),
    text,
  });

  // 메시지 배열의 최대 길이를 200으로 제한합니다.
  if (messages.value.length > 200) {
    messages.value.shift(); // 가장 오래된 메시지를 제거합니다.
  }

  // DOM이 업데이트된 후 스크롤을 맨 아래로 이동
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
  });
};

// 컴포넌트 언마운트 시 연결 종료
onUnmounted(() => {
  disconnect();
});
</script>