/**
 * File metadata stored in the database
 */
export interface FileMetadata {
  /** Unique file identifier */
  fileId: string;

  /** Original filename */
  filename: string;

  /** File size in bytes */
  size: number;

  /** File MIME type */
  mimeType: string;

  /** File hash (MD5) */
  fileHash: string;

  /** Upload token for authentication */
  uploadToken: string;

  /** Negotiated chunk size */
  chunkSize: number;

  /** Total number of chunks */
  totalChunks: number;

  /** Number of uploaded chunks */
  uploadedChunks: number;

  /** Upload status */
  status: "pending" | "uploading" | "completed" | "failed";

  /** Creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;

  /** Completion timestamp (if completed) */
  completedAt?: Date;

  /** File access URL (if completed) */
  url?: string;
}

/**
 * Chunk entity stored in the database
 */
export interface ChunkEntity {
  /** Chunk hash (MD5) - primary key */
  chunkHash: string;

  /** Chunk size in bytes */
  size: number;

  /** Reference count (how many files use this chunk) */
  refCount: number;

  /** Creation timestamp */
  createdAt: Date;
}

/**
 * File-chunk relationship entity
 */
export interface FileChunkEntity {
  /** File ID */
  fileId: string;

  /** Chunk hash */
  chunkHash: string;

  /** Chunk index in the file (0-based) */
  chunkIndex: number;

  /** Creation timestamp */
  createdAt: Date;
}

/**
 * Options for creating a file
 */
export interface CreateFileOptions {
  filename: string;
  size: number;
  mimeType: string;
  fileHash: string;
  uploadToken: string;
  chunkSize: number;
  totalChunks: number;
}

/**
 * Options for updating file metadata
 */
export interface UpdateFileOptions {
  uploadedChunks?: number;
  status?: "pending" | "uploading" | "completed" | "failed";
  completedAt?: Date;
  url?: string;
  fileHash?: string;
}

/**
 * Database adapter interface for file and chunk metadata
 *
 * Provides abstraction for different database backends (PostgreSQL, MySQL, MongoDB, etc.)
 */
export interface DatabaseAdapter {
  /**
   * Initialize the database adapter
   *
   * @returns Promise that resolves when initialization is complete
   */
  initialize(): Promise<void>;

  /**
   * Create a new file record
   *
   * @param fileId - Unique file identifier
   * @param options - File creation options
   * @returns Promise that resolves to the created file metadata
   */
  createFile(fileId: string, options: CreateFileOptions): Promise<FileMetadata>;

  /**
   * Get file metadata by file ID
   *
   * @param fileId - File identifier
   * @returns Promise that resolves to file metadata, or null if not found
   */
  getFile(fileId: string): Promise<FileMetadata | null>;

  /**
   * Get file metadata by file hash
   *
   * @param fileHash - File hash
   * @returns Promise that resolves to file metadata, or null if not found
   */
  getFileByHash(fileHash: string): Promise<FileMetadata | null>;

  /**
   * Get file metadata by upload token
   *
   * @param uploadToken - Upload token
   * @returns Promise that resolves to file metadata, or null if not found
   */
  getFileByToken(uploadToken: string): Promise<FileMetadata | null>;

  /**
   * Update file metadata
   *
   * @param fileId - File identifier
   * @param options - Update options
   * @returns Promise that resolves to the updated file metadata
   */
  updateFile(fileId: string, options: UpdateFileOptions): Promise<FileMetadata>;

  /**
   * Delete a file record
   *
   * @param fileId - File identifier
   * @returns Promise that resolves when the file is deleted
   */
  deleteFile(fileId: string): Promise<void>;

  /**
   * Create or update a chunk record
   * If the chunk already exists, increment its reference count
   *
   * @param chunkHash - Chunk hash
   * @param size - Chunk size in bytes
   * @returns Promise that resolves to the chunk entity
   */
  upsertChunk(chunkHash: string, size: number): Promise<ChunkEntity>;

  /**
   * Get chunk metadata by chunk hash
   *
   * @param chunkHash - Chunk hash
   * @returns Promise that resolves to chunk entity, or null if not found
   */
  getChunk(chunkHash: string): Promise<ChunkEntity | null>;

  /**
   * Check if a chunk exists
   *
   * @param chunkHash - Chunk hash
   * @returns Promise that resolves to true if the chunk exists
   */
  chunkExists(chunkHash: string): Promise<boolean>;

  /**
   * Check if multiple chunks exist
   *
   * @param chunkHashes - Array of chunk hashes
   * @returns Promise that resolves to an array of booleans
   */
  chunksExist(chunkHashes: string[]): Promise<boolean[]>;

  /**
   * Decrement chunk reference count and delete if count reaches 0
   *
   * @param chunkHash - Chunk hash
   * @returns Promise that resolves when the operation is complete
   */
  decrementChunkRef(chunkHash: string): Promise<void>;

  /**
   * Create a file-chunk relationship
   *
   * @param fileId - File identifier
   * @param chunkHash - Chunk hash
   * @param chunkIndex - Chunk index in the file
   * @returns Promise that resolves to the created relationship
   */
  createFileChunk(fileId: string, chunkHash: string, chunkIndex: number): Promise<FileChunkEntity>;

  /**
   * Get all chunks for a file, ordered by chunk index
   *
   * @param fileId - File identifier
   * @returns Promise that resolves to an array of file-chunk relationships
   */
  getFileChunks(fileId: string): Promise<FileChunkEntity[]>;

  /**
   * Get chunk hashes for a file, ordered by chunk index
   *
   * @param fileId - File identifier
   * @returns Promise that resolves to an array of chunk hashes
   */
  getFileChunkHashes(fileId: string): Promise<string[]>;

  /**
   * Delete all file-chunk relationships for a file
   *
   * @param fileId - File identifier
   * @returns Promise that resolves when the relationships are deleted
   */
  deleteFileChunks(fileId: string): Promise<void>;

  /**
   * Execute a transaction
   *
   * @param callback - Transaction callback
   * @returns Promise that resolves to the callback result
   */
  transaction<T>(callback: () => Promise<T>): Promise<T>;

  /**
   * Clean up resources used by the database adapter
   *
   * @returns Promise that resolves when cleanup is complete
   */
  cleanup(): Promise<void>;
}
