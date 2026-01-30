# React 示例

使用 ChunkFlow 与 React 的完整示例。

## 基础上传

```tsx
import { UploadProvider } from '@chunkflow/upload-client-react';
import { UploadButton, UploadList } from '@chunkflow/upload-component-react';
import { createFetchAdapter } from '@chunkflow/core';

const adapter = createFetchAdapter({
  baseURL: 'http://localhost:3000/api',
});

function App() {
  return (
    <UploadProvider requestAdapter={adapter}>
      <div className="container">
        <h1>上传文件</h1>
        <UploadButton accept="*" multiple>
          选择文件
        </UploadButton>
        <UploadList />
      </div>
    </UploadProvider>
  );
}
```

## 自定义上传 UI

```tsx
import { useUpload } from '@chunkflow/upload-client-react';
import { useState } from 'react';

function CustomUpload() {
  const [file, setFile] = useState<File | null>(null);
  const { upload, status, progress, pause, resume, cancel, error } = useUpload({
    onSuccess: (fileUrl) => {
      alert(`上传完成: ${fileUrl}`);
    },
    onError: (err) => {
      console.error('上传失败:', err);
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
          <p>状态: {status}</p>
          
          {status === 'uploading' && (
            <>
              <progress value={progress.percentage} max={100} />
              <p>{progress.percentage.toFixed(1)}%</p>
              <p>速度: {formatSpeed(progress.speed)}</p>
              <p>预计剩余时间: {formatTime(progress.remainingTime)}</p>
              <button onClick={pause}>暂停</button>
              <button onClick={cancel}>取消</button>
            </>
          )}
          
          {status === 'paused' && (
            <button onClick={resume}>恢复</button>
          )}
          
          {status === 'error' && (
            <p style={{ color: 'red' }}>错误: {error?.message}</p>
          )}
          
          {status === 'success' && (
            <p style={{ color: 'green' }}>上传完成！</p>
          )}
        </div>
      )}
    </div>
  );
}

function formatSpeed(bytesPerSecond: number): string {
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  let speed = bytesPerSecond;
  let unitIndex = 0;
  
  while (speed >= 1024 && unitIndex < units.length - 1) {
    speed /= 1024;
    unitIndex++;
  }
  
  return `${speed.toFixed(2)} ${units[unitIndex]}`;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}秒`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}分钟`;
  return `${Math.round(seconds / 3600)}小时`;
}
```

## 多文件上传

```tsx
import { useUploadList } from '@chunkflow/upload-client-react';

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
        <button onClick={pauseAll}>全部暂停</button>
        <button onClick={resumeAll}>全部恢复</button>
        <button onClick={cancelAll}>全部取消</button>
      </div>
      
      <div>
        {tasks.map(task => (
          <div key={task.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
            <h4>{task.file.name}</h4>
            <p>状态: {task.getStatus()}</p>
            <progress value={task.getProgress().percentage} max={100} />
            <p>{task.getProgress().percentage.toFixed(1)}%</p>
            <button onClick={() => task.pause()}>暂停</button>
            <button onClick={() => task.resume()}>恢复</button>
            <button onClick={() => removeTask(task.id)}>移除</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 拖放上传

```tsx
import { UploadDropzone } from '@chunkflow/upload-component-react';
import { useUploadList } from '@chunkflow/upload-client-react';

function DragDropUpload() {
  const { uploadFiles } = useUploadList();

  return (
    <UploadDropzone
      accept="image/*,video/*"
      maxSize={100 * 1024 * 1024}
      onDrop={uploadFiles}
    >
      <div style={{ padding: '40px', textAlign: 'center', border: '2px dashed #ccc' }}>
        <p>拖放文件到这里</p>
        <p>或点击选择文件</p>
      </div>
    </UploadDropzone>
  );
}
```

## 另请参阅

- [Client React API](/zh/api/client-react)
- [Component React API](/zh/api/component-react)
- [Vue 示例](/zh/examples/vue)
