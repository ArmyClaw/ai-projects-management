/**
 * Task Detail 命令处理器
 * 
 * 功能：显示任务的完整详细信息
 * 命令格式：aipm task detail <id>
 */

import chalk from 'chalk'

/**
 * 任务数据类型
 */
interface Task {
  id: string
  projectName: string
  budget: string
  status: string
  skills: string[]
  deadline: string
}

/**
 * 模拟任务列表
 */
const mockTasks: Task[] = [
  {
    id: 'task_001',
    projectName: 'AI代码审查工具',
    budget: '¥3,000',
    status: '可认领',
    skills: ['Python', 'FastAPI'],
    deadline: '2026-02-25'
  },
  {
    id: 'task_002',
    projectName: '智能客服系统',
    budget: '¥4,000',
    status: '可认领',
    skills: ['React', 'TypeScript'],
    deadline: '2026-02-28'
  },
  {
    id: 'task_003',
    projectName: '数据分析平台',
    budget: '¥2,500',
    status: '进行中',
    skills: ['Python', 'Pandas'],
    deadline: '2026-02-20'
  }
]

/**
 * 获取任务详情
 * 
 * @param id 任务ID
 * @returns 任务对象，如果不存在则返回undefined
 */
function getTaskById(id: string): Task | undefined {
  return mockTasks.find(task => task.id === id)
}

/**
 * 格式化任务详情输出
 * 
 * @param task 任务对象
 * @returns 格式化后的字符串
 */
function formatTaskDetail(task: Task): string {
  const statusColor = 
    task.status === '可认领' ? chalk.green :
    task.status === '进行中' ? chalk.yellow :
    chalk.gray

  let output = chalk.blue('🎯 任务详情\n')
  output += chalk.gray('─'.repeat(50)) + '\n'
  output += `${chalk.cyan('ID')}: ${task.id}\n`
  output += `${chalk.cyan('项目名称')}: ${task.projectName}\n`
  output += `${chalk.cyan('预算')}: ${task.budget}\n`
  output += `${chalk.cyan('状态')}: ${statusColor(task.status)}\n`
  output += `${chalk.cyan('所需技能')}: ${task.skills.join(', ')}\n`
  output += `${chalk.cyan('截止日期')}: ${task.deadline}\n`
  output += chalk.gray('─'.repeat(50))
  
  return output
}

/**
 * 命令处理器
 * 
 * @param id 任务ID
 */
export async function handler(id: string): Promise<void> {
  if (!id) {
    console.log(chalk.red('❌ 请提供任务ID'))
    console.log(chalk.yellow('用法: aipm task detail <id>'))
    process.exit(1)
  }

  const task = getTaskById(id)
  
  if (!task) {
    console.log(chalk.red(`❌ 任务 ${id} 不存在`))
    process.exit(1)
  }

  console.log(formatTaskDetail(task))
}
