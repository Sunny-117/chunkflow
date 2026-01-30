---
layout: home

hero:
  name: "ChunkFlow"
  text: "文件上传 SDK"
  tagline: 通用的大文件上传解决方案，支持分片上传、断点续传和秒传功能
  image:
    src: /logo.png
    alt: ChunkFlow
  actions:
    - theme: brand
      text: 快速开始
      link: /zh/guide/getting-started
    - theme: alt
      text: 在 GitHub 上查看
      link: https://github.com/Sunny-117/chunkflow

features:
  - icon: 🚀
    title: 智能上传策略
    details: 根据文件大小自动选择直传或分片上传，获得最佳性能
  - icon: 📦
    title: 动态分片
    details: 根据网络状况自适应调整分片大小，类似 TCP 慢启动算法
  - icon: ⚡
    title: 秒传功能
    details: 基于 Hash 的去重机制，已存在的文件可以瞬间完成上传
  - icon: 🔄
    title: 断点续传
    details: 使用 IndexedDB 持久化进度，从中断处继续上传
  - icon: 🎯
    title: 框架无关
    details: 无缝支持 React、Vue 和原生 JavaScript
  - icon: 🛠️
    title: 高度可扩展
    details: 插件系统允许你使用自定义逻辑扩展功能
  - icon: 🏗️
    title: 分层架构
    details: 模块化设计，包含 Protocol、Shared、Core、Client、Component 和 Server 层
  - icon: 🔒
    title: 生产就绪
    details: 完整的错误处理、重试机制和全面的测试覆盖
---

## 快速开始

::: code-group

```bash [pnpm]
pnpm add @chunkflow/core @chunkflow/upload-client-react
```

```bash [npm]
npm install @chunkflow/core @chunkflow/upload-client-react
```

```bash [yarn]
yarn add @chunkflow/core @chunkflow/upload-client-react
```

:::

## React 示例

```tsx
import { UploadProvider } from '@chunkflow/upload-client-react';
import { UploadButton, UploadList } from '@chunkflow/upload-component-react';
import { createFetchAdapter } from '@chunkflow/core';

const adapter = createFetchAdapter({
  baseURL: 'http://localhost:3000/api',
});

function App() {
  return (
    <UploadProvider requestAdapter={adapter}>
      <UploadButton accept="image/*,video/*" maxSize={100 * 1024 * 1024}>
        选择文件
      </UploadButton>
      <UploadList />
    </UploadProvider>
  );
}
```

## Vue 示例

```vue
<script setup>
import { createApp } from 'vue';
import { UploadPlugin } from '@chunkflow/upload-client-vue';
import { UploadButton, UploadList } from '@chunkflow/upload-component-vue';
import { createFetchAdapter } from '@chunkflow/core';

const adapter = createFetchAdapter({
  baseURL: 'http://localhost:3000/api',
});

const app = createApp(App);
app.use(UploadPlugin, { requestAdapter: adapter });
</script>

<template>
  <UploadButton accept="image/*,video/*" :max-size="100 * 1024 * 1024">
    选择文件
  </UploadButton>
  <UploadList />
</template>
```

## 为什么选择 ChunkFlow？

ChunkFlow 采用"高度解耦、渐进增强、性能优先"的设计理念：

- **高度解耦**：每一层都是独立的 - 只使用你需要的部分
- **性能优先**：Hash 计算和上传并行执行、动态分片、并发控制
- **用户体验优先**：秒传、断点续传、实时进度反馈
- **开发者友好**：TypeScript 类型安全、完善的文档、开箱即用的组件
- **生产就绪**：完整的错误处理、重试机制、测试覆盖
