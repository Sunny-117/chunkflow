import { useState, useEffect } from "react";
import { UploadProvider } from "@chunkflowjs/upload-client-react";
import { FetchRequestAdapter } from "./adapters/fetch-request-adapter";
import { UploadList } from "@chunkflowjs/upload-component-react";
import BasicUploadDemo from "./demos/BasicUploadDemo";
import MultiFileUploadDemo from "./demos/MultiFileUploadDemo";
import ResumeUploadDemo from "./demos/ResumeUploadDemo";
import InstantUploadDemo from "./demos/InstantUploadDemo";
import SimpleTest from "./demos/SimpleTest";
import HashPerformanceDemo from "./demos/HashPerformanceDemo";
import FetchAdapterDemo from "./demos/FetchAdapterDemo";
import "./App.css";

const requestAdapter = new FetchRequestAdapter({
  baseURL: "http://localhost:3001",
});

const SERVER_BASE_URL = "http://localhost:3001";

type DemoTab = "simple" | "basic" | "multi" | "resume" | "instant" | "performance" | "adapter";

function App() {
  // Initialize from URL hash
  const getTabFromHash = (): DemoTab => {
    const hash = window.location.hash.slice(1); // Remove #
    const validTabs: DemoTab[] = [
      "simple",
      "basic",
      "multi",
      "resume",
      "instant",
      "performance",
      "adapter",
    ];
    return validTabs.includes(hash as DemoTab) ? (hash as DemoTab) : "simple";
  };

  const [activeTab, setActiveTab] = useState<DemoTab>(getTabFromHash);

  // Update URL when tab changes
  const handleTabChange = (tab: DemoTab) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  // Listen to hash changes (browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getTabFromHash());
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

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
                onClick={() => handleTabChange("simple")}
              >
                <span>Simple Test</span>
              </button>
              <button
                className={activeTab === "adapter" ? "active" : ""}
                onClick={() => handleTabChange("adapter")}
              >
                <span>🔌 Fetch Adapter</span>
              </button>
              <button
                className={activeTab === "basic" ? "active" : ""}
                onClick={() => handleTabChange("basic")}
              >
                <span>Basic Upload</span>
              </button>
              <button
                className={activeTab === "multi" ? "active" : ""}
                onClick={() => handleTabChange("multi")}
              >
                <span>Multi-File</span>
              </button>
              <button
                className={activeTab === "resume" ? "active" : ""}
                onClick={() => handleTabChange("resume")}
              >
                <span>Breakpoint Resume</span>
              </button>
              <button
                className={activeTab === "instant" ? "active" : ""}
                onClick={() => handleTabChange("instant")}
              >
                <span>Instant Upload</span>
              </button>
              <button
                className={activeTab === "performance" ? "active" : ""}
                onClick={() => handleTabChange("performance")}
              >
                <span>⚡ Hash Performance</span>
              </button>
            </nav>
          </aside>

          <main className="app-main">
            <div className="demo-content">
              {activeTab === "simple" && <SimpleTest />}
              {activeTab === "adapter" && <FetchAdapterDemo />}
              {activeTab === "basic" && <BasicUploadDemo />}
              {activeTab === "multi" && <MultiFileUploadDemo />}
              {activeTab === "resume" && <ResumeUploadDemo />}
              {activeTab === "instant" && <InstantUploadDemo />}
              {activeTab === "performance" && <HashPerformanceDemo />}
            </div>

            {/* Only show Upload Queue for upload demos, not for performance demo or adapter demo */}
            {activeTab !== "performance" && activeTab !== "adapter" && (
              <div className="upload-list-container">
                <h3>Upload Queue</h3>
                <UploadList baseURL={SERVER_BASE_URL} />
              </div>
            )}
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
