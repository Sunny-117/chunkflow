/**
 * useUpload - Vue Composable for single file upload
 *
 * Provides a simple interface for uploading a single file with reactive state.
 * Handles task creation, lifecycle events, and state management.
 *
 * @remarks
 * - Validates: Requirement 10.2 (Vue Composables)
 * - Validates: Requirement 10.5 (reactive upload state)
 */

import { ref, onUnmounted, type Ref } from "vue";
import type { UploadTask, UploadTaskOptions } from "@chunkflow/core";
import type { UploadStatus, UploadProgress } from "@chunkflow/protocol";
import { useUploadManager } from "./useUploadManager";

/**
 * Options for useUpload composable
 */
export interface UseUploadOptions extends Partial<UploadTaskOptions> {
  /** Callback when upload succeeds */
  onSuccess?: (fileUrl: string) => void;
  /** Callback when upload fails */
  onError?: (error: Error) => void;
  /** Callback on progress updates */
  onProgress?: (progress: UploadProgress) => void;
  /** Callback when upload starts */
  onStart?: () => void;
  /** Callback when upload is paused */
  onPause?: () => void;
  /** Callback when upload is resumed */
  onResume?: () => void;
  /** Callback when upload is cancelled */
  onCancel?: () => void;
}

/**
 * Return value from useUpload composable
 */
export interface UseUploadReturn {
  /** Function to start uploading a file */
  upload: (file: File) => void;
  /** Function to pause the current upload */
  pause: () => void;
  /** Function to resume a paused upload */
  resume: () => void;
  /** Function to cancel the current upload */
  cancel: () => void;
  /** Current upload status (reactive) */
  status: Ref<UploadStatus>;
  /** Current upload progress (reactive) */
  progress: Ref<UploadProgress>;
  /** Error if upload failed (reactive) */
  error: Ref<Error | null>;
  /** The current upload task (reactive, null if no upload in progress) */
  task: Ref<UploadTask | null>;
}

/**
 * Composable for uploading a single file
 *
 * Provides reactive state and control functions for file upload.
 * Automatically manages task lifecycle and updates reactive state.
 *
 * @param options - Configuration options and callbacks
 * @returns Upload control functions and reactive state
 *
 * @remarks
 * - Validates: Requirement 10.2 (Vue Composables)
 * - Validates: Requirement 10.5 (reactive state)
 * - Creates new task for each upload
 * - Automatically subscribes to task events
 * - Updates reactive state on events
 * - Cleans up event listeners on unmount
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useUpload } from '@chunkflow/upload-client-vue';
 *
 * const { upload, pause, resume, cancel, status, progress, error } = useUpload({
 *   onSuccess: (fileUrl) => {
 *     console.log('Upload complete:', fileUrl);
 *   },
 *   onError: (error) => {
 *     console.error('Upload failed:', error);
 *   },
 *   onProgress: (progress) => {
 *     console.log(`Progress: ${progress.percentage}%`);
 *   },
 * });
 *
 * const handleFileSelect = (event: Event) => {
 *   const input = event.target as HTMLInputElement;
 *   const file = input.files?.[0];
 *   if (file) {
 *     upload(file);
 *   }
 * };
 * </script>
 *
 * <template>
 *   <div>
 *     <input type="file" @change="handleFileSelect" />
 *     <div v-if="status === 'uploading'">
 *       <p>Progress: {{ progress.percentage.toFixed(1) }}%</p>
 *       <p>Speed: {{ (progress.speed / 1024 / 1024).toFixed(2) }} MB/s</p>
 *       <button @click="pause">Pause</button>
 *       <button @click="cancel">Cancel</button>
 *     </div>
 *     <button v-if="status === 'paused'" @click="resume">Resume</button>
 *     <p v-if="status === 'success'">Upload complete!</p>
 *     <p v-if="status === 'error'">Error: {{ error?.message }}</p>
 *   </div>
 * </template>
 * ```
 */
export function useUpload(options: UseUploadOptions = {}): UseUploadReturn {
  const manager = useUploadManager();

  // Reactive state
  const task = ref<UploadTask | null>(null);
  const status = ref<UploadStatus>("idle" as UploadStatus);
  const progress = ref<UploadProgress>({
    uploadedBytes: 0,
    totalBytes: 0,
    percentage: 0,
    speed: 0,
    remainingTime: 0,
    uploadedChunks: 0,
    totalChunks: 0,
  });
  const error = ref<Error | null>(null);

  // Upload function
  const upload = (file: File) => {
    // Reset state
    error.value = null;
    status.value = "idle" as UploadStatus;

    // Create new task
    const newTask = manager.createTask(file, {
      chunkSize: options.chunkSize,
      concurrency: options.concurrency,
      retryCount: options.retryCount,
      retryDelay: options.retryDelay,
      autoStart: false, // We'll start it manually
    });

    // Set up event listeners
    newTask.on("start", () => {
      status.value = "uploading" as UploadStatus;
      options.onStart?.();
    });

    newTask.on("progress", () => {
      const progressData = newTask.getProgress();
      progress.value = progressData;
      options.onProgress?.(progressData);
    });

    newTask.on("success", ({ fileUrl }) => {
      status.value = "success" as UploadStatus;
      options.onSuccess?.(fileUrl);
    });

    newTask.on("error", ({ error: err }) => {
      status.value = "error" as UploadStatus;
      error.value = err;
      options.onError?.(err);
    });

    newTask.on("pause", () => {
      status.value = "paused" as UploadStatus;
      options.onPause?.();
    });

    newTask.on("resume", () => {
      status.value = "uploading" as UploadStatus;
      options.onResume?.();
    });

    newTask.on("cancel", () => {
      status.value = "cancelled" as UploadStatus;
      options.onCancel?.();
    });

    // Store task reference
    task.value = newTask;

    // Start upload
    newTask.start().catch((err) => {
      console.error("Upload failed:", err);
    });
  };

  // Control functions
  const pause = () => {
    task.value?.pause();
  };

  const resume = () => {
    task.value?.resume().catch((err) => {
      console.error("Resume failed:", err);
    });
  };

  const cancel = () => {
    task.value?.cancel();
  };

  // Cleanup on unmount
  onUnmounted(() => {
    // Cancel task if still running
    if (task.value) {
      const currentStatus = task.value.getStatus();
      if (currentStatus === "uploading" || currentStatus === "paused") {
        task.value.cancel();
      }
    }
  });

  return {
    upload,
    pause,
    resume,
    cancel,
    status,
    progress,
    error,
    task,
  } as UseUploadReturn;
}
