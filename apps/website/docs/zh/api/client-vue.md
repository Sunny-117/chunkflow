# Client Vue API

用于 ChunkFlow 集成的 Vue Composables 和 Plugin。

## UploadPlugin

上传功能的 Vue 插件。

```typescript
import { createApp } from "vue";
import { UploadPlugin } from "@chunkflow/upload-client-vue";

const app = createApp(App);
app.use(UploadPlugin, { requestAdapter: adapter });
```

## useUpload

单文件上传的 Composable。

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
    <p>状态: {{ status }}</p>
    <p>进度: {{ progress.percentage }}%</p>
  </div>
</template>
```

## useUploadList

多文件上传的 Composable。

```vue
<script setup>
import { useUploadList } from "@chunkflow/upload-client-vue";

const { tasks, uploadFiles, pauseAll, resumeAll, cancelAll } = useUploadList();
</script>

<template>
  <div>
    <input type="file" multiple @change="(e) => uploadFiles(Array.from(e.target.files))" />
    <button @click="pauseAll">全部暂停</button>
    <button @click="resumeAll">全部恢复</button>
    <div v-for="task in tasks" :key="task.id">
      {{ task.file.name }}
    </div>
  </div>
</template>
```

## 另请参阅

- [Component Vue API](/zh/api/component-vue)
- [Core API](/zh/api/core)
- [示例](/zh/examples/vue)
