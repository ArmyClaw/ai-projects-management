import chalk from 'chalk'

/**
 * 项目数据类型
 */
interface Project {
  id: string
  name: string
  budget: string
  status: string
  progress: number
  taskCount: number
  createdAt: string
}

/**
 * 模拟项目数据
 */
const mockProjects: Record<string, Project> = {
  'proj_001': {
    id: 'proj_001',
    name: '数据分析平台',
    budget: '¥5,000',
    status: '进行中',
    progress: 65,
    taskCount: 8,
    createdAt: '2026-02-01'
  },
  'proj_002': {
    id: 'proj_002',
    name: '智能客服系统',
    budget: '¥8,000',
    status: '可认领',
    progress: 0,
    taskCount: 12,
    createdAt: '2026-02-15'
  },
  'proj_003': {
    id: 'proj_003',
    name: 'AI代码审查工具',
    budget: '¥3,000',
    status: '已完成',
    progress: 100,
    taskCount: 5,
    createdAt: '2026-01-20'
  }
}

/**
 * 获取项目详情
 * 
 * @param projectId - 项目ID
 * @returns 项目详情对象，如果不存在返回null
 */
function getProjectById(projectId: string): Project | null {
  return mockProjects[projectId] || null
}

/**
 * 格式化项目详情输出
 * 
 * @param project - 项目对象
 * @returns 格式化后的字符串
 */
function formatProjectInfo(project: Project): string {
  // 状态颜色映射
  const statusColor = 
    project.status === '可认领' ? chalk.green :
    project.status === '进行中' ? chalk.yellow :
    project.status === '已完成' ? chalk.cyan :
    chalk.gray
  
  const progressBar = `${project.progress}%`
  
  let output = chalk.blue('📋 项目详情\n')
  output += chalk.gray('─'.repeat(50)) + '\n'
  output += chalk.cyan('ID:       ') + project.id + '\n'
  output += chalk.cyan('名称:     ') + project.name + '\n'
  output += chalk.cyan('预算:     ') + project.budget + '\n'
  output += chalk.cyan('状态:     ') + statusColor(project.status) + '\n'
  output += chalk.cyan('进度:     ') + progressBar + '\n'
  output += chalk.cyan('任务数:   ') + project.taskCount + '\n'
  output += chalk.cyan('创建时间: ') + project.createdAt + '\n'
  output += chalk.gray('─'.repeat(50))
  
  return output
}

/**
 * 项目详情命令处理器
 * 
 * 显示指定项目的详细信息
 * 
 * @param projectId - 项目ID
 */
export async function handler(projectId: string): Promise<void> {
  const project = getProjectById(projectId)
  
  if (!project) {
    console.error(
      chalk.red('错误: ') + chalk.yellow(`项目 "${projectId}" 不存在`)
    )
    return
  }
  
  console.log(formatProjectInfo(project))
}
