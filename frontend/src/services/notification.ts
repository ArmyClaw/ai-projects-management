/**
 * 通知服务
 * 
 * 用于在业务逻辑中创建通知的工具函数
 */

import axios from 'axios'

/**
 * 通知类型
 */
export type NotificationType = 'TASK_UPDATE' | 'SETTLEMENT' | 'DISPUTE' | 'SYSTEM'

/**
 * 通知数据接口
 */
export interface CreateNotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
}

/**
 * 创建通知
 * 
 * @param data 通知数据
 * @returns 是否创建成功
 */
export async function createNotification(data: CreateNotificationData): Promise<boolean> {
  const token = localStorage.getItem('token')
  if (!token) {
    return false
  }

  try {
    const response = await axios.post('/api/v1/notifications', data, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data.success
  } catch {
    return false
  }
}

/**
 * 任务更新通知
 * @param userId - 用户ID
 * @param taskId - 任务ID
 * @param taskTitle - 任务标题
 * @param message - 通知消息
 * @returns 是否创建成功
 */
export async function notifyTaskUpdate(
  userId: string,
  taskId: string,
  taskTitle: string,
  message: string
): Promise<boolean> {
  return createNotification({
    userId,
    type: 'TASK_UPDATE',
    title: '任务更新',
    message,
    data: { taskId, taskTitle }
  })
}

/**
 * 结算提醒通知
 * @param userId - 用户ID
 * @param amount - 结算金额
 * @param description - 描述
 * @returns 是否创建成功
 */
export async function notifySettlement(
  userId: string,
  amount: number,
  description: string
): Promise<boolean> {
  return createNotification({
    userId,
    type: 'SETTLEMENT',
    title: '结算提醒',
    message: `您已获得 ${amount} 积分：${description}`,
    data: { amount }
  })
}

/**
 * 争议仲裁通知
 * @param userId - 用户ID
 * @param disputeId - 争议ID
 * @param status - 争议状态
 * @returns 是否创建成功
 */
export async function notifyDispute(
  userId: string,
  disputeId: string,
  status: string
): Promise<boolean> {
  let message = ''
  switch (status) {
    case 'OPEN':
      message = '您有一个新的争议待处理'
      break
    case 'ARBITRATING':
      message = '您的争议正在仲裁中'
      break
    case 'CLOSED':
      message = '您的争议已关闭'
      break
    default:
      message = '您的争议状态有更新'
  }

  return createNotification({
    userId,
    type: 'DISPUTE',
    title: '争议仲裁',
    message,
    data: { disputeId, status }
  })
}

/**
 * 系统消息通知
 * @param userId - 用户ID
 * @param title - 标题
 * @param message - 消息内容
 * @param data - 附加数据
 * @returns 是否创建成功
 */
export async function notifySystem(
  userId: string,
  title: string,
  message: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  return createNotification({
    userId,
    type: 'SYSTEM',
    title,
    message,
    data
  })
}

export default {
  createNotification,
  notifyTaskUpdate,
  notifySettlement,
  notifyDispute,
  notifySystem
}
