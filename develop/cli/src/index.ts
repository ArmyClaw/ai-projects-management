#!/usr/bin/env node

import { Command } from 'commander'
import inquirer from 'inquirer'
import chalk from 'chalk'

const program = new Command()

program
  .name('aipm')
  .description('AI Project Management CLI')
  .version('0.0.0')

/**
 * 模拟任务数据类型
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
 * 获取模拟任务列表
 * 
 * @returns 模拟任务数组
 */
function getMockTasks(): Task[] {
  return [
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
}

/**
 * 格式化任务列表输出
 * 
 * @param tasks 任务数组
 * @returns 格式化后的字符串
 */
function formatTaskList(tasks: Task[]): string {
  if (tasks.length === 0) {
    return chalk.yellow('暂无任务')
  }

  let output = chalk.blue('📋 任务列表\n')
  output += chalk.gray('─'.repeat(60)) + '\n'
  
  // 表头
  output += chalk.bold(
    `${chalk.cyan('ID').padEnd(12)}${chalk.cyan('项目名称').padEnd(20)}${chalk.cyan('预算').padEnd(12)}${chalk.cyan('状态').padEnd(10)}`
  ) + '\n'
  output += chalk.gray('─'.repeat(60)) + '\n'
  
  // 任务行
  for (const task of tasks) {
    const statusColor = 
      task.status === '可认领' ? chalk.green :
      task.status === '进行中' ? chalk.yellow :
      chalk.gray
    
    output += 
      task.id.padEnd(12) +
      task.projectName.substring(0, 18).padEnd(20) +
      task.budget.padEnd(12) +
      statusColor(task.status).padEnd(10) +
      '\n'
  }
  
  output += chalk.gray('─'.repeat(60)) + '\n'
  output += chalk.gray(`共 ${tasks.length} 个任务`)
  
  return output
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
 * 认领任务
 * 
 * @param id 任务ID
 * @param tasks 任务列表
 * @returns 认领结果对象
 */
function claimTask(id: string, tasks: Task[]): { success: boolean; message: string; task?: Task } {
  const task = tasks.find(t => t.id === id)
  
  if (!task) {
    return { success: false, message: `任务 ${id} 不存在` }
  }
  
  if (task.status !== '可认领') {
    return { success: false, message: `任务 ${id} 已被认领或已完成` }
  }
  
  return { success: true, message: `成功认领任务 ${id}`, task }
}

/**
 * 提交任务
 * 
 * @param id 任务ID
 * @param tasks 任务列表
 * @returns 提交结果对象
 */
function submitTask(id: string, tasks: Task[]): { success: boolean; message: string; task?: Task } {
  const task = tasks.find(t => t.id === id)
  
  if (!task) {
    return { success: false, message: `任务 ${id} 不存在` }
  }
  
  if (task.status === '可认领') {
    return { success: false, message: `任务 ${id} 未被认领，无法提交` }
  }
  
  return { success: true, message: `成功提交任务 ${id}`, task }
}

// 任务命令
const taskCommand = new Command('task').description('Task management')

taskCommand
  .command('list').description('List available tasks').action(async () => {
    const tasks = getMockTasks()
    console.log(formatTaskList(tasks))
  })

taskCommand
  .command('claim <id>').description('Claim a task').action(async (id) => {
    const tasks = getMockTasks()
    const result = claimTask(id, tasks)
    
    if (result.success) {
      console.log(chalk.green(`✅ ${result.message}`))
      console.log(formatTaskDetail(result.task!))
    } else {
      console.log(chalk.red(`❌ ${result.message}`))
      process.exit(1)
    }
  })

taskCommand
  .command('submit <id>').description('Submit task completion').action(async (id) => {
    const tasks = getMockTasks()
    const result = submitTask(id, tasks)
    
    if (result.success) {
      console.log(chalk.green(`✅ ${result.message}`))
      console.log(formatTaskDetail(result.task!))
    } else {
      console.log(chalk.red(`❌ ${result.message}`))
      process.exit(1)
    }
  })

program.addCommand(taskCommand)

// 项目命令
program
  .command('project')
  .description('Project management')
  .addCommand(
    new Command('list').description('List my projects').action(async () => {
      console.log(chalk.blue('📁 Project List'))
    })
  )
  .addCommand(
    new Command('info <id>').description('Show project details').action(async (id) => {
      console.log(chalk.blue(`📄 Project ${id} details`))
    })
  )

// Skill命令
program
  .command('skill')
  .description('Skill management')
  .addCommand(
    new Command('list').description('List my skills').action(async () => {
      console.log(chalk.blue('🛠️ Skill List'))
    })
  )
  .addCommand(
    new Command('export <id>').description('Export skill as prompt').action(async (id) => {
      console.log(chalk.blue(`📤 Exporting skill ${id}`))
    })
  )

// 验收命令
program
  .command('review')
  .description('Review tasks')
  .addCommand(
    new Command('status').description('Check review status').action(async () => {
      console.log(chalk.blue('📝 Review Status'))
    })
  )

// 交互式菜单
program
  .command('interactive')
  .description('Interactive mode')
  .action(async () => {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What do you want to do?',
        choices: [
          { name: '📋 List Tasks', value: 'task-list' },
          { name: '📁 List Projects', value: 'project-list' },
          { name: '🛠️ List Skills', value: 'skill-list' },
          { name: '📝 Check Reviews', value: 'review-status' },
          { name: '🚪 Exit', value: 'exit' }
        ]
      }
    ])

    if (action !== 'exit') {
      console.log(chalk.yellow(`Selected: ${action}`))
    }
  })

program.parse()
