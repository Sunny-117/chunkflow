# Component React API

Ready-to-use React components for file uploads.

## UploadButton

File selection button.

```tsx
import { UploadButton } from "@chunkflow/upload-component-react";

<UploadButton
  accept="image/*,video/*"
  maxSize={100 * 1024 * 1024}
  multiple
  onSelect={(files) => console.log(files)}
>
  Select Files
</UploadButton>;
```

### Props

- `accept?: string` - File types to accept
- `multiple?: boolean` - Allow multiple files
- `maxSize?: number` - Maximum file size in bytes
- `onSelect?: (files: File[]) => void` - File selection callback
- `children?: ReactNode` - Button content
- `className?: string` - CSS class name

## UploadProgress

Progress bar component.

```tsx
import { UploadProgress } from "@chunkflow/upload-component-react";

<UploadProgress task={task} showSpeed showRemainingTime />;
```

### Props

- `task: UploadTask` - Upload task
- `showSpeed?: boolean` - Show upload speed
- `showRemainingTime?: boolean` - Show remaining time
- `className?: string` - CSS class name

## UploadList

Task list component.

```tsx
import { UploadList } from "@chunkflow/upload-component-react";

<UploadList renderItem={(task) => <CustomItem task={task} />} />;
```

### Props

- `className?: string` - CSS class name
- `renderItem?: (task: UploadTask) => ReactNode` - Custom item renderer

## UploadDropzone

Drag and drop zone.

```tsx
import { UploadDropzone } from "@chunkflow/upload-component-react";

<UploadDropzone accept="image/*" maxSize={50 * 1024 * 1024} onDrop={(files) => console.log(files)}>
  <p>Drag files here or click to select</p>
</UploadDropzone>;
```

### Props

- `accept?: string` - File types to accept
- `maxSize?: number` - Maximum file size
- `onDrop?: (files: File[]) => void` - Drop callback
- `children?: ReactNode` - Dropzone content
- `className?: string` - CSS class name

## See Also

- [Client React API](/api/client-react)
- [Examples](/examples/react)
