import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [react()],
    define: {
      'process.env.VITE_COGNITO_CLIENT_ID': JSON.stringify(env.VITE_COGNITO_CLIENT_ID),
      'process.env.VITE_COGNITO_USER_POOL_ID': JSON.stringify(env.VITE_COGNITO_USER_POOL_ID),
      'process.env.VITE_AWS_REGION': JSON.stringify(env.VITE_AWS_REGION),
    },
    server: {
      proxy: {
        '/auth': 'http://localhost:3001',
        '/api': 'http://localhost:3001',
      },
    },
  }
})
