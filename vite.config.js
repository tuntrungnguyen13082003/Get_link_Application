import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // <--- THÊM DÒNG NÀY (Quan trọng: dấu chấm và dấu gạch chéo)
})