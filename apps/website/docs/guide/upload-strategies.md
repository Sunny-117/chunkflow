# Upload Strategies

ChunkFlow automatically selects the optimal upload strategy based on file size and configuration.

## Strategy Selection

### Direct Upload (< 5MB)

For small files, ChunkFlow uses direct upload:

```typescript
// File < 5MB → Direct upload
const smallFile = new File(["content"], "small.txt");
const task = manager.createTask(smallFile);
await task.start(); // Uploads entire file in one request
```

**Advantages**:

- Faster for small files
- Single HTTP request
- Lower overhead

**Use Cases**:

- Images
- Documents
- Small videos
- Text files

### Chunked Upload (≥ 5MB)

For large files, ChunkFlow uses chunked upload:

```typescript
// File ≥ 5MB → Chunked upload
const largeFile = new File([new ArrayBuffer(10 * 1024 * 1024)], "large.bin");
const task = manager.createTask(largeFile);
await task.start(); // Uploads file in chunks
```

**Advantages**:

- Resumable
- Better error recovery
- Progress tracking
- Memory efficient

**Use Cases**:

- Large videos
- Archives
- Datasets
- Backups

## Threshold Configuration

You can customize the threshold:

```typescript
import { DIRECT_UPLOAD_THRESHOLD } from "@chunkflow/protocol";

// Default is 5MB
console.log(DIRECT_UPLOAD_THRESHOLD); // 5242880

// Custom threshold (not directly configurable, but you can implement custom logic)
const shouldUseChunked = file.size >= customThreshold;
```

## Chunked Upload Details

### Chunk Size

Default chunk size is 1MB, but it's dynamically adjusted:

```typescript
const task = manager.createTask(file, {
  chunkSize: 2 * 1024 * 1024, // Start with 2MB chunks
});
```

### Dynamic Adjustment

ChunkFlow adjusts chunk size based on network performance:

- **Fast network** → Larger chunks (up to 10MB)
- **Slow network** → Smaller chunks (down to 256KB)

See [Dynamic Chunking](/guide/dynamic-chunking) for details.

### Concurrency

Multiple chunks upload in parallel:

```typescript
const task = manager.createTask(file, {
  concurrency: 5, // Upload 5 chunks simultaneously
});
```

## Hash-Based Strategies

### Full Instant Upload

If file hash matches an existing file:

```typescript
// First upload
const file1 = new File(["content"], "file.txt");
await manager.createTask(file1).start();

// Second upload (instant)
const file2 = new File(["content"], "file.txt");
await manager.createTask(file2).start(); // Completes immediately
```

### Partial Instant Upload

If some chunks already exist:

```typescript
// Upload file A (chunks: 1, 2, 3, 4, 5)
await manager.createTask(fileA).start();

// Upload file B (chunks: 1, 2, 6, 7, 8)
// Only uploads chunks 6, 7, 8 (chunks 1, 2 already exist)
await manager.createTask(fileB).start();
```

See [Hash & Instant Upload](/guide/hash-instant-upload) for details.

## Resumable Upload

Chunked uploads can be resumed after interruption:

```typescript
const task = manager.createTask(file);
await task.start();

// Network interruption or user closes page

// Later, on page reload
await manager.init(); // Automatically resumes unfinished tasks
```

See [Resumable Upload](/guide/resumable-upload) for details.

## Strategy Comparison

| Feature        | Direct Upload | Chunked Upload |
| -------------- | ------------- | -------------- |
| File Size      | < 5MB         | ≥ 5MB          |
| Requests       | 1             | Multiple       |
| Resumable      | ❌            | ✅             |
| Progress       | Basic         | Detailed       |
| Memory         | Higher        | Lower          |
| Error Recovery | Restart       | Resume         |
| Deduplication  | File-level    | Chunk-level    |

## Best Practices

### 1. Let ChunkFlow Decide

Trust the automatic strategy selection:

```typescript
// Good: Let ChunkFlow choose
const task = manager.createTask(file);
await task.start();
```

### 2. Adjust for Your Use Case

Customize for specific needs:

```typescript
// For slow networks
const task = manager.createTask(file, {
  chunkSize: 512 * 1024, // 512KB chunks
  concurrency: 2, // Lower concurrency
});

// For fast networks
const task = manager.createTask(file, {
  chunkSize: 5 * 1024 * 1024, // 5MB chunks
  concurrency: 10, // Higher concurrency
});
```

### 3. Monitor Performance

Use events to track performance:

```typescript
task.on("progress", ({ speed }) => {
  console.log(`Upload speed: ${speed} bytes/s`);

  // Adjust strategy if needed
  if (speed < 100 * 1024) {
    // < 100KB/s
    console.warn("Slow network detected");
  }
});
```

### 4. Handle Errors Gracefully

Implement retry logic:

```typescript
const task = manager.createTask(file, {
  retryCount: 5, // Retry up to 5 times
  retryDelay: 2000, // 2 seconds between retries
});

task.on("error", ({ error }) => {
  console.error("Upload failed:", error);
  // Notify user or implement custom recovery
});
```

## See Also

- [Dynamic Chunking](/guide/dynamic-chunking)
- [Hash & Instant Upload](/guide/hash-instant-upload)
- [Resumable Upload](/guide/resumable-upload)
- [Performance Optimization](/guide/performance)
