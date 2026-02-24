import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock console.log to capture output
const capturedOutput: string[] = []
vi.spyOn(console, 'log').mockImplementation((...args) => {
  capturedOutput.push(args.join(' '))
})

// Import after mocking
import { handler } from '../src/commands/project-list'

describe('project list', () => {
  beforeEach(() => {
    capturedOutput.length = 0
    vi.clearAllMocks()
  })

  it('should display formatted project list', async () => {
    // Execute command
    await handler()

    // Verify output contains expected elements
    expect(capturedOutput.length).toBeGreaterThan(0)
    const output = capturedOutput.join('\n')
    
    // Check for project list header
    expect(output).toContain('📁')
    expect(output).toContain('项目列表')
    
    // Check for project data
    expect(output).toContain('proj_001')
    expect(output).toContain('数据分析平台')
    expect(output).toContain('¥5,000')
    expect(output).toContain('进行中')
  })

  it('should show multiple projects', async () => {
    // Execute command
    await handler()

    // Verify output contains multiple projects
    const output = capturedOutput.join('\n')
    expect(output).toContain('proj_002')
    expect(output).toContain('智能客服系统')
    expect(output).toContain('proj_003')
    expect(output).toContain('AI代码审查工具')
  })

  it('should display project count at the end', async () => {
    // Execute command
    await handler()

    // Verify output contains project count
    const output = capturedOutput.join('\n')
    expect(output).toContain('共 3 个项目')
  })
})
