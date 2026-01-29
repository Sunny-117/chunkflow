/**
 * Unit tests for plugin system
 *
 * Tests the Plugin interface, LoggerPlugin, and StatisticsPlugin
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { UploadManager, LoggerPlugin, StatisticsPlugin, type Plugin } from "../src";
import type { UploadTask } from "../src/upload-task";
import type { UploadProgress } from "@chunkflow/protocol";

// Mock RequestAdapter
const mockRequestAdapter = {
  createFile: vi.fn(),
  verifyHash: vi.fn(),
  uploadChunk: vi.fn(),
  mergeFile: vi.fn(),
};

describe("Plugin System", () => {
  let manager: UploadManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new UploadManager({
      requestAdapter: mockRequestAdapter,
    });
  });

  describe("Plugin Registration", () => {
    it("should register a plugin", () => {
      const plugin: Plugin = {
        name: "test-plugin",
      };

      manager.use(plugin);

      // Plugin should be registered (no error thrown)
      expect(true).toBe(true);
    });

    it("should call plugin install hook", () => {
      const installSpy = vi.fn();
      const plugin: Plugin = {
        name: "test-plugin",
        install: installSpy,
      };

      manager.use(plugin);

      expect(installSpy).toHaveBeenCalledWith(manager);
      expect(installSpy).toHaveBeenCalledTimes(1);
    });

    it("should handle plugin install errors gracefully", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const plugin: Plugin = {
        name: "test-plugin",
        install: () => {
          throw new Error("Install failed");
        },
      };

      // Should not throw
      expect(() => manager.use(plugin)).not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should allow multiple plugins", () => {
      const plugin1: Plugin = { name: "plugin1" };
      const plugin2: Plugin = { name: "plugin2" };

      manager.use(plugin1);
      manager.use(plugin2);

      // Both plugins should be registered (no error thrown)
      expect(true).toBe(true);
    });
  });

  describe("Plugin Hooks", () => {
    it("should call onTaskCreated when task is created", () => {
      const onTaskCreatedSpy = vi.fn();
      const plugin: Plugin = {
        name: "test-plugin",
        onTaskCreated: onTaskCreatedSpy,
      };

      manager.use(plugin);

      const file = new File(["test"], "test.txt", { type: "text/plain" });
      const task = manager.createTask(file);

      expect(onTaskCreatedSpy).toHaveBeenCalledWith(task);
      expect(onTaskCreatedSpy).toHaveBeenCalledTimes(1);
    });

    it("should call onTaskStart when task starts", async () => {
      const onTaskStartSpy = vi.fn();
      const plugin: Plugin = {
        name: "test-plugin",
        onTaskStart: onTaskStartSpy,
      };

      manager.use(plugin);

      // Mock the request adapter
      mockRequestAdapter.createFile.mockResolvedValue({
        uploadToken: {
          token: "test-token",
          fileId: "test-file-id",
          chunkSize: 1024 * 1024,
          expiresAt: Date.now() + 3600000,
        },
        negotiatedChunkSize: 1024 * 1024,
      });

      mockRequestAdapter.verifyHash.mockResolvedValue({
        fileExists: false,
        existingChunks: [],
        missingChunks: [],
      });

      // Mock uploadChunk to prevent actual upload
      mockRequestAdapter.uploadChunk.mockResolvedValue({
        success: true,
        chunkHash: "test-hash",
      });

      const file = new File(["test content"], "test.txt", { type: "text/plain" });
      const task = manager.createTask(file);

      // Wait for the start event using a promise
      const startEventPromise = new Promise<void>((resolve) => {
        task.on("start", () => resolve());
      });

      // Start the task (will trigger start event)
      const startPromise = task.start();

      // Wait for the start event to be emitted
      await startEventPromise;

      expect(onTaskStartSpy).toHaveBeenCalledWith(task);

      // Cancel the task to clean up
      task.cancel();
      await startPromise.catch(() => {});
    });

    it("should handle plugin hook errors gracefully", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const plugin: Plugin = {
        name: "test-plugin",
        onTaskCreated: () => {
          throw new Error("Hook failed");
        },
      };

      manager.use(plugin);

      const file = new File(["test"], "test.txt", { type: "text/plain" });

      // Should not throw
      expect(() => manager.createTask(file)).not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should call hooks in order of plugin registration", () => {
      const callOrder: string[] = [];

      const plugin1: Plugin = {
        name: "plugin1",
        onTaskCreated: () => callOrder.push("plugin1"),
      };

      const plugin2: Plugin = {
        name: "plugin2",
        onTaskCreated: () => callOrder.push("plugin2"),
      };

      manager.use(plugin1);
      manager.use(plugin2);

      const file = new File(["test"], "test.txt", { type: "text/plain" });
      manager.createTask(file);

      expect(callOrder).toEqual(["plugin1", "plugin2"]);
    });
  });

  describe("LoggerPlugin", () => {
    it("should create logger plugin with default options", () => {
      const logger = new LoggerPlugin();

      expect(logger.name).toBe("logger");
    });

    it("should log task creation", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const logger = new LoggerPlugin();

      manager.use(logger);

      const file = new File(["test"], "test.txt", { type: "text/plain" });
      manager.createTask(file);

      expect(consoleSpy).toHaveBeenCalled();
      const logMessage = consoleSpy.mock.calls[1][1]; // First call is install, second is task created
      expect(logMessage).toContain("Task created");

      consoleSpy.mockRestore();
    });

    it("should respect custom options", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const logger = new LoggerPlugin({
        prefix: "[CustomPrefix]",
      });

      manager.use(logger);

      const file = new File(["test"], "test.txt", { type: "text/plain" });
      manager.createTask(file);

      expect(consoleSpy).toHaveBeenCalled();
      const logPrefix = consoleSpy.mock.calls[1][0]; // Get the prefix
      expect(logPrefix).toContain("[CustomPrefix]");

      consoleSpy.mockRestore();
    });

    it("should not log progress when disabled", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const logger = new LoggerPlugin({
        logProgress: false,
      });

      manager.use(logger);

      const file = new File(["test"], "test.txt", { type: "text/plain" });
      const task = manager.createTask(file);

      // Manually trigger progress event
      const progress: UploadProgress = {
        uploadedBytes: 100,
        totalBytes: 1000,
        percentage: 10,
        speed: 1000,
        remainingTime: 9,
        uploadedChunks: 1,
        totalChunks: 10,
      };

      // Simulate progress event
      task.on("progress", () => {});
      // @ts-expect-error - accessing private method for testing
      task.eventBus.emit("progress", { taskId: task.id, progress: 10, speed: 1000 });

      // Should not log progress
      const progressLogs = consoleSpy.mock.calls.filter((call) =>
        call[1]?.toString().includes("progress"),
      );
      expect(progressLogs.length).toBe(0);

      consoleSpy.mockRestore();
    });
  });

  describe("StatisticsPlugin", () => {
    it("should create statistics plugin", () => {
      const stats = new StatisticsPlugin();

      expect(stats.name).toBe("statistics");
    });

    it("should track total files", () => {
      const stats = new StatisticsPlugin();
      manager.use(stats);

      const file1 = new File(["test1"], "test1.txt", { type: "text/plain" });
      const file2 = new File(["test2"], "test2.txt", { type: "text/plain" });

      manager.createTask(file1);
      manager.createTask(file2);

      const metrics = stats.getStats();
      expect(metrics.totalFiles).toBe(2);
    });

    it("should track success count", () => {
      const stats = new StatisticsPlugin();
      manager.use(stats);

      const file = new File(["test"], "test.txt", { type: "text/plain" });
      const task = manager.createTask(file);

      // Simulate success
      // @ts-expect-error - accessing private method for testing
      task.eventBus.emit("success", { taskId: task.id, fileUrl: "http://example.com/file" });

      const metrics = stats.getStats();
      expect(metrics.successCount).toBe(1);
    });

    it("should track error count", () => {
      const stats = new StatisticsPlugin();
      manager.use(stats);

      const file = new File(["test"], "test.txt", { type: "text/plain" });
      const task = manager.createTask(file);

      // Simulate error
      // @ts-expect-error - accessing private method for testing
      task.eventBus.emit("error", { taskId: task.id, error: new Error("Test error") });

      const metrics = stats.getStats();
      expect(metrics.errorCount).toBe(1);
    });

    it("should track cancelled count", () => {
      const stats = new StatisticsPlugin();
      manager.use(stats);

      const file = new File(["test"], "test.txt", { type: "text/plain" });
      const task = manager.createTask(file);

      // Simulate cancel
      // @ts-expect-error - accessing private method for testing
      task.eventBus.emit("cancel", { taskId: task.id });

      const metrics = stats.getStats();
      expect(metrics.cancelledCount).toBe(1);
    });

    it("should calculate success rate", () => {
      const stats = new StatisticsPlugin();
      manager.use(stats);

      const file1 = new File(["test1"], "test1.txt", { type: "text/plain" });
      const file2 = new File(["test2"], "test2.txt", { type: "text/plain" });

      const task1 = manager.createTask(file1);
      const task2 = manager.createTask(file2);

      // Simulate one success and one error
      // @ts-expect-error - accessing private method for testing
      task1.eventBus.emit("success", { taskId: task1.id, fileUrl: "http://example.com/file1" });
      // @ts-expect-error - accessing private method for testing
      task2.eventBus.emit("error", { taskId: task2.id, error: new Error("Test error") });

      const metrics = stats.getStats();
      expect(metrics.successRate).toBe(50);
      expect(metrics.errorRate).toBe(50);
    });

    it("should reset statistics", () => {
      const stats = new StatisticsPlugin();
      manager.use(stats);

      const file = new File(["test"], "test.txt", { type: "text/plain" });
      manager.createTask(file);

      let metrics = stats.getStats();
      expect(metrics.totalFiles).toBe(1);

      stats.reset();

      metrics = stats.getStats();
      expect(metrics.totalFiles).toBe(0);
      expect(metrics.successCount).toBe(0);
      expect(metrics.errorCount).toBe(0);
    });

    it("should generate summary", () => {
      const stats = new StatisticsPlugin();
      manager.use(stats);

      const file = new File(["test"], "test.txt", { type: "text/plain" });
      const task = manager.createTask(file);

      // Simulate success
      // @ts-expect-error - accessing private method for testing
      task.eventBus.emit("success", { taskId: task.id, fileUrl: "http://example.com/file" });

      const summary = stats.getSummary();
      expect(summary).toContain("Upload Statistics");
      expect(summary).toContain("Total Files: 1");
      expect(summary).toContain("Success: 1");
    });
  });
});
