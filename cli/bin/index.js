#!/usr/bin/env node

// CLI入口文件
// 开发环境使用 tsx 运行，生产环境使用编译后的代码

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const isDev = process.env.NODE_ENV !== 'production'

if (isDev) {
  // 开发环境：使用 tsx 运行 TypeScript
  const tsxPath = join(__dirname, '..', 'node_modules', 'tsx', 'bin', 'cli.js')
  const scriptPath = join(__dirname, '..', 'src', 'index.ts')
  
  const child = spawn('node', [tsxPath, scriptPath], {
    stdio: 'inherit',
    cwd: join(__dirname, '..')
  })
  
  child.on('exit', (code) => {
    process.exit(code)
  })
} else {
  // 生产环境：运行编译后的 JavaScript
  import('./index.js').catch((err) => {
    console.error('Failed to start CLI:', err)
    process.exit(1)
  })
}
