# Vue Examples

Complete examples for using ChunkFlow with Vue.

## Basic Upload

```vue
<script setup>
import { UploadButton, UploadList } from "@chunkflow/upload-component-vue";
</script>

<template>
  <div class="container">
    <h1>Upload Files</h1>
    <UploadButton accept="*" multiple> Select Files </UploadButton>
    <UploadList />
  </div>
</template>
```

## Custom Upload UI

```vue
<script setup>
import { useUpload } from '@chunkflow/upload-client-vue';
import { ref } from 'vue';

const file = ref<File | null>(null);
const { upload, status, progress, pause, resume, cancel, error } = useUpload({
  onSuccess: (fileUrl) => {
    alert(`Upload complete: ${fileUrl}`);
  },
  onError: (err) => {
    console.error('Upload failed:', err);
  },
});

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const selectedFile = target.files?.[0];
  if (selectedFile) {
    file.value = selectedFile;
    upload(selectedFile);
  }
};

const formatSpeed = (bytesPerSecond: number): string => {
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  let speed = bytesPerSecond;
  let unitIndex = 0;

  while (speed >= 1024 && unitIndex < units.length - 1) {
    speed /= 1024;
    unitIndex++;
  }

  return `${speed.toFixed(2)} ${units[unitIndex]}`;
};

const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
};
</script>

<template>
  <div>
    <input type="file" @change="handleFileChange" />

    <div v-if="file">
      <h3>{{ file.name }}</h3>
      <p>Status: {{ status }}</p>

      <div v-if="status === 'uploading'">
        <progress :value="progress.percentage" max="100" />
        <p>{{ progress.percentage.toFixed(1) }}%</p>
        <p>Speed: {{ formatSpeed(progress.speed) }}</p>
        <p>ETA: {{ formatTime(progress.remainingTime) }}</p>
        <button @click="pause">Pause</button>
        <button @click="cancel">Cancel</button>
      </div>

      <button v-if="status === 'paused'" @click="resume">Resume</button>

      <p v-if="status === 'error'" style="color: red">Error: {{ error?.message }}</p>

      <p v-if="status === 'success'" style="color: green">Upload complete!</p>
    </div>
  </div>
</template>
```

## Multiple File Upload

```vue
<script setup>
import { useUploadList } from '@chunkflow/upload-client-vue';

const { tasks, uploadFiles, pauseAll, resumeAll, cancelAll, removeTask } = useUploadList();

const handleFilesChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const files = Array.from(target.files || []);
  uploadFiles(files);
};
</script>

<template>
  <div>
    <input type="file" multiple @change="handleFilesChange" />

    <div>
      <button @click="pauseAll">Pause All</button>
      <button @click="resumeAll">Resume All</button>
      <button @click="cancelAll">Cancel All</button>
    </div>

    <div>
      <div
        v-for="task in tasks"
        :key="task.id"
        style="border: 1px solid #ccc; padding: 10px; margin: 10px 0"
      >
        <h4>{{ task.file.name }}</h4>
        <p>Status: {{ task.getStatus() }}</p>
        <progress :value="task.getProgress().percentage" max="100" />
        <p>{{ task.getProgress().percentage.toFixed(1) }}%</p>
        <button @click="task.pause()">Pause</button>
        <button @click="task.resume()">Resume</button>
        <button @click="removeTask(task.id)">Remove</button>
      </div>
    </div>
  </div>
</template>
```

## With Drag and Drop

```vue
<script setup>
import { UploadDropzone } from "@chunkflow/upload-component-vue";
import { useUploadList } from "@chunkflow/upload-client-vue";

const { uploadFiles } = useUploadList();
</script>

<template>
  <UploadDropzone accept="image/*,video/*" :max-size="100 * 1024 * 1024" @drop="uploadFiles">
    <div style="padding: 40px; text-align: center; border: 2px dashed #ccc">
      <p>Drag and drop files here</p>
      <p>or click to select files</p>
    </div>
  </UploadDropzone>
</template>
```

## See Also

- [Client Vue API](/api/client-vue)
- [Component Vue API](/api/component-vue)
- [React Examples](/examples/react)
