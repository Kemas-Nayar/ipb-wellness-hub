import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // (or whatever plugins you have)

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true, // Optional: Fails if port 3000 is already in use, instead of automatically trying 3001
  },
})
