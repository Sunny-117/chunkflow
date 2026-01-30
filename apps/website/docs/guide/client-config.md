# Client Configuration

Complete guide to configuring ChunkFlow on the client side.

## UploadManager Options

```typescript
const manager = new UploadManager({
  requestAdapter: adapter, // Required
  maxConcurrentTasks: 3, // Max parallel uploads
  defaultChunkSize: 1024 * 1024, // Default chunk size (1MB)
  defaultConcurrency: 3, // Chunks uploaded in parallel
  autoResumeUnfinished: true, // Auto-resume on init
});
```

## UploadTask Options

```typescript
const task = manager.createTask(file, {
  chunkSize: 2 * 1024 * 1024, // 2MB chunks
  concurrency: 5, // 5 parallel chunks
  retryCount: 3, // Retry 3 times
  retryDelay: 1000, // 1s between retries
  autoStart: false, // Don't start immediately
});
```

## Request Adapter

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

## See Also

- [Server Configuration](/guide/server-config)
- [API Reference](/api/core)
