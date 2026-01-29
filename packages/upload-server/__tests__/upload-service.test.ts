import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { UploadService } from "../src/upload-service";
import { LocalStorageAdapter } from "../src/local-storage-adapter";
import { MemoryDatabaseAdapter } from "../src/memory-database-adapter";
import SparkMD5 from "spark-md5";
import { promises as fs } from "fs";

describe("UploadService", () => {
  const testBaseDir = "./test-upload-service";
  const jwtSecret = "test-secret-key";

  let service: UploadService;
  let storageAdapter: LocalStorageAdapter;
  let databaseAdapter: MemoryDatabaseAdapter;

  beforeEach(async () => {
    storageAdapter = new LocalStorageAdapter({ baseDir: testBaseDir });
    databaseAdapter = new MemoryDatabaseAdapter();

    service = new UploadService({
      storageAdapter,
      databaseAdapter,
      jwtSecret,
    });

    await service.initialize();
  });

  afterEach(async () => {
    await service.cleanup();
    try {
      await fs.rm(testBaseDir, { recursive: true, force: true });
    } catch {
      // Ignore errors
    }
  });

  describe("createFile", () => {
    it("should create a new file upload session", async () => {
      const request = {
        fileName: "test.txt",
        fileSize: 1024,
        fileType: "text/plain",
      };

      const response = await service.createFile(request);

      expect(response.uploadToken).toBeDefined();
      expect(response.negotiatedChunkSize).toBeGreaterThan(0);
    });

    it("should negotiate chunk size based on file size", async () => {
      const smallFile = {
        fileName: "small.txt",
        fileSize: 5 * 1024 * 1024, // 5MB
        fileType: "text/plain",
      };

      const largeFile = {
        fileName: "large.txt",
        fileSize: 500 * 1024 * 1024, // 500MB
        fileType: "text/plain",
      };

      const smallResponse = await service.createFile(smallFile);
      const largeResponse = await service.createFile(largeFile);

      expect(smallResponse.negotiatedChunkSize).toBeLessThan(largeResponse.negotiatedChunkSize);
    });

    it("should respect client chunk size preference", async () => {
      const request = {
        fileName: "test.txt",
        fileSize: 10 * 1024 * 1024,
        fileType: "text/plain",
        preferredChunkSize: 512 * 1024, // 512KB
      };

      const response = await service.createFile(request);

      expect(response.negotiatedChunkSize).toBe(512 * 1024);
    });
  });

  describe("verifyHash", () => {
    it("should detect full instant upload (file exists)", async () => {
      // Create first file
      const request1 = {
        fileName: "test1.txt",
        fileSize: 1024,
        fileType: "text/plain",
      };

      const response1 = await service.createFile(request1);

      // Get file ID from token
      const decoded = (await import("jsonwebtoken").then((jwt) =>
        jwt.verify(response1.uploadToken, jwtSecret),
      )) as { fileId: string };

      // Update file with hash and mark as completed
      await databaseAdapter.updateFile(decoded.fileId, {
        status: "completed",
        url: "/files/file1",
      });

      // Update file hash in database
      const file = await databaseAdapter.getFile(decoded.fileId);
      if (file) {
        await databaseAdapter.createFile("file-with-hash", {
          filename: file.filename,
          size: file.size,
          mimeType: file.mimeType,
          fileHash: "same-hash",
          uploadToken: "dummy-token",
          chunkSize: file.chunkSize,
          totalChunks: file.totalChunks,
        });
        await databaseAdapter.updateFile("file-with-hash", {
          status: "completed",
          url: "/files/file1",
        });
      }

      // Create second file
      const request2 = {
        fileName: "test2.txt",
        fileSize: 1024,
        fileType: "text/plain",
      };

      const response2 = await service.createFile(request2);

      // Verify hash
      const verifyResponse = await service.verifyHash({
        uploadToken: response2.uploadToken,
        fileHash: "same-hash",
        chunkHashes: [],
      });

      expect(verifyResponse.fileExists).toBe(true);
      expect(verifyResponse.fileUrl).toBe("/files/file1");
    });

    it("should detect partial instant upload (some chunks exist)", async () => {
      const request = {
        fileName: "test.txt",
        fileSize: 1024,
        fileType: "text/plain",
      };

      const response = await service.createFile(request);

      // Create some chunks in database
      await databaseAdapter.upsertChunk("chunk1", 256);
      await databaseAdapter.upsertChunk("chunk2", 256);

      // Verify hash
      const verifyResponse = await service.verifyHash({
        uploadToken: response.uploadToken,
        chunkHashes: ["chunk1", "chunk2", "chunk3", "chunk4"],
      });

      expect(verifyResponse.fileExists).toBe(false);
      expect(verifyResponse.existingChunks).toEqual([0, 1]);
      expect(verifyResponse.missingChunks).toEqual([2, 3]);
    });
  });

  describe("uploadChunk", () => {
    it("should upload a chunk successfully", async () => {
      const request = {
        fileName: "test.txt",
        fileSize: 512,
        fileType: "text/plain",
      };

      const createResponse = await service.createFile(request);

      // Create chunk data
      const chunkData = Buffer.from("test chunk data");
      const chunkHash = SparkMD5.ArrayBuffer.hash(chunkData);

      // Upload chunk
      const uploadResponse = await service.uploadChunk({
        uploadToken: createResponse.uploadToken,
        chunkIndex: 0,
        chunkHash,
        chunk: chunkData,
      });

      expect(uploadResponse.success).toBe(true);
      expect(uploadResponse.chunkHash).toBe(chunkHash);

      // Verify chunk is stored
      const storedChunk = await storageAdapter.getChunk(chunkHash);
      expect(storedChunk).not.toBeNull();
      expect(storedChunk?.toString()).toBe("test chunk data");
    });

    it("should reject chunk with invalid hash", async () => {
      const request = {
        fileName: "test.txt",
        fileSize: 512,
        fileType: "text/plain",
      };

      const createResponse = await service.createFile(request);

      // Create chunk data with wrong hash
      const chunkData = Buffer.from("test chunk data");

      await expect(
        service.uploadChunk({
          uploadToken: createResponse.uploadToken,
          chunkIndex: 0,
          chunkHash: "wrong-hash",
          chunk: chunkData,
        }),
      ).rejects.toThrow("Chunk hash mismatch");
    });

    it("should deduplicate chunks", async () => {
      const request = {
        fileName: "test.txt",
        fileSize: 512,
        fileType: "text/plain",
      };

      const createResponse = await service.createFile(request);

      // Create chunk data
      const chunkData = Buffer.from("test chunk data");
      const chunkHash = SparkMD5.ArrayBuffer.hash(chunkData);

      // Upload same chunk twice
      await service.uploadChunk({
        uploadToken: createResponse.uploadToken,
        chunkIndex: 0,
        chunkHash,
        chunk: chunkData,
      });

      await service.uploadChunk({
        uploadToken: createResponse.uploadToken,
        chunkIndex: 1,
        chunkHash,
        chunk: chunkData,
      });

      // Verify chunk reference count
      const chunk = await databaseAdapter.getChunk(chunkHash);
      expect(chunk?.refCount).toBe(2);
    });
  });

  describe("mergeFile", () => {
    it("should merge file after all chunks uploaded", async () => {
      const request = {
        fileName: "test.txt",
        fileSize: 30,
        fileType: "text/plain",
        preferredChunkSize: 10,
      };

      const createResponse = await service.createFile(request);

      // Upload all chunks
      const chunks = ["chunk 0", "chunk 1", "chunk 2"];
      const chunkHashes: string[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunkData = Buffer.from(chunks[i]);
        const chunkHash = SparkMD5.ArrayBuffer.hash(chunkData);
        chunkHashes.push(chunkHash);

        await service.uploadChunk({
          uploadToken: createResponse.uploadToken,
          chunkIndex: i,
          chunkHash,
          chunk: chunkData,
        });
      }

      // Merge file
      const mergeResponse = await service.mergeFile({
        uploadToken: createResponse.uploadToken,
        fileHash: "file-hash",
        chunkHashes,
      });

      expect(mergeResponse.success).toBe(true);
      expect(mergeResponse.fileId).toBeDefined();
      expect(mergeResponse.fileUrl).toBeDefined();
    });

    it("should reject merge if not all chunks uploaded", async () => {
      const request = {
        fileName: "test.txt",
        fileSize: 10 * 1024 * 1024, // 10MB to ensure multiple chunks
        fileType: "text/plain",
        preferredChunkSize: 1024 * 1024, // 1MB chunks = 10 chunks total
      };

      const createResponse = await service.createFile(request);

      // Upload only one chunk
      const chunkData = Buffer.from("chunk 0");
      const chunkHash = SparkMD5.ArrayBuffer.hash(chunkData);

      await service.uploadChunk({
        uploadToken: createResponse.uploadToken,
        chunkIndex: 0,
        chunkHash,
        chunk: chunkData,
      });

      // Try to merge
      await expect(
        service.mergeFile({
          uploadToken: createResponse.uploadToken,
          fileHash: "file-hash",
          chunkHashes: [chunkHash],
        }),
      ).rejects.toThrow("Not all chunks uploaded");
    });
  });

  describe("getFileStream", () => {
    it("should return file stream for completed file", async () => {
      const request = {
        fileName: "test.txt",
        fileSize: 30, // Small size to match 3 chunks
        fileType: "text/plain",
        preferredChunkSize: 10, // 10 bytes per chunk = 3 chunks total
      };

      const createResponse = await service.createFile(request);

      // Upload all chunks
      const chunks = ["chunk 0", "chunk 1", "chunk 2"];
      const chunkHashes: string[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunkData = Buffer.from(chunks[i]);
        const chunkHash = SparkMD5.ArrayBuffer.hash(chunkData);
        chunkHashes.push(chunkHash);

        await service.uploadChunk({
          uploadToken: createResponse.uploadToken,
          chunkIndex: i,
          chunkHash,
          chunk: chunkData,
        });
      }

      // Merge file
      const mergeResponse = await service.mergeFile({
        uploadToken: createResponse.uploadToken,
        fileHash: "file-hash",
        chunkHashes,
      });

      // Get file stream
      const result = await service.getFileStream(mergeResponse.fileId);

      expect(result).not.toBeNull();
      expect(result?.mimeType).toBe("text/plain");

      // Read stream
      const streamChunks: Buffer[] = [];
      for await (const chunk of result!.stream) {
        streamChunks.push(chunk);
      }

      const fileContent = Buffer.concat(streamChunks).toString();
      expect(fileContent).toBe("chunk 0chunk 1chunk 2");
    });

    it("should return null for non-existent file", async () => {
      const result = await service.getFileStream("nonexistent");
      expect(result).toBeNull();
    });

    it("should return null for incomplete file", async () => {
      const request = {
        fileName: "test.txt",
        fileSize: 512,
        fileType: "text/plain",
      };

      const createResponse = await service.createFile(request);

      // Get file ID from token
      const decoded = (await import("jsonwebtoken").then((jwt) =>
        jwt.verify(createResponse.uploadToken, jwtSecret),
      )) as { fileId: string };

      const result = await service.getFileStream(decoded.fileId);
      expect(result).toBeNull();
    });
  });
});
