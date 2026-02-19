import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock console.log to capture output
const capturedOutput: string[] = []
vi.spyOn(console, 'log').mockImplementation((...args) => {
  capturedOutput.push(args.join(' '))
})

// Mock console.error for error cases
const capturedError: string[] = []
vi.spyOn(console, 'error').mockImplementation((...args) => {
  capturedError.push(args.join(' '))
})

// Import after mocking
import { handler } from '../src/commands/skill-export'

describe('skill export', () => {
  beforeEach(() => {
    capturedOutput.length = 0
    capturedError.length = 0
    vi.clearAllMocks()
  })

  it('should export skill with valid ID', async () => {
    await handler({ id: 'skill_001' })
    
    const output = capturedOutput.join('\n')
    
    // Verify skill data is displayed
    expect(output).toContain('Weather查询')
    expect(output).toContain('查询当前天气和天气预报')
    expect(output).toContain('评分: 4.8')
    expect(output).toContain('使用次数: 156')
    expect(output).toContain('分类: 实用工具')
  })

  it('should display skill prompt template', async () => {
    await handler({ id: 'skill_001' })
    
    const output = capturedOutput.join('\n')
    
    // Verify prompt template section
    expect(output).toContain('📝 Prompt模板')
    expect(output).toContain('# 天气查询工具')
    expect(output).toContain('## 角色定义')
    expect(output).toContain('你是一个专业的天气查询助手')
  })

  it('should display skill usage examples', async () => {
    await handler({ id: 'skill_001' })
    
    const output = capturedOutput.join('\n')
    
    // Verify usage examples section
    expect(output).toContain('💡 使用示例')
    expect(output).toContain('"今天天气怎么样"')
    expect(output).toContain('"北京明天会下雨吗"')
  })

  it('should display export completed message', async () => {
    await handler({ id: 'skill_001' })
    
    const output = capturedOutput.join('\n')
    
    // Verify export confirmation
    expect(output).toContain('✅ Skill导出成功')
    expect(output).toContain('skill_001')
  })

  it('should handle non-existent skill ID', async () => {
    await handler({ id: 'skill_999' })
    
    const errorOutput = capturedError.join('\n')
    
    // Verify error message
    expect(errorOutput).toContain('❌ 未找到ID为skill_999的Skill')
  })

  it('should display skill details in formatted sections', async () => {
    await handler({ id: 'skill_002' })
    
    const output = capturedOutput.join('\n')
    
    // Verify AI编程助手 details
    expect(output).toContain('AI编程助手')
    expect(output).toContain('提供编程建议和代码审查')
    expect(output).toContain('评分: 4.5')
    expect(output).toContain('使用次数: 234')
    expect(output).toContain('分类: 开发工具')
    
    // Verify prompt template for skill_002
    expect(output).toContain('📝 Prompt模板')
    expect(output).toContain('# AI编程助手')
    expect(output).toContain('## 角色定义')
    expect(output).toContain('你是一位经验丰富的编程导师')
  })

  it('should handle missing skill ID parameter', async () => {
    // When id is undefined, should handle gracefully
    await handler({ id: undefined as any })
    
    const errorOutput = capturedError.join('\n')
    
    // Should display error about missing ID
    expect(errorOutput).toContain('❌ 未找到ID为undefined的Skill')
  })

  it('should export different skills correctly', async () => {
    // Test skill_003 (翻译助手)
    await handler({ id: 'skill_003' })
    
    const output = capturedOutput.join('\n')
    
    // Verify translation skill data
    expect(output).toContain('翻译助手')
    expect(output).toContain('多语言翻译支持')
    expect(output).toContain('评分: 4.2')
    expect(output).toContain('使用次数: 89')
    expect(output).toContain('分类: 实用工具')
  })
})
