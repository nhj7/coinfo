#!/bin/bash

# 스크립트 실행 중 오류가 발생하면 즉시 중단합니다.
set -e

echo "🚀 Starting deployment with Bun..."

# 1. git 리포지토리에서 최신 변경 사항을 가져옵니다.
# 'main' 브랜치를 사용하지 않는 경우, 실제 사용하는 브랜치 이름으로 변경하세요.
echo "1. Pulling latest changes from git..."
git pull

# 2. Bun을 사용하여 의존성을 설치합니다. (npm install 보다 훨씬 빠릅니다)
echo "2. Installing dependencies with Bun..."
bun install

# 3. Bun을 사용하여 Nuxt 앱을 프로덕션용으로 빌드합니다.
# --bun 플래그는 package.json의 build 스크립트가 bun으로 실행되도록 보장합니다.
echo "3. Building Nuxt app with Bun..."
bun --bun run build

# 4. PM2를 통해 무중단으로 애플리케이션을 리로드합니다.
# 'restart'는 다운타임이 발생하지만, 'reload'는 다운타임 없이 앱을 업데이트합니다.
echo "4. Reloading PM2 application..."
pm2 reload pm2.config.cjs

echo "✅ Deployment finished successfully!"