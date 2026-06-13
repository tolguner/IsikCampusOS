import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8080'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    // Uygulama tek giriş noktası olan API Gateway (8080) üzerinden sunulur.
    // Gateway, isteği frontend:5173'e proxy'ler; bu yüzden tüm host başlıklarına izin verilir.
    allowedHosts: true,
    // HMR websocket'i de gateway (8080) üzerinden bağlanır.
    hmr: {
      clientPort: 8080,
    },
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
})
