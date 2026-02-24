import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import legacy from '@vitejs/plugin-legacy'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
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
    // 启用 gzip 压缩
    compressGzip: true,
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
        assetFileNames: '[ext]/[name]-[hash].[ext]',
        // 分隔符
        sanitizeFileName(name) {
          return name.replace(/[^a-zA-Z0-9-_]/g, '_')
        }
      },
      // 外部化大型依赖
      external: [],
      // 插件
      plugins: []
    },
    // 优化构建目标
    target: 'es2015',
    // 生成 source map（生产环境可关闭）
    sourcemap: false,
    // 启用构建分析
    reportCompressedSize: true,
    // Terser 压缩选项
    minify: 'terser',
    terserOptions: {
      compress: {
        // 移除 console 和 debugger
        drop_console: true,
        drop_debugger: true,
        // 压缩选项
        passes: 2,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      },
      output: {
        // 美化输出（可选，生产环境建议关闭）
        beautify: false,
        // 移除注释
        comments: false
      }
    }
  },
  // 优化依赖解析
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'naive-ui', 'axios', 'dayjs'],
    // 排除大型不常更新的依赖
    exclude: [],
    // 预构建依赖
    esbuildOptions: {
      // 目标版本
      target: 'es2015'
    }
  },
  // 开发服务器优化
  server: {
    ...{ port: 3000 },
    hmr: {
      overlay: true,
      // 优化 HMR 连接
      clientPort: 3000,
      // 路径重写
      pathRewrite: undefined
    },
    // 开启 gzip 预压缩
    preCompressed: false,
    // CORS 配置
    cors: true,
    // 主机配置
    host: '0.0.0.0',
    // 超时时间
    timeout: 30000
  },
  // 预览服务器配置
  preview: {
    port: 3000,
    host: '0.0.0.0',
    // 开启 gzip
    compress: true
  }
})
