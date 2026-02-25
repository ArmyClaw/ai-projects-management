import { describe, it, expect, beforeEach, vi } from 'vitest'

const handlers: Record<string, Function[]> = {}

const fakeSocket = {
  connected: false,
  id: 'socket-1',
  on: vi.fn((event: string, cb: Function) => {
    handlers[event] = handlers[event] || []
    handlers[event].push(cb)
  }),
  off: vi.fn((event: string, cb: Function) => {
    handlers[event] = (handlers[event] || []).filter(fn => fn !== cb)
  }),
  emit: vi.fn(),
  disconnect: vi.fn(() => {
    fakeSocket.connected = false
  })
}

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => fakeSocket)
}))

vi.mock('@/stores/notification', () => ({
  useNotificationStore: () => ({ addNotification: vi.fn() })
}))

const websocket = await import('@/services/websocket')

describe('websocket service', () => {
  beforeEach(() => {
    fakeSocket.connected = false
    fakeSocket.emit.mockClear()
    fakeSocket.on.mockClear()
    fakeSocket.off.mockClear()
    fakeSocket.disconnect.mockClear()
    Object.keys(handlers).forEach(key => delete handlers[key])
    localStorage.clear()
  })

  it('creates a connection and subscribes on connect', () => {
    localStorage.setItem('userId', 'u1')
    localStorage.setItem('token', 't1')

    const socket = websocket.createConnection()
    expect(socket).toBe(fakeSocket)

    fakeSocket.connected = true
    handlers.connect?.forEach(fn => fn())

    expect(fakeSocket.emit).toHaveBeenCalledWith('subscribe', 'user:u1')
  })

  it('tracks connection changes', async () => {
    websocket.createConnection()
    const changes: boolean[] = []
    const unsubscribe = websocket.onConnectionChange((connected) => changes.push(connected))

    handlers.connect?.forEach(fn => fn())
    handlers.disconnect?.forEach(fn => fn())

    expect(changes.length).toBeGreaterThan(0)
    unsubscribe()
  })

  it('listens to notification events', () => {
    websocket.createConnection()
    const payload = { id: 'n1', title: 't', message: 'm', createdAt: '' }
    const cb = vi.fn()

    websocket.onNotification('task:update', cb)
    handlers['notification:task:update']?.forEach(fn => fn(payload))

    expect(cb).toHaveBeenCalledWith(payload)
  })

  it('disconnects manually', () => {
    websocket.createConnection()
    websocket.disconnect()
    expect(fakeSocket.disconnect).toHaveBeenCalled()
  })

  it('reports connection status', () => {
    expect(websocket.getConnectionStatus()).toBe(false)
    websocket.createConnection()
    fakeSocket.connected = true
    expect(websocket.getConnectionStatus()).toBe(true)
  })
})
