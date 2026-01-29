# @chunkflow/shared

Shared utilities and tools for ChunkFlow Upload SDK.

## Installation

```bash
pnpm add @chunkflow/shared
```

## Features

### File Utilities

The file utilities provide functions for file slicing, hash calculation, and formatting.

#### File Slicing

```typescript
import { sliceFile } from "@chunkflow/shared";

const file = new File(["Hello, World!"], "test.txt", { type: "text/plain" });

// Slice file from byte 0 to 5
const chunk = sliceFile(file, 0, 5);
console.log(chunk.size); // 5
```

#### Hash Calculation

Calculate MD5 hash for files and chunks using [spark-md5](https://github.com/satazor/js-spark-md5):

```typescript
import { calculateFileHash, calculateChunkHash } from "@chunkflow/shared";

// Calculate hash for entire file with progress tracking
const file = new File(["content"], "test.txt", { type: "text/plain" });
const hash = await calculateFileHash(file, (progress) => {
  console.log(`Hash calculation: ${progress.toFixed(2)}%`);
});
console.log("File hash:", hash);

// Calculate hash for a single chunk
const chunk = file.slice(0, 1024);
const chunkHash = await calculateChunkHash(chunk);
console.log("Chunk hash:", chunkHash);
```

#### File Size Formatting

```typescript
import { formatFileSize } from "@chunkflow/shared";

console.log(formatFileSize(0)); // "0 B"
console.log(formatFileSize(1024)); // "1.00 KB"
console.log(formatFileSize(1536)); // "1.50 KB"
console.log(formatFileSize(1024 * 1024)); // "1.00 MB"
console.log(formatFileSize(1.5 * 1024 * 1024)); // "1.50 MB"
console.log(formatFileSize(1024 * 1024 * 1024)); // "1.00 GB"
```

#### Upload Speed Calculation

```typescript
import { calculateSpeed } from "@chunkflow/shared";

const uploadedBytes = 1024 * 1024; // 1 MB
const elapsedMs = 1000; // 1 second

const speed = calculateSpeed(uploadedBytes, elapsedMs);
console.log(speed); // 1048576 (bytes per second)
console.log(formatFileSize(speed) + "/s"); // "1.00 MB/s"
```

#### Remaining Time Estimation

```typescript
import { estimateRemainingTime, formatFileSize } from "@chunkflow/shared";

const remainingBytes = 10 * 1024 * 1024; // 10 MB
const speed = 1024 * 1024; // 1 MB/s

const remainingSeconds = estimateRemainingTime(remainingBytes, speed);
console.log(remainingSeconds); // 10 seconds

// Format for display
const minutes = Math.floor(remainingSeconds / 60);
const seconds = Math.floor(remainingSeconds % 60);
console.log(`${minutes}m ${seconds}s remaining`);
```

#### Complete Upload Progress Example

```typescript
import {
  calculateFileHash,
  calculateChunkHash,
  sliceFile,
  formatFileSize,
  calculateSpeed,
  estimateRemainingTime,
} from "@chunkflow/shared";

async function uploadWithProgress(file: File) {
  const chunkSize = 1024 * 1024; // 1 MB chunks
  const totalChunks = Math.ceil(file.size / chunkSize);
  let uploadedBytes = 0;
  const startTime = Date.now();

  // Calculate file hash in background
  const hashPromise = calculateFileHash(file, (progress) => {
    console.log(`Hashing: ${progress.toFixed(1)}%`);
  });

  // Upload chunks
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = sliceFile(file, start, end);

    // Calculate chunk hash
    const chunkHash = await calculateChunkHash(chunk);

    // Upload chunk (mock)
    await uploadChunk(chunk, i, chunkHash);

    // Update progress
    uploadedBytes += chunk.size;
    const elapsedMs = Date.now() - startTime;
    const speed = calculateSpeed(uploadedBytes, elapsedMs);
    const remainingBytes = file.size - uploadedBytes;
    const remainingTime = estimateRemainingTime(remainingBytes, speed);

    console.log(`Progress: ${((uploadedBytes / file.size) * 100).toFixed(1)}%`);
    console.log(`Speed: ${formatFileSize(speed)}/s`);
    console.log(`Remaining: ${Math.ceil(remainingTime)}s`);
  }

  // Wait for hash calculation to complete
  const fileHash = await hashPromise;
  console.log("File hash:", fileHash);
}
```

### Event System

The event system provides a type-safe event bus for managing upload lifecycle events using [mitt](https://github.com/developit/mitt).

#### Usage

```typescript
import { createEventBus } from "@chunkflow/shared";

// Create an event bus
const eventBus = createEventBus();

// Listen to events
eventBus.on("start", ({ taskId, file }) => {
  console.log(`Upload started for ${file.name}`);
});

eventBus.on("progress", ({ taskId, progress, speed }) => {
  console.log(`Upload progress: ${progress}% at ${speed} bytes/sec`);
});

eventBus.on("success", ({ taskId, fileUrl }) => {
  console.log(`Upload completed: ${fileUrl}`);
});

eventBus.on("error", ({ taskId, error }) => {
  console.error(`Upload failed:`, error);
});

// Emit events
const mockFile = new File(["content"], "test.txt", { type: "text/plain" });
eventBus.emit("start", { taskId: "task-1", file: mockFile });
eventBus.emit("progress", { taskId: "task-1", progress: 50, speed: 1024000 });
eventBus.emit("success", { taskId: "task-1", fileUrl: "https://example.com/file" });

// Remove listener
const handler = ({ taskId }) => console.log("Paused:", taskId);
eventBus.on("pause", handler);
eventBus.off("pause", handler);

// Listen to all events
eventBus.on("*", (type, payload) => {
  console.log("Event:", type, payload);
});

// Clear all listeners
eventBus.all.clear();
```

### Concurrency Control

The concurrency controller manages concurrent operations using [p-limit](https://github.com/sindresorhus/p-limit), which is essential for controlling the number of simultaneous chunk uploads.

#### Usage

```typescript
import { ConcurrencyController } from "@chunkflow/shared";

// Create a controller with a limit of 3 concurrent operations
const controller = new ConcurrencyController({ limit: 3 });

// Upload chunks with concurrency control
const chunks = [chunk1, chunk2, chunk3, chunk4, chunk5];

const results = await Promise.all(
  chunks.map((chunk, index) =>
    controller.run(async () => {
      // Upload the chunk
      const response = await uploadChunk(chunk, index);
      return response;
    }),
  ),
);

// Only 3 chunks will upload simultaneously
// The 4th and 5th will wait for earlier ones to complete
```

#### Dynamic Limit Adjustment

```typescript
// Start with 3 concurrent uploads
const controller = new ConcurrencyController({ limit: 3 });

// Increase concurrency for faster network
controller.updateLimit(5);

// Decrease concurrency for slower network
controller.updateLimit(1);

// Get current limit
console.log(controller.getLimit()); // 1
```

#### Monitoring Queue Status

```typescript
const controller = new ConcurrencyController({ limit: 2 });

// Start multiple operations
const promises = [
  controller.run(async () => await uploadChunk(1)),
  controller.run(async () => await uploadChunk(2)),
  controller.run(async () => await uploadChunk(3)),
  controller.run(async () => await uploadChunk(4)),
];

// Check queue status
console.log(controller.activeCount); // 2 (currently running)
console.log(controller.pendingCount); // 2 (waiting in queue)

await Promise.all(promises);

console.log(controller.activeCount); // 0 (all complete)
console.log(controller.pendingCount); // 0 (queue empty)
```

#### Clearing the Queue

```typescript
const controller = new ConcurrencyController({ limit: 2 });

// Start many operations
for (let i = 0; i < 10; i++) {
  controller.run(async () => await uploadChunk(i));
}

// Clear pending operations (doesn't affect active ones)
controller.clearQueue();
```

#### Real-World Example

```typescript
import { ConcurrencyController } from "@chunkflow/shared";

async function uploadFileInChunks(file: File, chunkSize: number) {
  // Create controller with 3 concurrent uploads
  const controller = new ConcurrencyController({ limit: 3 });

  // Split file into chunks
  const chunks = [];
  for (let i = 0; i < file.size; i += chunkSize) {
    chunks.push(file.slice(i, i + chunkSize));
  }

  // Upload all chunks with concurrency control
  const results = await Promise.all(
    chunks.map((chunk, index) =>
      controller.run(async () => {
        try {
          const response = await fetch("/api/upload/chunk", {
            method: "POST",
            body: chunk,
            headers: {
              "X-Chunk-Index": index.toString(),
              "X-Total-Chunks": chunks.length.toString(),
            },
          });

          if (!response.ok) {
            throw new Error(`Chunk ${index} upload failed`);
          }

          return { success: true, index };
        } catch (error) {
          console.error(`Failed to upload chunk ${index}:`, error);
          throw error;
        }
      }),
    ),
  );

  console.log(`Uploaded ${results.length} chunks successfully`);
  return results;
}
```

#### Event Types

The event bus supports the following events:

- **start**: Fired when upload starts
  - `taskId: string` - Unique task identifier
  - `file: File` - The file being uploaded

- **progress**: Fired when upload progress updates
  - `taskId: string` - Unique task identifier
  - `progress: number` - Upload progress percentage (0-100)
  - `speed: number` - Upload speed in bytes per second

- **chunkSuccess**: Fired when a chunk is successfully uploaded
  - `taskId: string` - Unique task identifier
  - `chunkIndex: number` - Index of the uploaded chunk

- **chunkError**: Fired when a chunk upload fails
  - `taskId: string` - Unique task identifier
  - `chunkIndex: number` - Index of the failed chunk
  - `error: Error` - The error that occurred

- **hashProgress**: Fired when hash calculation progress updates
  - `taskId: string` - Unique task identifier
  - `progress: number` - Hash calculation progress percentage (0-100)

- **hashComplete**: Fired when hash calculation completes
  - `taskId: string` - Unique task identifier
  - `hash: string` - The calculated hash value

- **success**: Fired when upload completes successfully
  - `taskId: string` - Unique task identifier
  - `fileUrl: string` - URL to access the uploaded file

- **error**: Fired when upload encounters an error
  - `taskId: string` - Unique task identifier
  - `error: Error` - The error that occurred

- **pause**: Fired when upload is paused
  - `taskId: string` - Unique task identifier

- **resume**: Fired when upload is resumed
  - `taskId: string` - Unique task identifier

- **cancel**: Fired when upload is cancelled
  - `taskId: string` - Unique task identifier

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type check
pnpm typecheck

# Build
pnpm build

# Clean build output
pnpm clean
```

## License

MIT
