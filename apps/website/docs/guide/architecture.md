# Architecture

ChunkFlow is built with a layered architecture where each layer has a specific responsibility and can be used independently.

## Layered Architecture

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

## Layer Responsibilities

### Protocol Layer (@chunkflow/protocol)

**Purpose**: Define communication contracts

**Responsibilities**:

- TypeScript type definitions
- API request/response interfaces
- Error types
- Constants

**Dependencies**: None

**Used By**: All other layers

**Key Files**:

- `types.ts` - Core type definitions
- `interfaces.ts` - API interfaces
- `constants.ts` - Constants

### Shared Layer (@chunkflow/shared)

**Purpose**: Provide common utilities

**Responsibilities**:

- Event system (using mitt)
- Concurrency control (using p-limit)
- File utilities (slicing, hashing)
- IndexedDB storage
- Helper functions

**Dependencies**: Protocol layer

**Used By**: Core, Client, Component layers

**Key Files**:

- `events.ts` - Event bus
- `concurrency.ts` - Concurrency controller
- `file-utils.ts` - File operations
- `storage.ts` - IndexedDB wrapper

### Core Layer (@chunkflow/core)

**Purpose**: Implement upload logic

**Responsibilities**:

- Upload state machine
- Task lifecycle management
- Queue management
- Plugin system
- Dynamic chunk sizing
- Retry logic

**Dependencies**: Protocol, Shared layers

**Used By**: Client, Component layers, or directly

**Key Files**:

- `UploadManager.ts` - Task manager
- `UploadTask.ts` - Single upload task
- `ChunkSizeAdjuster.ts` - Dynamic chunking
- `plugins/` - Plugin implementations

### Client Layer (React/Vue)

**Purpose**: Framework integration

**Responsibilities**:

- Framework-specific adapters
- Reactive state management
- Lifecycle integration
- Context/Provider setup

**Dependencies**: Core layer

**Used By**: Component layer, or directly

**React Package**:

- `UploadProvider.tsx` - Context provider
- `useUpload.ts` - Upload hook
- `useUploadList.ts` - List hook
- `useUploadManager.ts` - Manager hook

**Vue Package**:

- `plugin.ts` - Vue plugin
- `useUpload.ts` - Upload composable
- `useUploadList.ts` - List composable

### Component Layer (React/Vue)

**Purpose**: Ready-to-use UI components

**Responsibilities**:

- Pre-built upload components
- Default styling
- Accessibility
- User interactions

**Dependencies**: Client layer

**Used By**: Applications

**Components**:

- `UploadButton` - File selection
- `UploadList` - Task list
- `UploadProgress` - Progress bar
- `UploadDropzone` - Drag & drop

### Server Layer (@chunkflow/upload-server)

**Purpose**: Server-side implementation

**Responsibilities**:

- Upload service logic
- Storage adapters
- Database adapters
- Token management
- File streaming

**Dependencies**: Protocol layer

**Used By**: Server applications

**Key Files**:

- `UploadService.ts` - Main service
- `adapters/storage/` - Storage adapters
- `adapters/database/` - Database adapters

## Design Principles

### 1. High Decoupling

Each layer is independent and can be used separately:

```typescript
// Use only Core layer
import { UploadManager } from "@chunkflow/core";

// Use Core + React Client
import { UploadManager } from "@chunkflow/core";
import { useUpload } from "@chunkflow/upload-client-react";

// Use everything
import { UploadButton } from "@chunkflow/upload-component-react";
```

### 2. Progressive Enhancement

Start simple, add features as needed:

```typescript
// Basic upload
const task = manager.createTask(file);
await task.start();

// Add progress tracking
task.on("progress", ({ progress }) => {
  console.log(progress);
});

// Add plugins
manager.use(new LoggerPlugin());
manager.use(new StatisticsPlugin());
```

### 3. Performance First

Optimizations built-in:

- Parallel hash calculation and upload
- Dynamic chunk sizing
- Concurrency control
- Request pooling

### 4. Type Safety

Full TypeScript support:

- All APIs are typed
- Type inference works everywhere
- No `any` types in public APIs

### 5. Testability

Each layer is independently testable:

- Unit tests for utilities
- Integration tests for layers
- Property-based tests for correctness

## Data Flow

### Upload Flow

```
User selects file
       ↓
UploadManager.createTask()
       ↓
UploadTask created
       ↓
task.start()
       ↓
┌──────────────────┬──────────────────┐
│                  │                  │
│  Hash            │  Upload          │
│  Calculation     │  Chunks          │
│  (parallel)      │  (parallel)      │
│                  │                  │
└──────────────────┴──────────────────┘
       ↓                    ↓
Hash complete        All chunks uploaded
       ↓                    ↓
Verify hash          Merge file
       ↓                    ↓
┌──────────────────────────────────────┐
│  File exists?                        │
│  Yes → Instant upload (cancel chunks)│
│  No  → Continue upload               │
└──────────────────────────────────────┘
       ↓
Upload complete
       ↓
Emit success event
```

### State Machine

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

## Package Structure

```
chunkflow/
├── packages/
│   ├── protocol/              # Protocol layer
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   ├── interfaces.ts
│   │   │   └── constants.ts
│   │   └── package.json
│   │
│   ├── shared/                # Shared layer
│   │   ├── src/
│   │   │   ├── events.ts
│   │   │   ├── concurrency.ts
│   │   │   ├── file-utils.ts
│   │   │   └── storage.ts
│   │   └── package.json
│   │
│   ├── core/                  # Core layer
│   │   ├── src/
│   │   │   ├── UploadManager.ts
│   │   │   ├── UploadTask.ts
│   │   │   ├── ChunkSizeAdjuster.ts
│   │   │   └── plugins/
│   │   └── package.json
│   │
│   ├── upload-client-react/   # React client
│   │   ├── src/
│   │   │   ├── UploadProvider.tsx
│   │   │   ├── useUpload.ts
│   │   │   └── useUploadList.ts
│   │   └── package.json
│   │
│   ├── upload-client-vue/     # Vue client
│   │   ├── src/
│   │   │   ├── plugin.ts
│   │   │   ├── useUpload.ts
│   │   │   └── useUploadList.ts
│   │   └── package.json
│   │
│   ├── upload-component-react/# React components
│   │   ├── src/
│   │   │   ├── UploadButton.tsx
│   │   │   ├── UploadList.tsx
│   │   │   ├── UploadProgress.tsx
│   │   │   └── UploadDropzone.tsx
│   │   └── package.json
│   │
│   ├── upload-component-vue/  # Vue components
│   │   ├── src/
│   │   │   ├── UploadButton.vue
│   │   │   ├── UploadList.vue
│   │   │   ├── UploadProgress.vue
│   │   │   └── UploadDropzone.vue
│   │   └── package.json
│   │
│   └── upload-server/         # Server SDK
│       ├── src/
│       │   ├── UploadService.ts
│       │   └── adapters/
│       └── package.json
│
└── apps/
    ├── server/                # Demo server
    ├── playground/            # Demo app
    └── website/               # Documentation
```

## Dependency Graph

```
Protocol ← Shared ← Core ← Client ← Component
   ↑                         ↑
   └─────────────────────────┘

Protocol ← Server
```

## Extension Points

### 1. Custom Request Adapter

Implement `RequestAdapter` interface for custom HTTP clients.

### 2. Custom Storage Adapter

Implement `StorageAdapter` interface for custom storage backends.

### 3. Custom Database Adapter

Implement `DatabaseAdapter` interface for custom databases.

### 4. Plugins

Implement `Plugin` interface to extend functionality.

### 5. Custom Components

Build custom UI components using Client layer hooks/composables.

## See Also

- [Upload Strategies](/guide/upload-strategies)
- [Configuration](/guide/client-config)
- [API Reference](/api/protocol)
