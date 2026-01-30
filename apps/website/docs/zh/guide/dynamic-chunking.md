# 动态分片

ChunkFlow 根据网络性能动态调整分片大小，类似于 TCP 慢启动。

## 算法

- **快速上传**（< 目标时间的 50%）→ 增加分片大小
- **慢速上传**（> 目标时间的 150%）→ 减少分片大小
- **正常上传** → 保持当前大小

## 配置

```typescript
const task = manager.createTask(file, {
  chunkSize: 1024 * 1024, // 初始: 1MB
  // 最小: 256KB，最大: 10MB（自动）
});
```

## 优势

- 适应网络条件
- 优化上传速度
- 减少重试开销
- 更好的资源利用

## 另请参阅

- [上传策略](/zh/guide/upload-strategies)
- [性能优化](/zh/guide/performance)
