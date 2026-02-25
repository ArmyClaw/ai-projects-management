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

const axios = (await import('axios')).default as any
const { useUserStore } = await import('@/stores/user')

describe('user store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('logs in and stores token', async () => {
    axios.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          user: { id: 'u1', email: 'a@b.com', name: 'A', avatar: null, role: 'PARTICIPANT', githubId: null, points: 0, status: 'ACTIVE', createdAt: '', updatedAt: '' },
          token: 'token-1',
          tokenType: 'Bearer',
          expiresIn: 3600
        }
      }
    })

    const store = useUserStore()
    const ok = await store.login('a@b.com', 'pass')

    expect(ok).toBe(true)
    expect(store.token).toBe('token-1')
    expect(localStorage.getItem('token')).toBe('token-1')
  })

  it('handles login error', async () => {
    axios.post.mockResolvedValue({ data: { success: false, error: 'bad' } })
    const store = useUserStore()

    const ok = await store.login('a@b.com', 'pass')
    expect(ok).toBe(false)
    expect(store.error).toBe('bad')
  })

  it('fetches current user and handles invalid token', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, data: { id: 'u1', email: 'a@b.com', name: 'A', avatar: null, role: 'PARTICIPANT', githubId: null, points: 0, status: 'ACTIVE', createdAt: '', updatedAt: '' } } })
    localStorage.setItem('token', 't1')

    const store = useUserStore()
    const ok = await store.fetchCurrentUser()
    expect(ok).toBe(true)
    expect(store.user?.id).toBe('u1')

    axios.get.mockResolvedValueOnce({ data: { success: false } })
    axios.post.mockResolvedValueOnce({ data: { success: true } })

    const bad = await store.fetchCurrentUser()
    expect(bad).toBe(false)
    expect(store.user).toBeNull()
  })

  it('refreshes token and updates localStorage', async () => {
    const store = useUserStore()
    store.token = 't1'
    axios.post.mockResolvedValue({ data: { success: true, data: { accessToken: 't2' } } })

    const ok = await store.refreshToken()
    expect(ok).toBe(true)
    expect(store.token).toBe('t2')
    expect(localStorage.getItem('token')).toBe('t2')
  })

  it('logs out and clears state', async () => {
    const store = useUserStore()
    store.token = 't1'
    store.user = { id: 'u1' } as any
    axios.post.mockRejectedValue(new Error('ignore'))

    await store.logout()
    expect(store.user).toBeNull()
    expect(store.token).toBeNull()
  })

  it('handles GitHub login redirect', async () => {
    axios.get.mockResolvedValue({ data: { success: true, data: { oauthUrl: 'https://github.com/login' } } })
    const store = useUserStore()

    const originalLocation = window.location
    Object.defineProperty(window, 'location', { value: { href: '' }, writable: true })

    const ok = await store.loginWithGitHub()
    expect(ok).toBe(true)
    expect(window.location.href).toBe('https://github.com/login')

    Object.defineProperty(window, 'location', { value: originalLocation, writable: true })
  })

  it('handles GitHub login error', async () => {
    axios.get.mockResolvedValue({ data: { success: false, error: 'fail' } })
    const store = useUserStore()
    const ok = await store.loginWithGitHub()

    expect(ok).toBe(false)
    expect(store.error).toBe('fail')
  })
})
