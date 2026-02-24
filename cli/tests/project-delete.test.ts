/**
 * Project Delete Command Tests
 * 
 * 测试项目删除命令的各个功能点
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import inquirer from 'inquirer'
import { handler } from '../src/commands/project-delete'
import * as fs from 'fs'
import * as path from 'path'

// Mock inquirer
vi.mock('inquirer')

describe('Project Delete Command', () => {
  
  beforeEach(() => {
    // Mock process.exit to prevent test from actually exiting
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit called with code: ${code}`)
    })
  })
  
  afterEach(() => {
    vi.restoreAllMocks()
  })
  
  describe('Project ID Validation', () => {
    
    it('should reject empty project ID', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // 直接调用handler不传入参数会报错，这是预期行为
      await expect(handler(undefined as any)).rejects.toThrow('process.exit')
      
      consoleSpy.mockRestore()
    })
    
    it('should handle valid project ID format', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      // 正常格式的项目ID应该被接受
      try {
        await handler('proj_001')
      } catch (e) {
        // 预期会抛出exit错误
      }
      
      // 验证有输出（项目信息）
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
    
    it('should handle project ID with special characters', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // 特殊字符格式 - 项目不存在
      try {
        await handler('proj-test_123')
      } catch (e) {
        // 预期会抛出exit错误
      }
      
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('不存在')
      )
      consoleSpy.mockRestore()
      errorSpy.mockRestore()
    })
  })
  
  describe('Project Status Validation', () => {
    
    it('should show error for active project', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // 进行中的项目不应该被删除
      try {
        await handler('proj_001') // proj_001 status is '进行中'
      } catch (e) {
        // 预期会抛出exit错误
      }
      
      expect(errorSpy).toHaveBeenCalled()
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('进行中')
      )
      
      consoleSpy.mockRestore()
      errorSpy.mockRestore()
    })
    
    it('should allow deletion of draft project', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // 假设 proj_draft 是草稿状态
      vi.mocked(inquirer).prompt.mockResolvedValueOnce({
        confirm: true
      })
      
      try {
        await handler('proj_draft')
      } catch (e) {
        // 预期会抛出exit错误
      }
      
      // 应该显示删除成功信息
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('删除成功')
      )
      
      consoleSpy.mockRestore()
      warnSpy.mockRestore()
    })
    
    it('should allow deletion of completed project', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      // proj_003 是已完成状态
      vi.mocked(inquirer).prompt.mockResolvedValueOnce({
        confirm: true
      })
      
      try {
        await handler('proj_003')
      } catch (e) {
        // 预期会抛出exit错误
      }
      
      // 应该显示删除成功
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('删除成功')
      )
      
      consoleSpy.mockRestore()
    })
  })
  
  describe('Confirmation Flow', () => {
    
    it('should ask for confirmation before deletion', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Mock inquirer prompt
      vi.mocked(inquirer).prompt.mockResolvedValueOnce({
        confirm: true
      })
      
      // 对于草稿项目，应该需要确认
      try {
        await handler('proj_draft')
      } catch (e) {
        // 预期会抛出exit错误
      }
      
      // 验证inquirer被调用
      expect(vi.mocked(inquirer).prompt).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
      warnSpy.mockRestore()
    })
    
    it('should cancel deletion when user declines', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      
      // Mock inquirer prompt - 用户选择取消
      vi.mocked(inquirer).prompt.mockResolvedValueOnce({
        confirm: false
      })
      
      try {
        await handler('proj_draft')
      } catch (e) {
        // 预期会抛出exit错误
      }
      
      // 应该显示取消信息
      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('取消')
      )
      
      consoleSpy.mockRestore()
      infoSpy.mockRestore()
    })
  })
  
  describe('Error Handling', () => {
    
    it('should handle non-existent project', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // 不存在的项目
      try {
        await handler('proj_not_exist')
      } catch (e) {
        // 预期会抛出exit错误
      }
      
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('不存在')
      )
      
      consoleSpy.mockRestore()
      errorSpy.mockRestore()
    })
    
    it('should handle invalid project ID format', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // 无效的ID格式
      try {
        await handler('')
      } catch (e) {
        // 预期会抛出exit错误
      }
      
      expect(errorSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
      errorSpy.mockRestore()
    })
  })
  
  describe('Output Formatting', () => {
    
    it('should show project info before deletion', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      vi.mocked(inquirer).prompt.mockResolvedValueOnce({
        confirm: true
      })
      
      try {
        await handler('proj_003')
      } catch (e) {
        // 预期会抛出exit错误
      }
      
      // 应该显示项目信息
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('proj_003')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('AI代码审查工具')
      )
      
      consoleSpy.mockRestore()
    })
    
    it('should show success message with project name', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      vi.mocked(inquirer).prompt.mockResolvedValueOnce({
        confirm: true
      })
      
      try {
        await handler('proj_003')
      } catch (e) {
        // 预期会抛出exit错误
      }
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('AI代码审查工具')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('删除成功')
      )
      
      consoleSpy.mockRestore()
    })
    
    it('should show error message for active project', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      try {
        await handler('proj_001')
      } catch (e) {
        // 预期会抛出exit错误
      }
      
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('无法删除')
      )
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('进行中')
      )
      
      consoleSpy.mockRestore()
      errorSpy.mockRestore()
    })
  })
})
