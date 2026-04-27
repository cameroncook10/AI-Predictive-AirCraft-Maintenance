import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true,
    proxy: {
      // FastAPI (uvicorn) must be running on this port. If you see 502, the API is down or the port is wrong.
      // Gemini API calls can be slow; keep long timeouts on the dev proxy.
      '/api': {
        target: 'http://127.0.0.1:8765',
        changeOrigin: true,
        timeout: 600_000,
        proxyTimeout: 600_000,
      },
    },
  },
})
