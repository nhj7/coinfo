import { handleMessage, handleOpen, handleClose, type AnyWebSocket } from '~~/server/services/websocket';

/**
 * 개발 모드에서 HMR 발생 시 기존 연결을 추적하고 종료하기 위한 Set
 */
const activePeers = new Set<AnyWebSocket>();

export function closePeers(){
    console.log(`[HMR] Disposing WebSocket handler. Closing active connections... ${activePeers.size}`);
    activePeers.forEach(peer => {
        // 1012: Service Restart - 클라이언트에게 서버가 재시작됨을 알림
        peer.close(1012, 'Server restarting due to file change');
    });
    activePeers.clear();
}


/**
 * WebSocket 핸들러
 */
export default defineWebSocketHandler({
  /**
   * WebSocket 연결 시 호출
   */
  open(peer) {
    // HMR을 위해 활성 연결 추적
    activePeers.add(peer);
    //console.log('[WebSocket] Client connected:', peer.id);
    handleOpen(peer, peer.id, peer.remoteAddress);
  },
    
    
  /**
   * 메시지 수신 시 호출
   */
  message(peer, message) {
    try {
      // message는 string 또는 Buffer 타입이며, handleMessage 함수가 이를 처리합니다.
      //console.log('[ws] Received message from client:', peer.id);
      const data = message.text();
      handleMessage(peer, data);
    } catch (error) {
      console.error('[WebSocket] Message processing error:', error);
    }
  },

  /**
   * WebSocket 연결 종료 시 호출 (클라이언트 또는 서버에 의해)
   */
  close(peer, event) {
    // HMR 추적에서 제거하고, 서비스에서도 정리
    activePeers.delete(peer);
    handleClose(peer, peer.id);
    console.log('[WebSocket] Client disconnected:', peer.id, 'Code:', event.code, 'Reason:', event.reason);
  },

  /**
   * 에러 발생 시 호출
   */
  error(peer, error) {
    console.error('[WebSocket] Error:', peer.id, error);
  }
  
});
