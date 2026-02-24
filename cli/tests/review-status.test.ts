#!/usr/bin/env node

import { describe, it, expect, beforeAll } from 'vitest'
import { execSync } from 'child_process'
import path from 'path'

describe('review status 命令', () => {
  const tsxPath = path.resolve(__dirname, '../node_modules/.bin/tsx')
  const scriptPath = path.resolve(__dirname, '../src/index.ts')

  describe('验收状态输出', () => {
    it('应返回待验收任务列表', () => {
      const output = execSync(`node ${tsxPath} ${scriptPath} review status`, {
        encoding: 'utf-8',
        cwd: path.dirname(scriptPath)
      })
      
      // 验证输出包含验收状态关键字
      expect(output).toContain('📋')
      expect(output).toContain('验收状态')
      expect(output).toContain('ID')
      expect(output).toContain('项目名称')
    })

    it('应显示待验收任务', () => {
      const output = execSync(`node ${tsxPath} ${scriptPath} review status`, {
        encoding: 'utf-8',
        cwd: path.dirname(scriptPath)
      })
      
      // 验证输出包含待验收状态
      expect(output).toMatch(/待验收|已通过|需修改/)
    })

    it('应显示任务预算和技能要求', () => {
      const output = execSync(`node ${tsxPath} ${scriptPath} review status`, {
        encoding: 'utf-8',
        cwd: path.dirname(scriptPath)
      })
      
      // 验证输出包含预算信息
      expect(output).toContain('¥')
    })

    it('应统计各状态任务数量', () => {
      const output = execSync(`node ${tsxPath} ${scriptPath} review status`, {
        encoding: 'utf-8',
        cwd: path.dirname(scriptPath)
      })
      
      // 验证输出包含统计信息
      expect(output).toMatch(/共 \d+ 个验收任务/)
    })
  })

  describe('验收状态分类', () => {
    it('应显示待验收任务', () => {
      const output = execSync(`node ${tsxPath} ${scriptPath} review status`, {
        encoding: 'utf-8',
        cwd: path.dirname(scriptPath)
      })
      
      // 验证输出包含待验收状态
      expect(output).toMatch(/待验收/)
    })

    it('应显示已通过任务', () => {
      const output = execSync(`node ${tsxPath} ${scriptPath} review status`, {
        encoding: 'utf-8',
        cwd: path.dirname(scriptPath)
      })
      
      // 验证输出包含已通过状态
      expect(output).toMatch(/已通过/)
    })

    it('应显示需修改任务', () => {
      const output = execSync(`node ${tsxPath} ${scriptPath} review status`, {
        encoding: 'utf-8',
        cwd: path.dirname(scriptPath)
      })
      
      // 验证输出包含需修改状态
      expect(output).toMatch(/需修改/)
    })
  })
})
