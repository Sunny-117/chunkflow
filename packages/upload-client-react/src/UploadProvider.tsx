/**
 * UploadProvider - React Context Provider for UploadManager
 *
 * Provides UploadManager instance to React component tree via Context API.
 * Handles initialization and cleanup of the manager.
 *
 * @remarks
 * - Validates: Requirement 10.1 (React Hooks integration)
 * - Validates: Requirement 10.3 (auto-initialize on mount)
 * - Validates: Requirement 10.4 (auto-cleanup on unmount)
 */

import React, { createContext, useRef, useEffect, type ReactNode } from "react";
import { UploadManager, type UploadManagerOptions } from "@chunkflow/core";
import type { RequestAdapter } from "@chunkflow/protocol";

/**
 * Context value containing the UploadManager instance
 */
export interface UploadContextValue {
  /** The UploadManager instance */
  manager: UploadManager;
}

/**
 * React Context for UploadManager
 *
 * Provides access to the UploadManager instance throughout the component tree.
 * Use the useUploadManager hook to access this context.
 */
export const UploadContext = createContext<UploadContextValue | null>(null);

/**
 * Props for UploadProvider component
 */
export interface UploadProviderProps {
  /** Child components that will have access to the UploadManager */
  children: ReactNode;
  /** Request adapter for API calls (required) */
  requestAdapter: RequestAdapter;
  /** Optional configuration for the UploadManager */
  options?: Partial<UploadManagerOptions>;
}

/**
 * UploadProvider component
 *
 * Wraps your React application to provide upload functionality.
 * Creates and manages a single UploadManager instance for the entire app.
 *
 * @remarks
 * - Validates: Requirement 10.1 (React Hooks)
 * - Validates: Requirement 10.3 (auto-initialize on mount)
 * - Validates: Requirement 10.4 (auto-cleanup on unmount)
 * - Creates UploadManager instance once (persists across re-renders)
 * - Initializes manager on mount
 * - Cleans up manager on unmount
 *
 * @example
 * ```tsx
 * import { UploadProvider } from '@chunkflow/upload-client-react';
 * import { myRequestAdapter } from './api';
 *
 * function App() {
 *   return (
 *     <UploadProvider
 *       requestAdapter={myRequestAdapter}
 *       options={{
 *         maxConcurrentTasks: 5,
 *         defaultChunkSize: 2 * 1024 * 1024, // 2MB
 *       }}
 *     >
 *       <YourApp />
 *     </UploadProvider>
 *   );
 * }
 * ```
 */
export function UploadProvider({
  children,
  requestAdapter,
  options,
}: UploadProviderProps): React.JSX.Element {
  // Create UploadManager instance once using useRef
  // This ensures the manager persists across re-renders
  const managerRef = useRef<UploadManager>();

  // Initialize manager if not already created
  if (!managerRef.current) {
    managerRef.current = new UploadManager({
      requestAdapter,
      ...options,
    });
  }

  // Initialize manager on mount and cleanup on unmount
  useEffect(() => {
    const manager = managerRef.current;

    // Initialize the manager (loads unfinished tasks, etc.)
    // Requirement 10.3: Auto-initialize on mount
    manager?.init().catch((error) => {
      console.error("Failed to initialize UploadManager:", error);
    });

    // Cleanup on unmount
    // Requirement 10.4: Auto-cleanup on unmount
    return () => {
      manager?.close();
    };
  }, []); // Empty dependency array - run only on mount/unmount

  return (
    <UploadContext.Provider value={{ manager: managerRef.current }}>
      {children}
    </UploadContext.Provider>
  );
}
