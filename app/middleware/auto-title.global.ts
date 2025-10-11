export default defineNuxtRouteMiddleware((to) => {
  //console.log("defineNuxtRouteMiddleware")
  const pathSegments = to.path.split('/').filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1] || '';

  // 루트 경로(/)인 경우 타이틀만 "coinfo"로 설정
  if (!lastSegment) {
    useHead({ title: null, titleTemplate: 'coinfo' });
    return;
  }

  // 특정 단어에 대한 매핑 정의
  const wordMap: Record<string, string> = {
    'api': 'API',
    'websocket': 'WebSocket',
    'json': 'JSON',
    'html': 'HTML',
    'css': 'CSS',
    'js': 'JavaScript',
    'url': 'URL',
    'id': 'ID',
    'uuid': 'UUID',
    'http': 'HTTP',
    'https': 'HTTPS',
    'stats': 'Stats',
    'test': 'Test',
    'home': 'Home',
    'about': 'About',
  };

  // kebab-case를 분리하고 매핑 또는 Title Case 적용
  const title = lastSegment
    .split('-')
    .map(word => {
      const lowerWord = word.toLowerCase();
      // 매핑에 있으면 매핑된 값 사용
      if (wordMap[lowerWord]) {
        return wordMap[lowerWord];
      }
      // 매핑에 없으면 첫 글자만 대문자
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

  useHead({ title: title, titleTemplate: '%s - coinfo' });
})