# 架构

ChunkFlow 采用分层架构设计，每一层都有特定的职责，并且可以独立使用。

## 分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                     应用层 (Apps)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Playground  │  │    Server    │  │   Website    │      │
│  │   (Demo)     │  │  (Nest.js)   │  │ (VitePress)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                     组件层 (Components)                      │
│  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│  │  upload-component-react  │  │  upload-component-vue    │ │
│  └──────────────────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   框架适配层 (Client)                        │
│  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│  │  upload-client-react     │  │  upload-client-vue       │ │
│  └──────────────────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      核心层 (Core)                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  @chunkflow/core                                     │   │
│  │  - UploadManager (状态机、队列管理)                  │   │
│  │  - UploadTask (单个上传任务)                         │   │
│  │  - Plugin System (插件机制)                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   共享层 (Shared)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  @chunkflow/shared                                   │   │
│  │  - 事件系统 (mitt)                                    │   │
│  │  - 并发控制 (p-limit)                                │   │
│  │  - 文件工具 (切片、Hash)                             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    协议层 (Protocol)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  @chunkflow/protocol                                 │   │
│  │  - 接口定义 (TypeScript Types)                       │   │
│  │  - 请求/响应格式                                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   服务端层 (Server)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  @chunkflow/server                                   │   │
│  │  - BFF SDK                                           │   │
│  │  - 存储适配器                                         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 层级职责

### 协议层 (@chunkflow/protocol)

**目的**：定义通信契约

**职责**：

- TypeScript 类型定义
- API 请求/响应接口
- 错误类型
- 常量

**依赖**：无

**被使用**：所有其他层

**关键文件**：

- `types.ts` - 核心类型定义
- `interfaces.ts` - API 接口
- `constants.ts` - 常量

### 共享层 (@chunkflow/shared)

**目的**：提供通用工具

**职责**：

- 事件系统（使用 mitt）
- 并发控制（使用 p-limit）
- 文件工具（切片、哈希）
- IndexedDB 存储
- 辅助函数

**依赖**：协议层

**被使用**：核心层、客户端层、组件层

**关键文件**：

- `events.ts` - 事件总线
- `concurrency.ts` - 并发控制器
- `file-utils.ts` - 文件操作
- `storage.ts` - IndexedDB 封装

### 核心层 (@chunkflow/core)

**目的**：实现上传逻辑

**职责**：

- 上传状态机
- 任务生命周期管理
- 队列管理
- 插件系统
- 动态分片大小
- 重试逻辑

**依赖**：协议层、共享层

**被使用**：客户端层、组件层，或直接使用

**关键文件**：

- `UploadManager.ts` - 任务管理器
- `UploadTask.ts` - 单个上传任务
- `ChunkSizeAdjuster.ts` - 动态分片
- `plugins/` - 插件实现

### 客户端层 (React/Vue)

**目的**：框架集成

**职责**：

- 框架特定适配器
- 响应式状态管理
- 生命周期集成
- Context/Provider 设置

**依赖**：核心层

**被使用**：组件层，或直接使用

**React 包**：

- `UploadProvider.tsx` - Context provider
- `useUpload.ts` - Upload hook
- `useUploadList.ts` - List hook
- `useUploadManager.ts` - Manager hook

**Vue 包**：

- `plugin.ts` - Vue 插件
- `useUpload.ts` - Upload composable
- `useUploadList.ts` - List composable

### 组件层 (React/Vue)

**目的**：开箱即用的 UI 组件

**职责**：

- 预构建的上传组件
- 默认样式
- 无障碍访问
- 用户交互

**依赖**：客户端层

**被使用**：应用程序

**组件**：

- `UploadButton` - 文件选择
- `UploadList` - 任务列表
- `UploadProgress` - 进度条
- `UploadDropzone` - 拖放区域

### 服务端层 (@chunkflow/upload-server)

**目的**：服务端实现

**职责**：

- 上传服务逻辑
- 存储适配器
- 数据库适配器
- Token 管理
- 文件流处理

**依赖**：协议层

**被使用**：服务端应用

**关键文件**：

- `UploadService.ts` - 主服务
- `adapters/storage/` - 存储适配器
- `adapters/database/` - 数据库适配器

## 设计原则

### 1. 高度解耦

每一层都是独立的，可以单独使用：

```typescript
// 仅使用核心层
import { UploadManager } from "@chunkflow/core";

// 使用核心层 + React 客户端
import { UploadManager } from "@chunkflow/core";
import { useUpload } from "@chunkflow/upload-client-react";

// 使用全部
import { UploadButton } from "@chunkflow/upload-component-react";
```

### 2. 渐进增强

从简单开始，根据需要添加功能：

```typescript
// 基础上传
const task = manager.createTask(file);
await task.start();

// 添加进度跟踪
task.on("progress", ({ progress }) => {
  console.log(progress);
});

// 添加插件
manager.use(new LoggerPlugin());
manager.use(new StatisticsPlugin());
```

### 3. 性能优先

内置优化：

- 并行哈希计算和上传
- 动态分片大小
- 并发控制
- 请求池化

### 4. 类型安全

完整的 TypeScript 支持：

- 所有 API 都有类型
- 类型推断无处不在
- 公共 API 中没有 `any` 类型

### 5. 可测试性

每一层都可以独立测试：

- 工具函数的单元测试
- 层级的集成测试
- 正确性的属性测试

## 数据流

### 上传流程

```
用户选择文件
       ↓
UploadManager.createTask()
       ↓
创建 UploadTask
       ↓
task.start()
       ↓
┌──────────────────┬──────────────────┐
│                  │                  │
│  哈希            │  上传            │
│  计算            │  分片            │
│  (并行)          │  (并行)          │
│                  │                  │
└──────────────────┴──────────────────┘
       ↓                    ↓
哈希完成              所有分片上传完成
       ↓                    ↓
验证哈希              合并文件
       ↓                    ↓
┌──────────────────────────────────────┐
│  文件存在？                          │
│  是 → 秒传（取消分片上传）           │
│  否 → 继续上传                       │
└──────────────────────────────────────┘
       ↓
上传完成
       ↓
触发成功事件
```

### 状态机

```
       ┌─────┐
       │IDLE │
       └──┬──┘
          │ start()
          ↓
     ┌────────┐
     │HASHING │
     └───┬────┘
         │
         ↓
    ┌──────────┐
    │UPLOADING │←──────┐
    └─┬──┬──┬──┘       │
      │  │  │          │
      │  │  └──pause() │
      │  │             │
      │  │  ┌──────┐   │
      │  │  │PAUSED│───┘
      │  │  └──────┘ resume()
      │  │
      │  └──cancel()
      │     ┌─────────┐
      │     │CANCELLED│
      │     └─────────┘
      │
      ├──success()
      │  ┌───────┐
      │  │SUCCESS│
      │  └───────┘
      │
      └──error()
         ┌─────┐
         │ERROR│
         └─────┘
```

## 包结构

```
chunkflow/
├── packages/
│   ├── protocol/              # 协议层
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   ├── interfaces.ts
│   │   │   └── constants.ts
│   │   └── package.json
│   │
│   ├── shared/                # 共享层
│   │   ├── src/
│   │   │   ├── events.ts
│   │   │   ├── concurrency.ts
│   │   │   ├── file-utils.ts
│   │   │   └── storage.ts
│   │   └── package.json
│   │
│   ├── core/                  # 核心层
│   │   ├── src/
│   │   │   ├── UploadManager.ts
│   │   │   ├── UploadTask.ts
│   │   │   ├── ChunkSizeAdjuster.ts
│   │   │   └── plugins/
│   │   └── package.json
│   │
│   ├── upload-client-react/   # React 客户端
│   │   ├── src/
│   │   │   ├── UploadProvider.tsx
│   │   │   ├── useUpload.ts
│   │   │   └── useUploadList.ts
│   │   └── package.json
│   │
│   ├── upload-client-vue/     # Vue 客户端
│   │   ├── src/
│   │   │   ├── plugin.ts
│   │   │   ├── useUpload.ts
│   │   │   └── useUploadList.ts
│   │   └── package.json
│   │
│   ├── upload-component-react/# React 组件
│   │   ├── src/
│   │   │   ├── UploadButton.tsx
│   │   │   ├── UploadList.tsx
│   │   │   ├── UploadProgress.tsx
│   │   │   └── UploadDropzone.tsx
│   │   └── package.json
│   │
│   ├── upload-component-vue/  # Vue 组件
│   │   ├── src/
│   │   │   ├── UploadButton.vue
│   │   │   ├── UploadList.vue
│   │   │   ├── UploadProgress.vue
│   │   │   └── UploadDropzone.vue
│   │   └── package.json
│   │
│   └── upload-server/         # 服务端 SDK
│       ├── src/
│       │   ├── UploadService.ts
│       │   └── adapters/
│       └── package.json
│
└── apps/
    ├── server/                # 演示服务器
    ├── playground/            # 演示应用
    └── website/               # 文档
```

## 依赖关系图

```
Protocol ← Shared ← Core ← Client ← Component
   ↑                         ↑
   └─────────────────────────┘

Protocol ← Server
```

## 扩展点

### 1. 自定义请求适配器

实现 `RequestAdapter` 接口以支持自定义 HTTP 客户端。

### 2. 自定义存储适配器

实现 `StorageAdapter` 接口以支持自定义存储后端。

### 3. 自定义数据库适配器

实现 `DatabaseAdapter` 接口以支持自定义数据库。

### 4. 插件

实现 `Plugin` 接口以扩展功能。

### 5. 自定义组件

使用客户端层的 hooks/composables 构建自定义 UI 组件。

## 另请参阅

- [上传策略](/zh/guide/upload-strategies)
- [配置](/zh/guide/client-config)
- [API 参考](/zh/api/protocol)
