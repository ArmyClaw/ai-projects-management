/**
 * Skill导出命令处理器
 * 
 * 功能：
 * - 导出指定ID的Skill详细信息
 * - 显示Skill的Prompt模板和使用示例
 * - 格式化为可读的报告格式
 * 
 * 使用方式：
 * - aipm skill export <id> - 导出指定Skill
 */

// ============================================================
// 类型定义
// ============================================================

/**
 * Skill数据结构
 */
interface Skill {
  /** Skill唯一标识符 */
  id: string
  /** Skill名称 */
  name: string
  /** Skill描述 */
  description: string
  /** 评分 (0-5) */
  rating: number
  /** 使用次数 */
  usageCount: number
  /** 分类标签 */
  category: string
  /** Prompt模板 */
  promptTemplate: string
  /** 使用示例数组 */
  examples: string[]
}

/**
 * handler函数参数
 */
interface ExportParams {
  /** 要导出的Skill ID */
  id: string | undefined
}

// ============================================================
// 模拟数据（后续替换为真实数据源）
// ============================================================

/**
 * Skill列表数据（模拟数据库）
 */
const skillsDatabase: Skill[] = [
  {
    id: 'skill_001',
    name: 'Weather查询',
    description: '查询当前天气和天气预报',
    rating: 4.8,
    usageCount: 156,
    category: '实用工具',
    promptTemplate: `# 天气查询工具

## 角色定义
你是一个专业的天气查询助手，能够为用户提供准确及时的天气信息。

## 工作流程
1. 用户询问天气时，首先确认需要查询的城市名称和日期
2. 使用天气API获取实时天气数据
3. 解析天气数据，提取关键信息：
   - 当前温度
   - 天气状况（晴/阴/雨/雪等）
   - 湿度
   - 风速
   - 紫外线指数
4. 生成友好的天气报告，包含：
   - 当日天气摘要
   - 未来几天预报
   - 生活建议（穿衣、出行等）

## 输出格式
- 清晰简洁的天气报告
- 使用emoji增强可读性
- 包含实用建议`,
    examples: [
      '"今天天气怎么样"',
      '"北京明天会下雨吗"',
      '"上海周末天气如何"'
    ]
  },
  {
    id: 'skill_002',
    name: 'AI编程助手',
    description: '提供编程建议和代码审查',
    rating: 4.5,
    usageCount: 234,
    category: '开发工具',
    promptTemplate: `# AI编程助手

## 角色定义
你是一位经验丰富的编程导师和代码审查专家。

## 工作流程
1. 分析用户提供的代码，理解代码逻辑和目的
2. 检查代码中的潜在问题：
   - 语法错误
   - 逻辑漏洞
   - 性能瓶颈
   - 安全风险
   - 编码规范
3. 提供改进建议，解释问题原因
4. 给出优化后的代码示例
5. 解释使用的设计模式和最佳实践

## 专业领域
- JavaScript/TypeScript
- Python
- Java
- Go
- Rust
- 数据库设计
- API设计
- 架构设计

## 输出要求
- 清晰的问题描述
- 具体的修复建议
- 完整的代码示例
- 相关知识的解释`,
    examples: [
      '"帮我优化这段代码"',
      '"这段代码有什么问题"',
      '"如何设计RESTful API"'
    ]
  },
  {
    id: 'skill_003',
    name: '翻译助手',
    description: '多语言翻译支持',
    rating: 4.2,
    usageCount: 89,
    category: '实用工具',
    promptTemplate: `# 多语言翻译助手

## 角色定义
你是一位专业的多语言翻译专家，精通中英文互译及其他主流语言。

## 工作流程
1. 识别源语言
2. 理解原文语境和含义
3. 进行精准翻译
4. 提供音标或发音指导（适用时）
5. 给出例句帮助理解

## 支持语言
- 中文 ↔ 英文
- 中文 ↔ 日文
- 中文 ↔ 韩文
- 英文 ↔ 其他欧洲语言

## 翻译原则
- 信：准确传达原文含义
- 达：表达流畅自然
- 雅：用语得体优雅

## 输出格式
- 原文
- 译文
- 音标（适用时）
- 相关词汇扩展`,
    examples: [
      '"翻译：Hello World"',
      '"把"你好"翻译成英文"',
      '""今天很开心"用日语怎么说"'
    ]
  }
]

/**
 * 导出指定ID的Skill
 * 
 * @param params - 包含Skill ID的参数对象
 * @returns 无返回值，直接输出到控制台
 */
export async function handler(params: ExportParams): Promise<void> {
  try {
    // 参数验证
    if (!params.id) {
      console.error('❌ 未找到ID为undefined的Skill')
      return
    }

    // 查找Skill
    const skill = skillsDatabase.find(s => s.id === params.id)

    if (!skill) {
      console.error(`❌ 未找到ID为${params.id}的Skill`)
      return
    }

    // 格式化输出Skill信息
    console.log('\n' + '─'.repeat(60))
    console.log(`🛠️  Skill: ${skill.name}`)
    console.log('─'.repeat(60))

    // 基本信息
    console.log(`📋 基本信息`)
    console.log(`   ID: ${skill.id}`)
    console.log(`   名称: ${skill.name}`)
    console.log(`   描述: ${skill.description}`)
    console.log(`   评分: ${skill.rating}`)
    console.log(`   使用次数: ${skill.usageCount}`)
    console.log(`   分类: ${skill.category}`)

    // Prompt模板
    console.log(`\n📝 Prompt模板`)
    console.log('─'.repeat(40))
    console.log(skill.promptTemplate)

    // 使用示例
    console.log(`\n💡 使用示例`)
    console.log('─'.repeat(40))
    skill.examples.forEach((example, index) => {
      console.log(`   ${index + 1}. ${example}`)
    })

    // 导出完成
    console.log('\n' + '─'.repeat(60))
    console.log(`✅ Skill导出成功 - ${skill.id}`)
    console.log('─'.repeat(60) + '\n')

  } catch (error) {
    // 错误处理
    console.error(`❌ 导出Skill时发生错误: ${(error as Error).message}`)
  }
}
