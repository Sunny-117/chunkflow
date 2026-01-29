# @chunkflow/upload-client-vue

Vue adapter for ChunkFlow Upload SDK with composables and plugin.

## Installation

```bash
npm install @chunkflow/upload-client-vue
# or
pnpm add @chunkflow/upload-client-vue
# or
yarn add @chunkflow/upload-client-vue
```

## Usage

### 1. Install the Plugin

First, install the Upload Plugin in your Vue application:

```typescript
// main.ts
import { createApp } from "vue";
import { createUploadPlugin } from "@chunkflow/upload-client-vue";
import App from "./App.vue";

// Create your request adapter
const requestAdapter = {
  createFile: async (request) => {
    // Implement your API call
  },
  verifyHash: async (request) => {
    // Implement your API call
  },
  uploadChunk: async (request) => {
    // Implement your API call
  },
  mergeFile: async (request) => {
    // Implement your API call
  },
};

const app = createApp(App);

// Install the upload plugin
const uploadPlugin = createUploadPlugin({
  requestAdapter,
  managerOptions: {
    maxConcurrentTasks: 5,
    defaultChunkSize: 2 * 1024 * 1024, // 2MB
    defaultConcurrency: 3,
  },
});

app.use(uploadPlugin);
app.mount("#app");
```

### 2. Use the Composables

#### Single File Upload with `useUpload`

```vue
<script setup lang="ts">
import { useUpload } from "@chunkflow/upload-client-vue";

const { upload, pause, resume, cancel, status, progress, error } = useUpload({
  onSuccess: (fileUrl) => {
    console.log("Upload complete:", fileUrl);
  },
  onError: (error) => {
    console.error("Upload failed:", error);
  },
  onProgress: (progress) => {
    console.log(`Progress: ${progress.percentage}%`);
  },
});

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
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
      <p>Speed: {{ (progress.speed / 1024 / 1024).toFixed(2) }} MB/s</p>
      <p>Remaining: {{ Math.ceil(progress.remainingTime) }}s</p>
      <button @click="pause">Pause</button>
      <button @click="cancel">Cancel</button>
    </div>

    <button v-if="status === 'paused'" @click="resume">Resume</button>
    <p v-if="status === 'success'">Upload complete!</p>
    <p v-if="status === 'error'">Error: {{ error?.message }}</p>
  </div>
</template>
```

#### Multiple File Upload with `useUploadList`

```vue
<script setup lang="ts">
import { useUploadList } from "@chunkflow/upload-client-vue";

const {
  tasks,
  uploadFiles,
  pauseAll,
  resumeAll,
  cancelAll,
  removeTask,
  clearCompleted,
  getStatistics,
} = useUploadList();

const handleFilesSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  uploadFiles(files);
};

const stats = getStatistics();
</script>

<template>
  <div>
    <input type="file" multiple @change="handleFilesSelect" />

    <div>
      <button @click="pauseAll">Pause All</button>
      <button @click="resumeAll">Resume All</button>
      <button @click="cancelAll">Cancel All</button>
      <button @click="clearCompleted">Clear Completed</button>
    </div>

    <p>
      Total: {{ stats.total }} | Uploading: {{ stats.uploading }} | Success: {{ stats.success }} |
      Error: {{ stats.error }}
    </p>

    <ul>
      <li v-for="task in tasks" :key="task.id">
        <span>{{ task.file.name }}</span>
        <span>{{ task.getStatus() }}</span>
        <span>{{ task.getProgress().percentage.toFixed(1) }}%</span>
        <button @click="removeTask(task.id)">Remove</button>
      </li>
    </ul>
  </div>
</template>
```

## API

### `createUploadPlugin(options)`

Creates a Vue plugin for the Upload SDK.

**Options:**

- `requestAdapter` (required): Implementation of the RequestAdapter interface
- `managerOptions` (optional): Configuration for the UploadManager
  - `maxConcurrentTasks`: Maximum number of concurrent upload tasks (default: 3)
  - `defaultChunkSize`: Default chunk size in bytes (default: 1MB)
  - `defaultConcurrency`: Default number of concurrent chunk uploads per task (default: 3)
  - `autoResumeUnfinished`: Automatically resume unfinished uploads on init (default: true)

### `useUpload(options)`

Composable for uploading a single file.

**Options:**

- `chunkSize`: Chunk size in bytes
- `concurrency`: Number of concurrent chunk uploads
- `retryCount`: Number of retry attempts for failed chunks
- `retryDelay`: Delay between retries in milliseconds
- `onSuccess`: Callback when upload succeeds
- `onError`: Callback when upload fails
- `onProgress`: Callback on progress updates
- `onStart`: Callback when upload starts
- `onPause`: Callback when upload is paused
- `onResume`: Callback when upload is resumed
- `onCancel`: Callback when upload is cancelled

**Returns:**

- `upload(file)`: Function to start uploading a file
- `pause()`: Function to pause the upload
- `resume()`: Function to resume the upload
- `cancel()`: Function to cancel the upload
- `status`: Reactive ref with current upload status
- `progress`: Reactive ref with current upload progress
- `error`: Reactive ref with error if upload failed
- `task`: Reactive ref with the current upload task

### `useUploadList()`

Composable for managing multiple file uploads.

**Returns:**

- `tasks`: Reactive ref with array of all upload tasks
- `uploadFiles(files)`: Function to upload multiple files
- `pauseAll()`: Function to pause all uploads
- `resumeAll()`: Function to resume all uploads
- `cancelAll()`: Function to cancel all uploads
- `removeTask(taskId)`: Function to remove a specific task
- `clearCompleted()`: Function to clear all completed tasks
- `getStatistics()`: Function to get task statistics

### `useUploadManager()`

Composable for accessing the UploadManager instance directly.

**Returns:**

- `manager`: The UploadManager instance

## License

MIT
