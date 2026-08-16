import { writeFileSync } from 'node:fs'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'netlify-spa-fallback',
      closeBundle() {
        writeFileSync('dist/_redirects', '/*    /index.html   200\n')
      },
    },
  ],
  test: {
    environment: 'node',
  },
})
