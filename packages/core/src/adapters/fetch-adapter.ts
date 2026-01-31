/**
 * Fetch-based RequestAdapter implementation
 * Provides a simple way to create an adapter using the Fetch API
 */

import type { RequestAdapter } from "@chunkflowjs/protocol";

/**
 * Options for creating a Fetch adapter
 */
export interface FetchAdapterOptions {
  /** Base URL for API requests */
  baseURL: string;
  /** Custom headers to include in all requests */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Custom fetch implementation (default: global fetch) */
  fetch?: typeof fetch;
  /** Callback for handling errors */
  onError?: (error: Error) => void;
}

/**
 * Create a Fetch-based RequestAdapter
 *
 * @param options - Configuration options
 * @returns RequestAdapter instance
 *
 * @example
 * ```typescript
 * const adapter = createFetchAdapter({
 *   baseURL: 'http://localhost:3000/api',
 *   headers: {
 *     'Authorization': 'Bearer token123'
 *   }
 * });
 *
 * const manager = new UploadManager({ requestAdapter: adapter });
 * ```
 */
export function createFetchAdapter(options: FetchAdapterOptions): RequestAdapter {
  const {
    baseURL,
    headers = {},
    timeout = 30000,
    fetch: customFetch = globalThis.fetch,
    onError,
  } = options;

  // Ensure baseURL doesn't end with slash
  const normalizedBaseURL = baseURL.replace(/\/$/, "");

  /**
   * Make a fetch request with timeout
   */
  async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await customFetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          ...headers,
          ...init?.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        if (onError) onError(error);
        throw error;
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (onError && error instanceof Error) onError(error);
      throw error;
    }
  }

  return {
    /**
     * Create a new file upload session
     */
    async createFile(request) {
      const response = await fetchWithTimeout(`${normalizedBaseURL}/upload/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: request.fileName,
          fileSize: request.fileSize,
          fileType: request.fileType,
          preferredChunkSize: request.preferredChunkSize,
        }),
      });

      const data = await response.json();

      // Convert server response to protocol format
      // Server returns { uploadToken: string, negotiatedChunkSize: number }
      // Protocol expects { uploadToken: UploadToken, negotiatedChunkSize: number }
      return {
        uploadToken: {
          token: data.uploadToken,
          fileId: "", // Will be extracted from JWT if needed
          chunkSize: data.negotiatedChunkSize,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        },
        negotiatedChunkSize: data.negotiatedChunkSize,
      };
    },

    /**
     * Verify file and chunk hashes
     */
    async verifyHash(request) {
      // Extract token string from UploadToken object or use string directly
      const token =
        typeof request.uploadToken === "string"
          ? request.uploadToken
          : (request.uploadToken as any).token;

      const response = await fetchWithTimeout(`${normalizedBaseURL}/upload/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileHash: request.fileHash,
          chunkHashes: request.chunkHashes,
          uploadToken: token,
        }),
      });

      return response.json();
    },

    /**
     * Upload a single chunk
     */
    async uploadChunk(request) {
      // Extract token string from UploadToken object or use string directly
      const token =
        typeof request.uploadToken === "string"
          ? request.uploadToken
          : (request.uploadToken as any).token;

      const formData = new FormData();
      formData.append("uploadToken", token);
      formData.append("chunkIndex", request.chunkIndex.toString());
      formData.append("chunkHash", request.chunkHash);

      // Handle both Blob and Buffer types
      if (request.chunk instanceof Blob) {
        formData.append("chunk", request.chunk);
      } else {
        // Convert Buffer to Blob for Node.js environments
        // Use type assertion as Buffer is compatible with BlobPart at runtime
        const blob = new Blob([request.chunk as unknown as BlobPart]);
        formData.append("chunk", blob);
      }

      const response = await fetchWithTimeout(`${normalizedBaseURL}/upload/chunk`, {
        method: "POST",
        body: formData,
      });

      return response.json();
    },

    /**
     * Merge all chunks into final file
     */
    async mergeFile(request) {
      // Extract token string from UploadToken object or use string directly
      const token =
        typeof request.uploadToken === "string"
          ? request.uploadToken
          : (request.uploadToken as any).token;

      const response = await fetchWithTimeout(`${normalizedBaseURL}/upload/merge`, {
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

      return response.json();
    },
  };
}
