# @chunkflow/upload-component-react

Ready-to-use React UI components for ChunkFlow Upload SDK.

## Installation

```bash
pnpm add @chunkflow/upload-component-react
```

## Components

### UploadButton

A button component that triggers file selection and validates files before passing them to the onSelect callback.

#### Props

- `accept?: string` - Accepted file types (e.g., "image/\*", ".pdf,.doc")
- `multiple?: boolean` - Allow multiple file selection (default: false)
- `maxSize?: number` - Maximum file size in bytes
- `onSelect?: (files: File[]) => void` - Callback when files are selected
- `onError?: (error: FileValidationError) => void` - Callback when file validation fails
- `children?: ReactNode` - Custom button content
- `className?: string` - CSS class name for the button
- `disabled?: boolean` - Disable the button (default: false)

#### Example

```tsx
import { UploadButton } from "@chunkflow/upload-component-react";

function MyComponent() {
  const handleSelect = (files: File[]) => {
    console.log("Selected files:", files);
  };

  const handleError = (error) => {
    console.error("Validation error:", error.message);
  };

  return (
    <UploadButton
      accept="image/*"
      maxSize={10 * 1024 * 1024} // 10MB
      multiple
      onSelect={handleSelect}
      onError={handleError}
    >
      Select Images
    </UploadButton>
  );
}
```

#### File Validation

The UploadButton component validates files based on:

1. **File Type**: Supports exact MIME types (e.g., "image/jpeg"), wildcard MIME types (e.g., "image/\*"), and file extensions (e.g., ".pdf")
2. **File Size**: Validates against the `maxSize` prop

When validation fails, the `onError` callback is called with a `FileValidationError` that includes:

- `message`: Error description
- `code`: Error code ("FILE_TOO_LARGE" or "INVALID_FILE_TYPE")
- `file`: The file that failed validation

Valid files are passed to the `onSelect` callback.

### Other Components (Coming Soon)

- `UploadProgress` - Progress indicator
- `UploadList` - Upload task list
- `UploadDropzone` - Drag and drop zone

## License

MIT
