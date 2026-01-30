# Installation

## Package Manager

ChunkFlow supports all major package managers. Choose the one you prefer:

### pnpm (Recommended)

```bash
pnpm add @chunkflow/core
```

### npm

```bash
npm install @chunkflow/core
```

### yarn

```bash
yarn add @chunkflow/core
```

### bun

```bash
bun add @chunkflow/core
```

## Package Selection

Choose the packages based on your needs:

### Minimal Setup (Core Only)

For vanilla JavaScript or custom integrations:

```bash
pnpm add @chunkflow/core
```

### React Setup

For React applications with ready-to-use components:

```bash
pnpm add @chunkflow/core @chunkflow/upload-client-react @chunkflow/upload-component-react
```

### Vue Setup

For Vue applications with ready-to-use components:

```bash
pnpm add @chunkflow/core @chunkflow/upload-client-vue @chunkflow/upload-component-vue
```

### Server Setup

For Node.js server implementation:

```bash
pnpm add @chunkflow/upload-server
```

### Full Stack Setup

For complete client and server setup:

```bash
# Client
pnpm add @chunkflow/core @chunkflow/upload-client-react @chunkflow/upload-component-react

# Server
pnpm add @chunkflow/upload-server
```

## TypeScript Support

All ChunkFlow packages are written in TypeScript and include type definitions out of the box. No additional `@types` packages are needed.

## Browser Support

ChunkFlow supports all modern browsers:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

### Required Browser APIs

ChunkFlow uses the following browser APIs:

- **File API**: For reading files
- **Fetch API**: For HTTP requests (or you can provide a custom adapter)
- **IndexedDB**: For resumable upload persistence (optional, gracefully degrades)
- **Web Workers**: For hash calculation (optional, falls back to main thread)

## Node.js Support

For server-side usage:

- Node.js 18+
- Bun 1.0+

## CDN Usage

You can also use ChunkFlow via CDN for quick prototyping:

```html
<script type="module">
  import { UploadManager } from "https://esm.sh/@chunkflow/core";

  // Your code here
</script>
```

::: warning
CDN usage is not recommended for production. Use a package manager for better performance and reliability.
:::

## Monorepo Setup

If you're using a monorepo (pnpm workspace, npm workspaces, yarn workspaces, or Turborepo), ChunkFlow works seamlessly:

```json
{
  "dependencies": {
    "@chunkflow/core": "workspace:*",
    "@chunkflow/upload-client-react": "workspace:*"
  }
}
```

## Verification

After installation, verify that ChunkFlow is installed correctly:

```typescript
import { UploadManager } from "@chunkflow/core";

console.log(UploadManager); // Should output the class constructor
```

## Troubleshooting

### Module Not Found

If you encounter "Module not found" errors:

1. Clear your package manager cache:

   ```bash
   pnpm store prune  # pnpm
   npm cache clean --force  # npm
   yarn cache clean  # yarn
   ```

2. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules
   pnpm install
   ```

### TypeScript Errors

If you encounter TypeScript errors:

1. Ensure your `tsconfig.json` includes:

   ```json
   {
     "compilerOptions": {
       "moduleResolution": "bundler",
       "module": "ESNext",
       "target": "ES2020"
     }
   }
   ```

2. Clear TypeScript cache:
   ```bash
   rm -rf node_modules/.cache
   ```

### Build Errors

If you encounter build errors with Vite, Webpack, or other bundlers:

1. Ensure you're using ESM imports
2. Check that your bundler supports the `exports` field in `package.json`
3. Update your bundler to the latest version

## Next Steps

Now that you have ChunkFlow installed, check out the [Getting Started](/guide/getting-started) guide to begin using it in your project.
