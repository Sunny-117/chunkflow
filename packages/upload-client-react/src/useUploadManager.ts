/**
 * useUploadManager - React Hook to access UploadManager
 *
 * Provides access to the UploadManager instance from UploadContext.
 * Must be used within an UploadProvider.
 *
 * @remarks
 * - Validates: Requirement 10.1 (React Hooks)
 * - Throws error if used outside UploadProvider
 */

import { useContext } from "react";
import type { UploadManager } from "@chunkflow/core";
import { UploadContext } from "./UploadProvider";

/**
 * Hook to access the UploadManager instance
 *
 * Returns the UploadManager instance from the nearest UploadProvider.
 * Throws an error if used outside of an UploadProvider.
 *
 * @returns UploadManager instance
 * @throws Error if used outside UploadProvider
 *
 * @remarks
 * - Validates: Requirement 10.1 (React Hooks for upload functionality)
 * - Must be used within UploadProvider component tree
 * - Returns the same manager instance across all components
 *
 * @example
 * ```tsx
 * import { useUploadManager } from '@chunkflow/upload-client-react';
 *
 * function MyComponent() {
 *   const manager = useUploadManager();
 *
 *   const handleUpload = (file: File) => {
 *     const task = manager.createTask(file);
 *     task.start();
 *   };
 *
 *   return (
 *     <button onClick={() => handleUpload(myFile)}>
 *       Upload File
 *     </button>
 *   );
 * }
 * ```
 */
export function useUploadManager(): UploadManager {
  const context = useContext(UploadContext);

  if (!context) {
    throw new Error(
      "useUploadManager must be used within UploadProvider. " +
        "Wrap your component tree with <UploadProvider> to use upload hooks.",
    );
  }

  return context.manager;
}
