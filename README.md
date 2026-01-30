<div align="center">
  <img src="./assets/logo.png" alt="ChunkFlow Logo" width="300" height="300" />
  <h1>ChunkFlow Upload SDK</h1>
  <p>
    <strong>A Universal Large File Upload Solution</strong>
  </p>
  <p>
    <a href="https://www.npmjs.com/package/@chunkflow/core"><img src="https://img.shields.io/npm/v/@chunkflow/core.svg" alt="npm version"></a>
    <a href="https://github.com/Sunny-117/chunkflow/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license"></a>
    <a href="https://github.com/Sunny-117/chunkflow"><img src="https://img.shields.io/github/stars/Sunny-117/chunkflow.svg?style=social" alt="GitHub stars"></a>
  </p>
  <p>
    <a href="./README.md">English</a> | <a href="./README.zh-CN.md">简体中文</a>
  </p>
  <p>
    <a href="https://sunny-117.github.io/chunkflow/">📖 Documentation</a>
  </p>
</div>

---

## ✨ Features

- 🚀 **Smart Upload Strategy** - Automatic selection between direct and chunked upload based on file size
- 📦 **Dynamic Chunking** - Adaptive chunk size adjustment based on network conditions (similar to TCP slow start)
- ⚡ **Instant Upload** - Hash-based deduplication for instant uploads (秒传)
- 🔄 **Resumable Upload** - Continue uploads from where you left off with IndexedDB persistence
- 🎯 **Framework Agnostic** - Core layer works with any framework
- ⚛️ **React Support** - Hooks and components for React applications
- 💚 **Vue Support** - Composables and components for Vue applications
- �️ **Highly Extensible** - Plugin system for custom functionality
- 🔒 **Type Safe** - Written in TypeScript with full type definitions
- 🧪 **Well Tested** - Comprehensive unit and property-based tests

## 📦 Packages

### Core Packages

- **[@chunkflow/protocol](./packages/protocol)** - Protocol layer with type definitions and API interfaces
- **[@chunkflow/shared](./packages/shared)** - Shared utilities (event system, concurrency, file utils, storage)
- **[@chunkflow/core](./packages/core)** - Core upload engine with state machine and task management

### Client Packages

- **[@chunkflow/upload-client-react](./packages/upload-client-react)** - React adapter with hooks
- **[@chunkflow/upload-client-vue](./packages/upload-client-vue)** - Vue adapter with composables
- **[@chunkflow/upload-component-react](./packages/upload-component-react)** - Ready-to-use React components
- **[@chunkflow/upload-component-vue](./packages/upload-component-vue)** - Ready-to-use Vue components

### Server Package

- **[@chunkflow/upload-server](./packages/upload-server)** - Server-side SDK with storage adapters

## 🚀 Quick Start

### Installation

```bash
# For React projects
pnpm add @chunkflow/core @chunkflow/upload-client-react

# For Vue projects
pnpm add @chunkflow/core @chunkflow/upload-client-vue
```

### React Usage

```tsx
import { UploadProvider, useUpload } from "@chunkflow/upload-client-react";
import { createFetchAdapter } from "@chunkflow/core";

const adapter = createFetchAdapter({
  baseURL: "http://localhost:3000/api",
});

function App() {
  return (
    <UploadProvider requestAdapter={adapter}>
      <UploadComponent />
    </UploadProvider>
  );
}

function UploadComponent() {
  const { upload, status, progress } = useUpload({
    onSuccess: (fileUrl) => console.log("Upload complete:", fileUrl),
    onError: (error) => console.error("Upload failed:", error),
  });

  return (
    <div>
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />
      <div>Status: {status}</div>
      <div>Progress: {progress.percentage}%</div>
    </div>
  );
}
```

### Vue Usage

```html
<script setup>
  import { useUpload } from "@chunkflow/upload-client-vue";

  const { upload, status, progress } = useUpload({
    onSuccess: (fileUrl) => console.log("Upload complete:", fileUrl),
    onError: (error) => console.error("Upload failed:", error),
  });

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) upload(file);
  };
</script>

<template>
  <div>
    <input type="file" @change="handleFileChange" />
    <div>Status: {{ status }}</div>
    <div>Progress: {{ progress.percentage }}%</div>
  </div>
</template>
```

## 🏗️ Architecture

ChunkFlow Upload SDK follows a layered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     Applications                             │
│  Playground (Demo) │ Server (Nest.js) │ Website (Docs)      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                     Component Layer                          │
│  React Components │ Vue Components                           │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                     Client Adapter Layer                     │
│  React Hooks │ Vue Composables                               │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                     Core Layer                               │
│  Upload Manager │ Upload Task │ Plugin System                │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                     Shared Layer                             │
│  Event System │ Concurrency │ File Utils │ Storage           │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                     Protocol Layer                           │
│  Type Definitions │ API Interfaces                           │
└─────────────────────────────────────────────────────────────┘
```

## 📚 Documentation

Full documentation is available at: [https://sunny-117.github.io/chunkflow/](https://sunny-117.github.io/chunkflow/)

## 🛠️ Development

This project uses a monorepo structure managed by pnpm workspaces and Turbo.

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format
```

### Project Structure

```
chunkflow/
├── packages/              # SDK packages
│   ├── protocol/         # Protocol layer
│   ├── shared/           # Shared utilities
│   ├── core/             # Core upload engine
│   ├── upload-client-react/    # React adapter
│   ├── upload-client-vue/      # Vue adapter
│   ├── upload-component-react/ # React components
│   ├── upload-component-vue/   # Vue components
│   └── upload-server/    # Server SDK
├── apps/                 # Applications
│   ├── server/          # Nest.js server
│   ├── playground/      # Demo application
│   └── website/         # Documentation site
├── pnpm-workspace.yaml  # Workspace configuration
├── turbo.json           # Turbo configuration
└── package.json         # Root package.json
```

## 🧪 Testing

The project uses a dual testing approach:

- **Unit Tests** - Test specific examples and edge cases
- **Property-Based Tests** - Test universal properties across random inputs using fast-check

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test -- --coverage
```

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guidelines](./CONTRIBUTING.md) before submitting a PR.

## 📄 License

MIT © [Sunny-117](https://github.com/Sunny-117)

## 🙏 Acknowledgments

- [mitt](https://github.com/developit/mitt) - Event emitter
- [p-limit](https://github.com/sindresorhus/p-limit) - Concurrency control
- [spark-md5](https://github.com/satazor/js-spark-md5) - MD5 hashing
- [fast-check](https://github.com/dubzzz/fast-check) - Property-based testing

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/Sunny-117">Sunny-117</a></p>
  <p>
    <a href="https://github.com/Sunny-117/chunkflow/stargazers">⭐ Star us on GitHub</a>
  </p>
</div>
