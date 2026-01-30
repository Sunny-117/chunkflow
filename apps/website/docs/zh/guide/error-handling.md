# 错误处理

ChunkFlow 中处理错误的综合指南。

## 错误类型

### NetworkError

网络相关错误（超时、离线、服务器错误）。

```typescript
task.on('error', ({ error }) => {
  if (error.code === 'NETWORK_ERROR') {
    console.error('网络错误:', error.message);
  }
});
```

### TokenError

Token 验证错误。

```typescript
if (error.code === 'TOKEN_EXPIRED') {
  // 刷新 token 并重试
}
```

### FileValidationError

文件验证错误。

```typescript
if (error.code === 'FILE_TOO_LARGE') {
  alert('文件太大');
}
```

## 重试机制

带指数退避的自动重试：

```typescript
const task = manager.createTask(file, {
  retryCount: 3,     // 最多重试 3 次
  retryDelay: 1000,  // 基础延迟 1 秒
});
```

## 错误恢复

### 优雅降级

- IndexedDB 不可用 → 禁用断点续传
- Web Worker 不可用 → 在主线程中计算哈希
- 哈希计算失败 → 跳过秒传

### 用户干预

- 文件验证失败 → 显示错误消息
- 重试耗尽 → 提供手动重试
- 存储已满 → 提示释放空间

## 最佳实践

1. 始终在事件监听器中处理错误
2. 向用户提供清晰的错误消息
3. 为瞬态错误实现重试逻辑
4. 记录错误以便调试
5. 测试错误场景

## 另请参阅

- [最佳实践](/zh/guide/performance)
- [API 参考](/zh/api/core)
