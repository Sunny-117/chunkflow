# 服务端配置

设置和配置 ChunkFlow 服务器的指南。

## 快速开始

### 使用演示服务器

```bash
git clone https://github.com/Sunny-117/chunkflow.git
cd chunkflow/apps/server
pnpm install
docker-compose up -d
pnpm run start:dev
```

## 自定义实现

```typescript
import { UploadService, LocalStorageAdapter, PostgreSQLAdapter } from '@chunkflow/upload-server';

const storage = new LocalStorageAdapter('./storage');
const database = new PostgreSQLAdapter({
  host: 'localhost',
  port: 5432,
  database: 'chunkflow',
  user: 'postgres',
  password: 'postgres',
});

const uploadService = new UploadService({
  storageAdapter: storage,
  database,
  tokenSecret: 'your-secret-key',
  defaultChunkSize: 1024 * 1024,
});
```

## 存储适配器

### 本地文件系统

```typescript
const storage = new LocalStorageAdapter('./storage');
```

### OSS（阿里云）

```typescript
const storage = new OSSStorageAdapter({
  region: 'oss-cn-hangzhou',
  accessKeyId: 'your-key',
  accessKeySecret: 'your-secret',
  bucket: 'your-bucket',
});
```

## 数据库设置

```sql
CREATE TABLE files (
  file_id VARCHAR(64) PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  file_hash VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chunks (
  chunk_hash VARCHAR(64) PRIMARY KEY,
  chunk_size INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE file_chunks (
  file_id VARCHAR(64),
  chunk_index INT,
  chunk_hash VARCHAR(64),
  PRIMARY KEY (file_id, chunk_index)
);
```

## 另请参阅

- [客户端配置](/zh/guide/client-config)
- [存储适配器](/zh/guide/storage-adapters)
- [API 参考](/zh/api/server)
