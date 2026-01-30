import { useEffect, useState } from "react";
import { useUploadManager, useUploadList } from "@chunkflow/upload-client-react";
import { UploadButton } from "@chunkflow/upload-component-react";
import { message } from "antd";

function ResumeUploadDemo() {
  const manager = useUploadManager();
  const { uploadFiles } = useUploadList();
  const [unfinishedTasks, setUnfinishedTasks] = useState<any[]>([]);

  useEffect(() => {
    const checkUnfinishedTasks = async () => {
      if (manager) {
        const tasks = manager.getAllTasks();
        const unfinished = tasks.filter((task) => {
          const status = task.getStatus();
          return status !== "success" && status !== "error" && status !== "cancelled";
        });
        setUnfinishedTasks(unfinished);
      }
    };

    checkUnfinishedTasks();
  }, [manager]);

  const handleResumeAll = async () => {
    if (manager) {
      try {
        for (const task of unfinishedTasks) {
          await task.resume();
        }
        setUnfinishedTasks([]);
        message.success("All uploads resumed!");
      } catch (error) {
        message.error(`Failed to resume: ${(error as Error).message}`);
      }
    }
  };

  const handleFileSelect = (files: File[]) => {
    uploadFiles(files);
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
          <h4 style={{ color: "#ffc107" }}>Unfinished Uploads Detected</h4>
          <p style={{ color: "var(--text-dim)", marginBottom: "16px" }}>
            Found {unfinishedTasks.length} incomplete upload{unfinishedTasks.length > 1 ? "s" : ""}.
          </p>
          <button className="btn-primary" onClick={handleResumeAll}>
            Resume All
          </button>
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
          <li>Start uploading</li>
          <li>Pause or refresh the page mid-upload</li>
          <li>Return and resume—only missing chunks upload</li>
        </ol>
      </div>
    </div>
  );
}

export default ResumeUploadDemo;
