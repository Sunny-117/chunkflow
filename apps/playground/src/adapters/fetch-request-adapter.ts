import type {
  RequestAdapter,
  CreateFileRequest,
  CreateFileResponse,
  VerifyHashRequest,
  VerifyHashResponse,
  UploadChunkRequest,
  UploadChunkResponse,
  MergeFileRequest,
  MergeFileResponse,
} from "@chunkflow/protocol";

export interface FetchRequestAdapterOptions {
  baseURL: string;
}

export class FetchRequestAdapter implements RequestAdapter {
  private baseURL: string;

  constructor(options: FetchRequestAdapterOptions) {
    this.baseURL = options.baseURL.replace(/\/$/, ""); // Remove trailing slash
  }

  async createFile(request: CreateFileRequest): Promise<CreateFileResponse> {
    const response = await fetch(`${this.baseURL}/upload/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to create file");
    }

    return response.json();
  }

  async verifyHash(request: VerifyHashRequest): Promise<VerifyHashResponse> {
    const response = await fetch(`${this.baseURL}/upload/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to verify hash");
    }

    return response.json();
  }

  async uploadChunk(request: UploadChunkRequest): Promise<UploadChunkResponse> {
    const formData = new FormData();
    formData.append("uploadToken", request.uploadToken);
    formData.append("chunkIndex", request.chunkIndex.toString());
    formData.append("chunkHash", request.chunkHash);

    // Convert chunk to Blob
    const chunkBlob =
      request.chunk instanceof Blob
        ? request.chunk
        : new Blob([new Uint8Array(request.chunk as any)]);
    formData.append("file", chunkBlob);

    const response = await fetch(`${this.baseURL}/upload/chunk`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to upload chunk");
    }

    return response.json();
  }

  async mergeFile(request: MergeFileRequest): Promise<MergeFileResponse> {
    const response = await fetch(`${this.baseURL}/upload/merge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to merge file");
    }

    return response.json();
  }
}
