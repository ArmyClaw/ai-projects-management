import * as fs from 'fs'
import * as path from 'path'
import chalk from 'chalk'

/**
 * Skill导入处理器
 * 
 * 功能：
 * 1. 读取JSON文件
 * 2. 解析并验证Skill Schema
 * 3. 提取Prompt变量
 * 4. 输出导入结果
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

export interface ImportResult {
  success: boolean
  skillName: string | null
  filePath: string
  tags: string[]
  promptCount: number
  workflowSteps: number
  error?: string
}

/**
 * 主处理函数
 * 
 * @param filePath Skill JSON文件路径
 * @returns 导入结果对象
 */
export async function handler(filePath: string): Promise<ImportResult> {
  try {
    // 验证文件是否存在
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        skillName: null,
        filePath,
        tags: [],
        promptCount: 0,
        workflowSteps: 0,
        error: `文件不存在: ${filePath}`
      }
    }

    // 验证文件扩展名
    if (!filePath.endsWith('.json')) {
      return {
        success: false,
        skillName: null,
        filePath,
        tags: [],
        promptCount: 0,
        workflowSteps: 0,
        error: 'Skill文件必须是JSON格式 (.json)'
      }
    }

    // 读取文件内容
    const content = fs.readFileSync(filePath, 'utf-8')
    
    // 解析JSON
    let skill: SkillDefinition
    try {
      skill = JSON.parse(content)
    } catch (e) {
      return {
        success: false,
        skillName: null,
        filePath,
        tags: [],
        promptCount: 0,
        workflowSteps: 0,
        error: 'JSON解析失败: 格式不正确'
      }
    }

    // 验证Skill Schema
    const validationError = validateSkillSchema(skill)
    if (validationError) {
      return {
        success: false,
        skillName: null,
        filePath,
        tags: [],
        promptCount: 0,
        workflowSteps: 0,
        error: validationError
      }
    }

    // 提取变量信息
    const variables = extractVariablesFromPrompts(skill.prompts)

    // 输出成功信息
    console.log(chalk.green('✅ Skill导入成功'))
    console.log(chalk.gray('─'.repeat(60)))
    console.log(`${chalk.cyan('名称')}: ${skill.name}`)
    console.log(`${chalk.cyan('描述')}: ${skill.description}`)
    console.log(`${chalk.cyan('标签')}: ${skill.tags.join(', ')}`)
    console.log(`${chalk.cyan('Prompt数量')}: ${skill.prompts.length}`)
    console.log(`${chalk.cyan('工作流步骤')}: ${skill.workflow.length}`)
    console.log(`${chalk.cyan('变量')}: ${variables.join(', ')}`)
    console.log(chalk.gray('─'.repeat(60)))

    return {
      success: true,
      skillName: skill.name,
      filePath,
      tags: skill.tags,
      promptCount: skill.prompts.length,
      workflowSteps: skill.workflow.length
    }
  } catch (error) {
    return {
      success: false,
      skillName: null,
      filePath,
      tags: [],
      promptCount: 0,
      workflowSteps: 0,
      error: `导入失败: ${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

/**
 * 验证Skill Schema结构
 * 
 * @param skill Skill对象
 * @returns 错误信息（无错误返回null）
 */
export function validateSkillSchema(skill: any): string | null {
  // 检查必需字段
  if (!skill.name || typeof skill.name !== 'string') {
    return '缺少必需字段: name'
  }
  if (!skill.description || typeof skill.description !== 'string') {
    return '缺少必需字段: description'
  }
  if (!skill.tags || !Array.isArray(skill.tags)) {
    return '缺少必需字段: tags（必须为数组）'
  }
  if (!skill.prompts || !Array.isArray(skill.prompts)) {
    return '缺少必需字段: prompts（必须为数组）'
  }
  if (!skill.workflow || !Array.isArray(skill.workflow)) {
    return '缺少必需字段: workflow（必须为数组）'
  }
  if (!skill.qualityStandard || typeof skill.qualityStandard !== 'object') {
    return '缺少必需字段: qualityStandard（必须为对象）'
  }

  // 验证prompts数组中的每个元素
  if (skill.prompts.length > 0) {
    for (let i = 0; i < skill.prompts.length; i++) {
      const prompt = skill.prompts[i]
      if (!prompt.role) {
        return `prompts[${i}]: 缺少role字段`
      }
      if (!prompt.content || typeof prompt.content !== 'string') {
        return `prompts[${i}]: 缺少content字段`
      }
    }
  }

  // 验证workflow数组中的每个元素
  if (skill.workflow.length > 0) {
    for (let i = 0; i < skill.workflow.length; i++) {
      const step = skill.workflow[i]
      if (typeof step.step !== 'number') {
        return `workflow[${i}]: 缺少step字段`
      }
      if (!step.name || typeof step.name !== 'string') {
        return `workflow[${i}]: 缺少name字段`
      }
    }
  }

  return null
}

/**
 * 提取所有Prompt中的变量
 * 
 * @param prompts Prompt模板数组
 * @returns 变量名数组
 */
export function extractVariablesFromPrompts(prompts: PromptTemplate[]): string[] {
  const variables = new Set<string>()

  for (const prompt of prompts) {
    if (prompt.content) {
      const vars = extractVariables(prompt.content)
      vars.forEach(v => variables.add(v))
    }
  }

  return Array.from(variables)
}

/**
 * 从Prompt模板中提取变量
 * 支持Handlebars风格 {{variableName}} 语法
 * 
 * @param prompt Prompt模板
 * @returns 变量名数组
 */
export function extractVariables(prompt: string): string[] {
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
