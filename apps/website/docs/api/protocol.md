# Protocol API

The Protocol layer defines all TypeScript types and interfaces for communication between client and server.

## Core Types

### FileInfo

Information about a file to be uploaded.

```typescript
interface FileInfo {
  name: string; // File name
  size: number; // File size in bytes
  type: string; // MIME type
  hash?: string; // File hash (MD5)
  lastModified: number; // Last modified timestamp
}
```

### ChunkInfo

Information about a file chunk.

```typescript
interface ChunkInfo {
  index: number; // Chunk index (0-based)
  hash: string; // Chunk hash (MD5)
  size: number; // Chunk size in bytes
  start: number; // Start byte position
  end: number; // End byte position
}
```

### UploadToken

Token for authorizing upload operations.

```typescript
interface UploadToken {
  token: string; // JWT or similar token
  fileId: string; // Unique file identifier
  chunkSize: number; // Negotiated chunk size
  expiresAt: number; // Token expiration timestamp
}
```

### UploadStatus

Enum representing upload task status.

```typescript
enum UploadStatus {
  IDLE = "idle", // Not started
  HASHING = "hashing", // Calculating hash
  UPLOADING = "uploading", // Uploading chunks
  PAUSED = "paused", // Paused by user
  SUCCESS = "success", // Upload complete
  ERROR = "error", // Upload failed
  CANCELLED = "cancelled", // Cancelled by user
}
```

## API Interfaces

### Create File

Initialize a new upload session.

#### Request

```typescript
interface CreateFileRequest {
  fileName: string; // File name
  fileSize: number; // File size in bytes
  fileType: string; // MIME type
  preferredChunkSize?: number; // Preferred chunk size (optional)
}
```

#### Response

```typescript
interface CreateFileResponse {
  uploadToken: UploadToken; // Upload authorization token
  negotiatedChunkSize: number; // Server-negotiated chunk size
}
```

#### Example

```typescript
const response = await adapter.createFile({
  fileName: "video.mp4",
  fileSize: 100 * 1024 * 1024, // 100MB
  fileType: "video/mp4",
  preferredChunkSize: 2 * 1024 * 1024, // 2MB
});

console.log(response.uploadToken.token);
console.log(response.negotiatedChunkSize);
```

### Verify Hash

Check if file or chunks already exist (for instant upload).

#### Request

```typescript
interface VerifyHashRequest {
  fileHash?: string; // File hash (for full instant upload)
  chunkHashes?: string[]; // Chunk hashes (for partial instant upload)
  uploadToken: string; // Upload token
}
```

#### Response

```typescript
interface VerifyHashResponse {
  fileExists: boolean; // Whether file already exists
  fileUrl?: string; // File URL (if exists)
  existingChunks: number[]; // Indices of existing chunks
  missingChunks: number[]; // Indices of missing chunks
}
```

#### Example

```typescript
// Check if file exists
const response = await adapter.verifyHash({
  fileHash: "abc123...",
  uploadToken: token,
});

if (response.fileExists) {
  console.log("File already exists:", response.fileUrl);
} else {
  console.log("Need to upload chunks:", response.missingChunks);
}
```

### Upload Chunk

Upload a single chunk.

#### Request

```typescript
interface UploadChunkRequest {
  uploadToken: string; // Upload token
  chunkIndex: number; // Chunk index
  chunkHash: string; // Chunk hash
  chunk: Blob | Buffer; // Chunk data
}
```

#### Response

```typescript
interface UploadChunkResponse {
  success: boolean; // Whether upload succeeded
  chunkHash: string; // Confirmed chunk hash
}
```

#### Example

```typescript
const chunk = file.slice(0, 1024 * 1024); // First 1MB
const chunkHash = await calculateChunkHash(chunk);

const response = await adapter.uploadChunk({
  uploadToken: token,
  chunkIndex: 0,
  chunkHash,
  chunk,
});

console.log("Chunk uploaded:", response.success);
```

### Merge File

Complete the upload and merge chunks logically.

#### Request

```typescript
interface MergeFileRequest {
  uploadToken: string; // Upload token
  fileHash: string; // File hash
  chunkHashes: string[]; // All chunk hashes in order
}
```

#### Response

```typescript
interface MergeFileResponse {
  success: boolean; // Whether merge succeeded
  fileUrl: string; // File access URL
  fileId: string; // File identifier
}
```

#### Example

```typescript
const response = await adapter.mergeFile({
  uploadToken: token,
  fileHash: "abc123...",
  chunkHashes: ["chunk1...", "chunk2...", "chunk3..."],
});

console.log("File URL:", response.fileUrl);
```

## Request Adapter Interface

Interface for implementing custom HTTP clients.

```typescript
interface RequestAdapter {
  createFile(request: CreateFileRequest): Promise<CreateFileResponse>;
  verifyHash(request: VerifyHashRequest): Promise<VerifyHashResponse>;
  uploadChunk(request: UploadChunkRequest): Promise<UploadChunkResponse>;
  mergeFile(request: MergeFileRequest): Promise<MergeFileResponse>;
}
```

### Creating a Custom Adapter

```typescript
import { RequestAdapter } from "@chunkflow/protocol";

class CustomAdapter implements RequestAdapter {
  constructor(private baseURL: string) {}

  async createFile(request: CreateFileRequest): Promise<CreateFileResponse> {
    const response = await fetch(`${this.baseURL}/upload/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    return response.json();
  }

  async verifyHash(request: VerifyHashRequest): Promise<VerifyHashResponse> {
    const response = await fetch(`${this.baseURL}/upload/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    return response.json();
  }

  async uploadChunk(request: UploadChunkRequest): Promise<UploadChunkResponse> {
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

  async mergeFile(request: MergeFileRequest): Promise<MergeFileResponse> {
    const response = await fetch(`${this.baseURL}/upload/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    return response.json();
  }
}
```

## Error Types

### UploadError

Base error class for upload-related errors.

```typescript
class UploadError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "UploadError";
  }
}
```

### Common Error Codes

| Code                  | Description               |
| --------------------- | ------------------------- |
| `TOKEN_INVALID`       | Upload token is invalid   |
| `TOKEN_EXPIRED`       | Upload token has expired  |
| `FILE_TOO_LARGE`      | File exceeds maximum size |
| `CHUNK_HASH_MISMATCH` | Chunk hash doesn't match  |
| `NETWORK_ERROR`       | Network request failed    |
| `SERVER_ERROR`        | Server returned an error  |

## Type Guards

Utility functions for type checking.

```typescript
function isUploadError(error: unknown): error is UploadError {
  return error instanceof UploadError;
}

function isNetworkError(error: unknown): boolean {
  return isUploadError(error) && error.code === "NETWORK_ERROR";
}
```

## Constants

```typescript
// Default chunk size (1MB)
export const DEFAULT_CHUNK_SIZE = 1024 * 1024;

// Minimum chunk size (256KB)
export const MIN_CHUNK_SIZE = 256 * 1024;

// Maximum chunk size (10MB)
export const MAX_CHUNK_SIZE = 10 * 1024 * 1024;

// Direct upload threshold (5MB)
export const DIRECT_UPLOAD_THRESHOLD = 5 * 1024 * 1024;

// Default concurrency
export const DEFAULT_CONCURRENCY = 3;

// Default retry count
export const DEFAULT_RETRY_COUNT = 3;

// Default retry delay (1 second)
export const DEFAULT_RETRY_DELAY = 1000;
```

## See Also

- [Shared API](/api/shared) - Common utilities
- [Core API](/api/core) - Upload logic
- [Server API](/api/server) - Server implementation
