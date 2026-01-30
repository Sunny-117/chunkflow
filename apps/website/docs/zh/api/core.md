# Core API

Core 层实现了上传状态机、任务管理和插件系统。

## UploadManager

管理多个上传任务的主类。

### 构造函数

```typescript
new UploadManager(options: UploadManagerOptions)
```

#### 选项

```typescript
interface UploadManagerOptions {
  requestAdapter: RequestAdapter; // HTTP 适配器（必需）
  maxConcurrentTasks?: number; // 最大并行上传数（默认: 3）
  defaultChunkSize?: number; // 默认分片大小（默认: 1MB）
  defaultConcurrency?: number; // 默认分片并发数（默认: 3）
  autoResumeUnfinished?: boolean; // 初始化时自动恢复（默认: true）
}
```

### 方法

#### init()

初始化管理器并恢复未完成的任务。

```typescript
await manager.init(): Promise<void>
```

#### createTask()

创建新的上传任务。

```typescript
manager.createTask(file: File, options?: Partial<UploadTaskOptions>): UploadTask
```

**参数:**

- `file`: 要上传的文件
- `options`: 任务特定选项（可选）

**返回:** UploadTask 实例

**示例:**

```typescript
const task = manager.createTask(file, {
  chunkSize: 2 * 1024 * 1024, // 2MB 分片
  concurrency: 5, // 5 个并行分片
  retryCount: 3, // 重试 3 次
});
```

#### getTask()

通过 ID 获取任务。

```typescript
manager.getTask(taskId: string): UploadTask | undefined
```

#### getAllTasks()

获取所有任务。

```typescript
manager.getAllTasks(): UploadTask[]
```

#### deleteTask()

删除任务并清理资源。

```typescript
await manager.deleteTask(taskId: string): Promise<void>
```

#### use()

注册插件。

```typescript
manager.use(plugin: Plugin): void
```

## UploadTask

表示单个上传任务。

### 属性

```typescript
task.id: string                    // 唯一任务 ID
task.file: File                    // 正在上传的文件
task.status: UploadStatus          // 当前状态
task.progress: UploadProgress      // 上传进度
```

### 方法

#### start()

开始上传。

```typescript
await task.start(): Promise<void>
```

#### pause()

暂停上传。

```typescript
task.pause(): void
```

#### resume()

恢复暂停的上传。

```typescript
await task.resume(): Promise<void>
```

#### cancel()

取消上传。

```typescript
task.cancel(): void
```

#### on()

监听事件。

```typescript
task.on<K extends keyof UploadEvents>(
  event: K,
  handler: (payload: UploadEvents[K]) => void
): void
```

### 事件

```typescript
interface UploadEvents {
  start: { taskId: string; file: File };
  progress: { taskId: string; progress: number; speed: number };
  chunkSuccess: { taskId: string; chunkIndex: number };
  chunkError: { taskId: string; chunkIndex: number; error: Error };
  hashProgress: { taskId: string; progress: number };
  hashComplete: { taskId: string; hash: string };
  success: { taskId: string; fileUrl: string };
  error: { taskId: string; error: Error };
  pause: { taskId: string };
  resume: { taskId: string };
  cancel: { taskId: string };
}
```

## 插件系统

使用插件扩展 ChunkFlow 功能。

### 插件接口

```typescript
interface Plugin {
  name: string;
  install?(manager: UploadManager): void;
  onTaskCreated?(task: UploadTask): void;
  onTaskStart?(task: UploadTask): void;
  onTaskProgress?(task: UploadTask, progress: UploadProgress): void;
  onTaskSuccess?(task: UploadTask): void;
  onTaskError?(task: UploadTask, error: Error): void;
}
```

### 内置插件

#### LoggerPlugin

将上传事件记录到控制台。

```typescript
import { LoggerPlugin } from "@chunkflow/core";

manager.use(new LoggerPlugin());
```

#### StatisticsPlugin

跟踪上传统计信息。

```typescript
import { StatisticsPlugin } from "@chunkflow/core";

const stats = new StatisticsPlugin();
manager.use(stats);

// 获取统计信息
const data = stats.getStats();
console.log(data.totalUploaded);
console.log(data.successCount);
console.log(data.errorCount);
```

## 另请参阅

- [Protocol API](/zh/api/protocol) - 类型定义
- [Shared API](/zh/api/shared) - 通用工具
- [Client React API](/zh/api/client-react) - React 集成
- [Client Vue API](/zh/api/client-vue) - Vue 集成
