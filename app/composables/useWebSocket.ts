import { decode } from '@msgpack/msgpack';
import { readonly } from 'vue';
/**
 * WebSocket의 상태를 저장할 객체 타입
 */
interface WebSocketState {
    ws: WebSocket | null;
    connected: boolean;
    messages: { time: string; text: string }[];
}

/**
 * WebSocket 연결 및 상태 관리를 위한 Composable
 */
export const useWebSocket = () => {
    const state = useState<WebSocketState>('webSocketState', () => ({
        ws: null,
        connected: false,
        messages: [],
    }));

    const addMessage = (text: string) => {
        console.log("addMessage", text);
        state.value.messages.push({
            time: new Date().toLocaleTimeString(),
            text,
        });
        // 메시지 배열의 최대 길이를 200으로 제한
        if (state.value.messages.length > 200) {
            state.value.messages.shift();
        }
    };

    const connect = () => {
        // 이미 연결되어 있거나 연결 시도 중이면 중복 실행 방지
        if (state.value.ws) return;

        // 현재 페이지 프로토콜에 따라 ws 또는 wss를 동적으로 선택합니다.
        const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsUrl = `${wsProtocol}://${window.location.host}/ws`;
        const ws = new WebSocket(wsUrl);
        ws.binaryType = 'arraybuffer';

        ws.onopen = () => {
            console.log('[useWebSocket] Connected!');
            state.value.connected = true;
            state.value.ws = ws;
            addMessage('Server: Connected to WebSocket.');
        };

        ws.onmessage = (event: MessageEvent) => {
            try {
                const data = decode(event.data);
                const messageText = JSON.stringify(data);
                addMessage(`Server: ${messageText}`);
            } catch (error) {
                console.error('[useWebSocket] Error decoding message:', error);
                addMessage(`Error: Failed to decode message. ${event.data}`);
            }
        };

        ws.onclose = () => {
            console.log('[useWebSocket] Disconnected.');
            state.value.connected = false;
            state.value.ws = null;
            addMessage('Server: Disconnected from WebSocket.');
        };

        ws.onerror = (error) => {
            console.error('[useWebSocket] Error:', error);
            addMessage('Server: WebSocket error occurred.');
        };
    };

    const sendMessage = (message: object) => {
        if (state.value.ws && state.value.connected) {
            const messageString = JSON.stringify(message);
            state.value.ws.send(messageString);
            addMessage(`You: ${messageString}`);
        } else {
            addMessage('Error: Not connected.');
        }
    };

    return {
        state: readonly(state), // 컴포넌트에서 직접 상태를 변경하지 못하도록 readonly로 감싸서 반환
        connect,
        sendMessage,
    };
};