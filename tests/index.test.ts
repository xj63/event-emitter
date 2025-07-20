import { describe, expect, it, vi } from 'vitest'
import { EventEmitter } from '../src/index'

describe('EventEmitter', () => {
  it('应该能够无误地实例化', () => {
    expect(() => new EventEmitter()).not.toThrow()
  })

  describe('on()', () => {
    it('应该能添加一个监听器并支持链式调用', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()
      const result = emitter.on('test', listener)
      expect(result).toBe(emitter)
    })

    it('不应该重复添加同一个监听器实例', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()
      emitter.on('test', listener)
      emitter.on('test', listener)
      emitter.emit('test', 'payload')
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('应该能正常使用 Symbol 作为事件键', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()
      const eventSymbol = Symbol('event')
      emitter.on(eventSymbol, listener)
      emitter.emit(eventSymbol, 'payload')
      expect(listener).toHaveBeenCalledWith('payload')
    })
  })

  describe('emit()', () => {
    it('应该使用提供的 payload 调用监听器', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()
      const payload = { data: 'test' }
      emitter.on('event', listener)
      emitter.emit('event', payload)
      expect(listener).toHaveBeenCalledWith(payload)
    })

    it('应该调用一个事件的所有监听器', () => {
      const emitter = new EventEmitter()
      const listener1 = vi.fn()
      const listener2 = vi.fn()
      emitter.on('event', listener1)
      emitter.on('event', listener2)
      emitter.emit('event', 'payload')
      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)
    })

    it('不应该调用其他事件的监听器', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()
      emitter.on('event1', listener)
      emitter.emit('event2', 'payload')
      expect(listener).not.toHaveBeenCalled()
    })

    it('在没有注册监听器时触发事件不应抛出错误', () => {
      const emitter = new EventEmitter()
      expect(() => emitter.emit('nonexistent', 'payload')).not.toThrow()
    })

    it('应该支持链式调用', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()
      emitter.on('event', listener)
      const result = emitter.emit('event', 'payload')
      expect(result).toBe(emitter)
    })
  })

  describe('off(key, listener)', () => {
    it('应该移除一个指定的监听器', () => {
      const emitter = new EventEmitter()
      const listener1 = vi.fn()
      const listener2 = vi.fn()
      emitter.on('event', listener1)
      emitter.on('event', listener2)
      emitter.off('event', listener1)
      emitter.emit('event', 'payload')
      expect(listener1).not.toHaveBeenCalled()
      expect(listener2).toHaveBeenCalledTimes(1)
    })

    it('应该支持链式调用', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()
      emitter.on('event', listener)
      const result = emitter.off('event', listener)
      expect(result).toBe(emitter)
    })

    it('在移除一个不存在的监听器时应该能优雅地处理', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()
      expect(() => emitter.off('event', listener)).not.toThrow()
    })
  })

  describe('off(key)', () => {
    it('应该移除一个事件的所有监听器', () => {
      const emitter = new EventEmitter()
      const listener1 = vi.fn()
      const listener2 = vi.fn()
      emitter.on('event', listener1)
      emitter.on('event', listener2)
      emitter.off('event')
      emitter.emit('event', 'payload')
      expect(listener1).not.toHaveBeenCalled()
      expect(listener2).not.toHaveBeenCalled()
    })

    it('不应该移除其他事件的监听器', () => {
      const emitter = new EventEmitter()
      const listener1 = vi.fn()
      const listener2 = vi.fn()
      emitter.on('event1', listener1)
      emitter.on('event2', listener2)
      emitter.off('event1')
      emitter.emit('event1', 'payload1')
      emitter.emit('event2', 'payload2')
      expect(listener1).not.toHaveBeenCalled()
      expect(listener2).toHaveBeenCalledWith('payload2')
    })

    it('应该支持链式调用', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()
      emitter.on('event', listener)
      const result = emitter.off('event')
      expect(result).toBe(emitter)
    })

    it('在没有监听器的情况下调用 off(key) 不应抛出错误', () => {
      const emitter = new EventEmitter()
      expect(() => emitter.off('nonexistent-key')).not.toThrow()
    })
  })

  describe('once()', () => {
    it('应该只调用监听器一次', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()
      emitter.once('event', listener)
      emitter.emit('event', 'payload1')
      emitter.emit('event', 'payload2')
      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith('payload1')
    })

    it('应该支持链式调用', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()
      const result = emitter.once('event', listener)
      expect(result).toBe(emitter)
    })

    it('不应该影响其他普通的监听器', () => {
      const emitter = new EventEmitter()
      const onceListener = vi.fn()
      const onListener = vi.fn()
      emitter.once('event', onceListener)
      emitter.on('event', onListener)

      emitter.emit('event', 'payload1')
      emitter.emit('event', 'payload2')

      expect(onceListener).toHaveBeenCalledTimes(1)
      expect(onListener).toHaveBeenCalledTimes(2)
      expect(onListener).toHaveBeenCalledWith('payload1')
      expect(onListener).toHaveBeenCalledWith('payload2')
    })

    it('在使用 off(key) 移除后，once 监听器不应被触发', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()
      emitter.once('event', listener)
      emitter.off('event')
      emitter.emit('event', 'payload')
      expect(listener).not.toHaveBeenCalled()
    })

    it('一个 once 监听器可以重新将自身注册为 once 监听器，并在下一次 emit 时执行', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn(() => {
        // 为防止测试中无限循环，只重新注册前两次调用
        if (listener.mock.calls.length < 2) {
          emitter.once('event', listener)
        }
      })
      emitter.once('event', listener)

      emitter.emit('event', 'payload1') // 第一次调用, 重新注册
      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith('payload1')

      emitter.emit('event', 'payload2') // 第二次调用, 重新注册
      expect(listener).toHaveBeenCalledTimes(2)
      expect(listener).toHaveBeenCalledWith('payload2')

      emitter.emit('event', 'payload3') // 第三次调用, 不再重新注册
      expect(listener).toHaveBeenCalledTimes(2) // 仍然是 2 次
    })
  })

  describe('clear()', () => {
    it('应该移除所有事件的所有监听器', () => {
      const emitter = new EventEmitter()
      const listener1 = vi.fn()
      const listener2 = vi.fn()
      emitter.on('event1', listener1)
      emitter.on('event2', listener2)
      emitter.clear()
      emitter.emit('event1', 'p1')
      emitter.emit('event2', 'p2')
      expect(listener1).not.toHaveBeenCalled()
      expect(listener2).not.toHaveBeenCalled()
    })

    it('应该支持链式调用', () => {
      const emitter = new EventEmitter()
      const result = emitter.clear()
      expect(result).toBe(emitter)
    })

    it('在没有注册任何监听器时调用 clear() 不应抛出错误', () => {
      const emitter = new EventEmitter()
      expect(() => emitter.clear()).not.toThrow()
    })
  })

  describe('emit() 期间的监听器副作用', () => {
    it('在 emit 过程中，一个监听器不应触发在同一次 emit 中新添加的监听器', () => {
      const emitter = new EventEmitter()
      const listener2 = vi.fn()
      const listener1 = vi.fn(() => {
        emitter.on('event', listener2)
      })

      emitter.on('event', listener1)
      emitter.emit('event', 'payload')

      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).not.toHaveBeenCalled() // 新监听器在本次 emit 不执行

      emitter.emit('event', 'payload2')
      expect(listener1).toHaveBeenCalledTimes(2)
      expect(listener2).toHaveBeenCalledTimes(1) // 在下次 emit 执行
      expect(listener2).toHaveBeenCalledWith('payload2')
    })

    it('在 emit 过程中，一个监听器移除另一个监听器，被移除的监听器仍应在当前轮次被执行', () => {
      const emitter = new EventEmitter()
      const listener2 = vi.fn()
      const listener1 = vi.fn(() => {
        emitter.off('event', listener2)
      })

      emitter.on('event', listener1)
      emitter.on('event', listener2)
      emitter.emit('event', 'payload')

      // 两者都应被调用，因为 emit 迭代的是一个副本
      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)

      emitter.emit('event', 'payload2')
      expect(listener1).toHaveBeenCalledTimes(2)
      expect(listener2).toHaveBeenCalledTimes(1) // listener2 不再被调用
    })

    it('如果一个监听器抛出异常，应该停止执行后续的监听器', () => {
      const emitter = new EventEmitter()
      const errorListener = vi.fn(() => {
        throw new Error('test error')
      })
      const subsequentListener = vi.fn()

      emitter.on('event', errorListener)
      emitter.on('event', subsequentListener)

      expect(() => emitter.emit('event', 'payload')).toThrow('test error')
      expect(errorListener).toHaveBeenCalledTimes(1)
      expect(subsequentListener).not.toHaveBeenCalled() // 后续监听器未执行
    })

    it('在 emit 过程中，一个监听器调用 clear()，当前轮次的其他监听器仍应被执行', () => {
      const emitter = new EventEmitter()
      const listener2 = vi.fn()
      const listener1 = vi.fn(() => {
        emitter.clear()
      })

      emitter.on('event', listener1)
      emitter.on('event', listener2)
      emitter.emit('event', 'payload')

      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1) // 两者都应被调用

      emitter.emit('event', 'payload2')
      expect(listener1).toHaveBeenCalledTimes(1) // 不再被调用
      expect(listener2).toHaveBeenCalledTimes(1) // 不再被调用
    })

    it('在 emit 过程中，一个监听器为当前事件调用 off(key)，当前轮次的其他监听器仍应被执行', () => {
      const emitter = new EventEmitter()
      const listener2 = vi.fn()
      const listenerOtherEvent = vi.fn()
      const listener1 = vi.fn(() => {
        emitter.off('event')
      })

      emitter.on('event', listener1)
      emitter.on('event', listener2)
      emitter.on('other-event', listenerOtherEvent)
      emitter.emit('event', 'payload')

      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)

      emitter.emit('event', 'payload2')
      expect(listener1).toHaveBeenCalledTimes(1) // 不再被调用
      expect(listener2).toHaveBeenCalledTimes(1) // 不再被调用

      emitter.emit('other-event', 'payload3')
      expect(listenerOtherEvent).toHaveBeenCalledTimes(1) // 其他事件不受影响
    })
  })
})
