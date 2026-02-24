import * as fs from 'fs'
import * as path from 'path'
import chalk from 'chalk'

/**
 * Skill验证处理器
 * 
 * 功能：
 * 1. 读取JSON文件
 * 2. 解析并验证Skill Schema
 * 3. 验证Prompt模板格式
 * 4. 验证工作流步骤顺序
 * 5. 输出验证结果
 */

// 导出类型定义，供测试使用
export interface SkillDefinition {
  name: string
  description: string
  tags: string[]
  prompts: PromptTemplate[]
  workflow: WorkflowStep[]
  qualityStandard: QualityStandard
}

export interface PromptTemplate {
  role: 'system' | 'user' | 'assistant'
  content: string
  variables?: VariableDefinition[]
}

export interface VariableDefinition {
  name: string
  description: string
  required?: boolean
  default?: string
}

export interface WorkflowStep {
  step: number
  name: string
  description: string
}

export interface QualityStandard {
  codeStyle?: string
  testing?: string
  documentation?: string
  [key: string]: string | undefined
}

export interface ValidationResult {
  valid: boolean
  skillName: string | null
  errors: string[]
  warnings: string[]
}

/**
 * 验证Skill必填字段
 * 根据架构设计文档v0.8定义的Skill JSON Schema
 * 
 * @param skill Skill对象
 * @returns 是否有效
 */
export function validateRequiredFields(skill: any): boolean {
  // 检查name
  if (!skill.name || typeof skill.name !== 'string' || skill.name.trim() === '') {
    return false
  }
  
  // 检查description
  if (!skill.description || typeof skill.description !== 'string') {
    return false
  }
  
  // 检查tags
  if (!skill.tags || !Array.isArray(skill.tags) || skill.tags.length === 0) {
    return false
  }
  
  // 检查prompts
  if (!skill.prompts || !Array.isArray(skill.prompts)) {
    return false
  }
  
  // 检查workflow
  if (!skill.workflow || !Array.isArray(skill.workflow)) {
    return false
  }
  
  // 检查qualityStandard
  if (!skill.qualityStandard || typeof skill.qualityStandard !== 'object') {
    return false
  }
  
  return true
}

/**
 * 验证Prompt模板格式
 * 
 * @param prompt Prompt对象
 * @returns 是否有效
 */
export function validatePromptFormat(prompt: any): boolean {
  // 检查role
  if (!prompt.role || !['system', 'user', 'assistant'].includes(prompt.role)) {
    return false
  }
  
  // 检查content
  if (!prompt.content || typeof prompt.content !== 'string') {
    return false
  }
  
  return true
}

/**
 * 验证工作流步骤顺序
 * 步骤必须从1开始，连续递增
 * 
 * @param workflow 工作流步骤数组
 * @returns 是否有效
 */
export function validateWorkflowOrder(workflow: any[]): boolean {
  // 检查非空
  if (!workflow || !Array.isArray(workflow) || workflow.length === 0) {
    return false
  }
  
  // 提取step编号
  const steps = workflow.map(w => w.step).filter(s => typeof s === 'number')
  
  // 检查是否从1开始
  if (steps[0] !== 1) {
    return false
  }
  
  // 检查是否连续递增
  for (let i = 0; i < steps.length; i++) {
    if (steps[i] !== i + 1) {
      return false
    }
  }
  
  return true
}

/**
 * 验证质量标准格式
 * 
 * @param qualityStandard 质量标准对象
 * @returns 是否有效
 */
export function validateQualityStandard(qualityStandard: any): boolean {
  return typeof qualityStandard === 'object' && qualityStandard !== null
}

/**
 * 验证Skill文件
 * 
 * @param filePath Skill JSON文件路径
 * @returns 验证结果
 */
export function validateSkillFile(filePath: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  let skillName: string | null = null
  
  // 1. 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    errors.push(`文件不存在: ${filePath}`)
    return { valid: false, skillName: null, errors, warnings }
  }
  
  // 2. 检查文件扩展名
  if (!filePath.endsWith('.json')) {
    errors.push(`文件扩展名无效: ${filePath}（必须是.json文件）`)
    return { valid: false, skillName: null, errors, warnings }
  }
  
  // 3. 读取并解析JSON
  let skill: any
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    skill = JSON.parse(content)
  } catch (e) {
    errors.push(`JSON解析失败: ${(e as Error).message}`)
    return { valid: false, skillName: null, errors, warnings }
  }
  
  // 4. 验证必填字段
  if (!skill.name || typeof skill.name !== 'string' || skill.name.trim() === '') {
    errors.push('缺少必填字段: name')
  } else {
    skillName = skill.name
    if (skill.name.length < 2) {
      warnings.push('name字段长度建议至少2个字符')
    }
  }
  
  if (!skill.description || typeof skill.description !== 'string') {
    errors.push('缺少必填字段: description')
  } else if (skill.description.length < 10) {
    warnings.push('description字段长度建议至少10个字符')
  }
  
  if (!skill.tags || !Array.isArray(skill.tags) || skill.tags.length === 0) {
    errors.push('缺少必填字段: tags（必须是非空数组）')
  } else if (skill.tags.length < 2) {
    warnings.push('tags建议至少包含2个标签')
  }
  
  if (!skill.prompts || !Array.isArray(skill.prompts)) {
    errors.push('缺少必填字段: prompts（必须是非空数组）')
  }
  
  if (!skill.workflow || !Array.isArray(skill.workflow)) {
    errors.push('缺少必填字段: workflow（必须是非空数组）')
  }
  
  if (!skill.qualityStandard || typeof skill.qualityStandard !== 'object') {
    errors.push('缺少必填字段: qualityStandard（必须是对象）')
  }
  
  // 5. 验证Prompt模板格式
  if (skill.prompts && Array.isArray(skill.prompts)) {
    for (let i = 0; i < skill.prompts.length; i++) {
      const prompt = skill.prompts[i]
      
      if (!prompt.role || !['system', 'user', 'assistant'].includes(prompt.role)) {
        errors.push(`prompts[${i}].role无效: 必须是'system'、'user'或'assistant'`)
      }
      
      if (!prompt.content || typeof prompt.content !== 'string') {
        errors.push(`prompts[${i}].content缺失或类型错误`)
      }
      
      // 检查Prompt变量格式
      if (prompt.content && typeof prompt.content === 'string') {
        const variableRegex = /\{\{([^}]+)\}\}/g
        let match
        const variables: string[] = []
        
        while ((match = variableRegex.exec(prompt.content)) !== null) {
          const varName = match[1].trim()
          if (varName && !variables.includes(varName)) {
            variables.push(varName)
          }
        }
        
        // 检查变量定义
        if (prompt.variables && Array.isArray(prompt.variables)) {
          for (const v of prompt.variables) {
            if (!v.name || typeof v.name !== 'string') {
              warnings.push(`prompts[${i}].variables中存在无效的变量定义`)
            }
          }
        }
      }
    }
    
    if (skill.prompts.length === 0) {
      warnings.push('prompts数组为空，建议至少包含一个Prompt模板')
    }
  }
  
  // 6. 验证工作流步骤顺序
  if (skill.workflow && Array.isArray(skill.workflow)) {
    const steps = skill.workflow
      .filter((w: any) => typeof w.step === 'number')
      .map((w: any) => w.step)
    
    if (steps.length > 0) {
      // 检查是否从1开始
      if (steps[0] !== 1) {
        errors.push('workflow步骤必须从1开始')
      }
      
      // 检查是否连续递增
      const sortedSteps = [...steps].sort((a, b) => a - b)
      for (let i = 0; i < sortedSteps.length; i++) {
        if (sortedSteps[i] !== i + 1) {
          errors.push('workflow步骤必须连续递增，不能跳过步骤')
          break
        }
      }
      
      // 检查是否有重复步骤
      const uniqueSteps = new Set(steps)
      if (uniqueSteps.size !== steps.length) {
        errors.push('workflow中存在重复的步骤编号')
      }
    } else {
      errors.push('workflow中没有有效的步骤编号')
    }
    
    // 检查每步骤是否有name和description
    for (let i = 0; i < skill.workflow.length; i++) {
      const step = skill.workflow[i]
      if (!step.name || typeof step.name !== 'string') {
        errors.push(`workflow[${i}]缺少name字段`)
      }
      if (!step.description || typeof step.description !== 'string') {
        errors.push(`workflow[${i}]缺少description字段`)
      }
    }
  }
  
  // 7. 验证质量标准格式
  if (skill.qualityStandard && typeof skill.qualityStandard === 'object') {
    // 质量标准对象可以为空或包含任意字段
    // 只需要验证它是对象类型即可
  }
  
  // 8. 检查可选字段
  if (skill.visibility) {
    if (!['private', 'community', 'public'].includes(skill.visibility)) {
      warnings.push(`visibility字段值无效: ${skill.visibility}（建议使用'private'、'community'或'public'）`)
    }
  }
  
  if (skill.license && typeof skill.license !== 'string') {
    warnings.push('license字段应该是字符串类型')
  }
  
  return {
    valid: errors.length === 0,
    skillName,
    errors,
    warnings
  }
}

/**
 * 格式化验证结果输出
 * 
 * @param result 验证结果
 * @param filePath 文件路径
 * @returns 格式化字符串
 */
export function formatValidationOutput(result: ValidationResult, filePath: string): string {
  const lines: string[] = []
  
  // 文件信息
  const filename = path.basename(filePath)
  lines.push('')
  lines.push(chalk.cyan(`Skill文件: ${filename}`))
  lines.push(chalk.gray('─'.repeat(60)))
  
  if (result.valid) {
    // 验证通过
    lines.push(chalk.green('✅ 验证通过'))
    lines.push('')
    
    if (result.skillName) {
      lines.push(chalk.white(`Skill名称: ${result.skillName}`))
    }
    
    if (result.warnings.length > 0) {
      lines.push('')
      lines.push(chalk.yellow('⚠️ 警告:'))
      for (const warning of result.warnings) {
        lines.push(`  • ${warning}`)
      }
    }
  } else {
    // 验证失败
    lines.push(chalk.red('❌ 验证失败'))
    lines.push('')
    
    lines.push(chalk.red('错误:'))
    for (const error of result.errors) {
      lines.push(`  • ${error}`)
    }
    
    if (result.warnings.length > 0) {
      lines.push('')
      lines.push(chalk.yellow('⚠️ 警告:'))
      for (const warning of result.warnings) {
        lines.push(`  • ${warning}`)
      }
    }
  }
  
  lines.push('')
  
  return lines.join('\n')
}

/**
 * 验证一组Skill文件
 * 
 * @param filePaths 文件路径数组
 * @returns 验证结果数组
 */
export function validateMultipleFiles(filePaths: string[]): ValidationResult[] {
  return filePaths.map(filePath => validateSkillFile(filePath))
}

// CLI命令处理器
export async function handler(filePath: string): Promise<void> {
  try {
    // 验证文件路径
    if (!filePath) {
      console.log(chalk.red('错误: 请提供Skill文件路径'))
      console.log('用法: aipm skill validate <file>')
      process.exit(1)
    }
    
    // 执行验证
    const result = validateSkillFile(filePath)
    
    // 输出结果
    console.log(formatValidationOutput(result, filePath))
    
    // 退出码
    process.exit(result.valid ? 0 : 1)
  } catch (error) {
    console.error(chalk.red('验证过程出错:'), (error as Error).message)
    process.exit(1)
  }
}
