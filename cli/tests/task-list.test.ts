#!/usr/bin/env node

import { describe, it, expect, beforeAll } from 'vitest'
import { execSync } from 'child_process'
import path from 'path'

describe('task list 命令', () => {
  const tsxPath = path.resolve(__dirname, '../node_modules/.bin/tsx')
  const scriptPath = path.resolve(__dirname, '../src/index.ts')

  describe('任务列表输出', () => {
    it('应返回任务列表，包含必要字段', () => {
      const output = execSync(`node ${tsxPath} ${scriptPath} task list`, {
        encoding: 'utf-8',
        cwd: path.dirname(scriptPath)
      })
      
      // 验证输出包含任务列表关键字
      expect(output).toContain('📋')
      expect(output).toContain('任务列表')
      expect(output).toContain('ID')
      expect(output).toContain('预算')
    })

    it('应显示模拟任务数据', () => {
      const output = execSync(`node ${tsxPath} ${scriptPath} task list`, {
        encoding: 'utf-8',
        cwd: path.dirname(scriptPath)
      })
      
      // 验证输出包含模拟任务信息
      expect(output).toMatch(/task_/)
      expect(output).toMatch(/AI代码审查工具/)
      expect(output).toMatch(/¥/)
    })

    it('应显示任务状态', () => {
      const output = execSync(`node ${tsxPath} ${scriptPath} task list`, {
        encoding: 'utf-8',
        cwd: path.dirname(scriptPath)
      })
      
      // 验证输出包含状态信息
      expect(output).toMatch(/可认领|进行中|已完成/)
    })
  })
})
