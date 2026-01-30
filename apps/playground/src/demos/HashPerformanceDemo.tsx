import { useState, useRef, useEffect } from "react";
import { calculateFileHash, calculateFileHashBlocking, type HashStrategy } from "@chunkflow/shared";
import { message } from "antd";

type TestStrategy = HashStrategy | "blocking";

interface TestResult {
  strategy: TestStrategy;
  duration: number;
  hash: string;
  uiFrozen: boolean;
  animationDrops: number;
}

function HashPerformanceDemo() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [testing, setTesting] = useState(false);
  const [currentStrategy, setCurrentStrategy] = useState<TestStrategy | null>(null);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TestResult[]>([]);
  const [rotation, setRotation] = useState(0);
  const animationRef = useRef<number | undefined>(undefined);
  const frameCountRef = useRef(0);
  const expectedFramesRef = useRef(0);

  // Animation loop to detect UI freezing
  useEffect(() => {
    const animate = () => {
      setRotation((prev) => (prev + 2) % 360);
      frameCountRef.current++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate(); // Start the animation

    return () => {
      if (animationRef.current !== undefined && animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResults([]);
      message.success(`Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    }
  };

  const testStrategy = async (strategy: TestStrategy) => {
    if (!selectedFile) return;

    setCurrentStrategy(strategy);
    setProgress(0);

    console.log(`\n[HashPerformance] ========== Testing ${strategy} ==========`);
    console.log(
      `[HashPerformance] File: ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`,
    );

    const startTime = performance.now();
    const startFrameCount = frameCountRef.current;
    console.log(
      `[HashPerformance] Start time: ${startTime.toFixed(2)}ms, Start frame count: ${startFrameCount}`,
    );

    try {
      let hash: string;

      // Use the appropriate method based on strategy
      if (strategy === "blocking") {
        // Use the separate blocking method for comparison
        hash = await calculateFileHashBlocking(selectedFile, (p: number) => setProgress(p));
      } else {
        // Use the main API with strategy option
        hash = await calculateFileHash(selectedFile, {
          strategy,
          onProgress: (p: number) => setProgress(p),
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const endFrameCount = frameCountRef.current;
      const actualFrames = endFrameCount - startFrameCount;

      console.log(
        `[HashPerformance] End time: ${endTime.toFixed(2)}ms, End frame count: ${endFrameCount}`,
      );
      console.log(`[HashPerformance] Duration: ${(duration / 1000).toFixed(2)}s`);
      console.log(`[HashPerformance] Actual frames rendered: ${actualFrames}`);

      // Calculate expected frames at 60 FPS
      const expectedFrames = Math.floor((duration / 1000) * 60);
      expectedFramesRef.current = expectedFrames;
      console.log(`[HashPerformance] Expected frames at 60 FPS: ${expectedFrames}`);

      // If we dropped more than 20% of frames, UI was frozen
      const frameDropRate = actualFrames > 0 ? (expectedFrames - actualFrames) / expectedFrames : 1;
      const uiFrozen = frameDropRate > 0.2;
      const animationDrops = Math.max(0, expectedFrames - actualFrames);

      console.log(`[HashPerformance] Frame drop rate: ${(frameDropRate * 100).toFixed(1)}%`);
      console.log(`[HashPerformance] Animation drops: ${animationDrops} frames`);
      console.log(`[HashPerformance] UI frozen: ${uiFrozen ? "YES ❌" : "NO ✅"}`);
      console.log(`[HashPerformance] Hash: ${hash}`);

      const result: TestResult = {
        strategy,
        duration,
        hash,
        uiFrozen,
        animationDrops,
      };

      setResults((prev) => [...prev, result]);

      message.success(`${strategy} completed in ${(duration / 1000).toFixed(2)}s`);
    } catch (error) {
      console.error(`[HashPerformance] ${strategy} failed:`, error);
      message.error(`${strategy} failed: ${(error as Error).message}`);
    } finally {
      setCurrentStrategy(null);
      setProgress(0);
    }
  };

  const runAllTests = async () => {
    if (!selectedFile) {
      message.warning("Please select a file first");
      return;
    }

    setTesting(true);
    setResults([]);

    const strategies: TestStrategy[] = ["worker", "idle-callback", "blocking"];

    for (const strategy of strategies) {
      await testStrategy(strategy);
      // Wait a bit between tests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setTesting(false);
    message.success("All tests completed!");
  };

  const getStrategyColor = (strategy: TestStrategy) => {
    switch (strategy) {
      case "worker":
        return "#4caf50";
      case "idle-callback":
        return "#ff9800";
      case "blocking":
        return "#f44336";
      default:
        return "#999";
    }
  };

  const getStrategyName = (strategy: TestStrategy) => {
    switch (strategy) {
      case "worker":
        return "Web Worker";
      case "idle-callback":
        return "requestIdleCallback";
      case "blocking":
        return "Blocking (⚠️ Not Recommended)";
      default:
        return strategy;
    }
  };

  return (
    <div className="demo-section">
      <h2>Hash Calculation Performance</h2>
      <p>
        Compare different hash calculation strategies. Watch the spinning cube - if it freezes or
        stutters, the UI is blocked!
      </p>

      {/* Animation indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          marginBottom: "32px",
          padding: "20px",
          background: "var(--card-bg)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "12px",
            transform: `rotate(${rotation}deg)`,
            transition: "transform 0.016s linear",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
          }}
        />
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: "0 0 8px 0" }}>UI Responsiveness Indicator</h4>
          <p style={{ margin: 0, color: "var(--text-dim)", fontSize: "14px" }}>
            This cube should spin smoothly at 60 FPS. If it freezes or stutters during hash
            calculation, the UI is blocked.
          </p>
        </div>
      </div>

      {/* File selection */}
      <div style={{ marginBottom: "32px" }}>
        <label
          htmlFor="file-input"
          className="btn-primary"
          style={{ display: "inline-block", cursor: "pointer" }}
        >
          Select File to Test
        </label>
        <input
          id="file-input"
          type="file"
          onChange={handleFileSelect}
          style={{ display: "none" }}
          disabled={testing}
        />
        {selectedFile && (
          <div style={{ marginTop: "12px", color: "var(--text-dim)" }}>
            Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        )}
      </div>

      {/* Test controls */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "32px", flexWrap: "wrap" }}>
        <button
          className="btn-primary"
          onClick={runAllTests}
          disabled={!selectedFile || testing}
          style={{ minWidth: "150px" }}
        >
          {testing ? "Testing..." : "Run All Tests"}
        </button>
        <button
          className="btn-secondary"
          onClick={() => testStrategy("worker")}
          disabled={!selectedFile || testing}
        >
          Test Web Worker
        </button>
        <button
          className="btn-secondary"
          onClick={() => testStrategy("idle-callback")}
          disabled={!selectedFile || testing}
        >
          Test Idle Callback
        </button>
        <button
          className="btn-secondary"
          onClick={() => testStrategy("blocking")}
          disabled={!selectedFile || testing}
        >
          Test Blocking (⚠️ Not Recommended)
        </button>
      </div>

      {/* Progress */}
      {currentStrategy && (
        <div
          style={{
            marginBottom: "32px",
            padding: "20px",
            background: "var(--card-bg)",
            borderRadius: "12px",
            border: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontWeight: 500 }}>Testing: {getStrategyName(currentStrategy)}</span>
            <span style={{ color: "var(--text-dim)" }}>{progress.toFixed(1)}%</span>
          </div>
          <div
            style={{
              width: "100%",
              height: "8px",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: getStrategyColor(currentStrategy),
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div style={{ marginTop: "40px" }}>
          <h3 style={{ marginBottom: "20px" }}>Test Results</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {results.map((result, index) => (
              <div
                key={index}
                style={{
                  padding: "20px",
                  background: "var(--card-bg)",
                  borderRadius: "12px",
                  border: `2px solid ${getStrategyColor(result.strategy)}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <h4 style={{ margin: 0, color: getStrategyColor(result.strategy) }}>
                    {getStrategyName(result.strategy)}
                  </h4>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: 500,
                      background: result.uiFrozen
                        ? "rgba(244, 67, 54, 0.2)"
                        : "rgba(76, 175, 80, 0.2)",
                      color: result.uiFrozen ? "#f44336" : "#4caf50",
                    }}
                  >
                    {result.uiFrozen ? "❌ UI Frozen" : "✅ UI Smooth"}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "16px",
                    fontSize: "14px",
                  }}
                >
                  <div>
                    <div style={{ color: "var(--text-dim)", marginBottom: "4px" }}>Duration</div>
                    <div style={{ fontWeight: 500 }}>{(result.duration / 1000).toFixed(2)}s</div>
                  </div>
                  <div>
                    <div style={{ color: "var(--text-dim)", marginBottom: "4px" }}>
                      Animation Drops
                    </div>
                    <div style={{ fontWeight: 500 }}>
                      {result.animationDrops} frames
                      {result.animationDrops > 0 && (
                        <span style={{ color: "#f44336", marginLeft: "8px" }}>
                          ({((result.animationDrops / expectedFramesRef.current) * 100).toFixed(0)}%
                          dropped)
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "var(--text-dim)", marginBottom: "4px" }}>Hash</div>
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: "12px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {result.hash.substring(0, 16)}...
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison summary */}
          {results.length >= 2 && (
            <div className="info-box" style={{ borderColor: "#4caf50", marginTop: "32px" }}>
              <h4 style={{ color: "#4caf50" }}>Performance Summary</h4>
              <ul style={{ marginBottom: 0 }}>
                <li>
                  <strong>Web Worker (Recommended):</strong> Best performance - runs in separate
                  thread, UI stays responsive
                </li>
                <li>
                  <strong>requestIdleCallback:</strong> Good performance - uses browser idle time,
                  minimal UI impact
                </li>
                <li>
                  <strong>Blocking (⚠️ Not Recommended):</strong> Worst performance - freezes UI
                  completely during calculation. Only use for testing/comparison purposes.
                </li>
              </ul>
              <p style={{ marginTop: "12px", color: "var(--text-dim)", fontSize: "14px" }}>
                💡 The SDK automatically uses Web Worker by default. The blocking method is provided
                separately (<code>calculateFileHashBlocking</code>) only for performance comparison.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="info-box" style={{ marginTop: "32px" }}>
        <h4>How to Test</h4>
        <ol>
          <li>Select a file (larger files show more dramatic differences)</li>
          <li>Click "Run All Tests" to compare all strategies</li>
          <li>Watch the spinning cube - it should stay smooth with Worker/Idle strategies</li>
          <li>With "Blocking" strategy, the cube will freeze completely</li>
          <li>Check the results to see frame drops and UI responsiveness</li>
        </ol>
        <p style={{ marginTop: "12px", color: "var(--text-dim)", fontSize: "14px" }}>
          <strong>Note:</strong> This demo only calculates file hash for performance testing. No
          files are uploaded to the server.
        </p>
      </div>
    </div>
  );
}

export default HashPerformanceDemo;
