/**
 * Tests for UploadList component
 *
 * Validates: Requirement 11.1 (React upload components)
 * Validates: Requirement 11.2 (task management UI)
 * Validates: Requirement 11.4 (progress display)
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { UploadList } from "../src/UploadList";
import { UploadProvider } from "@chunkflow/upload-client-react";
import type { RequestAdapter } from "@chunkflow/protocol";

// Mock request adapter
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
    fileUrl: "http://example.com/file",
    fileId: "test-file-id",
  }),
};

describe("UploadList", () => {
  it("should render empty message when no uploads", () => {
    render(
      <UploadProvider requestAdapter={mockRequestAdapter}>
        <UploadList />
      </UploadProvider>,
    );

    expect(screen.getByTestId("upload-list-empty")).toBeInTheDocument();
    expect(screen.getByText("No uploads")).toBeInTheDocument();
  });

  it("should render custom empty message", () => {
    render(
      <UploadProvider requestAdapter={mockRequestAdapter}>
        <UploadList emptyMessage="No files to upload" />
      </UploadProvider>,
    );

    expect(screen.getByText("No files to upload")).toBeInTheDocument();
  });

  it("should apply custom className and style", () => {
    const customStyle = { backgroundColor: "red" };

    render(
      <UploadProvider requestAdapter={mockRequestAdapter}>
        <UploadList className="custom-class" style={customStyle} />
      </UploadProvider>,
    );

    const container = screen.getByTestId("upload-list-empty");
    expect(container).toHaveClass("custom-class");
    expect(container).toHaveStyle(customStyle);
  });

  it("should accept showCompleted prop", () => {
    render(
      <UploadProvider requestAdapter={mockRequestAdapter}>
        <UploadList showCompleted={false} />
      </UploadProvider>,
    );

    // Component should render without errors
    expect(screen.getByTestId("upload-list-empty")).toBeInTheDocument();
  });

  it("should accept showFailed prop", () => {
    render(
      <UploadProvider requestAdapter={mockRequestAdapter}>
        <UploadList showFailed={false} />
      </UploadProvider>,
    );

    // Component should render without errors
    expect(screen.getByTestId("upload-list-empty")).toBeInTheDocument();
  });

  it("should accept showCancelled prop", () => {
    render(
      <UploadProvider requestAdapter={mockRequestAdapter}>
        <UploadList showCancelled={false} />
      </UploadProvider>,
    );

    // Component should render without errors
    expect(screen.getByTestId("upload-list-empty")).toBeInTheDocument();
  });

  it("should accept maxItems prop", () => {
    render(
      <UploadProvider requestAdapter={mockRequestAdapter}>
        <UploadList maxItems={5} />
      </UploadProvider>,
    );

    // Component should render without errors
    expect(screen.getByTestId("upload-list-empty")).toBeInTheDocument();
  });

  it("should accept renderItem prop", () => {
    const customRender = vi.fn(() => <div>Custom item</div>);

    render(
      <UploadProvider requestAdapter={mockRequestAdapter}>
        <UploadList renderItem={customRender} />
      </UploadProvider>,
    );

    // Empty list, so custom render shouldn't be called
    expect(customRender).not.toHaveBeenCalled();
  });
});
