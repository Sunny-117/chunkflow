# 安全性

ChunkFlow 的安全考虑和最佳实践。

## 基于 Token 的认证

ChunkFlow 使用上传 token 进行授权：

```typescript
interface UploadToken {
  token: string;      // JWT 或类似
  fileId: string;     // 文件标识符
  chunkSize: number;  // 协商的分片大小
  expiresAt: number;  // 过期时间戳
}
```

## 服务端验证

### Token 验证

```typescript
// 在每个请求上验证 token
const fileId = verifyToken(uploadToken);
```

### 哈希验证

```typescript
// 验证分片哈希与内容匹配
const calculatedHash = calculateHash(chunk);
if (calculatedHash !== chunkHash) {
  throw new Error('哈希不匹配');
}
```

### 文件大小验证

```typescript
// 强制执行最大文件大小
if (fileSize > MAX_FILE_SIZE) {
  throw new Error('文件太大');
}
```

## 客户端验证

### 文件类型验证

```typescript
<UploadButton 
  accept="image/*,video/*"
  maxSize={100 * 1024 * 1024}
/>
```

### 大小验证

```typescript
if (file.size > maxSize) {
  throw new FileValidationError('文件太大');
}
```

## 最佳实践

1. 始终在服务端验证
2. 对所有请求使用 HTTPS
3. 实现速率限制
4. 设置适当的 CORS 头
5. 清理文件名
6. 扫描上传的文件以检测恶意软件
7. 实现访问控制
8. 使用安全的 token 生成
9. 设置 token 过期时间
10. 记录安全事件

## CORS 配置

```typescript
// Express
app.use(cors({
  origin: 'https://your-domain.com',
  credentials: true,
}));
```

## 另请参阅

- [服务端配置](/zh/guide/server-config)
- [错误处理](/zh/guide/error-handling)
