<div align="center">
  <img src="./assets/logo.png" alt="ChunkFlow Logo" width="300" height="300" />
  <h1>ChunkFlow Upload SDK</h1>
  <p>
    <strong>通用的大文件上传解决方案</strong>
  </p>
  <p>
    <a href="https://www.npmjs.com/package/@chunkflow/core"><img src="https://img.shields.io/npm/v/@chunkflow/core.svg" alt="npm version"></a>
    <a href="https://github.com/Sunny-117/chunkflow/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license"></a>
    <a href="https://github.com/Sunny-117/chunkflow"><img src="https://img.shields.io/github/stars/Sunny-117/chunkflow.svg?style=social" alt="GitHub stars"></a>
  </p>
  <p>
    <a href="./README.md">English</a> | <a href="./README.zh-CN.md">简体中文</a>
  </p>
  <p>
    <a href="https://sunny-117.github.io/chunkflow/zh/">📖 文档</a>
  </p>
</div>

---

## ✨ 特性

- 🚀 **智能上传策略** - 根据文件大小自动选择直传或分片上传
- 📦 **动态分片** - 根据网络状况自适应调整分片大小（类似 TCP 慢启动）
- ⚡ **秒传功能** - 基于 Hash 的去重机制实现秒传
- 🔄 **断点续传** - 使用 IndexedDB 持久化，从中断处继续上传
- 🎯 **框架无关** - 核心层适用于任何框架
- ⚛️ **React 支持** - 为 React 应用提供 Hooks 和组件
- 💚 **Vue 支持** - 为 Vue 应用提供 Composables 和组件
- 🛠️ **高度可扩展** - 插件系统支持自定义功能
- 🔒 **类型安全** - 使用 TypeScript 编写，提供完整类型定义
- 🧪 **完善测试** - 全面的单元测试和基于属性的测试

## 📦 包

### 核心包

- **[@chunkflow/protocol](./packages/protocol)** - 协议层，包含类型定义和 API 接口
- **[@chunkflow/shared](./packages/shared)** - 共享工具（事件系统、并发控制、文件工具、存储）
- **[@chunkflow/core](./packages/core)** - 核心上传引擎，包含状态机和任务管理

### 客户端包

- **[@chunkflow/upload-client-react](./packages/upload-client-react)** - React 适配器，提供 Hooks
- **[@chunkflow/upload-client-vue](./packages/upload-client-vue)** - Vue 适配器，提供 Composables
- **[@chunkflow/upload-component-react](./packages/upload-component-react)** - 开箱即用的 React 组件
- **[@chunkflow/upload-component-vue](./packages/upload-component-vue)** - 开箱即用的 Vue 组件

### 服务端包

- **[@chunkflow/upload-server](./packages/upload-server)** - 服务端 SDK，包含存储适配器

## 🚀 快速开始

### 安装

```bash
# React 项目
pnpm add @chunkflow/core @chunkflow/upload-client-react

# Vue 项目
pnpm add @chunkflow/core @chunkflow/upload-client-vue
```

### React 使用

```tsx
import { UploadProvider, useUpload } from "@chunkflow/upload-client-react";
import { createFetchAdapter } from "@chunkflow/core";

const adapter = createFetchAdapter({
  baseURL: "http://localhost:3000/api",
});

function App() {
  return (
    <UploadProvider requestAdapter={adapter}>
      <UploadComponent />
    </UploadProvider>
  );
}

function UploadComponent() {
  const { upload, status, progress } = useUpload({
    onSuccess: (fileUrl) => console.log("上传完成:", fileUrl),
    onError: (error) => console.error("上传失败:", error),
  });

  return (
    <div>
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />
      <div>状态: {status}</div>
      <div>进度: {progress.percentage}%</div>
    </div>
  );
}
```

### Vue 使用

```html
<script setup>
import { useUpload } from "@chunkflow/upload-client-vue";

const { upload, status, progress } = useUpload({
  onSuccess: (fileUrl) => console.log("上传完成:", fileUrl),
  onError: (error) => console.error("上传失败:", error),
});

const handleFileChange = (event) => {
  const file = event.target.files?.[0];
  if (file) upload(file);
};
</script>

<template>
  <div>
    <input type="file" @change="handleFileChange" />
    <div>状态: {{ status }}</div>
    <div>进度: {{ progress.percentage }}%</div>
  </div>
</template>
```

## 🏗️ 架构

ChunkFlow Upload SDK 采用分层架构：

```
┌─────────────────────────────────────────────────────────────┐
│                        应用层                                │
│  Playground (演示) │ Server (Nest.js) │ Website (文档)      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                        组件层                                │
│  React 组件 │ Vue 组件                                       │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                     客户端适配层                             │
│  React Hooks │ Vue Composables                               │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                        核心层                                │
│  上传管理器 │ 上传任务 │ 插件系统                            │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                        共享层                                │
│  事件系统 │ 并发控制 │ 文件工具 │ 存储                       │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                        协议层                                │
│  类型定义 │ API 接口                                         │
└─────────────────────────────────────────────────────────────┘
```

## 📚 文档

完整文档请访问：[https://sunny-117.github.io/chunkflow/zh/](https://sunny-117.github.io/chunkflow/zh/)

## 🛠️ 开发

本项目使用 pnpm workspaces 和 Turbo 管理的 monorepo 结构。

### 前置要求

- Node.js >= 18.0.0
- pnpm >= 9.0.0

### 设置

```bash
# 安装依赖
pnpm install

# 构建所有包
pnpm build

# 运行测试
pnpm test

# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

### 项目结构

```
chunkflow/
├── packages/              # SDK 包
│   ├── protocol/         # 协议层
│   ├── shared/           # 共享工具
│   ├── core/             # 核心上传引擎
│   ├── upload-client-react/    # React 适配器
│   ├── upload-client-vue/      # Vue 适配器
│   ├── upload-component-react/ # React 组件
│   ├── upload-component-vue/   # Vue 组件
│   └── upload-server/    # 服务端 SDK
├── apps/                 # 应用
│   ├── server/          # Nest.js 服务器
│   ├── playground/      # 演示应用
│   └── website/         # 文档站点
├── pnpm-workspace.yaml  # 工作区配置
├── turbo.json           # Turbo 配置
└── package.json         # 根 package.json
```

## 🧪 测试

本项目使用双重测试方法：

- **单元测试** - 测试特定示例和边界情况
- **基于属性的测试** - 使用 fast-check 在随机输入上测试通用属性

```bash
# 运行所有测试
pnpm test

# 监视模式运行测试
pnpm test:watch

# 运行测试并生成覆盖率报告
pnpm test -- --coverage
```

## 🤝 贡献

欢迎贡献！在提交 PR 之前，请阅读我们的[贡献指南](./CONTRIBUTING.md)。

## 📄 许可证

MIT © [Sunny-117](https://github.com/Sunny-117)

## 🙏 致谢

- [mitt](https://github.com/developit/mitt) - 事件发射器
- [p-limit](https://github.com/sindresorhus/p-limit) - 并发控制
- [spark-md5](https://github.com/satazor/js-spark-md5) - MD5 哈希
- [fast-check](https://github.com/dubzzz/fast-check) - 基于属性的测试

---

<div align="center">
  <p>用 ❤️ 制作，作者 <a href="https://github.com/Sunny-117">Sunny-117</a></p>
  <p>
    <a href="https://github.com/Sunny-117/chunkflow/stargazers">⭐ 在 GitHub 上给我们一个 Star</a>
  </p>
</div>
