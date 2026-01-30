# Getting Started

This guide will help you get started with ChunkFlow Upload SDK in just a few minutes.

## Prerequisites

- Node.js 18+ or Bun
- A package manager (pnpm, npm, or yarn)
- Basic knowledge of React or Vue (for framework integrations)

## Installation

Choose the packages you need based on your use case:

### For React Projects

::: code-group

```bash [pnpm]
pnpm add @chunkflow/core @chunkflow/upload-client-react @chunkflow/upload-component-react
```

```bash [npm]
npm install @chunkflow/core @chunkflow/upload-client-react @chunkflow/upload-component-react
```

```bash [yarn]
yarn add @chunkflow/core @chunkflow/upload-client-react @chunkflow/upload-component-react
```

:::

### For Vue Projects

::: code-group

```bash [pnpm]
pnpm add @chunkflow/core @chunkflow/upload-client-vue @chunkflow/upload-component-vue
```

```bash [npm]
npm install @chunkflow/core @chunkflow/upload-client-vue @chunkflow/upload-component-vue
```

```bash [yarn]
yarn add @chunkflow/core @chunkflow/upload-client-vue @chunkflow/upload-component-vue
```

:::

### For Vanilla JavaScript

::: code-group

```bash [pnpm]
pnpm add @chunkflow/core
```

```bash [npm]
npm install @chunkflow/core
```

```bash [yarn]
yarn add @chunkflow/core
```

:::

### For Server-Side

::: code-group

```bash [pnpm]
pnpm add @chunkflow/upload-server
```

```bash [npm]
npm install @chunkflow/upload-server
```

```bash [yarn]
yarn add @chunkflow/upload-server
```

:::

## Package Overview

ChunkFlow is organized into multiple packages:

| Package                             | Description                                        |
| ----------------------------------- | -------------------------------------------------- |
| `@chunkflow/protocol`               | TypeScript type definitions and interfaces         |
| `@chunkflow/shared`                 | Common utilities (events, concurrency, file utils) |
| `@chunkflow/core`                   | Core upload logic and state machine                |
| `@chunkflow/upload-client-react`    | React Hooks and Context                            |
| `@chunkflow/upload-client-vue`      | Vue Composables and Plugin                         |
| `@chunkflow/upload-component-react` | Ready-to-use React components                      |
| `@chunkflow/upload-component-vue`   | Ready-to-use Vue components                        |
| `@chunkflow/upload-server`          | Server-side SDK for Node.js                        |

## Quick Start with React

### 1. Create a Request Adapter

The request adapter handles communication with your server:

```typescript
import { createFetchAdapter } from "@chunkflow/core";

const adapter = createFetchAdapter({
  baseURL: "http://localhost:3000/api",
  headers: {
    Authorization: "Bearer your-token",
  },
});
```

### 2. Wrap Your App with UploadProvider

```tsx
import { UploadProvider } from "@chunkflow/upload-client-react";

function App() {
  return (
    <UploadProvider requestAdapter={adapter}>
      <YourComponents />
    </UploadProvider>
  );
}
```

### 3. Use Upload Components

```tsx
import { UploadButton, UploadList } from "@chunkflow/upload-component-react";

function UploadPage() {
  return (
    <div>
      <h1>Upload Files</h1>
      <UploadButton accept="image/*,video/*" maxSize={100 * 1024 * 1024} multiple>
        Select Files
      </UploadButton>
      <UploadList />
    </div>
  );
}
```

### 4. Or Use Hooks for Custom UI

```tsx
import { useUpload } from "@chunkflow/upload-client-react";

function CustomUpload() {
  const { upload, status, progress, pause, resume, cancel } = useUpload({
    onSuccess: (fileUrl) => {
      console.log("Upload complete:", fileUrl);
    },
    onError: (error) => {
      console.error("Upload failed:", error);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      upload(file);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileSelect} />
      {status === "uploading" && (
        <div>
          <p>Progress: {progress.percentage.toFixed(1)}%</p>
          <p>Speed: {formatSpeed(progress.speed)}</p>
          <button onClick={pause}>Pause</button>
          <button onClick={cancel}>Cancel</button>
        </div>
      )}
      {status === "paused" && <button onClick={resume}>Resume</button>}
    </div>
  );
}
```

## Quick Start with Vue

### 1. Install the Plugin

```typescript
import { createApp } from "vue";
import { UploadPlugin } from "@chunkflow/upload-client-vue";
import { createFetchAdapter } from "@chunkflow/core";
import App from "./App.vue";

const adapter = createFetchAdapter({
  baseURL: "http://localhost:3000/api",
});

const app = createApp(App);
app.use(UploadPlugin, { requestAdapter: adapter });
app.mount("#app");
```

### 2. Use Upload Components

```vue
<script setup>
import { UploadButton, UploadList } from "@chunkflow/upload-component-vue";
</script>

<template>
  <div>
    <h1>Upload Files</h1>
    <UploadButton accept="image/*,video/*" :max-size="100 * 1024 * 1024" multiple>
      Select Files
    </UploadButton>
    <UploadList />
  </div>
</template>
```

### 3. Or Use Composables for Custom UI

```vue
<script setup>
import { useUpload } from '@chunkflow/upload-client-vue';
import { ref } from 'vue';

const { upload, status, progress, pause, resume, cancel } = useUpload({
  onSuccess: (fileUrl) => {
    console.log('Upload complete:', fileUrl);
  },
  onError: (error) => {
    console.error('Upload failed:', error);
  },
});

const handleFileSelect = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    upload(file);
  }
};
</script>

<template>
  <div>
    <input type="file" @change="handleFileSelect" />
    <div v-if="status === 'uploading'">
      <p>Progress: {{ progress.percentage.toFixed(1) }}%</p>
      <p>Speed: {{ formatSpeed(progress.speed) }}</p>
      <button @click="pause">Pause</button>
      <button @click="cancel">Cancel</button>
    </div>
    <button v-if="status === 'paused'" @click="resume">Resume</button>
  </div>
</template>
```

## Quick Start with Vanilla JavaScript

```typescript
import { UploadManager, createFetchAdapter } from "@chunkflow/core";

const adapter = createFetchAdapter({
  baseURL: "http://localhost:3000/api",
});

const manager = new UploadManager({
  requestAdapter: adapter,
});

await manager.init();

// Create and start an upload task
const file = document.querySelector('input[type="file"]').files[0];
const task = manager.createTask(file);

task.on("progress", ({ progress, speed }) => {
  console.log(`Progress: ${progress}%, Speed: ${speed} bytes/s`);
});

task.on("success", ({ fileUrl }) => {
  console.log("Upload complete:", fileUrl);
});

task.on("error", ({ error }) => {
  console.error("Upload failed:", error);
});

await task.start();
```

## Server Setup

To use ChunkFlow, you need a server that implements the upload protocol. You can either:

1. **Use the provided Nest.js server** (recommended for quick start)
2. **Implement the protocol yourself** using `@chunkflow/upload-server`

See the [Server Configuration](/guide/server-config) guide for detailed instructions.

## Next Steps

- Learn about the [Architecture](/guide/architecture)
- Understand [Upload Strategies](/guide/upload-strategies)
- Explore [Configuration Options](/guide/client-config)
- Check out [Examples](/examples/react)
