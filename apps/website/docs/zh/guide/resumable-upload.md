# 断点续传

ChunkFlow 自动保存上传进度，可以从中断的地方恢复。

## 工作原理

每次成功上传分片后，上传进度会持久化到 IndexedDB。当页面重新加载或用户返回时，ChunkFlow 可以从上次保存的状态恢复。

## 自动恢复

```typescript
const manager = new UploadManager({
  requestAdapter: adapter,
  autoResumeUnfinished: true, // 默认: true
});

await manager.init(); // 自动恢复未完成的上传
```

## 手动暂停/恢复

```typescript
const task = manager.createTask(file);
await task.start();

// 暂停
task.pause();

// 稍后恢复
await task.resume();
```

## 进度持久化

进度保存到 IndexedDB：

```typescript
interface UploadRecord {
  taskId: string;
  fileInfo: FileInfo;
  uploadedChunks: number[];
  uploadToken: string;
  createdAt: number;
  updatedAt: number;
}
```

## 最佳实践

1. 启用自动恢复以获得更好的用户体验
2. 为暂停的上传显示恢复 UI
3. 优雅地处理存储配额错误
4. 定期清理旧记录

## 另请参阅

- [上传策略](/zh/guide/upload-strategies)
- [错误处理](/zh/guide/error-handling)
