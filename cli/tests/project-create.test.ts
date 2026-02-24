/**
 * Project Create命令测试
 * 
 * 测试功能：
 * 1. 项目名称验证
 * 2. 项目描述验证
 * 3. Git仓库URL验证
 * 4. 项目配置生成
 * 5. 输出格式化
 */

import { describe, it, expect } from 'vitest'
import {
  validateProjectName,
  validateGitUrl,
  generateProjectId,
  createProjectConfig,
  formatCreateResult
} from '../src/commands/project-create'

/**
 * 创建项目配置
 * 
 * @param params 项目参数
 * @returns 项目配置对象
 */
export function createProjectConfig(params: ProjectCreateParams): Record<string, any> {
  const now = new Date().toISOString()
  
  return {
    id: generateProjectId(params.name),
    name: params.name.trim(),
    description: params.description.trim(),
    gitUrl: params.gitUrl?.trim() || null,
    tags: params.tags || [],
    createdAt: now,
    updatedAt: now,
    status: 'active',
    version: '0.0.1'
  }
}

/**
 * 格式化项目创建结果输出
 * 
 * @param result 创建结果
 * @returns 格式化字符串
 */
export function formatCreateResult(result: ProjectCreateResult): string {
  if (!result.success) {
    return `❌ ${result.message}`
  }
  
  let output = `✅ ${result.message}\n`
  output += `─`.repeat(50) + '\n'
  output += `项目ID: ${result.projectId}\n`
  output += `项目名称: ${result.projectName}\n`
  
  if (result.config?.gitUrl) {
    output += `Git仓库: ${result.config.gitUrl}\n`
  }
  
  output += `─`.repeat(50)
  
  return output
}

describe('Project Create - 项目创建', () => {
  describe('validateProjectName - 项目名称验证', () => {
    it('should pass for valid Chinese name', () => {
      const result = validateProjectName('我的AI项目')
      expect(result.valid).toBe(true)
    })
    
    it('should pass for valid English name', () => {
      const result = validateProjectName('AI-Powered Task Manager')
      expect(result.valid).toBe(true)
    })
    
    it('should pass for name with numbers', () => {
      const result = validateProjectName('Project2026')
      expect(result.valid).toBe(true)
    })
    
    it('should fail for empty name', () => {
      const result = validateProjectName('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('项目名称不能为空')
    })
    
    it('should fail for name too short', () => {
      const result = validateProjectName('AB')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('项目名称至少3个字符')
    })
    
    it('should fail for name too long', () => {
      const longName = 'A'.repeat(51)
      const result = validateProjectName(longName)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('项目名称不能超过50个字符')
    })
    
    it('should fail for name with special chars', () => {
      const result = validateProjectName('Project@#$%')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('项目名称只能包含中文、英文、数字、下划线和中划线')
    })
    
    it('should trim whitespace', () => {
      const result = validateProjectName('  My Project  ')
      expect(result.valid).toBe(true)
    })
  })
  
  describe('validateGitUrl - Git仓库URL验证', () => {
    it('should pass for valid HTTPS URL', () => {
      const result = validateGitUrl('https://github.com/user/repo')
      expect(result.valid).toBe(true)
    })
    
    it('should pass for valid HTTPS URL with .git', () => {
      const result = validateGitUrl('https://github.com/user/repo.git')
      expect(result.valid).toBe(true)
    })
    
    it('should pass for valid SSH URL', () => {
      const result = validateGitUrl('git@github.com:user/repo.git')
      expect(result.valid).toBe(true)
    })
    
    it('should pass for empty URL (optional)', () => {
      const result = validateGitUrl('')
      expect(result.valid).toBe(true)
    })
    
    it('should fail for invalid URL', () => {
      const result = validateGitUrl('not-a-git-url')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Git仓库URL格式无效（支持HTTPS/SSH格式）')
    })
    
    it('should fail for non-GitHub URL', () => {
      const result = validateGitUrl('https://gitlab.com/user/repo')
      expect(result.valid).toBe(false)
    })
  })
  
  describe('generateProjectId - 项目ID生成', () => {
    it('should generate ID with project slug', () => {
      const id = generateProjectId('My AI Project')
      expect(id).toContain('my-ai-project')
    })
    
    it('should start with proj_ prefix', () => {
      const id = generateProjectId('MyProject')
      expect(id.startsWith('proj_')).toBe(true)
    })
    
    it('should include timestamp', () => {
      const id = generateProjectId('TestProject')
      // ID格式: proj_test-project_TIMESTAMP
      expect(id).toMatch(/^proj_[\w-]+_[a-z0-9]+$/)
    })
    
    it('should truncate long names', () => {
      const longName = 'A'.repeat(50)
      const id = generateProjectId(longName)
      const slug = id.split('_')[1]
      expect(slug.length).toBeLessThanOrEqual(16)
    })
  })
  
  describe('createProjectConfig - 项目配置生成', () => {
    it('should create valid config', () => {
      const params: ProjectCreateParams = {
        name: 'Test Project',
        description: 'A test project',
        gitUrl: 'https://github.com/user/repo',
        tags: ['test', 'demo']
      }
      
      const config = createProjectConfig(params)
      
      expect(config.id).toBeDefined()
      expect(config.name).toBe('Test Project')
      expect(config.description).toBe('A test project')
      expect(config.gitUrl).toBe('https://github.com/user/repo')
      expect(config.tags).toEqual(['test', 'demo'])
      expect(config.status).toBe('active')
      expect(config.version).toBe('0.0.1')
    })
    
    it('should handle missing optional fields', () => {
      const params: ProjectCreateParams = {
        name: 'Test Project',
        description: 'A test project'
      }
      
      const config = createProjectConfig(params)
      
      expect(config.gitUrl).toBeNull()
      expect(config.tags).toEqual([])
    })
  })
  
  describe('formatCreateResult - 结果格式化', () => {
    it('should format success result', () => {
      const result: ProjectCreateResult = {
        success: true,
        projectId: 'proj_test_abc123',
        projectName: 'Test Project',
        message: '项目创建成功',
        config: {
          gitUrl: 'https://github.com/user/repo'
        }
      }
      
      const output = formatCreateResult(result)
      
      expect(output).toContain('✅ 项目创建成功')
      expect(output).toContain('proj_test_abc123')
      expect(output).toContain('Test Project')
    })
    
    it('should format failure result', () => {
      const result: ProjectCreateResult = {
        success: false,
        projectName: '',
        message: '项目名称不能为空'
      }
      
      const output = formatCreateResult(result)
      
      expect(output).toContain('❌ 项目名称不能为空')
    })
  })
})
