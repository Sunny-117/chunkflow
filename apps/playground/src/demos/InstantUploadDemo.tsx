import { useState } from "react";
import { useUpload } from "@chunkflow/upload-client-react";
import { UploadButton } from "@chunkflow/upload-component-react";

function InstantUploadDemo() {
  const [uploadHistory, setUploadHistory] = useState<
    Array<{ fileName: string; isInstant: boolean; time: string }>
  >([]);

  const { upload } = useUpload({
    onSuccess: (fileId: string) => {
      console.log("Upload completed:", fileId);
    },
  });

  const handleFileSelect = async (files: File[]) => {
    for (const file of files) {
      const startTime = Date.now();
      await upload(file);
      const duration = Date.now() - startTime;

      const isInstant = duration < 1000;

      setUploadHistory((prev) => [
        {
          fileName: file.name,
          isInstant,
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    }
  };

  return (
    <div className="demo-section">
      <h2>Instant Upload</h2>
      <p>
        Content-based deduplication. If someone already uploaded this exact file, you skip the
        upload entirely. Hash verification happens in milliseconds. Works across all users.
      </p>

      <UploadButton
        accept="*/*"
        multiple={false}
        maxSize={1024 * 1024 * 1024}
        onSelect={handleFileSelect}
      >
        Select File
      </UploadButton>

      <div className="info-box">
        <h4>How to Test</h4>
        <ol>
          <li>Upload any file (first time = normal upload)</li>
          <li>Upload the same file again</li>
          <li>Second upload completes instantly</li>
          <li>Try renaming the file—still instant if content matches</li>
        </ol>
      </div>

      {uploadHistory.length > 0 && (
        <div style={{ marginTop: "40px" }}>
          <h3 style={{ marginBottom: "20px", color: "var(--text)" }}>Upload History</h3>
          <div className="file-list">
            {uploadHistory.map((item, index) => (
              <div key={index} className="file-item">
                <div className="file-item-header">
                  <span className="file-name">{item.fileName}</span>
                  <span
                    className={`status-badge ${
                      item.isInstant ? "status-completed" : "status-uploading"
                    }`}
                  >
                    {item.isInstant ? "Instant" : "Normal"}
                  </span>
                </div>
                <div className="file-size">{item.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="info-box" style={{ borderColor: "#4caf50", marginTop: "32px" }}>
        <h4 style={{ color: "#4caf50" }}>Why This Matters</h4>
        <ul>
          <li>Zero bandwidth wasted on duplicate files</li>
          <li>Instant completion for known content</li>
          <li>Server storage automatically deduplicated</li>
          <li>Benefits compound across all users</li>
        </ul>
      </div>
    </div>
  );
}

export default InstantUploadDemo;
