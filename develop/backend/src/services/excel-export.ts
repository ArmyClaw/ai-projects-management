/**
 * Excel 导出服务
 * 
 * 使用 xlsx 库生成 Excel 报表
 */

import * as XLSX from 'xlsx'
import type { ProjectProgress, ProjectCompareItem, DashboardStats, UserContribution } from '../types/analytics'

/**
 * 导出项目进度报告为Excel
 */
export function exportProjectProgressToExcel(
  progress: ProjectProgress,
  filename?: string
): Blob {
  // 创建工作簿
  const wb = XLSX.utils.book_new()
  
  // 基本信息sheet
  const basicInfo = [
    ['项目进度报告'],
    [],
    ['基本信息'],
    ['项目ID', progress.id],
    ['项目名称', progress.title],
    ['状态', getStatusText(progress.status)],
    [],
    ['进度统计'],
    ['总任务数', progress.totalTasks],
    ['已完成任务', progress.completedTasks],
    ['完成率', `${progress.progressPercentage}%`],
    [],
    ['里程碑'],
    ['总里程碑数', progress.totalMilestones],
    ['已完成里程碑', progress.completedMilestones],
    [],
    ['时间信息'],
    ['开始日期', progress.startDate ? formatDate(progress.startDate) : '未设置'],
    ['结束日期', progress.endDate ? formatDate(progress.endDate) : '未设置'],
    ['剩余天数', progress.daysRemaining ?? '未知'],
    [],
    ['生成时间', formatDateTime(new Date())]
  ]
  
  const ws1 = XLSX.utils.aoa_to_sheet(basicInfo)
  
  // 设置列宽
  ws1['!cols'] = [{ wch: 15 }, { wch: 50 }]
  
  // 添加到工作簿
  XLSX.utils.book_append_sheet(wb, ws1, '基本信息')
  
  // 任务详情sheet（如果有任务数据）
  if (progress.totalTasks > 0) {
    const taskData = [
      ['任务统计'],
      ['总任务数', progress.totalTasks],
      ['已完成', progress.completedTasks],
      ['进行中', progress.totalTasks - progress.completedTasks],
      [],
      ['完成率', `${progress.progressPercentage}%`]
    ]
    
    const ws2 = XLSX.utils.aoa_to_sheet(taskData)
    ws2['!cols'] = [{ wch: 15 }, { wch: 30 }]
    XLSX.utils.book_append_sheet(wb, ws2, '任务统计')
  }
  
  return workbookToBlob(wb, filename || `project-progress-${progress.id}`)
}

/**
 * 导出项目对比报告为Excel
 */
export function exportProjectCompareToExcel(
  projects: ProjectCompareItem[],
  filename?: string
): Blob {
  const wb = XLSX.utils.book_new()
  
  // 对比数据
  const comparisonData = [
    ['项目对比分析报告'],
    [`对比时间: ${formatDateTime(new Date())}`],
    [`项目数量: ${projects.length}`],
    [],
    ['项目名称', '状态', '总任务', '已完成', '完成率', '平均周期(天)', '预算(¥)', '预算偏差(%)', '满意度(%)', '开始日期', '结束日期']
  ]
  
  projects.forEach(p => {
    comparisonData.push([
      p.title,
      getStatusText(p.status),
      p.totalTasks,
      p.completedTasks,
      `${p.completionRate}%`,
      p.averageCycleDays,
      p.budget,
      formatDeviation(p.budgetDeviation),
      p.satisfaction ?? '-',
      p.startDate ? formatDate(p.startDate) : '-',
      p.endDate ? formatDate(p.endDate) : '-'
    ])
  ])
  
  const ws1 = XLSX.utils.aoa_to_sheet(comparisonData)
  ws1['!cols'] = [
    { wch: 30 },  // 项目名称
    { wch: 10 },  // 状态
    { wch: 10 },  // 总任务
    { wch: 10 },  // 已完成
    { wch: 10 },  // 完成率
    { wch: 15 },  // 平均周期
    { wch: 15 },  // 预算
    { wch: 12 },  // 预算偏差
    { wch: 12 },  // 满意度
    { wch: 12 },  // 开始日期
    { wch: 12 }   // 结束日期
  ]
  
  XLSX.utils.book_append_sheet(wb, ws1, '对比数据')
  
  // 汇总统计
  const summaryData = [
    ['汇总统计'],
    ['总项目数', projects.length],
    ['进行中项目', projects.filter(p => p.status === 'ACTIVE').length],
    ['已完成项目', projects.filter(p => p.status === 'COMPLETED').length],
    [],
    ['平均完成率', `${Math.round(projects.reduce((sum, p) => sum + p.completionRate, 0) / projects.length)}%`],
    ['平均预算', `¥${Math.round(projects.reduce((sum, p) => sum + p.budget, 0) / projects.length).toLocaleString()}`],
    ['总任务数', projects.reduce((sum, p) => sum + p.totalTasks, 0)],
    ['已完成任务', projects.reduce((sum, p) => sum + p.completedTasks, 0)]
  ]
  
  const ws2 = XLSX.utils.aoa_to_sheet(summaryData)
  ws2['!cols'] = [{ wch: 20 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, ws2, '汇总统计')
  
  return workbookToBlob(wb, filename || 'project-comparison')
}

/**
 * 导出数据看板报告为Excel
 */
export function exportDashboardToExcel(
  stats: DashboardStats,
  filename?: string
): Blob {
  const wb = XLSX.utils.book_new()
  
  // 概览数据
  const overviewData = [
    ['数据看板报告'],
    [`生成时间: ${formatDateTime(new Date())}`],
    [],
    ['项目统计'],
    ['总项目数', stats.totalProjects],
    ['进行中项目', stats.activeProjects],
    ['已完成项目', stats.completedProjects],
    [],
    ['任务统计'],
    ['总任务数', stats.totalTasks],
    ['已完成任务', stats.completedTasks],
    ['任务完成率', `${stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%`],
    [],
    ['用户统计'],
    ['总用户数', stats.totalUsers],
    ['活跃用户数', stats.activeUsers],
    [],
    ['积分统计'],
    ['总积分', stats.totalPoints.toLocaleString()]
  ]
  
  const ws1 = XLSX.utils.aoa_to_sheet(overviewData)
  ws1['!cols'] = [{ wch: 15 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, ws1, '概览')
  
  // 最近活动
  const activityData = [
    ['最近7天活动'],
    ['日期', '项目数', '任务数']
  ]
  
  stats.recentActivity.forEach(a => {
    activityData.push([a.date, a.projectCount, a.taskCount])
  })
  
  const ws2 = XLSX.utils.aoa_to_sheet(activityData)
  ws2['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(wb, ws2, '最近活动')
  
  return workbookToBlob(wb, filename || 'dashboard-stats')
}

/**
 * 导出用户贡献报告为Excel
 */
export function exportUserContributionToExcel(
  contribution: UserContribution,
  filename?: string
): Blob {
  const wb = XLSX.utils.book_new()
  
  // 基本信息
  const basicData = [
    ['个人贡献报告'],
    [],
    ['基本信息'],
    ['用户ID', contribution.userId],
    ['用户名', contribution.userName],
    [],
    ['任务统计'],
    ['总任务数', contribution.totalTasks],
    ['已完成任务', contribution.completedTasks],
    ['完成率', `${contribution.completionRate}%`],
    [],
    ['积分统计'],
    ['总积分', contribution.totalPoints],
    ['排名', `#${contribution.rank}`],
    [],
    ['生成时间', formatDateTime(new Date())]
  ]
  
  const ws1 = XLSX.utils.aoa_to_sheet(basicData)
  ws1['!cols'] = [{ wch: 15 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, ws1, '基本信息')
  
  // 周活动数据
  const activityData = [
    ['最近7天活动'],
    ['日期', '完成任务数']
  ]
  
  contribution.weeklyActivity.forEach(a => {
    activityData.push([a.date, a.taskCount])
  })
  
  const ws2 = XLSX.utils.aoa_to_sheet(activityData)
  ws2['!cols'] = [{ wch: 15 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, ws2, '周活动')
  
  return workbookToBlob(wb, filename || `user-contribution-${contribution.userId}`)
}

/**
 * 导出多Sheet的综合性Excel报告
 */
export function exportComprehensiveReport(
  data: {
    progress?: ProjectProgress
    dashboard?: DashboardStats
    contribution?: UserContribution
  },
  filename: string = 'comprehensive-report'
): Blob {
  const wb = XLSX.utils.book_new()
  
  // 封面
  const coverData = [
    ['综合报表'],
    [],
    ['生成时间', formatDateTime(new Date())]
  ]
  
  if (data.progress) {
    coverData.push(['项目名称', data.progress.title])
    coverData.push(['项目状态', getStatusText(data.progress.status)])
  }
  
  const ws1 = XLSX.utils.aoa_to_sheet(coverData)
  ws1['!cols'] = [{ wch: 20 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(wb, ws1, '封面')
  
  // 进度数据
  if (data.progress) {
    const progressData = [
      ['项目进度'],
      ['项目ID', data.progress.id],
      ['项目名称', data.progress.title],
      ['状态', getStatusText(data.progress.status)],
      [],
      ['进度统计'],
      ['总任务数', data.progress.totalTasks],
      ['已完成任务', data.progress.completedTasks],
      ['完成率', `${data.progress.progressPercentage}%`],
      ['总里程碑', data.progress.totalMilestones],
      ['已完成里程碑', data.progress.completedMilestones]
    ]
    
    const ws2 = XLSX.utils.aoa_to_sheet(progressData)
    ws2['!cols'] = [{ wch: 15 }, { wch: 30 }]
    XLSX.utils.book_append_sheet(wb, ws2, '项目进度')
  }
  
  // 看板数据
  if (data.dashboard) {
    const dashboardData = [
      ['数据看板'],
      ['总项目数', data.dashboard.totalProjects],
      ['进行中项目', data.dashboard.activeProjects],
      ['已完成项目', data.dashboard.completedProjects],
      ['总任务数', data.dashboard.totalTasks],
      ['已完成任务', data.dashboard.completedTasks],
      ['总用户数', data.dashboard.totalUsers],
      ['活跃用户数', data.dashboard.activeUsers],
      ['总积分', data.dashboard.totalPoints.toLocaleString()]
    ]
    
    const ws3 = XLSX.utils.aoa_to_sheet(dashboardData)
    ws3['!cols'] = [{ wch: 15 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, ws3, '数据看板')
  }
  
  return workbookToBlob(wb, filename)
}

/**
 * 下载Excel文件
 */
export function downloadExcel(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ========== 辅助函数 ==========

function workbookToBlob(wb: XLSX.WorkBook, filename: string): Blob {
  const wbout = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array'
  })
  return new Blob([wbout], { type: 'application/octet-stream' })
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    DRAFT: '草稿',
    ACTIVE: '进行中',
    COMPLETED: '已完成',
    CANCELLED: '已取消'
  }
  return statusMap[status] || status
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('zh-CN')
}

function formatDeviation(deviation: number): string {
  if (deviation > 0) {
    return `+${deviation.toFixed(2)}`
  }
  return deviation.toFixed(2)
}
