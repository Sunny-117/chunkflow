# 存储适配器

ChunkFlow 通过适配器支持多种存储后端。

## 可用适配器

### LocalStorageAdapter

在本地文件系统上存储分片。

```typescript
const storage = new LocalStorageAdapter('./storage');
```

### OSSStorageAdapter

在阿里云 OSS 上存储分片。

```typescript
const storage = new OSSStorageAdapter({
  region: 'oss-cn-hangzhou',
  accessKeyId: 'your-key',
  accessKeySecret: 'your-secret',
  bucket: 'your-bucket',
});
```

## 自定义适配器

实现 `StorageAdapter` 接口：

```typescript
interface StorageAdapter {
  saveChunk(chunkHash: string, data: Buffer): Promise<void>;
  getChunk(chunkHash: string): Promise<Buffer>;
  chunkExists(chunkHash: string): Promise<boolean>;
  chunksExist(chunkHashes: string[]): Promise<boolean[]>;
  getChunkStream(chunkHash: string): Promise<ReadableStream>;
}
```

## 另请参阅

- [服务端配置](/zh/guide/server-config)
- [API 参考](/zh/api/server)
