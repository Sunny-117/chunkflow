# @chunkflow/upload-client-vue

Vue adapter for ChunkFlow Upload SDK with composables and plugin.

## Installation

```bash
pnpm add @chunkflow/upload-client-vue
```

## Usage

```ts
import { createApp } from 'vue';
import { UploadPlugin } from '@chunkflow/upload-client-vue';

const app = createApp(App);
app.use(UploadPlugin, { requestAdapter: adapter });
```

## License

MIT
