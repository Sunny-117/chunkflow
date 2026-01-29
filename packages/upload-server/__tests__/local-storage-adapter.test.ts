import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import { join } from "path";
import { LocalStorageAdapter } from "../src/local-storage-adapter";
import { Readable } from "stream";

describe("LocalStorageAdapter", () => {
  const testBaseDir = "./test-uploads";
  let adapter: LocalStorageAdapter;

  beforeEach(async () => {
    adapter = new LocalStorageAdapter({ baseDir: testBaseDir });
    await adapter.initialize();
  });

  afterEach(async () => {
    await adapter.cleanup();
    // Clean up test directory
    try {
      await fs.rm(testBaseDir, { recursive: true, force: true });
    } catch {
      // Ignore errors
    }
  });

  describe("initialize", () => {
    it("should create base directory", async () => {
      const newAdapter = new LocalStorageAdapter({ baseDir: "./test-init" });
      await newAdapter.initialize();

      const stats = await fs.stat("./test-init");
      expect(stats.isDirectory()).toBe(true);

      await newAdapter.cleanup();
      await fs.rm("./test-init", { recursive: true, force: true });
    });

    it("should not fail if directory already exists", async () => {
      await adapter.initialize(); // Call again
      expect(true).toBe(true); // Should not throw
    });
  });

  describe("saveChunk", () => {
    it("should save chunk to filesystem", async () => {
      const chunkHash = "abcdef123456";
      const data = Buffer.from("test chunk data");

      await adapter.saveChunk(chunkHash, data);

      const chunkPath = join(testBaseDir, "ab", chunkHash);
      const savedData = await fs.readFile(chunkPath);
      expect(savedData.toString()).toBe("test chunk data");
    });

    it("should create subdirectory based on first two characters", async () => {
      const chunkHash = "xy9876543210";
      const data = Buffer.from("test data");

      await adapter.saveChunk(chunkHash, data);

      const subDirPath = join(testBaseDir, "xy");
      const stats = await fs.stat(subDirPath);
      expect(stats.isDirectory()).toBe(true);
    });

    it("should overwrite existing chunk", async () => {
      const chunkHash = "abcdef123456";
      const data1 = Buffer.from("first data");
      const data2 = Buffer.from("second data");

      await adapter.saveChunk(chunkHash, data1);
      await adapter.saveChunk(chunkHash, data2);

      const savedData = await adapter.getChunk(chunkHash);
      expect(savedData?.toString()).toBe("second data");
    });

    it("should throw error for invalid chunk hash", async () => {
      const chunkHash = "a"; // Too short
      const data = Buffer.from("test");

      await expect(adapter.saveChunk(chunkHash, data)).rejects.toThrow();
    });
  });

  describe("getChunk", () => {
    it("should retrieve saved chunk", async () => {
      const chunkHash = "abcdef123456";
      const data = Buffer.from("test chunk data");

      await adapter.saveChunk(chunkHash, data);
      const retrieved = await adapter.getChunk(chunkHash);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.toString()).toBe("test chunk data");
    });

    it("should return null for non-existent chunk", async () => {
      const chunkHash = "nonexistent123";
      const retrieved = await adapter.getChunk(chunkHash);

      expect(retrieved).toBeNull();
    });
  });

  describe("chunkExists", () => {
    it("should return true for existing chunk", async () => {
      const chunkHash = "abcdef123456";
      const data = Buffer.from("test data");

      await adapter.saveChunk(chunkHash, data);
      const exists = await adapter.chunkExists(chunkHash);

      expect(exists).toBe(true);
    });

    it("should return false for non-existent chunk", async () => {
      const chunkHash = "nonexistent123";
      const exists = await adapter.chunkExists(chunkHash);

      expect(exists).toBe(false);
    });
  });

  describe("chunksExist", () => {
    it("should check multiple chunks", async () => {
      const hash1 = "abcdef123456";
      const hash2 = "xyz789012345";
      const hash3 = "nonexistent1";

      await adapter.saveChunk(hash1, Buffer.from("data1"));
      await adapter.saveChunk(hash2, Buffer.from("data2"));

      const results = await adapter.chunksExist([hash1, hash2, hash3]);

      expect(results).toEqual([true, true, false]);
    });

    it("should return empty array for empty input", async () => {
      const results = await adapter.chunksExist([]);
      expect(results).toEqual([]);
    });
  });

  describe("getChunkStream", () => {
    it("should return readable stream for existing chunk", async () => {
      const chunkHash = "abcdef123456";
      const data = Buffer.from("test stream data");

      await adapter.saveChunk(chunkHash, data);
      const stream = await adapter.getChunkStream(chunkHash);

      expect(stream).not.toBeNull();
      expect(stream).toBeInstanceOf(Readable);

      // Read stream data
      const chunks: Buffer[] = [];
      for await (const chunk of stream!) {
        chunks.push(chunk);
      }
      const streamData = Buffer.concat(chunks);
      expect(streamData.toString()).toBe("test stream data");
    });

    it("should return null for non-existent chunk", async () => {
      const chunkHash = "nonexistent123";
      const stream = await adapter.getChunkStream(chunkHash);

      expect(stream).toBeNull();
    });
  });

  describe("deleteChunk", () => {
    it("should delete existing chunk", async () => {
      const chunkHash = "abcdef123456";
      const data = Buffer.from("test data");

      await adapter.saveChunk(chunkHash, data);
      expect(await adapter.chunkExists(chunkHash)).toBe(true);

      await adapter.deleteChunk(chunkHash);
      expect(await adapter.chunkExists(chunkHash)).toBe(false);
    });

    it("should not throw error when deleting non-existent chunk", async () => {
      const chunkHash = "nonexistent123";
      await expect(adapter.deleteChunk(chunkHash)).resolves.not.toThrow();
    });
  });

  describe("cleanup", () => {
    it("should mark adapter as not initialized", async () => {
      await adapter.cleanup();
      // After cleanup, should be able to initialize again
      await adapter.initialize();
      expect(true).toBe(true); // Should not throw
    });
  });
});
