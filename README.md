# event-emitter [![Unit Test](https://github.com/xj63/event-emitter/actions/workflows/unit-test.yml/badge.svg)](https://github.com/xj63/event-emitter/actions/workflows/unit-test.yml) [![JSR](https://jsr.io/badges/@xj63/event-emitter)](https://jsr.io/@xj63/event-emitter) ![Minify Size](https://xj63.github.io/event-emitter/minify.svg) ![Gzipped Size](https://xj63.github.io/event-emitter/gzip.svg)

🚀 一个用 TypeScript 编写的、零依赖、轻量级且快速的事件发射器。

`EventEmitter` 的核心优势在于其类型安全性。当您使用链式调用注册事件时，事件发射器实例的类型会自动更新。这使得在后续调用 `.emit()` 或 `.on()` 时，编辑器能够提供精确的事件名称自动补全和严格的负载类型检查，有效防止因事件名称拼写错误或传递错误数据结构而导致的常见运行时错误。

## ✨ 特性

- **类型安全**: 完全类型化的事件名称和负载（payload），提供编译时检查。
- **链式调用**: 流畅的 API 设计，让代码书写更加优雅和连贯。
- **自动类型推断**: 事件类型会随着您的定义而动态演进，无需手动维护类型。
- **零依赖**: 纯 TypeScript 实现，体积小巧，易于集成到任何项目中。
- **现代架构**: 支持 ESM 和 CJS 模块，并使用最新的 TypeScript 特性构建。
- **文档齐全**: 所有公开 API 均有完整的 JSDoc 注释和使用示例。

## 📦 安装

您可以根据您使用的包管理器选择以下任意一种方式进行安装：

```bash
# JSR (推荐)
npx jsr add @xj63/event-emitter   # npm
yarn add jsr:@xj63/event-emitter  # yarn
pnpm i jsr:@xj63/event-emitter    # pnpm
bunx jsr add @xj63/event-emitter  # bun
deno add jsr:@xj63/event-emitter  # deno

# import { EventEmitter } from "@xj63/event-emitter";
```

## 🚀 快速上手

下面是一个基本的使用示例，展示了如何创建实例、注册事件和类型安全地触发它们。

```/dev/null/example.ts#L1-26
import { EventEmitter } from '@xj63/event-emitter'

// 1. 创建一个新的 EventEmitter 实例
const emitter = new EventEmitter()
  // 注册 'user:created' 事件，并定义其负载类型
  .on('user:created', (user: { id: number; name: string }) => {
    console.log(`创建了新用户: ${user.name} (ID: ${user.id})`)
  })
  // 注册 'data' 事件，并定义其负载类型
  .once('data', (data: string) => {
    console.log(`收到了数据: ${data}`)
  })

// 2. 类型安全地触发事件
// - 编辑器会提示 'user:created' 和 'data' 两个事件名。
// - 当你选择 'user:created' 时，TypeScript 知道第二个参数必须是 { id: number; name:string }。
emitter.emit('user:created', { id: 1, name: 'Alice' }) // 输出: 创建了新用户: Alice (ID: 1)
emitter.emit('data', 'Hello World') // 输出: 收到了数据: Hello World

// 3. 静态类型检查会捕获错误
// 下面的代码会在编译时报错，因为负载类型不匹配。
// emitter.emit('user:created', { id: 2 }) // 错误: 属性 'name' 缺失
// emitter.emit('data', 123) // 错误: 类型 'number' 不能赋值给类型 'string'

// 'data' 事件是一次性的，再次触发将无效
emitter.emit('data', 'Hello Again') // 无任何输出
```

## 📖 API 文档

<https://jsr.io/@xj63/event-emitter/doc/~/EventEmitter>

## 💻 本地开发

如果您想为本项目做出贡献，可以按照以下步骤设置开发环境：

1.  克隆仓库:
    ```bash
    git clone https://github.com/xj63/event-emitter.git
    cd event-emitter
    ```

2.  安装依赖:
    ```bash
    bun install
    ```

3.  运行测试:
    ```bash
    bun test
    ```

4.  构建项目:
    ```bash
    bun run build
    ```

## 📜 License

[MIT](./LICENSE) License © 2025 xj63
