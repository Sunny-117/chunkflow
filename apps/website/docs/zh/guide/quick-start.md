# 快速上手

在 5 分钟内开始使用 ChunkFlow。

## React 快速上手

### 步骤 1：安装

```bash
pnpm add @chunkflow/core @chunkflow/upload-client-react @chunkflow/upload-component-react
```

### 步骤 2：创建适配器

```typescript
// src/lib/upload.ts
import { createFetchAdapter } from '@chunkflow/core';

export const uploadAdapter = createFetchAdapter({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});
```

### 步骤 3：设置 Provider

```tsx
// src/App.tsx
import { UploadProvider } from '@chunkflow/upload-client-react';
import { uploadAdapter } from './lib/upload';
import { UploadPage } from './pages/UploadPage';

export default function App() {
  return (
    <UploadProvider requestAdapter={uploadAdapter}>
      <UploadPage />
    </UploadProvider>
  );
}
```

### 步骤 4：使用组件

```tsx
// src/pages/UploadPage.tsx
import { UploadButton, UploadList } from '@chunkflow/upload-component-react';

export function UploadPage() {
  return (
    <div className="container">
      <h1>上传文件</h1>
      <UploadButton 
        accept="image/*,video/*,application/pdf"
        maxSize={500 * 1024 * 1024} // 500MB
        multiple
      >
        📁 选择文件
      </UploadButton>
      <UploadList />
    </div>
  );
}
```

完成！你现在拥有一个功能齐全的上传界面。

## Vue 快速上手

### 步骤 1：安装

```bash
pnpm add @chunkflow/core @chunkflow/upload-client-vue @chunkflow/upload-component-vue
```

### 步骤 2：设置插件

```typescript
// src/main.ts
import { createApp } from 'vue';
import { UploadPlugin } from '@chunkflow/upload-client-vue';
import { createFetchAdapter } from '@chunkflow/core';
import App from './App.vue';

const adapter = createFetchAdapter({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

const app = createApp(App);
app.use(UploadPlugin, { requestAdapter: adapter });
app.mount('#app');
```

### 步骤 3：使用组件

```vue
<!-- src/pages/UploadPage.vue -->
<script setup>
import { UploadButton, UploadList } from '@chunkflow/upload-component-vue';
</script>

<template>
  <div class="container">
    <h1>上传文件</h1>
    <UploadButton 
      accept="image/*,video/*,application/pdf"
      :max-size="500 * 1024 * 1024"
      multiple
    >
      📁 选择文件
    </UploadButton>
    <UploadList />
  </div>
</template>
```

## 下一步

- 了解[上传策略](/zh/guide/upload-strategies)
- 探索[配置选项](/zh/guide/client-config)
- 查看[完整示例](/zh/examples/react)
