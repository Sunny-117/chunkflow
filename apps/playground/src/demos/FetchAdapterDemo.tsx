import { useState, useMemo } from "react";
import { createFetchAdapter } from "@chunkflowjs/core";
import { UploadProvider, useUploadList } from "@chunkflowjs/upload-client-react";
import { UploadButton, UploadList } from "@chunkflowjs/upload-component-react";
import { message } from "antd";

/**
 * Demo: Using createFetchAdapter
 *
 * This demo shows how to use the built-in createFetchAdapter utility
 * to quickly create a request adapter without writing custom code.
 */
function FetchAdapterContent({ baseURL }: { baseURL: string }) {
  const { uploadFiles } = useUploadList();

  const handleFileSelect = (files: File[]) => {
    uploadFiles(files);
  };

  return (
    <>
      <div className="demo-actions">
        <UploadButton
          accept="*"
          multiple
          maxSize={100 * 1024 * 1024} // 100MB
          onSelect={handleFileSelect}
          onError={(error) => {
            message.error(`Validation error: ${error.message}`);
          }}
        >
          📁 Select Files to Upload
        </UploadButton>

        <div style={{ marginTop: "20px" }}>
          <UploadList baseURL={baseURL} />
        </div>
      </div>

      <div className="demo-features">
        <h3>Features</h3>
        <ul>
          <li>✅ Simple API - just provide baseURL and optional config</li>
          <li>✅ Custom headers support (e.g., authentication)</li>
          <li>✅ Configurable timeout</li>
          <li>✅ Error handling callback</li>
          <li>✅ Works with both browser and Node.js</li>
          <li>✅ Automatic retry on network errors</li>
        </ul>
      </div>

      <div className="demo-notes">
        <h3>📝 Notes</h3>
        <ul>
          <li>
            The adapter expects your server to have these endpoints:
            <ul>
              <li>
                <code>POST /upload/create</code> - Create upload session
              </li>
              <li>
                <code>POST /upload/verify</code> - Verify file hash
              </li>
              <li>
                <code>POST /upload/chunk</code> - Upload chunk
              </li>
              <li>
                <code>POST /upload/merge</code> - Merge chunks
              </li>
            </ul>
          </li>
          <li>Make sure your server is running on the configured base URL</li>
          <li>You can customize the adapter by providing your own fetch implementation</li>
        </ul>
      </div>
    </>
  );
}

export default function FetchAdapterDemo() {
  const [baseURL, setBaseURL] = useState("http://localhost:3001");
  const [authToken, setAuthToken] = useState("");

  // Create adapter with current settings (memoized to avoid recreating on every render)
  const adapter = useMemo(
    () =>
      createFetchAdapter({
        baseURL,
        headers: authToken
          ? {
              Authorization: `Bearer ${authToken}`,
            }
          : {},
        timeout: 30000,
        onError: (error) => {
          console.error("Upload error:", error);
          message.error(`Upload error: ${error.message}`);
        },
      }),
    [baseURL, authToken],
  );

  return (
    <UploadProvider requestAdapter={adapter}>
      <div className="demo-section">
        <div className="demo-header">
          <h2>🔌 Fetch Adapter Demo</h2>
          <p>
            Use the built-in <code>createFetchAdapter</code> to quickly set up uploads without
            writing custom adapter code.
          </p>
        </div>

        <div className="demo-config">
          <h3>Configuration</h3>
          <div className="config-group">
            <label>
              Base URL:
              <input
                type="text"
                value={baseURL}
                onChange={(e) => setBaseURL(e.target.value)}
                placeholder="http://localhost:3001"
              />
            </label>

            <label>
              Auth Token (optional):
              <input
                type="text"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="Bearer token..."
              />
            </label>
          </div>

          <div className="code-example">
            <h4>Code:</h4>
            <pre>
              {`import { createFetchAdapter } from "@chunkflowjs/core";
import { UploadProvider } from "@chunkflowjs/upload-client-react";
import { UploadButton, UploadList } from "@chunkflowjs/upload-component-react";

const adapter = createFetchAdapter({
  baseURL: "${baseURL}",${
    authToken
      ? `
  headers: {
    'Authorization': 'Bearer ${authToken}'
  },`
      : ""
  }
  timeout: 30000,
  onError: (error) => {
    console.error('Upload error:', error);
  }
});

function App() {
  return (
    <UploadProvider requestAdapter={adapter}>
      <UploadButton accept="*" multiple>
        Select Files
      </UploadButton>
      <UploadList />
    </UploadProvider>
  );
}`}
            </pre>
          </div>
        </div>

        <FetchAdapterContent baseURL={baseURL} />
      </div>
    </UploadProvider>
  );
}
