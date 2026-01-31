import { useState, useMemo } from "react";
import { createXHRAdapter } from "@chunkflowjs/core";
import { UploadProvider, useUploadList } from "@chunkflowjs/upload-client-react";
import { UploadButton, UploadList } from "@chunkflowjs/upload-component-react";
import { message } from "antd";

/**
 * Demo: Using createXHRAdapter
 *
 * This demo shows how to use the built-in createXHRAdapter utility
 * to create a request adapter using XMLHttpRequest with progress tracking.
 */
function XHRAdapterContent({ baseURL }: { baseURL: string }) {
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
          <li>✅ XMLHttpRequest-based - native browser API</li>
          <li>✅ Upload progress tracking support</li>
          <li>✅ Custom headers support (e.g., authentication)</li>
          <li>✅ Configurable timeout</li>
          <li>✅ Credentials (cookies) support</li>
          <li>✅ Error handling callback</li>
          <li>✅ Request abort support</li>
        </ul>
      </div>

      <div className="demo-notes">
        <h3>📝 Notes</h3>
        <ul>
          <li>
            <strong>XHR vs Fetch:</strong>
            <ul>
              <li>XHR provides native upload progress events</li>
              <li>XHR has better browser compatibility (IE10+)</li>
              <li>Fetch is more modern but requires polyfills for progress</li>
            </ul>
          </li>
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
          <li>
            You can track upload progress using the <code>onUploadProgress</code> callback
          </li>
        </ul>
      </div>
    </>
  );
}

export default function XHRAdapterDemo() {
  const [baseURL, setBaseURL] = useState("http://localhost:3001");
  const [authToken, setAuthToken] = useState("");
  const [withCredentials, setWithCredentials] = useState(false);

  // Create adapter with current settings (memoized to avoid recreating on every render)
  const adapter = useMemo(
    () =>
      createXHRAdapter({
        baseURL,
        headers: authToken
          ? {
              Authorization: `Bearer ${authToken}`,
            }
          : {},
        timeout: 30000,
        withCredentials,
        onUploadProgress: (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            console.log(`XHR Upload progress: ${percentComplete.toFixed(2)}%`);
          }
        },
        onError: (error) => {
          console.error("XHR Upload error:", error);
          message.error(`Upload error: ${error.message}`);
        },
      }),
    [baseURL, authToken, withCredentials],
  );

  return (
    <UploadProvider requestAdapter={adapter}>
      <div className="demo-section">
        <div className="demo-header">
          <h2>📡 XHR Adapter Demo</h2>
          <p>
            Use the built-in <code>createXHRAdapter</code> to set up uploads with XMLHttpRequest and
            native progress tracking.
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

            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                checked={withCredentials}
                onChange={(e) => setWithCredentials(e.target.checked)}
              />
              Send credentials (cookies)
            </label>
          </div>

          <div className="code-example">
            <h4>Code:</h4>
            <pre>
              {`import { createXHRAdapter } from "@chunkflowjs/core";
import { UploadProvider } from "@chunkflowjs/upload-client-react";
import { UploadButton, UploadList } from "@chunkflowjs/upload-component-react";

const adapter = createXHRAdapter({
  baseURL: "${baseURL}",${
    authToken
      ? `
  headers: {
    'Authorization': 'Bearer ${authToken}'
  },`
      : ""
  }
  timeout: 30000,${
    withCredentials
      ? `
  withCredentials: true,`
      : ""
  }
  onUploadProgress: (event) => {
    if (event.lengthComputable) {
      const percent = (event.loaded / event.total) * 100;
      console.log(\`Progress: \${percent.toFixed(2)}%\`);
    }
  },
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

        <XHRAdapterContent baseURL={baseURL} />
      </div>
    </UploadProvider>
  );
}
