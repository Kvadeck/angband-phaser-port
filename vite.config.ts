import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    // Vitest UI is bound on 0.0.0.0 for the parity board link — allow run/rerun from UI.
    api: {
      host: '0.0.0.0',
      port: 51204,
      strictPort: true,
      allowExec: true,
      allowWrite: true,
    },
  },
})
