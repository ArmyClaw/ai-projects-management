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
const { useProjectStore } = await import('@/stores/project')
const { useUserStore } = await import('@/stores/user')

describe('project store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('fetches projects and updates pagination', async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          projects: [{ id: 'p1', title: 'P1', description: 'd', mode: 'COMMUNITY', status: 'ACTIVE', budget: 1, platformFee: 0.1, initiatorId: 'u1', createdAt: '', updatedAt: '' }],
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1
        }
      }
    })

    const store = useProjectStore()
    const ok = await store.fetchProjects()

    expect(ok).toBe(true)
    expect(store.projects.length).toBe(1)
    expect(store.pagination.total).toBe(1)
  })

  it('creates project and refreshes list', async () => {
    const userStore = useUserStore()
    userStore.token = 't1'

    axios.post.mockResolvedValue({ data: { success: true, data: { id: 'p2' } } })
    axios.get.mockResolvedValue({ data: { success: true, data: { projects: [], total: 0, page: 1, pageSize: 10, totalPages: 0 } } })

    const store = useProjectStore()
    const id = await store.createProject({ title: 'T', description: 'D', mode: 'COMMUNITY', budget: 100 })

    expect(id).toBe('p2')
    expect(axios.post).toHaveBeenCalled()
    expect(axios.get).toHaveBeenCalled()
  })

  it('updates and deletes project', async () => {
    const userStore = useUserStore()
    userStore.token = 't1'

    axios.put.mockResolvedValue({ data: { success: true, data: { id: 'p1', title: 'Updated', description: 'd', mode: 'COMMUNITY', status: 'ACTIVE', budget: 1, platformFee: 0.1, initiatorId: 'u1', createdAt: '', updatedAt: '' } } })
    axios.delete.mockResolvedValue({ data: { success: true } })

    const store = useProjectStore()
    store.projects = [{ id: 'p1' } as any]

    const ok = await store.updateProject('p1', { title: 'Updated' })
    expect(ok).toBe(true)
    expect(store.projects[0].title).toBe('Updated')

    const deleted = await store.deleteProject('p1')
    expect(deleted).toBe(true)
    expect(store.projects.length).toBe(0)
  })

  it('fetches project detail and resets', async () => {
    axios.get.mockResolvedValue({ data: { success: true, data: { id: 'p1', title: 'P1', description: 'd', mode: 'COMMUNITY', status: 'ACTIVE', budget: 1, platformFee: 0.1, initiatorId: 'u1', createdAt: '', updatedAt: '' } } })

    const store = useProjectStore()
    const ok = await store.fetchProject('p1')
    expect(ok).toBe(true)
    expect(store.currentProject?.id).toBe('p1')

    store.reset()
    expect(store.projects.length).toBe(0)
    expect(store.currentProject).toBeNull()
  })

  it('handles pagination setPage', async () => {
    axios.get.mockResolvedValue({ data: { success: true, data: { projects: [], total: 0, page: 2, pageSize: 10, totalPages: 0 } } })
    const store = useProjectStore()

    store.setPage(2)
    expect(store.pagination.page).toBe(2)
  })
})
