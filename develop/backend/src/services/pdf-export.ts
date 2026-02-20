/**
 * PDF 导出服务
 * 
 * 使用 jsPDF 生成 PDF 报表
 */

import { jsPDF } from 'jspdf'
import type { ProjectProgress, ProjectCompareItem, DashboardStats } from '../types/analytics'

/**
 * 导出项目进度报告为PDF
 */
export function exportProjectProgressToPdf(
  progress: ProjectProgress,
  filename?: string
): Blob {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // 标题
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('项目进度报告', pageWidth / 2, 20, { align: 'center' })
  
  // 项目名称
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(progress.title, pageWidth / 2, 30, { align: 'center' })
  
  // 分割线
  doc.setLineWidth(0.5)
  doc.line(20, 35, pageWidth - 20, 35)
  
  // 基本信息
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('基本信息', 20, 45)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  
  const basicInfo = [
    `项目ID: ${progress.id}`,
    `状态: ${getStatusText(progress.status)}`,
    `开始日期: ${progress.startDate ? formatDate(progress.startDate) : '未设置'}`,
    `结束日期: ${progress.endDate ? formatDate(progress.endDate) : '未设置'}`,
    `剩余天数: ${progress.daysRemaining !== null ? progress.daysRemaining : '未知'}`
  ]
  
  basicInfo.forEach((text, index) => {
    doc.text(text, 20, 55 + index * 7)
  })
  
  // 进度信息
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('进度统计', 20, 95)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  
  const progressInfo = [
    `总任务数: ${progress.totalTasks}`,
    `已完成任务: ${progress.completedTasks}`,
    `完成率: ${progress.progressPercentage}%`,
    `总里程碑: ${progress.totalMilestones}`,
    `已完成里程碑: ${progress.completedMilestones}`
  ]
  
  progressInfo.forEach((text, index) => {
    doc.text(text, 20, 105 + index * 7)
  })
  
  // 进度条可视化
  const barX = 20
  const barY = 140
  const barWidth = 100
  const barHeight = 10
  
  // 背景
  doc.setFillColor(230, 230, 230)
  doc.rect(barX, barY, barWidth, barHeight, 'F')
  
  // 进度
  const progressWidth = (progress.progressPercentage / 100) * barWidth
  doc.setFillColor(82, 196, 26)
  doc.rect(barX, barY, progressWidth, barHeight, 'F')
  
  // 进度文字
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text(`${progress.progressPercentage}%`, barX + barWidth / 2, barY + 7, { align: 'center' })
  doc.setTextColor(0, 0, 0)
  
  // 页脚
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`生成时间: ${formatDateTime(new Date())}`, pageWidth / 2, 280, { align: 'center' })
  
  return doc.output('blob')
}

/**
 * 导出项目对比报告为PDF
 */
export function exportProjectCompareToPdf(
  projects: ProjectCompareItem[],
  filename?: string
): Blob {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // 标题
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('项目对比分析报告', pageWidth / 2, 20, { align: 'center' })
  
  // 生成时间
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`对比时间: ${formatDateTime(new Date())}`, pageWidth / 2, 28, { align: 'center' })
  
  // 项目数量
  doc.text(`共 ${projects.length} 个项目`, pageWidth / 2, 34, { align: 'center' })
  
  // 分割线
  doc.setLineWidth(0.5)
  doc.line(20, 40, pageWidth - 20, 40)
  
  let y = 50
  
  projects.forEach((project, index) => {
    // 检查是否需要新页面
    if (y > 250) {
      doc.addPage()
      y = 20
    }
    
    // 项目标题
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`${index + 1}. ${project.title}`, 20, y)
    y += 8
    
    // 项目状态
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`状态: ${getStatusText(project.status)}`, 25, y)
    y += 6
    
    // 任务统计
    doc.text(`总任务: ${project.totalTasks} | 已完成: ${project.completedTasks} | 完成率: ${project.completionRate}%`, 25, y)
    y += 6
    
    // 周期和预算
    doc.text(`平均周期: ${project.averageCycleDays}天 | 预算: ¥${project.budget.toLocaleString()} | 偏差: ${formatDeviation(project.budgetDeviation)}%`, 25, y)
    y += 6
    
    // 满意度
    if (project.satisfaction !== null) {
      doc.text(`满意度: ${project.satisfaction}%`, 25, y)
      y += 6
    }
    
    y += 5
    
    // 进度条可视化
    const barX = 25
    const barWidth = 80
    const barHeight = 6
    
    // 背景
    doc.setFillColor(230, 230, 230)
    doc.rect(barX, y, barWidth, barHeight, 'F')
    
    // 进度
    const progressWidth = (project.completionRate / 100) * barWidth
    doc.setFillColor(82, 196, 26)
    doc.rect(barX, y, progressWidth, barHeight, 'F')
    
    y += 12
  })
  
  // 页脚
  doc.setFontSize(8)
  doc.text(`生成时间: ${formatDateTime(new Date())}`, pageWidth / 2, 280, { align: 'center' })
  
  return doc.output('blob')
}

/**
 * 导出数据看板报告为PDF
 */
export function exportDashboardToPdf(
  stats: DashboardStats,
  filename?: string
): Blob {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // 标题
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('数据看板报告', pageWidth / 2, 20, { align: 'center' })
  
  // 生成时间
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`生成时间: ${formatDateTime(new Date())}`, pageWidth / 2, 28, { align: 'center' })
  
  // 分割线
  doc.setLineWidth(0.5)
  doc.line(20, 35, pageWidth - 20, 35)
  
  // 项目统计
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('项目统计', 20, 50)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  
  const projectStats = [
    `总项目数: ${stats.totalProjects}`,
    `进行中: ${stats.activeProjects}`,
    `已完成: ${stats.completedProjects}`
  ]
  
  projectStats.forEach((text, index) => {
    doc.text(text, 25, 60 + index * 7)
  })
  
  // 任务统计
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('任务统计', 110, 50)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  
  const taskStats = [
    `总任务数: ${stats.totalTasks}`,
    `已完成: ${stats.completedTasks}`,
    `完成率: ${stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%`
  ]
  
  taskStats.forEach((text, index) => {
    doc.text(text, 115, 60 + index * 7)
  })
  
  // 用户统计
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('用户统计', 20, 90)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  
  const userStats = [
    `总用户数: ${stats.totalUsers}`,
    `活跃用户: ${stats.activeUsers}`
  ]
  
  userStats.forEach((text, index) => {
    doc.text(text, 25, 100 + index * 7)
  })
  
  // 积分统计
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('积分统计', 110, 90)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  
  doc.text(`总积分: ${stats.totalPoints.toLocaleString()}`, 115, 100)
  
  // 分割线
  doc.setLineWidth(0.5)
  doc.line(20, 120, pageWidth - 20, 120)
  
  // 最近活动
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('最近7天活动', 20, 135)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  
  stats.recentActivity.forEach((activity, index) => {
    const x = 25
    const y = 145 + index * 10
    
    doc.text(`${activity.date}: ${activity.projectCount} 个项目, ${activity.taskCount} 个任务`, x, y)
  })
  
  // 页脚
  doc.setFontSize(8)
  doc.text(`生成时间: ${formatDateTime(new Date())}`, pageWidth / 2, 280, { align: 'center' })
  
  return doc.output('blob')
}

/**
 * 下载PDF文件
 */
export function downloadPdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ========== 辅助函数 ==========

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
