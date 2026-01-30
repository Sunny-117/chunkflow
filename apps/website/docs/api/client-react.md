# Client React API

React Hooks and Context for ChunkFlow integration.

## UploadProvider

Context provider for upload functionality.

```tsx
import { UploadProvider } from "@chunkflow/upload-client-react";

function App() {
  return (
    <UploadProvider requestAdapter={adapter}>
      <YourComponents />
    </UploadProvider>
  );
}
```

## useUpload

Hook for single file upload.

```tsx
import { useUpload } from "@chunkflow/upload-client-react";

function UploadComponent() {
  const { upload, status, progress, pause, resume, cancel } = useUpload({
    onSuccess: (fileUrl) => console.log(fileUrl),
    onError: (error) => console.error(error),
  });

  return (
    <div>
      <input type="file" onChange={(e) => upload(e.target.files[0])} />
      <p>Status: {status}</p>
      <p>Progress: {progress.percentage}%</p>
    </div>
  );
}
```

## useUploadList

Hook for multiple file uploads.

```tsx
import { useUploadList } from "@chunkflow/upload-client-react";

function UploadListComponent() {
  const { tasks, uploadFiles, pauseAll, resumeAll, cancelAll } = useUploadList();

  return (
    <div>
      <input type="file" multiple onChange={(e) => uploadFiles(Array.from(e.target.files))} />
      <button onClick={pauseAll}>Pause All</button>
      <button onClick={resumeAll}>Resume All</button>
      {tasks.map((task) => (
        <div key={task.id}>{task.file.name}</div>
      ))}
    </div>
  );
}
```

## useUploadManager

Hook to access the upload manager.

```tsx
import { useUploadManager } from "@chunkflow/upload-client-react";

function Component() {
  const manager = useUploadManager();

  // Use manager directly
  const task = manager.createTask(file);
}
```

## See Also

- [Component React API](/api/component-react)
- [Core API](/api/core)
- [Examples](/examples/react)
