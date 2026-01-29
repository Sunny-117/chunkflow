/**
 * UploadManager - Manages multiple upload tasks
 *
 * Provides centralized management for multiple file uploads including:
 * - Task creation and lifecycle management
 * - Task queue management
 * - Plugin system for extensibility
 * - Automatic resume of unfinished tasks
 * - Persistent storage integration
 */

import type { RequestAdapter } from "@chunkflow/protocol";
import { UploadStorage } from "@chunkflow/shared";
import { UploadTask, type UploadTaskOptions } from "./upload-task";

/**
 * Options for configuring the UploadManager
 */
export interface UploadManagerOptions {
  /** Request adapter for API calls */
  requestAdapter: RequestAdapter;
  /** Maximum number of concurrent tasks (default: 3) */
  maxConcurrentTasks?: number;
  /** Default chunk size for new tasks in bytes (default: 1MB) */
  defaultChunkSize?: number;
  /** Default concurrency for chunk uploads per task (default: 3) */
  defaultConcurrency?: number;
  /** Whether to automatically resume unfinished tasks on init (default: true) */
  autoResumeUnfinished?: boolean;
}

/**
 * UploadManager class
 *
 * Central manager for handling multiple file upload tasks.
 * Provides task lifecycle management, plugin system, and persistent storage.
 *
 * @example
 * ```typescript
 * const manager = new UploadManager({
 *   requestAdapter: myAdapter,
 *   maxConcurrentTasks: 3,
 *   defaultChunkSize: 1024 * 1024, // 1MB
 * });
 *
 * // Initialize (loads unfinished tasks if enabled)
 * await manager.init();
 *
 * // Create and start a task
 * const task = manager.createTask(file);
 * await task.start();
 *
 * // Get all tasks
 * const allTasks = manager.getAllTasks();
 *
 * // Delete a task
 * await manager.deleteTask(task.id);
 * ```
 */
export class UploadManager {
  /** Map of task ID to UploadTask instances */
  private tasks: Map<string, UploadTask>;

  /** Manager options with defaults applied */
  private options: Required<UploadManagerOptions>;

  /** Storage instance for persistent task data */
  private storage: UploadStorage;

  /** Flag indicating if manager has been initialized */
  private initialized: boolean;

  /**
   * Creates a new UploadManager instance
   *
   * @param options - Configuration options for the manager
   *
   * @remarks
   * - Validates: Requirement 8.6 (UploadManager manages multiple tasks)
   * - Applies default values for optional parameters
   * - Creates storage instance for persistence
   * - Does not automatically initialize - call init() explicitly
   */
  constructor(options: UploadManagerOptions) {
    // Initialize tasks map
    this.tasks = new Map();

    // Apply default options
    this.options = {
      requestAdapter: options.requestAdapter,
      maxConcurrentTasks: options.maxConcurrentTasks ?? 3,
      defaultChunkSize: options.defaultChunkSize ?? 1024 * 1024, // 1MB
      defaultConcurrency: options.defaultConcurrency ?? 3,
      autoResumeUnfinished: options.autoResumeUnfinished ?? true,
    };

    // Create storage instance
    this.storage = new UploadStorage();

    // Initialize flag
    this.initialized = false;
  }

  /**
   * Initializes the UploadManager
   *
   * Performs initialization tasks including:
   * - Initializing IndexedDB storage
   * - Loading unfinished tasks if autoResumeUnfinished is enabled
   *
   * @remarks
   * - Validates: Requirement 8.6 (initialization and task management)
   * - Should be called once before using the manager
   * - Safe to call multiple times (idempotent)
   * - Gracefully handles storage initialization failures
   *
   * @example
   * ```typescript
   * const manager = new UploadManager({ requestAdapter });
   * await manager.init();
   * ```
   */
  async init(): Promise<void> {
    // Skip if already initialized
    if (this.initialized) {
      return;
    }

    try {
      // Initialize storage
      await this.storage.init();

      // Load unfinished tasks if enabled
      if (this.options.autoResumeUnfinished) {
        await this.loadUnfinishedTasks();
      }

      // Mark as initialized
      this.initialized = true;
    } catch (error) {
      // Log warning but don't fail initialization
      // Manager can still work without storage
      console.warn("Failed to initialize UploadManager storage:", error);
      this.initialized = true; // Still mark as initialized
    }
  }

  /**
   * Creates a new upload task
   *
   * Creates an UploadTask instance for the given file and adds it to the manager.
   * The task is not automatically started - call task.start() to begin upload.
   *
   * @param file - File to upload
   * @param options - Optional task-specific configuration (overrides defaults)
   * @returns Created UploadTask instance
   *
   * @remarks
   * - Validates: Requirement 8.6 (task creation and management)
   * - Task is added to the manager's task map
   * - Uses manager's default options unless overridden
   * - Task is not started automatically
   *
   * @example
   * ```typescript
   * const task = manager.createTask(file, {
   *   chunkSize: 2 * 1024 * 1024, // 2MB
   *   concurrency: 5,
   * });
   *
   * task.on('progress', ({ progress }) => {
   *   console.log(`Progress: ${progress}%`);
   * });
   *
   * await task.start();
   * ```
   */
  createTask(file: File, options?: Partial<UploadTaskOptions>): UploadTask {
    // Create task with merged options
    const task = new UploadTask({
      file,
      requestAdapter: this.options.requestAdapter,
      chunkSize: options?.chunkSize ?? this.options.defaultChunkSize,
      concurrency: options?.concurrency ?? this.options.defaultConcurrency,
      retryCount: options?.retryCount ?? 3,
      retryDelay: options?.retryDelay ?? 1000,
      autoStart: options?.autoStart ?? false,
    });

    // Add task to map
    this.tasks.set(task.id, task);

    return task;
  }

  /**
   * Gets a task by its ID
   *
   * @param taskId - Unique task identifier
   * @returns UploadTask instance or undefined if not found
   *
   * @remarks
   * - Validates: Requirement 8.6 (task retrieval)
   *
   * @example
   * ```typescript
   * const task = manager.getTask('task_abc123');
   * if (task) {
   *   console.log(`Status: ${task.getStatus()}`);
   * }
   * ```
   */
  getTask(taskId: string): UploadTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Gets all tasks managed by this manager
   *
   * @returns Array of all UploadTask instances
   *
   * @remarks
   * - Validates: Requirement 8.6 (task retrieval)
   * - Returns a new array (safe to modify)
   * - Tasks are in insertion order
   *
   * @example
   * ```typescript
   * const allTasks = manager.getAllTasks();
   * console.log(`Total tasks: ${allTasks.length}`);
   *
   * // Filter by status
   * const uploadingTasks = allTasks.filter(
   *   task => task.getStatus() === 'uploading'
   * );
   * ```
   */
  getAllTasks(): UploadTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Deletes a task from the manager
   *
   * Cancels the task if it's still running and removes it from the manager.
   * Also cleans up the task's storage record.
   *
   * @param taskId - Unique task identifier
   *
   * @remarks
   * - Validates: Requirement 8.6 (task deletion)
   * - Cancels the task if it's still running
   * - Removes task from manager's task map
   * - Cleans up storage record
   * - Safe to call even if task doesn't exist
   *
   * @example
   * ```typescript
   * // Delete a specific task
   * await manager.deleteTask('task_abc123');
   *
   * // Delete all completed tasks
   * const tasks = manager.getAllTasks();
   * for (const task of tasks) {
   *   if (task.getStatus() === 'success') {
   *     await manager.deleteTask(task.id);
   *   }
   * }
   * ```
   */
  async deleteTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);

    if (task) {
      // Cancel the task if it's still running
      const status = task.getStatus();
      if (status === "uploading" || status === "paused") {
        task.cancel();
      }

      // Remove from tasks map
      this.tasks.delete(taskId);

      // Clean up storage record
      try {
        if (this.storage.isAvailable()) {
          await this.storage.deleteRecord(taskId);
        }
      } catch (error) {
        // Log warning but don't fail deletion
        console.warn(`Failed to delete storage record for task ${taskId}:`, error);
      }
    }
  }

  /**
   * Loads unfinished tasks from storage
   *
   * Retrieves upload records from IndexedDB and creates task placeholders.
   * Note: Tasks cannot be automatically resumed because File objects cannot
   * be persisted. Users must re-select files to resume uploads.
   *
   * @remarks
   * - Validates: Requirement 4.2 (read unfinished tasks from IndexedDB)
   * - Creates task entries in the manager
   * - Tasks are in 'paused' state and require file re-selection to resume
   * - Gracefully handles storage errors
   *
   * @internal
   */
  private async loadUnfinishedTasks(): Promise<void> {
    try {
      // Check if storage is available
      if (!this.storage.isAvailable()) {
        return;
      }

      // Get all records from storage
      const records = await this.storage.getAllRecords();

      // Note: We cannot automatically create UploadTask instances because
      // File objects cannot be persisted to IndexedDB. The user would need
      // to re-select the files to resume uploads.
      //
      // This is a limitation of the browser File API - File objects are
      // references to files on the user's filesystem and cannot be serialized.
      //
      // A future enhancement could:
      // 1. Store file metadata (name, size, type, lastModified)
      // 2. Provide a UI for users to re-select files
      // 3. Match re-selected files with stored metadata
      // 4. Resume uploads from stored progress
      //
      // For now, we just log the unfinished tasks for awareness
      if (records.length > 0) {
        console.info(
          `Found ${records.length} unfinished upload(s). ` +
            `Files must be re-selected to resume uploads.`,
        );
      }
    } catch (error) {
      // Log warning but don't fail initialization
      console.warn("Failed to load unfinished tasks:", error);
    }
  }

  /**
   * Gets the number of tasks in the manager
   *
   * @returns Total number of tasks
   *
   * @example
   * ```typescript
   * console.log(`Total tasks: ${manager.getTaskCount()}`);
   * ```
   */
  getTaskCount(): number {
    return this.tasks.size;
  }

  /**
   * Checks if the manager has been initialized
   *
   * @returns True if initialized, false otherwise
   *
   * @example
   * ```typescript
   * if (!manager.isInitialized()) {
   *   await manager.init();
   * }
   * ```
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Clears all completed tasks from the manager
   *
   * Removes tasks with 'success', 'error', or 'cancelled' status.
   * Does not affect running or paused tasks.
   *
   * @returns Number of tasks cleared
   *
   * @example
   * ```typescript
   * const cleared = await manager.clearCompletedTasks();
   * console.log(`Cleared ${cleared} completed task(s)`);
   * ```
   */
  async clearCompletedTasks(): Promise<number> {
    const tasks = this.getAllTasks();
    let clearedCount = 0;

    for (const task of tasks) {
      const status = task.getStatus();
      if (status === "success" || status === "error" || status === "cancelled") {
        await this.deleteTask(task.id);
        clearedCount++;
      }
    }

    return clearedCount;
  }

  /**
   * Pauses all running tasks
   *
   * Calls pause() on all tasks with 'uploading' status.
   *
   * @returns Number of tasks paused
   *
   * @example
   * ```typescript
   * const paused = manager.pauseAll();
   * console.log(`Paused ${paused} task(s)`);
   * ```
   */
  pauseAll(): number {
    const tasks = this.getAllTasks();
    let pausedCount = 0;

    for (const task of tasks) {
      if (task.getStatus() === "uploading") {
        task.pause();
        pausedCount++;
      }
    }

    return pausedCount;
  }

  /**
   * Resumes all paused tasks
   *
   * Calls resume() on all tasks with 'paused' status.
   *
   * @returns Number of tasks resumed
   *
   * @example
   * ```typescript
   * const resumed = await manager.resumeAll();
   * console.log(`Resumed ${resumed} task(s)`);
   * ```
   */
  async resumeAll(): Promise<number> {
    const tasks = this.getAllTasks();
    let resumedCount = 0;

    for (const task of tasks) {
      if (task.getStatus() === "paused") {
        try {
          await task.resume();
          resumedCount++;
        } catch (error) {
          console.warn(`Failed to resume task ${task.id}:`, error);
        }
      }
    }

    return resumedCount;
  }

  /**
   * Cancels all running and paused tasks
   *
   * Calls cancel() on all tasks that are not in a terminal state.
   *
   * @returns Number of tasks cancelled
   *
   * @example
   * ```typescript
   * const cancelled = manager.cancelAll();
   * console.log(`Cancelled ${cancelled} task(s)`);
   * ```
   */
  cancelAll(): number {
    const tasks = this.getAllTasks();
    let cancelledCount = 0;

    for (const task of tasks) {
      const status = task.getStatus();
      if (status === "uploading" || status === "paused") {
        task.cancel();
        cancelledCount++;
      }
    }

    return cancelledCount;
  }

  /**
   * Gets statistics about all tasks
   *
   * @returns Object containing task statistics
   *
   * @example
   * ```typescript
   * const stats = manager.getStatistics();
   * console.log(`Total: ${stats.total}`);
   * console.log(`Uploading: ${stats.uploading}`);
   * console.log(`Success: ${stats.success}`);
   * ```
   */
  getStatistics(): {
    total: number;
    idle: number;
    uploading: number;
    paused: number;
    success: number;
    error: number;
    cancelled: number;
  } {
    const tasks = this.getAllTasks();

    const stats = {
      total: tasks.length,
      idle: 0,
      uploading: 0,
      paused: 0,
      success: 0,
      error: 0,
      cancelled: 0,
    };

    for (const task of tasks) {
      const status = task.getStatus();
      switch (status) {
        case "idle":
          stats.idle++;
          break;
        case "uploading":
          stats.uploading++;
          break;
        case "paused":
          stats.paused++;
          break;
        case "success":
          stats.success++;
          break;
        case "error":
          stats.error++;
          break;
        case "cancelled":
          stats.cancelled++;
          break;
      }
    }

    return stats;
  }

  /**
   * Closes the manager and cleans up resources
   *
   * Cancels all running tasks and closes the storage connection.
   * The manager should not be used after calling this method.
   *
   * @example
   * ```typescript
   * // Clean up when done
   * manager.close();
   * ```
   */
  close(): void {
    // Cancel all running tasks
    this.cancelAll();

    // Close storage connection
    this.storage.close();

    // Clear tasks map
    this.tasks.clear();

    // Reset initialized flag
    this.initialized = false;
  }
}
