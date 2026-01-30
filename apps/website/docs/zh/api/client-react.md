# Client React API

用于 ChunkFlow 集成的 React Hooks 和 Context。

## UploadProvider

上传功能的 Context provider。

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

单文件上传的 Hook。

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
      <p>状态: {status}</p>
      <p>进度: {progress.percentage}%</p>
    </div>
  );
}
```

## useUploadList

多文件上传的 Hook。

```tsx
import { useUploadList } from "@chunkflow/upload-client-react";

function UploadListComponent() {
  const { tasks, uploadFiles, pauseAll, resumeAll, cancelAll } = useUploadList();

  return (
    <div>
      <input type="file" multiple onChange={(e) => uploadFiles(Array.from(e.target.files))} />
      <button onClick={pauseAll}>全部暂停</button>
      <button onClick={resumeAll}>全部恢复</button>
      {tasks.map((task) => (
        <div key={task.id}>{task.file.name}</div>
      ))}
    </div>
  );
}
```

## useUploadManager

访问上传管理器的 Hook。

```tsx
import { useUploadManager } from "@chunkflow/upload-client-react";

function Component() {
  const manager = useUploadManager();

  // 直接使用管理器
  const task = manager.createTask(file);
}
```

## 另请参阅

- [Component React API](/zh/api/component-react)
- [Core API](/zh/api/core)
- [示例](/zh/examples/react)
