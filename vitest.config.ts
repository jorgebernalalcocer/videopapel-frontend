import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Resuelve el alias @/* leyendo los paths del tsconfig (soporte nativo de Vite)
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    // Entorno de navegador simulado para tests de componentes
    environment: 'jsdom',
    globals: true,
    // setup con matchers de jest-dom + limpieza entre tests
    setupFiles: ['./vitest.setup.ts'],
    // src/lib/env.ts lanza al importar si no hay base URL:
    // la inyectamos aquí para que auth.ts y compañía se puedan importar.
    env: {
      NEXT_PUBLIC_API_BASE: 'http://localhost:8000',
      NEXT_PUBLIC_API_BASE_URL: 'http://localhost:8000',
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
