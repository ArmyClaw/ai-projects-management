/**
 * CLI版本查询命令测试
 * 
 * 测试目标：验证 --version 和 --help 命令正常工作
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { execSync } from 'child_process'
import path from 'path'

describe('CLI基础命令', () => {
  const cliPath = path.resolve(__dirname, '../../cli/bin/index.js')

  describe('--version 命令', () => {
    it('应返回当前版本号', () => {
      const output = execSync(`node ${cliPath} --version`, {
        encoding: 'utf-8',
        cwd: path.dirname(cliPath)
      })
      
      expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/)
    })
  })

  describe('--help 命令', () => {
    it('应显示帮助信息', () => {
      const output = execSync(`node ${cliPath} --help`, {
        encoding: 'utf-8',
        cwd: path.dirname(cliPath)
      })
      
      expect(output).toContain('Usage')
      expect(output).toContain('aipm')
    })
  })
})
