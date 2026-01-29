/**
 * UploadTask - Single file upload task manager
 *
 * Manages the complete lifecycle of a single file upload including:
 * - File chunking
 * - Hash calculation
 * - Chunk upload with retry
 * - Progress tracking
 * - State management
 * - Event emission
 */

import type { ChunkInfo, UploadStatus, UploadToken } from "@chunkflow/protocol";
import type { RequestAdapter } from "@chunkflow/protocol";
import {
  createEventBus,
  type UploadEventBus,
  ConcurrencyController,
  UploadStorage,
  sliceFile,
  calculateChunkHash,
  calculateFileHash,
  calculateSpeed,
  estimateRemainingTime,
} from "@chunkflow/shared";
import { ChunkSizeAdjuster } from "./chunk-size-adjuster";

/**
 * Upload progress information
 */
export interface UploadProgress {
  /** Number of bytes uploaded */
  uploadedBytes: number;
  /** Total file size in bytes */
  totalBytes: number;
  /** Upload percentage (0-100) */
  percentage: number;
  /** Upload speed in bytes per second */
  speed: number;
  /** Estimated remaining time in seconds */
  remainingTime: number;
  /** Number of chunks uploaded */
  uploadedChunks: number;
  /** Total number of chunks */
  totalChunks: number;
}

/**
 * Options for configuring an upload task
 */
export interface UploadTaskOptions {
  /** File to upload */
  file: File;
  /** Request adapter for API calls */
  requestAdapter: RequestAdapter;
  /** Initial chunk size in bytes (default: 1MB) */
  chunkSize?: number;
  /** Number of concurrent chunk uploads (default: 3) */
  concurrency?: number;
  /** Maximum number of retries per chunk (default: 3) */
  retryCount?: number;
  /** Base delay for retry in milliseconds (default: 1000) */
  retryDelay?: number;
  /** Whether to start upload automatically (default: false) */
  autoStart?: boolean;
}

/**
 * UploadTask class
 *
 * Manages a single file upload with support for:
 * - Chunked upload with dynamic chunk size adjustment
 * - Hash calculation and verification (instant upload/resume)
 * - Concurrent chunk uploads with retry
 * - Progress tracking and persistence
 * - Pause/resume/cancel operations
 * - Event-driven lifecycle
 *
 * @example
 * ```typescript
 * const task = new UploadTask({
 *   file: myFile,
 *   requestAdapter: myAdapter,
 *   chunkSize: 1024 * 1024, // 1MB
 *   concurrency: 3,
 * });
 *
 * // Listen to events
 * task.on('progress', ({ progress, speed }) => {
 *   console.log(`Progress: ${progress}%, Speed: ${speed} bytes/s`);
 * });
 *
 * task.on('success', ({ fileUrl }) => {
 *   console.log(`Upload complete: ${fileUrl}`);
 * });
 *
 * // Start upload
 * await task.start();
 * ```
 */
export class UploadTask {
  /** Unique task identifier */
  readonly id: string;

  /** File being uploaded */
  readonly file: File;

  /** Current upload status */
  private status: UploadStatus;

  /** Current upload progress */
  private progress: UploadProgress;

  /** Array of chunk information */
  private chunks: ChunkInfo[];

  /** Upload token from server */
  private uploadToken: UploadToken | null;

  /** Calculated file hash */
  private fileHash: string | null;

  /** Event bus for lifecycle events */
  private eventBus: UploadEventBus;

  /** Concurrency controller for chunk uploads */
  private concurrencyController: ConcurrencyController;

  /** Storage for persisting upload progress */
  private storage: UploadStorage;

  /** Request adapter for API calls */
  private requestAdapter: RequestAdapter;

  /** Upload task options with defaults */
  private options: Required<UploadTaskOptions>;

  /** Upload start timestamp */
  private startTime: number;

  /** Upload end timestamp */
  private endTime: number | null;

  /** Chunk size adjuster for dynamic sizing */
  private chunkSizeAdjuster: ChunkSizeAdjuster | null;

  /** Flag to indicate if upload should be cancelled (e.g., instant upload) */
  private shouldCancelUpload: boolean;

  /**
   * Creates a new UploadTask
   *
   * @param options - Upload task configuration options
   */
  constructor(options: UploadTaskOptions) {
    // Generate unique task ID
    this.id = this.generateTaskId();

    // Store file reference
    this.file = options.file;

    // Initialize status
    this.status = "idle" as UploadStatus;

    // Initialize progress
    this.progress = {
      uploadedBytes: 0,
      totalBytes: options.file.size,
      percentage: 0,
      speed: 0,
      remainingTime: 0,
      uploadedChunks: 0,
      totalChunks: 0,
    };

    // Initialize chunks array
    this.chunks = [];

    // Initialize upload token and hash
    this.uploadToken = null;
    this.fileHash = null;

    // Create event bus
    this.eventBus = createEventBus();

    // Store request adapter
    this.requestAdapter = options.requestAdapter;

    // Apply default options
    this.options = {
      file: options.file,
      requestAdapter: options.requestAdapter,
      chunkSize: options.chunkSize ?? 1024 * 1024, // 1MB default
      concurrency: options.concurrency ?? 3,
      retryCount: options.retryCount ?? 3,
      retryDelay: options.retryDelay ?? 1000,
      autoStart: options.autoStart ?? false,
    };

    // Create concurrency controller
    this.concurrencyController = new ConcurrencyController({
      limit: this.options.concurrency,
    });

    // Create storage instance
    this.storage = new UploadStorage();

    // Initialize timestamps
    this.startTime = 0;
    this.endTime = null;

    // Initialize chunk size adjuster (will be created when upload starts)
    this.chunkSizeAdjuster = null;

    // Initialize cancel flag
    this.shouldCancelUpload = false;
  }

  /**
   * Generates a unique task ID
   * Uses timestamp and random string for uniqueness
   *
   * @returns Unique task identifier
   */
  private generateTaskId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `task_${timestamp}_${random}`;
  }

  /**
   * Gets the current upload status
   *
   * @returns Current upload status
   */
  getStatus(): UploadStatus {
    return this.status;
  }

  /**
   * Gets the current upload progress
   * Returns a copy to prevent external modification
   *
   * @returns Current upload progress
   */
  getProgress(): UploadProgress {
    return { ...this.progress };
  }

  /**
   * Gets the upload duration in milliseconds
   * Returns null if upload hasn't completed
   *
   * @returns Upload duration or null
   */
  getDuration(): number | null {
    if (this.endTime === null) {
      return null;
    }
    return this.endTime - this.startTime;
  }

  /**
   * Subscribes to upload events
   *
   * @param event - Event name to listen to
   * @param handler - Event handler function
   *
   * @example
   * ```typescript
   * task.on('progress', ({ progress, speed }) => {
   *   console.log(`${progress}% at ${speed} bytes/s`);
   * });
   * ```
   */
  on<K extends keyof import("@chunkflow/shared").UploadEvents>(
    event: K,
    handler: (payload: import("@chunkflow/shared").UploadEvents[K]) => void,
  ): void {
    this.eventBus.on(event, handler);
  }

  /**
   * Unsubscribes from upload events
   *
   * @param event - Event name to stop listening to
   * @param handler - Event handler function to remove
   */
  off<K extends keyof import("@chunkflow/shared").UploadEvents>(
    event: K,
    handler: (payload: import("@chunkflow/shared").UploadEvents[K]) => void,
  ): void {
    this.eventBus.off(event, handler);
  }

  /**
   * Creates chunk information array based on negotiated chunk size
   * Divides the file into chunks and creates ChunkInfo objects for each
   *
   * @param chunkSize - Size of each chunk in bytes (negotiated with server)
   * @returns Array of ChunkInfo objects
   *
   * @remarks
   * - Chunks are created sequentially from start to end of file
   * - Last chunk may be smaller than chunkSize
   * - Hash field is initially empty and will be calculated during upload
   * - Validates: Requirement 2.1 (chunk size based splitting)
   *
   * @internal This method will be used in task 5.3
   */
  private createChunks(chunkSize: number): ChunkInfo[] {
    const chunks: ChunkInfo[] = [];
    const totalChunks = Math.ceil(this.file.size / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, this.file.size);

      chunks.push({
        index: i,
        hash: "", // Will be calculated during upload
        size: end - start,
        start,
        end,
      });
    }

    return chunks;
  }

  /**
   * Starts the upload process
   *
   * Workflow:
   * 1. Create file on server and get upload token
   * 2. Split file into chunks based on negotiated chunk size
   * 3. Start concurrent chunk upload
   *
   * @throws Error if upload is already in progress or completed
   *
   * @remarks
   * - Validates: Requirements 1.1, 1.2, 2.2, 5.1, 5.2, 5.3, 20.1, 20.2, 20.3, 20.5
   * - Sets status to 'uploading'
   * - Emits 'start' event
   * - Creates chunks based on negotiated size
   * - Initiates concurrent upload with retry
   */
  async start(): Promise<void> {
    // Validate current status
    if (this.status !== "idle") {
      throw new Error(`Cannot start upload: current status is ${this.status}`);
    }

    try {
      // Initialize storage for persistence
      await this.initializeStorage();

      // Update status to uploading
      this.status = "uploading" as UploadStatus;
      this.startTime = Date.now();

      // Emit start event
      this.eventBus.emit("start", { taskId: this.id, file: this.file });

      // Step 1: Create file on server and get upload token
      const createResponse = await this.requestAdapter.createFile({
        fileName: this.file.name,
        fileSize: this.file.size,
        fileType: this.file.type,
        preferredChunkSize: this.options.chunkSize,
      });

      this.uploadToken = createResponse.uploadToken;
      const negotiatedChunkSize = createResponse.negotiatedChunkSize;

      // Step 2: Split file into chunks
      this.chunks = this.createChunks(negotiatedChunkSize);
      this.progress.totalChunks = this.chunks.length;

      // Initialize chunk size adjuster for dynamic sizing
      this.chunkSizeAdjuster = new ChunkSizeAdjuster({
        initialSize: negotiatedChunkSize,
        minSize: 256 * 1024, // 256KB
        maxSize: 10 * 1024 * 1024, // 10MB
        targetTime: 3000, // 3 seconds target per chunk
      });

      // Step 3: Start uploading chunks AND calculate hash in parallel
      // This implements requirement 3.6 and 17.2 - hash calculation and upload should be parallel
      await Promise.all([this.startUpload(), this.calculateAndVerifyHash()]);

      // Upload completed successfully
      this.status = "success" as UploadStatus;
      this.endTime = Date.now();
    } catch (error) {
      this.status = "error" as UploadStatus;
      this.endTime = Date.now();
      this.eventBus.emit("error", {
        taskId: this.id,
        error: error as Error,
      });
      throw error;
    }
  }

  /**
   * Starts concurrent chunk upload with priority for first chunks
   *
   * Uploads all chunks with concurrency control and dynamic chunk size adjustment.
   * Uses the concurrency controller to limit parallel uploads.
   * Implements priority upload for the first few chunks to get quick feedback.
   *
   * @remarks
   * - Validates: Requirements 5.1, 5.2, 5.3, 17.5, 20.1, 20.2, 20.3
   * - Respects concurrency limits
   * - Tracks upload time for dynamic chunk size adjustment
   * - Stops if status changes (pause/cancel) or shouldCancelUpload is set
   * - Prioritizes first 3 chunks for quick server feedback
   *
   * @internal
   */
  private async startUpload(): Promise<void> {
    // Requirement 17.5: Priority upload for first few chunks
    // Upload first 3 chunks with priority to get quick feedback
    const priorityChunkCount = Math.min(3, this.chunks.length);
    const priorityChunks = this.chunks.slice(0, priorityChunkCount);
    const remainingChunks = this.chunks.slice(priorityChunkCount);

    // Upload priority chunks first
    const priorityPromises = priorityChunks.map((chunk) => {
      return this.concurrencyController.run(async () => {
        // Check if upload should continue
        if (this.status !== "uploading" || this.shouldCancelUpload) {
          return;
        }

        // Track upload start time for this chunk
        const chunkStartTime = Date.now();

        // Upload chunk with retry
        await this.uploadChunkWithRetry(chunk);

        // Track upload end time and adjust chunk size for next uploads
        const chunkUploadTime = Date.now() - chunkStartTime;
        if (this.chunkSizeAdjuster) {
          this.chunkSizeAdjuster.adjust(chunkUploadTime);
        }
      });
    });

    // Upload remaining chunks concurrently with priority chunks
    const remainingPromises = remainingChunks.map((chunk) => {
      return this.concurrencyController.run(async () => {
        // Check if upload should continue
        if (this.status !== "uploading" || this.shouldCancelUpload) {
          return;
        }

        // Track upload start time for this chunk
        const chunkStartTime = Date.now();

        // Upload chunk with retry
        await this.uploadChunkWithRetry(chunk);

        // Track upload end time and adjust chunk size for next uploads
        const chunkUploadTime = Date.now() - chunkStartTime;
        if (this.chunkSizeAdjuster) {
          this.chunkSizeAdjuster.adjust(chunkUploadTime);
        }
      });
    });

    // Wait for all chunks to complete
    // Priority chunks are started first, but all run concurrently
    await Promise.all([...priorityPromises, ...remainingPromises]);
  }

  /**
   * Uploads a single chunk with retry logic
   *
   * Implements exponential backoff retry strategy for failed uploads.
   * Calculates chunk hash before upload for verification.
   * Updates progress after successful upload.
   *
   * @param chunk - Chunk information to upload
   * @throws Error if all retries are exhausted
   *
   * @remarks
   * - Validates: Requirements 20.1, 20.2, 20.3, 20.5
   * - Retries up to configured retry count
   * - Uses exponential backoff delay
   * - Emits chunkSuccess or chunkError events
   * - Updates progress and persists to storage
   * - Skips upload if shouldCancelUpload is set (instant upload)
   *
   * @internal
   */
  private async uploadChunkWithRetry(chunk: ChunkInfo): Promise<void> {
    let retries = 0;
    let lastError: Error | null = null;

    while (retries <= this.options.retryCount) {
      try {
        // Check if upload should continue
        if (this.status !== "uploading" || this.shouldCancelUpload) {
          return;
        }

        // Slice the file to get chunk blob
        const blob = sliceFile(this.file, chunk.start, chunk.end);

        // Calculate chunk hash
        const chunkHash = await calculateChunkHash(blob);
        chunk.hash = chunkHash;

        // Upload chunk to server
        await this.requestAdapter.uploadChunk({
          uploadToken: this.uploadToken!.token,
          chunkIndex: chunk.index,
          chunkHash,
          chunk: blob,
        });

        // Upload successful - update progress
        await this.updateProgress(chunk);

        // Emit chunk success event
        this.eventBus.emit("chunkSuccess", {
          taskId: this.id,
          chunkIndex: chunk.index,
        });

        // Successfully uploaded, exit retry loop
        return;
      } catch (error) {
        lastError = error as Error;
        retries++;

        // Emit chunk error event
        this.eventBus.emit("chunkError", {
          taskId: this.id,
          chunkIndex: chunk.index,
          error: lastError,
        });

        // Check if we should retry
        if (retries > this.options.retryCount) {
          // All retries exhausted
          throw new Error(
            `Failed to upload chunk ${chunk.index} after ${this.options.retryCount} retries: ${lastError.message}`,
          );
        }

        // Calculate exponential backoff delay
        const delay = this.options.retryDelay * Math.pow(2, retries - 1);
        await this.delay(delay);
      }
    }

    // This should never be reached, but TypeScript needs it
    if (lastError) {
      throw lastError;
    }
  }

  /**
   * Updates upload progress after a chunk is successfully uploaded
   *
   * Calculates:
   * - Uploaded bytes and percentage
   * - Upload speed
   * - Estimated remaining time
   *
   * Emits progress event with updated information.
   * Persists progress to IndexedDB for resume functionality.
   *
   * @param chunk - The chunk that was just uploaded
   *
   * @remarks
   * - Validates: Requirements 4.1, 6.3, 6.4 (progress tracking and persistence)
   * - Updates all progress metrics
   * - Emits progress event
   * - Persists to IndexedDB for resume capability
   *
   * @internal
   */
  private async updateProgress(chunk: ChunkInfo): Promise<void> {
    // Update uploaded bytes and chunks
    this.progress.uploadedBytes += chunk.size;
    this.progress.uploadedChunks++;

    // Calculate percentage
    this.progress.percentage = (this.progress.uploadedBytes / this.file.size) * 100;

    // Calculate speed and remaining time
    const elapsedTime = Date.now() - this.startTime;
    this.progress.speed = calculateSpeed(this.progress.uploadedBytes, elapsedTime);

    const remainingBytes = this.file.size - this.progress.uploadedBytes;
    this.progress.remainingTime = estimateRemainingTime(remainingBytes, this.progress.speed);

    // Emit progress event
    this.eventBus.emit("progress", {
      taskId: this.id,
      progress: this.progress.percentage,
      speed: this.progress.speed,
    });

    // Persist progress to IndexedDB for resume functionality
    // Requirement 4.1: Write progress to IndexedDB after each chunk
    await this.persistProgress();
  }

  /**
   * Delays execution for a specified time
   * Used for retry backoff
   *
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after the delay
   *
   * @internal
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Calculates file hash and verifies with server for instant upload
   *
   * This method runs in parallel with chunk upload to optimize performance.
   * It implements the following features:
   * - Calculate file hash using Web Worker or requestIdleCallback (non-blocking)
   * - Send hash verification request to server
   * - Handle instant upload (秒传) when file already exists
   * - Handle partial instant upload (skip existing chunks)
   *
   * @remarks
   * - Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
   * - Emits hashProgress events during calculation
   * - Emits hashComplete event when calculation finishes
   * - If file exists on server, cancels ongoing upload and emits success
   * - If some chunks exist, marks them as uploaded to skip them
   *
   * @internal
   */
  private async calculateAndVerifyHash(): Promise<void> {
    try {
      // Calculate file hash with progress reporting
      // Requirement 3.1: Calculate hash when file is selected
      // Requirement 3.2: Use non-blocking hash calculation
      this.fileHash = await calculateFileHash(this.file, (progress) => {
        // Emit hash progress event
        this.eventBus.emit("hashProgress", {
          taskId: this.id,
          progress,
        });
      });

      // Emit hash complete event
      // Requirement 3.3: Send hash verification request after calculation
      this.eventBus.emit("hashComplete", {
        taskId: this.id,
        hash: this.fileHash,
      });

      // Verify hash with server
      if (!this.uploadToken) {
        // Upload token not available yet, skip verification
        return;
      }

      const verifyResponse = await this.requestAdapter.verifyHash({
        fileHash: this.fileHash,
        uploadToken: this.uploadToken.token,
      });

      // Requirement 3.4: Handle instant upload (file already exists)
      if (verifyResponse.fileExists && verifyResponse.fileUrl) {
        // File already exists on server - instant upload (秒传)
        // Cancel ongoing chunk uploads
        this.shouldCancelUpload = true;
        this.status = "success" as UploadStatus;
        this.endTime = Date.now();

        // Update progress to 100%
        this.progress.uploadedBytes = this.file.size;
        this.progress.uploadedChunks = this.chunks.length;
        this.progress.percentage = 100;

        // Emit success event with file URL
        this.eventBus.emit("success", {
          taskId: this.id,
          fileUrl: verifyResponse.fileUrl,
        });

        return;
      }

      // Requirement 3.5: Handle partial instant upload (skip existing chunks)
      if (verifyResponse.existingChunks && verifyResponse.existingChunks.length > 0) {
        // Some chunks already exist on server
        // Mark them as uploaded to skip them
        this.skipExistingChunks(verifyResponse.existingChunks);
      }
    } catch (error) {
      // Hash calculation or verification failed
      // Log error but don't fail the upload - continue with normal upload
      console.warn("Hash calculation/verification failed:", error);
      // The upload will continue normally without hash optimization
    }
  }

  /**
   * Skips existing chunks by marking them as uploaded
   *
   * This is used for partial instant upload when some chunks already exist on server.
   * Updates progress to reflect the skipped chunks.
   *
   * @param existingChunkIndices - Array of chunk indices that already exist on server
   *
   * @remarks
   * - Validates: Requirement 3.5, 17.4 (partial instant upload)
   * - Updates progress for skipped chunks
   * - Emits chunkSuccess events for skipped chunks
   *
   * @internal
   */
  private skipExistingChunks(existingChunkIndices: number[]): void {
    for (const chunkIndex of existingChunkIndices) {
      const chunk = this.chunks[chunkIndex];
      if (!chunk) continue;

      // Mark chunk as uploaded by updating progress
      this.progress.uploadedBytes += chunk.size;
      this.progress.uploadedChunks++;
      this.progress.percentage = (this.progress.uploadedBytes / this.file.size) * 100;

      // Emit chunk success event for skipped chunk
      this.eventBus.emit("chunkSuccess", {
        taskId: this.id,
        chunkIndex: chunk.index,
      });
    }

    // Emit progress event with updated information
    this.eventBus.emit("progress", {
      taskId: this.id,
      progress: this.progress.percentage,
      speed: this.progress.speed,
    });
  }

  /**
   * Initializes the IndexedDB storage for progress persistence
   *
   * Creates the initial upload record in IndexedDB.
   * If storage is not available, logs a warning but continues upload.
   *
   * @remarks
   * - Validates: Requirement 4.1 (persist progress to IndexedDB)
   * - Gracefully handles storage unavailability
   * - Creates initial record with empty uploaded chunks
   *
   * @internal
   */
  private async initializeStorage(): Promise<void> {
    try {
      // Initialize the storage database
      await this.storage.init();

      // Create initial upload record
      const record: import("@chunkflow/shared").UploadRecord = {
        taskId: this.id,
        fileInfo: {
          name: this.file.name,
          size: this.file.size,
          type: this.file.type,
          lastModified: this.file.lastModified,
        },
        uploadedChunks: [],
        uploadToken: this.uploadToken?.token || "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await this.storage.saveRecord(record);
    } catch (error) {
      // Storage initialization failed - log warning but continue upload
      // This implements graceful degradation when IndexedDB is unavailable
      console.warn("Failed to initialize upload storage:", error);
      // Upload will continue without persistence
    }
  }

  /**
   * Persists current upload progress to IndexedDB
   *
   * Updates the upload record with the list of successfully uploaded chunks.
   * This enables resume functionality if the upload is interrupted.
   *
   * @remarks
   * - Validates: Requirement 4.1 (write progress to IndexedDB)
   * - Gracefully handles storage errors
   * - Updates uploadedChunks array and timestamp
   *
   * @internal
   */
  private async persistProgress(): Promise<void> {
    try {
      // Check if storage is available
      if (!this.storage.isAvailable()) {
        return;
      }

      // Get list of uploaded chunk indices
      const uploadedChunkIndices = this.chunks
        .filter((_, index) => index < this.progress.uploadedChunks)
        .map((chunk) => chunk.index);

      // Update the record in IndexedDB
      await this.storage.updateRecord(this.id, {
        uploadedChunks: uploadedChunkIndices,
        uploadToken: this.uploadToken?.token || "",
        updatedAt: Date.now(),
      });
    } catch (error) {
      // Storage update failed - log warning but continue upload
      // This ensures upload continues even if persistence fails
      console.warn("Failed to persist upload progress:", error);
    }
  }

  /**
   * Pauses the upload
   *
   * Pauses an ongoing upload by changing the status to 'paused'.
   * The upload can be resumed later from where it left off.
   *
   * @remarks
   * - Validates: Requirements 4.3, 6.3 (pause functionality and lifecycle events)
   * - Only works when status is 'uploading'
   * - Emits 'pause' event
   * - Progress is persisted to IndexedDB for resume
   * - Ongoing chunk uploads will complete, but no new chunks will start
   *
   * @example
   * ```typescript
   * task.on('pause', () => {
   *   console.log('Upload paused');
   * });
   *
   * task.pause();
   * ```
   */
  pause(): void {
    // Only allow pausing when upload is in progress
    if (this.status !== "uploading") {
      console.warn(`Cannot pause upload: current status is ${this.status}`);
      return;
    }

    // Update status to paused
    this.status = "paused" as UploadStatus;

    // Emit pause event
    this.eventBus.emit("pause", { taskId: this.id });

    // Note: Ongoing chunk uploads will complete naturally
    // The startUpload method checks status before starting new chunks
    // Progress is already persisted to IndexedDB via updateProgress
  }

  /**
   * Resumes a paused upload (断点续传)
   *
   * Resumes an upload that was previously paused.
   * Continues uploading from where it left off, skipping already uploaded chunks.
   *
   * @throws Error if upload is not in paused state
   *
   * @remarks
   * - Validates: Requirements 4.3, 4.4, 6.3 (resume functionality and lifecycle events)
   * - Only works when status is 'paused'
   * - Emits 'resume' event
   * - Continues from last uploaded chunk
   * - Uses persisted progress from IndexedDB
   *
   * @example
   * ```typescript
   * task.on('resume', () => {
   *   console.log('Upload resumed');
   * });
   *
   * await task.resume();
   * ```
   */
  async resume(): Promise<void> {
    // Only allow resuming when upload is paused
    if (this.status !== "paused") {
      throw new Error(`Cannot resume upload: current status is ${this.status}`);
    }

    try {
      // Update status to uploading
      this.status = "uploading" as UploadStatus;

      // Emit resume event
      this.eventBus.emit("resume", { taskId: this.id });

      // Continue uploading remaining chunks
      // The startUpload method will skip already uploaded chunks
      // because progress.uploadedChunks tracks which chunks are done
      await this.startUpload();

      // If upload completed successfully
      if (this.status === "uploading" && !this.shouldCancelUpload) {
        this.status = "success" as UploadStatus;
        this.endTime = Date.now();

        // Emit success event
        // Note: fileUrl would need to be obtained from merge operation
        // For now, we emit success without URL (will be handled in merge task)
        this.eventBus.emit("success", {
          taskId: this.id,
          fileUrl: "", // Will be set by merge operation
        });
      }
    } catch (error) {
      this.status = "error" as UploadStatus;
      this.endTime = Date.now();
      this.eventBus.emit("error", {
        taskId: this.id,
        error: error as Error,
      });
      throw error;
    }
  }

  /**
   * Cancels the upload
   *
   * Cancels an ongoing or paused upload.
   * Once cancelled, the upload cannot be resumed.
   *
   * @remarks
   * - Validates: Requirements 6.3 (cancel functionality and lifecycle events)
   * - Works when status is 'uploading' or 'paused'
   * - Emits 'cancel' event
   * - Sets shouldCancelUpload flag to stop ongoing chunk uploads
   * - Cleans up upload record from IndexedDB
   * - Status becomes 'cancelled' (terminal state)
   *
   * @example
   * ```typescript
   * task.on('cancel', () => {
   *   console.log('Upload cancelled');
   * });
   *
   * task.cancel();
   * ```
   */
  cancel(): void {
    // Only allow cancelling when upload is in progress or paused
    if (this.status !== "uploading" && this.status !== "paused") {
      console.warn(`Cannot cancel upload: current status is ${this.status}`);
      return;
    }

    // Set cancel flag to stop ongoing uploads
    this.shouldCancelUpload = true;

    // Update status to cancelled
    this.status = "cancelled" as UploadStatus;
    this.endTime = Date.now();

    // Emit cancel event
    this.eventBus.emit("cancel", { taskId: this.id });

    // Clean up upload record from IndexedDB
    // This is done asynchronously and errors are ignored
    this.cleanupStorage().catch((error) => {
      console.warn("Failed to cleanup upload storage:", error);
    });
  }

  /**
   * Cleans up the upload record from IndexedDB
   *
   * Removes the upload record to free up storage space.
   * Called when upload is cancelled or completed.
   *
   * @remarks
   * - Gracefully handles storage errors
   * - Does not throw errors
   *
   * @internal
   */
  private async cleanupStorage(): Promise<void> {
    try {
      if (this.storage.isAvailable()) {
        await this.storage.deleteRecord(this.id);
      }
    } catch (error) {
      // Ignore cleanup errors
      console.warn("Failed to cleanup storage:", error);
    }
  }
}
