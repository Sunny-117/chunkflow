# Component Vue API

开箱即用的 Vue 文件上传组件。

## UploadButton

文件选择按钮。

```vue
<script setup>
import { UploadButton } from "@chunkflow/upload-component-vue";
</script>

<template>
  <UploadButton
    accept="image/*,video/*"
    :max-size="100 * 1024 * 1024"
    multiple
    @select="(files) => console.log(files)"
  >
    选择文件
  </UploadButton>
</template>
```

### Props

- `accept?: string` - 接受的文件类型
- `multiple?: boolean` - 允许多个文件
- `maxSize?: number` - 最大文件大小（字节）
- `@select` - 文件选择事件

## UploadProgress

进度条组件。

```vue
<script setup>
import { UploadProgress } from "@chunkflow/upload-component-vue";
</script>

<template>
  <UploadProgress :task="task" show-speed show-remaining-time />
</template>
```

### Props

- `task: UploadTask` - 上传任务
- `showSpeed?: boolean` - 显示上传速度
- `showRemainingTime?: boolean` - 显示剩余时间

## UploadList

任务列表组件。

```vue
<script setup>
import { UploadList } from "@chunkflow/upload-component-vue";
</script>

<template>
  <UploadList>
    <template #item="{ task }">
      <CustomItem :task="task" />
    </template>
  </UploadList>
</template>
```

## UploadDropzone

拖放区域。

```vue
<script setup>
import { UploadDropzone } from "@chunkflow/upload-component-vue";
</script>

<template>
  <UploadDropzone
    accept="image/*"
    :max-size="50 * 1024 * 1024"
    @drop="(files) => console.log(files)"
  >
    <p>拖放文件到这里或点击选择</p>
  </UploadDropzone>
</template>
```

## 另请参阅

- [Client Vue API](/zh/api/client-vue)
- [示例](/zh/examples/vue)
