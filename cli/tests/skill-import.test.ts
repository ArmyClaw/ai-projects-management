import { describe, it, expect, vi } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

/**
 * 测试用例：skill import命令功能验证
 */
describe('skill import', () => {
  describe('JSON解析验证', () => {
    it('should parse valid JSON skill file', () => {
      const validSkillJson = JSON.stringify({
        name: 'Test Skill',
        description: 'A test skill',
        tags: ['test'],
        prompts: [{
          role: 'system',
          content: 'You are a {{role}}'
        }],
        workflow: [{
          step: 1,
          name: 'Step 1',
          description: 'First step'
        }],
        qualityStandard: {
          codeStyle: 'PEP8',
          testing: 'Unit tests required'
        }
      }, null, 2)

      expect(() => JSON.parse(validSkillJson)).not.toThrow()
      
      const parsed = JSON.parse(validSkillJson)
      expect(parsed.name).toBe('Test Skill')
      expect(parsed.description).toBe('A test skill')
      expect(parsed.tags).toContain('test')
    })

    it('should throw error for invalid JSON', () => {
      const invalidJson = '{ invalid json }'
      
      expect(() => JSON.parse(invalidJson)).toThrow()
    })

    it('should throw error for empty JSON', () => {
      const emptyJson = ''
      
      expect(() => JSON.parse(emptyJson)).toThrow()
    })
  })

  describe('Skill Schema验证', () => {
    it('should validate required fields in skill', () => {
      const skill = {
        name: 'Test Skill',
        description: 'A test skill',
        tags: ['test']
        // Missing prompts, workflow, qualityStandard
      }

      const isValid = validateSkillSchema(skill)
      expect(isValid).toBe(false)
    })

    it('should validate complete skill structure', () => {
      const skill = {
        name: 'Test Skill',
        description: 'A test skill',
        tags: ['test'],
        prompts: [{
          role: 'system',
          content: 'You are a helper'
        }],
        workflow: [{
          step: 1,
          name: 'First Step',
          description: 'Do something'
        }],
        qualityStandard: {
          codeStyle: 'PEP8',
          testing: 'Required'
        }
      }

      const isValid = validateSkillSchema(skill)
      expect(isValid).toBe(true)
    })

    it('should reject skill without name', () => {
      const skill = {
        description: 'A test skill',
        tags: ['test'],
        prompts: [],
        workflow: [],
        qualityStandard: {}
      }

      const isValid = validateSkillSchema(skill)
      expect(isValid).toBe(false)
    })

    it('should reject skill with invalid tags type', () => {
      const skill = {
        name: 'Test Skill',
        description: 'A test skill',
        tags: 'test',  // Should be array
        prompts: [],
        workflow: [],
        qualityStandard: {}
      }

      const isValid = validateSkillSchema(skill)
      expect(isValid).toBe(false)
    })
  })

  describe('文件路径验证', () => {
    it('should validate JSON file extension', () => {
      const validPath = '/path/to/skill.json'
      const invalidPath = '/path/to/skill.txt'
      
      expect(validPath.endsWith('.json')).toBe(true)
      expect(invalidPath.endsWith('.json')).toBe(false)
    })

    it('should extract filename from path', () => {
      const filePath = '/some/path/to/skill.json'
      const filename = path.basename(filePath)
      
      expect(filename).toBe('skill.json')
    })
  })

  describe('导入结果格式化', () => {
    it('should format success import result', () => {
      const result = formatImportResult(true, 'Test Skill', '/path/to/skill.json')
      
      expect(result.success).toBe(true)
      expect(result.skillName).toBe('Test Skill')
      expect(result.filePath).toBe('/path/to/skill.json')
    })

    it('should format error import result', () => {
      const result = formatImportResult(false, null, '/path/to/skill.json', 'Invalid JSON')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid JSON')
    })

    it('should include skill info in success result', () => {
      const skill = {
        name: 'Python Expert',
        description: 'Python development expert',
        tags: ['Python', 'FastAPI']
      }
      
      const result = formatImportResult(true, skill.name, '/path/to/skill.json')
      
      expect(result.skillName).toBe('Python Expert')
      expect(result.success).toBe(true)
    })
  })

  describe('Prompt变量提取', () => {
    it('should extract variables from prompt template', () => {
      const prompt = 'You are a {{role}} expert in {{language}}'
      const variables = extractVariables(prompt)
      
      expect(variables).toContain('role')
      expect(variables).toContain('language')
    })

    it('should return empty array for prompt without variables', () => {
      const prompt = 'You are a helpful assistant'
      const variables = extractVariables(prompt)
      
      expect(variables).toHaveLength(0)
    })
  })
})

/**
 * 验证Skill Schema结构
 * 根据架构设计文档v0.8定义的Skill JSON Schema
 * 
 * @param skill Skill对象
 * @returns 是否有效
 */
function validateSkillSchema(skill: any): boolean {
  // 检查必需字段
  if (!skill.name || typeof skill.name !== 'string') {
    return false
  }
  if (!skill.description || typeof skill.description !== 'string') {
    return false
  }
  if (!skill.tags || !Array.isArray(skill.tags)) {
    return false
  }
  if (!skill.prompts || !Array.isArray(skill.prompts)) {
    return false
  }
  if (!skill.workflow || !Array.isArray(skill.workflow)) {
    return false
  }
  if (!skill.qualityStandard || typeof skill.qualityStandard !== 'object') {
    return false
  }
  
  return true
}

/**
 * 格式化导入结果
 * 
 * @param success 是否成功
 * @param skillName Skill名称
 * @param filePath 文件路径
 * @param error 错误信息
 * @returns 格式化结果
 */
function formatImportResult(
  success: boolean,
  skillName: string | null,
  filePath: string,
  error?: string
): { success: boolean; skillName: string | null; filePath: string; error?: string } {
  return {
    success,
    skillName,
    filePath,
    ...(error && { error })
  }
}

/**
 * 从Prompt模板中提取变量
 * 支持Handlebars风格 {{variableName}} 语法
 * 
 * @param prompt Prompt模板
 * @returns 变量名数组
 */
function extractVariables(prompt: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g
  const variables: string[] = []
  let match
  
  while ((match = regex.exec(prompt)) !== null) {
    const variable = match[1].trim()
    if (!variables.includes(variable)) {
      variables.push(variable)
    }
  }
  
  return variables
}
