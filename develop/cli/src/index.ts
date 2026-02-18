#!/usr/bin/env node

import { Command } from 'commander'
import inquirer from 'inquirer'
import chalk from 'chalk'

const program = new Command()

program
  .name('aipm')
  .description('AI Project Management CLI')
  .version('0.0.0')

// 任务命令
program
  .command('task')
  .description('Task management')
  .addCommand(
    new Command('list').description('List available tasks').action(async () => {
      console.log(chalk.blue('📋 Task List'))
      console.log('Fetching tasks...')
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
