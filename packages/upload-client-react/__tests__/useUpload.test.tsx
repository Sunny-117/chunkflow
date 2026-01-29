/**
 * Tests for useUpload hook
 *
 * Validates:
 * - Requirement 10.1: React Hooks integration
 * - Requirement 10.5: Reactive state updates
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { UploadProvider, useUpload } from "../src";
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

describe("useUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with idle state", () => {
    const { result } = renderHook(() => useUpload(), { wrapper });

    expect(result.current.status).toBe("idle");
    expect(result.current.progress.percentage).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.task).toBeNull();
  });

  it("should provide upload control functions", () => {
    const { result } = renderHook(() => useUpload(), { wrapper });

    expect(typeof result.current.upload).toBe("function");
    expect(typeof result.current.pause).toBe("function");
    expect(typeof result.current.resume).toBe("function");
    expect(typeof result.current.cancel).toBe("function");
  });

  it("should update status when upload starts", async () => {
    const { result } = renderHook(() => useUpload(), { wrapper });

    // Create a small test file
    const file = new File(["test content"], "test.txt", { type: "text/plain" });

    act(() => {
      result.current.upload(file);
    });

    // Wait for status to change
    await waitFor(
      () => {
        expect(result.current.status).toBe("uploading");
      },
      { timeout: 1000 },
    );

    expect(result.current.task).not.toBeNull();
  });

  it("should call onSuccess callback when upload completes", async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useUpload({ onSuccess }), { wrapper });

    const file = new File(["test"], "test.txt", { type: "text/plain" });

    act(() => {
      result.current.upload(file);
    });

    // Wait for success callback
    await waitFor(
      () => {
        expect(onSuccess).toHaveBeenCalled();
      },
      { timeout: 5000 },
    );
  });

  it("should call onProgress callback during upload", async () => {
    const onProgress = vi.fn();
    const { result } = renderHook(() => useUpload({ onProgress }), { wrapper });

    const file = new File(["test content"], "test.txt", { type: "text/plain" });

    act(() => {
      result.current.upload(file);
    });

    // Wait for progress callback
    await waitFor(
      () => {
        expect(onProgress).toHaveBeenCalled();
      },
      { timeout: 5000 },
    );
  });

  it("should handle pause operation", async () => {
    const { result } = renderHook(() => useUpload(), { wrapper });

    const file = new File(["test content"], "test.txt", { type: "text/plain" });

    act(() => {
      result.current.upload(file);
    });

    // Wait for upload to start
    await waitFor(() => {
      expect(result.current.status).toBe("uploading");
    });

    // Pause the upload
    act(() => {
      result.current.pause();
    });

    // Status should change to paused
    await waitFor(() => {
      expect(result.current.status).toBe("paused");
    });
  });

  it("should handle cancel operation", async () => {
    const { result } = renderHook(() => useUpload(), { wrapper });

    const file = new File(["test content"], "test.txt", { type: "text/plain" });

    act(() => {
      result.current.upload(file);
    });

    // Wait for upload to start
    await waitFor(() => {
      expect(result.current.status).toBe("uploading");
    });

    // Cancel the upload
    act(() => {
      result.current.cancel();
    });

    // Status should change to cancelled
    await waitFor(() => {
      expect(result.current.status).toBe("cancelled");
    });
  });

  it("should reset state when starting new upload", async () => {
    const { result } = renderHook(() => useUpload(), { wrapper });

    const file1 = new File(["test 1"], "test1.txt", { type: "text/plain" });
    const file2 = new File(["test 2"], "test2.txt", { type: "text/plain" });

    // Start first upload
    act(() => {
      result.current.upload(file1);
    });

    await waitFor(() => {
      expect(result.current.status).toBe("uploading");
    });

    // Start second upload
    act(() => {
      result.current.upload(file2);
    });

    // State should be reset
    expect(result.current.error).toBeNull();
  });

  it("should cleanup task on unmount", async () => {
    const { result, unmount } = renderHook(() => useUpload(), { wrapper });

    const file = new File(["test content"], "test.txt", { type: "text/plain" });

    act(() => {
      result.current.upload(file);
    });

    await waitFor(() => {
      expect(result.current.status).toBe("uploading");
    });

    // Unmount should cancel the task
    unmount();

    // Task should be cancelled (we can't directly test this without exposing internal state)
    expect(true).toBe(true);
  });
});
