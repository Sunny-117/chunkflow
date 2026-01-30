# Server API

用于实现上传服务的服务端 SDK。

## UploadService

处理上传的主服务类。

```typescript
import { UploadService, LocalStorageAdapter, PostgreSQLAdapter } from '@chunkflow/upload-server';

const service = new UploadService({
  storageAdapter: new LocalStorageAdapter('./storage'),
  database: new PostgreSQLAdapter(dbConfig),
  tokenSecret: 'your-secret',
  defaultChunkSize: 1024 * 1024,
});
```

### 方法

#### createFile()

```typescript
const response = await service.createFile({
  fileName: 'video.mp4',
  fileSize: 100 * 1024 * 1024,
  fileType: 'video/mp4',
});
```

#### verifyHash()

```typescript
const response = await service.verifyHash({
  fileHash: 'abc123...',
  uploadToken: token,
});
```

#### uploadChunk()

```typescript
const response = await service.uploadChunk({
  uploadToken: token,
  chunkIndex: 0,
  chunkHash: 'chunk123...',
  chunk: buffer,
});
```

#### mergeFile()

```typescript
const response = await service.mergeFile({
  uploadToken: token,
  fileHash: 'abc123...',
  chunkHashes: ['chunk1...', 'chunk2...'],
});
```

#### getFileStream()

```typescript
const stream = await service.getFileStream(fileId);
```

## 存储适配器

### LocalStorageAdapter

```typescript
const storage = new LocalStorageAdapter('./storage');
```

### OSSStorageAdapter

```typescript
const storage = new OSSStorageAdapter({
  region: 'oss-cn-hangzhou',
  accessKeyId: 'key',
  accessKeySecret: 'secret',
  bucket: 'bucket',
});
```

## 数据库适配器

### PostgreSQLAdapter

```typescript
const database = new PostgreSQLAdapter({
  host: 'localhost',
  port: 5432,
  database: 'chunkflow',
  user: 'postgres',
  password: 'postgres',
});
```

## 另请参阅

- [服务端配置](/zh/guide/server-config)
- [存储适配器](/zh/guide/storage-adapters)
- [示例](/zh/examples/server)
