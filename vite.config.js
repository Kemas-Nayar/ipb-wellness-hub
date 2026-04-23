import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true, // Opsional: Agar Vite error kalau port 3000 dipakai app lain, bukan malah pindah ke 3001
  }
})
