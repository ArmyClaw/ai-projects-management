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
const { useTaskStore } = await import('@/stores/task')
const { useUserStore } = await import('@/stores/user')

describe('task store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('fetches tasks and updates pagination', async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          tasks: [{ id: 't1', title: 'T1', description: 'd', requiredSkills: [], budget: 1, status: 'OPEN', projectId: 'p1', milestoneId: null, assigneeId: null, dueAt: null, createdAt: '', updatedAt: '' }],
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1
        }
      }
    })

    const store = useTaskStore()
    const ok = await store.fetchTasks()

    expect(ok).toBe(true)
    expect(store.tasks.length).toBe(1)
    expect(store.pagination.total).toBe(1)
  })

  it('creates task and refreshes list', async () => {
    const userStore = useUserStore()
    userStore.token = 't1'

    axios.post.mockResolvedValue({ data: { success: true, data: { id: 't2' } } })
    axios.get.mockResolvedValue({ data: { success: true, data: { tasks: [], total: 0, page: 1, pageSize: 10, totalPages: 0 } } })

    const store = useTaskStore()
    const id = await store.createTask({ title: 'T', description: 'D', requiredSkills: [], budget: 1, projectId: 'p1' })

    expect(id).toBe('t2')
    expect(axios.post).toHaveBeenCalled()
  })

  it('claims, submits, updates and deletes task', async () => {
    const userStore = useUserStore()
    userStore.token = 't1'

    const task = { id: 't1', title: 'T1', description: 'd', requiredSkills: [], budget: 1, status: 'OPEN', projectId: 'p1', milestoneId: null, assigneeId: null, dueAt: null, createdAt: '', updatedAt: '' }
    axios.post.mockResolvedValue({ data: { success: true, data: { ...task, status: 'CLAIMED' } } })
    axios.put.mockResolvedValue({ data: { success: true, data: { ...task, title: 'Updated' } } })
    axios.delete.mockResolvedValue({ data: { success: true } })

    const store = useTaskStore()
    store.tasks = [task as any]

    const claimed = await store.claimTask('t1')
    expect(claimed).toBe(true)

    const submitted = await store.submitTask('t1', { repoUrl: 'https://repo' })
    expect(submitted).toBe(true)

    const updated = await store.updateTask('t1', { title: 'Updated' })
    expect(updated).toBe(true)

    const deleted = await store.deleteTask('t1')
    expect(deleted).toBe(true)
    expect(store.tasks.length).toBe(0)
  })

  it('resets state', () => {
    const store = useTaskStore()
    store.tasks = [{ id: 't1' } as any]
    store.currentTask = { id: 't1' } as any
    store.reset()

    expect(store.tasks.length).toBe(0)
    expect(store.currentTask).toBeNull()
  })

  it('fetches task detail and handles setPage', async () => {
    axios.get.mockResolvedValue({ data: { success: true, data: { id: 't1', title: 'T1', description: 'd', requiredSkills: [], budget: 1, status: 'OPEN', projectId: 'p1', milestoneId: null, assigneeId: null, dueAt: null, createdAt: '', updatedAt: '' } } })

    const store = useTaskStore()
    const ok = await store.fetchTask('t1')
    expect(ok).toBe(true)
    expect(store.currentTask?.id).toBe('t1')

    store.setPage(2)
    expect(store.pagination.page).toBe(2)
  })
})
