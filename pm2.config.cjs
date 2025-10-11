module.exports = {
  apps: [
    {
      name: 'coinfo', // PM2에서 표시될 앱 이름
      port: 3000, // 앱이 실행될 포트
      interpreter : 'bun',
      exec_mode: 'fork', // 포크로 실행
      instances: '1', // CPU 코어 수를 사용하지 않음. 우선 1
      script: '.output/server/index.mjs ', // bun으로 실행할 Nuxt 서버 시작 파일
      args : '',
      env: {
        // 앱에서 process.env.NODE_ENV로 접근 가능
        "NODE_ENV": "production",
        // 여기에 다른 운영 환경 변수를 추가할 수 있습니다.
        // 예: "UPBIT_API_KEY": "your_api_key"
      },
      // 로그 파일 경로 설정 (선택 사항)
      // out_file: './logs/out.log',
      // error_file: './logs/error.log',
    },
  ],
};