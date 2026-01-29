# 设计文档

## 概述

ChunkFlow Upload SDK 是一个高度模块化的大文件上传解决方案，采用分层架构设计，支持从小文件直传到超大文件分片上传的完整场景。SDK 的核心设计理念是"高度解耦、渐进增强、性能优先"。

### 设计目标

1. **高度解耦**：各层独立，使用者可以只使用某一个子包
2. **性能优先**：Hash 计算与上传并行、动态切片、并发控制
3. **用户体验**：秒传、断点续传、实时进度反馈
4. **开发友好**：TypeScript 类型安全、完善的文档、开箱即用的组件
5. **生产就绪**：完整的错误处理、重试机制、测试覆盖

### 技术栈

- **构建工具**：pnpm + Turbo + tsdown
- **语言**：TypeScript（ESM）
- **前端框架**：React 18+、Vue 3+
- **后端框架**：Nest.js + Fastify
- **数据库**：PostgreSQL
- **测试**：Vitest
- **代码质量**：oxlint + oxfmt
- **文档**：VitePress

## 架构

### 整体架构图

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

### 包结构

```
chunkflow-upload-sdk/
├── packages/
│   ├── protocol/              # 协议层
│   ├── shared/                # 共享工具层
│   ├── core/                  # 核心层
│   ├── upload-client-react/   # React 适配层
│   ├── upload-client-vue/     # Vue 适配层
│   ├── upload-component-react/# React 组件
│   ├── upload-component-vue/  # Vue 组件
│   └── upload-server/         # 服务端 SDK
├── apps/
│   ├── server/                # Nest.js 服务端
│   ├── playground/            # 演示应用
│   └── website/               # 文档站点
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## 组件和接口

### 1. Protocol 层 (@chunkflow/protocol)

协议层定义前后端通信的所有接口和类型。

#### 核心类型定义

```typescript
// 文件信息
interface FileInfo {
  name: string;
  size: number;
  type: string;
  hash?: string;
  lastModified: number;
}

// 分片信息
interface ChunkInfo {
  index: number;
  hash: string;
  size: number;
  start: number;
  end: number;
}

// 上传令牌
interface UploadToken {
  token: string;
  fileId: string;
  chunkSize: number;
  expiresAt: number;
}

// 上传状态
enum UploadStatus {
  IDLE = "idle",
  HASHING = "hashing",
  UPLOADING = "uploading",
  PAUSED = "paused",
  SUCCESS = "success",
  ERROR = "error",
  CANCELLED = "cancelled",
}
```

#### API 接口定义

```typescript
// 1. 创建文件 (HEAD)
interface CreateFileRequest {
  fileName: string;
  fileSize: number;
  fileType: string;
  preferredChunkSize?: number;
}

interface CreateFileResponse {
  uploadToken: UploadToken;
  negotiatedChunkSize: number;
}

// 2. Hash 校验
interface VerifyHashRequest {
  fileHash?: string;
  chunkHashes?: string[];
  uploadToken: string;
}

interface VerifyHashResponse {
  fileExists: boolean;
  fileUrl?: string;
  existingChunks: number[];
  missingChunks: number[];
}

// 3. 分片上传
interface UploadChunkRequest {
  uploadToken: string;
  chunkIndex: number;
  chunkHash: string;
  chunk: Blob | Buffer;
}

interface UploadChunkResponse {
  success: boolean;
  chunkHash: string;
}

// 4. 逻辑合并
interface MergeFileRequest {
  uploadToken: string;
  fileHash: string;
  chunkHashes: string[];
}

interface MergeFileResponse {
  success: boolean;
  fileUrl: string;
  fileId: string;
}
```

#### 请求适配器接口

```typescript
interface RequestAdapter {
  createFile(request: CreateFileRequest): Promise<CreateFileResponse>;
  verifyHash(request: VerifyHashRequest): Promise<VerifyHashResponse>;
  uploadChunk(request: UploadChunkRequest): Promise<UploadChunkResponse>;
  mergeFile(request: MergeFileRequest): Promise<MergeFileResponse>;
}
```

### 2. Shared 层 (@chunkflow/shared)

共享层提供通用工具函数和类型定义。

#### 事件系统

```typescript
import mitt from "mitt";

// 上传事件类型
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

// 创建事件总线
const createEventBus = () => mitt<UploadEvents>();
```

#### 并发控制

```typescript
import pLimit from "p-limit";

interface ConcurrencyOptions {
  limit: number;
}

class ConcurrencyController {
  private limiter: ReturnType<typeof pLimit>;

  constructor(options: ConcurrencyOptions) {
    this.limiter = pLimit(options.limit);
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    return this.limiter(fn);
  }

  updateLimit(newLimit: number): void {
    this.limiter = pLimit(newLimit);
  }
}
```

#### 文件工具

```typescript
// 文件切片
function sliceFile(file: File, start: number, end: number): Blob {
  return file.slice(start, end);
}

// 计算 Hash (使用 spark-md5)
async function calculateFileHash(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string> {
  // 使用 Web Worker 或 requestIdleCallback
  // 分块读取文件并计算 MD5
}

async function calculateChunkHash(chunk: Blob): Promise<string> {
  // 计算单个分片的 MD5
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// 计算上传速度
function calculateSpeed(uploadedBytes: number, elapsedMs: number): number {
  return (uploadedBytes / elapsedMs) * 1000; // bytes per second
}

// 估算剩余时间
function estimateRemainingTime(remainingBytes: number, speed: number): number {
  return speed > 0 ? remainingBytes / speed : 0;
}
```

#### IndexedDB 工具

```typescript
interface UploadRecord {
  taskId: string;
  fileInfo: FileInfo;
  uploadedChunks: number[];
  uploadToken: string;
  createdAt: number;
  updatedAt: number;
}

class UploadStorage {
  private dbName = "chunkflow-upload";
  private storeName = "uploads";
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    // 初始化 IndexedDB
  }

  async saveRecord(record: UploadRecord): Promise<void> {
    // 保存上传记录
  }

  async getRecord(taskId: string): Promise<UploadRecord | null> {
    // 获取上传记录
  }

  async updateRecord(taskId: string, updates: Partial<UploadRecord>): Promise<void> {
    // 更新上传记录
  }

  async deleteRecord(taskId: string): Promise<void> {
    // 删除上传记录
  }

  async getAllRecords(): Promise<UploadRecord[]> {
    // 获取所有未完成的上传记录
  }
}
```

### 3. Core 层 (@chunkflow/core)

核心层实现上传状态机、任务管理和插件系统。

#### UploadTask - 单个上传任务

```typescript
interface UploadTaskOptions {
  file: File;
  requestAdapter: RequestAdapter;
  chunkSize?: number;
  concurrency?: number;
  retryCount?: number;
  retryDelay?: number;
  autoStart?: boolean;
}

interface UploadProgress {
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  speed: number; // bytes per second
  remainingTime: number; // seconds
  uploadedChunks: number;
  totalChunks: number;
}

class UploadTask {
  private id: string;
  private file: File;
  private status: UploadStatus;
  private progress: UploadProgress;
  private chunks: ChunkInfo[];
  private uploadToken: UploadToken | null;
  private fileHash: string | null;
  private eventBus: ReturnType<typeof mitt>;
  private concurrencyController: ConcurrencyController;
  private storage: UploadStorage;
  private requestAdapter: RequestAdapter;
  private options: Required<UploadTaskOptions>;

  constructor(options: UploadTaskOptions) {
    this.id = generateTaskId();
    this.file = options.file;
    this.status = UploadStatus.IDLE;
    this.eventBus = createEventBus();
    // 初始化其他属性
  }

  // 开始上传
  async start(): Promise<void> {
    this.status = UploadStatus.HASHING;

    // 1. 创建文件，获取 uploadToken
    const createResponse = await this.requestAdapter.createFile({
      fileName: this.file.name,
      fileSize: this.file.size,
      fileType: this.file.type,
      preferredChunkSize: this.options.chunkSize,
    });

    this.uploadToken = createResponse.uploadToken;
    const chunkSize = createResponse.negotiatedChunkSize;

    // 2. 切分文件
    this.chunks = this.createChunks(chunkSize);

    // 3. 并行：开始上传 + 计算 Hash
    await Promise.all([this.startUpload(), this.calculateAndVerifyHash()]);
  }

  // 创建分片
  private createChunks(chunkSize: number): ChunkInfo[] {
    const chunks: ChunkInfo[] = [];
    const totalChunks = Math.ceil(this.file.size / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, this.file.size);
      chunks.push({
        index: i,
        hash: "", // 稍后计算
        size: end - start,
        start,
        end,
      });
    }

    return chunks;
  }

  // 开始上传分片
  private async startUpload(): Promise<void> {
    this.status = UploadStatus.UPLOADING;
    this.eventBus.emit("start", { taskId: this.id, file: this.file });

    // 使用动态切片大小
    const chunkSizeAdjuster = new ChunkSizeAdjuster({
      initialSize: this.options.chunkSize,
      minSize: 256 * 1024, // 256KB
      maxSize: 10 * 1024 * 1024, // 10MB
    });

    // 上传分片
    for (const chunk of this.chunks) {
      if (this.status !== UploadStatus.UPLOADING) break;

      await this.concurrencyController.run(async () => {
        await this.uploadChunkWithRetry(chunk);
      });

      // 根据上传耗时调整下一个分片大小
      chunkSizeAdjuster.adjust(/* upload time */);
    }
  }

  // 上传单个分片（带重试）
  private async uploadChunkWithRetry(chunk: ChunkInfo): Promise<void> {
    let retries = 0;

    while (retries <= this.options.retryCount) {
      try {
        const blob = sliceFile(this.file, chunk.start, chunk.end);
        const chunkHash = await calculateChunkHash(blob);
        chunk.hash = chunkHash;

        await this.requestAdapter.uploadChunk({
          uploadToken: this.uploadToken!.token,
          chunkIndex: chunk.index,
          chunkHash,
          chunk: blob,
        });

        // 更新进度
        this.updateProgress(chunk);

        // 保存到 IndexedDB
        await this.storage.updateRecord(this.id, {
          uploadedChunks: [...this.progress.uploadedChunks, chunk.index],
        });

        this.eventBus.emit("chunkSuccess", {
          taskId: this.id,
          chunkIndex: chunk.index,
        });

        return;
      } catch (error) {
        retries++;
        if (retries > this.options.retryCount) {
          this.eventBus.emit("chunkError", {
            taskId: this.id,
            chunkIndex: chunk.index,
            error: error as Error,
          });
          throw error;
        }

        // 指数退避
        await this.delay(this.options.retryDelay * Math.pow(2, retries - 1));
      }
    }
  }

  // 计算并校验 Hash
  private async calculateAndVerifyHash(): Promise<void> {
    // 计算文件 Hash
    this.fileHash = await calculateFileHash(this.file, (progress) => {
      this.eventBus.emit("hashProgress", { taskId: this.id, progress });
    });

    this.eventBus.emit("hashComplete", { taskId: this.id, hash: this.fileHash });

    // 校验 Hash
    const verifyResponse = await this.requestAdapter.verifyHash({
      fileHash: this.fileHash,
      uploadToken: this.uploadToken!.token,
    });

    if (verifyResponse.fileExists) {
      // 秒传
      this.status = UploadStatus.SUCCESS;
      this.eventBus.emit("success", {
        taskId: this.id,
        fileUrl: verifyResponse.fileUrl!,
      });
      // 取消正在进行的上传
      this.cancel();
    } else if (verifyResponse.existingChunks.length > 0) {
      // 跳过已存在的分片
      this.skipExistingChunks(verifyResponse.existingChunks);
    }
  }

  // 更新进度
  private updateProgress(chunk: ChunkInfo): void {
    this.progress.uploadedBytes += chunk.size;
    this.progress.uploadedChunks++;
    this.progress.percentage = (this.progress.uploadedBytes / this.file.size) * 100;

    const elapsedTime = Date.now() - this.startTime;
    this.progress.speed = calculateSpeed(this.progress.uploadedBytes, elapsedTime);
    this.progress.remainingTime = estimateRemainingTime(
      this.file.size - this.progress.uploadedBytes,
      this.progress.speed,
    );

    this.eventBus.emit("progress", {
      taskId: this.id,
      progress: this.progress.percentage,
      speed: this.progress.speed,
    });
  }

  // 暂停
  pause(): void {
    if (this.status === UploadStatus.UPLOADING) {
      this.status = UploadStatus.PAUSED;
      this.eventBus.emit("pause", { taskId: this.id });
    }
  }

  // 恢复
  async resume(): Promise<void> {
    if (this.status === UploadStatus.PAUSED) {
      this.status = UploadStatus.UPLOADING;
      this.eventBus.emit("resume", { taskId: this.id });
      await this.startUpload();
    }
  }

  // 取消
  cancel(): void {
    this.status = UploadStatus.CANCELLED;
    this.eventBus.emit("cancel", { taskId: this.id });
  }

  // 事件监听
  on<K extends keyof UploadEvents>(event: K, handler: (payload: UploadEvents[K]) => void): void {
    this.eventBus.on(event, handler);
  }

  // 获取状态
  getStatus(): UploadStatus {
    return this.status;
  }

  getProgress(): UploadProgress {
    return { ...this.progress };
  }
}
```

#### 动态切片大小调整器

```typescript
interface ChunkSizeAdjusterOptions {
  initialSize: number;
  minSize: number;
  maxSize: number;
  targetTime?: number; // 目标上传时间（毫秒）
}

class ChunkSizeAdjuster {
  private currentSize: number;
  private options: Required<ChunkSizeAdjusterOptions>;

  constructor(options: ChunkSizeAdjusterOptions) {
    this.currentSize = options.initialSize;
    this.options = {
      targetTime: 3000, // 默认 3 秒
      ...options,
    };
  }

  adjust(uploadTimeMs: number): number {
    const { targetTime, minSize, maxSize } = this.options;

    if (uploadTimeMs < targetTime * 0.5) {
      // 上传太快，增大分片
      this.currentSize = Math.min(this.currentSize * 2, maxSize);
    } else if (uploadTimeMs > targetTime * 1.5) {
      // 上传太慢，减小分片
      this.currentSize = Math.max(this.currentSize / 2, minSize);
    }

    return this.currentSize;
  }

  getCurrentSize(): number {
    return this.currentSize;
  }
}
```

#### UploadManager - 上传管理器

```typescript
interface UploadManagerOptions {
  requestAdapter: RequestAdapter;
  maxConcurrentTasks?: number;
  defaultChunkSize?: number;
  defaultConcurrency?: number;
  autoResumeUnfinished?: boolean;
}

class UploadManager {
  private tasks: Map<string, UploadTask>;
  private options: Required<UploadManagerOptions>;
  private storage: UploadStorage;
  private plugins: Plugin[];

  constructor(options: UploadManagerOptions) {
    this.tasks = new Map();
    this.options = {
      maxConcurrentTasks: 3,
      defaultChunkSize: 1024 * 1024, // 1MB
      defaultConcurrency: 3,
      autoResumeUnfinished: true,
      ...options,
    };
    this.storage = new UploadStorage();
    this.plugins = [];
  }

  async init(): Promise<void> {
    await this.storage.init();

    if (this.options.autoResumeUnfinished) {
      await this.resumeUnfinishedTasks();
    }
  }

  // 创建上传任务
  createTask(file: File, options?: Partial<UploadTaskOptions>): UploadTask {
    const task = new UploadTask({
      file,
      requestAdapter: this.options.requestAdapter,
      chunkSize: this.options.defaultChunkSize,
      concurrency: this.options.defaultConcurrency,
      retryCount: 3,
      retryDelay: 1000,
      autoStart: false,
      ...options,
    });

    this.tasks.set(task.id, task);

    // 应用插件
    this.plugins.forEach((plugin) => plugin.onTaskCreated?.(task));

    return task;
  }

  // 恢复未完成的任务
  private async resumeUnfinishedTasks(): Promise<void> {
    const records = await this.storage.getAllRecords();

    for (const record of records) {
      // 创建任务并恢复状态
      // 注意：需要用户重新选择文件
    }
  }

  // 获取任务
  getTask(taskId: string): UploadTask | undefined {
    return this.tasks.get(taskId);
  }

  // 获取所有任务
  getAllTasks(): UploadTask[] {
    return Array.from(this.tasks.values());
  }

  // 删除任务
  async deleteTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task) {
      task.cancel();
      this.tasks.delete(taskId);
      await this.storage.deleteRecord(taskId);
    }
  }

  // 注册插件
  use(plugin: Plugin): void {
    this.plugins.push(plugin);
    plugin.install?.(this);
  }
}
```

#### 插件系统

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

// 示例插件：日志插件
class LoggerPlugin implements Plugin {
  name = "logger";

  onTaskCreated(task: UploadTask): void {
    console.log(`[Logger] Task created: ${task.id}`);
  }

  onTaskStart(task: UploadTask): void {
    console.log(`[Logger] Task started: ${task.id}`);
  }

  onTaskProgress(task: UploadTask, progress: UploadProgress): void {
    console.log(`[Logger] Task progress: ${task.id} - ${progress.percentage}%`);
  }
}

// 示例插件：统计插件
class StatisticsPlugin implements Plugin {
  name = "statistics";
  private stats = {
    totalUploaded: 0,
    totalFiles: 0,
    successCount: 0,
    errorCount: 0,
  };

  onTaskSuccess(task: UploadTask): void {
    this.stats.successCount++;
    this.stats.totalUploaded += task.file.size;
  }

  onTaskError(task: UploadTask): void {
    this.stats.errorCount++;
  }

  getStats() {
    return { ...this.stats };
  }
}
```

### 4. Client 层 - React 适配 (@chunkflow/upload-client-react)

React 适配层提供 Hooks 和上下文管理。

#### useUpload Hook

```typescript
interface UseUploadOptions extends Partial<UploadTaskOptions> {
  onSuccess?: (fileUrl: string) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: UploadProgress) => void;
}

interface UseUploadReturn {
  upload: (file: File) => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  status: UploadStatus;
  progress: UploadProgress;
  error: Error | null;
}

function useUpload(options: UseUploadOptions = {}): UseUploadReturn {
  const manager = useUploadManager();
  const [task, setTask] = useState<UploadTask | null>(null);
  const [status, setStatus] = useState<UploadStatus>(UploadStatus.IDLE);
  const [progress, setProgress] = useState<UploadProgress>({
    uploadedBytes: 0,
    totalBytes: 0,
    percentage: 0,
    speed: 0,
    remainingTime: 0,
    uploadedChunks: 0,
    totalChunks: 0,
  });
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(
    (file: File) => {
      const newTask = manager.createTask(file, options);

      newTask.on("start", () => setStatus(UploadStatus.UPLOADING));
      newTask.on("progress", ({ progress: p, speed }) => {
        setProgress((prev) => ({ ...prev, percentage: p, speed }));
        options.onProgress?.(newTask.getProgress());
      });
      newTask.on("success", ({ fileUrl }) => {
        setStatus(UploadStatus.SUCCESS);
        options.onSuccess?.(fileUrl);
      });
      newTask.on("error", ({ error: err }) => {
        setStatus(UploadStatus.ERROR);
        setError(err);
        options.onError?.(err);
      });
      newTask.on("pause", () => setStatus(UploadStatus.PAUSED));
      newTask.on("resume", () => setStatus(UploadStatus.UPLOADING));
      newTask.on("cancel", () => setStatus(UploadStatus.CANCELLED));

      setTask(newTask);
      newTask.start();
    },
    [manager, options],
  );

  const pause = useCallback(() => task?.pause(), [task]);
  const resume = useCallback(() => task?.resume(), [task]);
  const cancel = useCallback(() => task?.cancel(), [task]);

  return { upload, pause, resume, cancel, status, progress, error };
}
```

#### useUploadList Hook

```typescript
interface UseUploadListReturn {
  tasks: UploadTask[];
  uploadFiles: (files: File[]) => void;
  pauseAll: () => void;
  resumeAll: () => void;
  cancelAll: () => void;
  removeTask: (taskId: string) => void;
}

function useUploadList(): UseUploadListReturn {
  const manager = useUploadManager();
  const [tasks, setTasks] = useState<UploadTask[]>([]);

  useEffect(() => {
    const updateTasks = () => setTasks(manager.getAllTasks());

    // 定期更新任务列表
    const interval = setInterval(updateTasks, 100);
    return () => clearInterval(interval);
  }, [manager]);

  const uploadFiles = useCallback(
    (files: File[]) => {
      files.forEach((file) => {
        const task = manager.createTask(file);
        task.start();
      });
    },
    [manager],
  );

  const pauseAll = useCallback(() => {
    tasks.forEach((task) => task.pause());
  }, [tasks]);

  const resumeAll = useCallback(() => {
    tasks.forEach((task) => task.resume());
  }, [tasks]);

  const cancelAll = useCallback(() => {
    tasks.forEach((task) => task.cancel());
  }, [tasks]);

  const removeTask = useCallback(
    (taskId: string) => {
      manager.deleteTask(taskId);
    },
    [manager],
  );

  return { tasks, uploadFiles, pauseAll, resumeAll, cancelAll, removeTask };
}
```

#### UploadProvider Context

```typescript
interface UploadContextValue {
  manager: UploadManager;
}

const UploadContext = createContext<UploadContextValue | null>(null);

interface UploadProviderProps {
  children: ReactNode;
  requestAdapter: RequestAdapter;
  options?: Partial<UploadManagerOptions>;
}

function UploadProvider({ children, requestAdapter, options }: UploadProviderProps) {
  const managerRef = useRef<UploadManager>();

  if (!managerRef.current) {
    managerRef.current = new UploadManager({
      requestAdapter,
      ...options
    });
  }

  useEffect(() => {
    managerRef.current?.init();
  }, []);

  return (
    <UploadContext.Provider value={{ manager: managerRef.current }}>
      {children}
    </UploadContext.Provider>
  );
}

function useUploadManager(): UploadManager {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUploadManager must be used within UploadProvider');
  }
  return context.manager;
}
```

### 5. Client 层 - Vue 适配 (@chunkflow/upload-client-vue)

Vue 适配层提供 Composables。

#### useUpload Composable

```typescript
function useUpload(options: UseUploadOptions = {}) {
  const manager = inject<UploadManager>("uploadManager");
  if (!manager) {
    throw new Error("useUpload must be used within UploadProvider");
  }

  const task = ref<UploadTask | null>(null);
  const status = ref<UploadStatus>(UploadStatus.IDLE);
  const progress = ref<UploadProgress>({
    uploadedBytes: 0,
    totalBytes: 0,
    percentage: 0,
    speed: 0,
    remainingTime: 0,
    uploadedChunks: 0,
    totalChunks: 0,
  });
  const error = ref<Error | null>(null);

  const upload = (file: File) => {
    const newTask = manager.createTask(file, options);

    newTask.on("start", () => {
      status.value = UploadStatus.UPLOADING;
    });
    newTask.on("progress", ({ progress: p, speed }) => {
      progress.value = { ...progress.value, percentage: p, speed };
      options.onProgress?.(newTask.getProgress());
    });
    newTask.on("success", ({ fileUrl }) => {
      status.value = UploadStatus.SUCCESS;
      options.onSuccess?.(fileUrl);
    });
    newTask.on("error", ({ error: err }) => {
      status.value = UploadStatus.ERROR;
      error.value = err;
      options.onError?.(err);
    });

    task.value = newTask;
    newTask.start();
  };

  const pause = () => task.value?.pause();
  const resume = () => task.value?.resume();
  const cancel = () => task.value?.cancel();

  return { upload, pause, resume, cancel, status, progress, error };
}
```

### 6. Component 层 - React 组件 (@chunkflow/upload-component-react)

提供开箱即用的 React 上传组件。

#### UploadButton 组件

```typescript
interface UploadButtonProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  onSelect?: (files: File[]) => void;
  children?: ReactNode;
  className?: string;
}

function UploadButton({
  accept,
  multiple = false,
  maxSize,
  onSelect,
  children,
  className
}: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // 文件大小验证
    if (maxSize) {
      const validFiles = files.filter(file => file.size <= maxSize);
      if (validFiles.length < files.length) {
        console.warn('Some files exceed max size');
      }
      onSelect?.(validFiles);
    } else {
      onSelect?.(files);
    }

    // 重置 input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <>
      <button onClick={handleClick} className={className}>
        {children || 'Select Files'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </>
  );
}
```

#### UploadProgress 组件

```typescript
interface UploadProgressProps {
  task: UploadTask;
  showSpeed?: boolean;
  showRemainingTime?: boolean;
  className?: string;
}

function UploadProgress({
  task,
  showSpeed = true,
  showRemainingTime = true,
  className
}: UploadProgressProps) {
  const [progress, setProgress] = useState(task.getProgress());

  useEffect(() => {
    const handleProgress = () => {
      setProgress(task.getProgress());
    };

    task.on('progress', handleProgress);

    return () => {
      task.off('progress', handleProgress);
    };
  }, [task]);

  return (
    <div className={className}>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
      <div className="progress-info">
        <span>{progress.percentage.toFixed(1)}%</span>
        {showSpeed && (
          <span>{formatFileSize(progress.speed)}/s</span>
        )}
        {showRemainingTime && progress.remainingTime > 0 && (
          <span>{formatTime(progress.remainingTime)} remaining</span>
        )}
      </div>
    </div>
  );
}
```

#### UploadList 组件

```typescript
interface UploadListProps {
  className?: string;
  renderItem?: (task: UploadTask) => ReactNode;
}

function UploadList({ className, renderItem }: UploadListProps) {
  const { tasks, removeTask } = useUploadList();

  return (
    <div className={className}>
      {tasks.map(task => (
        <div key={task.id} className="upload-item">
          {renderItem ? (
            renderItem(task)
          ) : (
            <DefaultUploadItem task={task} onRemove={() => removeTask(task.id)} />
          )}
        </div>
      ))}
    </div>
  );
}

function DefaultUploadItem({
  task,
  onRemove
}: {
  task: UploadTask;
  onRemove: () => void;
}) {
  const status = task.getStatus();
  const progress = task.getProgress();

  return (
    <div className="default-upload-item">
      <div className="file-info">
        <span className="file-name">{task.file.name}</span>
        <span className="file-size">{formatFileSize(task.file.size)}</span>
      </div>

      <UploadProgress task={task} />

      <div className="actions">
        {status === UploadStatus.UPLOADING && (
          <button onClick={() => task.pause()}>Pause</button>
        )}
        {status === UploadStatus.PAUSED && (
          <button onClick={() => task.resume()}>Resume</button>
        )}
        <button onClick={onRemove}>Remove</button>
      </div>
    </div>
  );
}
```

#### UploadDropzone 组件

```typescript
interface UploadDropzoneProps {
  accept?: string;
  maxSize?: number;
  onDrop?: (files: File[]) => void;
  children?: ReactNode;
  className?: string;
}

function UploadDropzone({
  accept,
  maxSize,
  onDrop,
  children,
  className
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer?.files || []);

    // 文件类型和大小验证
    const validFiles = files.filter(file => {
      if (accept && !matchAccept(file, accept)) return false;
      if (maxSize && file.size > maxSize) return false;
      return true;
    });

    onDrop?.(validFiles);
  };

  return (
    <div
      className={`${className} ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children || (
        <div className="dropzone-content">
          <p>Drag and drop files here, or click to select</p>
        </div>
      )}
    </div>
  );
}
```

### 7. Server 层 - BFF SDK (@chunkflow/upload-server)

服务端 SDK 提供上传逻辑的实现和存储适配器。

#### 存储适配器接口

```typescript
interface StorageAdapter {
  // 保存分片
  saveChunk(chunkHash: string, data: Buffer): Promise<void>;

  // 获取分片
  getChunk(chunkHash: string): Promise<Buffer>;

  // 检查分片是否存在
  chunkExists(chunkHash: string): Promise<boolean>;

  // 批量检查分片
  chunksExist(chunkHashes: string[]): Promise<boolean[]>;

  // 流式读取分片
  getChunkStream(chunkHash: string): Promise<ReadableStream>;
}

// 本地文件系统适配器
class LocalStorageAdapter implements StorageAdapter {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  async saveChunk(chunkHash: string, data: Buffer): Promise<void> {
    const chunkPath = this.getChunkPath(chunkHash);
    await fs.promises.mkdir(path.dirname(chunkPath), { recursive: true });
    await fs.promises.writeFile(chunkPath, data);
  }

  async getChunk(chunkHash: string): Promise<Buffer> {
    const chunkPath = this.getChunkPath(chunkHash);
    return fs.promises.readFile(chunkPath);
  }

  async chunkExists(chunkHash: string): Promise<boolean> {
    const chunkPath = this.getChunkPath(chunkHash);
    try {
      await fs.promises.access(chunkPath);
      return true;
    } catch {
      return false;
    }
  }

  async chunksExist(chunkHashes: string[]): Promise<boolean[]> {
    return Promise.all(chunkHashes.map((hash) => this.chunkExists(hash)));
  }

  async getChunkStream(chunkHash: string): Promise<ReadableStream> {
    const chunkPath = this.getChunkPath(chunkHash);
    return fs.createReadStream(chunkPath);
  }

  private getChunkPath(chunkHash: string): string {
    // 使用 hash 的前两位作为子目录，避免单目录文件过多
    const subDir = chunkHash.substring(0, 2);
    return path.join(this.basePath, subDir, chunkHash);
  }
}

// OSS 适配器（示例）
class OSSStorageAdapter implements StorageAdapter {
  private client: OSSClient;
  private bucket: string;

  constructor(config: OSSConfig) {
    this.client = new OSSClient(config);
    this.bucket = config.bucket;
  }

  async saveChunk(chunkHash: string, data: Buffer): Promise<void> {
    await this.client.put(`chunks/${chunkHash}`, data);
  }

  async getChunk(chunkHash: string): Promise<Buffer> {
    const result = await this.client.get(`chunks/${chunkHash}`);
    return result.content;
  }

  async chunkExists(chunkHash: string): Promise<boolean> {
    try {
      await this.client.head(`chunks/${chunkHash}`);
      return true;
    } catch {
      return false;
    }
  }

  // ... 其他方法实现
}
```

#### 上传服务

```typescript
interface FileMetadata {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileHash: string;
  chunkHashes: string[];
  uploadToken: string;
  createdAt: Date;
  completedAt?: Date;
}

interface UploadServiceOptions {
  storageAdapter: StorageAdapter;
  database: DatabaseAdapter;
  tokenSecret: string;
  defaultChunkSize?: number;
}

class UploadService {
  private storage: StorageAdapter;
  private db: DatabaseAdapter;
  private tokenSecret: string;
  private defaultChunkSize: number;

  constructor(options: UploadServiceOptions) {
    this.storage = options.storageAdapter;
    this.db = options.database;
    this.tokenSecret = options.tokenSecret;
    this.defaultChunkSize = options.defaultChunkSize || 1024 * 1024;
  }

  // 创建文件
  async createFile(request: CreateFileRequest): Promise<CreateFileResponse> {
    const fileId = generateFileId();
    const uploadToken = this.generateToken(fileId);

    // 协商分片大小
    const negotiatedChunkSize = request.preferredChunkSize || this.defaultChunkSize;

    // 保存文件元数据
    await this.db.saveFileMetadata({
      fileId,
      fileName: request.fileName,
      fileSize: request.fileSize,
      fileType: request.fileType,
      fileHash: "",
      chunkHashes: [],
      uploadToken,
      createdAt: new Date(),
    });

    return {
      uploadToken: {
        token: uploadToken,
        fileId,
        chunkSize: negotiatedChunkSize,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 小时
      },
      negotiatedChunkSize,
    };
  }

  // Hash 校验
  async verifyHash(request: VerifyHashRequest): Promise<VerifyHashResponse> {
    // 验证 token
    const fileId = this.verifyToken(request.uploadToken);

    // 检查文件是否已存在
    if (request.fileHash) {
      const existingFile = await this.db.findFileByHash(request.fileHash);
      if (existingFile) {
        return {
          fileExists: true,
          fileUrl: this.generateFileUrl(existingFile.fileId),
          existingChunks: [],
          missingChunks: [],
        };
      }
    }

    // 检查分片是否存在
    if (request.chunkHashes) {
      const existsResults = await this.storage.chunksExist(request.chunkHashes);
      const existingChunks: number[] = [];
      const missingChunks: number[] = [];

      existsResults.forEach((exists, index) => {
        if (exists) {
          existingChunks.push(index);
        } else {
          missingChunks.push(index);
        }
      });

      return {
        fileExists: false,
        existingChunks,
        missingChunks,
      };
    }

    return {
      fileExists: false,
      existingChunks: [],
      missingChunks: [],
    };
  }

  // 上传分片
  async uploadChunk(request: UploadChunkRequest): Promise<UploadChunkResponse> {
    // 验证 token
    const fileId = this.verifyToken(request.uploadToken);

    // 验证分片 Hash
    const calculatedHash = calculateHash(request.chunk);
    if (calculatedHash !== request.chunkHash) {
      throw new Error("Chunk hash mismatch");
    }

    // 保存分片（如果不存在）
    const exists = await this.storage.chunkExists(request.chunkHash);
    if (!exists) {
      await this.storage.saveChunk(request.chunkHash, request.chunk);
    }

    // 更新文件元数据
    await this.db.addChunkToFile(fileId, request.chunkIndex, request.chunkHash);

    return {
      success: true,
      chunkHash: request.chunkHash,
    };
  }

  // 逻辑合并
  async mergeFile(request: MergeFileRequest): Promise<MergeFileResponse> {
    // 验证 token
    const fileId = this.verifyToken(request.uploadToken);

    // 验证所有分片都已上传
    const existsResults = await this.storage.chunksExist(request.chunkHashes);
    if (existsResults.some((exists) => !exists)) {
      throw new Error("Some chunks are missing");
    }

    // 更新文件元数据
    await this.db.updateFileMetadata(fileId, {
      fileHash: request.fileHash,
      chunkHashes: request.chunkHashes,
      completedAt: new Date(),
    });

    const fileUrl = this.generateFileUrl(fileId);

    return {
      success: true,
      fileUrl,
      fileId,
    };
  }

  // 获取文件流
  async getFileStream(fileId: string): Promise<ReadableStream> {
    const metadata = await this.db.getFileMetadata(fileId);
    if (!metadata) {
      throw new Error("File not found");
    }

    // 创建流式管道
    return this.createMergedStream(metadata.chunkHashes);
  }

  // 创建合并流
  private async createMergedStream(chunkHashes: string[]): Promise<ReadableStream> {
    let currentIndex = 0;

    return new ReadableStream({
      async pull(controller) {
        if (currentIndex >= chunkHashes.length) {
          controller.close();
          return;
        }

        const chunkHash = chunkHashes[currentIndex];
        const chunkStream = await this.storage.getChunkStream(chunkHash);

        // 读取分片并推送到流
        const reader = chunkStream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }

        currentIndex++;
      },
    });
  }

  private generateToken(fileId: string): string {
    // 使用 JWT 或其他方式生成 token
    return jwt.sign({ fileId }, this.tokenSecret, { expiresIn: "24h" });
  }

  private verifyToken(token: string): string {
    try {
      const payload = jwt.verify(token, this.tokenSecret);
      return payload.fileId;
    } catch {
      throw new Error("Invalid token");
    }
  }

  private generateFileUrl(fileId: string): string {
    return `/api/files/${fileId}`;
  }
}
```

#### 数据库适配器

```typescript
interface DatabaseAdapter {
  // 保存文件元数据
  saveFileMetadata(metadata: FileMetadata): Promise<void>;

  // 获取文件元数据
  getFileMetadata(fileId: string): Promise<FileMetadata | null>;

  // 根据 Hash 查找文件
  findFileByHash(fileHash: string): Promise<FileMetadata | null>;

  // 更新文件元数据
  updateFileMetadata(fileId: string, updates: Partial<FileMetadata>): Promise<void>;

  // 添加分片到文件
  addChunkToFile(fileId: string, chunkIndex: number, chunkHash: string): Promise<void>;
}
```

### 8. 服务端应用 (apps/server)

完整的 Nest.js + Fastify + PostgreSQL 服务端实现。

#### 数据库模型

```sql
-- 文件表
CREATE TABLE files (
  file_id VARCHAR(64) PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100),
  file_hash VARCHAR(64),
  upload_token VARCHAR(512) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  INDEX idx_file_hash (file_hash),
  INDEX idx_upload_token (upload_token)
);

-- 分片表
CREATE TABLE chunks (
  chunk_hash VARCHAR(64) PRIMARY KEY,
  chunk_size INT NOT NULL,
  storage_path VARCHAR(512) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reference_count INT DEFAULT 0
);

-- 文件-分片关联表
CREATE TABLE file_chunks (
  id BIGSERIAL PRIMARY KEY,
  file_id VARCHAR(64) NOT NULL,
  chunk_index INT NOT NULL,
  chunk_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES files(file_id) ON DELETE CASCADE,
  FOREIGN KEY (chunk_hash) REFERENCES chunks(chunk_hash),
  UNIQUE (file_id, chunk_index)
);
```

#### Nest.js 控制器

```typescript
@Controller("upload")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post("create")
  async createFile(@Body() request: CreateFileRequest): Promise<CreateFileResponse> {
    return this.uploadService.createFile(request);
  }

  @Post("verify")
  async verifyHash(@Body() request: VerifyHashRequest): Promise<VerifyHashResponse> {
    return this.uploadService.verifyHash(request);
  }

  @Post("chunk")
  @UseInterceptors(FileInterceptor("chunk"))
  async uploadChunk(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { uploadToken: string; chunkIndex: string; chunkHash: string },
  ): Promise<UploadChunkResponse> {
    return this.uploadService.uploadChunk({
      uploadToken: body.uploadToken,
      chunkIndex: parseInt(body.chunkIndex),
      chunkHash: body.chunkHash,
      chunk: file.buffer,
    });
  }

  @Post("merge")
  async mergeFile(@Body() request: MergeFileRequest): Promise<MergeFileResponse> {
    return this.uploadService.mergeFile(request);
  }

  @Get("files/:fileId")
  async getFile(
    @Param("fileId") fileId: string,
    @Res() res: FastifyReply,
    @Headers("range") range?: string,
  ): Promise<void> {
    const metadata = await this.uploadService.getFileMetadata(fileId);
    if (!metadata) {
      res.status(404).send({ error: "File not found" });
      return;
    }

    // 设置响应头
    res.header("Content-Type", metadata.fileType);
    res.header("Content-Length", metadata.fileSize.toString());
    res.header("Accept-Ranges", "bytes");

    // 处理 Range 请求
    if (range) {
      const [start, end] = this.parseRange(range, metadata.fileSize);
      res.status(206);
      res.header("Content-Range", `bytes ${start}-${end}/${metadata.fileSize}`);
      res.header("Content-Length", (end - start + 1).toString());

      const stream = await this.uploadService.getFileStream(fileId, start, end);
      res.send(stream);
    } else {
      const stream = await this.uploadService.getFileStream(fileId);
      res.send(stream);
    }
  }

  private parseRange(range: string, fileSize: number): [number, number] {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    return [start, end];
  }
}
```

## 数据模型

### 客户端数据模型

```typescript
// 上传任务状态
interface UploadTaskState {
  id: string;
  file: File;
  status: UploadStatus;
  progress: UploadProgress;
  uploadToken: UploadToken | null;
  fileHash: string | null;
  chunks: ChunkInfo[];
  uploadedChunks: Set<number>;
  error: Error | null;
  startTime: number;
  endTime: number | null;
}

// 上传配置
interface UploadConfig {
  chunkSize: number;
  concurrency: number;
  retryCount: number;
  retryDelay: number;
  autoStart: boolean;
  enableHash: boolean;
  enableResume: boolean;
}
```

### 服务端数据模型

```typescript
// 文件实体
interface FileEntity {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileHash: string;
  uploadToken: string;
  createdAt: Date;
  completedAt: Date | null;
}

// 分片实体
interface ChunkEntity {
  chunkHash: string;
  chunkSize: number;
  storagePath: string;
  createdAt: Date;
  referenceCount: number;
}

// 文件-分片关联
interface FileChunkEntity {
  id: number;
  fileId: string;
  chunkIndex: number;
  chunkHash: string;
  createdAt: Date;
}
```

## 正确性属性

属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的形式化陈述。属性是人类可读规范和机器可验证正确性保证之间的桥梁。

### 属性 1: 文件大小决定上传策略

*对于任意*文件，当文件大小小于 5MB 时，SDK 应该使用直传策略；当文件大小大于等于 5MB 时，SDK 应该使用分片上传策略。

**验证需求**: 1.1, 1.2

### 属性 2: 动态分片大小调整

*对于任意*分片上传，当上传耗时小于目标时间的 50% 时，下一个分片大小应该增大（不超过 10MB）；当上传耗时大于目标时间的 150% 时，下一个分片大小应该减小（不低于 256KB）。

**验证需求**: 2.2, 2.3, 2.4

### 属性 3: Hash 计算触发

*对于任意*被选中的文件，SDK 应该在后台自动触发 Hash 计算，并在计算完成后发送 Hash 校验请求到服务端。

**验证需求**: 3.1, 3.3

### 属性 4: 秒传机制

*对于任意*文件，当服务端返回文件 Hash 已存在时，SDK 应该跳过所有上传操作并直接返回文件访问地址。

**验证需求**: 3.4

### 属性 5: 部分秒传

*对于任意*文件，当服务端返回部分分片已存在时，SDK 应该只上传缺失的分片，跳过已存在的分片。

**验证需求**: 3.5, 17.4

### 属性 6: Hash 计算与上传并行

*对于任意*文件上传任务，Hash 计算和分片上传应该并行执行，不等待 Hash 计算完成才开始上传。

**验证需求**: 3.6, 17.2

### 属性 7: 断点续传持久化

*对于任意*成功上传的分片，SDK 应该将上传进度写入 IndexedDB，以便在页面重新加载后能够恢复上传。

**验证需求**: 4.1

### 属性 8: 断点续传恢复

*对于任意*未完成的上传任务，当恢复上传时，SDK 应该从上次中断的分片继续上传，不重复上传已完成的分片。

**验证需求**: 4.4

### 属性 9: 并发控制

*对于任意*上传任务，当并发队列已满时，新的分片上传请求应该等待，直到队列中有空位。同时进行的分片上传数量不应超过配置的并发限制。

**验证需求**: 5.3

### 属性 10: 生命周期事件触发

*对于任意*上传状态变化（开始、进度、成功、错误、暂停、恢复、取消），SDK 应该触发对应的生命周期事件，并在事件回调中提供详细的上传信息（进度、速度、剩余时间等）。

**验证需求**: 6.3, 6.4

### 属性 11: 状态机转换

*对于任意*上传任务，状态转换应该遵循有效的状态机规则：

- idle → hashing/uploading
- hashing → uploading/error
- uploading → paused/success/error/cancelled
- paused → uploading/cancelled
- success/error/cancelled 为终态

**验证需求**: 8.4

### 属性 12: 队列管理

*对于任意*上传管理器，当创建新任务时，任务应该被正确添加到任务队列；当删除任务时，任务应该从队列中移除并清理相关资源。

**验证需求**: 8.6

### 属性 13: 响应式状态更新

*对于任意*框架适配层（React/Vue），当上传状态或进度发生变化时，组件的响应式状态应该自动更新，触发 UI 重新渲染。

**验证需求**: 10.5

### 属性 14: 分片去重存储

*对于任意*多个文件，如果它们包含内容相同的分片（Hash 相同），服务端应该只存储一份分片数据，不重复存储。

**验证需求**: 18.2

### 属性 15: 分片永久性

*对于任意*已创建的分片，即使关联的文件被删除，分片数据也应该保留在存储中，不被删除。

**验证需求**: 18.4, 13.6

### 属性 16: 文件删除隔离

*对于任意*文件删除操作，只应该删除文件的元数据记录，不应该删除任何分片数据。

**验证需求**: 18.5

### 属性 17: 文件流式输出顺序

*对于任意*文件访问请求，服务端应该按照分片索引的顺序读取和输出分片内容，最终输出的完整文件内容应该与原始文件一致。

**验证需求**: 19.1, 19.2

### 属性 18: Range 请求正确性

*对于任意*带有 Range 头的文件访问请求，服务端应该返回正确的字节范围内容，并设置正确的 Content-Range 和 Content-Length 响应头。

**验证需求**: 19.4, 19.5

### 属性 19: 自动重试机制

*对于任意*上传失败的分片，SDK 应该自动重试该分片，重试次数不超过配置的最大重试次数，重试延迟应该使用指数退避策略。

**验证需求**: 20.1, 20.5

### 属性 20: 重试耗尽处理

*对于任意*分片，当重试次数耗尽仍然失败时，SDK 应该触发 onError 事件，并停止该分片的上传尝试。

**验证需求**: 20.4

### 属性 21: 上传优先级

*对于任意*大文件上传任务，SDK 应该优先上传前几个分片（例如前 3 个），以便快速获得服务端反馈和用户体验。

**验证需求**: 17.5

### 属性 22: 分片 Hash 唯一性

*对于任意*两个分片，如果它们的内容完全相同，则它们的 Hash 值应该相同；如果内容不同，则 Hash 值应该不同（在 Hash 碰撞概率范围内）。

**验证需求**: 18.1

### 属性 23: 配置有效性

*对于任意*用户配置（分片大小、并发数、重试次数等），SDK 应该验证配置值在有效范围内，对于超出范围的值应该使用边界值或默认值。

**验证需求**: 2.5, 5.2, 20.3

## 错误处理

### 客户端错误处理

#### 1. 文件选择错误

```typescript
class FileValidationError extends Error {
  constructor(
    message: string,
    public code: "FILE_TOO_LARGE" | "INVALID_FILE_TYPE" | "FILE_NOT_READABLE",
  ) {
    super(message);
    this.name = "FileValidationError";
  }
}

// 使用示例
function validateFile(file: File, options: ValidationOptions): void {
  if (options.maxSize && file.size > options.maxSize) {
    throw new FileValidationError(
      `File size ${file.size} exceeds maximum ${options.maxSize}`,
      "FILE_TOO_LARGE",
    );
  }

  if (options.accept && !matchAccept(file, options.accept)) {
    throw new FileValidationError(`File type ${file.type} is not accepted`, "INVALID_FILE_TYPE");
  }
}
```

#### 2. 网络错误

```typescript
class NetworkError extends Error {
  constructor(
    message: string,
    public code: "NETWORK_TIMEOUT" | "NETWORK_OFFLINE" | "SERVER_ERROR",
    public statusCode?: number,
  ) {
    super(message);
    this.name = "NetworkError";
  }
}

// 错误重试策略
async function uploadWithRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  let lastError: Error;

  for (let i = 0; i <= options.maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // 判断是否应该重试
      if (!shouldRetry(error, i, options.maxRetries)) {
        throw error;
      }

      // 指数退避
      const delay = options.baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }

  throw lastError!;
}

function shouldRetry(error: Error, attempt: number, maxRetries: number): boolean {
  // 达到最大重试次数
  if (attempt >= maxRetries) return false;

  // 网络错误可以重试
  if (error instanceof NetworkError) {
    return error.code !== "SERVER_ERROR" || error.statusCode! >= 500;
  }

  // 其他错误不重试
  return false;
}
```

#### 3. Hash 计算错误

```typescript
class HashCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HashCalculationError";
  }
}

// 错误处理
try {
  const hash = await calculateFileHash(file);
} catch (error) {
  if (error instanceof HashCalculationError) {
    // 降级：不使用 Hash 功能，直接上传
    console.warn("Hash calculation failed, uploading without hash check");
    await uploadWithoutHash(file);
  }
}
```

#### 4. 存储错误

```typescript
class StorageError extends Error {
  constructor(
    message: string,
    public code: "QUOTA_EXCEEDED" | "STORAGE_UNAVAILABLE",
  ) {
    super(message);
    this.name = "StorageError";
  }
}

// IndexedDB 错误处理
async function saveToStorage(data: any): Promise<void> {
  try {
    await storage.save(data);
  } catch (error) {
    if (error instanceof StorageError && error.code === "QUOTA_EXCEEDED") {
      // 清理旧数据
      await storage.cleanup();
      // 重试
      await storage.save(data);
    } else {
      // 降级：不使用持久化
      console.warn("Storage unavailable, upload progress will not be saved");
    }
  }
}
```

### 服务端错误处理

#### 1. Token 验证错误

```typescript
class TokenError extends Error {
  constructor(
    message: string,
    public code: "TOKEN_INVALID" | "TOKEN_EXPIRED" | "TOKEN_MISSING",
  ) {
    super(message);
    this.name = "TokenError";
  }
}

// 中间件
@Injectable()
export class TokenValidationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        throw new TokenError("Token missing", "TOKEN_MISSING");
      }

      const payload = verifyToken(token);
      req.user = payload;
      next();
    } catch (error) {
      if (error instanceof TokenError) {
        res.status(401).json({ error: error.message, code: error.code });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
}
```

#### 2. 分片验证错误

```typescript
class ChunkValidationError extends Error {
  constructor(
    message: string,
    public code: "HASH_MISMATCH" | "SIZE_MISMATCH" | "INDEX_INVALID",
  ) {
    super(message);
    this.name = "ChunkValidationError";
  }
}

// 分片验证
function validateChunk(chunk: Buffer, expectedHash: string, expectedSize: number): void {
  const actualHash = calculateHash(chunk);
  if (actualHash !== expectedHash) {
    throw new ChunkValidationError(
      `Chunk hash mismatch: expected ${expectedHash}, got ${actualHash}`,
      "HASH_MISMATCH",
    );
  }

  if (chunk.length !== expectedSize) {
    throw new ChunkValidationError(
      `Chunk size mismatch: expected ${expectedSize}, got ${chunk.length}`,
      "SIZE_MISMATCH",
    );
  }
}
```

#### 3. 存储错误

```typescript
class StorageBackendError extends Error {
  constructor(
    message: string,
    public code: "DISK_FULL" | "PERMISSION_DENIED" | "IO_ERROR",
  ) {
    super(message);
    this.name = "StorageBackendError";
  }
}

// 存储错误处理
async function saveChunkWithFallback(
  chunk: Buffer,
  hash: string,
  primaryStorage: StorageAdapter,
  fallbackStorage?: StorageAdapter,
): Promise<void> {
  try {
    await primaryStorage.saveChunk(hash, chunk);
  } catch (error) {
    if (error instanceof StorageBackendError && fallbackStorage) {
      console.warn("Primary storage failed, using fallback");
      await fallbackStorage.saveChunk(hash, chunk);
    } else {
      throw error;
    }
  }
}
```

#### 4. 数据库错误

```typescript
// 事务处理
async function mergeFileWithTransaction(
  fileId: string,
  fileHash: string,
  chunkHashes: string[],
): Promise<void> {
  const transaction = await db.beginTransaction();

  try {
    // 更新文件元数据
    await transaction.updateFile(fileId, { fileHash, completedAt: new Date() });

    // 批量插入文件-分片关联
    await transaction.insertFileChunks(
      chunkHashes.map((hash, index) => ({
        fileId,
        chunkIndex: index,
        chunkHash: hash,
      })),
    );

    // 更新分片引用计数
    await transaction.incrementChunkReferences(chunkHashes);

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

### 错误恢复策略

#### 1. 自动恢复

- 网络错误：自动重试（指数退避）
- 临时服务器错误（5xx）：自动重试
- Token 过期：自动刷新 Token 并重试

#### 2. 降级处理

- Hash 计算失败：跳过 Hash 校验，直接上传
- IndexedDB 不可用：不保存断点续传信息
- Web Worker 不可用：在主线程计算 Hash

#### 3. 用户介入

- 文件验证失败：提示用户并阻止上传
- 重试耗尽：提示用户手动重试或取消
- 存储空间不足：提示用户清理空间

## 测试策略

### 双重测试方法

本项目采用单元测试和基于属性的测试相结合的方法，以确保全面的测试覆盖：

- **单元测试**：验证特定示例、边界情况和错误条件
- **基于属性的测试**：通过随机化验证所有输入的通用属性
- 两者互补且都是必需的，以实现全面覆盖

### 单元测试策略

单元测试应该专注于：

1. **具体示例**：演示正确行为的特定案例
2. **边界情况**：
   - 空文件
   - 超大文件
   - 特殊字符文件名
   - 网络中断
   - 存储空间不足
3. **错误条件**：
   - 无效的文件类型
   - Token 过期
   - Hash 不匹配
   - 服务器错误响应
4. **集成点**：
   - 框架适配层与核心层的集成
   - 存储适配器的切换
   - 插件系统的扩展

**单元测试平衡**：

- 避免编写过多的单元测试 - 基于属性的测试处理大量输入覆盖
- 单元测试应该简洁且有针对性
- 每个核心功能 3-5 个单元测试通常就足够了

### 基于属性的测试策略

#### 测试库选择

- **JavaScript/TypeScript**：使用 [fast-check](https://github.com/dubzzz/fast-check)
- 不要从头实现基于属性的测试框架

#### 配置要求

- 每个属性测试最少运行 100 次迭代（由于随机化）
- 每个属性测试必须引用其设计文档属性
- 标签格式：`Feature: chunkflow-upload-sdk, Property {number}: {property_text}`

#### 属性测试示例

```typescript
import fc from "fast-check";
import { describe, it } from "vitest";

describe("ChunkFlow Upload SDK Properties", () => {
  // Feature: chunkflow-upload-sdk, Property 1: 文件大小决定上传策略
  it("should use direct upload for files < 5MB and chunked upload for files >= 5MB", () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string(),
          size: fc.nat(100 * 1024 * 1024), // 0-100MB
          type: fc.constantFrom("image/jpeg", "video/mp4", "application/pdf"),
        }),
        (fileInfo) => {
          const strategy = selectUploadStrategy(fileInfo);

          if (fileInfo.size < 5 * 1024 * 1024) {
            expect(strategy).toBe("direct");
          } else {
            expect(strategy).toBe("chunked");
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: chunkflow-upload-sdk, Property 2: 动态分片大小调整
  it("should adjust chunk size based on upload time", () => {
    fc.assert(
      fc.property(
        fc.record({
          currentSize: fc.integer({ min: 256 * 1024, max: 10 * 1024 * 1024 }),
          uploadTimeMs: fc.nat(10000),
          targetTimeMs: fc.constant(3000),
        }),
        ({ currentSize, uploadTimeMs, targetTimeMs }) => {
          const adjuster = new ChunkSizeAdjuster({
            initialSize: currentSize,
            minSize: 256 * 1024,
            maxSize: 10 * 1024 * 1024,
            targetTime: targetTimeMs,
          });

          const newSize = adjuster.adjust(uploadTimeMs);

          // 验证大小在范围内
          expect(newSize).toBeGreaterThanOrEqual(256 * 1024);
          expect(newSize).toBeLessThanOrEqual(10 * 1024 * 1024);

          // 验证调整逻辑
          if (uploadTimeMs < targetTimeMs * 0.5) {
            expect(newSize).toBeGreaterThanOrEqual(currentSize);
          } else if (uploadTimeMs > targetTimeMs * 1.5) {
            expect(newSize).toBeLessThanOrEqual(currentSize);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: chunkflow-upload-sdk, Property 5: 部分秒传
  it("should only upload missing chunks when some chunks exist", () => {
    fc.assert(
      fc.property(
        fc.record({
          totalChunks: fc.integer({ min: 5, max: 20 }),
          existingChunks: fc.array(fc.nat(19), { maxLength: 15 }),
        }),
        async ({ totalChunks, existingChunks }) => {
          const allChunks = Array.from({ length: totalChunks }, (_, i) => i);
          const missingChunks = allChunks.filter((i) => !existingChunks.includes(i));

          const uploadedChunks: number[] = [];
          const mockAdapter = {
            uploadChunk: async (req: any) => {
              uploadedChunks.push(req.chunkIndex);
              return { success: true, chunkHash: req.chunkHash };
            },
          };

          await uploadWithSkip(allChunks, existingChunks, mockAdapter);

          // 验证只上传了缺失的分片
          expect(uploadedChunks.sort()).toEqual(missingChunks.sort());
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: chunkflow-upload-sdk, Property 11: 状态机转换
  it("should follow valid state machine transitions", () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom("start", "pause", "resume", "cancel", "complete", "error"), {
          minLength: 1,
          maxLength: 10,
        }),
        (actions) => {
          const task = new UploadTask({
            /* ... */
          });
          let currentState = UploadStatus.IDLE;

          for (const action of actions) {
            const prevState = currentState;

            try {
              switch (action) {
                case "start":
                  if (prevState === UploadStatus.IDLE) {
                    task.start();
                    currentState = UploadStatus.UPLOADING;
                  }
                  break;
                case "pause":
                  if (prevState === UploadStatus.UPLOADING) {
                    task.pause();
                    currentState = UploadStatus.PAUSED;
                  }
                  break;
                case "resume":
                  if (prevState === UploadStatus.PAUSED) {
                    task.resume();
                    currentState = UploadStatus.UPLOADING;
                  }
                  break;
                case "cancel":
                  if (prevState !== UploadStatus.CANCELLED) {
                    task.cancel();
                    currentState = UploadStatus.CANCELLED;
                  }
                  break;
              }
            } catch (error) {
              // 无效转换应该抛出错误或被忽略
            }

            // 验证状态是有效的
            expect(Object.values(UploadStatus)).toContain(task.getStatus());
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: chunkflow-upload-sdk, Property 14: 分片去重存储
  it("should store only one copy of chunks with same content", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            fileId: fc.uuid(),
            chunks: fc.array(fc.uint8Array({ minLength: 1024, maxLength: 1024 })),
          }),
          { minLength: 2, maxLength: 5 },
        ),
        async (files) => {
          const storage = new MockStorageAdapter();
          const service = new UploadService({ storageAdapter: storage });

          // 上传所有文件的所有分片
          for (const file of files) {
            for (const chunk of file.chunks) {
              const hash = calculateHash(chunk);
              await service.uploadChunk({
                uploadToken: "test-token",
                chunkIndex: 0,
                chunkHash: hash,
                chunk,
              });
            }
          }

          // 计算唯一的分片 Hash
          const allHashes = files.flatMap((f) => f.chunks.map((c) => calculateHash(c)));
          const uniqueHashes = new Set(allHashes);

          // 验证存储的分片数量等于唯一 Hash 数量
          expect(storage.getChunkCount()).toBe(uniqueHashes.size);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: chunkflow-upload-sdk, Property 17: 文件流式输出顺序
  it("should output file chunks in correct order", () => {
    fc.assert(
      fc.property(
        fc.array(fc.uint8Array({ minLength: 100, maxLength: 1000 }), {
          minLength: 3,
          maxLength: 10,
        }),
        async (chunks) => {
          // 保存分片
          const chunkHashes = await Promise.all(
            chunks.map(async (chunk, index) => {
              const hash = calculateHash(chunk);
              await storage.saveChunk(hash, chunk);
              return hash;
            }),
          );

          // 创建文件元数据
          const fileId = "test-file";
          await db.saveFileMetadata({
            fileId,
            chunkHashes,
            /* ... */
          });

          // 获取文件流
          const stream = await service.getFileStream(fileId);
          const outputBuffer = await streamToBuffer(stream);

          // 验证输出与原始数据一致
          const expectedBuffer = Buffer.concat(chunks);
          expect(outputBuffer).toEqual(expectedBuffer);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: chunkflow-upload-sdk, Property 19: 自动重试机制
  it("should retry failed chunks with exponential backoff", () => {
    fc.assert(
      fc.property(
        fc.record({
          maxRetries: fc.integer({ min: 1, max: 5 }),
          baseDelay: fc.integer({ min: 100, max: 1000 }),
          failuresBeforeSuccess: fc.integer({ min: 0, max: 4 }),
        }),
        async ({ maxRetries, baseDelay, failuresBeforeSuccess }) => {
          let attemptCount = 0;
          const attemptDelays: number[] = [];
          let lastAttemptTime = Date.now();

          const mockUpload = async () => {
            const now = Date.now();
            if (attemptCount > 0) {
              attemptDelays.push(now - lastAttemptTime);
            }
            lastAttemptTime = now;
            attemptCount++;

            if (attemptCount <= failuresBeforeSuccess) {
              throw new Error("Upload failed");
            }
            return { success: true };
          };

          try {
            await uploadWithRetry(mockUpload, { maxRetries, baseDelay });

            // 验证重试次数
            expect(attemptCount).toBe(failuresBeforeSuccess + 1);

            // 验证指数退避
            for (let i = 0; i < attemptDelays.length; i++) {
              const expectedDelay = baseDelay * Math.pow(2, i);
              // 允许一些时间误差
              expect(attemptDelays[i]).toBeGreaterThanOrEqual(expectedDelay * 0.9);
              expect(attemptDelays[i]).toBeLessThanOrEqual(expectedDelay * 1.1);
            }
          } catch (error) {
            // 如果失败次数超过最大重试次数，应该抛出错误
            expect(failuresBeforeSuccess).toBeGreaterThan(maxRetries);
            expect(attemptCount).toBe(maxRetries + 1);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: chunkflow-upload-sdk, Property 22: 分片 Hash 唯一性
  it("should generate same hash for same content and different hash for different content", () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.uint8Array({ minLength: 1024, maxLength: 1024 }),
          fc.uint8Array({ minLength: 1024, maxLength: 1024 }),
        ),
        ([chunk1, chunk2]) => {
          const hash1 = calculateHash(chunk1);
          const hash2 = calculateHash(chunk2);

          // 相同内容应该有相同的 Hash
          const hash1Again = calculateHash(chunk1);
          expect(hash1).toBe(hash1Again);

          // 不同内容应该有不同的 Hash（在碰撞概率范围内）
          if (!arraysEqual(chunk1, chunk2)) {
            expect(hash1).not.toBe(hash2);
          } else {
            expect(hash1).toBe(hash2);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
```

### 测试覆盖目标

- **核心层**：90% 代码覆盖率
- **共享层**：85% 代码覆盖率
- **服务端层**：85% 代码覆盖率
- **适配层**：70% 代码覆盖率（UI 相关代码难以测试）
- **组件层**：60% 代码覆盖率（主要测试逻辑，UI 交互通过 E2E 测试）

### 集成测试

使用 Playwright 或 Cypress 进行端到端测试：

1. 完整的上传流程
2. 断点续传场景
3. 多文件并发上传
4. 网络中断恢复
5. 秒传验证

### 性能测试

1. **大文件上传性能**：测试 1GB+ 文件的上传速度和内存占用
2. **并发性能**：测试同时上传多个文件的性能
3. **Hash 计算性能**：测试不同文件大小的 Hash 计算时间
4. **数据库性能**：测试大量分片的查询和插入性能

### 持续集成

- 每次提交自动运行单元测试和属性测试
- 每日运行完整的集成测试和性能测试
- 测试失败阻止合并到主分支
- 测试覆盖率报告自动生成并发布
