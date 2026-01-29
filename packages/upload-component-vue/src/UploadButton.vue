<template>
  <div>
    <button :class="className" :disabled="disabled" type="button" @click="handleClick">
      <slot>Select Files</slot>
    </button>
    <input
      ref="inputRef"
      type="file"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      style="display: none"
      aria-hidden="true"
      @change="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { FileValidationError } from "./types";

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
   * CSS class name for the button
   */
  className?: string;

  /**
   * Disable the button
   * @default false
   */
  disabled?: boolean;
}

const props = withDefaults(defineProps<UploadButtonProps>(), {
  multiple: false,
  disabled: false,
});

const emit = defineEmits<{
  select: [files: File[]];
  error: [error: FileValidationError];
}>();

const inputRef = ref<HTMLInputElement | null>(null);

const handleClick = () => {
  if (!props.disabled) {
    inputRef.value?.click();
  }
};

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

const handleChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const files = Array.from(target.files || []);

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

  // Emit select with valid files
  if (validFiles.length > 0) {
    emit("select", validFiles);
  }

  // Reset input value
  if (inputRef.value) {
    inputRef.value.value = "";
  }
};
</script>
