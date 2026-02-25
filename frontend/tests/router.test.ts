import { describe, it, expect, vi } from 'vitest'

vi.mock('@/views/HomeView.vue', () => ({ default: {} }))
vi.mock('@/views/ProjectsView.vue', () => ({ default: {} }))
vi.mock('@/views/TasksView.vue', () => ({ default: {} }))
vi.mock('@/views/ReportsView.vue', () => ({ default: {} }))
vi.mock('@/views/SkillsView.vue', () => ({ default: {} }))
vi.mock('@/views/ProfileView.vue', () => ({ default: {} }))

const routerModule = await import('@/router')
const router = routerModule.default
const { routes, prefetchRoute } = routerModule

describe('router', () => {
  it('defines core routes', () => {
    const paths = routes.map(r => r.path)
    expect(paths).toContain('/projects')
    expect(paths).toContain('/tasks')
    expect(paths).toContain('/reports')
  })

  it('prefetchRoute triggers component loader', () => {
    const loader = vi.fn().mockResolvedValue({ default: {} })
    prefetchRoute({ component: loader } as any)
    expect(loader).toHaveBeenCalled()
  })

  it('scrollBehavior returns saved position or top', () => {
    const scrollBehavior = (router as any).options.scrollBehavior
    expect(scrollBehavior({}, {}, { left: 0, top: 100 })).toEqual({ left: 0, top: 100 })
    expect(scrollBehavior({}, {}, null)).toEqual({ top: 0 })
  })
})
