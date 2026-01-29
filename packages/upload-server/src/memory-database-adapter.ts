import type {
  DatabaseAdapter,
  FileMetadata,
  ChunkEntity,
  FileChunkEntity,
  CreateFileOptions,
  UpdateFileOptions,
} from "./database-adapter";

/**
 * In-memory database adapter for testing and development
 *
 * This adapter stores all data in memory and is useful for:
 * - Unit testing without database dependencies
 * - Development and prototyping
 * - Simple deployments that don't require persistence
 */
export class MemoryDatabaseAdapter implements DatabaseAdapter {
  private files: Map<string, FileMetadata> = new Map();
  private chunks: Map<string, ChunkEntity> = new Map();
  private fileChunks: Map<string, FileChunkEntity[]> = new Map();

  async initialize(): Promise<void> {
    // No initialization needed for in-memory adapter
  }

  async createFile(fileId: string, options: CreateFileOptions): Promise<FileMetadata> {
    if (this.files.has(fileId)) {
      throw new Error(`File ${fileId} already exists`);
    }

    const now = new Date();
    const file: FileMetadata = {
      fileId,
      filename: options.filename,
      size: options.size,
      mimeType: options.mimeType,
      fileHash: options.fileHash,
      uploadToken: options.uploadToken,
      chunkSize: options.chunkSize,
      totalChunks: options.totalChunks,
      uploadedChunks: 0,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    this.files.set(fileId, file);
    return { ...file };
  }

  async getFile(fileId: string): Promise<FileMetadata | null> {
    const file = this.files.get(fileId);
    return file ? { ...file } : null;
  }

  async getFileByHash(fileHash: string): Promise<FileMetadata | null> {
    for (const file of this.files.values()) {
      if (file.fileHash === fileHash) {
        return { ...file };
      }
    }
    return null;
  }

  async getFileByToken(uploadToken: string): Promise<FileMetadata | null> {
    for (const file of this.files.values()) {
      if (file.uploadToken === uploadToken) {
        return { ...file };
      }
    }
    return null;
  }

  async updateFile(fileId: string, options: UpdateFileOptions): Promise<FileMetadata> {
    const file = this.files.get(fileId);
    if (!file) {
      throw new Error(`File ${fileId} not found`);
    }

    const updated: FileMetadata = {
      ...file,
      ...options,
      updatedAt: new Date(),
    };

    this.files.set(fileId, updated);
    return { ...updated };
  }

  async deleteFile(fileId: string): Promise<void> {
    this.files.delete(fileId);
  }

  async upsertChunk(chunkHash: string, size: number): Promise<ChunkEntity> {
    const existing = this.chunks.get(chunkHash);

    if (existing) {
      // Increment reference count
      const updated: ChunkEntity = {
        ...existing,
        refCount: existing.refCount + 1,
      };
      this.chunks.set(chunkHash, updated);
      return { ...updated };
    }

    // Create new chunk
    const chunk: ChunkEntity = {
      chunkHash,
      size,
      refCount: 1,
      createdAt: new Date(),
    };

    this.chunks.set(chunkHash, chunk);
    return { ...chunk };
  }

  async getChunk(chunkHash: string): Promise<ChunkEntity | null> {
    const chunk = this.chunks.get(chunkHash);
    return chunk ? { ...chunk } : null;
  }

  async chunkExists(chunkHash: string): Promise<boolean> {
    return this.chunks.has(chunkHash);
  }

  async chunksExist(chunkHashes: string[]): Promise<boolean[]> {
    return chunkHashes.map((hash) => this.chunks.has(hash));
  }

  async decrementChunkRef(chunkHash: string): Promise<void> {
    const chunk = this.chunks.get(chunkHash);
    if (!chunk) {
      return;
    }

    if (chunk.refCount <= 1) {
      // Delete chunk if reference count reaches 0
      this.chunks.delete(chunkHash);
    } else {
      // Decrement reference count
      const updated: ChunkEntity = {
        ...chunk,
        refCount: chunk.refCount - 1,
      };
      this.chunks.set(chunkHash, updated);
    }
  }

  async createFileChunk(
    fileId: string,
    chunkHash: string,
    chunkIndex: number,
  ): Promise<FileChunkEntity> {
    const fileChunk: FileChunkEntity = {
      fileId,
      chunkHash,
      chunkIndex,
      createdAt: new Date(),
    };

    const fileChunks = this.fileChunks.get(fileId) || [];
    fileChunks.push(fileChunk);
    this.fileChunks.set(fileId, fileChunks);

    return { ...fileChunk };
  }

  async getFileChunks(fileId: string): Promise<FileChunkEntity[]> {
    const fileChunks = this.fileChunks.get(fileId) || [];
    // Sort by chunk index
    return fileChunks
      .slice()
      .sort((a, b) => a.chunkIndex - b.chunkIndex)
      .map((fc) => ({ ...fc }));
  }

  async getFileChunkHashes(fileId: string): Promise<string[]> {
    const fileChunks = await this.getFileChunks(fileId);
    return fileChunks.map((fc) => fc.chunkHash);
  }

  async deleteFileChunks(fileId: string): Promise<void> {
    this.fileChunks.delete(fileId);
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    // For in-memory adapter, just execute the callback
    // In a real database adapter, this would start a transaction
    return callback();
  }

  async cleanup(): Promise<void> {
    this.files.clear();
    this.chunks.clear();
    this.fileChunks.clear();
  }
}
