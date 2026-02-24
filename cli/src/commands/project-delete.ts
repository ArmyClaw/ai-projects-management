/**
 * Project Delete Command Handler
 * 
 * 项目删除命令处理器
 * 
 * 功能：
 * - 支持通过项目ID删除项目
 * - 添加确认机制防止误删
 * - 验证项目状态（仅允许删除草稿或已完成项目）
 * 
 * 使用方式：
 * ```bash
 * aipm project delete <projectId>
 * ```
 * 
 * 示例：
 * ```bash
 * aipm project delete proj_001
 * ```
 */

import chalk from 'chalk'
import inquirer from 'inquirer'

/**
 * 项目状态枚举
 */
type ProjectStatus = 'draft' | 'active' | 'completed'

/**
 * 项目数据结构
 */
interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  budget: string
  createdAt: string
}

/**
 * 获取模拟项目数据
 * 
 * @param projectId - 项目ID
 * @returns 项目数据或null（如果不存在）
 */
function getMockProject(projectId: string): Project | null {
  const projects: Project[] = [
    {
      id: 'proj_001',
      name: '数据分析平台',
      description: '企业级数据分析平台开发',
      status: 'active',
      budget: '¥5,000',
      createdAt: '2026-02-01'
    },
    {
      id: 'proj_002',
      name: '智能客服系统',
      description: '基于AI的智能客服解决方案',
      status: 'active',
      budget: '¥8,000',
      createdAt: '2026-02-15'
    },
    {
      id: 'proj_003',
      name: 'AI代码审查工具',
      description: '自动化代码审查和质量检查工具',
      status: 'completed',
      budget: '¥3,000',
      createdAt: '2026-01-20'
    },
    {
      id: 'proj_draft',
      name: '测试项目',
      description: '草稿状态测试项目',
      status: 'draft',
      budget: '¥1,000',
      createdAt: '2026-02-18'
    }
  ]
  
  return projects.find(p => p.id === projectId) || null
}

/**
 * 验证项目ID格式
 * 
 * @param projectId - 项目ID
 * @returns 是否为有效的ID格式
 */
function isValidProjectId(projectId: string): boolean {
  return projectId && projectId.length > 0 && /^[a-zA-Z0-9_-]+$/.test(projectId)
}

/**
 * 显示项目信息
 * 
 * @param project - 项目数据
 */
function displayProjectInfo(project: Project): void {
  console.log(chalk.blue('\n📁 项目信息'))
  console.log(chalk.gray('─'.repeat(50)))
  console.log(`${chalk.cyan('项目ID:')}${project.id}`)
  console.log(`${chalk.cyan('项目名称:')}${project.name}`)
  console.log(`${chalk.cyan('项目描述:')}${project.description}`)
  console.log(`${chalk.cyan('预算:')}${project.budget}`)
  console.log(`${chalk.cyan('状态:')}${formatStatus(project.status)}`)
  console.log(`${chalk.cyan('创建时间:')}${project.createdAt}`)
  console.log(chalk.gray('─'.repeat(50)))
}

/**
 * 格式化状态显示
 * 
 * @param status - 项目状态
 * @returns 格式化后的状态字符串
 */
function formatStatus(status: ProjectStatus): string {
  const statusMap: Record<ProjectStatus, string> = {
    draft: chalk.yellow('草稿'),
    active: chalk.red('进行中'),
    completed: chalk.cyan('已完成')
  }
  
  return statusMap[status] || status
}

/**
 * 检查是否可以删除项目
 * 
 * @param project - 项目数据
 * @returns 是否允许删除
 */
function canDeleteProject(project: Project): { allowed: boolean; reason?: string } {
  // 进行中的项目不允许删除
  if (project.status === 'active') {
    return {
      allowed: false,
      reason: `项目 "${project.name}" 正在进行中，无法删除`
    }
  }
  
  // 草稿和已完成状态可以删除
  return { allowed: true }
}

/**
 * 删除项目
 * 
 * @param projectId - 项目ID
 * @returns 删除是否成功
 */
function deleteProject(projectId: string): boolean {
  // 在实际应用中，这里会调用API删除数据库中的记录
  // 当前为模拟实现
  console.log(chalk.green(`✅ 项目 "${projectId}" 已成功删除`))
  return true
}

/**
 * 项目删除命令处理器
 * 
 * 支持以下功能：
 * - 验证项目ID格式
 * - 检查项目是否存在
 * - 验证项目状态（仅允许删除草稿或已完成项目）
 * - 显示删除确认提示
 * - 执行删除操作
 * 
 * 退出码：
 * - 0: 删除成功
 * - 1: 项目不存在、状态不允许或用户取消
 * 
 * @param projectId - 要删除的项目ID（可选，不传入时显示错误）
 */
export async function handler(projectId?: string): Promise<void> {
  // 参数验证
  if (!projectId) {
    console.error(chalk.red('❌ 错误: 请提供项目ID'))
    console.log(chalk.gray('使用方式: aipm project delete <projectId>'))
    console.log(chalk.gray('示例: aipm project delete proj_001'))
    process.exit(1)
  }
  
  // 验证ID格式
  if (!isValidProjectId(projectId)) {
    console.error(chalk.red('❌ 错误: 无效的项目ID格式'))
    console.log(chalk.gray('项目ID只能包含字母、数字、下划线和连字符'))
    process.exit(1)
  }
  
  // 获取项目信息
  const project = getMockProject(projectId)
  
  // 检查项目是否存在
  if (!project) {
    console.error(chalk.red(`❌ 错误: 项目 "${projectId}" 不存在`))
    process.exit(1)
  }
  
  // 显示项目信息
  displayProjectInfo(project)
  
  // 检查是否可以删除
  const { allowed, reason } = canDeleteProject(project)
  
  if (!allowed) {
    console.error(chalk.red(`❌ 无法删除项目`))
    console.error(chalk.red(reason!))
    process.exit(1)
  }
  
  // 对于草稿或已完成项目，需要确认
  if (project.status === 'draft' || project.status === 'completed') {
    console.log(chalk.yellow(`⚠️  警告: 删除项目后将无法恢复`))
    
    try {
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `确定要删除项目 "${project.name}" 吗？`,
          default: false
        }
      ])
      
      if (!answers.confirm) {
        console.info(chalk.gray('已取消删除操作'))
        process.exit(0)
      }
    } catch (error) {
      console.error(chalk.red('❌ 确认过程中发生错误'))
      process.exit(1)
    }
  }
  
  // 执行删除
  console.log(chalk.blue('\n🗑️  正在删除项目...'))
  const success = deleteProject(projectId)
  
  if (success) {
    console.log(chalk.green('\n✅ 删除成功'))
    console.log(chalk.gray(`已删除项目: ${project.name} (${projectId})`))
    process.exit(0)
  } else {
    console.error(chalk.red('\n❌ 删除失败'))
    process.exit(1)
  }
}
