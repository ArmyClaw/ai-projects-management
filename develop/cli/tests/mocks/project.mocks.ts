/**
 * Mock project data for testing
 */

/**
 * 模拟项目数据类型
 */
export interface MockProject {
  id: string
  name: string
  budget: string
  status: string
  progress: number
  taskCount: number
  createdAt: string
}

/**
 * 获取模拟项目列表
 * 
 * @returns 模拟项目数组
 */
export function getMockProjects(): MockProject[] {
  return [
    {
      id: 'proj_001',
      name: '数据分析平台',
      budget: '¥5,000',
      status: '进行中',
      progress: 65,
      taskCount: 8,
      createdAt: '2026-02-01'
    },
    {
      id: 'proj_002',
      name: '智能客服系统',
      budget: '¥8,000',
      status: '可认领',
      progress: 0,
      taskCount: 12,
      createdAt: '2026-02-15'
    },
    {
      id: 'proj_003',
      name: 'AI代码审查工具',
      budget: '¥3,000',
      status: '已完成',
      progress: 100,
      taskCount: 5,
      createdAt: '2026-01-20'
    }
  ]
}

/**
 * Mock functions for project operations
 */
export const mockFunctions = {
  getMockProjects
}
