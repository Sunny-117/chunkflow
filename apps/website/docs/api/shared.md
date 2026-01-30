# Shared API

Common utilities and helpers used across ChunkFlow.

## Event System

```typescript
import { createEventBus } from "@chunkflow/shared";

const eventBus = createEventBus();

eventBus.on("event", (payload) => {
  console.log(payload);
});

eventBus.emit("event", { data: "value" });
```

## Concurrency Control

```typescript
import { ConcurrencyController } from "@chunkflow/shared";

const controller = new ConcurrencyController({ limit: 3 });

await controller.run(async () => {
  // Your async operation
});
```

## File Utilities

### sliceFile()

```typescript
import { sliceFile } from "@chunkflow/shared";

const chunk = sliceFile(file, 0, 1024 * 1024); // First 1MB
```

### calculateFileHash()

```typescript
import { calculateFileHash } from "@chunkflow/shared";

const hash = await calculateFileHash(file, (progress) => {
  console.log(`Progress: ${progress}%`);
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

## IndexedDB Storage

```typescript
import { UploadStorage } from "@chunkflow/shared";

const storage = new UploadStorage();
await storage.init();

await storage.saveRecord(record);
const record = await storage.getRecord(taskId);
await storage.updateRecord(taskId, updates);
await storage.deleteRecord(taskId);
```

## See Also

- [Protocol API](/api/protocol)
- [Core API](/api/core)
