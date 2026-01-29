<template>
  <div>
    <div
      :class="containerClassName"
      :style="containerStyle"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @dragover="handleDragOver"
      @drop="handleDrop"
      @click="handleClick"
      @keydown="handleKeyDown"
      data-testid="upload-dropzone"
      :data-dragging="isDragging"
      role="button"
      :tabindex="disabled ? -1 : 0"
      :aria-disabled="disabled"
    >
      <slot>
        <div :style="defaultStyles.content" data-testid="dropzone-default-content">
          <p>
            <strong>Drag and drop files here</strong>
          </p>
          <p>or click to select files</p>
        </div>
      </slot>
    </div>
    <input
      ref="inputRef"
      type="file"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      style="display: none"
      aria-hidden="true"
      @change="handleInputChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type CSSProperties } from "vue";
import { FileValidationError } from "./types";

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
   * Custom content to display in the dropzone
   */
  children?: any;

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

const props = withDefaults(defineProps<UploadDropzoneProps>(), {
  multiple: true,
  disabled: false,
});

const emit = defineEmits<{
  drop: [files: File[]];
  error: [error: FileValidationError];
}>();

const isDragging = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
const dragCounter = ref(0);

const defaultStyles = {
  container: {
    border: "2px dashed #ccc",
    borderRadius: "8px",
    padding: "32px",
    textAlign: "center" as const,
    cursor: props.disabled ? "not-allowed" : "pointer",
    transition: "all 0.3s ease",
    backgroundColor: props.disabled ? "#f5f5f5" : "#fafafa",
    opacity: props.disabled ? 0.6 : 1,
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

const containerStyle = computed(() => {
  return {
    ...defaultStyles.container,
    ...(isDragging.value && !props.disabled ? defaultStyles.dragging : {}),
    ...props.style,
  };
});

const containerClassName = computed(() => {
  return (
    [props.className, isDragging.value && !props.disabled ? props.draggingClassName : ""]
      .filter(Boolean)
      .join(" ") || undefined
  );
});

const matchAccept = (file: File, accept: string): boolean => {
  const patterns = accept.split(",").map((p) => p.trim());

  for (const pattern of patterns) {
    // Exact MIME type match
    if (pattern === file.type) {
      return true;
    }

    // Wildcard MIME type match
    if (pattern.endsWith("/*")) {
      const prefix = pattern.slice(0, -2);
      if (file.type.startsWith(prefix + "/")) {
        return true;
      }
    }

    // File extension match
    if (pattern.startsWith(".")) {
      if (file.name.toLowerCase().endsWith(pattern.toLowerCase())) {
        return true;
      }
    }
  }

  return false;
};

const validateFile = (file: File): FileValidationError | null => {
  // Validate file size
  if (props.maxSize && file.size > props.maxSize) {
    return new FileValidationError(
      `File "${file.name}" size ${file.size} bytes exceeds maximum ${props.maxSize} bytes`,
      "FILE_TOO_LARGE",
      file,
    );
  }

  // Validate file type
  if (props.accept && !matchAccept(file, props.accept)) {
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
  if (errors.length > 0) {
    errors.forEach((error) => emit("error", error));
  }

  // Call onDrop with valid files
  if (validFiles.length > 0) {
    emit("drop", validFiles);
  }
};

const handleDragEnter = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();

  if (props.disabled) return;

  dragCounter.value++;
  if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
    isDragging.value = true;
  }
};

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();

  if (props.disabled) return;

  dragCounter.value--;
  if (dragCounter.value === 0) {
    isDragging.value = false;
  }
};

const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();

  if (props.disabled) return;

  // Set dropEffect to indicate this is a copy operation
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = "copy";
  }
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();

  if (props.disabled) return;

  isDragging.value = false;
  dragCounter.value = 0;

  const files = Array.from(e.dataTransfer?.files || []);

  // Limit to single file if multiple is false
  const filesToProcess = props.multiple ? files : files.slice(0, 1);

  processFiles(filesToProcess);
};

const handleClick = () => {
  if (!props.disabled) {
    inputRef.value?.click();
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (!props.disabled && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    handleClick();
  }
};

const handleInputChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const files = Array.from(target.files || []);
  processFiles(files);

  // Reset input value to allow selecting the same file again
  if (inputRef.value) {
    inputRef.value.value = "";
  }
};
</script>
