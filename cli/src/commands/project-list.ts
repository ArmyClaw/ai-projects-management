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
 * 获取模拟项目列表
 * 
 * @returns 模拟项目数组
 */
function getMockProjects(): Project[] {
  return [
    {
      id: 'proj_001',
      name: '数据分析平台',
      budget: '¥5,000',
      status: '进行中',
      progress: 65,
      taskCount: 8,
      createdAt: '2026-02-01'
    },
    {
      id: 'proj_002',
      name: '智能客服系统',
      budget: '¥8,000',
      status: '可认领',
      progress: 0,
      taskCount: 12,
      createdAt: '2026-02-15'
    },
    {
      id: 'proj_003',
      name: 'AI代码审查工具',
      budget: '¥3,000',
      status: '已完成',
      progress: 100,
      taskCount: 5,
      createdAt: '2026-01-20'
    }
  ]
}

/**
 * 格式化项目列表输出
 * 
 * @param projects 项目数组
 * @returns 格式化后的字符串
 */
function formatProjectList(projects: Project[]): string {
  if (projects.length === 0) {
    return chalk.yellow('暂无项目')
  }

  let output = chalk.blue('📁 项目列表\n')
  output += chalk.gray('─'.repeat(70)) + '\n'
  
  // 表头
  output += chalk.bold(
    `${chalk.cyan('ID').padEnd(12)}${chalk.cyan('项目名称').padEnd(20)}${chalk.cyan('预算').padEnd(12)}${chalk.cyan('状态').padEnd(10)}${chalk.cyan('进度').padEnd(8)}`
  ) + '\n'
  output += chalk.gray('─'.repeat(70)) + '\n'
  
  // 项目行
  for (const project of projects) {
    const statusColor = 
      project.status === '可认领' ? chalk.green :
      project.status === '进行中' ? chalk.yellow :
      project.status === '已完成' ? chalk.cyan :
      chalk.gray
    
    const progressBar = `${project.progress}%`
    
    output += 
      project.id.padEnd(12) +
      project.name.substring(0, 18).padEnd(20) +
      project.budget.padEnd(12) +
      statusColor(project.status).padEnd(10) +
      progressBar.padEnd(8) +
      '\n'
  }
  
  output += chalk.gray('─'.repeat(70)) + '\n'
  output += chalk.gray(`共 ${projects.length} 个项目`)
  
  return output
}

/**
 * 项目列表命令处理器
 * 
 * 显示当前用户的所有项目列表
 */
export async function handler(): Promise<void> {
  const projects = getMockProjects()
  console.log(formatProjectList(projects))
}
