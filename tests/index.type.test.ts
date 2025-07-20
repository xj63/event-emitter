import { describe, expectTypeOf, it } from 'vitest'
import { EventEmitter } from '../src/index'

describe('EventEmitter Type Construction and Dynamic Usage', () => {
  it('should build a strict type for known events while remaining open for dynamic events', () => {
    // 1. 通过链式调用构造一个具有明确事件类型的 emitter
    const emitter = new EventEmitter()
      .on('user:created', (_user: { id: number; name: string }) => {})
      .on('data', (_payload: ArrayBuffer) => {})

    // 2. 测试已知事件：这些事件会受到严格的类型检查

    // 正确的用法应该通过类型检查
    emitter.emit('user:created', { id: 1, name: 'Alice' })
    emitter.emit('data', new ArrayBuffer(8))

    emitter.emit('user:created', { id: 1 })
    emitter.emit('data', 'not an ArrayBuffer')

    // 3. 测试动态（未知）事件：这些事件应该被允许，不会产生类型错误
    // 这是因为 `emit(key: PropertyKey, event: any)` 这个重载签名捕获了这些调用。
    emitter.emit('some:other:event', 'any value is allowed')
    emitter.emit('analytics:track', { event: 'click', value: 123 })
    emitter.emit('untyped-event', undefined)

    // 4. 验证动态触发事件不会将该事件添加到 emitter 的类型签名中
    // 即使我们触发了 'analytics:track'，它的类型也没有被“记住”
    const emitterAfterDynamicEmit = emitter.emit('analytics:track', {})

    // `emitterAfterDynamicEmit` 的类型应该与原始的 `emitter` 完全相同
    expectTypeOf(emitterAfterDynamicEmit).toEqualTypeOf(emitter)
  })

  it('should correctly modify the type signature after chaining .off() and .clear()', () => {
    const finalEmitter = new EventEmitter()
      .on('a', (_: string) => {})
      .on('b', (_: number) => {})
      .on('c', (_: boolean) => {})
      .off('b') // 'b' 被移除
      .clear() // 所有事件 ('a', 'c') 被移除
      .on('new_event', (_: { value: string }) => {}) // 添加新事件

    // 旧事件在类型上应该都已被移除
    finalEmitter.emit('a', 'test')
    finalEmitter.emit('b', 123)
    finalEmitter.emit('c', true)

    // 只有新事件是类型安全的
    finalEmitter.emit('new_event', { value: 'works' })

    finalEmitter.emit('new_event', { value: 123 })

    // 并且，它仍然是开放的，可以动态触发其他事件
    finalEmitter.emit('another-dynamic-event', 'this is still allowed')
  })

  it('proves that the constructed instance is fully usable', () => {
    // 构造一个最终的 emitter 实例
    const emitter = new EventEmitter()
      .on('start', (_: { config: string }) => {})
      .on('end', (_: { reason: string }) => {})

    // 这个实例现在是完全类型化且可用的。
    // 我们可以添加监听器，触发事件，一切都如预期工作。

    // 使用已知事件是类型安全的
    emitter.on('start', (payload) => {
      expectTypeOf(payload).toEqualTypeOf<{ config: string }>()
    })
    emitter.emit('start', { config: 'fast' })

    // 触发动态事件也是允许的
    emitter.emit('log:info', 'Application started')
  })
})
