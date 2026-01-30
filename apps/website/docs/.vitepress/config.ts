import { defineConfig } from "vitepress";

export default defineConfig({
  title: "ChunkFlow Upload SDK",
  description:
    "A universal large file upload solution with chunked upload, resumable upload, and instant upload capabilities",
  lang: "en-US",
  lastUpdated: true,
  cleanUrls: true,
  base: process.env.NODE_ENV === "production" ? "/chunkflow/" : "/",

  head: [
    ["link", { rel: "icon", type: "image/png", href: "/logo.png" }],
    ["meta", { name: "theme-color", content: "#3eaf7c" }],
    ["meta", { name: "og:type", content: "website" }],
    ["meta", { name: "og:locale", content: "en" }],
    ["meta", { name: "og:site_name", content: "ChunkFlow Upload SDK" }],
  ],

  locales: {
    root: {
      label: "English",
      lang: "en",
    },
    zh: {
      label: "简体中文",
      lang: "zh-CN",
      link: "/zh/",
      themeConfig: {
        nav: [
          { text: "指南", link: "/zh/guide/getting-started" },
          { text: "API", link: "/zh/api/protocol" },
          { text: "示例", link: "/zh/examples/react" },
          { text: "GitHub", link: "https://github.com/Sunny-117/chunkflow" },
        ],
        sidebar: {
          "/zh/guide/": [
            {
              text: "介绍",
              items: [
                { text: "什么是 ChunkFlow？", link: "/zh/guide/" },
                { text: "快速开始", link: "/zh/guide/getting-started" },
                { text: "安装", link: "/zh/guide/installation" },
                { text: "快速入门", link: "/zh/guide/quick-start" },
              ],
            },
            {
              text: "核心概念",
              items: [
                { text: "架构", link: "/zh/guide/architecture" },
                { text: "上传策略", link: "/zh/guide/upload-strategies" },
                { text: "哈希与秒传", link: "/zh/guide/hash-instant-upload" },
                { text: "断点续传", link: "/zh/guide/resumable-upload" },
                { text: "动态分片", link: "/zh/guide/dynamic-chunking" },
              ],
            },
            {
              text: "配置",
              items: [
                { text: "客户端配置", link: "/zh/guide/client-config" },
                { text: "服务端配置", link: "/zh/guide/server-config" },
                { text: "存储适配器", link: "/zh/guide/storage-adapters" },
              ],
            },
            {
              text: "最佳实践",
              items: [
                { text: "错误处理", link: "/zh/guide/error-handling" },
                { text: "性能优化", link: "/zh/guide/performance" },
                { text: "安全性", link: "/zh/guide/security" },
              ],
            },
          ],
          "/zh/api/": [
            {
              text: "API 参考",
              items: [
                { text: "Protocol", link: "/zh/api/protocol" },
                { text: "Shared", link: "/zh/api/shared" },
                { text: "Core", link: "/zh/api/core" },
                { text: "Client - React", link: "/zh/api/client-react" },
                { text: "Client - Vue", link: "/zh/api/client-vue" },
                { text: "Component - React", link: "/zh/api/component-react" },
                { text: "Component - Vue", link: "/zh/api/component-vue" },
                { text: "Server", link: "/zh/api/server" },
              ],
            },
          ],
          "/zh/examples/": [
            {
              text: "示例",
              items: [
                { text: "React", link: "/zh/examples/react" },
                { text: "Vue", link: "/zh/examples/vue" },
                { text: "服务端集成", link: "/zh/examples/server" },
                { text: "自定义插件", link: "/zh/examples/plugins" },
              ],
            },
          ],
        },
        editLink: {
          pattern: "https://github.com/Sunny-117/chunkflow/edit/main/apps/website/docs/:path",
          text: "在 GitHub 上编辑此页",
        },
      },
    },
  },

  themeConfig: {
    logo: "/logo.png",

    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "API", link: "/api/protocol" },
      { text: "Examples", link: "/examples/react" },
      { text: "GitHub", link: "https://github.com/Sunny-117/chunkflow" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "What is ChunkFlow?", link: "/guide/" },
            { text: "Getting Started", link: "/guide/getting-started" },
            { text: "Installation", link: "/guide/installation" },
            { text: "Quick Start", link: "/guide/quick-start" },
          ],
        },
        {
          text: "Core Concepts",
          items: [
            { text: "Architecture", link: "/guide/architecture" },
            { text: "Upload Strategies", link: "/guide/upload-strategies" },
            { text: "Hash & Instant Upload", link: "/guide/hash-instant-upload" },
            { text: "Resumable Upload", link: "/guide/resumable-upload" },
            { text: "Dynamic Chunking", link: "/guide/dynamic-chunking" },
          ],
        },
        {
          text: "Configuration",
          items: [
            { text: "Client Configuration", link: "/guide/client-config" },
            { text: "Server Configuration", link: "/guide/server-config" },
            { text: "Storage Adapters", link: "/guide/storage-adapters" },
          ],
        },
        {
          text: "Best Practices",
          items: [
            { text: "Error Handling", link: "/guide/error-handling" },
            { text: "Performance Optimization", link: "/guide/performance" },
            { text: "Security", link: "/guide/security" },
          ],
        },
      ],
      "/api/": [
        {
          text: "API Reference",
          items: [
            { text: "Protocol", link: "/api/protocol" },
            { text: "Shared", link: "/api/shared" },
            { text: "Core", link: "/api/core" },
            { text: "Client - React", link: "/api/client-react" },
            { text: "Client - Vue", link: "/api/client-vue" },
            { text: "Component - React", link: "/api/component-react" },
            { text: "Component - Vue", link: "/api/component-vue" },
            { text: "Server", link: "/api/server" },
          ],
        },
      ],
      "/examples/": [
        {
          text: "Examples",
          items: [
            { text: "React", link: "/examples/react" },
            { text: "Vue", link: "/examples/vue" },
            { text: "Server Integration", link: "/examples/server" },
            { text: "Custom Plugins", link: "/examples/plugins" },
          ],
        },
      ],
    },

    socialLinks: [{ icon: "github", link: "https://github.com/Sunny-117/chunkflow" }],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026-present ChunkFlow Contributors",
    },

    search: {
      provider: "local",
    },

    editLink: {
      pattern: "https://github.com/Sunny-117/chunkflow/edit/main/apps/website/docs/:path",
      text: "Edit this page on GitHub",
    },
  },
});
