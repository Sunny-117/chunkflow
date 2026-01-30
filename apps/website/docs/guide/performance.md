# Performance Optimization

Best practices for optimizing upload performance with ChunkFlow.

## Chunk Size Optimization

### Network-Based

- **Fast network (> 10 Mbps)**: 5-10MB chunks
- **Medium network (1-10 Mbps)**: 1-5MB chunks
- **Slow network (< 1 Mbps)**: 256KB-1MB chunks

```typescript
const task = manager.createTask(file, {
  chunkSize: detectOptimalChunkSize(),
});
```

### File-Based

- **Small files (< 50MB)**: 1-2MB chunks
- **Medium files (50-500MB)**: 2-5MB chunks
- **Large files (> 500MB)**: 5-10MB chunks

## Concurrency Optimization

```typescript
// Fast network
const task = manager.createTask(file, {
  concurrency: 10,
});

// Slow network
const task = manager.createTask(file, {
  concurrency: 2,
});
```

## Memory Optimization

1. Use streaming for large files
2. Limit concurrent uploads
3. Clean up completed tasks
4. Use Web Workers for hash calculation

## Network Optimization

1. Enable HTTP/2 or HTTP/3
2. Use CDN for static assets
3. Implement connection pooling
4. Enable compression

## Best Practices

1. Let dynamic chunking adapt automatically
2. Monitor upload speed and adjust
3. Use instant upload for deduplication
4. Implement proper error handling
5. Test with various network conditions

## Monitoring

```typescript
task.on("progress", ({ speed, remainingTime }) => {
  console.log(`Speed: ${formatSpeed(speed)}`);
  console.log(`ETA: ${formatTime(remainingTime)}`);
});
```

## See Also

- [Dynamic Chunking](/guide/dynamic-chunking)
- [Configuration](/guide/client-config)
