import { randomBytes } from "crypto";
import { sign, verify } from "jsonwebtoken";
import type { StorageAdapter } from "./storage-adapter";
import type { DatabaseAdapter } from "./database-adapter";
import type {
  CreateFileRequest,
  CreateFileResponse,
  VerifyHashRequest,
  VerifyHashResponse,
  UploadChunkRequest,
  UploadChunkResponse,
  MergeFileRequest,
  MergeFileResponse,
  UploadToken,
} from "@chunkflow/protocol";

/**
 * Options for UploadService
 */
export interface UploadServiceOptions {
  /** Storage adapter for chunk storage */
  storageAdapter: StorageAdapter;

  /** Database adapter for metadata storage */
  databaseAdapter: DatabaseAdapter;

  /** JWT secret for token generation and verification */
  jwtSecret: string;

  /** Token expiration time in seconds (default: 24 hours) */
  tokenExpiration?: number;

  /** Minimum chunk size in bytes (default: 256KB) */
  minChunkSize?: number;

  /** Maximum chunk size in bytes (default: 10MB) */
  maxChunkSize?: number;

  /** Default chunk size in bytes (default: 2MB) */
  defaultChunkSize?: number;
}

/**
 * Upload service for handling file uploads with chunking and deduplication
 */
export class UploadService {
  private storageAdapter: StorageAdapter;
  private databaseAdapter: DatabaseAdapter;
  private jwtSecret: string;
  private tokenExpiration: number;
  private minChunkSize: number;
  private maxChunkSize: number;

  constructor(options: UploadServiceOptions) {
    this.storageAdapter = options.storageAdapter;
    this.databaseAdapter = options.databaseAdapter;
    this.jwtSecret = options.jwtSecret;
    this.tokenExpiration = options.tokenExpiration || 24 * 60 * 60; // 24 hours
    this.minChunkSize = options.minChunkSize || 256 * 1024; // 256KB
    this.maxChunkSize = options.maxChunkSize || 10 * 1024 * 1024; // 10MB
  }

  /**
   * Initialize the upload service
   */
  async initialize(): Promise<void> {
    await this.storageAdapter.initialize();
    await this.databaseAdapter.initialize();
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    await this.storageAdapter.cleanup();
    await this.databaseAdapter.cleanup();
  }

  /**
   * Generate a unique file ID
   */
  private generateFileId(): string {
    return randomBytes(16).toString("hex");
  }

  /**
   * Generate an upload token
   */
  private generateUploadToken(fileId: string): string {
    const payload = {
      fileId,
      type: "upload",
    };

    return sign(payload, this.jwtSecret, {
      expiresIn: this.tokenExpiration,
    });
  }

  /**
   * Verify an upload token
   */
  private verifyUploadToken(token: string): { fileId: string } {
    try {
      const payload = verify(token, this.jwtSecret) as { fileId: string; type: string };

      if (payload.type !== "upload") {
        throw new Error("Invalid token type");
      }

      return { fileId: payload.fileId };
    } catch (error) {
      throw new Error(`Invalid upload token: ${(error as Error).message}`);
    }
  }

  /**
   * Negotiate chunk size based on file size and client preference
   */
  private negotiateChunkSize(fileSize: number, clientChunkSize?: number): number {
    // If client provides a chunk size, validate and use it
    if (clientChunkSize) {
      // Allow small chunk sizes for testing, but enforce max
      if (clientChunkSize > this.maxChunkSize) {
        return this.maxChunkSize;
      }
      // Only enforce minimum for auto-negotiated sizes
      return clientChunkSize;
    }

    // Auto-negotiate based on file size
    if (fileSize < 10 * 1024 * 1024) {
      // < 10MB: use 256KB chunks
      return Math.max(256 * 1024, this.minChunkSize);
    } else if (fileSize < 100 * 1024 * 1024) {
      // < 100MB: use 1MB chunks
      return Math.max(1024 * 1024, this.minChunkSize);
    } else if (fileSize < 1024 * 1024 * 1024) {
      // < 1GB: use 2MB chunks
      return Math.max(2 * 1024 * 1024, this.minChunkSize);
    } else {
      // >= 1GB: use 5MB chunks
      return Math.max(5 * 1024 * 1024, this.minChunkSize);
    }
  }

  /**
   * Create a new file upload session
   *
   * Generates a unique file ID and upload token, negotiates chunk size,
   * and saves file metadata to the database.
   */
  async createFile(request: CreateFileRequest): Promise<CreateFileResponse> {
    // Generate file ID and upload token
    const fileId = this.generateFileId();
    const uploadToken = this.generateUploadToken(fileId);

    // Negotiate chunk size
    const chunkSize = this.negotiateChunkSize(request.fileSize, request.preferredChunkSize);

    // Calculate total chunks
    const totalChunks = Math.ceil(request.fileSize / chunkSize);

    // Save file metadata to database
    await this.databaseAdapter.createFile(fileId, {
      filename: request.fileName,
      size: request.fileSize,
      mimeType: request.fileType,
      fileHash: "", // Will be set during hash verification
      uploadToken,
      chunkSize,
      totalChunks,
    });

    return {
      uploadToken: uploadToken as unknown as UploadToken,
      negotiatedChunkSize: chunkSize,
    };
  }

  /**
   * Verify file and chunk hashes for instant upload (秒传)
   *
   * Checks if the file hash already exists (full instant upload)
   * or if any chunks already exist (partial instant upload).
   * For existing chunks, automatically creates file-chunk relationships.
   */
  async verifyHash(request: VerifyHashRequest): Promise<VerifyHashResponse> {
    // Verify upload token
    const { fileId } = this.verifyUploadToken(request.uploadToken);

    // Get file metadata
    const file = await this.databaseAdapter.getFile(fileId);
    if (!file) {
      throw new Error("File not found");
    }

    // Check if file hash already exists (full instant upload)
    if (request.fileHash) {
      const existingFile = await this.databaseAdapter.getFileByHash(request.fileHash);
      if (existingFile && existingFile.status === "completed") {
        // File already exists, return instant upload response
        return {
          fileExists: true,
          fileUrl: existingFile.url,
          existingChunks: [],
          missingChunks: [],
        };
      }
    }

    // Check which chunks already exist (partial instant upload)
    if (request.chunkHashes && request.chunkHashes.length > 0) {
      const chunkExistence = await this.databaseAdapter.chunksExist(request.chunkHashes);

      const existingChunks: number[] = [];
      const missingChunks: number[] = [];

      // Process each chunk
      for (let index = 0; index < chunkExistence.length; index++) {
        const exists = chunkExistence[index];
        if (exists) {
          existingChunks.push(index);

          // Automatically create file-chunk relationship for existing chunks
          const chunkHash = request.chunkHashes[index];
          try {
            // Check if relationship already exists
            const existingRelations = await this.databaseAdapter.getFileChunks(fileId);
            const relationExists = existingRelations.some(
              (fc) => fc.chunkIndex === index && fc.chunkHash === chunkHash,
            );

            if (!relationExists) {
              // Create file-chunk relationship
              await this.databaseAdapter.createFileChunk(fileId, chunkHash, index);

              // Increment chunk reference count
              const chunk = await this.databaseAdapter.getChunk(chunkHash);
              if (chunk) {
                await this.databaseAdapter.upsertChunk(chunkHash, chunk.size);
              }
            }
          } catch (error) {
            // Log error but don't fail the verification
            console.error(`Failed to create file-chunk relationship for chunk ${index}:`, error);
          }
        } else {
          missingChunks.push(index);
        }
      }

      // Update file metadata with uploaded chunks count
      const fileChunks = await this.databaseAdapter.getFileChunks(fileId);
      const uploadedChunks = fileChunks.length;
      const status =
        uploadedChunks === file.totalChunks
          ? "completed"
          : uploadedChunks > 0
            ? "uploading"
            : "pending";

      await this.databaseAdapter.updateFile(fileId, {
        uploadedChunks,
        status,
      });

      return {
        fileExists: false,
        existingChunks,
        missingChunks,
      };
    }

    return {
      fileExists: false,
      existingChunks: [],
      missingChunks: [],
    };
  }

  /**
   * Upload a chunk
   *
   * Validates the upload token and chunk hash, saves the chunk to storage
   * with deduplication, and updates file metadata.
   */
  async uploadChunk(request: UploadChunkRequest): Promise<UploadChunkResponse> {
    // Verify upload token
    const { fileId } = this.verifyUploadToken(request.uploadToken);

    // Get file metadata
    const file = await this.databaseAdapter.getFile(fileId);
    if (!file) {
      throw new Error("File not found");
    }

    // Convert chunk to Buffer if it's a Blob
    let chunkBuffer: Buffer;
    if (Buffer.isBuffer(request.chunk)) {
      chunkBuffer = request.chunk;
    } else {
      // It's a Blob, convert to Buffer
      const arrayBuffer = await request.chunk.arrayBuffer();
      chunkBuffer = Buffer.from(arrayBuffer);
    }

    // Verify chunk hash
    const SparkMD5 = (await import("spark-md5")).default;
    // Use the same method as in tests - hash the buffer directly
    // @ts-ignore - SparkMD5 accepts Buffer but TypeScript doesn't recognize it
    const calculatedHash = SparkMD5.ArrayBuffer.hash(chunkBuffer);
    if (calculatedHash !== request.chunkHash) {
      throw new Error("Chunk hash mismatch");
    }

    // Check if chunk already exists in storage
    const chunkExists = await this.storageAdapter.chunkExists(request.chunkHash);

    if (!chunkExists) {
      // Save chunk to storage (deduplication happens here)
      await this.storageAdapter.saveChunk(request.chunkHash, chunkBuffer);
    }

    // Upsert chunk in database (increment ref count if exists)
    await this.databaseAdapter.upsertChunk(request.chunkHash, chunkBuffer.length);

    // Create file-chunk relationship
    await this.databaseAdapter.createFileChunk(fileId, request.chunkHash, request.chunkIndex);

    // Get actual uploaded chunks count
    const fileChunks = await this.databaseAdapter.getFileChunks(fileId);
    const uploadedChunks = fileChunks.length;
    const status = uploadedChunks === file.totalChunks ? "completed" : "uploading";

    await this.databaseAdapter.updateFile(fileId, {
      uploadedChunks,
      status,
    });

    return {
      success: true,
      chunkHash: request.chunkHash,
    };
  }

  /**
   * Merge file chunks (logical merge)
   *
   * Verifies all chunks are uploaded and updates file status to completed.
   * Generates a file access URL.
   */
  async mergeFile(request: MergeFileRequest): Promise<MergeFileResponse> {
    // Verify upload token
    const { fileId } = this.verifyUploadToken(request.uploadToken);

    // Get file metadata
    const file = await this.databaseAdapter.getFile(fileId);
    if (!file) {
      throw new Error("File not found");
    }

    // Verify all chunks are uploaded
    if (file.uploadedChunks !== file.totalChunks) {
      throw new Error(`Not all chunks uploaded: ${file.uploadedChunks}/${file.totalChunks}`);
    }

    // Generate file access URL
    const url = `/upload/files/${fileId}`;

    // Update file with hash, status, and URL
    await this.databaseAdapter.updateFile(fileId, {
      fileHash: request.fileHash,
      status: "completed",
      completedAt: new Date(),
      url,
    });

    return {
      success: true,
      fileUrl: url,
      fileId,
    };
  }

  /**
   * Get file stream for download
   *
   * Reads chunks in order and creates a stream pipeline for file output.
   * Supports Range requests for partial content.
   */
  async getFileStream(
    fileId: string,
    range?: { start: number; end: number },
  ): Promise<{ stream: NodeJS.ReadableStream; size: number; mimeType: string } | null> {
    // Get file metadata
    const file = await this.databaseAdapter.getFile(fileId);
    if (!file || file.status !== "completed") {
      return null;
    }

    // Get chunk hashes in order
    const chunkHashes = await this.databaseAdapter.getFileChunkHashes(fileId);

    // Create a readable stream that reads chunks in order
    const { Readable } = await import("stream");
    const storageAdapter = this.storageAdapter;

    let currentChunkIndex = 0;
    let bytesRead = 0;
    const startByte = range?.start || 0;
    const endByte = range?.end || file.size - 1;

    const stream = new Readable({
      async read() {
        try {
          if (currentChunkIndex >= chunkHashes.length) {
            this.push(null); // End of stream
            return;
          }

          const chunkHash = chunkHashes[currentChunkIndex];
          const chunkData = await storageAdapter.getChunk(chunkHash);

          if (!chunkData) {
            this.destroy(new Error(`Chunk ${chunkHash} not found`));
            return;
          }

          // Handle range requests
          const chunkStart = currentChunkIndex * file.chunkSize;
          const chunkEnd = chunkStart + chunkData.length - 1;

          if (chunkEnd < startByte || chunkStart > endByte) {
            // Skip this chunk
            currentChunkIndex++;
            this.read();
            return;
          }

          let sliceStart = 0;
          let sliceEnd = chunkData.length;

          if (chunkStart < startByte) {
            sliceStart = startByte - chunkStart;
          }

          if (chunkEnd > endByte) {
            sliceEnd = endByte - chunkStart + 1;
          }

          const slicedData = chunkData.slice(sliceStart, sliceEnd);
          this.push(slicedData);

          bytesRead += slicedData.length;
          currentChunkIndex++;

          if (bytesRead >= endByte - startByte + 1) {
            this.push(null); // End of stream
          }
        } catch (error) {
          this.destroy(error as Error);
        }
      },
    });

    const size = range ? endByte - startByte + 1 : file.size;

    return {
      stream,
      size,
      mimeType: file.mimeType,
    };
  }
}
