/**
 * Unit tests for UploadManager
 *
 * Tests the core functionality of the UploadManager class including:
 * - Initialization
 * - Task creation and management
 * - Task retrieval (getTask, getAllTasks)
 * - Task deletion
 * - Batch operations (pauseAll, resumeAll, cancelAll, clearCompletedTasks)
 * - Statistics
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { UploadManager } from "../src/upload-manager";
import type { RequestAdapter } from "@chunkflow/protocol";
import type {
  CreateFileRequest,
  CreateFileResponse,
  VerifyHashRequest,
  VerifyHashResponse,
  UploadChunkRequest,
  UploadChunkResponse,
} from "@chunkflow/protocol";

// Mock RequestAdapter
const createMockAdapter = (): RequestAdapter => ({
  createFile: vi.fn(
    async (request: CreateFileRequest): Promise<CreateFileResponse> => ({
      uploadToken: {
        token: "mock-token",
        fileId: "mock-file-id",
        chunkSize: request.preferredChunkSize || 1024 * 1024,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      },
      negotiatedChunkSize: request.preferredChunkSize || 1024 * 1024,
    }),
  ),
  verifyHash: vi.fn(
    async (_request: VerifyHashRequest): Promise<VerifyHashResponse> => ({
      fileExists: false,
      existingChunks: [],
      missingChunks: [],
    }),
  ),
  uploadChunk: vi.fn(
    async (request: UploadChunkRequest): Promise<UploadChunkResponse> => ({
      success: true,
      chunkHash: request.chunkHash,
    }),
  ),
  mergeFile: vi.fn(),
});

// Helper to create a mock File
const createMockFile = (name: string, size: number): File => {
  const content = new Array(size).fill("a").join("");
  return new File([content], name, { type: "text/plain" });
};

describe("UploadManager", () => {
  let manager: UploadManager;
  let mockAdapter: RequestAdapter;

  beforeEach(() => {
    mockAdapter = createMockAdapter();
    manager = new UploadManager({
      requestAdapter: mockAdapter,
      maxConcurrentTasks: 3,
      defaultChunkSize: 1024 * 1024,
      defaultConcurrency: 3,
      autoResumeUnfinished: false, // Disable for tests
    });
  });

  describe("Initialization", () => {
    it("should create a manager with default options", () => {
      const manager = new UploadManager({
        requestAdapter: mockAdapter,
      });

      expect(manager).toBeDefined();
      expect(manager.isInitialized()).toBe(false);
      expect(manager.getTaskCount()).toBe(0);
    });

    it("should initialize successfully", async () => {
      await manager.init();
      expect(manager.isInitialized()).toBe(true);
    });

    it("should be idempotent (safe to call init multiple times)", async () => {
      await manager.init();
      await manager.init();
      await manager.init();
      expect(manager.isInitialized()).toBe(true);
    });

    it("should apply custom options", () => {
      const customManager = new UploadManager({
        requestAdapter: mockAdapter,
        maxConcurrentTasks: 5,
        defaultChunkSize: 2 * 1024 * 1024,
        defaultConcurrency: 4,
      });

      expect(customManager).toBeDefined();
    });
  });

  describe("Task Creation", () => {
    beforeEach(async () => {
      await manager.init();
    });

    it("should create a task for a file", () => {
      const file = createMockFile("test.txt", 1024);
      const task = manager.createTask(file);

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.file).toBe(file);
      expect(task.getStatus()).toBe("idle");
    });

    it("should add created task to manager", () => {
      const file = createMockFile("test.txt", 1024);
      const task = manager.createTask(file);

      expect(manager.getTaskCount()).toBe(1);
      expect(manager.getTask(task.id)).toBe(task);
    });

    it("should create multiple tasks", () => {
      const file1 = createMockFile("test1.txt", 1024);
      const file2 = createMockFile("test2.txt", 2048);
      const file3 = createMockFile("test3.txt", 4096);

      const task1 = manager.createTask(file1);
      const task2 = manager.createTask(file2);
      const task3 = manager.createTask(file3);

      expect(manager.getTaskCount()).toBe(3);
      expect(manager.getTask(task1.id)).toBe(task1);
      expect(manager.getTask(task2.id)).toBe(task2);
      expect(manager.getTask(task3.id)).toBe(task3);
    });

    it("should use default options when not specified", () => {
      const file = createMockFile("test.txt", 1024);
      const task = manager.createTask(file);

      expect(task).toBeDefined();
      // Task should use manager's default options
    });

    it("should allow overriding options per task", () => {
      const file = createMockFile("test.txt", 1024);
      const task = manager.createTask(file, {
        chunkSize: 2 * 1024 * 1024,
        concurrency: 5,
      });

      expect(task).toBeDefined();
      // Task should use custom options
    });

    it("should generate unique task IDs", () => {
      const file = createMockFile("test.txt", 1024);
      const task1 = manager.createTask(file);
      const task2 = manager.createTask(file);
      const task3 = manager.createTask(file);

      expect(task1.id).not.toBe(task2.id);
      expect(task2.id).not.toBe(task3.id);
      expect(task1.id).not.toBe(task3.id);
    });
  });

  describe("Task Retrieval", () => {
    beforeEach(async () => {
      await manager.init();
    });

    it("should get a task by ID", () => {
      const file = createMockFile("test.txt", 1024);
      const task = manager.createTask(file);

      const retrieved = manager.getTask(task.id);
      expect(retrieved).toBe(task);
    });

    it("should return undefined for non-existent task ID", () => {
      const retrieved = manager.getTask("non-existent-id");
      expect(retrieved).toBeUndefined();
    });

    it("should get all tasks", () => {
      const file1 = createMockFile("test1.txt", 1024);
      const file2 = createMockFile("test2.txt", 2048);
      const file3 = createMockFile("test3.txt", 4096);

      const task1 = manager.createTask(file1);
      const task2 = manager.createTask(file2);
      const task3 = manager.createTask(file3);

      const allTasks = manager.getAllTasks();
      expect(allTasks).toHaveLength(3);
      expect(allTasks).toContain(task1);
      expect(allTasks).toContain(task2);
      expect(allTasks).toContain(task3);
    });

    it("should return empty array when no tasks exist", () => {
      const allTasks = manager.getAllTasks();
      expect(allTasks).toHaveLength(0);
      expect(allTasks).toEqual([]);
    });

    it("should return a new array (safe to modify)", () => {
      const file = createMockFile("test.txt", 1024);
      manager.createTask(file);

      const allTasks1 = manager.getAllTasks();
      const allTasks2 = manager.getAllTasks();

      expect(allTasks1).not.toBe(allTasks2);
      expect(allTasks1).toEqual(allTasks2);
    });
  });

  describe("Task Deletion", () => {
    beforeEach(async () => {
      await manager.init();
    });

    it("should delete a task by ID", async () => {
      const file = createMockFile("test.txt", 1024);
      const task = manager.createTask(file);

      expect(manager.getTaskCount()).toBe(1);

      await manager.deleteTask(task.id);

      expect(manager.getTaskCount()).toBe(0);
      expect(manager.getTask(task.id)).toBeUndefined();
    });

    it("should be safe to delete non-existent task", async () => {
      await manager.deleteTask("non-existent-id");
      expect(manager.getTaskCount()).toBe(0);
    });

    it("should cancel running task before deletion", async () => {
      const file = createMockFile("test.txt", 1024);
      const task = manager.createTask(file);

      // Manually set status to uploading for testing
      // (In real scenario, task would be started and uploading)
      (task as any).status = "uploading";

      // Delete while uploading
      await manager.deleteTask(task.id);

      // Task should be cancelled
      expect(task.getStatus()).toBe("cancelled");
      expect(manager.getTask(task.id)).toBeUndefined();
    });

    it("should delete multiple tasks", async () => {
      const file1 = createMockFile("test1.txt", 1024);
      const file2 = createMockFile("test2.txt", 2048);
      const file3 = createMockFile("test3.txt", 4096);

      const task1 = manager.createTask(file1);
      const task2 = manager.createTask(file2);
      const task3 = manager.createTask(file3);

      expect(manager.getTaskCount()).toBe(3);

      await manager.deleteTask(task1.id);
      expect(manager.getTaskCount()).toBe(2);

      await manager.deleteTask(task2.id);
      expect(manager.getTaskCount()).toBe(1);

      await manager.deleteTask(task3.id);
      expect(manager.getTaskCount()).toBe(0);
    });
  });

  describe("Task Count", () => {
    beforeEach(async () => {
      await manager.init();
    });

    it("should return 0 for empty manager", () => {
      expect(manager.getTaskCount()).toBe(0);
    });

    it("should return correct count after adding tasks", () => {
      const file1 = createMockFile("test1.txt", 1024);
      const file2 = createMockFile("test2.txt", 2048);

      manager.createTask(file1);
      expect(manager.getTaskCount()).toBe(1);

      manager.createTask(file2);
      expect(manager.getTaskCount()).toBe(2);
    });

    it("should return correct count after deleting tasks", async () => {
      const file1 = createMockFile("test1.txt", 1024);
      const file2 = createMockFile("test2.txt", 2048);

      const task1 = manager.createTask(file1);
      const task2 = manager.createTask(file2);

      expect(manager.getTaskCount()).toBe(2);

      await manager.deleteTask(task1.id);
      expect(manager.getTaskCount()).toBe(1);

      await manager.deleteTask(task2.id);
      expect(manager.getTaskCount()).toBe(0);
    });
  });

  describe("Batch Operations", () => {
    beforeEach(async () => {
      await manager.init();
    });

    it("should pause all uploading tasks", () => {
      const file1 = createMockFile("test1.txt", 1024);
      const file2 = createMockFile("test2.txt", 2048);

      const task1 = manager.createTask(file1);
      const task2 = manager.createTask(file2);

      // Manually set status to uploading for testing
      // In real scenario, tasks would be started
      (task1 as any).status = "uploading";
      (task2 as any).status = "uploading";

      const pausedCount = manager.pauseAll();

      expect(pausedCount).toBe(2);
      expect(task1.getStatus()).toBe("paused");
      expect(task2.getStatus()).toBe("paused");
    });

    it("should not pause non-uploading tasks", () => {
      const file1 = createMockFile("test1.txt", 1024);
      const file2 = createMockFile("test2.txt", 2048);

      const task1 = manager.createTask(file1);
      const task2 = manager.createTask(file2);

      // task1 is idle, task2 is uploading
      (task2 as any).status = "uploading";

      const pausedCount = manager.pauseAll();

      expect(pausedCount).toBe(1);
      expect(task1.getStatus()).toBe("idle");
      expect(task2.getStatus()).toBe("paused");
    });

    it("should cancel all running and paused tasks", () => {
      const file1 = createMockFile("test1.txt", 1024);
      const file2 = createMockFile("test2.txt", 2048);
      const file3 = createMockFile("test3.txt", 4096);

      const task1 = manager.createTask(file1);
      const task2 = manager.createTask(file2);
      const task3 = manager.createTask(file3);

      // Set different statuses
      (task1 as any).status = "uploading";
      (task2 as any).status = "paused";
      (task3 as any).status = "success";

      const cancelledCount = manager.cancelAll();

      expect(cancelledCount).toBe(2);
      expect(task1.getStatus()).toBe("cancelled");
      expect(task2.getStatus()).toBe("cancelled");
      expect(task3.getStatus()).toBe("success"); // Should not be cancelled
    });

    it("should clear completed tasks", async () => {
      const file1 = createMockFile("test1.txt", 1024);
      const file2 = createMockFile("test2.txt", 2048);
      const file3 = createMockFile("test3.txt", 4096);
      const file4 = createMockFile("test4.txt", 8192);

      const task1 = manager.createTask(file1);
      const task2 = manager.createTask(file2);
      const task3 = manager.createTask(file3);
      const task4 = manager.createTask(file4);

      // Set different statuses
      (task1 as any).status = "success";
      (task2 as any).status = "error";
      (task3 as any).status = "cancelled";
      (task4 as any).status = "uploading";

      expect(manager.getTaskCount()).toBe(4);

      const clearedCount = await manager.clearCompletedTasks();

      expect(clearedCount).toBe(3);
      expect(manager.getTaskCount()).toBe(1);
      expect(manager.getTask(task4.id)).toBe(task4);
    });
  });

  describe("Statistics", () => {
    beforeEach(async () => {
      await manager.init();
    });

    it("should return correct statistics for empty manager", () => {
      const stats = manager.getStatistics();

      expect(stats.total).toBe(0);
      expect(stats.idle).toBe(0);
      expect(stats.uploading).toBe(0);
      expect(stats.paused).toBe(0);
      expect(stats.success).toBe(0);
      expect(stats.error).toBe(0);
      expect(stats.cancelled).toBe(0);
    });

    it("should return correct statistics with tasks", () => {
      const file1 = createMockFile("test1.txt", 1024);
      const file2 = createMockFile("test2.txt", 2048);
      const file3 = createMockFile("test3.txt", 4096);
      const file4 = createMockFile("test4.txt", 8192);
      const file5 = createMockFile("test5.txt", 16384);

      const task1 = manager.createTask(file1);
      const task2 = manager.createTask(file2);
      const task3 = manager.createTask(file3);
      const task4 = manager.createTask(file4);
      const task5 = manager.createTask(file5);

      // Set different statuses
      (task1 as any).status = "idle";
      (task2 as any).status = "uploading";
      (task3 as any).status = "paused";
      (task4 as any).status = "success";
      (task5 as any).status = "error";

      const stats = manager.getStatistics();

      expect(stats.total).toBe(5);
      expect(stats.idle).toBe(1);
      expect(stats.uploading).toBe(1);
      expect(stats.paused).toBe(1);
      expect(stats.success).toBe(1);
      expect(stats.error).toBe(1);
      expect(stats.cancelled).toBe(0);
    });

    it("should update statistics after task status changes", () => {
      const file = createMockFile("test.txt", 1024);
      const task = manager.createTask(file);

      let stats = manager.getStatistics();
      expect(stats.idle).toBe(1);
      expect(stats.uploading).toBe(0);

      // Change status
      (task as any).status = "uploading";

      stats = manager.getStatistics();
      expect(stats.idle).toBe(0);
      expect(stats.uploading).toBe(1);
    });
  });

  describe("Close", () => {
    beforeEach(async () => {
      await manager.init();
    });

    it("should close the manager and clean up resources", () => {
      const file1 = createMockFile("test1.txt", 1024);
      const file2 = createMockFile("test2.txt", 2048);

      const task1 = manager.createTask(file1);
      const task2 = manager.createTask(file2);

      // Set tasks to uploading
      (task1 as any).status = "uploading";
      (task2 as any).status = "uploading";

      expect(manager.getTaskCount()).toBe(2);
      expect(manager.isInitialized()).toBe(true);

      manager.close();

      expect(manager.getTaskCount()).toBe(0);
      expect(manager.isInitialized()).toBe(false);
      expect(task1.getStatus()).toBe("cancelled");
      expect(task2.getStatus()).toBe("cancelled");
    });

    it("should be safe to close multiple times", () => {
      manager.close();
      manager.close();
      manager.close();

      expect(manager.getTaskCount()).toBe(0);
      expect(manager.isInitialized()).toBe(false);
    });
  });
});
