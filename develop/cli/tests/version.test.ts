#!/usr/bin/env node

import { describe, it, expect, beforeAll } from 'vitest'
import { execSync } from 'child_process'
import path from 'path'

describe('CLI基础命令', () => {
  const tsxPath = path.resolve(__dirname, '../node_modules/.bin/tsx')
  const scriptPath = path.resolve(__dirname, '../src/index.ts')

  describe('--version 命令', () => {
    it('应返回当前版本号', () => {
      const output = execSync(`node ${tsxPath} ${scriptPath} --version`, {
        encoding: 'utf-8',
        cwd: path.dirname(scriptPath)
      })
      
      expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/)
    })
  })

  describe('--help 命令', () => {
    it('应显示帮助信息', () => {
      const output = execSync(`node ${tsxPath} ${scriptPath} --help`, {
        encoding: 'utf-8',
        cwd: path.dirname(scriptPath)
      })
      
      expect(output).toContain('Usage')
      expect(output).toContain('aipm')
    })
  })
})
