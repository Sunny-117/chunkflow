# 自定义插件示例

创建自定义插件以扩展 ChunkFlow 功能的示例。

## 日志插件

```typescript
import { Plugin, UploadTask, UploadProgress } from "@chunkflow/core";

export class LoggerPlugin implements Plugin {
  name = "logger";

  onTaskCreated(task: UploadTask): void {
    console.log(`[日志] 任务已创建: ${task.id}`, {
      fileName: task.file.name,
      fileSize: task.file.size,
    });
  }

  onTaskStart(task: UploadTask): void {
    console.log(`[日志] 任务已开始: ${task.id}`);
  }

  onTaskProgress(task: UploadTask, progress: UploadProgress): void {
    console.log(`[日志] 任务进度: ${task.id}`, {
      percentage: progress.percentage.toFixed(1),
      speed: progress.speed,
      remainingTime: progress.remainingTime,
    });
  }

  onTaskSuccess(task: UploadTask): void {
    console.log(`[日志] 任务已完成: ${task.id}`);
  }

  onTaskError(task: UploadTask, error: Error): void {
    console.error(`[日志] 任务失败: ${task.id}`, error);
  }
}

// 使用
manager.use(new LoggerPlugin());
```

## 分析插件

```typescript
import { Plugin, UploadTask, UploadProgress } from "@chunkflow/core";

export class AnalyticsPlugin implements Plugin {
  name = "analytics";
  private analytics: any; // 你的分析服务

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

// 使用
manager.use(new AnalyticsPlugin(analytics));
```

## 统计插件

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

// 使用
const stats = new StatisticsPlugin();
manager.use(stats);

// 稍后，获取统计信息
console.log(stats.getStats());
```

## 通知插件

```typescript
import { Plugin, UploadTask } from "@chunkflow/core";

export class NotificationPlugin implements Plugin {
  name = "notification";

  onTaskSuccess(task: UploadTask): void {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("上传完成", {
        body: `${task.file.name} 已成功上传`,
        icon: "/upload-icon.png",
      });
    }
  }

  onTaskError(task: UploadTask, error: Error): void {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("上传失败", {
        body: `${task.file.name} 上传失败: ${error.message}`,
        icon: "/error-icon.png",
      });
    }
  }
}

// 使用
// 首先请求权限
if ("Notification" in window) {
  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      manager.use(new NotificationPlugin());
    }
  });
}
```

## 重试策略插件

```typescript
import { Plugin, UploadTask } from "@chunkflow/core";

export class RetryStrategyPlugin implements Plugin {
  name = "retry-strategy";
  private retryAttempts = new Map<string, number>();

  onTaskError(task: UploadTask, error: Error): void {
    const attempts = this.retryAttempts.get(task.id) || 0;

    if (attempts < 3) {
      console.log(`重试任务 ${task.id}，第 ${attempts + 1} 次尝试`);
      this.retryAttempts.set(task.id, attempts + 1);

      // 延迟后重试
      setTimeout(
        () => {
          task.resume();
        },
        1000 * Math.pow(2, attempts),
      ); // 指数退避
    } else {
      console.error(`任务 ${task.id} 在 3 次尝试后失败`);
      this.retryAttempts.delete(task.id);
    }
  }

  onTaskSuccess(task: UploadTask): void {
    this.retryAttempts.delete(task.id);
  }
}

// 使用
manager.use(new RetryStrategyPlugin());
```

## 另请参阅

- [Core API](/zh/api/core)
- [React 示例](/zh/examples/react)
- [Vue 示例](/zh/examples/vue)
