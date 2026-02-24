import chalk from 'chalk'

/**
 * Skill数据类型
 */
interface Skill {
  id: string
  name: string
  description: string
  rating: number
  usageCount: number
  category: string
}

/**
 * 获取模拟Skill列表
 * 
 * @returns 模拟Skill数组
 */
function getMockSkills(): Skill[] {
  return [
    {
      id: 'skill_001',
      name: 'Weather查询',
      description: '查询当前天气和天气预报',
      rating: 4.8,
      usageCount: 156,
      category: '实用工具'
    },
    {
      id: 'skill_002',
      name: 'AI编程助手',
      description: '提供编程建议和代码审查',
      rating: 4.5,
      usageCount: 234,
      category: '开发工具'
    },
    {
      id: 'skill_003',
      name: '翻译助手',
      description: '多语言翻译支持',
      rating: 4.2,
      usageCount: 89,
      category: '实用工具'
    }
  ]
}

/**
 * 格式化评分显示（转换为星级）
 * 
 * @param rating 评分值（0-5）
 * @returns 星级字符串
 */
function formatRating(rating: number): string {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
  
  return '★'.repeat(fullStars) + 
         (hasHalfStar ? '⯪' : '') + 
         '☆'.repeat(emptyStars)
}

/**
 * 格式化数字（添加千位分隔符）
 * 
 * @param num 数字
 * @returns 格式化后的字符串
 */
function formatNumber(num: number): string {
  return num.toLocaleString()
}

/**
 * 格式化Skill列表输出
 * 
 * @param skills Skill数组
 * @returns 格式化后的字符串
 */
function formatSkillList(skills: Skill[]): string {
  if (skills.length === 0) {
    return chalk.yellow('暂无Skill')
  }

  let output = chalk.blue('🛠️ 我的Skill列表\n')
  output += chalk.gray('─'.repeat(80)) + '\n'
  
  // 表头
  output += chalk.bold(
    `${chalk.cyan('ID').padEnd(12)}${chalk.cyan('名称').padEnd(16)}${chalk.cyan('评分').padEnd(10)}${chalk.cyan('使用次数').padEnd(12)}${chalk.cyan('分类')}`
  ) + '\n'
  output += chalk.gray('─'.repeat(80)) + '\n'
  
  // Skill行
  for (const skill of skills) {
    output += 
      skill.id.padEnd(12) +
      skill.name.substring(0, 14).padEnd(16) +
      `${formatRating(skill.rating)} ${skill.rating}`.padEnd(10) +
      formatNumber(skill.usageCount).padEnd(12) +
      skill.category +
      '\n' +
      chalk.gray(skill.description.substring(0, 60)) +
      '\n'
  }
  
  output += chalk.gray('─'.repeat(80)) + '\n'
  output += chalk.gray(`共 ${skills.length} 个Skill`)
  
  return output
}

/**
 * Skill列表命令处理器
 * 
 * 获取并显示当前用户的Skill列表
 * 
 * @example
 * ```bash
 * aipm skill list
 * ```
 */
export async function handler(): Promise<void> {
  const skills = getMockSkills()
  console.log(formatSkillList(skills))
}
