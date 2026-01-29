import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.js.dev/config/
export default defineConfig({
  // Указываем базовый путь. '/' подходит для своего домена или корня github.io
  base: './', 
  plugins: [react()],
})
