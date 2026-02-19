import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import {
  validateSkillFile,
  validateRequiredFields,
  validatePromptFormat,
  validateWorkflowOrder,
  validateQualityStandard,
  formatValidationOutput,
  type ValidationResult
} from '../src/commands/skill-validate'
import { fileURLToPath } from 'url'

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 测试用例：skill validate命令功能验证
 */
describe('skill validate', () => {
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

  describe('Skill Schema必填字段验证', () => {
    it('should validate required fields in skill', () => {
      const skill = {
        name: 'Test Skill',
        description: 'A test skill',
        tags: ['test']
        // Missing prompts, workflow, qualityStandard
      }

      const isValid = validateRequiredFields(skill)
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

      const isValid = validateRequiredFields(skill)
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

      const isValid = validateRequiredFields(skill)
      expect(isValid).toBe(false)
    })

    it('should reject skill with empty name', () => {
      const skill = {
        name: '',
        description: 'A test skill',
        tags: ['test'],
        prompts: [],
        workflow: [],
        qualityStandard: {}
      }

      const isValid = validateRequiredFields(skill)
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

      const isValid = validateRequiredFields(skill)
      expect(isValid).toBe(false)
    })

    it('should reject skill with empty tags array', () => {
      const skill = {
        name: 'Test Skill',
        description: 'A test skill',
        tags: [],
        prompts: [],
        workflow: [],
        qualityStandard: {}
      }

      const isValid = validateRequiredFields(skill)
      expect(isValid).toBe(false)
    })
  })

  describe('Prompt模板格式验证', () => {
    it('should validate prompt has role and content', () => {
      const prompt = {
        role: 'system',
        content: 'You are a helper'
      }

      const isValid = validatePromptFormat(prompt)
      expect(isValid).toBe(true)
    })

    it('should reject prompt without role', () => {
      const prompt = {
        content: 'You are a helper'
      }

      const isValid = validatePromptFormat(prompt)
      expect(isValid).toBe(false)
    })

    it('should reject prompt without content', () => {
      const prompt = {
        role: 'system'
      }

      const isValid = validatePromptFormat(prompt)
      expect(isValid).toBe(false)
    })

    it('should reject invalid role value', () => {
      const prompt = {
        role: 'invalid_role',
        content: 'You are a helper'
      }

      const isValid = validatePromptFormat(prompt)
      expect(isValid).toBe(false)
    })

    it('should accept valid role values', () => {
      const validRoles = ['system', 'user', 'assistant']
      
      for (const role of validRoles) {
        const prompt = {
          role,
          content: 'You are a helper'
        }
        const isValid = validatePromptFormat(prompt)
        expect(isValid).toBe(true)
      }
    })
  })

  describe('工作流步骤顺序验证', () => {
    it('should validate workflow steps are sequential', () => {
      const workflow = [
        { step: 1, name: 'Step 1', description: 'First step' },
        { step: 2, name: 'Step 2', description: 'Second step' },
        { step: 3, name: 'Step 3', description: 'Third step' }
      ]

      const isValid = validateWorkflowOrder(workflow)
      expect(isValid).toBe(true)
    })

    it('should reject workflow with missing step numbers', () => {
      const workflow = [
        { step: 1, name: 'Step 1', description: 'First step' },
        { step: 3, name: 'Step 3', description: 'Third step' }
        // Missing step 2
      ]

      const isValid = validateWorkflowOrder(workflow)
      expect(isValid).toBe(false)
    })

    it('should reject workflow with duplicate step numbers', () => {
      const workflow = [
        { step: 1, name: 'Step 1', description: 'First step' },
        { step: 1, name: 'Step 1 Duplicate', description: 'Duplicate step' },
        { step: 2, name: 'Step 2', description: 'Second step' }
      ]

      const isValid = validateWorkflowOrder(workflow)
      expect(isValid).toBe(false)
    })

    it('should reject workflow with non-sequential steps', () => {
      const workflow = [
        { step: 1, name: 'Step 1', description: 'First step' },
        { step: 2, name: 'Step 2', description: 'Second step' },
        { step: 4, name: 'Step 4', description: 'Fourth step' }  // Skip 3
      ]

      const isValid = validateWorkflowOrder(workflow)
      expect(isValid).toBe(false)
    })

    it('should reject workflow with unsorted steps', () => {
      const workflow = [
        { step: 2, name: 'Step 2', description: 'Second step' },
        { step: 1, name: 'Step 1', description: 'First step' },
        { step: 3, name: 'Step 3', description: 'Third step' }
      ]

      const isValid = validateWorkflowOrder(workflow)
      expect(isValid).toBe(false)
    })

    it('should reject empty workflow', () => {
      const workflow: any[] = []

      const isValid = validateWorkflowOrder(workflow)
      expect(isValid).toBe(false)
    })
  })

  describe('质量标准格式验证', () => {
    it('should validate qualityStandard is an object', () => {
      const qualityStandard = {
        codeStyle: 'PEP8',
        testing: 'Required'
      }

      const isValid = validateQualityStandard(qualityStandard)
      expect(isValid).toBe(true)
    })

    it('should reject non-object qualityStandard', () => {
      const qualityStandard = 'PEP8'

      const isValid = validateQualityStandard(qualityStandard as any)
      expect(isValid).toBe(false)
    })

    it('should accept empty qualityStandard object', () => {
      const qualityStandard = {}

      const isValid = validateQualityStandard(qualityStandard)
      expect(isValid).toBe(true)
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

  describe('验证结果格式化', () => {
    it('should format valid skill result', () => {
      const tempFile = path.join(__dirname, 'mocks', 'valid-skill.json')
      
      // 创建临时有效Skill文件
      const validSkill = {
        name: 'Test Skill',
        description: 'A test skill for validation',
        tags: ['test'],
        prompts: [{
          role: 'system',
          content: 'You are a helper'
        }],
        workflow: [{
          step: 1,
          name: 'Step 1',
          description: 'First step'
        }],
        qualityStandard: {}
      }
      fs.writeFileSync(tempFile, JSON.stringify(validSkill, null, 2))
      
      const result = validateSkillFile(tempFile)
      
      expect(result.valid).toBe(true)
      expect(result.skillName).toBe('Test Skill')
      expect(result.errors).toHaveLength(0)
      
      // 清理临时文件
      fs.unlinkSync(tempFile)
    })

    it('should format invalid skill with errors', () => {
      const tempFile = path.join(__dirname, 'mocks', 'invalid-skill.json')
      
      // 创建临时无效Skill文件
      const invalidSkill = {
        description: 'A test skill',
        tags: ['test']
      }
      fs.writeFileSync(tempFile, JSON.stringify(invalidSkill, null, 2))
      
      const result = validateSkillFile(tempFile)
      
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.includes('name'))).toBe(true)
      
      // 清理临时文件
      fs.unlinkSync(tempFile)
    })

    it('should include warnings in result', () => {
      const tempFile = path.join(__dirname, 'mocks', 'warning-skill.json')
      
      // 创建有警告的Skill文件
      const warningSkill = {
        name: 'A',
        description: 'Short',
        tags: ['t'],
        prompts: [{
          role: 'system',
          content: 'You are a helper'
        }],
        workflow: [{
          step: 1,
          name: 'Step 1',
          description: 'First step'
        }],
        qualityStandard: {}
      }
      fs.writeFileSync(tempFile, JSON.stringify(warningSkill, null, 2))
      
      const result = validateSkillFile(tempFile)
      
      expect(result.valid).toBe(true)
      expect(result.warnings.length).toBeGreaterThan(0)
      
      // 清理临时文件
      fs.unlinkSync(tempFile)
    })
  })
})
