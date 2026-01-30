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
  UploadToken,
} from "@chunkflow/protocol";

export interface FetchRequestAdapterOptions {
  baseURL: string;
}

// Server API response types (actual format from server)
interface ServerCreateFileResponse {
  uploadToken: string;
  negotiatedChunkSize: number;
}

interface ServerMergeFileResponse {
  success: boolean;
  fileUrl: string;
  fileId: string;
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

    const data: ServerCreateFileResponse = await response.json();

    // Convert server response to protocol format
    // Parse JWT to extract fileId (optional, for now just use the token)
    const uploadToken: UploadToken = {
      token: data.uploadToken,
      fileId: "", // Will be extracted from JWT if needed
      chunkSize: data.negotiatedChunkSize,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };

    return {
      uploadToken,
      negotiatedChunkSize: data.negotiatedChunkSize,
    };
  }

  async verifyHash(request: VerifyHashRequest): Promise<VerifyHashResponse> {
    const response = await fetch(`${this.baseURL}/upload/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uploadToken:
          typeof request.uploadToken === "string" ? request.uploadToken : request.uploadToken,
        fileHash: request.fileHash,
        chunkHashes: request.chunkHashes,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to verify hash");
    }

    return response.json();
  }

  async uploadChunk(request: UploadChunkRequest): Promise<UploadChunkResponse> {
    const formData = new FormData();

    // Extract token string
    const token =
      typeof request.uploadToken === "string" ? request.uploadToken : request.uploadToken;

    formData.append("uploadToken", token);
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
    const token =
      typeof request.uploadToken === "string" ? request.uploadToken : request.uploadToken;

    const response = await fetch(`${this.baseURL}/upload/merge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uploadToken: token,
        fileHash: request.fileHash,
        chunkHashes: request.chunkHashes,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to merge file");
    }

    const data: ServerMergeFileResponse = await response.json();

    return {
      success: data.success,
      fileUrl: data.fileUrl,
      fileId: data.fileId,
    };
  }
}
