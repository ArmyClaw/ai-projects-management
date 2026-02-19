#!/usr/bin/env node

import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import path from 'path'

/**
 * Task Submit 命令测试用例
 * 
 * 测试场景：
 * 1. 成功提交进行中的任务
 * 2. 提交不存在的任务
 * 3. 提交可认领状态的任务（未认领）
 */

describe('task submit 命令', () => {
  const tsxPath = path.resolve(__dirname, '../node_modules/.bin/tsx')
  const scriptPath = path.resolve(__dirname, '../src/index.ts')

  describe('提交有效任务', () => {
    it('应成功提交task_003并显示任务详情', () => {
      const output = execSync(`node ${tsxPath} ${scriptPath} task submit task_003`, {
        encoding: 'utf-8',
        cwd: path.dirname(scriptPath)
      })
      
      expect(output).toContain('task_003')
      expect(output).toContain('数据分析平台')
      expect(output).toContain('成功提交任务')
    })
  })

  describe('任务不存在', () => {
    it('应对不存在的任务显示错误', () => {
      try {
        execSync(`node ${tsxPath} ${scriptPath} task submit invalid_id`, {
          encoding: 'utf-8',
          cwd: path.dirname(scriptPath)
        })
        expect(false).toBe(true) // 应该抛出错误
      } catch (error: any) {
        expect(error.stdout).toContain('不存在')
      }
    })
  })

  describe('任务未认领', () => {
    it('应对可认领状态的任务显示未认领提示', () => {
      try {
        execSync(`node ${tsxPath} ${scriptPath} task submit task_001`, {
          encoding: 'utf-8',
          cwd: path.dirname(scriptPath)
        })
        expect(false).toBe(true) // 应该抛出错误
      } catch (error: any) {
        expect(error.stdout).toContain('未被认领')
      }
    })
  })
})
