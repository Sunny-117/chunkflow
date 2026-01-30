# Component React API

开箱即用的 React 文件上传组件。

## UploadButton

文件选择按钮。

```tsx
import { UploadButton } from "@chunkflow/upload-component-react";

<UploadButton
  accept="image/*,video/*"
  maxSize={100 * 1024 * 1024}
  multiple
  onSelect={(files) => console.log(files)}
>
  选择文件
</UploadButton>;
```

### Props

- `accept?: string` - 接受的文件类型
- `multiple?: boolean` - 允许多个文件
- `maxSize?: number` - 最大文件大小（字节）
- `onSelect?: (files: File[]) => void` - 文件选择回调
- `children?: ReactNode` - 按钮内容
- `className?: string` - CSS 类名

## UploadProgress

进度条组件。

```tsx
import { UploadProgress } from "@chunkflow/upload-component-react";

<UploadProgress task={task} showSpeed showRemainingTime />;
```

### Props

- `task: UploadTask` - 上传任务
- `showSpeed?: boolean` - 显示上传速度
- `showRemainingTime?: boolean` - 显示剩余时间
- `className?: string` - CSS 类名

## UploadList

任务列表组件。

```tsx
import { UploadList } from "@chunkflow/upload-component-react";

<UploadList renderItem={(task) => <CustomItem task={task} />} />;
```

### Props

- `className?: string` - CSS 类名
- `renderItem?: (task: UploadTask) => ReactNode` - 自定义项渲染器

## UploadDropzone

拖放区域。

```tsx
import { UploadDropzone } from "@chunkflow/upload-component-react";

<UploadDropzone accept="image/*" maxSize={50 * 1024 * 1024} onDrop={(files) => console.log(files)}>
  <p>拖放文件到这里或点击选择</p>
</UploadDropzone>;
```

### Props

- `accept?: string` - 接受的文件类型
- `maxSize?: number` - 最大文件大小
- `onDrop?: (files: File[]) => void` - 拖放回调
- `children?: ReactNode` - 拖放区域内容
- `className?: string` - CSS 类名

## 另请参阅

- [Client React API](/zh/api/client-react)
- [示例](/zh/examples/react)
