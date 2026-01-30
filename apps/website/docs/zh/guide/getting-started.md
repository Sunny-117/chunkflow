# 快速开始

本指南将帮助你在几分钟内开始使用 ChunkFlow Upload SDK。

## 前置要求

- Node.js 18+ 或 Bun
- 包管理器（pnpm、npm 或 yarn）
- React 或 Vue 的基础知识（用于框架集成）

## 安装

根据你的使用场景选择需要的包：

### React 项目

::: code-group

```bash [pnpm]
pnpm add @chunkflow/core @chunkflow/upload-client-react @chunkflow/upload-component-react
```

```bash [npm]
npm install @chunkflow/core @chunkflow/upload-client-react @chunkflow/upload-component-react
```

```bash [yarn]
yarn add @chunkflow/core @chunkflow/upload-client-react @chunkflow/upload-component-react
```

:::

### Vue 项目

::: code-group

```bash [pnpm]
pnpm add @chunkflow/core @chunkflow/upload-client-vue @chunkflow/upload-component-vue
```

```bash [npm]
npm install @chunkflow/core @chunkflow/upload-client-vue @chunkflow/upload-component-vue
```

```bash [yarn]
yarn add @chunkflow/core @chunkflow/upload-client-vue @chunkflow/upload-component-vue
```

:::

### 原生 JavaScript

::: code-group

```bash [pnpm]
pnpm add @chunkflow/core
```

```bash [npm]
npm install @chunkflow/core
```

```bash [yarn]
yarn add @chunkflow/core
```

:::

### 服务端

::: code-group

```bash [pnpm]
pnpm add @chunkflow/upload-server
```

```bash [npm]
npm install @chunkflow/upload-server
```

```bash [yarn]
yarn add @chunkflow/upload-server
```

:::

## 包概览

ChunkFlow 组织为多个包：

| 包 | 描述 |
|---------|-------------|
| `@chunkflow/protocol` | TypeScript 类型定义和接口 |
| `@chunkflow/shared` | 通用工具（事件、并发、文件工具） |
| `@chunkflow/core` | 核心上传逻辑和状态机 |
| `@chunkflow/upload-client-react` | React Hooks 和 Context |
| `@chunkflow/upload-client-vue` | Vue Composables 和 Plugin |
| `@chunkflow/upload-component-react` | 开箱即用的 React 组件 |
| `@chunkflow/upload-component-vue` | 开箱即用的 Vue 组件 |
| `@chunkflow/upload-server` | Node.js 服务端 SDK |

## React 快速开始

### 1. 创建请求适配器

请求适配器处理与服务器的通信：

```typescript
import { createFetchAdapter } from '@chunkflow/core';

export const uploadAdapter = createFetchAdapter({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});
```

### 2. 设置 Provider

```tsx
// src/App.tsx
import { UploadProvider } from '@chunkflow/upload-client-react';
import { uploadAdapter } from './lib/upload';
import { UploadPage } from './pages/UploadPage';

export default function App() {
  return (
    <UploadProvider requestAdapter={uploadAdapter}>
      <UploadPage />
    </UploadProvider>
  );
}
```

### 3. 使用上传组件

```tsx
// src/pages/UploadPage.tsx
import { UploadButton, UploadList } from '@chunkflow/upload-component-react';

export function UploadPage() {
  return (
    <div className="container">
      <h1>上传文件</h1>
      <UploadButton 
        accept="image/*,video/*,application/pdf"
        maxSize={500 * 1024 * 1024} // 500MB
        multiple
      >
        📁 选择文件
      </UploadButton>
      <UploadList />
    </div>
  );
}
```

完成！你现在拥有一个功能齐全的上传界面，具有：
- ✅ 大文件分片上传
- ✅ 断点续传
- ✅ 秒传（去重）
- ✅ 进度跟踪
- ✅ 暂停/恢复/取消控制

## Vue 快速开始

### 1. 安装插件

```typescript
// src/main.ts
import { createApp } from 'vue';
import { UploadPlugin } from '@chunkflow/upload-client-vue';
import { createFetchAdapter } from '@chunkflow/core';
import App from './App.vue';

const adapter = createFetchAdapter({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

const app = createApp(App);
app.use(UploadPlugin, { requestAdapter: adapter });
app.mount('#app');
```

### 2. 使用上传组件

```vue
<!-- src/pages/UploadPage.vue -->
<script setup>
import { UploadButton, UploadList } from '@chunkflow/upload-component-vue';
</script>

<template>
  <div class="container">
    <h1>上传文件</h1>
    <UploadButton 
      accept="image/*,video/*,application/pdf"
      :max-size="500 * 1024 * 1024"
      multiple
    >
      📁 选择文件
    </UploadButton>
    <UploadList />
  </div>
</template>
```

## 原生 JavaScript 快速开始

### 1. 安装

```bash
pnpm add @chunkflow/core
```

### 2. 创建管理器

```typescript
import { UploadManager, createFetchAdapter } from '@chunkflow/core';

const adapter = createFetchAdapter({
  baseURL: 'http://localhost:3000/api',
});

const manager = new UploadManager({
  requestAdapter: adapter,
  defaultChunkSize: 1024 * 1024, // 1MB
  defaultConcurrency: 3,
});

await manager.init();
```

### 3. 处理文件上传

```typescript
const fileInput = document.querySelector('#file-input');
const progressBar = document.querySelector('#progress');
const statusText = document.querySelector('#status');

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const task = manager.createTask(file);

  task.on('progress', ({ progress, speed }) => {
    progressBar.value = progress.percentage;
    statusText.textContent = `${progress.percentage.toFixed(1)}% - ${formatSpeed(speed)}`;
  });

  task.on('success', ({ fileUrl }) => {
    statusText.textContent = '上传完成！';
    console.log('文件 URL:', fileUrl);
  });

  task.on('error', ({ error }) => {
    statusText.textContent = `错误: ${error.message}`;
  });

  await task.start();
});
```

## 服务端快速开始

### 选项 1：使用演示服务器

克隆并运行演示服务器：

```bash
git clone https://github.com/Sunny-117/chunkflow.git
cd chunkflow/apps/server
pnpm install
docker-compose up -d  # 启动 PostgreSQL
pnpm run start:dev
```

服务器将在 `http://localhost:3000` 上可用。

### 选项 2：实现你自己的

```typescript
import { UploadService, LocalStorageAdapter, PostgreSQLAdapter } from '@chunkflow/upload-server';

const storage = new LocalStorageAdapter('./storage');
const database = new PostgreSQLAdapter({
  host: 'localhost',
  port: 5432,
  database: 'chunkflow',
  user: 'postgres',
  password: 'postgres',
});

const uploadService = new UploadService({
  storageAdapter: storage,
  database,
  tokenSecret: 'your-secret-key',
  defaultChunkSize: 1024 * 1024,
});

// 与你的框架一起使用（Express、Fastify、Nest.js 等）
```

查看[服务端配置](/zh/guide/server-config)指南了解详细说明。

## 下一步

- 了解[架构](/zh/guide/architecture)
- 理解[上传策略](/zh/guide/upload-strategies)
- 探索[配置选项](/zh/guide/client-config)
- 查看[示例](/zh/examples/react)
