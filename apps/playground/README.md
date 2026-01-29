# ChunkFlow Upload SDK - Playground

Interactive playground application demonstrating the capabilities of ChunkFlow Upload SDK.

## Features

### 1. Basic Upload
- Simple file upload with automatic chunking
- Progress tracking with speed and remaining time
- Error handling and validation

### 2. Multi-File Upload
- Upload multiple files simultaneously
- Drag-and-drop support
- Batch operations (pause all, resume all, cancel all)
- Real-time statistics dashboard

### 3. Resume Upload (Breakpoint Resume)
- Automatic progress persistence
- Resume interrupted uploads
- No need to re-upload completed chunks
- Works across page refreshes

### 4. Instant Upload (秒传)
- Content-based deduplication
- Skip uploading duplicate files
- Instant completion for known files
- Cross-user deduplication

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Running ChunkFlow Upload Server (see `apps/server`)

### Installation

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Development

```bash
# Start the development server
pnpm --filter @chunkflow/playground dev
```

The playground will be available at `http://localhost:5173`.

### Production Build

```bash
# Build for production
pnpm --filter @chunkflow/playground build

# Preview the production build
pnpm --filter @chunkflow/playground preview
```

## Configuration

The playground connects to the upload server at `http://localhost:3001` by default. You can modify this in `src/App.tsx`:

```typescript
const requestAdapter = new FetchRequestAdapter({
  baseURL: 'http://localhost:3001', // Change this to your server URL
});
```

## Project Structure

```
apps/playground/
├── src/
│   ├── adapters/
│   │   └── fetch-request-adapter.ts  # HTTP adapter for server communication
│   ├── demos/
│   │   ├── BasicUploadDemo.tsx       # Basic upload demonstration
│   │   ├── MultiFileUploadDemo.tsx   # Multi-file upload demonstration
│   │   ├── ResumeUploadDemo.tsx      # Breakpoint resume demonstration
│   │   └── InstantUploadDemo.tsx     # Instant upload demonstration
│   ├── App.tsx                       # Main application component
│   ├── App.css                       # Application styles
│   └── main.tsx                      # Application entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Usage Examples

### Basic Upload

```typescript
import { UploadButton, UploadList } from '@chunkflow/upload-component-react';

function MyComponent() {
  return (
    <>
      <UploadButton
        accept="*/*"
        multiple
        maxSize={1024 * 1024 * 1024} // 1GB
      >
        Select Files
      </UploadButton>
      <UploadList />
    </>
  );
}
```

### Multi-File Upload with Drag-and-Drop

```typescript
import { UploadDropzone } from '@chunkflow/upload-component-react';

function MyComponent() {
  const handleDrop = async (files: File[]) => {
    console.log('Files dropped:', files);
  };

  return (
    <UploadDropzone
      accept="*/*"
      multiple
      onDrop={handleDrop}
    >
      Drop files here
    </UploadDropzone>
  );
}
```

### Custom Upload Logic

```typescript
import { useUpload } from '@chunkflow/upload-client-react';

function MyComponent() {
  const { upload, status, progress } = useUpload({
    onSuccess: (fileId) => {
      console.log('Upload completed:', fileId);
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    },
  });

  const handleFileSelect = async (file: File) => {
    await upload(file);
  };

  return (
    <div>
      <input type="file" onChange={(e) => handleFileSelect(e.target.files[0])} />
      <p>Status: {status}</p>
      <p>Progress: {progress?.percentage}%</p>
    </div>
  );
}
```

## Testing

### Manual Testing Checklist

- [ ] Upload a small file (< 10MB)
- [ ] Upload a large file (> 100MB)
- [ ] Upload multiple files simultaneously
- [ ] Pause and resume an upload
- [ ] Cancel an upload
- [ ] Refresh the page during upload and resume
- [ ] Upload the same file twice (test instant upload)
- [ ] Test drag-and-drop functionality
- [ ] Test file validation (size, type)
- [ ] Test error handling (network errors, server errors)

## Troubleshooting

### Server Connection Issues

If you see connection errors, make sure:
1. The upload server is running (`pnpm --filter @chunkflow/server-app dev`)
2. The server is accessible at `http://localhost:3001`
3. CORS is properly configured on the server

### Upload Failures

If uploads fail:
1. Check the browser console for errors
2. Check the server logs
3. Verify the file size is within limits
4. Ensure the database is running (PostgreSQL)

### Performance Issues

For better performance:
1. Use a production build (`pnpm build`)
2. Ensure the server has sufficient resources
3. Check network bandwidth
4. Adjust chunk size in the server configuration

## License

MIT
