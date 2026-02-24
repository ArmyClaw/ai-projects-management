#!/usr/bin/env node

import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import path from 'path'

/**
 * Task Detail 命令测试用例
 * 
 * 测试场景：
 * 1. 查看有效任务的详细信息
 * 2. 查看不存在的任务
 * 3. 验证输出包含所有必要字段
 * 4. 验证任务详情的格式化输出
 */

describe('task detail 命令', () => {
  const tsxPath = path.resolve(__dirname, '../node_modules/.bin/tsx')
  const scriptPath = path.resolve(__dirname, '../src/index.ts')

  describe('查看有效任务详情', () => {
    it('应成功显示task_001的完整详情', () => {
      const output = execSync(`node ${tsxPath} ${scriptPath} task detail task_001`, {
        encoding: 'utf-8',
        cwd: path.dirname(scriptPath)
      })
      
      // 验证输出包含任务ID
      expect(output).toContain('task_001')
      // 验证输出包含项目名称
      expect(output).toContain('AI代码审查工具')
      // 验证输出包含预算
      expect(output).toContain('¥3,000')
      // 验证输出包含状态
      expect(output).toContain('可认领')
      // 验证输出包含技能
      expect(output).toContain('Python')
      expect(output).toContain('FastAPI')
      // 验证输出包含截止日期
      expect(output).toContain('2026-02-25')
    })

    it('应成功显示task_002的完整详情', () => {
      const output = execSync(`node ${tsxPath} ${scriptPath} task detail task_002`, {
        encoding: 'utf-8',
        cwd: path.dirname(scriptPath)
      })
      
      // 验证输出包含任务ID
      expect(output).toContain('task_002')
      // 验证输出包含项目名称
      expect(output).toContain('智能客服系统')
      // 验证输出包含预算
      expect(output).toContain('¥4,000')
      // 验证输出包含状态
      expect(output).toContain('可认领')
      // 验证输出包含技能
      expect(output).toContain('React')
      expect(output).toContain('TypeScript')
    })

    it('应成功显示task_003的详情（进行中状态）', () => {
      const output = execSync(`node ${tsxPath} ${scriptPath} task detail task_003`, {
        encoding: 'utf-8',
        cwd: path.dirname(scriptPath)
      })
      
      // 验证输出包含任务ID
      expect(output).toContain('task_003')
      // 验证输出包含项目名称
      expect(output).toContain('数据分析平台')
      // 验证输出包含状态（进行中）
      expect(output).toContain('进行中')
    })
  })

  describe('查看不存在的任务', () => {
    it('应对不存在的任务显示错误', () => {
      try {
        execSync(`node ${tsxPath} ${scriptPath} task detail invalid_task`, {
          encoding: 'utf-8',
          cwd: path.dirname(scriptPath)
        })
        expect(false).toBe(true) // 应该抛出错误
      } catch (error: any) {
        expect(error.stdout).toContain('不存在')
      }
    })

    it('应对空ID显示错误', () => {
      try {
        execSync(`node ${tsxPath} ${scriptPath} task detail`, {
          encoding: 'utf-8',
          cwd: path.dirname(scriptPath)
        })
        expect(false).toBe(true) // 应该抛出错误
      } catch (error: any) {
        // 应该显示缺少参数的错误
        expect(error.stdout || error.message).toBeTruthy()
      }
    })
  })

  describe('输出格式验证', () => {
    it('应包含任务详情标题', () => {
      const output = execSync(`node ${tsxPath} ${scriptPath} task detail task_001`, {
        encoding: 'utf-8',
        cwd: path.dirname(scriptPath)
      })
      
      expect(output).toContain('任务详情')
    })

    it('应包含所有必要字段标签', () => {
      const output = execSync(`node ${tsxPath} ${scriptPath} task detail task_001`, {
        encoding: 'utf-8',
        cwd: path.dirname(scriptPath)
      })
      
      // 验证包含字段标签
      expect(output).toContain('ID')
      expect(output).toContain('项目名称')
      expect(output).toContain('预算')
      expect(output).toContain('状态')
      expect(output).toContain('所需技能')
      expect(output).toContain('截止日期')
    })

    it('应正确格式化多个技能', () => {
      const output = execSync(`node ${tsxPath} ${scriptPath} task detail task_001`, {
        encoding: 'utf-8',
        cwd: path.dirname(scriptPath)
      })
      
      // 技能应该以逗号分隔
      expect(output).toContain('Python, FastAPI')
    })
  })

  describe('边界情况测试', () => {
    it('应正确处理部分技能的任务', () => {
      const output = execSync(`node ${tsxPath} ${scriptPath} task detail task_002`, {
        encoding: 'utf-8',
        cwd: path.dirname(scriptPath)
      })
      
      // 验证包含多个技能
      expect(output).toContain('React')
      expect(output).toContain('TypeScript')
    })

    it('应正确显示预算格式', () => {
      const output = execSync(`node ${tsxPath} ${scriptPath} task detail task_001`, {
        encoding: 'utf-8',
        cwd: path.dirname(scriptPath)
      })
      
      // 验证预算格式
      expect(output).toMatch(/¥[\d,]+/)
    })
  })
})
