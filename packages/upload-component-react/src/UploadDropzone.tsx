import { useState, useRef, DragEvent, ReactNode, CSSProperties } from "react";

/**
 * Props for the UploadDropzone component
 */
export interface UploadDropzoneProps {
  /**
   * Accepted file types (e.g., "image/*", ".pdf,.doc")
   */
  accept?: string;

  /**
   * Maximum file size in bytes
   */
  maxSize?: number;

  /**
   * Allow multiple file selection
   * @default true
   */
  multiple?: boolean;

  /**
   * Callback when files are dropped
   */
  onDrop?: (files: File[]) => void;

  /**
   * Callback when file validation fails
   */
  onError?: (error: FileValidationError) => void;

  /**
   * Custom content to display in the dropzone
   */
  children?: ReactNode;

  /**
   * CSS class name for the container
   */
  className?: string;

  /**
   * Custom styles for the container
   */
  style?: CSSProperties;

  /**
   * CSS class name when dragging over
   */
  draggingClassName?: string;

  /**
   * Disable the dropzone
   * @default false
   */
  disabled?: boolean;
}

/**
 * File validation error
 */
export class FileValidationError extends Error {
  constructor(
    message: string,
    public code: "FILE_TOO_LARGE" | "INVALID_FILE_TYPE",
    public file: File,
  ) {
    super(message);
    this.name = "FileValidationError";
  }
}

/**
 * Check if a file matches the accept pattern
 *
 * @param file - The file to check
 * @param accept - The accept pattern (e.g., "image/star", ".pdf,.doc", "star/star")
 * @returns true if the file matches the pattern
 */
function matchAccept(file: File, accept: string): boolean {
  // Accept all files if pattern is "*/*" or "*"
  if (accept === "*/*" || accept === "*") {
    return true;
  }

  const patterns = accept.split(",").map((p) => p.trim());

  for (const pattern of patterns) {
    // Accept all files
    if (pattern === "*/*" || pattern === "*") {
      return true;
    }

    // Exact MIME type match (e.g., "image/jpeg")
    if (pattern === file.type) {
      return true;
    }

    // Wildcard MIME type match (e.g., "image/*")
    if (pattern.endsWith("/*")) {
      const prefix = pattern.slice(0, -2);
      if (file.type.startsWith(prefix + "/")) {
        return true;
      }
    }

    // File extension match (e.g., ".pdf")
    if (pattern.startsWith(".")) {
      if (file.name.toLowerCase().endsWith(pattern.toLowerCase())) {
        return true;
      }
    }
  }

  return false;
}

/**
 * UploadDropzone component
 *
 * A drag-and-drop zone for file uploads with visual feedback.
 * Validates files based on type and size before passing them to the onDrop callback.
 *
 * @example
 * ```tsx
 * <UploadDropzone
 *   accept="image/*"
 *   maxSize={10 * 1024 * 1024} // 10MB
 *   multiple
 *   onDrop={(files) => console.log('Dropped:', files)}
 * >
 *   <p>Drag and drop files here, or click to select</p>
 * </UploadDropzone>
 * ```
 */
export function UploadDropzone({
  accept,
  maxSize,
  multiple = true,
  onDrop,
  onError,
  children,
  className,
  style,
  draggingClassName,
  disabled = false,
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const validateFile = (file: File): FileValidationError | null => {
    // Validate file size
    if (maxSize && file.size > maxSize) {
      return new FileValidationError(
        `File "${file.name}" size ${file.size} bytes exceeds maximum ${maxSize} bytes`,
        "FILE_TOO_LARGE",
        file,
      );
    }

    // Validate file type
    if (accept && !matchAccept(file, accept)) {
      return new FileValidationError(
        `File "${file.name}" type "${file.type}" is not accepted`,
        "INVALID_FILE_TYPE",
        file,
      );
    }

    return null;
  };

  const processFiles = (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    // Validate all files
    const validFiles: File[] = [];
    const errors: FileValidationError[] = [];

    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    }

    // Report errors
    if (errors.length > 0 && onError) {
      errors.forEach((error) => onError(error));
    }

    // Call onDrop with valid files
    if (validFiles.length > 0 && onDrop) {
      onDrop(validFiles);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    // Set dropEffect to indicate this is a copy operation
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = Array.from(e.dataTransfer?.files || []);

    // Limit to single file if multiple is false
    const filesToProcess = multiple ? files : files.slice(0, 1);

    processFiles(filesToProcess);
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);

    // Reset input value to allow selecting the same file again
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const defaultStyles = {
    container: {
      border: "2px dashed #ccc",
      borderRadius: "8px",
      padding: "32px",
      textAlign: "center" as const,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all 0.3s ease",
      backgroundColor: disabled ? "#f5f5f5" : "#fafafa",
      opacity: disabled ? 0.6 : 1,
    } as CSSProperties,
    dragging: {
      borderColor: "#4caf50",
      backgroundColor: "#e8f5e9",
    } as CSSProperties,
    content: {
      color: "#666",
      fontSize: "14px",
    } as CSSProperties,
  };

  const containerStyle = {
    ...defaultStyles.container,
    ...(isDragging && !disabled ? defaultStyles.dragging : {}),
    ...style,
  };

  const containerClassName = [className, isDragging && !disabled ? draggingClassName : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div
        className={containerClassName || undefined}
        style={containerStyle}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        data-testid="upload-dropzone"
        data-dragging={isDragging}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {children || (
          <div style={defaultStyles.content} data-testid="dropzone-default-content">
            <p>
              <strong>Drag and drop files here</strong>
            </p>
            <p>or click to select files</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        style={{ display: "none" }}
        aria-hidden="true"
        disabled={disabled}
      />
    </>
  );
}
