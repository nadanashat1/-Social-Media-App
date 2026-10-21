import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Project is served from https://nadanashat1.github.io/-Social-Media-App/
  base: '/-Social-Media-App/',
  plugins: [react()],
})
