import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock console.log to capture output
const capturedOutput: string[] = []
vi.spyOn(console, 'log').mockImplementation((...args) => {
  capturedOutput.push(args.join(' '))
})

// Mock console.error to capture error output
const capturedError: string[] = []
vi.spyOn(console, 'error').mockImplementation((...args) => {
  capturedError.push(args.join(' '))
})

// Import after mocking
import { handler } from '../src/commands/project-info'

describe('project info', () => {
  beforeEach(() => {
    capturedOutput.length = 0
    capturedError.length = 0
    vi.clearAllMocks()
  })

  it('should display project details for existing project', async () => {
    // Execute command with existing project ID
    await handler('proj_001')

    // Verify output contains expected project details
    const output = capturedOutput.join('\n')
    
    // Check for project info header
    expect(output).toContain('📋')
    expect(output).toContain('项目详情')
    
    // Check for project data
    expect(output).toContain('proj_001')
    expect(output).toContain('数据分析平台')
    expect(output).toContain('¥5,000')
    expect(output).toContain('进行中')
    expect(output).toContain('65%')
    expect(output).toContain('8')
    expect(output).toContain('2026-02-01')
  })

  it('should handle non-existent project ID', async () => {
    // Execute command with non-existent project ID
    await handler('proj_999')

    // Verify error message is displayed
    const errorOutput = capturedError.join('\n')
    expect(errorOutput).toContain('错误')
    expect(errorOutput).toContain('proj_999')
    expect(errorOutput).toContain('不存在')
  })

  it('should display project details with all fields', async () => {
    // Execute command with another existing project
    await handler('proj_002')

    // Verify output contains all project fields
    const output = capturedOutput.join('\n')
    
    expect(output).toContain('proj_002')
    expect(output).toContain('智能客服系统')
    expect(output).toContain('¥8,000')
    expect(output).toContain('可认领')
    expect(output).toContain('0%')
    expect(output).toContain('12')
    expect(output).toContain('2026-02-15')
  })
})
