#!/usr/bin/env node

import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import path from 'path'

/**
 * Task Claim 命令测试用例
 * 
 * 测试场景：
 * 1. 成功认领有效任务
 * 2. 认领不存在的任务
 * 3. 认领已进行中的任务
 */

describe('task claim 命令', () => {
  const tsxPath = path.resolve(__dirname, '../node_modules/.bin/tsx')
  const scriptPath = path.resolve(__dirname, '../src/index.ts')

  describe('认领有效任务', () => {
    it('应成功认领task_001并显示任务详情', () => {
      const output = execSync(`node ${tsxPath} ${scriptPath} task claim task_001`, {
        encoding: 'utf-8',
        cwd: path.dirname(scriptPath)
      })
      
      expect(output).toContain('task_001')
      expect(output).toContain('AI代码审查工具')
      expect(output).toContain('成功认领任务')
    })
  })

  describe('任务不存在', () => {
    it('应对不存在的任务显示错误', () => {
      try {
        execSync(`node ${tsxPath} ${scriptPath} task claim invalid_id`, {
          encoding: 'utf-8',
          cwd: path.dirname(scriptPath)
        })
        expect(false).toBe(true) // 应该抛出错误
      } catch (error: any) {
        expect(error.stdout).toContain('不存在')
      }
    })
  })

  describe('任务已认领', () => {
    it('应对已进行中的任务显示已认领提示', () => {
      try {
        execSync(`node ${tsxPath} ${scriptPath} task claim task_003`, {
          encoding: 'utf-8',
          cwd: path.dirname(scriptPath)
        })
        expect(false).toBe(true) // 应该抛出错误
      } catch (error: any) {
        expect(error.stdout).toContain('已被认领或已完成')
      }
    })
  })
})
