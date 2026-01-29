import { useEffect, useState } from "react";
import { useUploadManager } from "@chunkflow/upload-client-react";
import { UploadButton, UploadList } from "@chunkflow/upload-component-react";

function ResumeUploadDemo() {
  const manager = useUploadManager();
  const [unfinishedTasks, setUnfinishedTasks] = useState<any[]>([]);

  useEffect(() => {
    const checkUnfinishedTasks = async () => {
      if (manager) {
        const tasks = manager.getAllTasks();
        const unfinished = tasks.filter((task) => {
          const status = task.getStatus();
          return status !== "success" && status !== "error";
        });
        setUnfinishedTasks(unfinished);
      }
    };

    checkUnfinishedTasks();
  }, [manager]);

  const handleResumeAll = async () => {
    if (manager) {
      for (const task of unfinishedTasks) {
        await task.resume();
      }
      setUnfinishedTasks([]);
    }
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

      <UploadButton accept="*/*" multiple maxSize={1024 * 1024 * 1024}>
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

      <UploadList />
    </div>
  );
}

export default ResumeUploadDemo;
