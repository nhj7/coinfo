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
        @click="connect"
        :disabled="connected"
      >
        Connect
      </button>
      <button
        class="btn btn-error"
        @click="disconnect"
        :disabled="!connected"
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
        @click="sendMessage"
        :disabled="!connected"
      >
        Send
      </button>
    </div>

    <div class="card bg-base-200 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Messages</h2>
        <div class="overflow-y-auto max-h-96">
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
import { ref, onUnmounted } from 'vue';

const ws = ref<WebSocket | null>(null);
const connected = ref(false);
const message = ref('');
const messages = ref<{ time: string; text: string }[]>([]);

const connect = () => {
  // WebSocket URL (개발: ws://localhost:3000, 운영: wss://...)
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'http:';
  const wsUrl = `${protocol}//${window.location.hostname}:3000/ws`;

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
    const decoded = decode(new Uint8Array(event.data));
    console.log('ws.onmessage - decoded:', decoded);
    addMessage(`Server: ${JSON.stringify(decoded)}`);
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
    ws.value.send(message.value);
    addMessage(`You: ${message.value}`);
    message.value = '';
  }
};

const addMessage = (text: string) => {
  messages.value.push({
    time: new Date().toLocaleTimeString(),
    text
  });
};

// 컴포넌트 언마운트 시 연결 종료
onUnmounted(() => {
  disconnect();
});
</script>