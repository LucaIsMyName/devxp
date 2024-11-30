import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'prettier/standalone',
      'prettier/parser-babel',
      'prettier/parser-html',
      'prettier/parser-postcss',
      'sql.js'
    ],
    exclude: ['sql.js']
  },
  build: {
    commonjsOptions: {
      include: [/prettier/, , /sql\.js/]
    }
  },
  base: process.env.ELECTRON=="true" ? './' : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
  },
  server: {
    port: 5174,
    strictPort: false,
    host: true,
    fs: {
      allow: ['..']
    }
  },
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      },
      output: {
        format: 'es'
      }
    }
  }
})