import { useState } from "react";
import { useUploadManager } from "@chunkflow/upload-client-react";
import { message } from "antd";

function SimpleTest() {
  const manager = useUploadManager();
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous upload
    setUploadedFileUrl(null);

    console.log("=== Upload Started ===");
    console.log("File:", file.name, "Size:", file.size);

    const task = manager.createTask(file);

    task.on("start", () => {
      console.log("[Event] Upload started");
    });

    task.on("progress", () => {
      const progress = task.getProgress();
      if (progress >= 95) {
        console.log(
          `[Event] Progress: ${progress.percentage.toFixed(1)}% (${progress.uploadedChunks}/${progress.totalChunks} chunks)`,
        );
      }
    });

    task.on("success", ({ fileUrl }) => {
      console.log("[Event] Upload SUCCESS!");
      console.log("File URL:", fileUrl);

      // Convert relative URL to absolute URL
      const absoluteUrl = fileUrl.startsWith("/") ? `http://localhost:3001${fileUrl}` : fileUrl;

      setUploadedFileUrl(absoluteUrl);
      message.success(`Upload complete!`);
    });

    task.on("error", ({ error }) => {
      console.error("[Event] Upload ERROR:", error);
      console.error("Error stack:", error.stack);
      message.error(`Upload failed: ${error.message}. Check console for details.`);
    });

    try {
      console.log("Starting upload task...");
      await task.start();
      console.log("Task.start() completed");
    } catch (error) {
      console.error("Failed to start upload:", error);
      console.error("Error details:", error);
      message.error(`Failed to start upload: ${(error as Error).message}`);
    }
  };

  return (
    <div className="demo-section">
      <h2>Simple Upload Test</h2>
      <p>Basic test to verify the upload flow works correctly.</p>

      <input
        type="file"
        onChange={handleFileSelect}
        style={{ padding: "10px", fontSize: "16px" }}
      />

      {uploadedFileUrl && (
        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            background: "rgba(76, 175, 80, 0.1)",
            border: "1px solid #4caf50",
            borderRadius: "8px",
          }}
        >
          <h4 style={{ color: "#4caf50", marginBottom: "8px" }}>✅ Upload Successful!</h4>
          <a
            href={uploadedFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#4caf50",
              textDecoration: "underline",
              fontSize: "14px",
              wordBreak: "break-all",
            }}
          >
            {uploadedFileUrl}
          </a>
          <div style={{ marginTop: "12px" }}>
            <button
              onClick={() => window.open(uploadedFileUrl, "_blank")}
              className="btn-primary"
              style={{ fontSize: "14px", padding: "8px 16px" }}
            >
              Open File
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: "20px", padding: "10px", borderRadius: "4px" }}>
        <p>
          <strong>Instructions:</strong>
        </p>
        <ol>
          <li>Select a file (any size)</li>
          <li>Open browser console (F12)</li>
          <li>Watch for detailed logs</li>
          <li>Wait for completion and click the link to open</li>
        </ol>
        <p style={{ marginTop: "10px", color: "#666", fontSize: "14px" }}>
          <strong>Note:</strong> All events and errors are logged to console with [Event] prefix.
        </p>
      </div>
    </div>
  );
}

export default SimpleTest;
