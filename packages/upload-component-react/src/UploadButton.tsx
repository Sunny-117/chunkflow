import { useRef, ChangeEvent, ReactNode } from "react";

/**
 * Props for the UploadButton component
 */
export interface UploadButtonProps {
  /**
   * Accepted file types (e.g., "image/*", ".pdf,.doc")
   */
  accept?: string;

  /**
   * Allow multiple file selection
   * @default false
   */
  multiple?: boolean;

  /**
   * Maximum file size in bytes
   */
  maxSize?: number;

  /**
   * Callback when files are selected
   */
  onSelect?: (files: File[]) => void;

  /**
   * Callback when file validation fails
   */
  onError?: (error: FileValidationError) => void;

  /**
   * Custom button content
   */
  children?: ReactNode;

  /**
   * CSS class name for the button
   */
  className?: string;

  /**
   * Disable the button
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
 * UploadButton component
 *
 * A button component that triggers file selection and validates files
 * before passing them to the onSelect callback.
 *
 * @example
 * ```tsx
 * <UploadButton
 *   accept="image/*"
 *   maxSize={10 * 1024 * 1024} // 10MB
 *   multiple
 *   onSelect={(files) => console.log('Selected:', files)}
 * >
 *   Select Files
 * </UploadButton>
 * ```
 */
export function UploadButton({
  accept,
  multiple = false,
  maxSize,
  onSelect,
  onError,
  children,
  className,
  disabled = false,
}: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

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

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

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

    // Call onSelect with valid files
    if (validFiles.length > 0 && onSelect) {
      onSelect(validFiles);
    }

    // Reset input value to allow selecting the same file again
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <>
      <button onClick={handleClick} className={className} disabled={disabled} type="button">
        {children || "Select Files"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        style={{ display: "none" }}
        aria-hidden="true"
      />
    </>
  );
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
