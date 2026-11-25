import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // En producción en el servidor TecnoWeb (Escenario A), la app se sirve desde el subdirectorio /inf513/grupo02sa/inf513-proyecto2/
  // En desarrollo local (command === 'serve'), la ruta base se mantiene en la raíz '/'
  base: command === 'build' ? '/inf513/grupo02sa/inf513-proyecto2/' : '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/storage': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
}))
