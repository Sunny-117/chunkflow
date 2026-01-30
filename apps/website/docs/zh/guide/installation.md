# 安装

## 包管理器

ChunkFlow 支持所有主流包管理器。选择你喜欢的：

### pnpm（推荐）

```bash
pnpm add @chunkflow/core
```

### npm

```bash
npm install @chunkflow/core
```

### yarn

```bash
yarn add @chunkflow/core
```

### bun

```bash
bun add @chunkflow/core
```

## 包选择

根据你的需求选择包：

### 最小设置（仅核心）

用于原生 JavaScript 或自定义集成：

```bash
pnpm add @chunkflow/core
```

### React 设置

用于带有开箱即用组件的 React 应用：

```bash
pnpm add @chunkflow/core @chunkflow/upload-client-react @chunkflow/upload-component-react
```

### Vue 设置

用于带有开箱即用组件的 Vue 应用：

```bash
pnpm add @chunkflow/core @chunkflow/upload-client-vue @chunkflow/upload-component-vue
```

### 服务端设置

用于 Node.js 服务器实现：

```bash
pnpm add @chunkflow/upload-server
```

### 全栈设置

用于完整的客户端和服务端设置：

```bash
# 客户端
pnpm add @chunkflow/core @chunkflow/upload-client-react @chunkflow/upload-component-react

# 服务端
pnpm add @chunkflow/upload-server
```

## TypeScript 支持

所有 ChunkFlow 包都是用 TypeScript 编写的，并开箱即用地包含类型定义。不需要额外的 `@types` 包。

## 浏览器支持

ChunkFlow 支持所有现代浏览器：

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

### 所需的浏览器 API

ChunkFlow 使用以下浏览器 API：

- **File API**：用于读取文件
- **Fetch API**：用于 HTTP 请求（或者你可以提供自定义适配器）
- **IndexedDB**：用于断点续传持久化（可选，优雅降级）
- **Web Workers**：用于 hash 计算（可选，回退到主线程）

## Node.js 支持

用于服务端使用：

- Node.js 18+
- Bun 1.0+

## CDN 使用

你也可以通过 CDN 使用 ChunkFlow 进行快速原型设计：

```html
<script type="module">
  import { UploadManager } from 'https://esm.sh/@chunkflow/core';
  
  // 你的代码
</script>
```

::: warning
不建议在生产环境中使用 CDN。使用包管理器以获得更好的性能和可靠性。
:::

## 验证

安装后，验证 ChunkFlow 是否正确安装：

```typescript
import { UploadManager } from '@chunkflow/core';

console.log(UploadManager); // 应该输出类构造函数
```

## 下一步

现在你已经安装了 ChunkFlow，查看[快速开始](/zh/guide/getting-started)指南开始在你的项目中使用它。
