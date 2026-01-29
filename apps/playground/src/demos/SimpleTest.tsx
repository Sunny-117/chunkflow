import { useUploadManager } from "@chunkflow/upload-client-react";

function SimpleTest() {
  const manager = useUploadManager();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("=== Upload Started ===");
    console.log("File:", file.name, "Size:", file.size);

    const task = manager.createTask(file);

    task.on("start", () => {
      console.log("[Event] Upload started");
    });

    task.on("progress", () => {
      const progress = task.getProgress();
      console.log(
        `[Event] Progress: ${progress.percentage.toFixed(1)}% (${progress.uploadedChunks}/${progress.totalChunks} chunks)`,
      );
    });

    task.on("success", ({ fileUrl }) => {
      console.log("[Event] Upload SUCCESS!");
      console.log("File URL:", fileUrl);
      alert(`✅ Upload complete!\n\nFile URL: ${fileUrl}`);
    });

    task.on("error", ({ error }) => {
      console.error("[Event] Upload ERROR:", error);
      console.error("Error stack:", error.stack);
      alert(`❌ Upload failed!\n\nError: ${error.message}\n\nCheck console for details.`);
    });

    try {
      console.log("Starting upload task...");
      await task.start();
      console.log("Task.start() completed");
    } catch (error) {
      console.error("Failed to start upload:", error);
      console.error("Error details:", error);
      alert(`❌ Failed to start upload!\n\nError: ${(error as Error).message}`);
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

      <div
        style={{ marginTop: "20px", padding: "10px", background: "#f5f5f5", borderRadius: "4px" }}
      >
        <p>
          <strong>Instructions:</strong>
        </p>
        <ol>
          <li>Select a file (any size)</li>
          <li>Open browser console (F12)</li>
          <li>Watch for detailed logs</li>
          <li>Wait for completion alert</li>
        </ol>
        <p style={{ marginTop: "10px", color: "#666", fontSize: "14px" }}>
          <strong>Note:</strong> All events and errors are logged to console with [Event] prefix.
        </p>
      </div>
    </div>
  );
}

export default SimpleTest;
