# Shared API

ChunkFlow 中使用的通用工具和辅助函数。

## 事件系统

```typescript
import { createEventBus } from "@chunkflow/shared";

const eventBus = createEventBus();

eventBus.on("event", (payload) => {
  console.log(payload);
});

eventBus.emit("event", { data: "value" });
```

## 并发控制

```typescript
import { ConcurrencyController } from "@chunkflow/shared";

const controller = new ConcurrencyController({ limit: 3 });

await controller.run(async () => {
  // 你的异步操作
});
```

## 文件工具

### sliceFile()

```typescript
import { sliceFile } from "@chunkflow/shared";

const chunk = sliceFile(file, 0, 1024 * 1024); // 第一个 1MB
```

### calculateFileHash()

```typescript
import { calculateFileHash } from "@chunkflow/shared";

const hash = await calculateFileHash(file, (progress) => {
  console.log(`进度: ${progress}%`);
});
```

### calculateChunkHash()

```typescript
import { calculateChunkHash } from "@chunkflow/shared";

const hash = await calculateChunkHash(chunk);
```

### formatFileSize()

```typescript
import { formatFileSize } from "@chunkflow/shared";

console.log(formatFileSize(1024)); // "1.00 KB"
console.log(formatFileSize(1024 * 1024)); // "1.00 MB"
```

## IndexedDB 存储

```typescript
import { UploadStorage } from "@chunkflow/shared";

const storage = new UploadStorage();
await storage.init();

await storage.saveRecord(record);
const record = await storage.getRecord(taskId);
await storage.updateRecord(taskId, updates);
await storage.deleteRecord(taskId);
```

## 另请参阅

- [Protocol API](/zh/api/protocol)
- [Core API](/zh/api/core)
