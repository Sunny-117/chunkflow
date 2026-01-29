# 通用大文件上传 SDK — 工程级 Spec Prompt

你是一名 **资深前端架构师 & 开源项目维护者**，需要设计并实现一个 **通用的大文件上传 SDK**，覆盖从小文件到超大文件的所有上传场景。
你需要抽象出一个 **可复用、可扩展、可拆分使用** 的文件上传通用解决方案，并以 **开源项目标准** 交付，请生成 **中文 spec**。

> ⚠️ 目标不是 Demo，而是一个 **可以被真实业务长期采用的工程级 SDK**

---

## 一、总体目标与能力范围

### 1. 核心目标

- 提供一套 **通用的大文件上传解决方案**
- 支持以下能力：
  - 小文件直传
  - 大文件分片上传
  - 流式上传
  - 断点续传
  - 并发控制
  - 秒传（可选）
  - 错误处理与自动重试

- **架构高度解耦**
  - 使用者可以只使用某一个子包
  - 不强制接入完整体系

---

## 二、技术架构与工程约束（必须遵守）

### 2.1 Monorepo & 构建体系

- pnpm + monorepo
- turbo 作为任务调度器
- SDK 构建：
  - TypeScript
  - ESM
  - 使用 `tsdown`

- 项目启动：
  - docker-compose 启动服务端与数据库

#### 目录结构（示例）

```
packages/
  protocol                 // 协议层
  core/                     // 核心层（无 UI / DOM / 请求库）
  shared/                   // 通用工具库
  upload-client-react       // React 适配层
  upload-client-vue         // Vue 适配层
  upload-component-react    // React 上传组件
  upload-component-vue      // Vue 上传组件
  upload-server             // BFF SDK（可选）
apps/
  playground/               // 演示与调试
  server/                   // Nest.js 服务端
  website/                  // 官方文档站点
```

⚠️ **upload-core 约束**：

- 不允许出现：
  - UI
  - DOM
  - axios / fetch 等请求库

- 只允许：
  - 协议抽象
  - 状态机
  - 生命周期管理
  - Hook / Plugin 机制
  - 事件系统
  - 并发任务调度（pause / resume / drain）

---

### 2.2 SDK 分层设计原则（重点）

#### Core 层

- 不依赖 Vue / React
- 只定义：
  - 上传协议
  - 生命周期
  - 状态机
  - Hook / Plugin

#### Adapter 层（React / Vue）

- 仅做绑定
- 不允许出现核心逻辑
- 组件职责：
  - props / events / state
  - 拖拽上传
  - 多文件选择
  - 多文件统一协议上传

#### Shared 层

- 事件系统
- 并发控制
- 工具函数

👉 即使用户 **不用整套 SDK**，也能只使用其中一个子包。

---

## 三、服务端技术栈与架构要求

- Node.js + Nest.js
- Fastify Adapter
- PostgreSQL
- 架构要求：
  - 接口职责清晰
  - 上传协议清晰
  - 可扩展（支持多存储后端）

---

## 四、工程规范与质量保障

- Lint & Format
  - oxlint
  - oxfmt
  - lint-staged

- 单元测试
  - Vitest
  - **只测试有业务价值的核心逻辑**
  - 保证测试速度与可维护性

---

## 五、前端上传方案设计（核心）

### 5.1 基本能力要求

- 支持：
  - 分片上传
  - 流式处理
  - 断点续传

- 存储方案不强绑定：
  - 可提供 BFF 思路
  - 不强制 BFF
  - 允许使用方自定义上传元数据存储方案

- SDK 只依赖协议
  - 不绑定具体存储、鉴权、落盘逻辑

---

## 六、后端方案设计要求

### 必须满足：

1. **大文件 / 小文件区别对待**
   - 不同接口
   - 或同接口不同模式

2. **协议层不受限**
   - HTTP
   - WebSocket

3. **鉴权机制**
   - 定义通用鉴权协议
   - 允许业务方自定义 userId / ak / sk 等

---

## 七、设计模式与技术选型原则

- 优先使用成熟第三方库
  - 事件系统：`mitt`
  - 并发控制：`p-limit`

- 避免重复造轮子
- 合理使用：
  - 策略模式
  - 模板方法模式
  - AOP
  - 函数式编程优先
  - **仅在非常合适的场景使用 class**

---

## 八、Playground 界面设计 Prompt

```
你是一位资深独立设计师,专注于《反主流》的网页美学。
你鄙视千篇一律的 Saas 模板,认为软件界面应该有触感和灵魂。

你的创意边界:
- 现代但不要紫色 → 深灰 + 橙色
- 极简但要有温度 → 大留白 + 手绘插画
- 科技感但不要冰冷 → 深色 + 暖色点缀

设计禁止清单:
- 紫色 / 靛蓝渐变
- 纯平背景（必须有噪点或渐变）
- Hero + 三卡片布局
- 完美居中对齐
- 空洞文案
- Emoji 作为功能图标
- ease-in-out 线性动画
```

---

## 九、发布与文档规范

- Website：
  - VitePress
  - `sh deploy.sh` 一键部署 GitHub Pages

- npm 发布：
  - changeset
  - monorepo 最佳实践
  - GitHub Release

- Readme：
  - 默认中文
  - 可切换英文
  - ❌ 不生成教学型总结文档

---

## 十、核心技术实现约束（重点）

### 10.1 建模假设（必须遵守）

1. 大文件上传 = 大事务 → 可控小事务
2. 绝大多数文件是新文件
3. 文件 / 分片唯一性基于内容 hash
   - 秒传目的
   - 可采用 **抽样 hash（类似布隆过滤器思想）**

4. BFF 层需纳入整体设计

⚠️ 禁止：等待完整 hash 计算完成后才上传

---

### 10.2 性能与体验强约束

- 🚫 不允许长时间阻塞主线程
- ✅ 选中文件即刻上传
- ✅ hash 计算与分片上传并行
- ✅ 旧文件允许少量无效 hash 请求
- ✅ 分片完成后写入 IndexedDB
  - 下次进入页面自动嗅探未完成任务

- ✅ 动态切片大小（参考 TCP 慢启动）
  - 初始 1MB
  - 根据上传耗时动态调整(确保文件切片的大小和当前网速匹配)
  - 示例：
    - 10s → 3MB
    - 60s → 500KB

---

### 10.3 Hash & 分片策略约束

- hash 计算：
  - CPU 密集
  - 不允许主线程同步
  - Web Worker / requestIdleCallback（参考 React Fiber）

- 整体 hash **不作为上传前置条件**

#### 上传流程（强约束）

```
文件选择
↓
立即分片 + 并发上传
↓（并行）
worker / idle 计算 hash
↓
补充 hash 校验
```

禁止：

```
完整分片 → 完整 hash → 上传
```

---

## 十一、前后端通信协议约束

- 协议与框架解耦
- 支持 HTTP / WebSocket

### 协议类型

1. **创建文件（HEAD）**
   - 获取 uploadToken
   - 协商 chunkSize

2. **Hash 校验**
   - 分片 / 文件 hash
   - 返回：
     - 是否存在
     - 剩余分片
     - 文件访问地址

3. **分片上传**
   - multipart/form-data
   - application/octet-stream

4. **逻辑合并**
   - 不做物理合并
   - 仅校验 / 标记 / 生成 URL

---

## 十二、分片策略设计（模板方法）

- SDK 内置：
  - 多线程分片
  - 时间切片分片

- 上层可自定义：
  - 仅实现 hash 计算逻辑

抽象类负责：

- 生命周期
- hash 聚合
- 事件派发

子类只负责：

- 如何计算 hash

---

## 十三、请求控制与解耦

- 所有上传请求统一调度
- 并发数可配置
- 禁止请求洪水
- 请求库通过策略模式解耦
  - SDK 不直接依赖 axios / fetch

---

## 十四、服务端存储与访问约束

- 分片与文件彻底解耦
- 分片：
  - 跨文件唯一
  - 永不删除

- 文件：
  - 只记录分片顺序

- 禁止真实物理合并
- 文件访问：
  - 动态读取分片
  - 流式管道输出

---

## 十五、事件与可观测性

必须提供：

- 分片生成
- 分片上传开始 / 完成
- 进度变化
- 暂停 / 恢复
- 成功 / 失败

事件系统：

- 前后端统一
- 支持多监听器
- 可用于监控与埋点

---

## 十六、输出边界（防跑偏）

- ❌ 不写教程
- ❌ 不泛泛而谈
- ❌ 不简化成 OSS SDK
- ✅ 代码优先
- ✅ 架构优先
- ✅ 可拆包、可复用、可扩展

---

## 十七、用户侧 SDK API 示例

```js
import { uploadFile } from "xx";

async function handleFileInputChange(evt) {
  const file = evt.target.files[0];
  try {
    return await uploadFile(file, options);
  } catch (err) {
    // error handling
  }
}

// 支持 CancelToken
// 支持错误格式化
// 支持自定义网络请求实现
```

---

## 十八、开源署名信息

- GitHub：Sunny-117
- Email：[zhiqiangfu6@gmail.com](mailto:zhiqiangfu6@gmail.com)

---
