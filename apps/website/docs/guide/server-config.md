# Server Configuration

Guide to setting up and configuring the ChunkFlow server.

## Quick Start

### Using the Demo Server

```bash
git clone https://github.com/Sunny-117/chunkflow.git
cd chunkflow/apps/server
pnpm install
docker-compose up -d
pnpm run start:dev
```

## Custom Implementation

```typescript
import { UploadService, LocalStorageAdapter, PostgreSQLAdapter } from "@chunkflow/upload-server";

const storage = new LocalStorageAdapter("./storage");
const database = new PostgreSQLAdapter({
  host: "localhost",
  port: 5432,
  database: "chunkflow",
  user: "postgres",
  password: "postgres",
});

const uploadService = new UploadService({
  storageAdapter: storage,
  database,
  tokenSecret: "your-secret-key",
  defaultChunkSize: 1024 * 1024,
});
```

## Storage Adapters

### Local File System

```typescript
const storage = new LocalStorageAdapter("./storage");
```

### OSS (Alibaba Cloud)

```typescript
const storage = new OSSStorageAdapter({
  region: "oss-cn-hangzhou",
  accessKeyId: "your-key",
  accessKeySecret: "your-secret",
  bucket: "your-bucket",
});
```

## Database Setup

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

## See Also

- [Client Configuration](/guide/client-config)
- [Storage Adapters](/guide/storage-adapters)
- [API Reference](/api/server)
