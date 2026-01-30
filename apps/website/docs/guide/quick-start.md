# Quick Start

Get up and running with ChunkFlow in under 5 minutes.

## React Quick Start

### Step 1: Install

```bash
pnpm add @chunkflow/core @chunkflow/upload-client-react @chunkflow/upload-component-react
```

### Step 2: Create Adapter

```typescript
// src/lib/upload.ts
import { createFetchAdapter } from "@chunkflow/core";

export const uploadAdapter = createFetchAdapter({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
});
```

### Step 3: Setup Provider

```tsx
// src/App.tsx
import { UploadProvider } from "@chunkflow/upload-client-react";
import { uploadAdapter } from "./lib/upload";
import { UploadPage } from "./pages/UploadPage";

export default function App() {
  return (
    <UploadProvider requestAdapter={uploadAdapter}>
      <UploadPage />
    </UploadProvider>
  );
}
```

### Step 4: Use Components

```tsx
// src/pages/UploadPage.tsx
import { UploadButton, UploadList } from "@chunkflow/upload-component-react";

export function UploadPage() {
  return (
    <div className="container">
      <h1>Upload Files</h1>
      <UploadButton
        accept="image/*,video/*,application/pdf"
        maxSize={500 * 1024 * 1024} // 500MB
        multiple
      >
        📁 Select Files
      </UploadButton>
      <UploadList />
    </div>
  );
}
```

That's it! You now have a fully functional upload interface with:

- ✅ Chunked upload for large files
- ✅ Resumable upload
- ✅ Instant upload (deduplication)
- ✅ Progress tracking
- ✅ Pause/resume/cancel controls

## Vue Quick Start

### Step 1: Install

```bash
pnpm add @chunkflow/core @chunkflow/upload-client-vue @chunkflow/upload-component-vue
```

### Step 2: Setup Plugin

```typescript
// src/main.ts
import { createApp } from "vue";
import { UploadPlugin } from "@chunkflow/upload-client-vue";
import { createFetchAdapter } from "@chunkflow/core";
import App from "./App.vue";

const adapter = createFetchAdapter({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
});

const app = createApp(App);
app.use(UploadPlugin, { requestAdapter: adapter });
app.mount("#app");
```

### Step 3: Use Components

```vue
<!-- src/pages/UploadPage.vue -->
<script setup>
import { UploadButton, UploadList } from "@chunkflow/upload-component-vue";
</script>

<template>
  <div class="container">
    <h1>Upload Files</h1>
    <UploadButton accept="image/*,video/*,application/pdf" :max-size="500 * 1024 * 1024" multiple>
      📁 Select Files
    </UploadButton>
    <UploadList />
  </div>
</template>
```

## Vanilla JavaScript Quick Start

### Step 1: Install

```bash
pnpm add @chunkflow/core
```

### Step 2: Create Manager

```typescript
import { UploadManager, createFetchAdapter } from "@chunkflow/core";

const adapter = createFetchAdapter({
  baseURL: "http://localhost:3000/api",
});

const manager = new UploadManager({
  requestAdapter: adapter,
  defaultChunkSize: 1024 * 1024, // 1MB
  defaultConcurrency: 3,
});

await manager.init();
```

### Step 3: Handle File Upload

```typescript
const fileInput = document.querySelector("#file-input");
const progressBar = document.querySelector("#progress");
const statusText = document.querySelector("#status");

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const task = manager.createTask(file);

  task.on("progress", ({ progress, speed }) => {
    progressBar.value = progress.percentage;
    statusText.textContent = `${progress.percentage.toFixed(1)}% - ${formatSpeed(speed)}`;
  });

  task.on("success", ({ fileUrl }) => {
    statusText.textContent = "Upload complete!";
    console.log("File URL:", fileUrl);
  });

  task.on("error", ({ error }) => {
    statusText.textContent = `Error: ${error.message}`;
  });

  await task.start();
});

function formatSpeed(bytesPerSecond) {
  const units = ["B/s", "KB/s", "MB/s", "GB/s"];
  let speed = bytesPerSecond;
  let unitIndex = 0;

  while (speed >= 1024 && unitIndex < units.length - 1) {
    speed /= 1024;
    unitIndex++;
  }

  return `${speed.toFixed(2)} ${units[unitIndex]}`;
}
```

### Step 4: HTML

```html
<!DOCTYPE html>
<html>
  <head>
    <title>ChunkFlow Upload</title>
  </head>
  <body>
    <h1>Upload File</h1>
    <input type="file" id="file-input" />
    <progress id="progress" value="0" max="100"></progress>
    <p id="status">Select a file to upload</p>

    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

## Server Quick Start

### Option 1: Use the Demo Server

Clone and run the demo server:

```bash
git clone https://github.com/Sunny-117/chunkflow.git
cd chunkflow/apps/server
pnpm install
docker-compose up -d  # Start PostgreSQL
pnpm run start:dev
```

The server will be available at `http://localhost:3000`.

### Option 2: Implement Your Own

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

// Use with your framework (Express, Fastify, Nest.js, etc.)
```

See the [Server Configuration](/guide/server-config) guide for detailed instructions.

## Configuration

### Client Configuration

```typescript
const manager = new UploadManager({
  requestAdapter: adapter,
  maxConcurrentTasks: 3, // Max parallel uploads
  defaultChunkSize: 1024 * 1024, // 1MB chunks
  defaultConcurrency: 3, // 3 chunks at a time
  autoResumeUnfinished: true, // Auto-resume on page load
});
```

### Task Configuration

```typescript
const task = manager.createTask(file, {
  chunkSize: 2 * 1024 * 1024, // 2MB chunks
  concurrency: 5, // 5 chunks at a time
  retryCount: 3, // Retry 3 times on failure
  retryDelay: 1000, // 1 second between retries
  autoStart: true, // Start immediately
});
```

## Testing Your Setup

### 1. Test Small File Upload

Upload a file < 5MB to test direct upload:

```typescript
const smallFile = new File(["Hello World"], "test.txt", { type: "text/plain" });
const task = manager.createTask(smallFile);
await task.start();
```

### 2. Test Large File Upload

Upload a file ≥ 5MB to test chunked upload:

```typescript
// Create a 10MB test file
const largeFile = new File([new ArrayBuffer(10 * 1024 * 1024)], "large.bin");
const task = manager.createTask(largeFile);
await task.start();
```

### 3. Test Pause/Resume

```typescript
const task = manager.createTask(file);
await task.start();

// Pause after 2 seconds
setTimeout(() => task.pause(), 2000);

// Resume after 5 seconds
setTimeout(() => task.resume(), 5000);
```

### 4. Test Instant Upload

Upload the same file twice to test deduplication:

```typescript
const file = new File(["Same content"], "test.txt");

// First upload
const task1 = manager.createTask(file);
await task1.start();

// Second upload (should be instant)
const task2 = manager.createTask(file);
await task2.start(); // Should complete immediately
```

## Common Issues

### CORS Errors

If you see CORS errors, configure your server:

```typescript
// Express
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

// Fastify
app.register(fastifyCors, {
  origin: "http://localhost:5173",
  credentials: true,
});
```

### Network Errors

Check that your server is running and accessible:

```bash
curl http://localhost:3000/api/health
```

### IndexedDB Errors

If IndexedDB is unavailable (e.g., in private browsing), ChunkFlow will gracefully degrade and disable resumable upload.

## Next Steps

- Learn about [Upload Strategies](/guide/upload-strategies)
- Explore [Configuration Options](/guide/client-config)
- Check out [Complete Examples](/examples/react)
- Read about [Best Practices](/guide/performance)
