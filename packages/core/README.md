# @chunkflow/core

Core upload engine for ChunkFlow Upload SDK with state machine, task management, and plugin system.

## Installation

```bash
pnpm add @chunkflow/core
```

## Features

- Upload state machine
- Task management
- Dynamic chunk size adjustment
- Plugin system for extensibility
- Resumable uploads
- Concurrent chunk uploads
- Progress tracking

## Usage

### Basic Upload

```typescript
import { UploadManager } from "@chunkflow/core";

// Create manager with request adapter
const manager = new UploadManager({
  requestAdapter: myAdapter,
  defaultChunkSize: 1024 * 1024, // 1MB
  defaultConcurrency: 3,
});

// Initialize
await manager.init();

// Create and start upload task
const task = manager.createTask(file);

task.on("progress", ({ progress, speed }) => {
  console.log(`Progress: ${progress}%, Speed: ${speed} bytes/s`);
});

task.on("success", ({ fileUrl }) => {
  console.log(`Upload complete: ${fileUrl}`);
});

await task.start();
```

### Using Plugins

The plugin system allows you to extend the UploadManager with custom functionality.

#### Built-in Plugins

##### LoggerPlugin

Logs all upload events to the console:

```typescript
import { UploadManager, LoggerPlugin } from "@chunkflow/core";

const manager = new UploadManager({ requestAdapter });

// Use logger plugin
manager.use(
  new LoggerPlugin({
    logProgress: true,
    prefix: "[Upload]",
  }),
);
```

##### StatisticsPlugin

Tracks upload statistics:

```typescript
import { UploadManager, StatisticsPlugin } from "@chunkflow/core";

const manager = new UploadManager({ requestAdapter });
const stats = new StatisticsPlugin();

manager.use(stats);

// Later, get statistics
const metrics = stats.getStats();
console.log(`Success rate: ${metrics.successRate}%`);
console.log(`Total uploaded: ${metrics.totalBytesUploaded} bytes`);
console.log(`Average speed: ${metrics.averageSpeed} bytes/s`);

// Or get a formatted summary
console.log(stats.getSummary());
```

#### Creating Custom Plugins

Create your own plugin by implementing the `Plugin` interface:

```typescript
import { Plugin, UploadTask, UploadProgress } from "@chunkflow/core";

class MyCustomPlugin implements Plugin {
  name = "my-custom-plugin";

  install(manager: UploadManager): void {
    console.log("Plugin installed");
  }

  onTaskCreated(task: UploadTask): void {
    console.log(`Task created: ${task.id}`);
  }

  onTaskProgress(task: UploadTask, progress: UploadProgress): void {
    // Send progress to analytics
    analytics.track("upload_progress", {
      taskId: task.id,
      percentage: progress.percentage,
    });
  }

  onTaskSuccess(task: UploadTask, fileUrl: string): void {
    // Send success event
    analytics.track("upload_success", {
      taskId: task.id,
      fileUrl,
    });
  }

  onTaskError(task: UploadTask, error: Error): void {
    // Send error to monitoring service
    errorMonitoring.captureException(error, {
      taskId: task.id,
      fileName: task.file.name,
    });
  }
}

// Use your custom plugin
manager.use(new MyCustomPlugin());
```

#### Available Plugin Hooks

- `install(manager)` - Called when plugin is registered
- `onTaskCreated(task)` - Called when a new task is created
- `onTaskStart(task)` - Called when a task starts uploading
- `onTaskProgress(task, progress)` - Called on progress updates
- `onTaskSuccess(task, fileUrl)` - Called when upload completes
- `onTaskError(task, error)` - Called when an error occurs
- `onTaskPause(task)` - Called when a task is paused
- `onTaskResume(task)` - Called when a task is resumed
- `onTaskCancel(task)` - Called when a task is cancelled

All hooks are optional - implement only what you need.

### Resumable Uploads

```typescript
// Get unfinished uploads
const unfinished = await manager.getUnfinishedTasksInfo();

if (unfinished.length > 0) {
  // User re-selects file
  const file = await selectFile();

  // Resume upload
  const task = await manager.resumeTask(unfinished[0].taskId, file);
  await task.start();
}
```

## API Reference

See the [full API documentation](../../apps/website/docs/api/core.md) for detailed information.

## License

MIT
