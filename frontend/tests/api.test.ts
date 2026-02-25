import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import api, {
  getProjectProgress,
  getProjectsCompare,
  exportToPdf,
  exportToExcel,
  setGlobalMessage,
  setGlobalUserStore
} from '@/services/api'

function getRequestHandler() {
  const handler = api.interceptors.request.handlers[0]
  return handler?.fulfilled as (config: any) => any
}

function getRequestRejectedHandler() {
  const handler = api.interceptors.request.handlers[0]
  return handler?.rejected as (error: any) => Promise<any>
}

function getResponseRejectedHandler() {
  const handler = api.interceptors.response.handlers[0]
  return handler?.rejected as (error: any) => Promise<any>
}

describe('api service', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('adds auth header and timestamp on GET', () => {
    localStorage.setItem('token', 'token-123')
    const handler = getRequestHandler()
    const result = handler({ method: 'get', headers: {}, params: {} })

    expect(result.headers.Authorization).toBe('Bearer token-123')
    expect(result.params._t).toBeTypeOf('number')
  })

  it('does not add auth header without token', () => {
    const handler = getRequestHandler()
    const result = handler({ method: 'get', headers: {}, params: {} })

    expect(result.headers.Authorization).toBeUndefined()
    expect(result.params._t).toBeTypeOf('number')
  })

  it('handles request interceptor errors', async () => {
    const handler = getRequestRejectedHandler()
    await expect(handler(new Error('boom'))).rejects.toThrow('boom')
  })

  it('handles network errors with alert fallback', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const handler = getResponseRejectedHandler()

    await handler({ code: 'ECONNABORTED' })
      .catch(() => undefined)

    expect(alertSpy).toHaveBeenCalledWith('请求超时，请稍后重试')
  })

  it('handles 400 error using global message', async () => {
    const errorSpy = vi.fn()
    setGlobalMessage({ error: errorSpy })

    const handler = getResponseRejectedHandler()
    await handler({ response: { status: 400, data: { error: 'bad request' } } })
      .catch(() => undefined)

    expect(errorSpy).toHaveBeenCalledWith('bad request')
  })

  it('handles other http errors', async () => {
    const errorSpy = vi.fn()
    setGlobalMessage({ error: errorSpy })
    const handler = getResponseRejectedHandler()

    const statuses = [403, 404, 422, 429, 500, 502, 503, 418]
    for (const status of statuses) {
      await handler({ response: { status, data: { error: 'oops' } } }).catch(() => undefined)
    }

    expect(errorSpy).toHaveBeenCalled()
  })

  it('handles 401 unauthorized and redirects to login', async () => {
    const handler = getResponseRejectedHandler()
    const userStore = { user: { id: 'u1' }, token: 't1' }
    setGlobalUserStore(userStore)
    localStorage.setItem('token', 't1')

    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost/dashboard', pathname: '/dashboard' },
      writable: true
    })

    await handler({ response: { status: 401, data: {} } }).catch(() => undefined)

    expect(localStorage.getItem('token')).toBeNull()
    expect(userStore.user).toBeNull()
    expect(userStore.token).toBeNull()
    expect(window.location.href).toContain('/login')

    Object.defineProperty(window, 'location', { value: originalLocation, writable: true })
  })

  it('validates project compare input', async () => {
    await expect(getProjectsCompare([])).rejects.toThrow('请提供至少一个项目ID')
    await expect(getProjectsCompare(['1', '2', '3', '4', '5', '6'])).rejects.toThrow('最多支持5个项目对比')
  })

  it('wraps simple GET API calls', async () => {
    const getSpy = vi.spyOn(api, 'get').mockResolvedValue({
      data: { success: true, data: { id: 'p1', title: 'A', status: 'ACTIVE', totalTasks: 1, completedTasks: 1, progressPercentage: 100, totalMilestones: 0, completedMilestones: 0, startDate: null, endDate: null, daysRemaining: null } }
    })

    const result = await getProjectProgress('p1')
    expect(result.id).toBe('p1')
    expect(getSpy).toHaveBeenCalledWith('/projects/p1/progress')
  })

  it('exports pdf and excel', async () => {
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue({
      data: new Blob(['test'], { type: 'application/pdf' })
    })
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:123')
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const originalCreate = document.createElement.bind(document)
    const clickSpy = vi.fn()
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreate(tagName) as HTMLAnchorElement
      if (tagName === 'a') {
        el.click = clickSpy
      }
      return el
    })

    await exportToPdf({ type: 'dashboard', filename: 'report' })
    await exportToExcel({ type: 'dashboard', filename: 'report' })

    expect(postSpy).toHaveBeenCalled()
    expect(createSpy).toHaveBeenCalled()
    expect(revokeSpy).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
  })
})
