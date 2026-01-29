/**
 * File validation error
 */
export class FileValidationError extends Error {
  constructor(
    message: string,
    public code: "FILE_TOO_LARGE" | "INVALID_FILE_TYPE",
    public file: File,
  ) {
    super(message);
    this.name = "FileValidationError";
  }
}
