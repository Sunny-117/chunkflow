import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MemoryDatabaseAdapter } from "../src/memory-database-adapter";
import type { CreateFileOptions } from "../src/database-adapter";

describe("MemoryDatabaseAdapter", () => {
  let adapter: MemoryDatabaseAdapter;

  beforeEach(async () => {
    adapter = new MemoryDatabaseAdapter();
    await adapter.initialize();
  });

  afterEach(async () => {
    await adapter.cleanup();
  });

  describe("File Operations", () => {
    const createFileOptions: CreateFileOptions = {
      filename: "test.txt",
      size: 1024,
      mimeType: "text/plain",
      fileHash: "abc123",
      uploadToken: "token123",
      chunkSize: 256,
      totalChunks: 4,
    };

    describe("createFile", () => {
      it("should create a new file", async () => {
        const file = await adapter.createFile("file1", createFileOptions);

        expect(file.fileId).toBe("file1");
        expect(file.filename).toBe("test.txt");
        expect(file.size).toBe(1024);
        expect(file.status).toBe("pending");
        expect(file.uploadedChunks).toBe(0);
        expect(file.createdAt).toBeInstanceOf(Date);
      });

      it("should throw error if file already exists", async () => {
        await adapter.createFile("file1", createFileOptions);
        await expect(adapter.createFile("file1", createFileOptions)).rejects.toThrow();
      });
    });

    describe("getFile", () => {
      it("should retrieve file by ID", async () => {
        await adapter.createFile("file1", createFileOptions);
        const file = await adapter.getFile("file1");

        expect(file).not.toBeNull();
        expect(file?.fileId).toBe("file1");
      });

      it("should return null for non-existent file", async () => {
        const file = await adapter.getFile("nonexistent");
        expect(file).toBeNull();
      });
    });

    describe("getFileByHash", () => {
      it("should retrieve file by hash", async () => {
        await adapter.createFile("file1", createFileOptions);
        const file = await adapter.getFileByHash("abc123");

        expect(file).not.toBeNull();
        expect(file?.fileHash).toBe("abc123");
      });

      it("should return null for non-existent hash", async () => {
        const file = await adapter.getFileByHash("nonexistent");
        expect(file).toBeNull();
      });
    });

    describe("getFileByToken", () => {
      it("should retrieve file by upload token", async () => {
        await adapter.createFile("file1", createFileOptions);
        const file = await adapter.getFileByToken("token123");

        expect(file).not.toBeNull();
        expect(file?.uploadToken).toBe("token123");
      });

      it("should return null for non-existent token", async () => {
        const file = await adapter.getFileByToken("nonexistent");
        expect(file).toBeNull();
      });
    });

    describe("updateFile", () => {
      it("should update file metadata", async () => {
        await adapter.createFile("file1", createFileOptions);
        const updated = await adapter.updateFile("file1", {
          uploadedChunks: 2,
          status: "uploading",
        });

        expect(updated.uploadedChunks).toBe(2);
        expect(updated.status).toBe("uploading");
      });

      it("should throw error for non-existent file", async () => {
        await expect(adapter.updateFile("nonexistent", { uploadedChunks: 1 })).rejects.toThrow();
      });
    });

    describe("deleteFile", () => {
      it("should delete file", async () => {
        await adapter.createFile("file1", createFileOptions);
        await adapter.deleteFile("file1");

        const file = await adapter.getFile("file1");
        expect(file).toBeNull();
      });

      it("should not throw error for non-existent file", async () => {
        await expect(adapter.deleteFile("nonexistent")).resolves.not.toThrow();
      });
    });
  });

  describe("Chunk Operations", () => {
    describe("upsertChunk", () => {
      it("should create new chunk", async () => {
        const chunk = await adapter.upsertChunk("hash1", 256);

        expect(chunk.chunkHash).toBe("hash1");
        expect(chunk.size).toBe(256);
        expect(chunk.refCount).toBe(1);
      });

      it("should increment refCount for existing chunk", async () => {
        await adapter.upsertChunk("hash1", 256);
        const chunk = await adapter.upsertChunk("hash1", 256);

        expect(chunk.refCount).toBe(2);
      });
    });

    describe("getChunk", () => {
      it("should retrieve chunk by hash", async () => {
        await adapter.upsertChunk("hash1", 256);
        const chunk = await adapter.getChunk("hash1");

        expect(chunk).not.toBeNull();
        expect(chunk?.chunkHash).toBe("hash1");
      });

      it("should return null for non-existent chunk", async () => {
        const chunk = await adapter.getChunk("nonexistent");
        expect(chunk).toBeNull();
      });
    });

    describe("chunkExists", () => {
      it("should return true for existing chunk", async () => {
        await adapter.upsertChunk("hash1", 256);
        const exists = await adapter.chunkExists("hash1");

        expect(exists).toBe(true);
      });

      it("should return false for non-existent chunk", async () => {
        const exists = await adapter.chunkExists("nonexistent");
        expect(exists).toBe(false);
      });
    });

    describe("chunksExist", () => {
      it("should check multiple chunks", async () => {
        await adapter.upsertChunk("hash1", 256);
        await adapter.upsertChunk("hash2", 256);

        const results = await adapter.chunksExist(["hash1", "hash2", "hash3"]);
        expect(results).toEqual([true, true, false]);
      });
    });

    describe("decrementChunkRef", () => {
      it("should decrement reference count", async () => {
        await adapter.upsertChunk("hash1", 256);
        await adapter.upsertChunk("hash1", 256); // refCount = 2

        await adapter.decrementChunkRef("hash1");
        const chunk = await adapter.getChunk("hash1");

        expect(chunk?.refCount).toBe(1);
      });

      it("should delete chunk when refCount reaches 0", async () => {
        await adapter.upsertChunk("hash1", 256); // refCount = 1

        await adapter.decrementChunkRef("hash1");
        const chunk = await adapter.getChunk("hash1");

        expect(chunk).toBeNull();
      });

      it("should not throw error for non-existent chunk", async () => {
        await expect(adapter.decrementChunkRef("nonexistent")).resolves.not.toThrow();
      });
    });
  });

  describe("File-Chunk Relationship Operations", () => {
    describe("createFileChunk", () => {
      it("should create file-chunk relationship", async () => {
        const fileChunk = await adapter.createFileChunk("file1", "hash1", 0);

        expect(fileChunk.fileId).toBe("file1");
        expect(fileChunk.chunkHash).toBe("hash1");
        expect(fileChunk.chunkIndex).toBe(0);
      });
    });

    describe("getFileChunks", () => {
      it("should retrieve file chunks ordered by index", async () => {
        await adapter.createFileChunk("file1", "hash3", 2);
        await adapter.createFileChunk("file1", "hash1", 0);
        await adapter.createFileChunk("file1", "hash2", 1);

        const fileChunks = await adapter.getFileChunks("file1");

        expect(fileChunks).toHaveLength(3);
        expect(fileChunks[0].chunkHash).toBe("hash1");
        expect(fileChunks[1].chunkHash).toBe("hash2");
        expect(fileChunks[2].chunkHash).toBe("hash3");
      });

      it("should return empty array for file with no chunks", async () => {
        const fileChunks = await adapter.getFileChunks("file1");
        expect(fileChunks).toEqual([]);
      });
    });

    describe("getFileChunkHashes", () => {
      it("should retrieve chunk hashes ordered by index", async () => {
        await adapter.createFileChunk("file1", "hash3", 2);
        await adapter.createFileChunk("file1", "hash1", 0);
        await adapter.createFileChunk("file1", "hash2", 1);

        const hashes = await adapter.getFileChunkHashes("file1");

        expect(hashes).toEqual(["hash1", "hash2", "hash3"]);
      });
    });

    describe("deleteFileChunks", () => {
      it("should delete all file-chunk relationships", async () => {
        await adapter.createFileChunk("file1", "hash1", 0);
        await adapter.createFileChunk("file1", "hash2", 1);

        await adapter.deleteFileChunks("file1");
        const fileChunks = await adapter.getFileChunks("file1");

        expect(fileChunks).toEqual([]);
      });
    });
  });

  describe("Transaction", () => {
    it("should execute callback", async () => {
      const result = await adapter.transaction(async () => {
        return "success";
      });

      expect(result).toBe("success");
    });

    it("should propagate errors", async () => {
      await expect(
        adapter.transaction(async () => {
          throw new Error("test error");
        }),
      ).rejects.toThrow("test error");
    });
  });

  describe("Cleanup", () => {
    it("should clear all data", async () => {
      const createFileOptions: CreateFileOptions = {
        filename: "test.txt",
        size: 1024,
        mimeType: "text/plain",
        fileHash: "abc123",
        uploadToken: "token123",
        chunkSize: 256,
        totalChunks: 4,
      };

      await adapter.createFile("file1", createFileOptions);
      await adapter.upsertChunk("hash1", 256);
      await adapter.createFileChunk("file1", "hash1", 0);

      await adapter.cleanup();

      const file = await adapter.getFile("file1");
      const chunk = await adapter.getChunk("hash1");
      const fileChunks = await adapter.getFileChunks("file1");

      expect(file).toBeNull();
      expect(chunk).toBeNull();
      expect(fileChunks).toEqual([]);
    });
  });
});
