# Protocol API

Protocol 层定义了客户端和服务器之间通信的所有 TypeScript 类型和接口。

## 核心类型

### FileInfo

要上传的文件信息。

```typescript
interface FileInfo {
  name: string;          // 文件名
  size: number;          // 文件大小（字节）
  type: string;          // MIME 类型
  hash?: string;         // 文件哈希（MD5）
  lastModified: number;  // 最后修改时间戳
}
```

### ChunkInfo

文件分片信息。

```typescript
interface ChunkInfo {
  index: number;   // 分片索引（从 0 开始）
  hash: string;    // 分片哈希（MD5）
  size: number;    // 分片大小（字节）
  start: number;   // 起始字节位置
  end: number;     // 结束字节位置
}
```

### UploadToken

用于授权上传操作的 token。

```typescript
interface UploadToken {
  token: string;      // JWT 或类似 token
  fileId: string;     // 唯一文件标识符
  chunkSize: number;  // 协商的分片大小
  expiresAt: number;  // Token 过期时间戳
}
```

### UploadStatus

表示上传任务状态的枚举。

```typescript
enum UploadStatus {
  IDLE = "idle",           // 未开始
  HASHING = "hashing",     // 计算哈希中
  UPLOADING = "uploading", // 上传分片中
  PAUSED = "paused",       // 用户暂停
  SUCCESS = "success",     // 上传完成
  ERROR = "error",         // 上传失败
  CANCELLED = "cancelled", // 用户取消
}
```

## API 接口

### Create File

初始化新的上传会话。

#### 请求

```typescript
interface CreateFileRequest {
  fileName: string;              // 文件名
  fileSize: number;              // 文件大小（字节）
  fileType: string;              // MIME 类型
  preferredChunkSize?: number;   // 首选分片大小（可选）
}
```

#### 响应

```typescript
interface CreateFileResponse {
  uploadToken: UploadToken;      // 上传授权 token
  negotiatedChunkSize: number;   // 服务器协商的分片大小
}
```

#### 示例

```typescript
const response = await adapter.createFile({
  fileName: 'video.mp4',
  fileSize: 100 * 1024 * 1024, // 100MB
  fileType: 'video/mp4',
  preferredChunkSize: 2 * 1024 * 1024, // 2MB
});

console.log(response.uploadToken.token);
console.log(response.negotiatedChunkSize);
```

### Verify Hash

检查文件或分片是否已存在（用于秒传）。

#### 请求

```typescript
interface VerifyHashRequest {
  fileHash?: string;       // 文件哈希（用于完全秒传）
  chunkHashes?: string[];  // 分片哈希（用于部分秒传）
  uploadToken: string;     // 上传 token
}
```

#### 响应

```typescript
interface VerifyHashResponse {
  fileExists: boolean;      // 文件是否已存在
  fileUrl?: string;         // 文件 URL（如果存在）
  existingChunks: number[]; // 已存在的分片索引
  missingChunks: number[];  // 缺失的分片索引
}
```

#### 示例

```typescript
// 检查文件是否存在
const response = await adapter.verifyHash({
  fileHash: 'abc123...',
  uploadToken: token,
});

if (response.fileExists) {
  console.log('文件已存在:', response.fileUrl);
} else {
  console.log('需要上传分片:', response.missingChunks);
}
```

### Upload Chunk

上传单个分片。

#### 请求

```typescript
interface UploadChunkRequest {
  uploadToken: string;  // 上传 token
  chunkIndex: number;   // 分片索引
  chunkHash: string;    // 分片哈希
  chunk: Blob | Buffer; // 分片数据
}
```

#### 响应

```typescript
interface UploadChunkResponse {
  success: boolean;   // 上传是否成功
  chunkHash: string;  // 确认的分片哈希
}
```

#### 示例

```typescript
const chunk = file.slice(0, 1024 * 1024); // 第一个 1MB
const chunkHash = await calculateChunkHash(chunk);

const response = await adapter.uploadChunk({
  uploadToken: token,
  chunkIndex: 0,
  chunkHash,
  chunk,
});

console.log('分片已上传:', response.success);
```

### Merge File

完成上传并逻辑合并分片。

#### 请求

```typescript
interface MergeFileRequest {
  uploadToken: string;     // 上传 token
  fileHash: string;        // 文件哈希
  chunkHashes: string[];   // 所有分片哈希（按顺序）
}
```

#### 响应

```typescript
interface MergeFileResponse {
  success: boolean;  // 合并是否成功
  fileUrl: string;   // 文件访问 URL
  fileId: string;    // 文件标识符
}
```

#### 示例

```typescript
const response = await adapter.mergeFile({
  uploadToken: token,
  fileHash: 'abc123...',
  chunkHashes: ['chunk1...', 'chunk2...', 'chunk3...'],
});

console.log('文件 URL:', response.fileUrl);
```

## Request Adapter 接口

用于实现自定义 HTTP 客户端的接口。

```typescript
interface RequestAdapter {
  createFile(request: CreateFileRequest): Promise<CreateFileResponse>;
  verifyHash(request: VerifyHashRequest): Promise<VerifyHashResponse>;
  uploadChunk(request: UploadChunkRequest): Promise<UploadChunkResponse>;
  mergeFile(request: MergeFileRequest): Promise<MergeFileResponse>;
}
```

### 创建自定义适配器

```typescript
import { RequestAdapter } from '@chunkflow/protocol';

class CustomAdapter implements RequestAdapter {
  constructor(private baseURL: string) {}

  async createFile(request: CreateFileRequest): Promise<CreateFileResponse> {
    const response = await fetch(`${this.baseURL}/upload/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return response.json();
  }

  async verifyHash(request: VerifyHashRequest): Promise<VerifyHashResponse> {
    const response = await fetch(`${this.baseURL}/upload/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return response.json();
  }

  async uploadChunk(request: UploadChunkRequest): Promise<UploadChunkResponse> {
    const formData = new FormData();
    formData.append('uploadToken', request.uploadToken);
    formData.append('chunkIndex', request.chunkIndex.toString());
    formData.append('chunkHash', request.chunkHash);
    formData.append('chunk', request.chunk);

    const response = await fetch(`${this.baseURL}/upload/chunk`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  }

  async mergeFile(request: MergeFileRequest): Promise<MergeFileResponse> {
    const response = await fetch(`${this.baseURL}/upload/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return response.json();
  }
}
```

## 错误类型

### UploadError

上传相关错误的基类。

```typescript
class UploadError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'UploadError';
  }
}
```

### 常见错误代码

| 代码 | 描述 |
|------|-------------|
| `TOKEN_INVALID` | 上传 token 无效 |
| `TOKEN_EXPIRED` | 上传 token 已过期 |
| `FILE_TOO_LARGE` | 文件超过最大大小 |
| `CHUNK_HASH_MISMATCH` | 分片哈希不匹配 |
| `NETWORK_ERROR` | 网络请求失败 |
| `SERVER_ERROR` | 服务器返回错误 |

## 类型守卫

用于类型检查的工具函数。

```typescript
function isUploadError(error: unknown): error is UploadError {
  return error instanceof UploadError;
}

function isNetworkError(error: unknown): boolean {
  return isUploadError(error) && error.code === 'NETWORK_ERROR';
}
```

## 常量

```typescript
// 默认分片大小（1MB）
export const DEFAULT_CHUNK_SIZE = 1024 * 1024;

// 最小分片大小（256KB）
export const MIN_CHUNK_SIZE = 256 * 1024;

// 最大分片大小（10MB）
export const MAX_CHUNK_SIZE = 10 * 1024 * 1024;

// 直接上传阈值（5MB）
export const DIRECT_UPLOAD_THRESHOLD = 5 * 1024 * 1024;

// 默认并发数
export const DEFAULT_CONCURRENCY = 3;

// 默认重试次数
export const DEFAULT_RETRY_COUNT = 3;

// 默认重试延迟（1 秒）
export const DEFAULT_RETRY_DELAY = 1000;
```

## 另请参阅

- [Shared API](/zh/api/shared) - 通用工具
- [Core API](/zh/api/core) - 上传逻辑
- [Server API](/zh/api/server) - 服务端实现
