/**
 * useUpload - React Hook for single file upload
 *
 * Provides a simple interface for uploading a single file with reactive state.
 * Handles task creation, lifecycle events, and state management.
 *
 * @remarks
 * - Validates: Requirement 10.1 (React Hooks)
 * - Validates: Requirement 10.5 (reactive upload state)
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type { UploadTask, UploadTaskOptions } from "@chunkflow/core";
import type { UploadStatus, UploadProgress } from "@chunkflow/protocol";
import { useUploadManager } from "./useUploadManager";

/**
 * Options for useUpload hook
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
 * Return value from useUpload hook
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
  /** Current upload status */
  status: UploadStatus;
  /** Current upload progress */
  progress: UploadProgress;
  /** Error if upload failed */
  error: Error | null;
  /** The current upload task (null if no upload in progress) */
  task: UploadTask | null;
}

/**
 * Hook for uploading a single file
 *
 * Provides reactive state and control functions for file upload.
 * Automatically manages task lifecycle and updates component state.
 *
 * @param options - Configuration options and callbacks
 * @returns Upload control functions and reactive state
 *
 * @remarks
 * - Validates: Requirement 10.1 (React Hooks)
 * - Validates: Requirement 10.5 (reactive state)
 * - Creates new task for each upload
 * - Automatically subscribes to task events
 * - Updates component state on events
 * - Cleans up event listeners on unmount
 *
 * @example
 * ```tsx
 * import { useUpload } from '@chunkflow/upload-client-react';
 *
 * function UploadButton() {
 *   const { upload, pause, resume, cancel, status, progress, error } = useUpload({
 *     onSuccess: (fileUrl) => {
 *       console.log('Upload complete:', fileUrl);
 *     },
 *     onError: (error) => {
 *       console.error('Upload failed:', error);
 *     },
 *     onProgress: (progress) => {
 *       console.log(`Progress: ${progress.percentage}%`);
 *     },
 *   });
 *
 *   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
 *     const file = e.target.files?.[0];
 *     if (file) {
 *       upload(file);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <input type="file" onChange={handleFileSelect} />
 *       {status === 'uploading' && (
 *         <div>
 *           <p>Progress: {progress.percentage.toFixed(1)}%</p>
 *           <p>Speed: {(progress.speed / 1024 / 1024).toFixed(2)} MB/s</p>
 *           <button onClick={pause}>Pause</button>
 *           <button onClick={cancel}>Cancel</button>
 *         </div>
 *       )}
 *       {status === 'paused' && (
 *         <button onClick={resume}>Resume</button>
 *       )}
 *       {status === 'success' && <p>Upload complete!</p>}
 *       {status === 'error' && <p>Error: {error?.message}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useUpload(options: UseUploadOptions = {}): UseUploadReturn {
  const manager = useUploadManager();

  // State for current task
  const [task, setTask] = useState<UploadTask | null>(null);

  // Reactive state
  const [status, setStatus] = useState<UploadStatus>("idle" as UploadStatus);
  const [progress, setProgress] = useState<UploadProgress>({
    uploadedBytes: 0,
    totalBytes: 0,
    percentage: 0,
    speed: 0,
    remainingTime: 0,
    uploadedChunks: 0,
    totalChunks: 0,
  });
  const [error, setError] = useState<Error | null>(null);

  // Store callbacks in ref to avoid re-creating upload function
  const callbacksRef = useRef(options);
  useEffect(() => {
    callbacksRef.current = options;
  }, [options]);

  // Upload function
  const upload = useCallback(
    (file: File) => {
      // Reset state
      setError(null);
      setStatus("idle" as UploadStatus);

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
        setStatus("uploading" as UploadStatus);
        callbacksRef.current.onStart?.();
      });

      newTask.on("progress", () => {
        const progressData = newTask.getProgress();
        setProgress(progressData);
        callbacksRef.current.onProgress?.(progressData);
      });

      newTask.on("success", ({ fileUrl }) => {
        setStatus("success" as UploadStatus);
        callbacksRef.current.onSuccess?.(fileUrl);
      });

      newTask.on("error", ({ error: err }) => {
        setStatus("error" as UploadStatus);
        setError(err);
        callbacksRef.current.onError?.(err);
      });

      newTask.on("pause", () => {
        setStatus("paused" as UploadStatus);
        callbacksRef.current.onPause?.();
      });

      newTask.on("resume", () => {
        setStatus("uploading" as UploadStatus);
        callbacksRef.current.onResume?.();
      });

      newTask.on("cancel", () => {
        setStatus("cancelled" as UploadStatus);
        callbacksRef.current.onCancel?.();
      });

      // Store task reference
      setTask(newTask);

      // Start upload
      newTask.start().catch((err) => {
        console.error("Upload failed:", err);
      });
    },
    [manager, options.chunkSize, options.concurrency, options.retryCount, options.retryDelay],
  );

  // Control functions
  const pause = useCallback(() => {
    task?.pause();
  }, [task]);

  const resume = useCallback(() => {
    task?.resume().catch((err) => {
      console.error("Resume failed:", err);
    });
  }, [task]);

  const cancel = useCallback(() => {
    task?.cancel();
  }, [task]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel task if still running
      if (task) {
        const currentStatus = task.getStatus();
        if (currentStatus === "uploading" || currentStatus === "paused") {
          task.cancel();
        }
      }
    };
  }, [task]);

  return {
    upload,
    pause,
    resume,
    cancel,
    status,
    progress,
    error,
    task,
  };
}
