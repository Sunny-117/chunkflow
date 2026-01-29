# @chunkflow/protocol

Protocol layer defining communication interfaces between client and server for ChunkFlow Upload SDK.

## Overview

This package provides TypeScript type definitions and interfaces for the ChunkFlow Upload SDK protocol layer. It defines the contract between client and server, ensuring type safety across the entire upload workflow.

## Features

- **Core Types**: FileInfo, ChunkInfo, UploadToken, UploadStatus
- **API Interfaces**: Request/Response types for all upload operations
- **RequestAdapter**: Abstract interface for HTTP client implementation
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Zero Dependencies**: Pure TypeScript types with no runtime dependencies

## Installation

```bash
pnpm add @chunkflow/protocol
```

## Usage

### Import Types

```typescript
import type {
  FileInfo,
  ChunkInfo,
  UploadToken,
  UploadStatus,
  CreateFileRequest,
  CreateFileResponse,
  VerifyHashRequest,
  VerifyHashResponse,
  UploadChunkRequest,
  UploadChunkResponse,
  MergeFileRequest,
  MergeFileResponse,
  RequestAdapter,
} from "@chunkflow/protocol";
```

### Core Types

#### FileInfo

Represents file metadata:

```typescript
const fileInfo: FileInfo = {
  name: "document.pdf",
  size: 5242880, // 5MB in bytes
  type: "application/pdf",
  hash: "abc123...", // Optional, calculated later
  lastModified: Date.now(),
};
```

#### ChunkInfo

Represents a file chunk:

```typescript
const chunkInfo: ChunkInfo = {
  index: 0,
  hash: "chunk-hash-md5",
  size: 1048576, // 1MB
  start: 0,
  end: 1048576,
};
```

#### UploadToken

Authentication token for upload session:

```typescript
const uploadToken: UploadToken = {
  token: "jwt-token-string",
  fileId: "unique-file-id",
  chunkSize: 1048576,
  expiresAt: Date.now() + 86400000, // 24 hours
};
```

#### UploadStatus

Upload state enumeration:

```typescript
enum UploadStatus {
  IDLE = "idle",
  HASHING = "hashing",
  UPLOADING = "uploading",
  PAUSED = "paused",
  SUCCESS = "success",
  ERROR = "error",
  CANCELLED = "cancelled",
}
```

### API Interfaces

#### Create File (HEAD)

Initiate upload session:

```typescript
const request: CreateFileRequest = {
  fileName: "document.pdf",
  fileSize: 5242880,
  fileType: "application/pdf",
  preferredChunkSize: 1048576, // Optional
};

const response: CreateFileResponse = {
  uploadToken: {
    /* ... */
  },
  negotiatedChunkSize: 1048576,
};
```

#### Verify Hash

Check for instant upload or resume:

```typescript
const request: VerifyHashRequest = {
  fileHash: "complete-file-hash",
  chunkHashes: ["chunk1-hash", "chunk2-hash"],
  uploadToken: "session-token",
};

const response: VerifyHashResponse = {
  fileExists: false,
  fileUrl: undefined,
  existingChunks: [0, 2],
  missingChunks: [1, 3, 4],
};
```

#### Upload Chunk

Upload a single chunk:

```typescript
const request: UploadChunkRequest = {
  uploadToken: "session-token",
  chunkIndex: 0,
  chunkHash: "chunk-hash-md5",
  chunk: blob, // Blob in browser, Buffer in Node.js
};

const response: UploadChunkResponse = {
  success: true,
  chunkHash: "chunk-hash-md5",
};
```

#### Merge File

Complete upload (logical merge):

```typescript
const request: MergeFileRequest = {
  uploadToken: "session-token",
  fileHash: "complete-file-hash",
  chunkHashes: ["chunk1", "chunk2", "chunk3"],
};

const response: MergeFileResponse = {
  success: true,
  fileUrl: "https://cdn.example.com/files/abc123",
  fileId: "unique-file-id",
};
```

### RequestAdapter Interface

Implement this interface to create custom HTTP clients:

```typescript
class MyRequestAdapter implements RequestAdapter {
  async createFile(request: CreateFileRequest): Promise<CreateFileResponse> {
    // Implementation using fetch, axios, etc.
  }

  async verifyHash(request: VerifyHashRequest): Promise<VerifyHashResponse> {
    // Implementation
  }

  async uploadChunk(request: UploadChunkRequest): Promise<UploadChunkResponse> {
    // Implementation
  }

  async mergeFile(request: MergeFileRequest): Promise<MergeFileResponse> {
    // Implementation
  }
}
```

## Requirements Validation

This package validates the following requirements:

- **7.1**: Defines CreateFile interface (HEAD) with upload token and chunk size negotiation
- **7.2**: Defines Hash verification interface with file/chunk existence checks
- **7.3**: Defines chunk upload interface supporting multipart/form-data and octet-stream
- **7.4**: Defines logical merge interface for validation and URL generation
- **7.5**: All interfaces defined using TypeScript for type safety

## API Documentation

For complete API documentation, see the [ChunkFlow Upload SDK Documentation](https://chunkflow-upload-sdk.example.com).

## License

MIT
