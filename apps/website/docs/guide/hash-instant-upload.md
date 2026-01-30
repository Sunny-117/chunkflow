# Hash & Instant Upload

ChunkFlow uses content-based hashing to enable instant uploads through deduplication.

## How It Works

### 1. Hash Calculation

When a file is selected, ChunkFlow calculates its MD5 hash:

```typescript
const file = new File(["content"], "file.txt");
const task = manager.createTask(file);

task.on("hashProgress", ({ progress }) => {
  console.log(`Hash calculation: ${progress}%`);
});

task.on("hashComplete", ({ hash }) => {
  console.log(`File hash: ${hash}`);
});

await task.start();
```

### 2. Hash Verification

The hash is sent to the server to check if the file already exists:

```typescript
// Server checks if file with this hash exists
const response = await adapter.verifyHash({
  fileHash: "abc123...",
  uploadToken: token,
});

if (response.fileExists) {
  // File already exists - instant upload!
  console.log("File URL:", response.fileUrl);
}
```

### 3. Parallel Processing

Hash calculation and upload happen simultaneously:

```
File selected
     ↓
┌────────────────┬────────────────┐
│                │                │
│  Calculate     │  Upload        │
│  Hash          │  Chunks        │
│  (background)  │  (immediate)   │
│                │                │
└────────────────┴────────────────┘
     ↓                    ↓
Hash complete      Chunks uploading
     ↓                    ↓
Check if exists    Continue or cancel
```

## Full Instant Upload

When the entire file already exists:

```typescript
// First user uploads file
const user1File = new File(["content"], "document.pdf");
await manager.createTask(user1File).start();
// Takes time to upload

// Second user uploads same file
const user2File = new File(["content"], "document.pdf");
await manager.createTask(user2File).start();
// Completes instantly!
```

**Benefits**:

- Zero upload time
- Saves bandwidth
- Reduces server storage
- Better user experience

## Partial Instant Upload

When some chunks already exist:

```typescript
// File A: chunks [1, 2, 3, 4, 5]
await manager.createTask(fileA).start();

// File B: chunks [1, 2, 6, 7, 8]
// Only uploads chunks [6, 7, 8]
await manager.createTask(fileB).start();
```

**Benefits**:

- Faster uploads
- Chunk-level deduplication
- Efficient storage
- Reduced network usage

## Configuration

### Enable/Disable Hash Calculation

```typescript
const task = manager.createTask(file, {
  enableHash: true, // Default: true
});
```

### Hash Algorithm

ChunkFlow uses MD5 by default (fast and sufficient for deduplication):

```typescript
import { calculateFileHash } from "@chunkflow/shared";

const hash = await calculateFileHash(file);
console.log(hash); // MD5 hash
```

## Performance

### Web Worker

Hash calculation runs in a Web Worker to avoid blocking the main thread:

```typescript
// Automatically uses Web Worker if available
const hash = await calculateFileHash(file, (progress) => {
  console.log(`Progress: ${progress}%`);
});
```

### Fallback

If Web Workers are unavailable, falls back to `requestIdleCallback`:

```typescript
// Uses requestIdleCallback in main thread
const hash = await calculateFileHash(file);
```

## Best Practices

### 1. Always Enable Hash

Keep hash calculation enabled for best user experience:

```typescript
// Good
const task = manager.createTask(file);

// Avoid disabling unless necessary
const task = manager.createTask(file, {
  enableHash: false, // Only if you have a specific reason
});
```

### 2. Show Hash Progress

Inform users about hash calculation:

```typescript
task.on("hashProgress", ({ progress }) => {
  updateUI(`Preparing upload: ${progress}%`);
});

task.on("hashComplete", () => {
  updateUI("Upload starting...");
});
```

### 3. Handle Instant Upload

Provide feedback for instant uploads:

```typescript
task.on("success", ({ fileUrl }) => {
  const wasInstant = task.getProgress().uploadedBytes === 0;

  if (wasInstant) {
    showMessage("File already exists - instant upload!");
  } else {
    showMessage("Upload complete!");
  }
});
```

## See Also

- [Upload Strategies](/guide/upload-strategies)
- [Performance Optimization](/guide/performance)
- [API Reference](/api/shared)
