import { Pool } from "pg";
import type {
  DatabaseAdapter,
  FileMetadata,
  ChunkEntity,
  FileChunkEntity,
  CreateFileOptions,
  UpdateFileOptions,
} from "@chunkflow/upload-server";

export class PostgresAdapter implements DatabaseAdapter {
  constructor(private pool: Pool) {}

  async initialize(): Promise<void> {
    // Tables are created via init.sql
    // Just verify connection
    const client = await this.pool.connect();
    try {
      await client.query("SELECT 1");
    } finally {
      client.release();
    }
  }

  async cleanup(): Promise<void> {
    await this.pool.end();
  }

  async createFile(fileId: string, options: CreateFileOptions): Promise<FileMetadata> {
    const now = new Date();
    await this.pool.query(
      `INSERT INTO files (file_id, file_name, file_size, file_type, file_hash, upload_token, chunk_size, total_chunks, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        fileId,
        options.filename,
        options.size,
        options.mimeType,
        options.fileHash,
        options.uploadToken,
        options.chunkSize,
        options.totalChunks,
        now,
      ],
    );

    return {
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
  }

  async getFile(fileId: string): Promise<FileMetadata | null> {
    const result = await this.pool.query("SELECT * FROM files WHERE file_id = $1", [fileId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToFileMetadata(result.rows[0]);
  }

  async getFileByHash(fileHash: string): Promise<FileMetadata | null> {
    const result = await this.pool.query(
      "SELECT * FROM files WHERE file_hash = $1 AND completed_at IS NOT NULL LIMIT 1",
      [fileHash],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToFileMetadata(result.rows[0]);
  }

  async getFileByToken(uploadToken: string): Promise<FileMetadata | null> {
    const result = await this.pool.query("SELECT * FROM files WHERE upload_token = $1", [
      uploadToken,
    ]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToFileMetadata(result.rows[0]);
  }

  async updateFile(fileId: string, options: UpdateFileOptions): Promise<FileMetadata> {
    const fields: string[] = ["updated_at = NOW()"];
    const values: any[] = [];
    let paramIndex = 1;

    if (options.uploadedChunks !== undefined) {
      fields.push(`uploaded_chunks = $${paramIndex++}`);
      values.push(options.uploadedChunks);
    }
    if (options.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(options.status);
    }
    if (options.completedAt !== undefined) {
      fields.push(`completed_at = $${paramIndex++}`);
      values.push(options.completedAt);
    }
    if (options.url !== undefined) {
      fields.push(`url = $${paramIndex++}`);
      values.push(options.url);
    }
    if (options.fileHash !== undefined) {
      fields.push(`file_hash = $${paramIndex++}`);
      values.push(options.fileHash);
    }

    values.push(fileId);
    await this.pool.query(
      `UPDATE files SET ${fields.join(", ")} WHERE file_id = $${paramIndex}`,
      values,
    );

    const file = await this.getFile(fileId);
    if (!file) {
      throw new Error(`File not found: ${fileId}`);
    }
    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.pool.query("DELETE FROM files WHERE file_id = $1", [fileId]);
  }

  async upsertChunk(chunkHash: string, size: number): Promise<ChunkEntity> {
    const now = new Date();
    await this.pool.query(
      `INSERT INTO chunks (chunk_hash, chunk_size, storage_path, created_at, reference_count)
       VALUES ($1, $2, $3, $4, 1)
       ON CONFLICT (chunk_hash) DO UPDATE SET reference_count = chunks.reference_count + 1`,
      [chunkHash, size, this.getStoragePath(chunkHash), now],
    );

    const chunk = await this.getChunk(chunkHash);
    if (!chunk) {
      throw new Error(`Failed to upsert chunk: ${chunkHash}`);
    }
    return chunk;
  }

  async getChunk(chunkHash: string): Promise<ChunkEntity | null> {
    const result = await this.pool.query("SELECT * FROM chunks WHERE chunk_hash = $1", [chunkHash]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      chunkHash: row.chunk_hash,
      size: row.chunk_size,
      refCount: row.reference_count,
      createdAt: row.created_at,
    };
  }

  async chunkExists(chunkHash: string): Promise<boolean> {
    const result = await this.pool.query("SELECT 1 FROM chunks WHERE chunk_hash = $1", [chunkHash]);
    return result.rows.length > 0;
  }

  async chunksExist(chunkHashes: string[]): Promise<boolean[]> {
    const result = await this.pool.query(
      "SELECT chunk_hash FROM chunks WHERE chunk_hash = ANY($1)",
      [chunkHashes],
    );

    const existingHashes = new Set(result.rows.map((row) => row.chunk_hash));
    return chunkHashes.map((hash) => existingHashes.has(hash));
  }

  async decrementChunkRef(chunkHash: string): Promise<void> {
    await this.pool.query(
      `UPDATE chunks SET reference_count = reference_count - 1 WHERE chunk_hash = $1`,
      [chunkHash],
    );

    await this.pool.query(`DELETE FROM chunks WHERE chunk_hash = $1 AND reference_count <= 0`, [
      chunkHash,
    ]);
  }

  async createFileChunk(
    fileId: string,
    chunkHash: string,
    chunkIndex: number,
  ): Promise<FileChunkEntity> {
    const now = new Date();
    await this.pool.query(
      `INSERT INTO file_chunks (file_id, chunk_index, chunk_hash, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (file_id, chunk_index) DO NOTHING`,
      [fileId, chunkIndex, chunkHash, now],
    );

    return {
      fileId,
      chunkHash,
      chunkIndex,
      createdAt: now,
    };
  }

  async getFileChunks(fileId: string): Promise<FileChunkEntity[]> {
    const result = await this.pool.query(
      "SELECT * FROM file_chunks WHERE file_id = $1 ORDER BY chunk_index ASC",
      [fileId],
    );

    return result.rows.map((row) => ({
      fileId: row.file_id,
      chunkHash: row.chunk_hash,
      chunkIndex: row.chunk_index,
      createdAt: row.created_at,
    }));
  }

  async getFileChunkHashes(fileId: string): Promise<string[]> {
    const result = await this.pool.query(
      "SELECT chunk_hash FROM file_chunks WHERE file_id = $1 ORDER BY chunk_index ASC",
      [fileId],
    );

    return result.rows.map((row) => row.chunk_hash);
  }

  async deleteFileChunks(fileId: string): Promise<void> {
    await this.pool.query("DELETE FROM file_chunks WHERE file_id = $1", [fileId]);
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await callback();
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private getStoragePath(chunkHash: string): string {
    const prefix = chunkHash.substring(0, 2);
    return `${prefix}/${chunkHash}`;
  }

  private mapRowToFileMetadata(row: any): FileMetadata {
    return {
      fileId: row.file_id,
      filename: row.file_name,
      size: parseInt(row.file_size),
      mimeType: row.file_type || "application/octet-stream",
      fileHash: row.file_hash,
      uploadToken: row.upload_token,
      chunkSize: row.chunk_size || 0,
      totalChunks: row.total_chunks || 0,
      uploadedChunks: row.uploaded_chunks || 0,
      status: row.status || "pending",
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
      completedAt: row.completed_at,
      url: row.url,
    };
  }
}
