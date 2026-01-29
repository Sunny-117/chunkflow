import { Readable } from "stream";

/**
 * Storage adapter interface for chunk storage
 *
 * Provides abstraction for different storage backends (local filesystem, OSS, S3, etc.)
 */
export interface StorageAdapter {
  /**
   * Save a chunk to storage
   *
   * @param chunkHash - The hash of the chunk (used as identifier)
   * @param data - The chunk data as a Buffer
   * @returns Promise that resolves when the chunk is saved
   */
  saveChunk(chunkHash: string, data: Buffer): Promise<void>;

  /**
   * Get a chunk from storage
   *
   * @param chunkHash - The hash of the chunk to retrieve
   * @returns Promise that resolves to the chunk data, or null if not found
   */
  getChunk(chunkHash: string): Promise<Buffer | null>;

  /**
   * Check if a chunk exists in storage
   *
   * @param chunkHash - The hash of the chunk to check
   * @returns Promise that resolves to true if the chunk exists, false otherwise
   */
  chunkExists(chunkHash: string): Promise<boolean>;

  /**
   * Check if multiple chunks exist in storage
   *
   * @param chunkHashes - Array of chunk hashes to check
   * @returns Promise that resolves to an array of booleans indicating existence
   */
  chunksExist(chunkHashes: string[]): Promise<boolean[]>;

  /**
   * Get a readable stream for a chunk
   *
   * @param chunkHash - The hash of the chunk to stream
   * @returns Promise that resolves to a readable stream, or null if not found
   */
  getChunkStream(chunkHash: string): Promise<Readable | null>;

  /**
   * Delete a chunk from storage
   *
   * @param chunkHash - The hash of the chunk to delete
   * @returns Promise that resolves when the chunk is deleted
   */
  deleteChunk(chunkHash: string): Promise<void>;

  /**
   * Initialize the storage adapter
   *
   * @returns Promise that resolves when initialization is complete
   */
  initialize(): Promise<void>;

  /**
   * Clean up resources used by the storage adapter
   *
   * @returns Promise that resolves when cleanup is complete
   */
  cleanup(): Promise<void>;
}
