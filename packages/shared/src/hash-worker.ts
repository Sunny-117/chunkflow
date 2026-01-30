/**
 * Web Worker for calculating file hashes
 * Runs hash calculation in a separate thread to avoid blocking the main thread
 */

import SparkMD5 from "spark-md5";

interface HashMessage {
  type: "hash";
  fileData: ArrayBuffer;
  chunkSize: number;
  totalSize: number;
}

interface ProgressMessage {
  type: "progress";
  progress: number;
}

interface ResultMessage {
  type: "result";
  hash: string;
}

interface ErrorMessage {
  type: "error";
  error: string;
}

type WorkerMessage = HashMessage;
// WorkerResponse type is used for type safety in postMessage calls
export type WorkerResponse = ProgressMessage | ResultMessage | ErrorMessage;

// Listen for messages from the main thread
self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type, fileData, chunkSize, totalSize } = e.data;

  if (type === "hash") {
    try {
      const spark = new SparkMD5.ArrayBuffer();
      const chunks = Math.ceil(totalSize / chunkSize);
      let currentChunk = 0;

      // Process the file data in chunks
      while (currentChunk < chunks) {
        const start = currentChunk * chunkSize;
        const end = Math.min(start + chunkSize, totalSize);
        const chunk = fileData.slice(start, end);

        spark.append(chunk);
        currentChunk++;

        // Report progress
        const progress = (currentChunk / chunks) * 100;
        self.postMessage({
          type: "progress",
          progress: Math.min(progress, 100),
        } as ProgressMessage);

        // Yield to allow other operations (simulate non-blocking)
        if (currentChunk % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      const hash = spark.end();

      // Send result back to main thread
      self.postMessage({
        type: "result",
        hash,
      } as ResultMessage);
    } catch (error) {
      // Send error back to main thread
      self.postMessage({
        type: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      } as ErrorMessage);
    }
  }
};
