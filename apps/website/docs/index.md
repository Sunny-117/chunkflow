---
layout: home

hero:
  name: "ChunkFlow"
  text: "Upload SDK"
  tagline: A universal large file upload solution with chunked upload, resumable upload, and instant upload capabilities
  image:
    src: /logo.png
    alt: ChunkFlow
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/Sunny-117/chunkflow

features:
  - icon: 🚀
    title: Smart Upload Strategy
    details: Automatically selects between direct and chunked upload based on file size for optimal performance
  - icon: 📦
    title: Dynamic Chunking
    details: Adaptive chunk size adjustment based on network conditions, similar to TCP slow start
  - icon: ⚡
    title: Instant Upload
    details: Hash-based deduplication enables instant uploads for files that already exist
  - icon: 🔄
    title: Resumable Upload
    details: Continue uploads from where you left off with IndexedDB persistence
  - icon: 🎯
    title: Framework Agnostic
    details: Works seamlessly with React, Vue, and vanilla JavaScript
  - icon: 🛠️
    title: Highly Extensible
    details: Plugin system allows you to extend functionality with custom logic
  - icon: 🏗️
    title: Layered Architecture
    details: Modular design with Protocol, Shared, Core, Client, Component, and Server layers
  - icon: 🔒
    title: Production Ready
    details: Complete error handling, retry mechanisms, and comprehensive test coverage
---

## Quick Start

::: code-group

```bash [pnpm]
pnpm add @chunkflow/core @chunkflow/upload-client-react
```

```bash [npm]
npm install @chunkflow/core @chunkflow/upload-client-react
```

```bash [yarn]
yarn add @chunkflow/core @chunkflow/upload-client-react
```

:::

## React Example

```tsx
import { UploadProvider } from "@chunkflow/upload-client-react";
import { UploadButton, UploadList } from "@chunkflow/upload-component-react";
import { createFetchAdapter } from "@chunkflow/core";

const adapter = createFetchAdapter({
  baseURL: "http://localhost:3000/api",
});

function App() {
  return (
    <UploadProvider requestAdapter={adapter}>
      <UploadButton accept="image/*,video/*" maxSize={100 * 1024 * 1024}>
        Select Files
      </UploadButton>
      <UploadList />
    </UploadProvider>
  );
}
```

## Vue Example

```vue
<script setup>
import { createApp } from "vue";
import { UploadPlugin } from "@chunkflow/upload-client-vue";
import { UploadButton, UploadList } from "@chunkflow/upload-component-vue";
import { createFetchAdapter } from "@chunkflow/core";

const adapter = createFetchAdapter({
  baseURL: "http://localhost:3000/api",
});

const app = createApp(App);
app.use(UploadPlugin, { requestAdapter: adapter });
</script>

<template>
  <UploadButton accept="image/*,video/*" :max-size="100 * 1024 * 1024"> Select Files </UploadButton>
  <UploadList />
</template>
```

## Why ChunkFlow?

ChunkFlow is designed with a "highly decoupled, progressive enhancement, performance-first" philosophy:

- **Highly Decoupled**: Each layer is independent - use only what you need
- **Performance First**: Hash calculation and upload run in parallel, dynamic chunking, concurrency control
- **Great UX**: Instant upload, resumable upload, real-time progress feedback
- **Developer Friendly**: TypeScript type safety, comprehensive docs, ready-to-use components
- **Production Ready**: Complete error handling, retry mechanisms, test coverage
