# 上传策略

ChunkFlow 会根据文件大小和配置自动选择最优的上传策略。

## 策略选择

### 直接上传 (< 5MB)

对于小文件，ChunkFlow 使用直接上传：

```typescript
// 文件 < 5MB → 直接上传
const smallFile = new File(["content"], "small.txt");
const task = manager.createTask(smallFile);
await task.start(); // 在一个请求中上传整个文件
```

**优势**：

- 小文件上传更快
- 单个 HTTP 请求
- 更低的开销

**使用场景**：

- 图片
- 文档
- 小视频
- 文本文件

### 分片上传 (≥ 5MB)

对于大文件，ChunkFlow 使用分片上传：

```typescript
// 文件 ≥ 5MB → 分片上传
const largeFile = new File([new ArrayBuffer(10 * 1024 * 1024)], "large.bin");
const task = manager.createTask(largeFile);
await task.start(); // 分片上传文件
```

**优势**：

- 可断点续传
- 更好的错误恢复
- 进度跟踪
- 内存高效

**使用场景**：

- 大视频
- 压缩包
- 数据集
- 备份文件

## 阈值配置

你可以自定义阈值：

```typescript
import { DIRECT_UPLOAD_THRESHOLD } from "@chunkflow/protocol";

// 默认是 5MB
console.log(DIRECT_UPLOAD_THRESHOLD); // 5242880

// 自定义阈值（不能直接配置，但可以实现自定义逻辑）
const shouldUseChunked = file.size >= customThreshold;
```

## 分片上传详情

### 分片大小

默认分片大小为 1MB，但会动态调整：

```typescript
const task = manager.createTask(file, {
  chunkSize: 2 * 1024 * 1024, // 从 2MB 分片开始
});
```

### 动态调整

ChunkFlow 根据网络性能调整分片大小：

- **快速网络** → 更大的分片（最大 10MB）
- **慢速网络** → 更小的分片（最小 256KB）

详见[动态分片](/zh/guide/dynamic-chunking)。

### 并发

多个分片并行上传：

```typescript
const task = manager.createTask(file, {
  concurrency: 5, // 同时上传 5 个分片
});
```

## 基于哈希的策略

### 完全秒传

如果文件哈希匹配现有文件：

```typescript
// 第一次上传
const file1 = new File(["content"], "file.txt");
await manager.createTask(file1).start();

// 第二次上传（秒传）
const file2 = new File(["content"], "file.txt");
await manager.createTask(file2).start(); // 立即完成
```

### 部分秒传

如果某些分片已存在：

```typescript
// 上传文件 A（分片：1, 2, 3, 4, 5）
await manager.createTask(fileA).start();

// 上传文件 B（分片：1, 2, 6, 7, 8）
// 只上传分片 6, 7, 8（分片 1, 2 已存在）
await manager.createTask(fileB).start();
```

详见[哈希与秒传](/zh/guide/hash-instant-upload)。

## 断点续传

分片上传可以在中断后恢复：

```typescript
const task = manager.createTask(file);
await task.start();

// 网络中断或用户关闭页面

// 稍后，页面重新加载时
await manager.init(); // 自动恢复未完成的任务
```

详见[断点续传](/zh/guide/resumable-upload)。

## 策略对比

| 功能     | 直接上传 | 分片上传 |
| -------- | -------- | -------- |
| 文件大小 | < 5MB    | ≥ 5MB    |
| 请求数   | 1        | 多个     |
| 可续传   | ❌       | ✅       |
| 进度     | 基础     | 详细     |
| 内存     | 较高     | 较低     |
| 错误恢复 | 重新开始 | 恢复     |
| 去重     | 文件级   | 分片级   |

## 最佳实践

### 1. 让 ChunkFlow 决定

信任自动策略选择：

```typescript
// 好：让 ChunkFlow 选择
const task = manager.createTask(file);
await task.start();
```

### 2. 根据使用场景调整

针对特定需求自定义：

```typescript
// 慢速网络
const task = manager.createTask(file, {
  chunkSize: 512 * 1024, // 512KB 分片
  concurrency: 2, // 较低并发
});

// 快速网络
const task = manager.createTask(file, {
  chunkSize: 5 * 1024 * 1024, // 5MB 分片
  concurrency: 10, // 较高并发
});
```

### 3. 监控性能

使用事件跟踪性能：

```typescript
task.on("progress", ({ speed }) => {
  console.log(`上传速度: ${speed} bytes/s`);

  // 如果需要，调整策略
  if (speed < 100 * 1024) {
    // < 100KB/s
    console.warn("检测到慢速网络");
  }
});
```

### 4. 优雅地处理错误

实现重试逻辑：

```typescript
const task = manager.createTask(file, {
  retryCount: 5, // 最多重试 5 次
  retryDelay: 2000, // 重试间隔 2 秒
});

task.on("error", ({ error }) => {
  console.error("上传失败:", error);
  // 通知用户或实现自定义恢复
});
```

## 另请参阅

- [动态分片](/zh/guide/dynamic-chunking)
- [哈希与秒传](/zh/guide/hash-instant-upload)
- [断点续传](/zh/guide/resumable-upload)
- [性能优化](/zh/guide/performance)
