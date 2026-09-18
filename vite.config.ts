import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/spansh': {
        target: 'https://spansh-proxy.iotguru.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/spansh/, ''),
      },
    },
  },
})
