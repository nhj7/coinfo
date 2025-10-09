import { defineWebSocketHandler } from 'h3';
import { encode, decode } from '@msgpack/msgpack';

/**
 * WebSocket 메시지 압축 사용 여부
 */
const USE_COMPRESSION = true;

/**
 * WebSocket 핸들러
 * msgpack을 사용하여 메시지를 압축/해제하고 에코 응답
 */
export default defineWebSocketHandler({
  /**
   * WebSocket 연결 시 호출
   */
  open(peer) {
    console.log('[WebSocket] Client connected:', peer.id);
    console.log('[ws] Peer type:', peer.constructor.name);
    console.log('[ws] Peer methods:', Object.getOwnPropertyNames(peer));

    // 연결 성공 메시지 전송 (테스트: 일반 텍스트)
    const welcomeMessage = {
      type: 'connected',
      id: peer.id,
      message: 'Connected to WebSocket server',
      timestamp: Date.now(),
    };

    try {
      // 먼저 JSON 문자열로 테스트
      const jsonMessage = JSON.stringify(welcomeMessage);
      console.log('[ws] Sending welcome message:', jsonMessage);
      peer.send(jsonMessage,{compress:USE_COMPRESSION});
      console.log('[ws] Message sent successfully');
    } catch (error) {
      console.error('[ws] Error sending message:', error);
    }
  },

  /**
   * 메시지 수신 시 호출
   */
  message(peer, message) {
    try {
      console.log('[ws] Raw message:', message);
      console.log('[ws] Message type:', typeof message);

      let data;

      // message 객체 구조 확인
      if (message.text) {
        data = message.text();
      } else if (message.rawData) {
        data = message.rawData;
      } else {
        data = message;
      }

      console.log('[WebSocket] Received message:', data);

      // 받은 메시지를 그대로 에코 (JSON 문자열로)
      const echoMessage = {
        type: 'echo',
        data: data,
        timestamp: Date.now(),
      };

      peer.send(JSON.stringify(echoMessage));

    } catch (error) {
      console.error('[WebSocket] Message processing error:', error);

      // 에러 메시지 전송
      const errorMessage = {
        type: 'error',
        message: 'Failed to process message',
        timestamp: Date.now(),
      };

      peer.send(JSON.stringify(errorMessage));
    }
  },

  /**
   * WebSocket 연결 종료 시 호출
   */
  close(peer, event) {
    console.log('[WebSocket] Client disconnected:', peer.id, 'Code:', event.code, 'Reason:', event.reason);
  },

  /**
   * 에러 발생 시 호출
   */
  error(peer, error) {
    console.error('[WebSocket] Error:', peer.id, error);
  },
});
