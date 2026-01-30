# 动态分片

ChunkFlow 使用受 TCP 启发的算法根据网络性能动态调整分片大小。

## 默认策略：类 TCP（推荐）

默认情况下，ChunkFlow 使用受 TCP 慢启动启发的算法，包含三个阶段：

### 1. 慢启动阶段

- **初始大小**：从协商的分片大小开始（通常为 1MB）
- **增长**：指数级 - 每次成功上传翻倍
- **转换**：达到 `ssthresh`（默认：5MB）时切换到拥塞避免

### 2. 拥塞避免阶段

- **增长**：线性 - 每次成功上传增加 10%
- **目的**：更保守的增长以找到最优大小
- **稳定性**：减少振荡和过冲

### 3. 快速恢复阶段

- **触发**：当上传缓慢时（> 目标时间的 150%）
- **动作**：设置 `ssthresh = currentSize / 2`，减小大小
- **恢复**：逐渐再次增加大小

## 算法

```typescript
// 类 TCP 策略（默认）
if (uploadTime < targetTime * 0.5) {
  // 快速上传
  if (state === SLOW_START) {
    size = size * 2; // 指数级增长
    if (size >= ssthresh) {
      state = CONGESTION_AVOIDANCE;
    }
  } else if (state === CONGESTION_AVOIDANCE) {
    size = size + size * 0.1; // 线性增长
  }
} else if (uploadTime > targetTime * 1.5) {
  // 慢速上传（检测到拥塞）
  ssthresh = size / 2;
  size = ssthresh;
  state = FAST_RECOVERY;
}
```

## 替代方案：简单策略

ChunkFlow 还提供了更简单的二元调整策略：

```typescript
// 简单策略
if (uploadTime < targetTime * 0.5) {
  size = size * 2; // 快速时翻倍
} else if (uploadTime > targetTime * 1.5) {
  size = size / 2; // 慢速时减半
}
```

## 配置

### 使用默认（类 TCP）

```typescript
const task = manager.createTask(file);
// 默认使用类 TCP 策略
```

### 选择策略

```typescript
const task = manager.createTask(file, {
  chunkSizeStrategy: "tcp-like", // 默认，推荐
  initialSsthresh: 5 * 1024 * 1024, // 5MB 阈值
});

// 或使用简单策略
const task = manager.createTask(file, {
  chunkSizeStrategy: "simple",
});
```

### 自定义调整器

你可以提供自己的分片大小调整器：

```typescript
import type { IChunkSizeAdjuster } from "@chunkflow/core";

class CustomAdjuster implements IChunkSizeAdjuster {
  private currentSize: number;

  constructor(initialSize: number) {
    this.currentSize = initialSize;
  }

  adjust(uploadTimeMs: number): number {
    // 你的自定义逻辑
    if (uploadTimeMs < 1000) {
      this.currentSize *= 1.5; // 增加 50%
    } else if (uploadTimeMs > 5000) {
      this.currentSize *= 0.8; // 减少 20%
    }
    return this.currentSize;
  }

  getCurrentSize(): number {
    return this.currentSize;
  }

  reset(): void {
    this.currentSize = 1024 * 1024; // 重置为 1MB
  }
}

// 使用自定义调整器
const task = manager.createTask(file, {
  chunkSizeStrategy: new CustomAdjuster(1024 * 1024),
});
```

## 优势

### 类 TCP 策略（默认）

- ✅ 在可变网络上更稳定
- ✅ 从过去的性能中学习
- ✅ 更好的拥塞处理
- ✅ 减少振荡
- ✅ 来自 TCP 的经过验证的算法

### 简单策略

- ✅ 易于理解
- ✅ 低开销
- ✅ 在稳定网络上表现良好

## 性能对比

详细分析请参见 [TCP 慢启动对比](/zh/guide/tcp-slow-start-comparison)。

## 另请参阅

- [上传策略](/zh/guide/upload-strategies)
- [TCP 慢启动对比](/zh/guide/tcp-slow-start-comparison)
- [性能优化](/zh/guide/performance)
