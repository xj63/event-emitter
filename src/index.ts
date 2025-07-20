type Overwrite<T, K extends PropertyKey, V> = Omit<T, K> & Record<K, V>

/**
 * 一个类型安全的事件发射器。
 *
 * 允许你注册事件监听器并在代码中触发这些事件。
 * 它的核心优势是完全的类型安全，TypeScript 能够推断出事件负载（payload）的类型。
 *
 * @template E - 一个对象类型，其中键是事件名称，值是传递给监听器的数据类型。
 * @example
 * ```ts
 * const emitter = new EventEmitter()
 *   .on('user:created', (user: { id: number; name: string }) => {
 *     console.log(`创建了新用户: ${user.name} (ID: ${user.id})`)
 *   })
 *   .on('data', (data: string) => {
 *     console.log(`收到了数据: ${data}`)
 *   })
 *
 * // 类型安全地触发事件
 * emitter.emit('user:created', { id: 1, name: 'Alice' })
 * emitter.emit('data', 'Hello World')
 * ```
 */
export class EventEmitter<E extends Record<PropertyKey, any> = {}> {
  private map = new Map<PropertyKey, ((event: any) => void)[]>()

  /**
   * 注册一个事件监听器，该监听器会在指定事件被触发时调用。
   *
   * 如果为新事件注册监听器，该事件及其负载类型将被添加到 `EventEmitter` 的类型定义中。
   *
   * @template K - 事件的名称。
   * @param key - 事件的名称。
   * @param listener - 事件触发时要执行的回调函数。它会接收到事件的负载。
   * @returns `EventEmitter` 实例，以便进行链式调用。
   * @example
   * ```ts
   * const emitter = new EventEmitter()
   *
   * // 定义一个 'message' 事件，负载类型为 string
   * emitter.on('message', (msg: string) => {
   *   console.log(`新消息: ${msg}`)
   * })
   *
   * // TypeScript 现在知道了 'message' 事件及其类型
   * emitter.emit('message', '你好，类型安全！')
   * ```
   */
  public on<K extends keyof E>(
    key: K,
    listener: (event: E[K]) => void,
  ): EventEmitter<E>
  public on<K extends PropertyKey, T>(
    key: K,
    listener: (event: T) => void,
  ): EventEmitter<Overwrite<E, K, T>>

  public on(
    key: PropertyKey,
    listener: (event: any) => void,
  ): EventEmitter<any> {
    const listenerList = this.map.get(key)

    if (listenerList === undefined) this.map.set(key, [listener])
    else if (!listenerList.includes(listener)) listenerList.push(listener)

    return this
  }

  /**
   * 注册一个一次性的事件监听器。该监听器在被调用一次后会自动移除。
   *
   * @template K - 事件的名称。
   * @param key - 事件的名称。
   * @param listener - 当事件首次触发时要执行的回调函数。
   * @returns `EventEmitter` 实例，以便进行链式调用。
   * @example
   * ```ts
   * const emitter = new EventEmitter()
   *
   * emitter.once('one-time', (data: string) => {
   *   console.log(`此消息只会被记录一次: ${data}`)
   * })
   *
   * emitter.emit('one-time', '第一次调用') // 控制台输出: "此消息只会被记录一次: 第一次调用"
   * emitter.emit('one-time', '第二次调用') // 无任何反应
   * ```
   */
  public once<K extends keyof E>(
    key: K,
    listener: (event: E[K]) => void,
  ): EventEmitter<E>
  public once<K extends PropertyKey, T>(
    key: K,
    listener: (event: T) => void,
  ): EventEmitter<Overwrite<E, K, T>>

  public once<T>(
    key: PropertyKey,
    listener: (event: T) => void,
  ): EventEmitter<any> {
    const onceWrapper = (event: T) => {
      this.off(key, onceWrapper)
      listener(event)
    }
    this.on(key, onceWrapper)
    return this
  }

  /**
   * 移除事件监听器。
   *
   * - 如果只提供 `key`，则移除该事件的所有监听器。
   * - 如果同时提供 `key` 和 `listener`，则只移除指定的监听器。
   *
   * @param key - 要移除监听器的事件名称。
   * @param listener - (可选) 要移除的特定监听器函数。
   * @returns `EventEmitter` 实例，以便进行链式调用。
   * @example
   * ```ts
   * const emitter = new EventEmitter()
   * const listener1 = (msg: string) => console.log('监听器 1:', msg)
   * const listener2 = (msg: string) => console.log('监听器 2:', msg)
   *
   * emitter.on('greet', listener1)
   * emitter.on('greet', listener2)
   *
   * emitter.emit('greet', '你好') // 两个监听器都会触发
   *
   * // 移除一个特定的监听器
   * emitter.off('greet', listener1)
   * emitter.emit('greet', '再次你好') // 只有监听器 2 会触发
   *
   * // 移除 'greet' 事件的所有监听器
   * emitter.off('greet')
   * emitter.emit('greet', '最后一次你好') // 没有监听器会触发
   * ```
   */
  public off<K extends keyof E>(key: K): EventEmitter<Omit<E, K>>
  public off(key: PropertyKey): EventEmitter<E>
  public off<K extends keyof E>(
    key: K,
    listener: (event: E[K]) => void,
  ): EventEmitter<E>
  public off(key: PropertyKey, listener: (event: any) => void): EventEmitter<E>

  public off<K extends keyof E>(
    key: K,
    listener?: (event: any) => void,
  ): EventEmitter<any> {
    if (listener === undefined) {
      this.map.delete(key)
      return this
    }

    const listenerList = this.map.get(key)
    if (listenerList === undefined) return this

    listenerList.splice(listenerList.indexOf(listener) >>> 0, 1)
    if (listenerList.length === 0) this.map.delete(key)

    return this
  }

  /**
   * 触发一个事件，调用所有为该事件注册的监听器。
   *
   * @param key - 要触发的事件名称。
   * @param event - 传递给监听器的负载数据。其类型必须与事件定义时指定的类型匹配。
   * @returns `EventEmitter` 实例，以便进行链式调用。
   * @example
   * ```ts
   * const emitter = new EventEmitter()
   *   .on('ping', (payload: { timestamp: number }) => {
   *     const time = new Date(payload.timestamp).toLocaleTimeString()
   *     console.log(`在 ${time} 收到了 Ping`)
   *   })
   *
   * emitter.emit('ping', { timestamp: Date.now() })
   * ```
   */
  public emit<K extends keyof E>(key: K, event: E[K]): EventEmitter<E>
  public emit(key: PropertyKey, event: any): EventEmitter<E>

  public emit(key: PropertyKey, event: any): EventEmitter<E> {
    const listenerList = this.map.get(key) ?? []
    listenerList.slice().forEach((listener) => listener(event))
    return this
  }

  /**
   * 清除所有事件的所有监听器。
   *
   * @returns `EventEmitter` 实例。
   * @example
   * ```ts
   * const emitter = new EventEmitter()
   * emitter.on('event1', () => console.log('event1'))
   * emitter.on('event2', () => console.log('event2'))
   *
   * emitter.clear()
   *
   * emitter.emit('event1') // 无任何反应
   * emitter.emit('event2') // 无任何反应
   * ```
   */
  public clear(): EventEmitter {
    this.map.clear()
    return this
  }
}
