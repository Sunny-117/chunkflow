# 哈希与秒传

ChunkFlow 使用基于内容的哈希来实现通过去重的秒传功能。

## 工作原理

### 1. 哈希计算

当选择文件时，ChunkFlow 计算其 MD5 哈希：

```typescript
const file = new File(["content"], "file.txt");
const task = manager.createTask(file);

task.on("hashProgress", ({ progress }) => {
  console.log(`哈希计算: ${progress}%`);
});

task.on("hashComplete", ({ hash }) => {
  console.log(`文件哈希: ${hash}`);
});

await task.start();
```

### 2. 哈希验证

哈希被发送到服务器以检查文件是否已存在：

```typescript
// 服务器检查是否存在具有此哈希的文件
const response = await adapter.verifyHash({
  fileHash: "abc123...",
  uploadToken: token,
});

if (response.fileExists) {
  // 文件已存在 - 秒传！
  console.log("文件 URL:", response.fileUrl);
}
```

### 3. 并行处理

哈希计算和上传同时进行：

```
选择文件
     ↓
┌────────────────┬────────────────┐
│                │                │
│  计算          │  上传          │
│  哈希          │  分片          │
│  (后台)        │  (立即)        │
│                │                │
└────────────────┴────────────────┘
     ↓                    ↓
哈希完成            分片上传中
     ↓                    ↓
检查是否存在        继续或取消
```

## 完全秒传

当整个文件已存在时：

```typescript
// 第一个用户上传文件
const user1File = new File(["content"], "document.pdf");
await manager.createTask(user1File).start();
// 需要时间上传

// 第二个用户上传相同文件
const user2File = new File(["content"], "document.pdf");
await manager.createTask(user2File).start();
// 立即完成！
```

**优势**：

- 零上传时间
- 节省带宽
- 减少服务器存储
- 更好的用户体验

## 部分秒传

当某些分片已存在时：

```typescript
// 文件 A：分片 [1, 2, 3, 4, 5]
await manager.createTask(fileA).start();

// 文件 B：分片 [1, 2, 6, 7, 8]
// 只上传分片 [6, 7, 8]
await manager.createTask(fileB).start();
```

**优势**：

- 更快的上传
- 分片级去重
- 高效存储
- 减少网络使用

## 配置

### 启用/禁用哈希计算

```typescript
const task = manager.createTask(file, {
  enableHash: true, // 默认: true
});
```

### 哈希算法

ChunkFlow 默认使用 MD5（快速且足以用于去重）：

```typescript
import { calculateFileHash } from "@chunkflow/shared";

const hash = await calculateFileHash(file);
console.log(hash); // MD5 哈希
```

## 性能

### Web Worker

哈希计算在 Web Worker 中运行以避免阻塞主线程：

```typescript
// 如果可用，自动使用 Web Worker
const hash = await calculateFileHash(file, (progress) => {
  console.log(`进度: ${progress}%`);
});
```

### 降级方案

如果 Web Workers 不可用，降级到 `requestIdleCallback`：

```typescript
// 在主线程中使用 requestIdleCallback
const hash = await calculateFileHash(file);
```

## 最佳实践

### 1. 始终启用哈希

保持哈希计算启用以获得最佳用户体验：

```typescript
// 好
const task = manager.createTask(file);

// 除非必要，避免禁用
const task = manager.createTask(file, {
  enableHash: false, // 只有在有特定原因时
});
```

### 2. 显示哈希进度

告知用户哈希计算进度：

```typescript
task.on("hashProgress", ({ progress }) => {
  updateUI(`准备上传: ${progress}%`);
});

task.on("hashComplete", () => {
  updateUI("开始上传...");
});
```

### 3. 处理秒传

为秒传提供反馈：

```typescript
task.on("success", ({ fileUrl }) => {
  const wasInstant = task.getProgress().uploadedBytes === 0;

  if (wasInstant) {
    showMessage("文件已存在 - 秒传！");
  } else {
    showMessage("上传完成！");
  }
});
```

## 另请参阅

- [上传策略](/zh/guide/upload-strategies)
- [性能优化](/zh/guide/performance)
- [API 参考](/zh/api/shared)
