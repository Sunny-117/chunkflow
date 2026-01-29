/**
 * Tests for useUploadList hook
 *
 * Validates:
 * - Requirement 10.1: React Hooks integration
 * - Requirement 10.5: Reactive state updates
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { UploadProvider, useUploadList } from "../src";
import type { RequestAdapter } from "@chunkflow/protocol";

// Mock RequestAdapter
const mockRequestAdapter: RequestAdapter = {
  createFile: vi.fn().mockResolvedValue({
    uploadToken: {
      token: "test-token",
      fileId: "test-file-id",
      chunkSize: 1024 * 1024,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    },
    negotiatedChunkSize: 1024 * 1024,
  }),
  verifyHash: vi.fn().mockResolvedValue({
    fileExists: false,
    existingChunks: [],
    missingChunks: [],
  }),
  uploadChunk: vi.fn().mockResolvedValue({
    success: true,
    chunkHash: "test-hash",
  }),
  mergeFile: vi.fn().mockResolvedValue({
    success: true,
    fileUrl: "https://example.com/file.txt",
    fileId: "test-file-id",
  }),
};

// Wrapper component for hooks
function wrapper({ children }: { children: React.ReactNode }) {
  return <UploadProvider requestAdapter={mockRequestAdapter}>{children}</UploadProvider>;
}

describe("useUploadList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with empty task list", () => {
    const { result } = renderHook(() => useUploadList(), { wrapper });

    expect(result.current.tasks).toEqual([]);
  });

  it("should provide control functions", () => {
    const { result } = renderHook(() => useUploadList(), { wrapper });

    expect(typeof result.current.uploadFiles).toBe("function");
    expect(typeof result.current.pauseAll).toBe("function");
    expect(typeof result.current.resumeAll).toBe("function");
    expect(typeof result.current.cancelAll).toBe("function");
    expect(typeof result.current.removeTask).toBe("function");
    expect(typeof result.current.clearCompleted).toBe("function");
    expect(typeof result.current.getStatistics).toBe("function");
  });

  it("should add tasks when uploading files", async () => {
    const { result } = renderHook(() => useUploadList(), { wrapper });

    const files = [
      new File(["test 1"], "test1.txt", { type: "text/plain" }),
      new File(["test 2"], "test2.txt", { type: "text/plain" }),
    ];

    act(() => {
      result.current.uploadFiles(files);
    });

    // Wait for tasks to be added
    await waitFor(
      () => {
        expect(result.current.tasks.length).toBe(2);
      },
      { timeout: 1000 },
    );
  });

  it("should update task list reactively", async () => {
    const { result } = renderHook(() => useUploadList(), { wrapper });

    const file = new File(["test"], "test.txt", { type: "text/plain" });

    act(() => {
      result.current.uploadFiles([file]);
    });

    // Wait for task to be added
    await waitFor(() => {
      expect(result.current.tasks.length).toBe(1);
    });

    // Remove the task
    const taskId = result.current.tasks[0].id;
    act(() => {
      result.current.removeTask(taskId);
    });

    // Wait for task to be removed
    await waitFor(() => {
      expect(result.current.tasks.length).toBe(0);
    });
  });

  it("should pause all running tasks", async () => {
    const { result } = renderHook(() => useUploadList(), { wrapper });

    const files = [
      new File(["test 1"], "test1.txt", { type: "text/plain" }),
      new File(["test 2"], "test2.txt", { type: "text/plain" }),
    ];

    act(() => {
      result.current.uploadFiles(files);
    });

    // Wait for tasks to start
    await waitFor(() => {
      expect(result.current.tasks.length).toBe(2);
    });

    // Pause all tasks
    act(() => {
      result.current.pauseAll();
    });

    // Wait for tasks to be paused
    await waitFor(() => {
      const pausedCount = result.current.tasks.filter((t) => t.getStatus() === "paused").length;
      expect(pausedCount).toBeGreaterThan(0);
    });
  });

  it("should cancel all tasks", async () => {
    const { result } = renderHook(() => useUploadList(), { wrapper });

    const files = [
      new File(["test 1"], "test1.txt", { type: "text/plain" }),
      new File(["test 2"], "test2.txt", { type: "text/plain" }),
    ];

    act(() => {
      result.current.uploadFiles(files);
    });

    // Wait for tasks to start
    await waitFor(() => {
      expect(result.current.tasks.length).toBe(2);
    });

    // Cancel all tasks
    act(() => {
      result.current.cancelAll();
    });

    // Wait for tasks to be cancelled
    await waitFor(() => {
      const cancelledCount = result.current.tasks.filter(
        (t) => t.getStatus() === "cancelled",
      ).length;
      expect(cancelledCount).toBeGreaterThan(0);
    });
  });

  it("should provide task statistics", async () => {
    const { result } = renderHook(() => useUploadList(), { wrapper });

    const files = [
      new File(["test 1"], "test1.txt", { type: "text/plain" }),
      new File(["test 2"], "test2.txt", { type: "text/plain" }),
    ];

    act(() => {
      result.current.uploadFiles(files);
    });

    // Wait for tasks to be added
    await waitFor(() => {
      expect(result.current.tasks.length).toBe(2);
    });

    const stats = result.current.getStatistics();

    expect(stats.total).toBe(2);
    expect(typeof stats.uploading).toBe("number");
    expect(typeof stats.success).toBe("number");
    expect(typeof stats.error).toBe("number");
  });

  it("should clear completed tasks", async () => {
    const { result } = renderHook(() => useUploadList(), { wrapper });

    const file = new File(["test"], "test.txt", { type: "text/plain" });

    act(() => {
      result.current.uploadFiles([file]);
    });

    // Wait for task to be added
    await waitFor(() => {
      expect(result.current.tasks.length).toBe(1);
    });

    // Cancel the task to make it "completed"
    act(() => {
      result.current.cancelAll();
    });

    // Wait for task to be cancelled
    await waitFor(() => {
      const task = result.current.tasks[0];
      expect(task.getStatus()).toBe("cancelled");
    });

    // Clear completed tasks
    act(() => {
      result.current.clearCompleted();
    });

    // Wait for task to be removed
    await waitFor(() => {
      expect(result.current.tasks.length).toBe(0);
    });
  });

  it("should handle empty file list", () => {
    const { result } = renderHook(() => useUploadList(), { wrapper });

    act(() => {
      result.current.uploadFiles([]);
    });

    expect(result.current.tasks.length).toBe(0);
  });
});
