import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
  },
  server: { port: 8880, open: true },
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        fieldplay: path.resolve(__dirname, 'index.html'),
        gate0: path.resolve(__dirname, 'gate0.html'),
        wallpaper: path.resolve(__dirname, 'wallpaper.html')
      }
    }
  }
})
