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

// 任务命令
program
  .command('task')
  .description('Task management')
  .addCommand(
    new Command('list').description('List available tasks').action(async () => {
      const tasks = getMockTasks()
      console.log(formatTaskList(tasks))
    })
  )
  .addCommand(
    new Command('claim <id>').description('Claim a task').action(async (id) => {
      console.log(chalk.blue(`🎯 Claiming task ${id}`))
    })
  )
  .addCommand(
    new Command('submit <id>').description('Submit task completion').action(async (id) => {
      console.log(chalk.blue(`✅ Submitting task ${id}`))
    })
  )

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
