/**
 * Interactive Mode Tests
 * 
 * Tests for interactive menu functionality
 */
import { describe, it, expect, vi } from 'vitest'
import { menuChoices } from '../src/commands/interactive'

describe('Interactive Mode', () => {
  /**
   * Test: Menu should have all required options
   */
  it('菜单应包含所有必需选项', () => {
    const values = menuChoices.map(c => c.value)
    
    expect(values).toContain('task-list')
    expect(values).toContain('task-claim')
    expect(values).toContain('task-submit')
    expect(values).toContain('project-list')
    expect(values).toContain('project-info')
    expect(values).toContain('skill-list')
    expect(values).toContain('skill-export')
    expect(values).toContain('review-status')
    expect(values).toContain('exit')
  })

  /**
   * Test: Menu choices should have Chinese descriptions
   */
  it('菜单选项应有中文描述', () => {
    const hasChineseNames = menuChoices.every(c => 
      /[\u4e00-\u9fa5]/.test(c.name)
    )
    expect(hasChineseNames).toBe(true)
  })

  /**
   * Test: Each menu choice should have description
   */
  it('每个菜单选项应有描述', () => {
    const allHaveDescription = menuChoices.every(c => 
      c.description && c.description.length > 0
    )
    expect(allHaveDescription).toBe(true)
  })

  /**
   * Test: All menu choices should have unique values
   */
  it('所有菜单选项应有唯一值', () => {
    const values = menuChoices.map(c => c.value)
    const uniqueValues = [...new Set(values)]
    expect(values.length).toBe(uniqueValues.length)
  })

  /**
   * Test: Exit option should be last
   */
  it('退出选项应在最后', () => {
    const lastChoice = menuChoices[menuChoices.length - 1]
    expect(lastChoice.value).toBe('exit')
  })

  /**
   * Test: Menu should have reasonable number of options
   */
  it('菜单应有合理数量的选项', () => {
    expect(menuChoices.length).toBeGreaterThanOrEqual(8)
    expect(menuChoices.length).toBeLessThanOrEqual(12)
  })

  /**
   * Test: All options should have non-empty name
   */
  it('所有选项应有非空名称', () => {
    const allHaveNames = menuChoices.every(c => 
      c.name && c.name.trim().length > 0
    )
    expect(allHaveNames).toBe(true)
  })
})
