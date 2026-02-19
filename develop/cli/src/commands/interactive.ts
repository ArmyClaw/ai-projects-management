/**
 * Interactive Mode Command Handler
 * 
 * Provides an interactive menu for common operations
 */
import inquirer from 'inquirer'
import chalk from 'chalk'

/**
 * Menu action types
 */
type MenuAction = 
  | 'task-list' 
  | 'task-claim' 
  | 'task-submit'
  | 'project-list' 
  | 'project-info'
  | 'skill-list' 
  | 'skill-export'
  | 'review-status'
  | 'exit'

/**
 * Menu choice interface
 */
interface MenuChoice {
  /** Display name shown in menu */
  name: string
  /** Internal action value */
  value: MenuAction
  /** Short description */
  description?: string
}

/**
 * Interactive menu configuration
 * 
 * Defines all available menu options and their behavior
 */
const menuChoices: MenuChoice[] = [
  {
    name: '📋 任务列表',
    value: 'task-list',
    description: '查看可认领的任务列表'
  },
  {
    name: '🎯 认领任务',
    value: 'task-claim',
    description: '认领一个任务'
  },
  {
    name: '📝 提交任务',
    value: 'task-submit',
    description: '提交已完成的任务'
  },
  {
    name: '📁 项目列表',
    value: 'project-list',
    description: '查看我的项目'
  },
  {
    name: '🏷️ 项目详情',
    value: 'project-info',
    description: '查看项目详细信息'
  },
  {
    name: '🛠️ 技能列表',
    value: 'skill-list',
    description: '查看我的技能'
  },
  {
    name: '📤 导出技能',
    value: 'skill-export',
    description: '导出技能为提示词'
  },
  {
    name: '✅ 验收状态',
    value: 'review-status',
    description: '查看验收进度'
  },
  {
    name: '🚪 退出',
    value: 'exit',
    description: '退出交互式菜单'
  }
]

/**
 * Display welcome banner
 * 
 * Shows the interactive menu welcome message
 */
function showWelcomeBanner(): void {
  console.log(chalk.blue('\n╔══════════════════════════════════════════════════════════╗'))
  console.log(chalk.blue('║          AI Project Management - 交互式菜单          ║'))
  console.log(chalk.blue('╚══════════════════════════════════════════════════════════╝'))
  console.log(chalk.gray('─'.repeat(60)) + '\n')
}

/**
 * Display exit message
 * 
 * Shows goodbye message when exiting
 */
function showExitMessage(): void {
  console.log(chalk.gray('─'.repeat(60)))
  console.log(chalk.yellow('👋 感谢使用，再见！\n'))
}

/**
 * Handle menu selection
 * 
 * Processes the selected menu action and executes the appropriate command
 * 
 * @param action - The selected menu action
 * @returns True if menu should continue, false to exit
 */
async function handleSelection(action: MenuAction): Promise<boolean> {
  // Handle exit action
  if (action === 'exit') {
    showExitMessage()
    return false
  }

  // Display selected action (in production, would execute actual commands)
  const choice = menuChoices.find(c => c.value === action)
  if (choice) {
    console.log(chalk.cyan(`\n▶ 执行: ${choice.name}`))
    console.log(chalk.gray(`  ${choice.description}\n`))
  }

  // In development mode, just show which action was selected
  // In production, would call the appropriate command handlers
  return true
}

/**
 * Main interactive menu handler
 * 
 * Displays an interactive menu for common AI Project Management operations.
 * Users can navigate using arrow keys and select options with Enter.
 * 
 * @returns Promise resolving to false when user exits, true otherwise
 */
export async function handler(): Promise<boolean> {
  // Display welcome banner
  showWelcomeBanner()

  // Main menu prompt configuration
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: chalk.cyan('请选择操作:'),
      choices: menuChoices,
      pageSize: 10,
      loop: true,
      prefix: chalk.green('➤ ')
    }
  ])

  // Process user selection
  const shouldContinue = await handleSelection(action as MenuAction)

  return shouldContinue
}

// Export menu choices for testing
export { menuChoices }
