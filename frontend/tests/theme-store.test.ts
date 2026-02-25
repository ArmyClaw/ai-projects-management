import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const matchMediaMock = (matches = false) => ({
  matches,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(() => matchMediaMock(false))
})

const { useThemeStore } = await import('@/stores/theme')

describe('theme store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
    document.documentElement.className = ''
  })

  it('initializes from localStorage', () => {
    localStorage.setItem('app-theme', 'dark')
    const store = useThemeStore()
    store.initialize()

    expect(store.theme).toBe('dark')
    expect(store.isDark).toBe(true)
  })

  it('sets theme and toggles class', () => {
    const store = useThemeStore()
    store.setTheme('dark')

    expect(localStorage.getItem('app-theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    store.setTheme('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('toggles theme and returns icon/text', () => {
    const store = useThemeStore()
    store.setTheme('light')
    store.toggleTheme()
    expect(store.theme).toBe('dark')

    expect(store.getThemeIcon()).toBe('🌙')
    expect(store.getThemeText()).toBe('深色')
  })
})
