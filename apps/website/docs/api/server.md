# Server API

Server-side SDK for implementing upload services.

## UploadService

Main service class for handling uploads.

```typescript
import { UploadService, LocalStorageAdapter, PostgreSQLAdapter } from "@chunkflow/upload-server";

const service = new UploadService({
  storageAdapter: new LocalStorageAdapter("./storage"),
  database: new PostgreSQLAdapter(dbConfig),
  tokenSecret: "your-secret",
  defaultChunkSize: 1024 * 1024,
});
```

### Methods

#### createFile()

```typescript
const response = await service.createFile({
  fileName: "video.mp4",
  fileSize: 100 * 1024 * 1024,
  fileType: "video/mp4",
});
```

#### verifyHash()

```typescript
const response = await service.verifyHash({
  fileHash: "abc123...",
  uploadToken: token,
});
```

#### uploadChunk()

```typescript
const response = await service.uploadChunk({
  uploadToken: token,
  chunkIndex: 0,
  chunkHash: "chunk123...",
  chunk: buffer,
});
```

#### mergeFile()

```typescript
const response = await service.mergeFile({
  uploadToken: token,
  fileHash: "abc123...",
  chunkHashes: ["chunk1...", "chunk2..."],
});
```

#### getFileStream()

```typescript
const stream = await service.getFileStream(fileId);
```

## Storage Adapters

### LocalStorageAdapter

```typescript
const storage = new LocalStorageAdapter("./storage");
```

### OSSStorageAdapter

```typescript
const storage = new OSSStorageAdapter({
  region: "oss-cn-hangzhou",
  accessKeyId: "key",
  accessKeySecret: "secret",
  bucket: "bucket",
});
```

## Database Adapters

### PostgreSQLAdapter

```typescript
const database = new PostgreSQLAdapter({
  host: "localhost",
  port: 5432,
  database: "chunkflow",
  user: "postgres",
  password: "postgres",
});
```

## See Also

- [Server Configuration](/guide/server-config)
- [Storage Adapters](/guide/storage-adapters)
- [Examples](/examples/server)
