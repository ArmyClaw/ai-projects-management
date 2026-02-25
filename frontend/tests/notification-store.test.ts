import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

vi.mock('@/services/websocket', () => ({
  createConnection: vi.fn(),
  onConnectionChange: vi.fn(),
  onNotification: vi.fn()
}))

const axios = (await import('axios')).default as any
const { useNotificationStore } = await import('@/stores/notification')

describe('notification store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('initializes websocket', () => {
    const store = useNotificationStore()
    store.initWebSocket()
    expect(store.wsConnected).toBe(false)
  })

  it('fetches notifications with cache', async () => {
    const cacheKey = 'notification_cache_list_1_20'
    const cached = {
      data: {
        success: true,
        data: {
          notifications: [{ id: 'n1', type: 'SYSTEM', title: 't', message: 'm', data: null, isRead: false, readAt: null, createdAt: '' }],
          total: 1,
          unreadCount: 1,
          page: 1,
          pageSize: 20,
          totalPages: 1
        }
      },
      timestamp: Date.now()
    }
    localStorage.setItem(cacheKey, JSON.stringify(cached))
    localStorage.setItem('token', 't1')

    const store = useNotificationStore()
    const ok = await store.fetchNotifications()

    expect(ok).toBe(true)
    expect(store.notifications.length).toBe(1)
    expect(store.unreadCount).toBe(1)
  })

  it('returns false when no token', async () => {
    const store = useNotificationStore()
    const ok = await store.fetchNotifications()
    expect(ok).toBe(false)
    expect(store.error).toBe('未登录')
  })

  it('fetches notifications from api when no cache', async () => {
    localStorage.setItem('token', 't1')
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          notifications: [],
          total: 0,
          unreadCount: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0
        }
      }
    })

    const store = useNotificationStore()
    const ok = await store.fetchNotifications()
    expect(ok).toBe(true)
  })

  it('marks notification as read and updates cache', async () => {
    localStorage.setItem('token', 't1')
    axios.put.mockResolvedValue({ data: { success: true } })

    const store = useNotificationStore()
    store.notifications = [{ id: 'n1', isRead: false, readAt: null } as any]
    store.unreadCount = 1

    const ok = await store.markAsRead('n1')
    expect(ok).toBe(true)
    expect(store.unreadCount).toBe(0)
    expect(store.notifications[0].isRead).toBe(true)
  })

  it('marks all as read', async () => {
    localStorage.setItem('token', 't1')
    axios.put.mockResolvedValue({ data: { success: true } })

    const store = useNotificationStore()
    store.notifications = [{ id: 'n1', isRead: false } as any]
    store.unreadCount = 1

    const ok = await store.markAllAsRead()
    expect(ok).toBe(true)
    expect(store.unreadCount).toBe(0)
    expect(store.notifications[0].isRead).toBe(true)
  })

  it('fetches unread count', async () => {
    localStorage.setItem('token', 't1')
    axios.get.mockResolvedValue({ data: { success: true, data: { unreadCount: 5 } } })

    const store = useNotificationStore()
    const ok = await store.fetchUnreadCount()
    expect(ok).toBe(true)
    expect(store.unreadCount).toBe(5)
  })

  it('deletes notification', async () => {
    localStorage.setItem('token', 't1')
    axios.delete.mockResolvedValue({ data: { success: true } })

    const store = useNotificationStore()
    store.notifications = [{ id: 'n1', isRead: false } as any]
    store.unreadCount = 1

    const ok = await store.deleteNotification('n1')
    expect(ok).toBe(true)
    expect(store.notifications.length).toBe(0)
    expect(store.unreadCount).toBe(0)
  })

  it('adds notification and clears cache', () => {
    const store = useNotificationStore()
    store.addNotification({ id: 'n1', isRead: false } as any)
    expect(store.unreadCount).toBe(1)

    localStorage.setItem('notification_cache_list_1_20', 'x')
    store.clear()
    expect(store.notifications.length).toBe(0)
    expect(localStorage.getItem('notification_cache_list_1_20')).toBeNull()
  })
})
