/**
 * useUploadList - Vue Composable for managing multiple file uploads
 *
 * Provides reactive state and control functions for managing a list of upload tasks.
 * Automatically syncs with the UploadManager's task list.
 *
 * @remarks
 * - Validates: Requirement 10.2 (Vue Composables)
 * - Validates: Requirement 10.5 (reactive state)
 */

import { ref, onMounted, onUnmounted, type Ref } from "vue";
import type { UploadTask } from "@chunkflow/core";
import { useUploadManager } from "./useUploadManager";

/**
 * Return value from useUploadList composable
 */
export interface UseUploadListReturn {
  /** Array of all upload tasks (reactive) */
  tasks: Ref<UploadTask[]>;
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
  /** Function to get task statistics (reactive) */
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
 * Composable for managing multiple file uploads
 *
 * Provides reactive state for all upload tasks and batch control functions.
 * Automatically updates when tasks are added, removed, or change state.
 *
 * @returns Upload list control functions and reactive state
 *
 * @remarks
 * - Validates: Requirement 10.2 (Vue Composables)
 * - Validates: Requirement 10.5 (reactive state)
 * - Polls manager for task updates (100ms interval)
 * - Provides batch operations for all tasks
 * - Automatically cleans up on unmount
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useUploadList } from '@chunkflow/upload-client-vue';
 *
 * const {
 *   tasks,
 *   uploadFiles,
 *   pauseAll,
 *   resumeAll,
 *   cancelAll,
 *   removeTask,
 *   clearCompleted,
 *   getStatistics,
 * } = useUploadList();
 *
 * const handleFilesSelect = (event: Event) => {
 *   const input = event.target as HTMLInputElement;
 *   const files = Array.from(input.files || []);
 *   uploadFiles(files);
 * };
 *
 * const stats = getStatistics();
 * </script>
 *
 * <template>
 *   <div>
 *     <input type="file" multiple @change="handleFilesSelect" />
 *     <div>
 *       <button @click="pauseAll">Pause All</button>
 *       <button @click="resumeAll">Resume All</button>
 *       <button @click="cancelAll">Cancel All</button>
 *       <button @click="clearCompleted">Clear Completed</button>
 *     </div>
 *     <p>
 *       Total: {{ stats.total }} | Uploading: {{ stats.uploading }} |
 *       Success: {{ stats.success }} | Error: {{ stats.error }}
 *     </p>
 *     <ul>
 *       <li v-for="task in tasks" :key="task.id">
 *         <span>{{ task.file.name }}</span>
 *         <span>{{ task.getStatus() }}</span>
 *         <span>{{ task.getProgress().percentage.toFixed(1) }}%</span>
 *         <button @click="removeTask(task.id)">Remove</button>
 *       </li>
 *     </ul>
 *   </div>
 * </template>
 * ```
 */
export function useUploadList(): UseUploadListReturn {
  const manager = useUploadManager();

  // Reactive state for task list
  const tasks = ref<UploadTask[]>([]);

  // Polling interval ID
  let intervalId: ReturnType<typeof setInterval> | null = null;

  // Initialize and start polling
  onMounted(() => {
    // Initial load
    tasks.value = manager.getAllTasks();

    // Set up polling interval
    // We poll every 100ms to catch task updates
    // This is a simple approach - a more sophisticated solution would use
    // event subscriptions, but that would require changes to UploadManager
    intervalId = setInterval(() => {
      tasks.value = manager.getAllTasks();
    }, 100);
  });

  // Cleanup on unmount
  onUnmounted(() => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  });

  // Upload multiple files
  const uploadFiles = (files: File[]) => {
    files.forEach((file) => {
      const task = manager.createTask(file);
      task.start().catch((error) => {
        console.error(`Failed to upload ${file.name}:`, error);
      });
    });
  };

  // Pause all running uploads
  const pauseAll = () => {
    manager.pauseAll();
  };

  // Resume all paused uploads
  const resumeAll = () => {
    manager.resumeAll().catch((error) => {
      console.error("Failed to resume all uploads:", error);
    });
  };

  // Cancel all uploads
  const cancelAll = () => {
    manager.cancelAll();
  };

  // Remove a specific task
  const removeTask = (taskId: string) => {
    manager.deleteTask(taskId).catch((error) => {
      console.error(`Failed to remove task ${taskId}:`, error);
    });
  };

  // Clear all completed tasks
  const clearCompleted = () => {
    manager.clearCompletedTasks().catch((error) => {
      console.error("Failed to clear completed tasks:", error);
    });
  };

  // Get task statistics
  const getStatistics = () => {
    return manager.getStatistics();
  };

  return {
    tasks,
    uploadFiles,
    pauseAll,
    resumeAll,
    cancelAll,
    removeTask,
    clearCompleted,
    getStatistics,
  } as UseUploadListReturn;
}
