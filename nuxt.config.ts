import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app : {
    head : {
        titleTemplate: '%s - coinfo',
        script : [
            {
                type: 'text/javascript',
                textContent : `
                (function() {
                  try {
                    const savedTheme = localStorage.getItem('daisyui-theme');
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
                    document.documentElement.setAttribute('data-theme', theme);
                    if (!savedTheme) {
                      localStorage.setItem('daisyui-theme', theme);
                    }
                  } catch (e) {
                    console.warn('Theme initialization failed:', e);
                  }
                })();
                `
            }
        ]
    }
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  devServer: {
    host: '*.*.*.*',
    port: 3000
  },
  nitro: {
    preset: 'bun',
    experimental: {
      websocket: true,
    },
    ignore: [
      '**/*.test.ts',
      '**/*.spec.ts',
    ],
  },

  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        external: (id) => {
          // 테스트 파일과 테스트 유틸리티를 빌드에서 제외
          return id.includes('.test.') ||
                 id.includes('.spec.') ||
                 id.includes('@nuxt/test-utils');
        },
      },
    },
  },
  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@pinia/nuxt',
  ]
  , css: ["~/assets/css/main.css"],

})