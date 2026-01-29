/**
 * useUploadList - React Hook for managing multiple file uploads
 *
 * Provides reactive state and control functions for managing a list of upload tasks.
 * Automatically syncs with the UploadManager's task list.
 *
 * @remarks
 * - Validates: Requirement 10.1 (React Hooks)
 * - Validates: Requirement 10.5 (reactive state)
 */

import { useState, useCallback, useEffect } from "react";
import type { UploadTask } from "@chunkflow/core";
import { useUploadManager } from "./useUploadManager";

/**
 * Return value from useUploadList hook
 */
export interface UseUploadListReturn {
  /** Array of all upload tasks */
  tasks: UploadTask[];
  /** Function to upload multiple files */
  uploadFiles: (files: File[]) => void;
  /** Function to pause all running uploads */
  pauseAll: () => void;
  /** Function to resume all paused uploads */
  resumeAll: () => void;
  /** Function to cancel all uploads */
  cancelAll: () => void;
  /** Function to remove a specific task */
  removeTask: (taskId: string) => void;
  /** Function to clear all completed tasks */
  clearCompleted: () => void;
  /** Function to get task statistics */
  getStatistics: () => {
    total: number;
    idle: number;
    uploading: number;
    paused: number;
    success: number;
    error: number;
    cancelled: number;
  };
}

/**
 * Hook for managing multiple file uploads
 *
 * Provides reactive state for all upload tasks and batch control functions.
 * Automatically updates when tasks are added, removed, or change state.
 *
 * @returns Upload list control functions and reactive state
 *
 * @remarks
 * - Validates: Requirement 10.1 (React Hooks)
 * - Validates: Requirement 10.5 (reactive state)
 * - Polls manager for task updates (100ms interval)
 * - Provides batch operations for all tasks
 * - Automatically cleans up on unmount
 *
 * @example
 * ```tsx
 * import { useUploadList } from '@chunkflow/upload-client-react';
 *
 * function UploadList() {
 *   const {
 *     tasks,
 *     uploadFiles,
 *     pauseAll,
 *     resumeAll,
 *     cancelAll,
 *     removeTask,
 *     clearCompleted,
 *     getStatistics,
 *   } = useUploadList();
 *
 *   const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
 *     const files = Array.from(e.target.files || []);
 *     uploadFiles(files);
 *   };
 *
 *   const stats = getStatistics();
 *
 *   return (
 *     <div>
 *       <input type="file" multiple onChange={handleFilesSelect} />
 *       <div>
 *         <button onClick={pauseAll}>Pause All</button>
 *         <button onClick={resumeAll}>Resume All</button>
 *         <button onClick={cancelAll}>Cancel All</button>
 *         <button onClick={clearCompleted}>Clear Completed</button>
 *       </div>
 *       <p>
 *         Total: {stats.total} | Uploading: {stats.uploading} |
 *         Success: {stats.success} | Error: {stats.error}
 *       </p>
 *       <ul>
 *         {tasks.map((task) => {
 *           const progress = task.getProgress();
 *           const status = task.getStatus();
 *           return (
 *             <li key={task.id}>
 *               <span>{task.file.name}</span>
 *               <span>{status}</span>
 *               <span>{progress.percentage.toFixed(1)}%</span>
 *               <button onClick={() => removeTask(task.id)}>Remove</button>
 *             </li>
 *           );
 *         })}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 */
export function useUploadList(): UseUploadListReturn {
  const manager = useUploadManager();

  // Reactive state for task list
  const [tasks, setTasks] = useState<UploadTask[]>([]);

  // Poll manager for task updates
  // This ensures the component re-renders when tasks change
  useEffect(() => {
    // Initial load
    setTasks(manager.getAllTasks());

    // Set up polling interval
    // We poll every 100ms to catch task updates
    // This is a simple approach - a more sophisticated solution would use
    // event subscriptions, but that would require changes to UploadManager
    const interval = setInterval(() => {
      setTasks(manager.getAllTasks());
    }, 100);

    // Cleanup interval on unmount
    return () => {
      clearInterval(interval);
    };
  }, [manager]);

  // Upload multiple files
  const uploadFiles = useCallback(
    (files: File[]) => {
      files.forEach((file) => {
        const task = manager.createTask(file);
        task.start().catch((error) => {
          console.error(`Failed to upload ${file.name}:`, error);
        });
      });
    },
    [manager],
  );

  // Pause all running uploads
  const pauseAll = useCallback(() => {
    manager.pauseAll();
  }, [manager]);

  // Resume all paused uploads
  const resumeAll = useCallback(() => {
    manager.resumeAll().catch((error) => {
      console.error("Failed to resume all uploads:", error);
    });
  }, [manager]);

  // Cancel all uploads
  const cancelAll = useCallback(() => {
    manager.cancelAll();
  }, [manager]);

  // Remove a specific task
  const removeTask = useCallback(
    (taskId: string) => {
      manager.deleteTask(taskId).catch((error) => {
        console.error(`Failed to remove task ${taskId}:`, error);
      });
    },
    [manager],
  );

  // Clear all completed tasks
  const clearCompleted = useCallback(() => {
    manager.clearCompletedTasks().catch((error) => {
      console.error("Failed to clear completed tasks:", error);
    });
  }, [manager]);

  // Get task statistics
  const getStatistics = useCallback(() => {
    return manager.getStatistics();
  }, [manager]);

  return {
    tasks,
    uploadFiles,
    pauseAll,
    resumeAll,
    cancelAll,
    removeTask,
    clearCompleted,
    getStatistics,
  };
}
