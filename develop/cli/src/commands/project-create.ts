/**
 * Project Create命令处理器
 * 
 * 功能：
 * 1. 验证项目参数
 * 2. 生成项目配置
 * 3. 输出创建结果
 */

import chalk from 'chalk'

/**
 * 项目创建参数
 */
export interface ProjectCreateParams {
  name: string
  description: string
  gitUrl?: string
  tags?: string[]
}

/**
 * 项目创建结果
 */
export interface ProjectCreateResult {
  success: boolean
  projectId?: string
  projectName: string
  message: string
  config?: Record<string, any>
}

/**
 * 验证项目名称
 * 
 * @param name 项目名称
 * @returns 验证结果对象
 */
export function validateProjectName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: '项目名称不能为空' }
  }
  
  if (name.trim().length < 3) {
    return { valid: false, error: '项目名称至少3个字符' }
  }
  
  if (name.trim().length > 50) {
    return { valid: false, error: '项目名称不能超过50个字符' }
  }
  
  // 允许中文、英文、数字、下划线、中划线、空格
  const validPattern = /^[\u4e00-\u9fa5a-zA-Z0-9_ -]+$/
  if (!validPattern.test(name.trim())) {
    return { valid: false, error: '项目名称只能包含中文、英文、数字、下划线和中划线' }
  }
  
  return { valid: true }
}

/**
 * 验证项目描述
 * 
 * @param description 项目描述
 * @returns 验证结果对象
 */
export function validateProjectDescription(description: string): { valid: boolean; error?: string } {
  if (!description || description.trim().length === 0) {
    return { valid: false, error: '项目描述不能为空' }
  }
  
  if (description.trim().length < 10) {
    return { valid: false, error: '项目描述至少10个字符' }
  }
  
  if (description.trim().length > 500) {
    return { valid: false, error: '项目描述不能超过500个字符' }
  }
  
  return { valid: true }
}

/**
 * 验证Git仓库URL
 * 
 * @param url Git仓库URL
 * @returns 验证结果对象
 */
export function validateGitUrl(url: string): { valid: boolean; error?: string } {
  if (!url || url.trim().length === 0) {
    // Git URL是可选的
    return { valid: true }
  }
  
  // 支持HTTPS和SSH格式
  const httpsPattern = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\.git)?$/
  const sshPattern = /^git@github\.com:[\w.-]+\/[\w.-]+(\.git)?$/
  
  if (!httpsPattern.test(url) && !sshPattern.test(url)) {
    return { valid: false, error: 'Git仓库URL格式无效（支持HTTPS/SSH格式）' }
  }
  
  return { valid: true }
}

/**
 * 生成项目ID
 * 
 * @param name 项目名称
 * @returns 项目ID
 */
export function generateProjectId(name: string): string {
  const timestamp = Date.now().toString(36).substring(0, 8)
  const slug = name.toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w-]/g, '')
    .substring(0, 16)
  return `proj_${slug}_${timestamp}`
}

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
  output += '─'.repeat(50) + '\n'
  output += `项目ID: ${result.projectId}\n`
  output += `项目名称: ${result.projectName}\n`
  
  if (result.config?.gitUrl) {
    output += `Git仓库: ${result.config.gitUrl}\n`
  }
  
  output += '─'.repeat(50)
  
  return output
}

/**
 * 主处理函数
 * 
 * @param params 项目创建参数
 * @returns 创建结果对象
 */
export async function handler(params: ProjectCreateParams): Promise<ProjectCreateResult> {
  try {
    // 验证项目名称
    const nameValidation = validateProjectName(params.name)
    if (!nameValidation.valid) {
      return {
        success: false,
        projectName: params.name,
        message: nameValidation.error || '项目名称验证失败'
      }
    }
    
    // 验证项目描述
    const descValidation = validateProjectDescription(params.description)
    if (!descValidation.valid) {
      return {
        success: false,
        projectName: params.name,
        message: descValidation.error || '项目描述验证失败'
      }
    }
    
    // 验证Git URL（如果提供）
    if (params.gitUrl) {
      const gitValidation = validateGitUrl(params.gitUrl)
      if (!gitValidation.valid) {
        return {
          success: false,
          projectName: params.name,
          message: gitValidation.error || 'Git仓库URL验证失败'
        }
      }
    }
    
    // 生成项目配置
    const config = createProjectConfig(params)
    
    // 输出成功信息
    console.log(chalk.green('✅ 项目创建成功'))
    console.log(chalk.gray('─'.repeat(50)))
    console.log(`${chalk.cyan('项目ID')}: ${config.id}`)
    console.log(`${chalk.cyan('项目名称')}: ${config.name}`)
    console.log(`${chalk.cyan('描述')}: ${config.description.substring(0, 60)}${config.description.length > 60 ? '...' : ''}`)
    
    if (config.gitUrl) {
      console.log(`${chalk.cyan('Git仓库')}: ${config.gitUrl}`)
    }
    
    console.log(`${chalk.cyan('状态')}: ${chalk.green('active')}`)
    console.log(chalk.gray('─'.repeat(50)))
    
    return {
      success: true,
      projectId: config.id,
      projectName: config.name,
      message: '项目创建成功',
      config
    }
  } catch (error) {
    return {
      success: false,
      projectName: params.name,
      message: `创建失败: ${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}
