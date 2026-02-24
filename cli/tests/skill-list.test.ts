import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock console.log to capture output
const capturedOutput: string[] = []
vi.spyOn(console, 'log').mockImplementation((...args) => {
  capturedOutput.push(args.join(' '))
})

// Import after mocking
import { handler } from '../src/commands/skill-list'

describe('skill list', () => {
  beforeEach(() => {
    capturedOutput.length = 0
    vi.clearAllMocks()
  })

  it('should display skill list header', async () => {
    await handler()
    
    const output = capturedOutput.join('\n')
    expect(output).toContain('🛠️ 我的Skill列表')
  })

  it('should display all mock skills', async () => {
    await handler()
    
    const output = capturedOutput.join('\n')
    
    // Check for all skill data
    expect(output).toContain('skill_001')
    expect(output).toContain('skill_002')
    expect(output).toContain('skill_003')
    
    // Check for skill names
    expect(output).toContain('Weather查询')
    expect(output).toContain('AI编程助手')
    expect(output).toContain('翻译助手')
  })

  it('should display skill information', async () => {
    await handler()
    
    const output = capturedOutput.join('\n')
    
    // Check for ratings
    expect(output).toContain('4.8')
    expect(output).toContain('4.5')
    expect(output).toContain('4.2')
    
    // Check for usage counts
    expect(output).toContain('156')
    expect(output).toContain('234')
    expect(output).toContain('89')
    
    // Check for categories
    expect(output).toContain('实用工具')
    expect(output).toContain('开发工具')
  })

  it('should display skill descriptions', async () => {
    await handler()
    
    const output = capturedOutput.join('\n')
    
    // Check for descriptions
    expect(output).toContain('查询当前天气和天气预报')
    expect(output).toContain('提供编程建议和代码审查')
    expect(output).toContain('多语言翻译支持')
  })

  it('should display table headers', async () => {
    await handler()
    
    const output = capturedOutput.join('\n')
    
    expect(output).toContain('ID')
    expect(output).toContain('名称')
    expect(output).toContain('评分')
    expect(output).toContain('使用次数')
    expect(output).toContain('分类')
  })

  it('should show total skill count', async () => {
    await handler()
    
    const output = capturedOutput.join('\n')
    
    expect(output).toContain('共 3 个Skill')
  })

  it('should not display empty message', async () => {
    await handler()
    
    const output = capturedOutput.join('\n')
    
    expect(output).not.toContain('暂无Skill')
  })
})
