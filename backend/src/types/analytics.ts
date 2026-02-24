/**
 * 报表分析相关类型定义
 */

/**
 * 项目进度响应
 */
export interface ProjectProgress {
  id: string
  title: string
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  totalTasks: number
  completedTasks: number
  progressPercentage: number
  totalMilestones: number
  completedMilestones: number
  startDate: string | null
  endDate: string | null
  daysRemaining: number | null
}

/**
 * 甘特图任务项
 */
export interface GanttTask {
  id: string
  name: string
  startDate: string
  endDate: string
  status: string
  progress: number
  dependencies: string[]
}

/**
 * 甘特图数据
 */
export interface GanttData {
  projectId: string
  projectName: string
  tasks: GanttTask[]
  milestones: MilestoneData[]
  startDate: string
  endDate: string
}

/**
 * 里程碑数据
 */
export interface MilestoneData {
  id: string
  name: string
  description: string
  dueDate: string
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE'
  completedAt: string | null
}

/**
 * 创建里程碑请求
 */
export interface CreateMilestoneRequest {
  name: string
  description: string
  dueDate: string
}

/**
 * 个人贡献统计
 */
export interface UserContribution {
  userId: string
  userName: string
  totalTasks: number
  completedTasks: number
  completionRate: number
  totalPoints: number
  rank: number
  weeklyActivity: {
    date: string
    taskCount: number
  }[]
}

/**
 * 用户财务记录
 */
export interface FinanceRecord {
  id: string
  type: 'INCOME' | 'EXPENSE'
  amount: number
  description: string
  projectId: string | null
  projectName: string | null
  createdAt: string
}

/**
 * 用户财务汇总
 */
export interface UserFinance {
  userId: string
  totalIncome: number
  totalExpense: number
  balance: number
  pendingSettlement: number
  transactions: FinanceRecord[]
}

/**
 * 数据看板统计
 */
export interface DashboardStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalTasks: number
  completedTasks: number
  totalUsers: number
  activeUsers: number
  totalPoints: number
  recentActivity: {
    date: string
    projectCount: number
    taskCount: number
  }[]
}

/**
 * 燃尽图数据点
 */
export interface BurndownPoint {
  date: string
  remaining: number
  ideal: number
}

/**
 * 项目对比数据项
 */
export interface ProjectCompareItem {
  id: string
  title: string
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  totalTasks: number
  completedTasks: number
  completionRate: number
  averageCycleDays: number
  budget: number
  budgetDeviation: number
  satisfaction: number | null
  startDate: string | null
  endDate: string | null
}

/**
 * 项目对比响应
 */
export interface ProjectCompareResponse {
  projects: ProjectCompareItem[]
  comparedAt: string
}

/**
 * 项目对比查询参数
 */
export interface ProjectCompareQuery {
  projects: string // 逗号分隔的项目ID列表
}

/**
 * 信用趋势数据点
 */
export interface CreditTrendPoint {
  date: string
  score: number
  change: number
}

/**
 * 信用影响因素
 */
export interface CreditFactor {
  name: string
  score: number
  weight: number
  trend: 'up' | 'down' | 'stable'
}

/**
 * 用户信用趋势响应
 */
export interface UserCreditTrend {
  userId: string
  userName: string
  currentCreditScore: number
  creditLevel: string
  history: CreditTrendPoint[]
  factors: CreditFactor[]
}

/**
 * 信用趋势查询参数
 */
export interface CreditTrendQuery {
  days?: number // 查询天数，默认30天
}
