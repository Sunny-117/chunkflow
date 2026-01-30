# 客户端配置

客户端配置 ChunkFlow 的完整指南。

## UploadManager 选项

```typescript
const manager = new UploadManager({
  requestAdapter: adapter,           // 必需
  maxConcurrentTasks: 3,            // 最大并行上传数
  defaultChunkSize: 1024 * 1024,    // 默认分片大小 (1MB)
  defaultConcurrency: 3,            // 并行上传的分片数
  autoResumeUnfinished: true,       // 初始化时自动恢复
});
```

## UploadTask 选项

```typescript
const task = manager.createTask(file, {
  chunkSize: 2 * 1024 * 1024,  // 2MB 分片
  concurrency: 5,               // 5 个并行分片
  retryCount: 3,                // 重试 3 次
  retryDelay: 1000,             // 重试间隔 1 秒
  autoStart: false,             // 不立即开始
});
```

## 请求适配器

```typescript
const adapter = createFetchAdapter({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Authorization': 'Bearer token',
  },
  timeout: 30000,
  withCredentials: true,
});
```

## 另请参阅

- [服务端配置](/zh/guide/server-config)
- [API 参考](/zh/api/core)
