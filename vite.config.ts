import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
 root:'product',
 plugins:[react()],
 publicDir:false,
 base:'./',
 build:{outDir:'../dist',emptyOutDir:true,rollupOptions:{output:{manualChunks:{react:['react','react-dom','react-dom/client']}}}},
})
