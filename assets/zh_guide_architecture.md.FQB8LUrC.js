import{_ as a,o as n,c as p,ag as l}from"./chunks/framework.C95KxxkN.js";const k=JSON.parse('{"title":"架构","description":"","frontmatter":{},"headers":[],"relativePath":"zh/guide/architecture.md","filePath":"zh/guide/architecture.md","lastUpdated":1769827945000}'),i={name:"zh/guide/architecture.md"};function e(t,s,c,o,r,h){return n(),p("div",null,[...s[0]||(s[0]=[l(`<h1 id="架构" tabindex="-1">架构 <a class="header-anchor" href="#架构" aria-label="Permalink to &quot;架构&quot;">​</a></h1><p>ChunkFlow 采用分层架构设计，每一层都有特定的职责，并且可以独立使用。</p><h2 id="分层架构" tabindex="-1">分层架构 <a class="header-anchor" href="#分层架构" aria-label="Permalink to &quot;分层架构&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>┌─────────────────────────────────────────────────────────────┐</span></span>
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
<span class="line"><span>└─────────────────────────────────────────────────────────────┘</span></span></code></pre></div><h2 id="层级职责" tabindex="-1">层级职责 <a class="header-anchor" href="#层级职责" aria-label="Permalink to &quot;层级职责&quot;">​</a></h2><h3 id="协议层-chunkflowjs-protocol" tabindex="-1">协议层 (@chunkflowjs/protocol) <a class="header-anchor" href="#协议层-chunkflowjs-protocol" aria-label="Permalink to &quot;协议层 (@chunkflowjs/protocol)&quot;">​</a></h3><p><strong>目的</strong>：定义通信契约</p><p><strong>职责</strong>：</p><ul><li>TypeScript 类型定义</li><li>API 请求/响应接口</li><li>错误类型</li><li>常量</li></ul><p><strong>依赖</strong>：无</p><p><strong>被使用</strong>：所有其他层</p><p><strong>关键文件</strong>：</p><ul><li><code>types.ts</code> - 核心类型定义</li><li><code>interfaces.ts</code> - API 接口</li><li><code>constants.ts</code> - 常量</li></ul><h3 id="共享层-chunkflowjs-shared" tabindex="-1">共享层 (@chunkflowjs/shared) <a class="header-anchor" href="#共享层-chunkflowjs-shared" aria-label="Permalink to &quot;共享层 (@chunkflowjs/shared)&quot;">​</a></h3><p><strong>目的</strong>：提供通用工具</p><p><strong>职责</strong>：</p><ul><li>事件系统（使用 mitt）</li><li>并发控制（使用 p-limit）</li><li>文件工具（切片、哈希）</li><li>IndexedDB 存储</li><li>辅助函数</li></ul><p><strong>依赖</strong>：协议层</p><p><strong>被使用</strong>：核心层、客户端层、组件层</p><p><strong>关键文件</strong>：</p><ul><li><code>events.ts</code> - 事件总线</li><li><code>concurrency.ts</code> - 并发控制器</li><li><code>file-utils.ts</code> - 文件操作</li><li><code>storage.ts</code> - IndexedDB 封装</li></ul><h3 id="核心层-chunkflowjs-core" tabindex="-1">核心层 (@chunkflowjs/core) <a class="header-anchor" href="#核心层-chunkflowjs-core" aria-label="Permalink to &quot;核心层 (@chunkflowjs/core)&quot;">​</a></h3><p><strong>目的</strong>：实现上传逻辑</p><p><strong>职责</strong>：</p><ul><li>上传状态机</li><li>任务生命周期管理</li><li>队列管理</li><li>插件系统</li><li>动态分片大小</li><li>重试逻辑</li></ul><p><strong>依赖</strong>：协议层、共享层</p><p><strong>被使用</strong>：客户端层、组件层，或直接使用</p><p><strong>关键文件</strong>：</p><ul><li><code>UploadManager.ts</code> - 任务管理器</li><li><code>UploadTask.ts</code> - 单个上传任务</li><li><code>ChunkSizeAdjuster.ts</code> - 动态分片</li><li><code>plugins/</code> - 插件实现</li></ul><h3 id="客户端层-react-vue" tabindex="-1">客户端层 (React/Vue) <a class="header-anchor" href="#客户端层-react-vue" aria-label="Permalink to &quot;客户端层 (React/Vue)&quot;">​</a></h3><p><strong>目的</strong>：框架集成</p><p><strong>职责</strong>：</p><ul><li>框架特定适配器</li><li>响应式状态管理</li><li>生命周期集成</li><li>Context/Provider 设置</li></ul><p><strong>依赖</strong>：核心层</p><p><strong>被使用</strong>：组件层，或直接使用</p><p><strong>React 包</strong>：</p><ul><li><code>UploadProvider.tsx</code> - Context provider</li><li><code>useUpload.ts</code> - Upload hook</li><li><code>useUploadList.ts</code> - List hook</li><li><code>useUploadManager.ts</code> - Manager hook</li></ul><p><strong>Vue 包</strong>：</p><ul><li><code>plugin.ts</code> - Vue 插件</li><li><code>useUpload.ts</code> - Upload composable</li><li><code>useUploadList.ts</code> - List composable</li></ul><h3 id="组件层-react-vue" tabindex="-1">组件层 (React/Vue) <a class="header-anchor" href="#组件层-react-vue" aria-label="Permalink to &quot;组件层 (React/Vue)&quot;">​</a></h3><p><strong>目的</strong>：开箱即用的 UI 组件</p><p><strong>职责</strong>：</p><ul><li>预构建的上传组件</li><li>默认样式</li><li>无障碍访问</li><li>用户交互</li></ul><p><strong>依赖</strong>：客户端层</p><p><strong>被使用</strong>：应用程序</p><p><strong>组件</strong>：</p><ul><li><code>UploadButton</code> - 文件选择</li><li><code>UploadList</code> - 任务列表</li><li><code>UploadProgress</code> - 进度条</li><li><code>UploadDropzone</code> - 拖放区域</li></ul><h3 id="服务端层-chunkflowjs-upload-server" tabindex="-1">服务端层 (@chunkflowjs/upload-server) <a class="header-anchor" href="#服务端层-chunkflowjs-upload-server" aria-label="Permalink to &quot;服务端层 (@chunkflowjs/upload-server)&quot;">​</a></h3><p><strong>目的</strong>：服务端实现</p><p><strong>职责</strong>：</p><ul><li>上传服务逻辑</li><li>存储适配器</li><li>数据库适配器</li><li>Token 管理</li><li>文件流处理</li></ul><p><strong>依赖</strong>：协议层</p><p><strong>被使用</strong>：服务端应用</p><p><strong>关键文件</strong>：</p><ul><li><code>UploadService.ts</code> - 主服务</li><li><code>adapters/storage/</code> - 存储适配器</li><li><code>adapters/database/</code> - 数据库适配器</li></ul><h2 id="设计原则" tabindex="-1">设计原则 <a class="header-anchor" href="#设计原则" aria-label="Permalink to &quot;设计原则&quot;">​</a></h2><h3 id="_1-高度解耦" tabindex="-1">1. 高度解耦 <a class="header-anchor" href="#_1-高度解耦" aria-label="Permalink to &quot;1. 高度解耦&quot;">​</a></h3><p>每一层都是独立的，可以单独使用：</p><div class="language-typescript vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">typescript</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 仅使用核心层</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">import</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> { UploadManager } </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">from</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> &quot;@chunkflowjs/core&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 使用核心层 + React 客户端</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">import</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> { UploadManager } </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">from</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> &quot;@chunkflowjs/core&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">;</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">import</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> { useUpload } </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">from</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> &quot;@chunkflowjs/upload-client-react&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 使用全部</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">import</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> { UploadButton } </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">from</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> &quot;@chunkflowjs/upload-component-react&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">;</span></span></code></pre></div><h3 id="_2-渐进增强" tabindex="-1">2. 渐进增强 <a class="header-anchor" href="#_2-渐进增强" aria-label="Permalink to &quot;2. 渐进增强&quot;">​</a></h3><p>从简单开始，根据需要添加功能：</p><div class="language-typescript vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">typescript</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 基础上传</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">const</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> task</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> =</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> manager.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">createTask</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(file);</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">await</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> task.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">start</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">();</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 添加进度跟踪</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">task.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">on</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;progress&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">, ({ </span><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">progress</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> }) </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=&gt;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  console.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">log</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(progress);</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">});</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 添加插件</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">manager.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">use</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">new</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> LoggerPlugin</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">());</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">manager.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">use</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">new</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> StatisticsPlugin</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">());</span></span></code></pre></div><h3 id="_3-性能优先" tabindex="-1">3. 性能优先 <a class="header-anchor" href="#_3-性能优先" aria-label="Permalink to &quot;3. 性能优先&quot;">​</a></h3><p>内置优化：</p><ul><li>并行哈希计算和上传</li><li>动态分片大小</li><li>并发控制</li><li>请求池化</li></ul><h3 id="_4-类型安全" tabindex="-1">4. 类型安全 <a class="header-anchor" href="#_4-类型安全" aria-label="Permalink to &quot;4. 类型安全&quot;">​</a></h3><p>完整的 TypeScript 支持：</p><ul><li>所有 API 都有类型</li><li>类型推断无处不在</li><li>公共 API 中没有 <code>any</code> 类型</li></ul><h3 id="_5-可测试性" tabindex="-1">5. 可测试性 <a class="header-anchor" href="#_5-可测试性" aria-label="Permalink to &quot;5. 可测试性&quot;">​</a></h3><p>每一层都可以独立测试：</p><ul><li>工具函数的单元测试</li><li>层级的集成测试</li><li>正确性的属性测试</li></ul><h2 id="数据流" tabindex="-1">数据流 <a class="header-anchor" href="#数据流" aria-label="Permalink to &quot;数据流&quot;">​</a></h2><h3 id="上传流程" tabindex="-1">上传流程 <a class="header-anchor" href="#上传流程" aria-label="Permalink to &quot;上传流程&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>用户选择文件</span></span>
<span class="line"><span>       ↓</span></span>
<span class="line"><span>UploadManager.createTask()</span></span>
<span class="line"><span>       ↓</span></span>
<span class="line"><span>创建 UploadTask</span></span>
<span class="line"><span>       ↓</span></span>
<span class="line"><span>task.start()</span></span>
<span class="line"><span>       ↓</span></span>
<span class="line"><span>┌──────────────────┬──────────────────┐</span></span>
<span class="line"><span>│                  │                  │</span></span>
<span class="line"><span>│  哈希            │  上传            │</span></span>
<span class="line"><span>│  计算            │  分片            │</span></span>
<span class="line"><span>│  (并行)          │  (并行)          │</span></span>
<span class="line"><span>│                  │                  │</span></span>
<span class="line"><span>└──────────────────┴──────────────────┘</span></span>
<span class="line"><span>       ↓                    ↓</span></span>
<span class="line"><span>哈希完成              所有分片上传完成</span></span>
<span class="line"><span>       ↓                    ↓</span></span>
<span class="line"><span>验证哈希              合并文件</span></span>
<span class="line"><span>       ↓                    ↓</span></span>
<span class="line"><span>┌──────────────────────────────────────┐</span></span>
<span class="line"><span>│  文件存在？                          │</span></span>
<span class="line"><span>│  是 → 秒传（取消分片上传）           │</span></span>
<span class="line"><span>│  否 → 继续上传                       │</span></span>
<span class="line"><span>└──────────────────────────────────────┘</span></span>
<span class="line"><span>       ↓</span></span>
<span class="line"><span>上传完成</span></span>
<span class="line"><span>       ↓</span></span>
<span class="line"><span>触发成功事件</span></span></code></pre></div><h3 id="状态机" tabindex="-1">状态机 <a class="header-anchor" href="#状态机" aria-label="Permalink to &quot;状态机&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>       ┌─────┐</span></span>
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
<span class="line"><span>         └─────┘</span></span></code></pre></div><h2 id="包结构" tabindex="-1">包结构 <a class="header-anchor" href="#包结构" aria-label="Permalink to &quot;包结构&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>chunkflow/</span></span>
<span class="line"><span>├── packages/</span></span>
<span class="line"><span>│   ├── protocol/              # 协议层</span></span>
<span class="line"><span>│   │   ├── src/</span></span>
<span class="line"><span>│   │   │   ├── types.ts</span></span>
<span class="line"><span>│   │   │   ├── interfaces.ts</span></span>
<span class="line"><span>│   │   │   └── constants.ts</span></span>
<span class="line"><span>│   │   └── package.json</span></span>
<span class="line"><span>│   │</span></span>
<span class="line"><span>│   ├── shared/                # 共享层</span></span>
<span class="line"><span>│   │   ├── src/</span></span>
<span class="line"><span>│   │   │   ├── events.ts</span></span>
<span class="line"><span>│   │   │   ├── concurrency.ts</span></span>
<span class="line"><span>│   │   │   ├── file-utils.ts</span></span>
<span class="line"><span>│   │   │   └── storage.ts</span></span>
<span class="line"><span>│   │   └── package.json</span></span>
<span class="line"><span>│   │</span></span>
<span class="line"><span>│   ├── core/                  # 核心层</span></span>
<span class="line"><span>│   │   ├── src/</span></span>
<span class="line"><span>│   │   │   ├── UploadManager.ts</span></span>
<span class="line"><span>│   │   │   ├── UploadTask.ts</span></span>
<span class="line"><span>│   │   │   ├── ChunkSizeAdjuster.ts</span></span>
<span class="line"><span>│   │   │   └── plugins/</span></span>
<span class="line"><span>│   │   └── package.json</span></span>
<span class="line"><span>│   │</span></span>
<span class="line"><span>│   ├── upload-client-react/   # React 客户端</span></span>
<span class="line"><span>│   │   ├── src/</span></span>
<span class="line"><span>│   │   │   ├── UploadProvider.tsx</span></span>
<span class="line"><span>│   │   │   ├── useUpload.ts</span></span>
<span class="line"><span>│   │   │   └── useUploadList.ts</span></span>
<span class="line"><span>│   │   └── package.json</span></span>
<span class="line"><span>│   │</span></span>
<span class="line"><span>│   ├── upload-client-vue/     # Vue 客户端</span></span>
<span class="line"><span>│   │   ├── src/</span></span>
<span class="line"><span>│   │   │   ├── plugin.ts</span></span>
<span class="line"><span>│   │   │   ├── useUpload.ts</span></span>
<span class="line"><span>│   │   │   └── useUploadList.ts</span></span>
<span class="line"><span>│   │   └── package.json</span></span>
<span class="line"><span>│   │</span></span>
<span class="line"><span>│   ├── upload-component-react/# React 组件</span></span>
<span class="line"><span>│   │   ├── src/</span></span>
<span class="line"><span>│   │   │   ├── UploadButton.tsx</span></span>
<span class="line"><span>│   │   │   ├── UploadList.tsx</span></span>
<span class="line"><span>│   │   │   ├── UploadProgress.tsx</span></span>
<span class="line"><span>│   │   │   └── UploadDropzone.tsx</span></span>
<span class="line"><span>│   │   └── package.json</span></span>
<span class="line"><span>│   │</span></span>
<span class="line"><span>│   ├── upload-component-vue/  # Vue 组件</span></span>
<span class="line"><span>│   │   ├── src/</span></span>
<span class="line"><span>│   │   │   ├── UploadButton.vue</span></span>
<span class="line"><span>│   │   │   ├── UploadList.vue</span></span>
<span class="line"><span>│   │   │   ├── UploadProgress.vue</span></span>
<span class="line"><span>│   │   │   └── UploadDropzone.vue</span></span>
<span class="line"><span>│   │   └── package.json</span></span>
<span class="line"><span>│   │</span></span>
<span class="line"><span>│   └── upload-server/         # 服务端 SDK</span></span>
<span class="line"><span>│       ├── src/</span></span>
<span class="line"><span>│       │   ├── UploadService.ts</span></span>
<span class="line"><span>│       │   └── adapters/</span></span>
<span class="line"><span>│       └── package.json</span></span>
<span class="line"><span>│</span></span>
<span class="line"><span>└── apps/</span></span>
<span class="line"><span>    ├── server/                # 演示服务器</span></span>
<span class="line"><span>    ├── playground/            # 演示应用</span></span>
<span class="line"><span>    └── website/               # 文档</span></span></code></pre></div><h2 id="依赖关系图" tabindex="-1">依赖关系图 <a class="header-anchor" href="#依赖关系图" aria-label="Permalink to &quot;依赖关系图&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>Protocol ← Shared ← Core ← Client ← Component</span></span>
<span class="line"><span>   ↑                         ↑</span></span>
<span class="line"><span>   └─────────────────────────┘</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Protocol ← Server</span></span></code></pre></div><h2 id="扩展点" tabindex="-1">扩展点 <a class="header-anchor" href="#扩展点" aria-label="Permalink to &quot;扩展点&quot;">​</a></h2><h3 id="_1-自定义请求适配器" tabindex="-1">1. 自定义请求适配器 <a class="header-anchor" href="#_1-自定义请求适配器" aria-label="Permalink to &quot;1. 自定义请求适配器&quot;">​</a></h3><p>实现 <code>RequestAdapter</code> 接口以支持自定义 HTTP 客户端。</p><h3 id="_2-自定义存储适配器" tabindex="-1">2. 自定义存储适配器 <a class="header-anchor" href="#_2-自定义存储适配器" aria-label="Permalink to &quot;2. 自定义存储适配器&quot;">​</a></h3><p>实现 <code>StorageAdapter</code> 接口以支持自定义存储后端。</p><h3 id="_3-自定义数据库适配器" tabindex="-1">3. 自定义数据库适配器 <a class="header-anchor" href="#_3-自定义数据库适配器" aria-label="Permalink to &quot;3. 自定义数据库适配器&quot;">​</a></h3><p>实现 <code>DatabaseAdapter</code> 接口以支持自定义数据库。</p><h3 id="_4-插件" tabindex="-1">4. 插件 <a class="header-anchor" href="#_4-插件" aria-label="Permalink to &quot;4. 插件&quot;">​</a></h3><p>实现 <code>Plugin</code> 接口以扩展功能。</p><h3 id="_5-自定义组件" tabindex="-1">5. 自定义组件 <a class="header-anchor" href="#_5-自定义组件" aria-label="Permalink to &quot;5. 自定义组件&quot;">​</a></h3><p>使用客户端层的 hooks/composables 构建自定义 UI 组件。</p><h2 id="另请参阅" tabindex="-1">另请参阅 <a class="header-anchor" href="#另请参阅" aria-label="Permalink to &quot;另请参阅&quot;">​</a></h2><ul><li><a href="/chunkflow/zh/guide/upload-strategies">上传策略</a></li><li><a href="/chunkflow/zh/guide/client-config">配置</a></li><li><a href="/chunkflow/zh/api/protocol">API 参考</a></li></ul>`,93)])])}const u=a(i,[["render",e]]);export{k as __pageData,u as default};
