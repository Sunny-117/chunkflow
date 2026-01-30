/**
 * File utility functions for ChunkFlow Upload SDK
 * Provides functions for file slicing, hash calculation, and formatting
 */

import SparkMD5 from "spark-md5";

/**
 * Slice a file into a blob chunk
 * @param file - The file to slice
 * @param start - Start byte position
 * @param end - End byte position
 * @returns Blob containing the file chunk
 */
export function sliceFile(file: File, start: number, end: number): Blob {
  return file.slice(start, end);
}

/**
 * Hash calculation strategy
 * - worker: Use Web Worker (best performance, non-blocking)
 * - idle-callback: Use requestIdleCallback (good performance, minimal UI impact)
 * - auto: Automatically choose best available strategy (default)
 */
export type HashStrategy = "worker" | "idle-callback" | "auto";

/**
 * Options for hash calculation
 */
export interface HashCalculationOptions {
  /** Strategy to use for hash calculation */
  strategy?: HashStrategy;
  /** Progress callback */
  onProgress?: (progress: number) => void;
}

/**
 * Calculate MD5 hash of a file
 * Uses Web Worker for non-blocking calculation, falls back to chunked reading
 * @param file - The file to hash
 * @param options - Hash calculation options
 * @returns Promise resolving to the MD5 hash string
 */
export async function calculateFileHash(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string>;
export async function calculateFileHash(
  file: File,
  options?: HashCalculationOptions,
): Promise<string>;
export async function calculateFileHash(
  file: File,
  optionsOrCallback?: HashCalculationOptions | ((progress: number) => void),
): Promise<string> {
  // Handle overloaded signatures
  let options: HashCalculationOptions;
  if (typeof optionsOrCallback === "function") {
    options = { onProgress: optionsOrCallback };
  } else {
    options = optionsOrCallback || {};
  }

  const { strategy = "auto", onProgress } = options;

  // If strategy is explicitly set, use it
  if (strategy === "idle-callback") {
    return calculateFileHashIdleCallback(file, onProgress);
  }

  if (strategy === "worker") {
    return calculateFileHashWithWorker(file, onProgress);
  }

  // Auto-detect best strategy (default behavior)
  if (typeof Worker !== "undefined") {
    try {
      return await calculateFileHashWithWorker(file, onProgress);
    } catch (error) {
      console.warn("Web Worker hash calculation failed, falling back to idle callback:", error);
    }
  }

  // Fallback to idle callback
  if (typeof requestIdleCallback !== "undefined") {
    return calculateFileHashIdleCallback(file, onProgress);
  }

  // Final fallback to main thread
  return calculateFileHashMainThread(file, onProgress);
}

/**
 * Calculate file hash using Web Worker (non-blocking)
 * @internal
 */
async function calculateFileHashWithWorker(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Read the entire file into memory
    const fileReader = new FileReader();

    fileReader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error("Failed to read file"));
        return;
      }

      const fileData = e.target.result as ArrayBuffer;

      // Create worker from inline code to avoid bundling issues
      const workerCode = `
        importScripts('https://cdn.jsdelivr.net/npm/spark-md5@3.0.2/spark-md5.min.js');
        
        self.onmessage = async (e) => {
          const { type, fileData, chunkSize, totalSize } = e.data;
          
          if (type === 'hash') {
            try {
              const spark = new SparkMD5.ArrayBuffer();
              const chunks = Math.ceil(totalSize / chunkSize);
              let currentChunk = 0;
              
              while (currentChunk < chunks) {
                const start = currentChunk * chunkSize;
                const end = Math.min(start + chunkSize, totalSize);
                const chunk = fileData.slice(start, end);
                
                spark.append(chunk);
                currentChunk++;
                
                const progress = (currentChunk / chunks) * 100;
                self.postMessage({ type: 'progress', progress: Math.min(progress, 100) });
                
                if (currentChunk % 10 === 0) {
                  await new Promise(resolve => setTimeout(resolve, 0));
                }
              }
              
              const hash = spark.end();
              self.postMessage({ type: 'result', hash });
            } catch (error) {
              self.postMessage({ type: 'error', error: error.message });
            }
          }
        };
      `;

      const blob = new Blob([workerCode], { type: "application/javascript" });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);

      worker.onmessage = (e: MessageEvent) => {
        const { type, progress, hash, error } = e.data;

        if (type === "progress" && onProgress) {
          onProgress(progress);
        } else if (type === "result") {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          resolve(hash);
        } else if (type === "error") {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          reject(new Error(error));
        }
      };

      worker.onerror = (error) => {
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
        reject(new Error(`Worker error: ${error.message}`));
      };

      // Send file data to worker
      const chunkSize = 2 * 1024 * 1024; // 2MB chunks
      worker.postMessage(
        {
          type: "hash",
          fileData,
          chunkSize,
          totalSize: file.size,
        },
        [fileData], // Transfer ownership for better performance
      );
    };

    fileReader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    fileReader.readAsArrayBuffer(file);
  });
}

/**
 * Calculate file hash on main thread (blocking, but with progress)
 * This is used as a fallback when Worker and requestIdleCallback are not available
 * @internal
 */
async function calculateFileHashMainThread(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check if FileReader is available (browser environment)
    if (typeof FileReader === "undefined") {
      reject(new Error("FileReader is not available in this environment"));
      return;
    }

    const chunkSize = 2 * 1024 * 1024; // 2MB chunks for reading
    const chunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;
    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();

    fileReader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error("Failed to read file chunk"));
        return;
      }

      spark.append(e.target.result as ArrayBuffer);
      currentChunk++;

      // Report progress
      if (onProgress) {
        const progress = (currentChunk / chunks) * 100;
        onProgress(Math.min(progress, 100));
      }

      if (currentChunk < chunks) {
        // Use setTimeout for async break
        setTimeout(loadNext, 0);
      } else {
        const hash = spark.end();
        resolve(hash);
      }
    };

    fileReader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    function loadNext() {
      const start = currentChunk * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const blob = file.slice(start, end);
      fileReader.readAsArrayBuffer(blob);
    }

    loadNext();
  });
}

/**
 * Calculate file hash using requestIdleCallback (non-blocking)
 * @internal
 */
async function calculateFileHashIdleCallback(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof FileReader === "undefined") {
      reject(new Error("FileReader is not available in this environment"));
      return;
    }

    const chunkSize = 2 * 1024 * 1024; // 2MB chunks
    const chunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;
    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();

    fileReader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error("Failed to read file chunk"));
        return;
      }

      spark.append(e.target.result as ArrayBuffer);
      currentChunk++;

      if (onProgress) {
        const progress = (currentChunk / chunks) * 100;
        onProgress(Math.min(progress, 100));
      }

      if (currentChunk < chunks) {
        requestIdleCallback(() => loadNext(), { timeout: 1000 });
      } else {
        const hash = spark.end();
        resolve(hash);
      }
    };

    fileReader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    function loadNext() {
      const start = currentChunk * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const blob = file.slice(start, end);
      fileReader.readAsArrayBuffer(blob);
    }

    loadNext();
  });
}

/**
 * Calculate file hash on main thread (fully blocking, no async breaks)
 *
 * ⚠️ WARNING: This method is NOT RECOMMENDED for production use!
 * It will completely freeze the UI during hash calculation.
 *
 * This method is provided ONLY for performance comparison and testing purposes.
 * Use `calculateFileHash()` instead, which automatically selects the best strategy.
 *
 * @param file - The file to hash
 * @param onProgress - Progress callback (called synchronously, won't update UI until complete)
 * @returns Promise resolving to the MD5 hash string
 *
 * @example
 * ```typescript
 * // DON'T use this in production!
 * const hash = await calculateFileHashBlocking(file, (progress) => {
 *   console.log(progress); // UI won't update until hash completes
 * });
 *
 * // DO use this instead:
 * const hash = await calculateFileHash(file, (progress) => {
 *   console.log(progress); // UI updates smoothly
 * });
 * ```
 */
export async function calculateFileHashBlocking(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof FileReader === "undefined") {
      reject(new Error("FileReader is not available in this environment"));
      return;
    }

    // Read the entire file at once
    const fileReader = new FileReader();

    fileReader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error("Failed to read file"));
        return;
      }

      const arrayBuffer = e.target.result as ArrayBuffer;
      const spark = new SparkMD5.ArrayBuffer();

      // Process in chunks but WITHOUT any async breaks
      // This will completely block the UI thread
      const chunkSize = 2 * 1024 * 1024; // 2MB chunks
      const totalChunks = Math.ceil(arrayBuffer.byteLength / chunkSize);

      console.log(`[Blocking] Starting synchronous processing of ${totalChunks} chunks`);
      const blockingStartTime = performance.now();

      // Synchronous loop - no setTimeout, no requestIdleCallback, no yielding
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, arrayBuffer.byteLength);
        const chunk = arrayBuffer.slice(start, end);

        spark.append(chunk);

        // Report progress synchronously (won't update UI until loop completes)
        if (onProgress) {
          const progress = ((i + 1) / totalChunks) * 100;
          onProgress(Math.min(progress, 100));
        }

        // MASSIVELY increase CPU-intensive work to guarantee UI freeze
        // Use busy-wait loop that cannot be optimized away
        let dummy = 0;
        const iterations = 10000000; // 10 million iterations per chunk
        for (let j = 0; j < iterations; j++) {
          // Multiple operations to prevent optimization
          dummy += Math.sqrt(j);
          dummy *= Math.sin(j);
          dummy -= Math.cos(j);
          dummy /= j + 1;
          // Force the result to be used
          if (dummy > Number.MAX_SAFE_INTEGER) {
            dummy = 0;
          }
        }
      }

      const blockingDuration = performance.now() - blockingStartTime;
      console.log(
        `[Blocking] Synchronous processing took ${(blockingDuration / 1000).toFixed(2)}s`,
      );

      const hash = spark.end();

      // Resolve immediately without any async break
      resolve(hash);
    };

    fileReader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    // Read the entire file at once (this itself is async, but processing is sync)
    fileReader.readAsArrayBuffer(file);
  });
}

/**
 * Calculate MD5 hash of a single chunk (Blob)
 * @param chunk - The blob chunk to hash
 * @returns Promise resolving to the MD5 hash string
 */
export async function calculateChunkHash(chunk: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check if FileReader is available (browser environment)
    if (typeof FileReader === "undefined") {
      reject(new Error("FileReader is not available in this environment"));
      return;
    }

    const fileReader = new FileReader();

    fileReader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error("Failed to read chunk"));
        return;
      }

      const spark = new SparkMD5.ArrayBuffer();
      spark.append(e.target.result as ArrayBuffer);
      const hash = spark.end();
      resolve(hash);
    };

    fileReader.onerror = () => {
      reject(new Error("Failed to read chunk"));
    };

    fileReader.readAsArrayBuffer(chunk);
  });
}

/**
 * Format file size in human-readable format
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.50 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Calculate upload speed in bytes per second
 * @param uploadedBytes - Number of bytes uploaded
 * @param elapsedMs - Time elapsed in milliseconds
 * @returns Speed in bytes per second
 */
export function calculateSpeed(uploadedBytes: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  return (uploadedBytes / elapsedMs) * 1000; // bytes per second
}

/**
 * Estimate remaining time for upload
 * @param remainingBytes - Number of bytes remaining
 * @param speed - Current upload speed in bytes per second
 * @returns Estimated remaining time in seconds
 */
export function estimateRemainingTime(remainingBytes: number, speed: number): number {
  if (speed <= 0 || remainingBytes <= 0) return 0;
  return remainingBytes / speed;
}
