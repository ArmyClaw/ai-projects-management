import chalk from 'chalk'

/**
 * 验收任务数据类型
 */
interface ReviewTask {
  id: string
  projectName: string
  status: '待验收' | '已通过' | '需修改'
  budget: string
  skills: string[]
  reviewer: string
  submitTime: string
  feedback?: string
}

/**
 * 获取模拟验收任务列表
 * 
 * @returns 模拟验收任务数组
 */
function getMockReviewTasks(): ReviewTask[] {
  return [
    {
      id: 'review_001',
      projectName: 'AI代码审查工具',
      status: '待验收',
      budget: '¥3,000',
      skills: ['Python', 'FastAPI'],
      reviewer: '张三',
      submitTime: '2026-02-18 14:30'
    },
    {
      id: 'review_002',
      projectName: '智能客服系统',
      status: '已通过',
      budget: '¥4,000',
      skills: ['React', 'TypeScript'],
      reviewer: '李四',
      submitTime: '2026-02-17 10:20',
      feedback: '代码质量优秀，功能完整'
    },
    {
      id: 'review_003',
      projectName: '数据分析平台',
      status: '需修改',
      budget: '¥2,500',
      skills: ['Python', 'Pandas'],
      reviewer: '王五',
      submitTime: '2026-02-16 16:45',
      feedback: '缺少单元测试，请补充'
    },
    {
      id: 'review_004',
      projectName: '图像识别系统',
      status: '待验收',
      budget: '¥5,000',
      skills: ['TensorFlow', 'Python'],
      reviewer: '赵六',
      submitTime: '2026-02-18 09:15'
    },
    {
      id: 'review_005',
      projectName: '聊天机器人',
      status: '已通过',
      budget: '¥3,500',
      skills: ['Node.js', 'NLP'],
      reviewer: '钱七',
      submitTime: '2026-02-15 11:30',
      feedback: '功能符合需求，通过验收'
    }
  ]
}

/**
 * 格式化验收状态显示
 * 
 * @param status 验收状态
 * @returns 格式化后的状态字符串
 */
function formatReviewStatus(status: '待验收' | '已通过' | '需修改'): string {
  const statusConfig = {
    '待验收': { color: chalk.yellow, icon: '⏳' },
    '已通过': { color: chalk.green, icon: '✅' },
    '需修改': { color: chalk.red, icon: '⚠️' }
  }
  
  const config = statusConfig[status]
  return `${config.icon} ${config.color(status)}`
}

/**
 * 按状态分组统计任务数量
 * 
 * @param tasks 验收任务数组
 * @returns 各状态数量统计
 */
function countByStatus(tasks: ReviewTask[]): Record<string, number> {
  return {
    '待验收': tasks.filter(t => t.status === '待验收').length,
    '已通过': tasks.filter(t => t.status === '已通过').length,
    '需修改': tasks.filter(t => t.status === '需修改').length
  }
}

/**
 * 格式化验收状态列表输出
 * 
 * @param tasks 验收任务数组
 * @returns 格式化后的字符串
 */
function formatReviewList(tasks: ReviewTask[]): string {
  if (tasks.length === 0) {
    return chalk.yellow('暂无待验收任务')
  }

  const stats = countByStatus(tasks)
  
  let output = chalk.blue('📋 验收状态\n')
  output += chalk.gray('─'.repeat(80)) + '\n'
  
  // 统计信息
  output += chalk.bold('📊 统计：')
  output += chalk.yellow(`⏳ 待验收 ${stats['待验收']} `)
  output += chalk.green(`✅ 已通过 ${stats['已通过']} `)
  output += chalk.red(`⚠️ 需修改 ${stats['需修改']} `)
  output += '\n'
  
  output += chalk.gray('─'.repeat(80)) + '\n\n'
  
  // 按状态分组显示
  const statusGroups: Array<'待验收' | '已通过' | '需修改'> = ['待验收', '已通过', '需修改']
  
  for (const status of statusGroups) {
    const statusTasks = tasks.filter(t => t.status === status)
    
    if (statusTasks.length > 0) {
      output += formatReviewStatus(status) + '\n'
      output += chalk.gray('─'.repeat(60)) + '\n'
      
      // 表头
      output += chalk.bold(
        `${chalk.cyan('ID').padEnd(14)}${chalk.cyan('项目名称').padEnd(22)}${chalk.cyan('预算').padEnd(12)}${chalk.cyan('审核人')}`
      ) + '\n'
      
      // 任务行
      for (const task of statusTasks) {
        output += 
          task.id.padEnd(14) +
          task.projectName.substring(0, 20).padEnd(22) +
          task.budget.padEnd(12) +
          task.reviewer +
          '\n'
        
        // 显示提交时间和反馈（如果有）
        output += chalk.gray(`   提交时间: ${task.submitTime}`)
        if (task.feedback) {
          output += chalk.gray(` | 反馈: ${task.feedback}`)
        }
        output += '\n'
      }
      
      output += '\n'
    }
  }
  
  output += chalk.gray('─'.repeat(80)) + '\n'
  output += chalk.gray(`共 ${tasks.length} 个验收任务`)
  
  return output
}

/**
 * 验收状态命令处理器
 * 
 * 获取并显示当前用户的验收状态列表
 * 
 * @example
 * ```bash
 * aipm review status
 * ```
 */
export async function handler(): Promise<void> {
  const tasks = getMockReviewTasks()
  console.log(formatReviewList(tasks))
}
