# Custom Plugin Examples

Examples for creating custom plugins to extend ChunkFlow functionality.

## Logger Plugin

```typescript
import { Plugin, UploadTask, UploadProgress } from "@chunkflow/core";

export class LoggerPlugin implements Plugin {
  name = "logger";

  onTaskCreated(task: UploadTask): void {
    console.log(`[Logger] Task created: ${task.id}`, {
      fileName: task.file.name,
      fileSize: task.file.size,
    });
  }

  onTaskStart(task: UploadTask): void {
    console.log(`[Logger] Task started: ${task.id}`);
  }

  onTaskProgress(task: UploadTask, progress: UploadProgress): void {
    console.log(`[Logger] Task progress: ${task.id}`, {
      percentage: progress.percentage.toFixed(1),
      speed: progress.speed,
      remainingTime: progress.remainingTime,
    });
  }

  onTaskSuccess(task: UploadTask): void {
    console.log(`[Logger] Task completed: ${task.id}`);
  }

  onTaskError(task: UploadTask, error: Error): void {
    console.error(`[Logger] Task failed: ${task.id}`, error);
  }
}

// Usage
manager.use(new LoggerPlugin());
```

## Analytics Plugin

```typescript
import { Plugin, UploadTask, UploadProgress } from "@chunkflow/core";

export class AnalyticsPlugin implements Plugin {
  name = "analytics";
  private analytics: any; // Your analytics service

  constructor(analytics: any) {
    this.analytics = analytics;
  }

  onTaskCreated(task: UploadTask): void {
    this.analytics.track("upload_started", {
      taskId: task.id,
      fileName: task.file.name,
      fileSize: task.file.size,
      fileType: task.file.type,
    });
  }

  onTaskSuccess(task: UploadTask): void {
    this.analytics.track("upload_completed", {
      taskId: task.id,
      fileName: task.file.name,
      fileSize: task.file.size,
      duration: Date.now() - task.startTime,
    });
  }

  onTaskError(task: UploadTask, error: Error): void {
    this.analytics.track("upload_failed", {
      taskId: task.id,
      fileName: task.file.name,
      error: error.message,
    });
  }
}

// Usage
manager.use(new AnalyticsPlugin(analytics));
```

## Statistics Plugin

```typescript
import { Plugin, UploadTask } from "@chunkflow/core";

interface UploadStats {
  totalUploaded: number;
  totalFiles: number;
  successCount: number;
  errorCount: number;
  averageSpeed: number;
}

export class StatisticsPlugin implements Plugin {
  name = "statistics";
  private stats: UploadStats = {
    totalUploaded: 0,
    totalFiles: 0,
    successCount: 0,
    errorCount: 0,
    averageSpeed: 0,
  };
  private speeds: number[] = [];

  onTaskCreated(task: UploadTask): void {
    this.stats.totalFiles++;
  }

  onTaskSuccess(task: UploadTask): void {
    this.stats.successCount++;
    this.stats.totalUploaded += task.file.size;

    const progress = task.getProgress();
    this.speeds.push(progress.speed);
    this.stats.averageSpeed = this.speeds.reduce((a, b) => a + b, 0) / this.speeds.length;
  }

  onTaskError(task: UploadTask): void {
    this.stats.errorCount++;
  }

  getStats(): UploadStats {
    return { ...this.stats };
  }

  reset(): void {
    this.stats = {
      totalUploaded: 0,
      totalFiles: 0,
      successCount: 0,
      errorCount: 0,
      averageSpeed: 0,
    };
    this.speeds = [];
  }
}

// Usage
const stats = new StatisticsPlugin();
manager.use(stats);

// Later, get statistics
console.log(stats.getStats());
```

## Notification Plugin

```typescript
import { Plugin, UploadTask } from "@chunkflow/core";

export class NotificationPlugin implements Plugin {
  name = "notification";

  onTaskSuccess(task: UploadTask): void {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Upload Complete", {
        body: `${task.file.name} has been uploaded successfully`,
        icon: "/upload-icon.png",
      });
    }
  }

  onTaskError(task: UploadTask, error: Error): void {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Upload Failed", {
        body: `${task.file.name} failed to upload: ${error.message}`,
        icon: "/error-icon.png",
      });
    }
  }
}

// Usage
// Request permission first
if ("Notification" in window) {
  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      manager.use(new NotificationPlugin());
    }
  });
}
```

## Retry Strategy Plugin

```typescript
import { Plugin, UploadTask } from "@chunkflow/core";

export class RetryStrategyPlugin implements Plugin {
  name = "retry-strategy";
  private retryAttempts = new Map<string, number>();

  onTaskError(task: UploadTask, error: Error): void {
    const attempts = this.retryAttempts.get(task.id) || 0;

    if (attempts < 3) {
      console.log(`Retrying task ${task.id}, attempt ${attempts + 1}`);
      this.retryAttempts.set(task.id, attempts + 1);

      // Retry after delay
      setTimeout(
        () => {
          task.resume();
        },
        1000 * Math.pow(2, attempts),
      ); // Exponential backoff
    } else {
      console.error(`Task ${task.id} failed after 3 attempts`);
      this.retryAttempts.delete(task.id);
    }
  }

  onTaskSuccess(task: UploadTask): void {
    this.retryAttempts.delete(task.id);
  }
}

// Usage
manager.use(new RetryStrategyPlugin());
```

## See Also

- [Core API](/api/core)
- [React Examples](/examples/react)
- [Vue Examples](/examples/vue)
