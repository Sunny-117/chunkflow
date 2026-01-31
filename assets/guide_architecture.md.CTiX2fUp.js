import{_ as a,o as n,c as e,ag as p}from"./chunks/framework.C95KxxkN.js";const u=JSON.parse('{"title":"Architecture","description":"","frontmatter":{},"headers":[],"relativePath":"guide/architecture.md","filePath":"guide/architecture.md","lastUpdated":1769827945000}'),l={name:"guide/architecture.md"};function i(t,s,o,r,c,h){return n(),e("div",null,[...s[0]||(s[0]=[p(`<h1 id="architecture" tabindex="-1">Architecture <a class="header-anchor" href="#architecture" aria-label="Permalink to &quot;Architecture&quot;">​</a></h1><p>ChunkFlow is built with a layered architecture where each layer has a specific responsibility and can be used independently.</p><h2 id="layered-architecture" tabindex="-1">Layered Architecture <a class="header-anchor" href="#layered-architecture" aria-label="Permalink to &quot;Layered Architecture&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>┌─────────────────────────────────────────────────────────────┐</span></span>
<span class="line"><span>│                     应用层 (Apps)                            │</span></span>
<span class="line"><span>│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │</span></span>
<span class="line"><span>│  │  Playground  │  │    Server    │  │   Website    │      │</span></span>
<span class="line"><span>│  │   (Demo)     │  │  (Nest.js)   │  │ (VitePress)  │      │</span></span>
<span class="line"><span>│  └──────────────┘  └──────────────┘  └──────────────┘      │</span></span>
<span class="line"><span>└─────────────────────────────────────────────────────────────┘</span></span>
<span class="line"><span>                            │</span></span>
<span class="line"><span>┌─────────────────────────────────────────────────────────────┐</span></span>
<span class="line"><span>│                     组件层 (Components)                      │</span></span>
<span class="line"><span>│  ┌──────────────────────────┐  ┌──────────────────────────┐ │</span></span>
<span class="line"><span>│  │  upload-component-react  │  │  upload-component-vue    │ │</span></span>
<span class="line"><span>│  └──────────────────────────┘  └──────────────────────────┘ │</span></span>
<span class="line"><span>└─────────────────────────────────────────────────────────────┘</span></span>
<span class="line"><span>                            │</span></span>
<span class="line"><span>┌─────────────────────────────────────────────────────────────┐</span></span>
<span class="line"><span>│                   框架适配层 (Client)                        │</span></span>
<span class="line"><span>│  ┌──────────────────────────┐  ┌──────────────────────────┐ │</span></span>
<span class="line"><span>│  │  upload-client-react     │  │  upload-client-vue       │ │</span></span>
<span class="line"><span>│  └──────────────────────────┘  └──────────────────────────┘ │</span></span>
<span class="line"><span>└─────────────────────────────────────────────────────────────┘</span></span>
<span class="line"><span>                            │</span></span>
<span class="line"><span>┌─────────────────────────────────────────────────────────────┐</span></span>
<span class="line"><span>│                      核心层 (Core)                           │</span></span>
<span class="line"><span>│  ┌──────────────────────────────────────────────────────┐   │</span></span>
<span class="line"><span>│  │  @chunkflowjs/core                                     │   │</span></span>
<span class="line"><span>│  │  - UploadManager (状态机、队列管理)                  │   │</span></span>
<span class="line"><span>│  │  - UploadTask (单个上传任务)                         │   │</span></span>
<span class="line"><span>│  │  - Plugin System (插件机制)                          │   │</span></span>
<span class="line"><span>│  └──────────────────────────────────────────────────────┘   │</span></span>
<span class="line"><span>└─────────────────────────────────────────────────────────────┘</span></span>
<span class="line"><span>                            │</span></span>
<span class="line"><span>┌─────────────────────────────────────────────────────────────┐</span></span>
<span class="line"><span>│                   共享层 (Shared)                            │</span></span>
<span class="line"><span>│  ┌──────────────────────────────────────────────────────┐   │</span></span>
<span class="line"><span>│  │  @chunkflowjs/shared                                   │   │</span></span>
<span class="line"><span>│  │  - 事件系统 (mitt)                                    │   │</span></span>
<span class="line"><span>│  │  - 并发控制 (p-limit)                                │   │</span></span>
<span class="line"><span>│  │  - 文件工具 (切片、Hash)                             │   │</span></span>
<span class="line"><span>│  └──────────────────────────────────────────────────────┘   │</span></span>
<span class="line"><span>└─────────────────────────────────────────────────────────────┘</span></span>
<span class="line"><span>                            │</span></span>
<span class="line"><span>┌─────────────────────────────────────────────────────────────┐</span></span>
<span class="line"><span>│                    协议层 (Protocol)                         │</span></span>
<span class="line"><span>│  ┌──────────────────────────────────────────────────────┐   │</span></span>
<span class="line"><span>│  │  @chunkflowjs/protocol                                 │   │</span></span>
<span class="line"><span>│  │  - 接口定义 (TypeScript Types)                       │   │</span></span>
<span class="line"><span>│  │  - 请求/响应格式                                      │   │</span></span>
<span class="line"><span>│  └──────────────────────────────────────────────────────┘   │</span></span>
<span class="line"><span>└─────────────────────────────────────────────────────────────┘</span></span>
<span class="line"><span></span></span>
<span class="line"><span>┌─────────────────────────────────────────────────────────────┐</span></span>
<span class="line"><span>│                   服务端层 (Server)                          │</span></span>
<span class="line"><span>│  ┌──────────────────────────────────────────────────────┐   │</span></span>
<span class="line"><span>│  │  @chunkflowjs/server                                   │   │</span></span>
<span class="line"><span>│  │  - BFF SDK                                           │   │</span></span>
<span class="line"><span>│  │  - 存储适配器                                         │   │</span></span>
<span class="line"><span>│  └──────────────────────────────────────────────────────┘   │</span></span>
<span class="line"><span>└─────────────────────────────────────────────────────────────┘</span></span></code></pre></div><h2 id="layer-responsibilities" tabindex="-1">Layer Responsibilities <a class="header-anchor" href="#layer-responsibilities" aria-label="Permalink to &quot;Layer Responsibilities&quot;">​</a></h2><h3 id="protocol-layer-chunkflowjs-protocol" tabindex="-1">Protocol Layer (@chunkflowjs/protocol) <a class="header-anchor" href="#protocol-layer-chunkflowjs-protocol" aria-label="Permalink to &quot;Protocol Layer (@chunkflowjs/protocol)&quot;">​</a></h3><p><strong>Purpose</strong>: Define communication contracts</p><p><strong>Responsibilities</strong>:</p><ul><li>TypeScript type definitions</li><li>API request/response interfaces</li><li>Error types</li><li>Constants</li></ul><p><strong>Dependencies</strong>: None</p><p><strong>Used By</strong>: All other layers</p><p><strong>Key Files</strong>:</p><ul><li><code>types.ts</code> - Core type definitions</li><li><code>interfaces.ts</code> - API interfaces</li><li><code>constants.ts</code> - Constants</li></ul><h3 id="shared-layer-chunkflowjs-shared" tabindex="-1">Shared Layer (@chunkflowjs/shared) <a class="header-anchor" href="#shared-layer-chunkflowjs-shared" aria-label="Permalink to &quot;Shared Layer (@chunkflowjs/shared)&quot;">​</a></h3><p><strong>Purpose</strong>: Provide common utilities</p><p><strong>Responsibilities</strong>:</p><ul><li>Event system (using mitt)</li><li>Concurrency control (using p-limit)</li><li>File utilities (slicing, hashing)</li><li>IndexedDB storage</li><li>Helper functions</li></ul><p><strong>Dependencies</strong>: Protocol layer</p><p><strong>Used By</strong>: Core, Client, Component layers</p><p><strong>Key Files</strong>:</p><ul><li><code>events.ts</code> - Event bus</li><li><code>concurrency.ts</code> - Concurrency controller</li><li><code>file-utils.ts</code> - File operations</li><li><code>storage.ts</code> - IndexedDB wrapper</li></ul><h3 id="core-layer-chunkflowjs-core" tabindex="-1">Core Layer (@chunkflowjs/core) <a class="header-anchor" href="#core-layer-chunkflowjs-core" aria-label="Permalink to &quot;Core Layer (@chunkflowjs/core)&quot;">​</a></h3><p><strong>Purpose</strong>: Implement upload logic</p><p><strong>Responsibilities</strong>:</p><ul><li>Upload state machine</li><li>Task lifecycle management</li><li>Queue management</li><li>Plugin system</li><li>Dynamic chunk sizing</li><li>Retry logic</li></ul><p><strong>Dependencies</strong>: Protocol, Shared layers</p><p><strong>Used By</strong>: Client, Component layers, or directly</p><p><strong>Key Files</strong>:</p><ul><li><code>UploadManager.ts</code> - Task manager</li><li><code>UploadTask.ts</code> - Single upload task</li><li><code>ChunkSizeAdjuster.ts</code> - Dynamic chunking</li><li><code>plugins/</code> - Plugin implementations</li></ul><h3 id="client-layer-react-vue" tabindex="-1">Client Layer (React/Vue) <a class="header-anchor" href="#client-layer-react-vue" aria-label="Permalink to &quot;Client Layer (React/Vue)&quot;">​</a></h3><p><strong>Purpose</strong>: Framework integration</p><p><strong>Responsibilities</strong>:</p><ul><li>Framework-specific adapters</li><li>Reactive state management</li><li>Lifecycle integration</li><li>Context/Provider setup</li></ul><p><strong>Dependencies</strong>: Core layer</p><p><strong>Used By</strong>: Component layer, or directly</p><p><strong>React Package</strong>:</p><ul><li><code>UploadProvider.tsx</code> - Context provider</li><li><code>useUpload.ts</code> - Upload hook</li><li><code>useUploadList.ts</code> - List hook</li><li><code>useUploadManager.ts</code> - Manager hook</li></ul><p><strong>Vue Package</strong>:</p><ul><li><code>plugin.ts</code> - Vue plugin</li><li><code>useUpload.ts</code> - Upload composable</li><li><code>useUploadList.ts</code> - List composable</li></ul><h3 id="component-layer-react-vue" tabindex="-1">Component Layer (React/Vue) <a class="header-anchor" href="#component-layer-react-vue" aria-label="Permalink to &quot;Component Layer (React/Vue)&quot;">​</a></h3><p><strong>Purpose</strong>: Ready-to-use UI components</p><p><strong>Responsibilities</strong>:</p><ul><li>Pre-built upload components</li><li>Default styling</li><li>Accessibility</li><li>User interactions</li></ul><p><strong>Dependencies</strong>: Client layer</p><p><strong>Used By</strong>: Applications</p><p><strong>Components</strong>:</p><ul><li><code>UploadButton</code> - File selection</li><li><code>UploadList</code> - Task list</li><li><code>UploadProgress</code> - Progress bar</li><li><code>UploadDropzone</code> - Drag &amp; drop</li></ul><h3 id="server-layer-chunkflowjs-upload-server" tabindex="-1">Server Layer (@chunkflowjs/upload-server) <a class="header-anchor" href="#server-layer-chunkflowjs-upload-server" aria-label="Permalink to &quot;Server Layer (@chunkflowjs/upload-server)&quot;">​</a></h3><p><strong>Purpose</strong>: Server-side implementation</p><p><strong>Responsibilities</strong>:</p><ul><li>Upload service logic</li><li>Storage adapters</li><li>Database adapters</li><li>Token management</li><li>File streaming</li></ul><p><strong>Dependencies</strong>: Protocol layer</p><p><strong>Used By</strong>: Server applications</p><p><strong>Key Files</strong>:</p><ul><li><code>UploadService.ts</code> - Main service</li><li><code>adapters/storage/</code> - Storage adapters</li><li><code>adapters/database/</code> - Database adapters</li></ul><h2 id="design-principles" tabindex="-1">Design Principles <a class="header-anchor" href="#design-principles" aria-label="Permalink to &quot;Design Principles&quot;">​</a></h2><h3 id="_1-high-decoupling" tabindex="-1">1. High Decoupling <a class="header-anchor" href="#_1-high-decoupling" aria-label="Permalink to &quot;1. High Decoupling&quot;">​</a></h3><p>Each layer is independent and can be used separately:</p><div class="language-typescript vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">typescript</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// Use only Core layer</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">import</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> { UploadManager } </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">from</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> &quot;@chunkflowjs/core&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// Use Core + React Client</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">import</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> { UploadManager } </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">from</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> &quot;@chunkflowjs/core&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">;</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">import</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> { useUpload } </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">from</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> &quot;@chunkflowjs/upload-client-react&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// Use everything</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">import</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> { UploadButton } </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">from</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> &quot;@chunkflowjs/upload-component-react&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">;</span></span></code></pre></div><h3 id="_2-progressive-enhancement" tabindex="-1">2. Progressive Enhancement <a class="header-anchor" href="#_2-progressive-enhancement" aria-label="Permalink to &quot;2. Progressive Enhancement&quot;">​</a></h3><p>Start simple, add features as needed:</p><div class="language-typescript vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">typescript</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// Basic upload</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">const</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> task</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> =</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> manager.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">createTask</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(file);</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">await</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> task.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">start</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">();</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// Add progress tracking</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">task.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">on</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;progress&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">, ({ </span><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">progress</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> }) </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=&gt;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  console.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">log</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(progress);</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">});</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// Add plugins</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">manager.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">use</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">new</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> LoggerPlugin</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">());</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">manager.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">use</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">new</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> StatisticsPlugin</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">());</span></span></code></pre></div><h3 id="_3-performance-first" tabindex="-1">3. Performance First <a class="header-anchor" href="#_3-performance-first" aria-label="Permalink to &quot;3. Performance First&quot;">​</a></h3><p>Optimizations built-in:</p><ul><li>Parallel hash calculation and upload</li><li>Dynamic chunk sizing</li><li>Concurrency control</li><li>Request pooling</li></ul><h3 id="_4-type-safety" tabindex="-1">4. Type Safety <a class="header-anchor" href="#_4-type-safety" aria-label="Permalink to &quot;4. Type Safety&quot;">​</a></h3><p>Full TypeScript support:</p><ul><li>All APIs are typed</li><li>Type inference works everywhere</li><li>No <code>any</code> types in public APIs</li></ul><h3 id="_5-testability" tabindex="-1">5. Testability <a class="header-anchor" href="#_5-testability" aria-label="Permalink to &quot;5. Testability&quot;">​</a></h3><p>Each layer is independently testable:</p><ul><li>Unit tests for utilities</li><li>Integration tests for layers</li><li>Property-based tests for correctness</li></ul><h2 id="data-flow" tabindex="-1">Data Flow <a class="header-anchor" href="#data-flow" aria-label="Permalink to &quot;Data Flow&quot;">​</a></h2><h3 id="upload-flow" tabindex="-1">Upload Flow <a class="header-anchor" href="#upload-flow" aria-label="Permalink to &quot;Upload Flow&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>User selects file</span></span>
<span class="line"><span>       ↓</span></span>
<span class="line"><span>UploadManager.createTask()</span></span>
<span class="line"><span>       ↓</span></span>
<span class="line"><span>UploadTask created</span></span>
<span class="line"><span>       ↓</span></span>
<span class="line"><span>task.start()</span></span>
<span class="line"><span>       ↓</span></span>
<span class="line"><span>┌──────────────────┬──────────────────┐</span></span>
<span class="line"><span>│                  │                  │</span></span>
<span class="line"><span>│  Hash            │  Upload          │</span></span>
<span class="line"><span>│  Calculation     │  Chunks          │</span></span>
<span class="line"><span>│  (parallel)      │  (parallel)      │</span></span>
<span class="line"><span>│                  │                  │</span></span>
<span class="line"><span>└──────────────────┴──────────────────┘</span></span>
<span class="line"><span>       ↓                    ↓</span></span>
<span class="line"><span>Hash complete        All chunks uploaded</span></span>
<span class="line"><span>       ↓                    ↓</span></span>
<span class="line"><span>Verify hash          Merge file</span></span>
<span class="line"><span>       ↓                    ↓</span></span>
<span class="line"><span>┌──────────────────────────────────────┐</span></span>
<span class="line"><span>│  File exists?                        │</span></span>
<span class="line"><span>│  Yes → Instant upload (cancel chunks)│</span></span>
<span class="line"><span>│  No  → Continue upload               │</span></span>
<span class="line"><span>└──────────────────────────────────────┘</span></span>
<span class="line"><span>       ↓</span></span>
<span class="line"><span>Upload complete</span></span>
<span class="line"><span>       ↓</span></span>
<span class="line"><span>Emit success event</span></span></code></pre></div><h3 id="state-machine" tabindex="-1">State Machine <a class="header-anchor" href="#state-machine" aria-label="Permalink to &quot;State Machine&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>       ┌─────┐</span></span>
<span class="line"><span>       │IDLE │</span></span>
<span class="line"><span>       └──┬──┘</span></span>
<span class="line"><span>          │ start()</span></span>
<span class="line"><span>          ↓</span></span>
<span class="line"><span>     ┌────────┐</span></span>
<span class="line"><span>     │HASHING │</span></span>
<span class="line"><span>     └───┬────┘</span></span>
<span class="line"><span>         │</span></span>
<span class="line"><span>         ↓</span></span>
<span class="line"><span>    ┌──────────┐</span></span>
<span class="line"><span>    │UPLOADING │←──────┐</span></span>
<span class="line"><span>    └─┬──┬──┬──┘       │</span></span>
<span class="line"><span>      │  │  │          │</span></span>
<span class="line"><span>      │  │  └──pause() │</span></span>
<span class="line"><span>      │  │             │</span></span>
<span class="line"><span>      │  │  ┌──────┐   │</span></span>
<span class="line"><span>      │  │  │PAUSED│───┘</span></span>
<span class="line"><span>      │  │  └──────┘ resume()</span></span>
<span class="line"><span>      │  │</span></span>
<span class="line"><span>      │  └──cancel()</span></span>
<span class="line"><span>      │     ┌─────────┐</span></span>
<span class="line"><span>      │     │CANCELLED│</span></span>
<span class="line"><span>      │     └─────────┘</span></span>
<span class="line"><span>      │</span></span>
<span class="line"><span>      ├──success()</span></span>
<span class="line"><span>      │  ┌───────┐</span></span>
<span class="line"><span>      │  │SUCCESS│</span></span>
<span class="line"><span>      │  └───────┘</span></span>
<span class="line"><span>      │</span></span>
<span class="line"><span>      └──error()</span></span>
<span class="line"><span>         ┌─────┐</span></span>
<span class="line"><span>         │ERROR│</span></span>
<span class="line"><span>         └─────┘</span></span></code></pre></div><h2 id="package-structure" tabindex="-1">Package Structure <a class="header-anchor" href="#package-structure" aria-label="Permalink to &quot;Package Structure&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>chunkflow/</span></span>
<span class="line"><span>├── packages/</span></span>
<span class="line"><span>│   ├── protocol/              # Protocol layer</span></span>
<span class="line"><span>│   │   ├── src/</span></span>
<span class="line"><span>│   │   │   ├── types.ts</span></span>
<span class="line"><span>│   │   │   ├── interfaces.ts</span></span>
<span class="line"><span>│   │   │   └── constants.ts</span></span>
<span class="line"><span>│   │   └── package.json</span></span>
<span class="line"><span>│   │</span></span>
<span class="line"><span>│   ├── shared/                # Shared layer</span></span>
<span class="line"><span>│   │   ├── src/</span></span>
<span class="line"><span>│   │   │   ├── events.ts</span></span>
<span class="line"><span>│   │   │   ├── concurrency.ts</span></span>
<span class="line"><span>│   │   │   ├── file-utils.ts</span></span>
<span class="line"><span>│   │   │   └── storage.ts</span></span>
<span class="line"><span>│   │   └── package.json</span></span>
<span class="line"><span>│   │</span></span>
<span class="line"><span>│   ├── core/                  # Core layer</span></span>
<span class="line"><span>│   │   ├── src/</span></span>
<span class="line"><span>│   │   │   ├── UploadManager.ts</span></span>
<span class="line"><span>│   │   │   ├── UploadTask.ts</span></span>
<span class="line"><span>│   │   │   ├── ChunkSizeAdjuster.ts</span></span>
<span class="line"><span>│   │   │   └── plugins/</span></span>
<span class="line"><span>│   │   └── package.json</span></span>
<span class="line"><span>│   │</span></span>
<span class="line"><span>│   ├── upload-client-react/   # React client</span></span>
<span class="line"><span>│   │   ├── src/</span></span>
<span class="line"><span>│   │   │   ├── UploadProvider.tsx</span></span>
<span class="line"><span>│   │   │   ├── useUpload.ts</span></span>
<span class="line"><span>│   │   │   └── useUploadList.ts</span></span>
<span class="line"><span>│   │   └── package.json</span></span>
<span class="line"><span>│   │</span></span>
<span class="line"><span>│   ├── upload-client-vue/     # Vue client</span></span>
<span class="line"><span>│   │   ├── src/</span></span>
<span class="line"><span>│   │   │   ├── plugin.ts</span></span>
<span class="line"><span>│   │   │   ├── useUpload.ts</span></span>
<span class="line"><span>│   │   │   └── useUploadList.ts</span></span>
<span class="line"><span>│   │   └── package.json</span></span>
<span class="line"><span>│   │</span></span>
<span class="line"><span>│   ├── upload-component-react/# React components</span></span>
<span class="line"><span>│   │   ├── src/</span></span>
<span class="line"><span>│   │   │   ├── UploadButton.tsx</span></span>
<span class="line"><span>│   │   │   ├── UploadList.tsx</span></span>
<span class="line"><span>│   │   │   ├── UploadProgress.tsx</span></span>
<span class="line"><span>│   │   │   └── UploadDropzone.tsx</span></span>
<span class="line"><span>│   │   └── package.json</span></span>
<span class="line"><span>│   │</span></span>
<span class="line"><span>│   ├── upload-component-vue/  # Vue components</span></span>
<span class="line"><span>│   │   ├── src/</span></span>
<span class="line"><span>│   │   │   ├── UploadButton.vue</span></span>
<span class="line"><span>│   │   │   ├── UploadList.vue</span></span>
<span class="line"><span>│   │   │   ├── UploadProgress.vue</span></span>
<span class="line"><span>│   │   │   └── UploadDropzone.vue</span></span>
<span class="line"><span>│   │   └── package.json</span></span>
<span class="line"><span>│   │</span></span>
<span class="line"><span>│   └── upload-server/         # Server SDK</span></span>
<span class="line"><span>│       ├── src/</span></span>
<span class="line"><span>│       │   ├── UploadService.ts</span></span>
<span class="line"><span>│       │   └── adapters/</span></span>
<span class="line"><span>│       └── package.json</span></span>
<span class="line"><span>│</span></span>
<span class="line"><span>└── apps/</span></span>
<span class="line"><span>    ├── server/                # Demo server</span></span>
<span class="line"><span>    ├── playground/            # Demo app</span></span>
<span class="line"><span>    └── website/               # Documentation</span></span></code></pre></div><h2 id="dependency-graph" tabindex="-1">Dependency Graph <a class="header-anchor" href="#dependency-graph" aria-label="Permalink to &quot;Dependency Graph&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>Protocol ← Shared ← Core ← Client ← Component</span></span>
<span class="line"><span>   ↑                         ↑</span></span>
<span class="line"><span>   └─────────────────────────┘</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Protocol ← Server</span></span></code></pre></div><h2 id="extension-points" tabindex="-1">Extension Points <a class="header-anchor" href="#extension-points" aria-label="Permalink to &quot;Extension Points&quot;">​</a></h2><h3 id="_1-custom-request-adapter" tabindex="-1">1. Custom Request Adapter <a class="header-anchor" href="#_1-custom-request-adapter" aria-label="Permalink to &quot;1. Custom Request Adapter&quot;">​</a></h3><p>Implement <code>RequestAdapter</code> interface for custom HTTP clients.</p><h3 id="_2-custom-storage-adapter" tabindex="-1">2. Custom Storage Adapter <a class="header-anchor" href="#_2-custom-storage-adapter" aria-label="Permalink to &quot;2. Custom Storage Adapter&quot;">​</a></h3><p>Implement <code>StorageAdapter</code> interface for custom storage backends.</p><h3 id="_3-custom-database-adapter" tabindex="-1">3. Custom Database Adapter <a class="header-anchor" href="#_3-custom-database-adapter" aria-label="Permalink to &quot;3. Custom Database Adapter&quot;">​</a></h3><p>Implement <code>DatabaseAdapter</code> interface for custom databases.</p><h3 id="_4-plugins" tabindex="-1">4. Plugins <a class="header-anchor" href="#_4-plugins" aria-label="Permalink to &quot;4. Plugins&quot;">​</a></h3><p>Implement <code>Plugin</code> interface to extend functionality.</p><h3 id="_5-custom-components" tabindex="-1">5. Custom Components <a class="header-anchor" href="#_5-custom-components" aria-label="Permalink to &quot;5. Custom Components&quot;">​</a></h3><p>Build custom UI components using Client layer hooks/composables.</p><h2 id="see-also" tabindex="-1">See Also <a class="header-anchor" href="#see-also" aria-label="Permalink to &quot;See Also&quot;">​</a></h2><ul><li><a href="/chunkflow/guide/upload-strategies">Upload Strategies</a></li><li><a href="/chunkflow/guide/client-config">Configuration</a></li><li><a href="/chunkflow/api/protocol">API Reference</a></li></ul>`,93)])])}const k=a(l,[["render",i]]);export{u as __pageData,k as default};
