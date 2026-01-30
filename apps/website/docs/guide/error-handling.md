# Error Handling

Comprehensive guide to handling errors in ChunkFlow.

## Error Types

### NetworkError

Network-related errors (timeout, offline, server error).

```typescript
task.on("error", ({ error }) => {
  if (error.code === "NETWORK_ERROR") {
    console.error("Network error:", error.message);
  }
});
```

### TokenError

Token validation errors.

```typescript
if (error.code === "TOKEN_EXPIRED") {
  // Refresh token and retry
}
```

### FileValidationError

File validation errors.

```typescript
if (error.code === "FILE_TOO_LARGE") {
  alert("File is too large");
}
```

## Retry Mechanism

Automatic retry with exponential backoff:

```typescript
const task = manager.createTask(file, {
  retryCount: 3, // Retry up to 3 times
  retryDelay: 1000, // 1 second base delay
});
```

## Error Recovery

### Graceful Degradation

- IndexedDB unavailable → Disable resumable upload
- Web Worker unavailable → Calculate hash in main thread
- Hash calculation fails → Skip instant upload

### User Intervention

- File validation fails → Show error message
- Retry exhausted → Offer manual retry
- Storage full → Prompt to free space

## Best Practices

1. Always handle errors in event listeners
2. Provide clear error messages to users
3. Implement retry logic for transient errors
4. Log errors for debugging
5. Test error scenarios

## See Also

- [Best Practices](/guide/performance)
- [API Reference](/api/core)
