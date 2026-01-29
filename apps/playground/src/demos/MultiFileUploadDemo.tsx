import { useState, useEffect } from "react";
import { useUploadList } from "@chunkflow/upload-client-react";
import { UploadDropzone, UploadList } from "@chunkflow/upload-component-react";

function MultiFileUploadDemo() {
  const { tasks, uploadFiles, pauseAll, resumeAll, cancelAll } = useUploadList();
  const [stats, setStats] = useState({
    total: 0,
    uploading: 0,
    completed: 0,
    failed: 0,
  });

  useEffect(() => {
    const total = tasks.length;
    const uploading = tasks.filter((t) => t.getStatus() === "uploading").length;
    const completed = tasks.filter((t) => t.getStatus() === "success").length;
    const failed = tasks.filter((t) => t.getStatus() === "error").length;
    setStats({ total, uploading, completed, failed });
  }, [tasks]);

  const handleDrop = async (files: File[]) => {
    await uploadFiles(files);
  };

  return (
    <div className="demo-section">
      <h2>Multi-File</h2>
      <p>
        Drop multiple files at once. Each file uploads independently with its own progress tracking.
        Pause, resume, or cancel individual uploads or all at once.
      </p>

      <UploadDropzone
        accept="*/*"
        multiple
        maxSize={1024 * 1024 * 1024}
        onDrop={handleDrop}
        onError={(error) => {
          alert(`Validation error: ${error.message}`);
        }}
      >
        <div style={{ textAlign: "center", padding: "60px 40px" }}>
          <p
            style={{
              fontSize: "1.2rem",
              fontWeight: 600,
              marginBottom: "8px",
              color: "var(--text)",
            }}
          >
            Drop files here
          </p>
          <p style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>or click to browse</p>
        </div>
      </UploadDropzone>

      <div className="upload-stats">
        <div className="stat-card">
          <h3>Total</h3>
          <p>{stats.total}</p>
        </div>
        <div className="stat-card">
          <h3>Active</h3>
          <p>{stats.uploading}</p>
        </div>
        <div className="stat-card">
          <h3>Done</h3>
          <p>{stats.completed}</p>
        </div>
        <div className="stat-card">
          <h3>Failed</h3>
          <p>{stats.failed}</p>
        </div>
      </div>

      {tasks.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <div className="file-actions">
            <button className="btn-primary" onClick={resumeAll}>
              Resume All
            </button>
            <button className="btn-secondary" onClick={pauseAll}>
              Pause All
            </button>
            <button className="btn-danger" onClick={cancelAll}>
              Cancel All
            </button>
          </div>
        </div>
      )}

      <UploadList />
    </div>
  );
}

export default MultiFileUploadDemo;
