# Component Vue API

Ready-to-use Vue components for file uploads.

## UploadButton

File selection button.

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
    Select Files
  </UploadButton>
</template>
```

### Props

- `accept?: string` - File types to accept
- `multiple?: boolean` - Allow multiple files
- `maxSize?: number` - Maximum file size in bytes
- `@select` - File selection event

## UploadProgress

Progress bar component.

```vue
<script setup>
import { UploadProgress } from "@chunkflow/upload-component-vue";
</script>

<template>
  <UploadProgress :task="task" show-speed show-remaining-time />
</template>
```

### Props

- `task: UploadTask` - Upload task
- `showSpeed?: boolean` - Show upload speed
- `showRemainingTime?: boolean` - Show remaining time

## UploadList

Task list component.

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

Drag and drop zone.

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
    <p>Drag files here or click to select</p>
  </UploadDropzone>
</template>
```

## See Also

- [Client Vue API](/api/client-vue)
- [Examples](/examples/vue)
