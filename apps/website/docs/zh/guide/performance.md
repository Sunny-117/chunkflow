# 性能优化

使用 ChunkFlow 优化上传性能的最佳实践。

## 分片大小优化

### 基于网络

- **快速网络（> 10 Mbps）**：5-10MB 分片
- **中速网络（1-10 Mbps）**：1-5MB 分片
- **慢速网络（< 1 Mbps）**：256KB-1MB 分片

```typescript
const task = manager.createTask(file, {
  chunkSize: detectOptimalChunkSize(),
});
```

### 基于文件

- **小文件（< 50MB）**：1-2MB 分片
- **中等文件（50-500MB）**：2-5MB 分片
- **大文件（> 500MB）**：5-10MB 分片

## 并发优化

```typescript
// 快速网络
const task = manager.createTask(file, {
  concurrency: 10,
});

// 慢速网络
const task = manager.createTask(file, {
  concurrency: 2,
});
```

## 内存优化

1. 对大文件使用流式处理
2. 限制并发上传数
3. 清理已完成的任务
4. 使用 Web Workers 进行哈希计算

## 网络优化

1. 启用 HTTP/2 或 HTTP/3
2. 使用 CDN 提供静态资源
3. 实现连接池
4. 启用压缩

## 最佳实践

1. 让动态分片自动适应
2. 监控上传速度并调整
3. 使用秒传进行去重
4. 实现适当的错误处理
5. 在各种网络条件下测试

## 监控

```typescript
task.on('progress', ({ speed, remainingTime }) => {
  console.log(`速度: ${formatSpeed(speed)}`);
  console.log(`预计剩余时间: ${formatTime(remainingTime)}`);
});
```

## 另请参阅

- [动态分片](/zh/guide/dynamic-chunking)
- [配置](/zh/guide/client-config)
