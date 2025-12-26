import { defineConfig, loadEnv } from 'vite' // 1. Nhập thêm loadEnv
import react from '@vitejs/plugin-react'

// 2. Đổi thành dạng hàm để lấy tham số 'mode'
export default defineConfig(({ mode }) => {
  
  // 3. Load file .env từ folder 'data'
  const env = loadEnv(mode, './data', '');

  return {
    plugins: [react()],
    
    // Chỉ định thư mục chứa file .env
    envDir: './data', 

    server: {
      host: '0.0.0.0',
      // 4. Lấy cổng từ biến môi trường, nhớ ép kiểu sang số (parseInt)

      port: parseInt(env.FRONTEND_PORT),
      allowedHosts: true
    }
  }
})