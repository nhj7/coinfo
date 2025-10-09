// IP 관련 키워드
const IP_KEYWORDS = ['ip', 'address', 'remote', 'host', 'addr'];

// 재귀적으로 객체 탐색하여 IP 관련 속성 찾기
function findIPRelatedProperties(obj: any, path = '', depth = 0, maxDepth = 5, visited = new Set()): void {
  // 최대 깊이 제한
  if (depth > maxDepth) return;

  // 순환 참조 방지
  if (obj && typeof obj === 'object') {
    if (visited.has(obj)) return;
    visited.add(obj);
  }

  // null, undefined, primitive 타입 처리
  if (obj === null || obj === undefined) return;
  if (typeof obj !== 'object') return;

  // 객체의 모든 키 탐색
  try {
    const keys = Object.keys(obj);
    for (const key of keys) {
      const currentPath = path ? `${path}.${key}` : key;
      const value = obj[key];

      // IP 관련 키워드가 포함된 속성 출력
      const keyLower = key.toLowerCase();
      if (IP_KEYWORDS.some(keyword => keyLower.includes(keyword))) {
        console.log(`[IP-RELATED] ${currentPath}:`, value);
      }

      // 재귀 탐색
      if (value && typeof value === 'object') {
        findIPRelatedProperties(value, currentPath, depth + 1, maxDepth, visited);
      }
    }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // 접근 불가능한 속성 무시
  }
}

export default defineEventHandler((event) => {
  console.log("api/time event", Date.now());

  const socket = event.node.req.socket;
  const req = event.node.req;

  console.log('=== Nuxt Dev Server IP Detection ===');

  // 개발 서버에서 IP 정보 찾기
  console.log('socket.remoteAddress:', socket?.remoteAddress);

  // req 객체의 숨겨진 속성들 확인
  // @ts-expect-error
  console.log('req.ip:', req.ip);
  // @ts-expect-error
  console.log('req.connection:', req.connection?.remoteAddress);
  // @ts-expect-error
  console.log('req.info:', req.info);
  // @ts-expect-error
  console.log('req.requestContext:', req.requestContext);

  // event 자체에서 IP 찾기
  // @ts-expect-error
  console.log('event.ip:', event.ip);
  // @ts-expect-error
  console.log('event.clientIP:', event.clientIP);

  // 서버 객체 분석
  const server = req.socket.server;
  if (server) {
    console.log('Server constructor:', server.constructor.name);
    console.log('Server type:', typeof server);

    // Bun 서버인지 확인
    // @ts-expect-error
    //console.log('Is Bun.serve?:', server.constructor.name === 'Server' && globalThis.Bun);

    // Bun 전역 객체 확인
    // @ts-expect-error
    console.log('globalThis.Bun exists?:', typeof globalThis.Bun !== 'undefined');

    // 서버가 Bun.serve로 생성된 경우 접근 가능한 속성
    // @ts-expect-error
    console.log('server.development?:', server.development);
    // @ts-expect-error
    console.log('server.hostname?:', server.hostname);
    // @ts-expect-error
    console.log('server.port?:', server.port);
    // @ts-expect-error
    console.log('server.pendingRequests?:', server.pendingRequests);
  }

  console.log('======================================');

  return {
    serverTime: Date.now()
  }
})