# Request Adapters

Request adapters are the bridge between ChunkFlow and your server. They handle all HTTP communication for file uploads.

## Overview

ChunkFlow provides two built-in adapters:

- **Fetch Adapter** - Modern, Promise-based using Fetch API
- **XHR Adapter** - XMLHttpRequest-based with native progress tracking

You can also create custom adapters for specific needs.

## Fetch Adapter

The Fetch Adapter uses the modern Fetch API for HTTP requests.

### Installation

```bash
npm install @chunkflowjs/core
```

### Basic Usage

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

### Configuration Options

```typescript
interface FetchAdapterOptions {
  baseURL: string;                           // Required: API base URL
  headers?: Record<string, string>;          // Custom headers
  timeout?: number;                          // Request timeout (default: 30000ms)
  fetch?: typeof fetch;                      // Custom fetch implementation
  onError?: (error: Error) => void;          // Error callback
}
```

### Complete Example

```typescript
const adapter = createFetchAdapter({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Authorization": "Bearer your-token",
    "X-Custom-Header": "value",
  },
  timeout: 60000, // 60 seconds
  onError: (error) => {
    console.error("Upload error:", error);
  },
});
```

### When to Use Fetch Adapter

✅ Modern browsers only (no IE support needed)  
✅ Prefer Promise-based API  
✅ Need streaming response support  
✅ Want simpler, more modern code  

## XHR Adapter

The XHR Adapter uses XMLHttpRequest for HTTP requests with native progress tracking.

### Installation

```bash
npm install @chunkflowjs/core
```

### Basic Usage

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

### Configuration Options

```typescript
interface XHRAdapterOptions {
  baseURL: string;                           // Required: API base URL
  headers?: Record<string, string>;          // Custom headers
  timeout?: number;                          // Request timeout (default: 30000ms)
  withCredentials?: boolean;                 // Send cookies (default: false)
  onUploadProgress?: (event: ProgressEvent) => void;  // Progress callback
  onError?: (error: Error) => void;          // Error callback
}
```

### Complete Example

```typescript
const adapter = createXHRAdapter({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Authorization": "Bearer your-token",
  },
  timeout: 60000,
  withCredentials: true, // Send cookies
  onUploadProgress: (event) => {
    if (event.lengthComputable) {
      const percent = (event.loaded / event.total) * 100;
      console.log(`Progress: ${percent.toFixed(2)}%`);
    }
  },
  onError: (error) => {
    console.error("Upload error:", error);
  },
});
```

### When to Use XHR Adapter

✅ Need native upload progress tracking  
✅ Need to support older browsers (IE10+)  
✅ Need request abort functionality  
✅ Working with legacy codebases using XHR  

## Comparison

| Feature | Fetch Adapter | XHR Adapter |
|---------|---------------|-------------|
| Upload Progress | ⚠️ Requires polyfill | ✅ Native |
| Browser Support | Modern browsers | IE10+ |
| API Style | Promise-based | Callback-based |
| Request Abort | ✅ AbortController | ✅ Native |
| Streaming | ✅ Yes | ❌ No |
| Code Complexity | Simple | Medium |

## React Integration

### With Fetch Adapter

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
        Select Files
      </UploadButton>
      <UploadList />
    </UploadProvider>
  );
}
```

### With XHR Adapter

```typescript
import { createXHRAdapter } from "@chunkflowjs/core";
import { UploadProvider } from "@chunkflowjs/upload-client-react";
import { UploadButton, UploadList } from "@chunkflowjs/upload-component-react";

const adapter = createXHRAdapter({
  baseURL: "http://localhost:3000/api",
  onUploadProgress: (event) => {
    if (event.lengthComputable) {
      console.log(`Progress: ${(event.loaded / event.total) * 100}%`);
    }
  },
});

function App() {
  return (
    <UploadProvider requestAdapter={adapter}>
      <UploadButton accept="*" multiple>
        Select Files
      </UploadButton>
      <UploadList />
    </UploadProvider>
  );
}
```

## Vue Integration

### With Fetch Adapter

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

### With XHR Adapter

```typescript
import { createApp } from "vue";
import { UploadPlugin } from "@chunkflowjs/upload-client-vue";
import { createXHRAdapter } from "@chunkflowjs/core";

const adapter = createXHRAdapter({
  baseURL: "http://localhost:3000/api",
  onUploadProgress: (event) => {
    if (event.lengthComputable) {
      console.log(`Progress: ${(event.loaded / event.total) * 100}%`);
    }
  },
});

const app = createApp(App);
app.use(UploadPlugin, { requestAdapter: adapter });
```

## Custom Adapter

You can create a custom adapter by implementing the `RequestAdapter` interface:

```typescript
import { RequestAdapter } from "@chunkflowjs/protocol";

class CustomAdapter implements RequestAdapter {
  constructor(private baseURL: string) {}

  async createFile(request) {
    // Implement file creation
    const response = await fetch(`${this.baseURL}/upload/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    return response.json();
  }

  async verifyHash(request) {
    // Implement hash verification
    const response = await fetch(`${this.baseURL}/upload/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    return response.json();
  }

  async uploadChunk(request) {
    // Implement chunk upload
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
    // Implement file merge
    const response = await fetch(`${this.baseURL}/upload/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    return response.json();
  }
}

// Use custom adapter
const adapter = new CustomAdapter("http://localhost:3000/api");
const manager = new UploadManager({ requestAdapter: adapter });
```

## Server Requirements

All adapters expect your server to implement these endpoints:

### POST /upload/create

Create a new upload session.

**Request:**
```json
{
  "fileName": "video.mp4",
  "fileSize": 104857600,
  "fileType": "video/mp4",
  "preferredChunkSize": 2097152
}
```

**Response:**
```json
{
  "uploadToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "negotiatedChunkSize": 2097152
}
```

### POST /upload/verify

Verify file and chunk hashes.

**Request:**
```json
{
  "uploadToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "fileHash": "abc123...",
  "chunkHashes": ["hash1", "hash2", "hash3"]
}
```

**Response:**
```json
{
  "fileExists": false,
  "existingChunks": [0, 2],
  "missingChunks": [1, 3, 4]
}
```

### POST /upload/chunk

Upload a single chunk (FormData).

**Request:**
- `uploadToken`: JWT token
- `chunkIndex`: Chunk index (0-based)
- `chunkHash`: MD5 hash of chunk
- `chunk`: Chunk file data (Blob)

**Response:**
```json
{
  "success": true,
  "chunkHash": "hash1"
}
```

### POST /upload/merge

Merge all chunks into final file.

**Request:**
```json
{
  "uploadToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "fileHash": "abc123...",
  "chunkHashes": ["hash1", "hash2", "hash3"]
}
```

**Response:**
```json
{
  "success": true,
  "fileUrl": "/upload/files/abc123",
  "fileId": "abc123"
}
```

## Error Handling

Both adapters provide error callbacks:

```typescript
const adapter = createFetchAdapter({
  baseURL: "http://localhost:3000/api",
  onError: (error) => {
    // Network errors
    if (error.message === "Network error") {
      console.error("Network connection failed");
    }
    
    // Timeout errors
    if (error.message.includes("timeout")) {
      console.error("Request timed out");
    }
    
    // HTTP errors
    if (error.message.startsWith("HTTP")) {
      console.error("Server error:", error.message);
    }
  },
});
```

## Best Practices

### 1. Set Appropriate Timeout

Adjust timeout based on expected file sizes and network conditions:

```typescript
const adapter = createFetchAdapter({
  baseURL: "http://localhost:3000/api",
  timeout: 60000, // 60 seconds for large files
});
```

### 2. Add Authentication

Include auth tokens in headers:

```typescript
const adapter = createFetchAdapter({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Authorization": `Bearer ${getAuthToken()}`,
  },
});
```

### 3. Handle Progress (XHR only)

Provide user feedback during uploads:

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

### 4. Implement Error Recovery

Handle errors gracefully and provide retry options:

```typescript
const adapter = createFetchAdapter({
  baseURL: "http://localhost:3000/api",
  onError: (error) => {
    logError(error);
    showRetryButton();
  },
});
```

## Troubleshooting

### CORS Issues

If you encounter CORS errors, ensure your server has proper CORS headers:

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

For XHR with credentials:

```typescript
const adapter = createXHRAdapter({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});
```

### Timeout Issues

If requests are timing out:

1. Increase timeout for large files:
```typescript
timeout: 120000 // 2 minutes
```

2. Consider reducing chunk size:
```typescript
const manager = new UploadManager({
  requestAdapter: adapter,
  defaultChunkSize: 1 * 1024 * 1024, // 1MB chunks
});
```

## See Also

- [Client Configuration](/guide/client-config)
- [Server Configuration](/guide/server-config)
- [API Reference - Core](/api/core)
- [Examples - React](/examples/react)
- [Examples - Vue](/examples/vue)
