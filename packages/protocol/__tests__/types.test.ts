/**
 * Type definition tests for @chunkflow/protocol
 *
 * This package contains only TypeScript type definitions and interfaces.
 * These tests verify that the types are properly exported and can be imported.
 */

import { describe, it, expect } from "vitest";
import type {
  FileInfo,
  ChunkInfo,
  UploadToken,
  UploadStatus,
  UploadProgress,
  CreateFileRequest,
  CreateFileResponse,
  VerifyHashRequest,
  VerifyHashResponse,
  UploadChunkRequest,
  UploadChunkResponse,
  MergeFileRequest,
  MergeFileResponse,
  RequestAdapter,
} from "../src";

describe("Protocol Types", () => {
  it("should export FileInfo type", () => {
    const fileInfo: FileInfo = {
      name: "test.txt",
      size: 1024,
      type: "text/plain",
      lastModified: Date.now(),
    };
    expect(fileInfo).toBeDefined();
  });

  it("should export ChunkInfo type", () => {
    const chunkInfo: ChunkInfo = {
      index: 0,
      hash: "abc123",
      size: 1024,
      start: 0,
      end: 1024,
    };
    expect(chunkInfo).toBeDefined();
  });

  it("should export UploadToken type", () => {
    const token: UploadToken = {
      token: "test-token",
      fileId: "file-123",
      chunkSize: 1024 * 1024,
      expiresAt: Date.now() + 3600000,
    };
    expect(token).toBeDefined();
  });

  it("should export UploadStatus enum values", () => {
    const statuses: UploadStatus[] = [
      "idle",
      "hashing",
      "uploading",
      "paused",
      "success",
      "error",
      "cancelled",
    ];
    expect(statuses).toHaveLength(7);
  });

  it("should export UploadProgress type", () => {
    const progress: UploadProgress = {
      uploadedBytes: 512,
      totalBytes: 1024,
      percentage: 50,
      speed: 1024,
      remainingTime: 1,
      uploadedChunks: 1,
      totalChunks: 2,
    };
    expect(progress).toBeDefined();
  });

  it("should export request/response types", () => {
    const createRequest: CreateFileRequest = {
      fileName: "test.txt",
      fileSize: 1024,
      fileType: "text/plain",
    };

    const createResponse: CreateFileResponse = {
      uploadToken: {
        token: "test-token",
        fileId: "file-123",
        chunkSize: 1024 * 1024,
        expiresAt: Date.now() + 3600000,
      },
      negotiatedChunkSize: 1024 * 1024,
    };

    expect(createRequest).toBeDefined();
    expect(createResponse).toBeDefined();
  });

  it("should export RequestAdapter interface", () => {
    // This test just verifies the type can be used
    const adapter: RequestAdapter = {
      createFile: async () => ({
        uploadToken: {
          token: "test",
          fileId: "file-123",
          chunkSize: 1024 * 1024,
          expiresAt: Date.now() + 3600000,
        },
        negotiatedChunkSize: 1024 * 1024,
      }),
      verifyHash: async () => ({
        fileExists: false,
        existingChunks: [],
        missingChunks: [],
      }),
      uploadChunk: async () => ({
        success: true,
        chunkHash: "hash",
      }),
      mergeFile: async () => ({
        success: true,
        fileUrl: "url",
        fileId: "file-123",
      }),
    };

    expect(adapter).toBeDefined();
    expect(typeof adapter.createFile).toBe("function");
    expect(typeof adapter.verifyHash).toBe("function");
    expect(typeof adapter.uploadChunk).toBe("function");
    expect(typeof adapter.mergeFile).toBe("function");
  });
});
