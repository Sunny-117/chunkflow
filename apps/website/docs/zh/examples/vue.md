# Vue 示例

使用 ChunkFlow 与 Vue 的完整示例。

## 基础上传

```vue
<script setup>
import { UploadButton, UploadList } from "@chunkflow/upload-component-vue";
</script>

<template>
  <div class="container">
    <h1>上传文件</h1>
    <UploadButton accept="*" multiple> 选择文件 </UploadButton>
    <UploadList />
  </div>
</template>
```

## 自定义上传 UI

```vue
<script setup>
import { useUpload } from '@chunkflow/upload-client-vue';
import { ref } from 'vue';

const file = ref<File | null>(null);
const { upload, status, progress, pause, resume, cancel, error } = useUpload({
  onSuccess: (fileUrl) => {
    alert(`上传完成: ${fileUrl}`);
  },
  onError: (err) => {
    console.error('上传失败:', err);
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
  if (seconds < 60) return `${Math.round(seconds)}秒`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}分钟`;
  return `${Math.round(seconds / 3600)}小时`;
};
</script>

<template>
  <div>
    <input type="file" @change="handleFileChange" />

    <div v-if="file">
      <h3>{{ file.name }}</h3>
      <p>状态: {{ status }}</p>

      <div v-if="status === 'uploading'">
        <progress :value="progress.percentage" max="100" />
        <p>{{ progress.percentage.toFixed(1) }}%</p>
        <p>速度: {{ formatSpeed(progress.speed) }}</p>
        <p>预计剩余时间: {{ formatTime(progress.remainingTime) }}</p>
        <button @click="pause">暂停</button>
        <button @click="cancel">取消</button>
      </div>

      <button v-if="status === 'paused'" @click="resume">恢复</button>

      <p v-if="status === 'error'" style="color: red">错误: {{ error?.message }}</p>

      <p v-if="status === 'success'" style="color: green">上传完成！</p>
    </div>
  </div>
</template>
```

## 多文件上传

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
      <button @click="pauseAll">全部暂停</button>
      <button @click="resumeAll">全部恢复</button>
      <button @click="cancelAll">全部取消</button>
    </div>

    <div>
      <div
        v-for="task in tasks"
        :key="task.id"
        style="border: 1px solid #ccc; padding: 10px; margin: 10px 0"
      >
        <h4>{{ task.file.name }}</h4>
        <p>状态: {{ task.getStatus() }}</p>
        <progress :value="task.getProgress().percentage" max="100" />
        <p>{{ task.getProgress().percentage.toFixed(1) }}%</p>
        <button @click="task.pause()">暂停</button>
        <button @click="task.resume()">恢复</button>
        <button @click="removeTask(task.id)">移除</button>
      </div>
    </div>
  </div>
</template>
```

## 拖放上传

```vue
<script setup>
import { UploadDropzone } from "@chunkflow/upload-component-vue";
import { useUploadList } from "@chunkflow/upload-client-vue";

const { uploadFiles } = useUploadList();
</script>

<template>
  <UploadDropzone accept="image/*,video/*" :max-size="100 * 1024 * 1024" @drop="uploadFiles">
    <div style="padding: 40px; text-align: center; border: 2px dashed #ccc">
      <p>拖放文件到这里</p>
      <p>或点击选择文件</p>
    </div>
  </UploadDropzone>
</template>
```

## 另请参阅

- [Client Vue API](/zh/api/client-vue)
- [Component Vue API](/zh/api/component-vue)
- [React 示例](/zh/examples/react)
