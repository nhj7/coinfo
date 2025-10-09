import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app : {
    head : {
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
    devProxy: {
      '/ws': {
        target: 'ws://localhost:3003/ws',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  routeRules: {
    '/ws': { proxy: 'http://localhost:3003/ws' },
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        // WebSocket 프록시: ws://localhost:3000/ws -> ws://localhost:3003/ws
        '/ws': {
          target: 'ws://localhost:3003',
          ws: true,
          changeOrigin: true,
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
  ]
  , css: ["~/assets/css/main.css"],
})