import { ReactNode, CSSProperties } from "react";
import type { UploadTask } from "@chunkflow/core";
import { UploadStatus } from "@chunkflow/protocol";
import { formatFileSize } from "@chunkflow/shared";
import { useUploadList } from "@chunkflow/upload-client-react";
import { UploadProgress } from "./UploadProgress";

/**
 * Props for the UploadList component
 */
export interface UploadListProps {
  /**
   * CSS class name for the container
   */
  className?: string;

  /**
   * Custom styles for the container
   */
  style?: CSSProperties;

  /**
   * Custom render function for each upload item
   * If provided, this will be used instead of the default item renderer
   */
  renderItem?: (task: UploadTask, actions: UploadItemActions) => ReactNode;

  /**
   * Whether to show completed uploads
   * @default true
   */
  showCompleted?: boolean;

  /**
   * Whether to show failed uploads
   * @default true
   */
  showFailed?: boolean;

  /**
   * Whether to show cancelled uploads
   * @default true
   */
  showCancelled?: boolean;

  /**
   * Maximum number of items to display
   * If not set, all items will be displayed
   */
  maxItems?: number;

  /**
   * Message to display when there are no uploads
   * @default "No uploads"
   */
  emptyMessage?: string;
}

/**
 * Actions available for each upload item
 */
export interface UploadItemActions {
  /** Pause the upload */
  pause: () => void;
  /** Resume the upload */
  resume: () => void;
  /** Cancel the upload */
  cancel: () => void;
  /** Remove the upload from the list */
  remove: () => void;
}

/**
 * Props for the default upload item component
 */
interface DefaultUploadItemProps {
  task: UploadTask;
  onRemove: () => void;
}

/**
 * Default upload item component
 *
 * Displays file info, progress, and action buttons
 */
function DefaultUploadItem({ task, onRemove }: DefaultUploadItemProps) {
  const status = task.getStatus();

  const defaultStyles = {
    container: {
      padding: "16px",
      border: "1px solid #e0e0e0",
      borderRadius: "8px",
      marginBottom: "8px",
      backgroundColor: "#fff",
    } as CSSProperties,
    fileInfo: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "8px",
    } as CSSProperties,
    fileName: {
      fontWeight: 500,
      fontSize: "14px",
      color: "#333",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap" as const,
      flex: 1,
      marginRight: "8px",
    } as CSSProperties,
    fileSize: {
      fontSize: "12px",
      color: "#999",
    } as CSSProperties,
    status: {
      fontSize: "12px",
      padding: "2px 8px",
      borderRadius: "4px",
      marginLeft: "8px",
    } as CSSProperties,
    actions: {
      display: "flex",
      gap: "8px",
      marginTop: "8px",
    } as CSSProperties,
    button: {
      padding: "4px 12px",
      fontSize: "12px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      backgroundColor: "#fff",
      cursor: "pointer",
      transition: "all 0.2s",
    } as CSSProperties,
  };

  const getStatusStyle = (status: UploadStatus): CSSProperties => {
    const baseStyle = defaultStyles.status;
    switch (status) {
      case UploadStatus.UPLOADING:
        return { ...baseStyle, backgroundColor: "#e3f2fd", color: "#1976d2" };
      case UploadStatus.SUCCESS:
        return { ...baseStyle, backgroundColor: "#e8f5e9", color: "#388e3c" };
      case UploadStatus.ERROR:
        return { ...baseStyle, backgroundColor: "#ffebee", color: "#d32f2f" };
      case UploadStatus.PAUSED:
        return { ...baseStyle, backgroundColor: "#fff3e0", color: "#f57c00" };
      case UploadStatus.CANCELLED:
        return { ...baseStyle, backgroundColor: "#f5f5f5", color: "#757575" };
      default:
        return { ...baseStyle, backgroundColor: "#f5f5f5", color: "#757575" };
    }
  };

  const getStatusText = (status: UploadStatus): string => {
    switch (status) {
      case UploadStatus.IDLE:
        return "Idle";
      case UploadStatus.HASHING:
        return "Hashing";
      case UploadStatus.UPLOADING:
        return "Uploading";
      case UploadStatus.PAUSED:
        return "Paused";
      case UploadStatus.SUCCESS:
        return "Success";
      case UploadStatus.ERROR:
        return "Error";
      case UploadStatus.CANCELLED:
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  return (
    <div style={defaultStyles.container} data-testid="upload-item">
      {/* File info */}
      <div style={defaultStyles.fileInfo}>
        <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
          <span style={defaultStyles.fileName} title={task.file.name}>
            {task.file.name}
          </span>
          <span style={defaultStyles.fileSize}>{formatFileSize(task.file.size)}</span>
        </div>
        <span style={getStatusStyle(status)} data-testid="upload-status">
          {getStatusText(status)}
        </span>
      </div>

      {/* Progress bar (only show for active uploads) */}
      {(status === UploadStatus.UPLOADING ||
        status === UploadStatus.PAUSED ||
        status === UploadStatus.HASHING) && <UploadProgress task={task} />}

      {/* Actions */}
      <div style={defaultStyles.actions}>
        {status === UploadStatus.UPLOADING && (
          <button
            onClick={() => task.pause()}
            style={defaultStyles.button}
            data-testid="pause-button"
            type="button"
          >
            Pause
          </button>
        )}

        {status === UploadStatus.PAUSED && (
          <button
            onClick={() => task.resume()}
            style={defaultStyles.button}
            data-testid="resume-button"
            type="button"
          >
            Resume
          </button>
        )}

        {(status === UploadStatus.UPLOADING || status === UploadStatus.PAUSED) && (
          <button
            onClick={() => task.cancel()}
            style={defaultStyles.button}
            data-testid="cancel-button"
            type="button"
          >
            Cancel
          </button>
        )}

        <button
          onClick={onRemove}
          style={defaultStyles.button}
          data-testid="remove-button"
          type="button"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

/**
 * UploadList component
 *
 * Displays a list of upload tasks with progress bars and action buttons.
 * Integrates with useUploadList hook to automatically sync with the upload manager.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <UploadList />
 *
 * // With custom styling
 * <UploadList
 *   className="my-upload-list"
 *   showCompleted={false}
 *   maxItems={10}
 * />
 *
 * // With custom item renderer
 * <UploadList
 *   renderItem={(task, actions) => (
 *     <div>
 *       <h3>{task.file.name}</h3>
 *       <button onClick={actions.pause}>Pause</button>
 *       <button onClick={actions.remove}>Remove</button>
 *     </div>
 *   )}
 * />
 * ```
 */
export function UploadList({
  className,
  style,
  renderItem,
  showCompleted = true,
  showFailed = true,
  showCancelled = true,
  maxItems,
  emptyMessage = "No uploads",
}: UploadListProps) {
  const { tasks, removeTask } = useUploadList();

  // Filter tasks based on props
  const filteredTasks = tasks.filter((task) => {
    const status = task.getStatus();

    if (!showCompleted && status === UploadStatus.SUCCESS) {
      return false;
    }

    if (!showFailed && status === UploadStatus.ERROR) {
      return false;
    }

    if (!showCancelled && status === UploadStatus.CANCELLED) {
      return false;
    }

    return true;
  });

  // Limit number of items if maxItems is set
  const displayTasks = maxItems ? filteredTasks.slice(0, maxItems) : filteredTasks;

  const defaultStyles = {
    container: {
      width: "100%",
    } as CSSProperties,
    empty: {
      padding: "32px",
      textAlign: "center" as const,
      color: "#999",
      fontSize: "14px",
    } as CSSProperties,
  };

  // Show empty message if no tasks
  if (displayTasks.length === 0) {
    return (
      <div
        className={className}
        style={style || defaultStyles.container}
        data-testid="upload-list-empty"
      >
        <div style={defaultStyles.empty}>{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={className} style={style || defaultStyles.container} data-testid="upload-list">
      {displayTasks.map((task) => {
        const actions: UploadItemActions = {
          pause: () => task.pause(),
          resume: () => task.resume(),
          cancel: () => task.cancel(),
          remove: () => removeTask(task.id),
        };

        return (
          <div key={task.id} data-testid="upload-list-item">
            {renderItem ? (
              renderItem(task, actions)
            ) : (
              <DefaultUploadItem task={task} onRemove={actions.remove} />
            )}
          </div>
        );
      })}
    </div>
  );
}
