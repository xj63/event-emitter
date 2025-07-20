type Overwrite<T, K extends PropertyKey, V> = Omit<T, K> & Record<K, V>

type IsUnknown<T> = unknown extends T
  ? T extends unknown
    ? [keyof T] extends [never]
      ? true
      : false
    : false
  : false

/**
 * 使用链式调用自动推断类型的事件发射器。
 *
 * `EventEmitter` 的核心优势在于其类型安全性。当您使用链式调用注册事件时，
 * 事件发射器实例的类型会自动更新，从而在后续调用 `.emit()` 或 `.on()` 时，
 * 编辑器能够提供精确的事件名称自动补全和严格的负载类型检查。
 *
 * 这可以有效防止因事件名称拼写错误或传递错误数据结构而导致的常见运行时错误。
 *
 * 所有方法均可链式调用 !!!
 *
 * @template E - 一个描述事件映射的对象类型。
 *              键是事件名称（`string`, `symbol`, `number`），
 *              值是事件负载（payload）的数据类型。
 *              这个类型参数不需要手动指定，它会通过链式调用自动推断和演进。
 * @example
 * ```ts
 * // 创建一个新的 EventEmitter 实例
 * const emitter = new EventEmitter()
 *   // 注册 'user:created' 事件，并定义其负载类型
 *   .on('user:created', (user: { id: number; name: string }) => {
 *     console.log(`创建了新用户: ${user.name} (ID: ${user.id})`)
 *   })
 *   // 注册 'data' 事件，并定义其负载类型
 *   .once('data', (data: string) => {
 *     console.log(`收到了数据: ${data}`)
 *   })
 *
 * // 1. 类型安全地触发事件：
 * // - 编辑器会提示 'user:created' 和 'data' 两个事件名。
 * // - 当你选择 'user:created' 时，TypeScript 知道第二个参数必须是 { id: number; name:string }。
 * emitter.emit('user:created', { id: 1, name: 'Alice' }) // 输出: 创建了新用户: Alice (ID: 1)
 * emitter.emit('data', 'Hello World') // 输出: 收到了数据: Hello World
 *
 * // 2. 静态类型检查：
 * // - 下面的代码会在编译时报错，因为负载类型不匹配。
 * // emitter.emit('user:created', { id: 2 }) // 错误: 属性 'name' 缺失
 * // emitter.emit('data', 123) // 错误: 类型 'number' 不能赋值给类型 'string'
 *
 * // 3. 也允许动态的注册和触发新的事件
 * emitter.on('user:deleted', (e: number) => {})
 * // 但此时不再享有类型提示
 * emitter.emit('user:deleted', 1)
 * ```
 */
export class EventEmitter<E extends Record<PropertyKey, any> = {}> {
  private map = new Map<PropertyKey, ((event: any) => void)[]>()

  /**
   * 注册一个事件监听器。
   *
   * 此方法通过 TypeScript 的函数重载实现了两种核心行为：
   * 1. **定义新事件**: 如果您提供一个之前未注册过的事件名，此方法会将其添加到 `EventEmitter` 的类型定义中。
   * 2. **监听现有事件**: 如果事件名已经存在，此方法会为该事件追加一个新的监听器，并确保监听器函数的参数类型与已定义的事件负载类型一致。
   *
   * **重要**: 如果使用相同的 `key` 和 `listener` 多次调用 `on` 方法，该监听器**只会**被注册一次，当事件来临时只会触发一次。
   * 此设计为了避免发生多次触发导致未期望的意外结果
   *
   * @template K - 事件的名称。
   * @template T - 事件的负载类型（仅在定义新事件时使用）。
   * @param key - 事件的名称。
   * @param listener - 事件触发时执行的回调函数，它会接收到相应的事件负载。
   * @returns `EventEmitter` 实例，其类型已更新，方便进行链式调用。
   * @example
   * ```ts
   * const emitter = new EventEmitter()
   *
   * // 1. 定义一个 'message' 新事件，其负载类型被推断为 string
   * .on('message', (msg: string) => {
   *   console.log(`新消息: ${msg}`)
   * })
   *
   * // 2. 为 'message' 事件添加另一个监听器
   * .on('message', (msg) => { // msg 的类型被正确推断为 string
   *   console.log(`另一个监听器收到了同样的消息: ${msg.toUpperCase()}`)
   * })
   *
   * // 3. 定义一个 'user:login' 事件
   * .on('user:login', (user: { name: string }) => {
   *   console.log(`${user.name} 已登录。`);
   * });
   *
   * // 触发事件
   * emitter.emit('message', '你好，类型安全！')
   * // 输出:
   * // 新消息: 你好，类型安全！
   * // 另一个监听器收到了同样的消息: 你好，类型安全！
   *
   * emitter.emit('user:login', { name: 'Bob' });
   * // 输出: Bob 已登录。
   * ```
   */
  // 为现有事件添加监听器
  public on<K extends keyof E>(
    key: K,
    listener: (event: E[K]) => void,
  ): EventEmitter<E>
  // 定义一个新事件并添加监听器
  public on<K extends PropertyKey, T>(
    key: K extends keyof E ? never : K,
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
   * 监听器会在它被调用之前从监听器列表中移除，这可以防止在监听器内部再次触发相同事件时导致无限循环。
   *
   * **重要**: 如果使用相同的 `key` 和 `listener` 多次调用 `on` 方法，该监听器**只会**被注册一次，当事件来临时只会触发一次。
   *
   * @template K - 事件的名称。
   * @template T - 事件的负载类型（仅在定义新事件时使用）。
   * @param key - 事件的名称。
   * @param listener - 当事件首次触发时要执行的回调函数。
   * @returns `EventEmitter` 实例，以便进行链式调用。
   * @example
   * ```ts
   * const emitter = new EventEmitter()
   *   .once('one-time', (data: string) => {
   *     console.log(`此消息只会被记录一次: ${data}`)
   *   })
   *
   * // 第一次触发，监听器会执行
   * emitter.emit('one-time', '第一次调用')
   * // 控制台输出: "此消息只会被记录一次: 第一次调用"
   *
   * // 第二次触发，监听器已不存在，无任何反应
   * emitter.emit('one-time', '第二次调用')
   * ```
   */
  public once<K extends keyof E>(
    key: K,
    listener: (event: E[K]) => void,
  ): EventEmitter<E>
  public once<K extends PropertyKey, T>(
    key: K extends keyof E ? never : K,
    listener: (event: T) => void,
  ): EventEmitter<Overwrite<E, K, T>>

  public once<T>(
    key: PropertyKey,
    listener: (event: T) => void,
  ): EventEmitter<any> {
    const onceWrapper = (event: T) => {
      // 在执行原始监听器之前，先移除自身
      this.off(key, onceWrapper)
      listener(event)
    }
    this.on(key, onceWrapper)
    return this
  }

  /**
   * 移除事件监听器。
   *
   * 根据提供的参数，此方法有以下行为：
   * - **`off(key)`**: 移除指定事件的所有监听器。
   *   注意：此操作也会从 `EventEmitter` 的类型定义中移除该事件，增强了类型安全性。
   * - **`off(key, listener)`**: 只移除指定的监听器函数。
   *   由于不能静态推导出是否已经没有该事件的监听，事件类型定义将保持不变。
   *
   * @param key - 要移除监听器的事件名称。
   * @param listener - (可选) 要移除的特定监听器函数。必须是 `on` 或 `once` 注册时使用的同一个函数引用。
   * @returns `EventEmitter` 实例，以便进行链式调用。
   * @example
   * ```ts
   * const emitter = new EventEmitter()
   *
   * const listener1 = (msg: string) => console.log('监听器 1:', msg)
   * const listener2 = (msg: string) => console.log('监听器 2:', msg)
   *
   * emitter.on('greet', listener1)
   * emitter.on('greet', listener2)
   *
   * emitter.emit('greet', '你好')
   * // 输出:
   * // 监听器 1: 你好
   * // 监听器 2: 你好
   *
   * // 1. 移除一个特定的监听器
   * emitter.off('greet', listener1)
   * emitter.emit('greet', '再次你好')
   * // 输出:
   * // 监听器 2: 再次你好
   *
   * // 2. 移除 'greet' 事件的所有监听器
   * emitter.off('greet')
   * emitter.emit('greet', '最后一次你好') // 没有监听器会触发，无任何反应
   * ```
   */
  public off<K extends keyof E>(key: K): EventEmitter<Omit<E, K>>
  public off(key: PropertyKey): EventEmitter<E>
  public off<K extends keyof E>(
    key: K,
    listener: (event: E[K]) => void,
  ): EventEmitter<E>
  public off<K extends PropertyKey, T>(
    key: K extends keyof E ? never : K,
    listener: (event: T) => void,
  ): EventEmitter<E>

  public off<K extends keyof E>(
    key: K,
    listener?: (event: any) => void,
  ): EventEmitter<any> {
    // case: off(key) - 移除所有监听器
    if (listener === undefined) {
      this.map.delete(key)
      return this
    }

    // case: off(key, listener) - 移除特定监听器
    const listenerList = this.map.get(key)
    if (listenerList === undefined) return this

    /// SAFETY: 当 indexOf 找不到时返回 -1。
    /// -1 >>> 0 (无符号右移) 结果是一个非常大的正数 4294967295，
    /// 这使得 splice 在索引越界时不会删除任何元素，行为安全。
    listenerList.splice(listenerList.indexOf(listener) >>> 0, 1)

    // 如果移除后监听器列表为空，则清理整个事件
    if (listenerList.length === 0) this.map.delete(key)

    return this
  }

  /**
   * 触发一个事件，同步调用所有为该事件注册的监听器。
   *
   * 如果触发的事件已经通过 `.on()` 或 `.once()` 链式构造，
   * TypeScript 会强制检查你提供的负载数据 `event` 是否符合该事件的类型。
   *
   * @param key - 要触发的事件名称。
   * @param event - 传递给监听器的负载数据。
   * @returns `EventEmitter` 实例，以便进行链式调用。
   * @example
   * ```ts
   * const emitter = new EventEmitter()
   *   .on('ping', (payload: { timestamp: number; source: string }) => {
   *     const time = new Date(payload.timestamp).toLocaleTimeString()
   *     console.log(`在 ${time} 从 ${payload.source} 收到了 Ping`)
   *   })
   *
   * // 触发 'ping' 事件，并提供符合类型的负载
   * emitter.emit('ping', { timestamp: Date.now(), source: 'ComponentA' })
   * // 输出: "在 [当前时间] 从 ComponentA 收到了 Ping"
   *
   * // 下面的调用会因为类型不匹配而导致 TypeScript 编译错误
   * // emitter.emit('ping', { timestamp: Date.now() }) // 错误: 属性 'source' 缺失
   *
   * // 允许注册不需要数据的回调
   * emitter
   *   .on('hello', () => {
   *     console.log('hi')
   *   })
   *   .emit('hello') 允许不带参数的 emit
   * ```
   */
  public emit<K extends keyof E>(key: K, event: E[K]): EventEmitter<E>
  public emit<K extends PropertyKey, T>(
    key: K extends keyof E ? never : K,
    event: T,
  ): EventEmitter<Overwrite<E, K, T>>
  public emit<K extends keyof E>(
    key: IsUnknown<E[K]> extends true ? K : never,
  ): EventEmitter<E>
  public emit<K extends PropertyKey, T>(
    key: K extends keyof E ? never : K,
  ): EventEmitter<Overwrite<E, K, T>>

  public emit(key: PropertyKey, event?: any): EventEmitter<E> {
    const listenerList = this.map.get(key) ?? []
    // 使用 slice() 创建一个副本，防止在监听器中修改原始数组（例如通过 .off()）时影响循环
    listenerList.slice().forEach((listener) => listener(event))
    return this
  }

  /**
   * 清除所有事件的所有监听器。
   *
   * 调用此方法后，`EventEmitter` 实例将变为空，所有已定义的事件类型都将被擦除。
   *
   * @returns `EventEmitter` 实例。
   * @example
   * ```ts
   * const emitter = new EventEmitter()
   * emitter.on('event1', () => console.log('event1'))
   * emitter.on('event2', () => console.log('event2'))
   *
   * emitter.emit('event1'); // 输出: event1
   *
   * emitter.clear()
   *
   * // clear() 后，所有监听器都已被移除
   * emitter.emit('event1') // 无任何反应
   * emitter.emit('event2') // 无任何反应
   * ```
   */
  public clear(): EventEmitter<{}> {
    this.map.clear()
    return this
  }
}
