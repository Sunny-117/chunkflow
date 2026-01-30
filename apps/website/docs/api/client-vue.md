# Client Vue API

Vue Composables and Plugin for ChunkFlow integration.

## UploadPlugin

Vue plugin for upload functionality.

```typescript
import { createApp } from "vue";
import { UploadPlugin } from "@chunkflow/upload-client-vue";

const app = createApp(App);
app.use(UploadPlugin, { requestAdapter: adapter });
```

## useUpload

Composable for single file upload.

```vue
<script setup>
import { useUpload } from "@chunkflow/upload-client-vue";

const { upload, status, progress, pause, resume, cancel } = useUpload({
  onSuccess: (fileUrl) => console.log(fileUrl),
  onError: (error) => console.error(error),
});
</script>

<template>
  <div>
    <input type="file" @change="(e) => upload(e.target.files[0])" />
    <p>Status: {{ status }}</p>
    <p>Progress: {{ progress.percentage }}%</p>
  </div>
</template>
```

## useUploadList

Composable for multiple file uploads.

```vue
<script setup>
import { useUploadList } from "@chunkflow/upload-client-vue";

const { tasks, uploadFiles, pauseAll, resumeAll, cancelAll } = useUploadList();
</script>

<template>
  <div>
    <input type="file" multiple @change="(e) => uploadFiles(Array.from(e.target.files))" />
    <button @click="pauseAll">Pause All</button>
    <button @click="resumeAll">Resume All</button>
    <div v-for="task in tasks" :key="task.id">
      {{ task.file.name }}
    </div>
  </div>
</template>
```

## See Also

- [Component Vue API](/api/component-vue)
- [Core API](/api/core)
- [Examples](/examples/vue)
