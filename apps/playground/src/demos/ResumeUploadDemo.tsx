import { useEffect, useState } from "react";
import { useUploadManager, useUploadList } from "@chunkflow/upload-client-react";
import { UploadButton } from "@chunkflow/upload-component-react";
import { message } from "antd";

interface UnfinishedTaskInfo {
  taskId: string;
  fileInfo: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  };
  uploadedChunks: number[];
  uploadToken: string;
  createdAt: number;
  updatedAt: number;
}

function ResumeUploadDemo() {
  const manager = useUploadManager();
  const { uploadFiles } = useUploadList();
  const [unfinishedTasks, setUnfinishedTasks] = useState<UnfinishedTaskInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUnfinishedTasks = async () => {
      if (manager) {
        try {
          const tasks = await manager.getUnfinishedTasksInfo();
          setUnfinishedTasks(tasks);
          if (tasks.length > 0) {
            console.log(`Found ${tasks.length} unfinished upload(s) from previous session`);
          }
        } catch (error) {
          console.error("Failed to load unfinished tasks:", error);
        }
      }
    };

    loadUnfinishedTasks();
  }, [manager]);

  const handleResumeTask = async (taskInfo: UnfinishedTaskInfo, file: File) => {
    if (!manager) return;

    try {
      setLoading(true);

      // Resume the task with the re-selected file
      const task = await manager.resumeTask(taskInfo.taskId, file);

      // Start the resumed task
      await task.start();

      // Remove from unfinished list
      setUnfinishedTasks((prev) => prev.filter((t) => t.taskId !== taskInfo.taskId));

      message.success(`Resumed upload: ${file.name}`);
    } catch (error) {
      message.error(`Failed to resume: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearTask = async (taskId: string) => {
    if (!manager) return;

    try {
      await manager.clearUnfinishedTask(taskId);
      setUnfinishedTasks((prev) => prev.filter((t) => t.taskId !== taskId));
      message.success("Task cleared");
    } catch (error) {
      message.error(`Failed to clear task: ${(error as Error).message}`);
    }
  };

  const handleClearAll = async () => {
    if (!manager) return;

    try {
      const count = await manager.clearAllUnfinishedTasks();
      setUnfinishedTasks([]);
      message.success(`Cleared ${count} unfinished task(s)`);
    } catch (error) {
      message.error(`Failed to clear tasks: ${(error as Error).message}`);
    }
  };

  const handleFileSelect = (files: File[]) => {
    uploadFiles(files);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="demo-section">
      <h2>Breakpoint Resume</h2>
      <p>
        Progress is saved automatically. Close the tab, refresh the page, or lose connection— when
        you come back, pick up exactly where you left off. No chunks re-uploaded.
      </p>

      {unfinishedTasks.length > 0 && (
        <div className="info-box" style={{ borderColor: "#ffc107", marginBottom: "32px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h4 style={{ color: "#ffc107", margin: 0 }}>Unfinished Uploads Detected</h4>
            <button
              className="btn-secondary"
              onClick={handleClearAll}
              style={{ fontSize: "14px", padding: "6px 12px" }}
            >
              Clear All
            </button>
          </div>
          <p style={{ color: "var(--text-dim)", marginBottom: "16px" }}>
            Found {unfinishedTasks.length} incomplete upload{unfinishedTasks.length > 1 ? "s" : ""}{" "}
            from previous session. Re-select the file(s) to resume.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {unfinishedTasks.map((taskInfo) => {
              const progress =
                (taskInfo.uploadedChunks.length / (taskInfo.fileInfo.size / (1024 * 1024))) * 100;

              return (
                <div
                  key={taskInfo.taskId}
                  style={{
                    background: "var(--card-bg)",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                      marginBottom: "8px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, marginBottom: "4px" }}>
                        {taskInfo.fileInfo.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                        {formatFileSize(taskInfo.fileInfo.size)} • {taskInfo.uploadedChunks.length}{" "}
                        chunks uploaded • Last updated: {formatDate(taskInfo.updatedAt)}
                      </div>
                    </div>
                    <button
                      className="btn-secondary"
                      onClick={() => handleClearTask(taskInfo.taskId)}
                      style={{ fontSize: "12px", padding: "4px 8px", marginLeft: "12px" }}
                    >
                      Clear
                    </button>
                  </div>

                  <label
                    htmlFor={`resume-${taskInfo.taskId}`}
                    className="btn-primary"
                    style={{
                      display: "inline-block",
                      cursor: "pointer",
                      fontSize: "14px",
                      padding: "6px 12px",
                    }}
                  >
                    {loading ? "Resuming..." : "Select File to Resume"}
                  </label>
                  <input
                    id={`resume-${taskInfo.taskId}`}
                    type="file"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleResumeTask(taskInfo, file);
                      }
                    }}
                    disabled={loading}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <UploadButton
        accept="*/*"
        multiple
        maxSize={1024 * 1024 * 1024}
        onSelect={handleFileSelect}
        onError={(error) => {
          message.error(`Validation error: ${error.message}`);
        }}
      >
        Select Files
      </UploadButton>

      <div className="info-box">
        <h4>How to Test</h4>
        <ol>
          <li>Select a large file (100MB+)</li>
          <li>Start uploading and wait for some progress</li>
          <li>Refresh the page or close the tab</li>
          <li>Come back and you'll see the unfinished upload</li>
          <li>Click "Select File to Resume" and choose the same file</li>
          <li>Upload continues from where it left off!</li>
        </ol>
      </div>
    </div>
  );
}

export default ResumeUploadDemo;
