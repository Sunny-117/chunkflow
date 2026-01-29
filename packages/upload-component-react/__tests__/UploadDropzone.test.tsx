/**
 * Tests for UploadDropzone component
 *
 * Validates: Requirement 11.5 (drag and drop upload)
 * Validates: Requirement 11.6 (file validation)
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UploadDropzone, FileValidationError } from "../src/UploadDropzone";

describe("UploadDropzone", () => {
  describe("Rendering", () => {
    it("should render with default content", () => {
      render(<UploadDropzone />);

      expect(screen.getByTestId("upload-dropzone")).toBeInTheDocument();
      expect(screen.getByTestId("dropzone-default-content")).toBeInTheDocument();
      expect(screen.getByText(/Drag and drop files here/i)).toBeInTheDocument();
    });

    it("should render with custom children", () => {
      render(
        <UploadDropzone>
          <div data-testid="custom-content">Custom dropzone content</div>
        </UploadDropzone>,
      );

      expect(screen.getByTestId("custom-content")).toBeInTheDocument();
      expect(screen.queryByTestId("dropzone-default-content")).not.toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(<UploadDropzone className="custom-dropzone" />);

      const dropzone = screen.getByTestId("upload-dropzone");
      expect(dropzone).toHaveClass("custom-dropzone");
    });

    it("should apply custom style", () => {
      const customStyle = { backgroundColor: "blue", padding: "20px" };
      render(<UploadDropzone style={customStyle} />);

      const dropzone = screen.getByTestId("upload-dropzone");
      expect(dropzone).toHaveStyle(customStyle);
    });

    it("should be disabled when disabled prop is true", () => {
      render(<UploadDropzone disabled />);

      const dropzone = screen.getByTestId("upload-dropzone");
      expect(dropzone).toHaveAttribute("aria-disabled", "true");
      expect(dropzone).toHaveAttribute("tabIndex", "-1");
    });
  });

  describe("Click to Select", () => {
    it("should trigger file input when clicked", async () => {
      const user = userEvent.setup();
      render(<UploadDropzone />);

      const dropzone = screen.getByTestId("upload-dropzone");
      await user.click(dropzone);

      // File input should be in the document (hidden)
      const input = document.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
    });

    it("should not trigger file input when disabled", async () => {
      const user = userEvent.setup();
      const onDrop = vi.fn();
      render(<UploadDropzone disabled onDrop={onDrop} />);

      const dropzone = screen.getByTestId("upload-dropzone");
      await user.click(dropzone);

      expect(onDrop).not.toHaveBeenCalled();
    });

    it("should handle keyboard activation (Enter key)", () => {
      render(<UploadDropzone />);

      const dropzone = screen.getByTestId("upload-dropzone");
      fireEvent.keyDown(dropzone, { key: "Enter" });

      // Should trigger click behavior
      const input = document.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
    });

    it("should handle keyboard activation (Space key)", () => {
      render(<UploadDropzone />);

      const dropzone = screen.getByTestId("upload-dropzone");
      fireEvent.keyDown(dropzone, { key: " " });

      // Should trigger click behavior
      const input = document.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
    });
  });

  describe("Drag and Drop", () => {
    it("should show dragging state on drag enter", () => {
      render(<UploadDropzone />);

      const dropzone = screen.getByTestId("upload-dropzone");

      fireEvent.dragEnter(dropzone, {
        dataTransfer: { items: [{}] },
      });

      expect(dropzone).toHaveAttribute("data-dragging", "true");
    });

    it("should remove dragging state on drag leave", () => {
      render(<UploadDropzone />);

      const dropzone = screen.getByTestId("upload-dropzone");

      fireEvent.dragEnter(dropzone, {
        dataTransfer: { items: [{}] },
      });
      expect(dropzone).toHaveAttribute("data-dragging", "true");

      fireEvent.dragLeave(dropzone);
      expect(dropzone).toHaveAttribute("data-dragging", "false");
    });

    it("should apply dragging className when dragging", () => {
      render(<UploadDropzone draggingClassName="is-dragging" />);

      const dropzone = screen.getByTestId("upload-dropzone");

      fireEvent.dragEnter(dropzone, {
        dataTransfer: { items: [{}] },
      });

      expect(dropzone).toHaveClass("is-dragging");
    });

    it("should call onDrop with files when dropped", () => {
      const onDrop = vi.fn();
      render(<UploadDropzone onDrop={onDrop} />);

      const dropzone = screen.getByTestId("upload-dropzone");
      const file = new File(["content"], "test.txt", { type: "text/plain" });

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
        },
      });

      expect(onDrop).toHaveBeenCalledWith([file]);
    });

    it("should not call onDrop when disabled", () => {
      const onDrop = vi.fn();
      render(<UploadDropzone disabled onDrop={onDrop} />);

      const dropzone = screen.getByTestId("upload-dropzone");
      const file = new File(["content"], "test.txt", { type: "text/plain" });

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
        },
      });

      expect(onDrop).not.toHaveBeenCalled();
    });

    it("should handle multiple files when multiple is true", () => {
      const onDrop = vi.fn();
      render(<UploadDropzone multiple onDrop={onDrop} />);

      const dropzone = screen.getByTestId("upload-dropzone");
      const files = [
        new File(["content1"], "test1.txt", { type: "text/plain" }),
        new File(["content2"], "test2.txt", { type: "text/plain" }),
      ];

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files,
        },
      });

      expect(onDrop).toHaveBeenCalledWith(files);
    });

    it("should limit to single file when multiple is false", () => {
      const onDrop = vi.fn();
      render(<UploadDropzone multiple={false} onDrop={onDrop} />);

      const dropzone = screen.getByTestId("upload-dropzone");
      const files = [
        new File(["content1"], "test1.txt", { type: "text/plain" }),
        new File(["content2"], "test2.txt", { type: "text/plain" }),
      ];

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files,
        },
      });

      expect(onDrop).toHaveBeenCalledWith([files[0]]);
    });
  });

  describe("File Validation", () => {
    it("should validate file size", () => {
      const onDrop = vi.fn();
      const onError = vi.fn();
      const maxSize = 100; // 100 bytes

      render(<UploadDropzone maxSize={maxSize} onDrop={onDrop} onError={onError} />);

      const dropzone = screen.getByTestId("upload-dropzone");
      const largeFile = new File(["a".repeat(200)], "large.txt", { type: "text/plain" });

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [largeFile],
        },
      });

      expect(onError).toHaveBeenCalled();
      expect(onDrop).not.toHaveBeenCalled();

      const error = onError.mock.calls[0][0] as FileValidationError;
      expect(error).toBeInstanceOf(FileValidationError);
      expect(error.code).toBe("FILE_TOO_LARGE");
    });

    it("should validate file type with exact MIME type", () => {
      const onDrop = vi.fn();
      const onError = vi.fn();

      render(<UploadDropzone accept="image/jpeg" onDrop={onDrop} onError={onError} />);

      const dropzone = screen.getByTestId("upload-dropzone");
      const textFile = new File(["content"], "test.txt", { type: "text/plain" });

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [textFile],
        },
      });

      expect(onError).toHaveBeenCalled();
      expect(onDrop).not.toHaveBeenCalled();

      const error = onError.mock.calls[0][0] as FileValidationError;
      expect(error.code).toBe("INVALID_FILE_TYPE");
    });

    it("should validate file type with wildcard MIME type", () => {
      const onDrop = vi.fn();
      const onError = vi.fn();

      render(<UploadDropzone accept="image/*" onDrop={onDrop} onError={onError} />);

      const dropzone = screen.getByTestId("upload-dropzone");
      const imageFile = new File(["content"], "test.jpg", { type: "image/jpeg" });

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [imageFile],
        },
      });

      expect(onError).not.toHaveBeenCalled();
      expect(onDrop).toHaveBeenCalledWith([imageFile]);
    });

    it("should validate file type with extension", () => {
      const onDrop = vi.fn();
      const onError = vi.fn();

      render(<UploadDropzone accept=".pdf,.doc" onDrop={onDrop} onError={onError} />);

      const dropzone = screen.getByTestId("upload-dropzone");
      const pdfFile = new File(["content"], "test.pdf", { type: "application/pdf" });

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [pdfFile],
        },
      });

      expect(onError).not.toHaveBeenCalled();
      expect(onDrop).toHaveBeenCalledWith([pdfFile]);
    });

    it("should pass valid files and report invalid files separately", () => {
      const onDrop = vi.fn();
      const onError = vi.fn();

      render(<UploadDropzone accept="image/*" maxSize={1000} onDrop={onDrop} onError={onError} />);

      const dropzone = screen.getByTestId("upload-dropzone");
      const validFile = new File(["small"], "valid.jpg", { type: "image/jpeg" });
      const invalidTypeFile = new File(["content"], "invalid.txt", { type: "text/plain" });
      const invalidSizeFile = new File(["a".repeat(2000)], "large.jpg", { type: "image/jpeg" });

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [validFile, invalidTypeFile, invalidSizeFile],
        },
      });

      // Should call onDrop with only valid file
      expect(onDrop).toHaveBeenCalledWith([validFile]);

      // Should call onError twice (once for each invalid file)
      expect(onError).toHaveBeenCalledTimes(2);
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      render(<UploadDropzone />);

      const dropzone = screen.getByTestId("upload-dropzone");
      expect(dropzone).toHaveAttribute("role", "button");
      expect(dropzone).toHaveAttribute("tabIndex", "0");
      expect(dropzone).toHaveAttribute("aria-disabled", "false");
    });

    it("should have proper ARIA attributes when disabled", () => {
      render(<UploadDropzone disabled />);

      const dropzone = screen.getByTestId("upload-dropzone");
      expect(dropzone).toHaveAttribute("aria-disabled", "true");
      expect(dropzone).toHaveAttribute("tabIndex", "-1");
    });
  });
});
