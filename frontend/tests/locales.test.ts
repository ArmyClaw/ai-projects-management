import { describe, it, expect, beforeEach, vi } from 'vitest'

const loadModule = async () => await import('@/locales')

describe('locales', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('defaults to zh-CN when no locale', async () => {
    const mod = await loadModule()
    expect(mod.default.global.locale.value).toBe('zh-CN')
  })

  it('uses stored locale when provided', async () => {
    localStorage.setItem('locale', 'en-US')
    const mod = await loadModule()
    expect(mod.default.global.locale.value).toBe('en-US')
  })
})
