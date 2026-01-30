# Core API

The Core layer implements the upload state machine, task management, and plugin system.

## UploadManager

Main class for managing multiple upload tasks.

### Constructor

```typescript
new UploadManager(options: UploadManagerOptions)
```

#### Options

```typescript
interface UploadManagerOptions {
  requestAdapter: RequestAdapter; // HTTP adapter (required)
  maxConcurrentTasks?: number; // Max parallel uploads (default: 3)
  defaultChunkSize?: number; // Default chunk size (default: 1MB)
  defaultConcurrency?: number; // Default chunk concurrency (default: 3)
  autoResumeUnfinished?: boolean; // Auto-resume on init (default: true)
}
```

### Methods

#### init()

Initialize the manager and resume unfinished tasks.

```typescript
await manager.init(): Promise<void>
```

#### createTask()

Create a new upload task.

```typescript
manager.createTask(file: File, options?: Partial<UploadTaskOptions>): UploadTask
```

**Parameters:**

- `file`: File to upload
- `options`: Task-specific options (optional)

**Returns:** UploadTask instance

**Example:**

```typescript
const task = manager.createTask(file, {
  chunkSize: 2 * 1024 * 1024, // 2MB chunks
  concurrency: 5, // 5 parallel chunks
  retryCount: 3, // Retry 3 times
});
```

#### getTask()

Get a task by ID.

```typescript
manager.getTask(taskId: string): UploadTask | undefined
```

#### getAllTasks()

Get all tasks.

```typescript
manager.getAllTasks(): UploadTask[]
```

#### deleteTask()

Delete a task and clean up resources.

```typescript
await manager.deleteTask(taskId: string): Promise<void>
```

#### use()

Register a plugin.

```typescript
manager.use(plugin: Plugin): void
```

### Example

```typescript
import { UploadManager, createFetchAdapter } from "@chunkflow/core";

const adapter = createFetchAdapter({
  baseURL: "http://localhost:3000/api",
});

const manager = new UploadManager({
  requestAdapter: adapter,
  maxConcurrentTasks: 3,
  defaultChunkSize: 1024 * 1024,
  defaultConcurrency: 3,
  autoResumeUnfinished: true,
});

await manager.init();

// Create and start a task
const task = manager.createTask(file);
await task.start();
```

## UploadTask

Represents a single upload task.

### Properties

```typescript
task.id: string                    // Unique task ID
task.file: File                    // File being uploaded
task.status: UploadStatus          // Current status
task.progress: UploadProgress      // Upload progress
```

### Methods

#### start()

Start the upload.

```typescript
await task.start(): Promise<void>
```

#### pause()

Pause the upload.

```typescript
task.pause(): void
```

#### resume()

Resume a paused upload.

```typescript
await task.resume(): Promise<void>
```

#### cancel()

Cancel the upload.

```typescript
task.cancel(): void
```

#### on()

Listen to events.

```typescript
task.on<K extends keyof UploadEvents>(
  event: K,
  handler: (payload: UploadEvents[K]) => void
): void
```

#### getStatus()

Get current status.

```typescript
task.getStatus(): UploadStatus
```

#### getProgress()

Get current progress.

```typescript
task.getProgress(): UploadProgress
```

### Events

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

### Example

```typescript
const task = manager.createTask(file);

task.on("start", ({ taskId, file }) => {
  console.log(`Upload started: ${file.name}`);
});

task.on("progress", ({ progress, speed }) => {
  console.log(`Progress: ${progress}%, Speed: ${speed} bytes/s`);
});

task.on("success", ({ fileUrl }) => {
  console.log(`Upload complete: ${fileUrl}`);
});

task.on("error", ({ error }) => {
  console.error(`Upload failed: ${error.message}`);
});

await task.start();
```

## UploadProgress

Progress information for an upload task.

```typescript
interface UploadProgress {
  uploadedBytes: number; // Bytes uploaded
  totalBytes: number; // Total bytes
  percentage: number; // Progress percentage (0-100)
  speed: number; // Upload speed (bytes/second)
  remainingTime: number; // Estimated remaining time (seconds)
  uploadedChunks: number; // Number of uploaded chunks
  totalChunks: number; // Total number of chunks
}
```

## ChunkSizeAdjuster

Dynamically adjusts chunk size based on upload performance.

### Constructor

```typescript
new ChunkSizeAdjuster(options: ChunkSizeAdjusterOptions)
```

#### Options

```typescript
interface ChunkSizeAdjusterOptions {
  initialSize: number; // Initial chunk size
  minSize: number; // Minimum chunk size
  maxSize: number; // Maximum chunk size
  targetTime?: number; // Target upload time per chunk (ms, default: 3000)
}
```

### Methods

#### adjust()

Adjust chunk size based on upload time.

```typescript
adjuster.adjust(uploadTimeMs: number): number
```

**Parameters:**

- `uploadTimeMs`: Time taken to upload the last chunk (milliseconds)

**Returns:** New chunk size

**Algorithm:**

- If upload time < 50% of target → Increase size (up to max)
- If upload time > 150% of target → Decrease size (down to min)
- Otherwise → Keep current size

#### getCurrentSize()

Get current chunk size.

```typescript
adjuster.getCurrentSize(): number
```

### Example

```typescript
const adjuster = new ChunkSizeAdjuster({
  initialSize: 1024 * 1024, // 1MB
  minSize: 256 * 1024, // 256KB
  maxSize: 10 * 1024 * 1024, // 10MB
  targetTime: 3000, // 3 seconds
});

// After uploading a chunk
const uploadTime = 1500; // 1.5 seconds (fast)
const newSize = adjuster.adjust(uploadTime);
console.log(`New chunk size: ${newSize}`); // Will be larger
```

## Plugin System

Extend ChunkFlow functionality with plugins.

### Plugin Interface

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

### Built-in Plugins

#### LoggerPlugin

Logs upload events to console.

```typescript
import { LoggerPlugin } from "@chunkflow/core";

manager.use(new LoggerPlugin());
```

#### StatisticsPlugin

Tracks upload statistics.

```typescript
import { StatisticsPlugin } from "@chunkflow/core";

const stats = new StatisticsPlugin();
manager.use(stats);

// Get statistics
const data = stats.getStats();
console.log(data.totalUploaded);
console.log(data.successCount);
console.log(data.errorCount);
```

### Creating Custom Plugins

```typescript
class CustomPlugin implements Plugin {
  name = "custom";

  install(manager: UploadManager) {
    console.log("Plugin installed");
  }

  onTaskCreated(task: UploadTask) {
    console.log(`Task created: ${task.id}`);
  }

  onTaskProgress(task: UploadTask, progress: UploadProgress) {
    // Send progress to analytics
    analytics.track("upload_progress", {
      taskId: task.id,
      percentage: progress.percentage,
    });
  }

  onTaskSuccess(task: UploadTask) {
    // Send success event
    analytics.track("upload_success", {
      taskId: task.id,
      fileName: task.file.name,
      fileSize: task.file.size,
    });
  }

  onTaskError(task: UploadTask, error: Error) {
    // Send error event
    analytics.track("upload_error", {
      taskId: task.id,
      error: error.message,
    });
  }
}

manager.use(new CustomPlugin());
```

## Utility Functions

### createFetchAdapter()

Create a fetch-based request adapter.

```typescript
createFetchAdapter(options: FetchAdapterOptions): RequestAdapter
```

#### Options

```typescript
interface FetchAdapterOptions {
  baseURL: string; // API base URL
  headers?: Record<string, string>; // Custom headers
  timeout?: number; // Request timeout (ms)
  withCredentials?: boolean; // Include credentials
  onUploadProgress?: (progress: number) => void; // Upload progress callback
}
```

#### Example

```typescript
const adapter = createFetchAdapter({
  baseURL: "http://localhost:3000/api",
  headers: {
    Authorization: "Bearer token",
  },
  timeout: 30000,
  withCredentials: true,
});
```

### generateTaskId()

Generate a unique task ID.

```typescript
generateTaskId(): string
```

## Type Exports

All types are exported from the core package:

```typescript
import type {
  UploadManager,
  UploadTask,
  UploadTaskOptions,
  UploadProgress,
  UploadStatus,
  Plugin,
  ChunkSizeAdjuster,
  ChunkSizeAdjusterOptions,
} from "@chunkflow/core";
```

## See Also

- [Protocol API](/api/protocol) - Type definitions
- [Shared API](/api/shared) - Common utilities
- [Client React API](/api/client-react) - React integration
- [Client Vue API](/api/client-vue) - Vue integration
