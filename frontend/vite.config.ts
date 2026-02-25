import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: {
      overlay: true,
      clientPort: 3000
    },
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: ''
      }
    }
  },
  build: {
    // 资源内联阈值
    assetsInlineLimit: 4096,
    // chunk 大小警告阈值
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // 代码分割策略
        manualChunks: {
          // 将第三方库单独打包，利用浏览器缓存
          'vendor': ['vue', 'vue-router', 'pinia'],
          // UI 组件库单独打包
          'naive-ui': ['naive-ui'],
          // 工具库单独打包
          'utils': ['axios', 'dayjs']
        },
        // 优化 chunk 命名
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: '[ext]/[name]-[hash].[ext]'
      }
    },
    // 生成 source map（生产环境可关闭）
    sourcemap: false,
    // 启用构建分析
    reportCompressedSize: true,
    // 使用 esbuild 压缩
    minify: 'esbuild'
  },
  // 优化依赖解析
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'naive-ui', 'axios', 'dayjs'],
    esbuildOptions: {
      target: 'es2015'
    }
  },
  // 预览服务器配置
  preview: {
    port: 3000,
    host: '0.0.0.0',
    compress: true
  }
})
