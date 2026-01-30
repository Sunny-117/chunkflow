import { useState } from "react";
import { UploadProvider } from "@chunkflow/upload-client-react";
import { FetchRequestAdapter } from "./adapters/fetch-request-adapter";
import { UploadList } from "@chunkflow/upload-component-react";
import BasicUploadDemo from "./demos/BasicUploadDemo";
import MultiFileUploadDemo from "./demos/MultiFileUploadDemo";
import ResumeUploadDemo from "./demos/ResumeUploadDemo";
import InstantUploadDemo from "./demos/InstantUploadDemo";
import SimpleTest from "./demos/SimpleTest";
import "./App.css";

const requestAdapter = new FetchRequestAdapter({
  baseURL: "http://localhost:3001",
});

type DemoTab = "simple" | "basic" | "multi" | "resume" | "instant";

function App() {
  const [activeTab, setActiveTab] = useState<DemoTab>("simple");

  return (
    <UploadProvider requestAdapter={requestAdapter}>
      <div className="app">
        <header className="app-header">
          <h1>ChunkFlow</h1>
          <p>Large file uploads that don't suck. Chunked, resumable, and blazingly fast.</p>
        </header>

        <div className="app-container">
          <aside className="app-sidebar">
            <nav className="app-nav">
              <button
                className={activeTab === "simple" ? "active" : ""}
                onClick={() => setActiveTab("simple")}
              >
                <span>Simple Test</span>
              </button>
              <button
                className={activeTab === "basic" ? "active" : ""}
                onClick={() => setActiveTab("basic")}
              >
                <span>Basic Upload</span>
              </button>
              <button
                className={activeTab === "multi" ? "active" : ""}
                onClick={() => setActiveTab("multi")}
              >
                <span>Multi-File</span>
              </button>
              <button
                className={activeTab === "resume" ? "active" : ""}
                onClick={() => setActiveTab("resume")}
              >
                <span>Breakpoint Resume</span>
              </button>
              <button
                className={activeTab === "instant" ? "active" : ""}
                onClick={() => setActiveTab("instant")}
              >
                <span>Instant Upload</span>
              </button>
            </nav>
          </aside>

          <main className="app-main">
            <div className="demo-content">
              {activeTab === "simple" && <SimpleTest />}
              {activeTab === "basic" && <BasicUploadDemo />}
              {activeTab === "multi" && <MultiFileUploadDemo />}
              {activeTab === "resume" && <ResumeUploadDemo />}
              {activeTab === "instant" && <InstantUploadDemo />}
            </div>

            <div className="upload-list-container">
              <h3>Upload Queue</h3>
              <UploadList />
            </div>
          </main>
        </div>

        <footer className="app-footer">
          <p>
            Built with care, not templates.{" "}
            <a
              href="https://github.com/Sunny-117/chunkflow"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Source
            </a>
          </p>
        </footer>
      </div>
    </UploadProvider>
  );
}

export default App;
