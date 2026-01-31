# 请求适配器

请求适配器是 ChunkFlow 与服务器之间的桥梁，负责处理文件上传的所有 HTTP 通信。

## 概述

ChunkFlow 提供两个内置适配器：

- **Fetch 适配器** - 基于现代 Fetch API 的 Promise 风格
- **XHR 适配器** - 基于 XMLHttpRequest，支持原生进度跟踪

你也可以创建自定义适配器以满足特定需求。

## Fetch 适配器

Fetch 适配器使用现代 Fetch API 进行 HTTP 请求。

### 安装

```bash
npm install @chunkflowjs/core
```

### 基础用法

```typescript
import { createFetchAdapter } from "@chunkflowjs/core";
import { UploadManager } from "@chunkflowjs/core";

const adapter = createFetchAdapter({
  baseURL: "http://localhost:3000/api",
});

const manager = new UploadManager({
  requestAdapter: adapter,
});
```

### 配置选项

```typescript
interface FetchAdapterOptions {
  baseURL: string;                           // 必需：API 基础 URL
  headers?: Record<string, string>;          // 自定义请求头
  timeout?: number;                          // 请求超时时间（默认：30000ms）
  fetch?: typeof fetch;                      // 自定义 fetch 实现
  onError?: (error: Error) => void;          // 错误回调
}
```

### 完整示例

```typescript
const adapter = createFetchAdapter({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Authorization": "Bearer your-token",
    "X-Custom-Header": "value",
  },
  timeout: 60000, // 60 秒
  onError: (error) => {
    console.error("上传错误:", error);
  },
});
```

### 何时使用 Fetch 适配器

✅ 仅支持现代浏览器（无需 IE 支持）  
✅ 偏好基于 Promise 的 API  
✅ 需要流式响应支持  
✅ 想要更简单、更现代的代码  

## XHR 适配器

XHR 适配器使用 XMLHttpRequest 进行 HTTP 请求，支持原生进度跟踪。

### 安装

```bash
npm install @chunkflowjs/core
```

### 基础用法

```typescript
import { createXHRAdapter } from "@chunkflowjs/core";
import { UploadManager } from "@chunkflowjs/core";

const adapter = createXHRAdapter({
  baseURL: "http://localhost:3000/api",
});

const manager = new UploadManager({
  requestAdapter: adapter,
});
```

### 配置选项

```typescript
interface XHRAdapterOptions {
  baseURL: string;                           // 必需：API 基础 URL
  headers?: Record<string, string>;          // 自定义请求头
  timeout?: number;                          // 请求超时时间（默认：30000ms）
  withCredentials?: boolean;                 // 发送 Cookie（默认：false）
  onUploadProgress?: (event: ProgressEvent) => void;  // 进度回调
  onError?: (error: Error) => void;          // 错误回调
}
```

### 完整示例

```typescript
const adapter = createXHRAdapter({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Authorization": "Bearer your-token",
  },
  timeout: 60000,
  withCredentials: true, // 发送 Cookie
  onUploadProgress: (event) => {
    if (event.lengthComputable) {
      const percent = (event.loaded / event.total) * 100;
      console.log(`进度: ${percent.toFixed(2)}%`);
    }
  },
  onError: (error) => {
    console.error("上传错误:", error);
  },
});
```

### 何时使用 XHR 适配器

✅ 需要原生上传进度跟踪  
✅ 需要支持旧版浏览器（IE10+）  
✅ 需要请求中止功能  
✅ 使用基于 XHR 的旧代码库  

## 对比

| 功能 | Fetch 适配器 | XHR 适配器 |
|------|-------------|-----------|
| 上传进度 | ⚠️ 需要 polyfill | ✅ 原生支持 |
| 浏览器支持 | 现代浏览器 | IE10+ |
| API 风格 | Promise 风格 | 回调风格 |
| 请求中止 | ✅ AbortController | ✅ 原生支持 |
| 流式传输 | ✅ 支持 | ❌ 不支持 |
| 代码复杂度 | 简单 | 中等 |

## React 集成

### 使用 Fetch 适配器

```typescript
import { createFetchAdapter } from "@chunkflowjs/core";
import { UploadProvider } from "@chunkflowjs/upload-client-react";
import { UploadButton, UploadList } from "@chunkflowjs/upload-component-react";

const adapter = createFetchAdapter({
  baseURL: "http://localhost:3000/api",
});

function App() {
  return (
    <UploadProvider requestAdapter={adapter}>
      <UploadButton accept="*" multiple>
        选择文件
      </UploadButton>
      <UploadList />
    </UploadProvider>
  );
}
```

### 使用 XHR 适配器

```typescript
import { createXHRAdapter } from "@chunkflowjs/core";
import { UploadProvider } from "@chunkflowjs/upload-client-react";
import { UploadButton, UploadList } from "@chunkflowjs/upload-component-react";

const adapter = createXHRAdapter({
  baseURL: "http://localhost:3000/api",
  onUploadProgress: (event) => {
    if (event.lengthComputable) {
      console.log(`进度: ${(event.loaded / event.total) * 100}%`);
    }
  },
});

function App() {
  return (
    <UploadProvider requestAdapter={adapter}>
      <UploadButton accept="*" multiple>
        选择文件
      </UploadButton>
      <UploadList />
    </UploadProvider>
  );
}
```

## Vue 集成

### 使用 Fetch 适配器

```typescript
import { createApp } from "vue";
import { UploadPlugin } from "@chunkflowjs/upload-client-vue";
import { createFetchAdapter } from "@chunkflowjs/core";

const adapter = createFetchAdapter({
  baseURL: "http://localhost:3000/api",
});

const app = createApp(App);
app.use(UploadPlugin, { requestAdapter: adapter });
```

### 使用 XHR 适配器

```typescript
import { createApp } from "vue";
import { UploadPlugin } from "@chunkflowjs/upload-client-vue";
import { createXHRAdapter } from "@chunkflowjs/core";

const adapter = createXHRAdapter({
  baseURL: "http://localhost:3000/api",
  onUploadProgress: (event) => {
    if (event.lengthComputable) {
      console.log(`进度: ${(event.loaded / event.total) * 100}%`);
    }
  },
});

const app = createApp(App);
app.use(UploadPlugin, { requestAdapter: adapter });
```

## 自定义适配器

你可以通过实现 `RequestAdapter` 接口来创建自定义适配器：

```typescript
import { RequestAdapter } from "@chunkflowjs/protocol";

class CustomAdapter implements RequestAdapter {
  constructor(private baseURL: string) {}

  async createFile(request) {
    // 实现文件创建
    const response = await fetch(`${this.baseURL}/upload/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    return response.json();
  }

  async verifyHash(request) {
    // 实现哈希验证
    const response = await fetch(`${this.baseURL}/upload/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    return response.json();
  }

  async uploadChunk(request) {
    // 实现分片上传
    const formData = new FormData();
    formData.append("uploadToken", request.uploadToken);
    formData.append("chunkIndex", request.chunkIndex.toString());
    formData.append("chunkHash", request.chunkHash);
    formData.append("chunk", request.chunk);

    const response = await fetch(`${this.baseURL}/upload/chunk`, {
      method: "POST",
      body: formData,
    });
    return response.json();
  }

  async mergeFile(request) {
    // 实现文件合并
    const response = await fetch(`${this.baseURL}/upload/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    return response.json();
  }
}

// 使用自定义适配器
const adapter = new CustomAdapter("http://localhost:3000/api");
const manager = new UploadManager({ requestAdapter: adapter });
```

## 服务器要求

所有适配器都期望服务器实现以下端点：

### POST /upload/create

创建新的上传会话。

**请求：**
```json
{
  "fileName": "video.mp4",
  "fileSize": 104857600,
  "fileType": "video/mp4",
  "preferredChunkSize": 2097152
}
```

**响应：**
```json
{
  "uploadToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "negotiatedChunkSize": 2097152
}
```

### POST /upload/verify

验证文件和分片哈希。

**请求：**
```json
{
  "uploadToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "fileHash": "abc123...",
  "chunkHashes": ["hash1", "hash2", "hash3"]
}
```

**响应：**
```json
{
  "fileExists": false,
  "existingChunks": [0, 2],
  "missingChunks": [1, 3, 4]
}
```

### POST /upload/chunk

上传单个分片（FormData）。

**请求：**
- `uploadToken`: JWT token
- `chunkIndex`: 分片索引（从 0 开始）
- `chunkHash`: 分片的 MD5 哈希
- `chunk`: 分片文件数据（Blob）

**响应：**
```json
{
  "success": true,
  "chunkHash": "hash1"
}
```

### POST /upload/merge

合并所有分片为最终文件。

**请求：**
```json
{
  "uploadToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "fileHash": "abc123...",
  "chunkHashes": ["hash1", "hash2", "hash3"]
}
```

**响应：**
```json
{
  "success": true,
  "fileUrl": "/upload/files/abc123",
  "fileId": "abc123"
}
```

## 错误处理

两个适配器都提供错误回调：

```typescript
const adapter = createFetchAdapter({
  baseURL: "http://localhost:3000/api",
  onError: (error) => {
    // 网络错误
    if (error.message === "Network error") {
      console.error("网络连接失败");
    }
    
    // 超时错误
    if (error.message.includes("timeout")) {
      console.error("请求超时");
    }
    
    // HTTP 错误
    if (error.message.startsWith("HTTP")) {
      console.error("服务器错误:", error.message);
    }
  },
});
```

## 最佳实践

### 1. 设置合适的超时时间

根据预期文件大小和网络条件调整超时时间：

```typescript
const adapter = createFetchAdapter({
  baseURL: "http://localhost:3000/api",
  timeout: 60000, // 大文件使用 60 秒
});
```

### 2. 添加身份验证

在请求头中包含认证令牌：

```typescript
const adapter = createFetchAdapter({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Authorization": `Bearer ${getAuthToken()}`,
  },
});
```

### 3. 处理进度（仅 XHR）

在上传过程中提供用户反馈：

```typescript
const adapter = createXHRAdapter({
  baseURL: "http://localhost:3000/api",
  onUploadProgress: (event) => {
    if (event.lengthComputable) {
      updateProgressBar((event.loaded / event.total) * 100);
    }
  },
});
```

### 4. 实现错误恢复

优雅地处理错误并提供重试选项：

```typescript
const adapter = createFetchAdapter({
  baseURL: "http://localhost:3000/api",
  onError: (error) => {
    logError(error);
    showRetryButton();
  },
});
```

## 故障排除

### CORS 问题

如果遇到 CORS 错误，确保服务器有正确的 CORS 头：

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

对于带凭证的 XHR：

```typescript
const adapter = createXHRAdapter({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});
```

### 超时问题

如果请求超时：

1. 增加大文件的超时时间：
```typescript
timeout: 120000 // 2 分钟
```

2. 考虑减小分片大小：
```typescript
const manager = new UploadManager({
  requestAdapter: adapter,
  defaultChunkSize: 1 * 1024 * 1024, // 1MB 分片
});
```

## 相关链接

- [客户端配置](/zh/guide/client-config)
- [服务端配置](/zh/guide/server-config)
- [API 参考 - Core](/zh/api/core)
- [示例 - React](/zh/examples/react)
- [示例 - Vue](/zh/examples/vue)
