import { promises as fs } from "fs";
import { createReadStream, existsSync } from "fs";
import { join, dirname } from "path";
import { Readable } from "stream";
import type { StorageAdapter } from "./storage-adapter";

/**
 * Options for LocalStorageAdapter
 */
export interface LocalStorageAdapterOptions {
  /**
   * Base directory for storing chunks
   * @default './uploads'
   */
  baseDir?: string;
}

/**
 * Local filesystem storage adapter
 *
 * Stores chunks in the local filesystem using a directory structure
 * based on the first two characters of the chunk hash for better performance.
 *
 * Directory structure: baseDir/ab/abcdef123456...
 */
export class LocalStorageAdapter implements StorageAdapter {
  private baseDir: string;
  private initialized = false;

  constructor(options: LocalStorageAdapterOptions = {}) {
    this.baseDir = options.baseDir || "./uploads";
  }

  /**
   * Initialize the storage adapter by creating the base directory
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await fs.mkdir(this.baseDir, { recursive: true });
      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize local storage: ${(error as Error).message}`);
    }
  }

  /**
   * Get the file path for a chunk hash
   * Uses the first two characters as a subdirectory for better performance
   */
  private getChunkPath(chunkHash: string): string {
    if (chunkHash.length < 2) {
      throw new Error("Chunk hash must be at least 2 characters long");
    }

    const subDir = chunkHash.substring(0, 2);
    return join(this.baseDir, subDir, chunkHash);
  }

  /**
   * Save a chunk to the local filesystem
   */
  async saveChunk(chunkHash: string, data: Buffer): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    const chunkPath = this.getChunkPath(chunkHash);
    const chunkDir = dirname(chunkPath);

    try {
      // Create subdirectory if it doesn't exist
      await fs.mkdir(chunkDir, { recursive: true });

      // Write chunk data to file
      await fs.writeFile(chunkPath, data);
    } catch (error) {
      throw new Error(`Failed to save chunk ${chunkHash}: ${(error as Error).message}`);
    }
  }

  /**
   * Get a chunk from the local filesystem
   */
  async getChunk(chunkHash: string): Promise<Buffer | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    const chunkPath = this.getChunkPath(chunkHash);

    try {
      const data = await fs.readFile(chunkPath);
      return data;
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return null;
      }
      throw new Error(`Failed to get chunk ${chunkHash}: ${error.message}`);
    }
  }

  /**
   * Check if a chunk exists in the local filesystem
   */
  async chunkExists(chunkHash: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    const chunkPath = this.getChunkPath(chunkHash);

    try {
      await fs.access(chunkPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if multiple chunks exist in the local filesystem
   */
  async chunksExist(chunkHashes: string[]): Promise<boolean[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const results = await Promise.all(chunkHashes.map((hash) => this.chunkExists(hash)));

    return results;
  }

  /**
   * Get a readable stream for a chunk
   */
  async getChunkStream(chunkHash: string): Promise<Readable | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    const chunkPath = this.getChunkPath(chunkHash);

    // Check if file exists synchronously for stream creation
    if (!existsSync(chunkPath)) {
      return null;
    }

    try {
      const stream = createReadStream(chunkPath);
      return stream;
    } catch (error) {
      throw new Error(
        `Failed to create stream for chunk ${chunkHash}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Delete a chunk from the local filesystem
   */
  async deleteChunk(chunkHash: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    const chunkPath = this.getChunkPath(chunkHash);

    try {
      await fs.unlink(chunkPath);
    } catch (error: any) {
      if (error.code === "ENOENT") {
        // File doesn't exist, consider it deleted
        return;
      }
      throw new Error(`Failed to delete chunk ${chunkHash}: ${error.message}`);
    }
  }

  /**
   * Clean up resources (no-op for local storage)
   */
  async cleanup(): Promise<void> {
    // No cleanup needed for local filesystem
    this.initialized = false;
  }
}
