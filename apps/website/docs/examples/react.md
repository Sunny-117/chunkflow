# React Examples

Complete examples for using ChunkFlow with React.

## Basic Upload

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
      <div className="container">
        <h1>Upload Files</h1>
        <UploadButton accept="*" multiple>
          Select Files
        </UploadButton>
        <UploadList />
      </div>
    </UploadProvider>
  );
}
```

## Custom Upload UI

```tsx
import { useUpload } from "@chunkflow/upload-client-react";
import { useState } from "react";

function CustomUpload() {
  const [file, setFile] = useState<File | null>(null);
  const { upload, status, progress, pause, resume, cancel, error } = useUpload({
    onSuccess: (fileUrl) => {
      alert(`Upload complete: ${fileUrl}`);
    },
    onError: (err) => {
      console.error("Upload failed:", err);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      upload(selectedFile);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />

      {file && (
        <div>
          <h3>{file.name}</h3>
          <p>Status: {status}</p>

          {status === "uploading" && (
            <>
              <progress value={progress.percentage} max={100} />
              <p>{progress.percentage.toFixed(1)}%</p>
              <p>Speed: {formatSpeed(progress.speed)}</p>
              <p>ETA: {formatTime(progress.remainingTime)}</p>
              <button onClick={pause}>Pause</button>
              <button onClick={cancel}>Cancel</button>
            </>
          )}

          {status === "paused" && <button onClick={resume}>Resume</button>}

          {status === "error" && <p style={{ color: "red" }}>Error: {error?.message}</p>}

          {status === "success" && <p style={{ color: "green" }}>Upload complete!</p>}
        </div>
      )}
    </div>
  );
}

function formatSpeed(bytesPerSecond: number): string {
  const units = ["B/s", "KB/s", "MB/s", "GB/s"];
  let speed = bytesPerSecond;
  let unitIndex = 0;

  while (speed >= 1024 && unitIndex < units.length - 1) {
    speed /= 1024;
    unitIndex++;
  }

  return `${speed.toFixed(2)} ${units[unitIndex]}`;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
}
```

## Multiple File Upload

```tsx
import { useUploadList } from "@chunkflow/upload-client-react";

function MultipleUpload() {
  const { tasks, uploadFiles, pauseAll, resumeAll, cancelAll, removeTask } = useUploadList();

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    uploadFiles(files);
  };

  return (
    <div>
      <input type="file" multiple onChange={handleFilesChange} />

      <div>
        <button onClick={pauseAll}>Pause All</button>
        <button onClick={resumeAll}>Resume All</button>
        <button onClick={cancelAll}>Cancel All</button>
      </div>

      <div>
        {tasks.map((task) => (
          <div
            key={task.id}
            style={{ border: "1px solid #ccc", padding: "10px", margin: "10px 0" }}
          >
            <h4>{task.file.name}</h4>
            <p>Status: {task.getStatus()}</p>
            <progress value={task.getProgress().percentage} max={100} />
            <p>{task.getProgress().percentage.toFixed(1)}%</p>
            <button onClick={() => task.pause()}>Pause</button>
            <button onClick={() => task.resume()}>Resume</button>
            <button onClick={() => removeTask(task.id)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## With Drag and Drop

```tsx
import { UploadDropzone } from "@chunkflow/upload-component-react";
import { useUploadList } from "@chunkflow/upload-client-react";

function DragDropUpload() {
  const { uploadFiles } = useUploadList();

  return (
    <UploadDropzone accept="image/*,video/*" maxSize={100 * 1024 * 1024} onDrop={uploadFiles}>
      <div style={{ padding: "40px", textAlign: "center", border: "2px dashed #ccc" }}>
        <p>Drag and drop files here</p>
        <p>or click to select files</p>
      </div>
    </UploadDropzone>
  );
}
```

## See Also

- [Client React API](/api/client-react)
- [Component React API](/api/component-react)
- [Vue Examples](/examples/vue)
