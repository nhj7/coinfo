export default defineEventHandler((event) => {
  const headers = event.node.req.headers;
  const socket = event.node.req.socket;

  // IP 추출 (우선순위: 헤더 > socket)
  const ip = headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
             headers['x-real-ip']?.toString() ||
             socket?.remoteAddress ||
             'unknown';

  const method = event.node.req.method;
  const url = event.node.req.url;
  const timestamp = new Date().toLocaleString();

  // 서버 콘솔에 로깅
  console.log(`[middleware.logging][${timestamp}] ${method} ${url} - IP: ${ip}`);
});