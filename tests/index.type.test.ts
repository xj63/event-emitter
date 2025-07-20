import { beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { EventEmitter } from '../src/index'

describe('EventEmitter', () => {
  let emitter: EventEmitter

  beforeEach(() => {
    emitter = new EventEmitter()
  })

  describe('Instantiation and Type Evolution', () => {
    it('should have an empty type map on instantiation', () => {
      const freshEmitter = new EventEmitter()
      // 验证一个新事件可以被定义
      freshEmitter.on('test', (_: boolean) => {})
      freshEmitter.on('nonexistent', (_: string) => {})
    })

    it('should evolve the type signature correctly through chaining', () => {
      const finalEmitter = new EventEmitter()
        .on('a', (_: string) => {})
        .once('b', (_: number) => {})
        .emit('c', true)
        .off('a')

      // 验证演进后的类型行为
      finalEmitter.on('b', (payload) => expectTypeOf(payload).toBeNumber())
      finalEmitter.on('c', (payload) => expectTypeOf(payload).toBeBoolean())
      finalEmitter.on('a', () => {})
    })
  })

  describe('.on(key, listener)', () => {
    it('should register a listener that is called on emit', () => {
      const listener = vi.fn()
      emitter.on('hello', listener)
      emitter.emit('hello', 'world')
      expect(listener).toHaveBeenCalledOnce()
      expect(listener).toHaveBeenCalledWith('world')
    })

    it('should not register the same listener function more than once', () => {
      const listener = vi.fn()
      emitter.on('event', listener).on('event', listener)
      emitter.emit('event', 'payload')
      expect(listener).toHaveBeenCalledOnce()
    })

    it('should correctly infer and check types for new and existing events', () => {
      const emitterWithEvent = new EventEmitter().on(
        'user',
        (_payload: { name: string }) => {},
      )
      emitterWithEvent.on('user', (payload) => {
        expectTypeOf(payload).toEqualTypeOf<{ name: string }>()
      })
      // @ts-expect-error
      emitterWithEvent.on('user', (_payload: { id: number }) => {})
    })
  })

  describe('.once(key, listener)', () => {
    it('should register a listener that is called only once', () => {
      const listener = vi.fn()
      emitter.once('one-time', listener)
      emitter.emit('one-time', 'first')
      emitter.emit('one-time', 'second')
      expect(listener).toHaveBeenCalledOnce()
      expect(listener).toHaveBeenCalledWith('first')
    })
  })

  describe('.emit(key, event)', () => {
    it('should call all listeners for an event', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()
      emitter.on('multi', listener1).on('multi', listener2)
      emitter.emit('multi', 123)
      expect(listener1).toHaveBeenCalledWith(123)
      expect(listener2).toHaveBeenCalledWith(123)
    })

    it('should dynamically add a new event to the type signature', () => {
      const baseEmitter = new EventEmitter()
      const emitterAfterEmit = baseEmitter.emit('dynamic', { value: 123 })

      // 验证新事件的类型是可用的
      emitterAfterEmit.on('dynamic', (payload) => {
        expectTypeOf(payload).toEqualTypeOf<{ value: number }>()
        expect(payload).toEqual({ value: 123 }) // 运行时检查
      })

      emitterAfterEmit.emit('dynamic', { value: 123 })
    })
  })

  describe('.off(key, listener)', () => {
    it('should remove a specific listener', () => {
      const listenerToKeep = vi.fn()
      const listenerToRemove = vi.fn()
      emitter
        .on('mixed', listenerToKeep)
        .on('mixed', listenerToRemove)
        .off('mixed', listenerToRemove)
      emitter.emit('mixed', 'data')
      expect(listenerToKeep).toHaveBeenCalledOnce()
      expect(listenerToRemove).not.toHaveBeenCalled()
    })

    it('should remove all listeners and the event type with .off(key)', () => {
      const emitterWithEvent = new EventEmitter().on('temp', (_: string) => {})
      const emitterAfterOff = emitterWithEvent.off('temp')

      // 验证 'temp' 事件现在可以被用新的类型重新定义
      emitterAfterOff.on('temp', (payload: boolean) => {
        expectTypeOf(payload).toBeBoolean()
      })
    })
  })

  describe('.clear()', () => {
    it('should remove all listeners and reset types', () => {
      const listenerA = vi.fn()
      const richEmitter = new EventEmitter().on('eventA', listenerA)

      const clearedEmitter = richEmitter.clear()
      clearedEmitter.emit('eventA', 1) // 运行时验证
      expect(listenerA).not.toHaveBeenCalled()

      // 类型验证：'eventA' 可以被重新定义
      clearedEmitter.on('eventA', (payload: boolean) => {
        expectTypeOf(payload).toBeBoolean()
      })
    })
  })

  // ... 其他测试保持不变 ...
})
