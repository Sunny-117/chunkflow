# TCP 慢启动对比

本文档对比了 ChunkFlow 当前的分片大小调整算法与真实的 TCP 慢启动算法。

## 概述

ChunkFlow 提供两种内置的分片大小调整策略：

1. **类 TCP 策略**（默认）- 完整的 TCP 慢启动实现，带有状态机
2. **简单策略** - 简化的二元调整，适用于稳定网络

## 简单策略

ChunkFlow 的 `ChunkSizeAdjuster` 使用了简化的算法：

```typescript
adjust(uploadTimeMs: number): number {
  const { targetTime, minSize, maxSize } = this.options;

  // 快速上传：分片大小翻倍
  if (uploadTimeMs < targetTime * 0.5) {
    this.currentSize = Math.min(this.currentSize * 2, maxSize);
  }
  // 慢速上传：分片大小减半
  else if (uploadTimeMs > targetTime * 1.5) {
    this.currentSize = Math.max(this.currentSize / 2, minSize);
  }
  // 正常：保持当前大小

  return this.currentSize;
}
```

### 特点

- **简单的二元决策**：快速 → 翻倍，慢速 → 减半
- **无状态机**：始终使用相同的逻辑
- **无阈值**：不区分增长阶段
- **激进**：始终是指数级增长/减少

## TCP 慢启动算法

TCP 的拥塞控制有多个阶段：

### 1. 慢启动阶段（Slow Start）

- **初始窗口**：从小窗口开始（通常是 1-10 MSS）
- **增长**：指数级 - 每个 RTT 翻倍
- **触发条件**：持续到达到 `ssthresh`（慢启动阈值）
- **公式**：每收到一个 ACK，`cwnd += MSS`

### 2. 拥塞避免阶段（Congestion Avoidance）

- **触发条件**：当 `cwnd >= ssthresh`
- **增长**：线性 - 每个 RTT 增加 1 MSS
- **公式**：每个 ACK，`cwnd += MSS * MSS / cwnd`
- **目的**：更保守的增长以避免拥塞

### 3. 快速恢复阶段（Fast Recovery）

- **触发条件**：检测到丢包（3 个重复 ACK）
- **动作**：
  - 设置 `ssthresh = cwnd / 2`
  - 设置 `cwnd = ssthresh`
  - 进入拥塞避免阶段
- **目的**：快速恢复而不完全重启

## 关键差异

| 方面       | 简单策略           | 类 TCP 策略                            |
| ---------- | ------------------ | -------------------------------------- |
| **状态**   | 无（无状态）       | 3 个状态（慢启动、拥塞避免、快速恢复） |
| **阈值**   | 无                 | `ssthresh` 决定阶段转换                |
| **增长**   | 始终指数级（2x）   | 指数级 → 线性转换                      |
| **减少**   | 始终减半（0.5x）   | 减半并进入恢复状态                     |
| **复杂度** | 简单               | 更复杂                                 |
| **适应性** | 二元（快/慢）      | 渐进式，具有状态感知                   |
| **默认**   | 否                 | **是** ✅                              |
| **最适合** | 稳定网络，简单用例 | 可变网络，生产环境                     |

## 改进的类 TCP 实现（默认）✅

ChunkFlow 在 `TCPChunkSizeAdjuster` 中实现了完整的 TCP 慢启动算法：

```typescript
enum CongestionState {
  SLOW_START = "slow_start",
  CONGESTION_AVOIDANCE = "congestion_avoidance",
  FAST_RECOVERY = "fast_recovery",
}

class TCPChunkSizeAdjuster {
  private currentSize: number;
  private ssthresh: number; // 慢启动阈值
  private state: CongestionState;

  adjust(uploadTimeMs: number): number {
    const ratio = uploadTimeMs / targetTime;

    if (ratio < 0.5) {
      // 快速上传
      this.handleFastUpload();
    } else if (ratio > 1.5) {
      // 慢速上传（拥塞）
      this.handleSlowUpload();
    }

    return this.currentSize;
  }

  private handleFastUpload(): void {
    switch (this.state) {
      case CongestionState.SLOW_START:
        // 指数级增长
        const newSize = this.currentSize * 2;
        if (newSize >= this.ssthresh) {
          this.currentSize = this.ssthresh;
          this.state = CongestionState.CONGESTION_AVOIDANCE;
        } else {
          this.currentSize = newSize;
        }
        break;

      case CongestionState.CONGESTION_AVOIDANCE:
        // 线性增长（10% 增量）
        const increment = Math.floor(this.currentSize * 0.1);
        this.currentSize += increment;
        break;

      case CongestionState.FAST_RECOVERY:
        // 退出恢复
        this.state = CongestionState.CONGESTION_AVOIDANCE;
        break;
    }
  }

  private handleSlowUpload(): void {
    // 检测到拥塞
    this.ssthresh = Math.floor(this.currentSize / 2);
    this.currentSize = this.ssthresh;
    this.state = CongestionState.FAST_RECOVERY;
  }
}
```

## 类 TCP 策略的优势（默认）✅

### 1. 渐进式增长

不是始终翻倍，算法从指数级增长过渡到线性增长：

- **早期阶段**：快速指数级增长以快速找到最优大小
- **后期阶段**：保守的线性增长以避免过冲

### 2. 更好的拥塞处理

当检测到拥塞时：

- 基于当前性能设置阈值
- 减小大小但记住阈值
- 避免重复过冲

### 3. 状态感知

算法"记住"过去的性能：

- 知道是否处于探索阶段（慢启动）
- 知道是否处于优化阶段（拥塞避免）
- 知道是否正在从拥塞中恢复

### 4. 更稳定

减少极端值之间的振荡：

- 当前：1MB → 2MB → 4MB → 2MB → 4MB → 2MB（振荡）
- 类 TCP：1MB → 2MB → 4MB → 5MB → 5.5MB → 6MB（稳定增长）

## 性能对比

### 场景 1：快速网络

**当前实现**：

```
1MB → 2MB → 4MB → 8MB → 10MB（最大）
```

- 4 步达到最大值
- 可能超过最优大小

**类 TCP 实现**：

```
1MB → 2MB → 4MB（ssthresh）→ 4.4MB → 4.8MB → 5.3MB
```

- 更渐进地接近最优大小
- 不太可能造成拥塞

### 场景 2：可变网络

**当前实现**：

```
1MB → 2MB → 1MB → 2MB → 1MB（振荡）
```

- 不稳定，持续振荡

**类 TCP 实现**：

```
1MB → 2MB → 1MB（ssthresh）→ 1.1MB → 1.2MB（稳定）
```

- 找到稳定点
- 记住阈值

### 场景 3：网络降级

**当前实现**：

```
4MB → 2MB → 4MB → 2MB（无学习）
```

- 不从拥塞中学习

**类 TCP 实现**：

```
4MB → 2MB（ssthresh）→ 2.2MB → 1MB（ssthresh）→ 1.1MB
```

- 基于经验调整阈值
- 拥塞后更保守

## 何时使用

### 类 TCP 策略（默认）✅

**优点**：

- 在可变网络上更稳定
- 从过去的性能中学习
- 更好的拥塞处理
- 更接近经过验证的 TCP 算法
- 减少振荡

**缺点**：

- 更复杂
- 略高的开销

**最适合**：

- 可变的网络条件
- 生产环境
- 当稳定性至关重要时
- 大文件上传
- **大多数用例（默认）**

### 简单策略

**优点**：

- 易于理解
- 低开销
- 在稳定网络上表现良好

**缺点**：

- 在可变网络上可能振荡
- 不从过去的性能中学习
- 可能超过最优大小

**最适合**：

- 稳定的网络条件
- 简单的用例
- 当简单性优先时
- 教育目的

## 配置

ChunkFlow 让您可以轻松选择策略或提供自己的实现：

### 使用默认（类 TCP）✅

```typescript
const manager = new UploadManager({
  requestAdapter: adapter,
});

const task = manager.createTask(file);
// 默认使用类 TCP 策略
```

### 选择简单策略

```typescript
const task = manager.createTask(file, {
  chunkSizeStrategy: "simple",
});
```

### 自定义类 TCP 策略

```typescript
const task = manager.createTask(file, {
  chunkSizeStrategy: "tcp-like",
  initialSsthresh: 5 * 1024 * 1024, // 5MB 阈值（默认）
});
```

### 自定义实现

```typescript
import type { IChunkSizeAdjuster } from "@chunkflow/core";

class CustomAdjuster implements IChunkSizeAdjuster {
  adjust(uploadTimeMs: number): number {
    // 你的自定义逻辑
  }
  getCurrentSize(): number {
    // 返回当前大小
  }
  reset(): void {
    // 重置到初始状态
  }
}

const task = manager.createTask(file, {
  chunkSizeStrategy: new CustomAdjuster(),
});
```

## 结论

ChunkFlow **默认使用受 TCP 慢启动启发的算法**，提供复杂的拥塞控制，包含三个阶段：慢启动、拥塞避免和快速恢复。

类 TCP 策略（默认）相比简单策略提供了更好的稳定性和适应性，使其成为生产环境和可变网络条件的理想选择。简单策略仍然可用于简单性优先或网络条件稳定的用例。

两种策略都实现了 `IChunkSizeAdjuster` 接口，允许您轻松在它们之间切换或提供自己的自定义实现。

## 另请参阅

- [动态分片指南](/zh/guide/dynamic-chunking)
- [性能优化](/zh/guide/performance)
- [TCP 拥塞控制（RFC 5681）](https://tools.ietf.org/html/rfc5681)
