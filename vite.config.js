import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'esnext',   // povolí top-level await
    outDir: 'dist',
    rollupOptions: {
      input: {
        main:  'index.html',
        admin: 'admin.html',
      }
    }
  },
})
