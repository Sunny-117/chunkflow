# Storage Adapters

ChunkFlow supports multiple storage backends through adapters.

## Available Adapters

### LocalStorageAdapter

Store chunks on local file system.

```typescript
const storage = new LocalStorageAdapter("./storage");
```

### OSSStorageAdapter

Store chunks on Alibaba Cloud OSS.

```typescript
const storage = new OSSStorageAdapter({
  region: "oss-cn-hangzhou",
  accessKeyId: "your-key",
  accessKeySecret: "your-secret",
  bucket: "your-bucket",
});
```

## Custom Adapter

Implement the `StorageAdapter` interface:

```typescript
interface StorageAdapter {
  saveChunk(chunkHash: string, data: Buffer): Promise<void>;
  getChunk(chunkHash: string): Promise<Buffer>;
  chunkExists(chunkHash: string): Promise<boolean>;
  chunksExist(chunkHashes: string[]): Promise<boolean[]>;
  getChunkStream(chunkHash: string): Promise<ReadableStream>;
}
```

## See Also

- [Server Configuration](/guide/server-config)
- [API Reference](/api/server)
