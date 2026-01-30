import { UploadButton, UploadList } from "@chunkflow/upload-component-react";
import { message } from "antd";

function BasicUploadDemo() {
  return (
    <div className="demo-section">
      <h2>Basic Upload</h2>
      <p>
        Select files and watch them upload in chunks. Progress tracking, speed calculation, and
        automatic retry on failure. No configuration needed.
      </p>

      <UploadButton
        accept="*/*"
        multiple
        maxSize={1024 * 1024 * 1024} // 1GB
        onError={(error) => {
          message.error(`Validation error: ${error.message}`);
        }}
      >
        Select Files
      </UploadButton>

      <UploadList />
    </div>
  );
}

export default BasicUploadDemo;
