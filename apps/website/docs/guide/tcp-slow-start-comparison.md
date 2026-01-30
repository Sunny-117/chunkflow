# TCP Slow Start Comparison

This document compares ChunkFlow's chunk size adjustment strategies and explains the differences between them and the actual TCP slow start algorithm.

## Overview

ChunkFlow provides two built-in strategies for chunk size adjustment:

1. **TCP-Like Strategy** (Default) - Full TCP slow start implementation with state machine
2. **Simple Strategy** - Simplified binary adjustment for stable networks

## Simple Strategy

ChunkFlow's `ChunkSizeAdjuster` uses a simplified binary algorithm:

```typescript
adjust(uploadTimeMs: number): number {
  const { targetTime, minSize, maxSize } = this.options;

  // Fast upload: double chunk size
  if (uploadTimeMs < targetTime * 0.5) {
    this.currentSize = Math.min(this.currentSize * 2, maxSize);
  }
  // Slow upload: halve chunk size
  else if (uploadTimeMs > targetTime * 1.5) {
    this.currentSize = Math.max(this.currentSize / 2, minSize);
  }
  // Normal: keep current size

  return this.currentSize;
}
```

### Characteristics

- **Simple binary decision**: Fast → double, Slow → halve
- **No state machine**: Always uses the same logic
- **No threshold**: No distinction between growth phases
- **Aggressive**: Always exponential growth/reduction

## TCP Slow Start Algorithm

TCP's congestion control has multiple phases:

### 1. Slow Start Phase

- **Initial window**: Starts small (typically 1-10 MSS)
- **Growth**: Exponential - doubles every RTT
- **Trigger**: Continues until reaching `ssthresh` (slow start threshold)
- **Formula**: `cwnd += MSS` for each ACK received

### 2. Congestion Avoidance Phase

- **Trigger**: When `cwnd >= ssthresh`
- **Growth**: Linear - increases by 1 MSS per RTT
- **Formula**: `cwnd += MSS * MSS / cwnd` per ACK
- **Purpose**: More conservative growth to avoid congestion

### 3. Fast Recovery Phase

- **Trigger**: When packet loss detected (3 duplicate ACKs)
- **Action**:
  - Set `ssthresh = cwnd / 2`
  - Set `cwnd = ssthresh`
  - Enter congestion avoidance
- **Purpose**: Quick recovery without full restart

## Key Differences

| Aspect           | Simple Strategy                   | TCP-Like Strategy                                          |
| ---------------- | --------------------------------- | ---------------------------------------------------------- |
| **States**       | None (stateless)                  | 3 states (Slow Start, Congestion Avoidance, Fast Recovery) |
| **Threshold**    | None                              | `ssthresh` determines phase transition                     |
| **Growth**       | Always exponential (2x)           | Exponential → Linear transition                            |
| **Reduction**    | Always halve (0.5x)               | Halve and enter recovery state                             |
| **Complexity**   | Simple                            | More sophisticated                                         |
| **Adaptability** | Binary (fast/slow)                | Gradual with state awareness                               |
| **Default**      | No                                | **Yes** ✅                                                 |
| **Best For**     | Stable networks, simple use cases | Variable networks, production environments                 |

## TCP-Like Strategy (Default)

ChunkFlow's `TCPChunkSizeAdjuster` implements a proper TCP slow start algorithm with state machine:

```typescript
enum CongestionState {
  SLOW_START = "slow_start",
  CONGESTION_AVOIDANCE = "congestion_avoidance",
  FAST_RECOVERY = "fast_recovery",
}

class TCPChunkSizeAdjuster {
  private currentSize: number;
  private ssthresh: number; // Slow start threshold
  private state: CongestionState;

  adjust(uploadTimeMs: number): number {
    const ratio = uploadTimeMs / targetTime;

    if (ratio < 0.5) {
      // Fast upload
      this.handleFastUpload();
    } else if (ratio > 1.5) {
      // Slow upload (congestion)
      this.handleSlowUpload();
    }

    return this.currentSize;
  }

  private handleFastUpload(): void {
    switch (this.state) {
      case CongestionState.SLOW_START:
        // Exponential growth
        const newSize = this.currentSize * 2;
        if (newSize >= this.ssthresh) {
          this.currentSize = this.ssthresh;
          this.state = CongestionState.CONGESTION_AVOIDANCE;
        } else {
          this.currentSize = newSize;
        }
        break;

      case CongestionState.CONGESTION_AVOIDANCE:
        // Linear growth (10% increment)
        const increment = Math.floor(this.currentSize * 0.1);
        this.currentSize += increment;
        break;

      case CongestionState.FAST_RECOVERY:
        // Exit recovery
        this.state = CongestionState.CONGESTION_AVOIDANCE;
        break;
    }
  }

  private handleSlowUpload(): void {
    // Congestion detected
    this.ssthresh = Math.floor(this.currentSize / 2);
    this.currentSize = this.ssthresh;
    this.state = CongestionState.FAST_RECOVERY;
  }
}
```

## Advantages of Each Strategy

### TCP-Like Strategy (Default) ✅

**Pros**:

- More stable on variable networks
- Learns from past performance
- Better congestion handling
- Closer to proven TCP algorithm
- Reduces oscillation
- **Recommended for most use cases**

**Cons**:

- More complex
- Slightly higher overhead

**Best for**:

- Variable network conditions
- Production environments
- When stability is critical
- Large file uploads
- **Most use cases (default)**

### Simple Strategy

**Pros**:

- Simple to understand
- Low overhead
- Works well for stable networks

**Cons**:

- Can oscillate on variable networks
- No learning from past performance
- May overshoot optimal size

**Best for**:

- Stable network conditions
- Simple use cases
- When simplicity is preferred
- Educational purposes

## Performance Comparison

### Scenario 1: Fast Network

**Current Implementation**:

```
1MB → 2MB → 4MB → 8MB → 10MB (max)
```

- Reaches max in 4 steps
- May overshoot optimal size

**TCP-Like Implementation**:

```
1MB → 2MB → 4MB (ssthresh) → 4.4MB → 4.8MB → 5.3MB
```

- More gradual approach to optimal size
- Less likely to cause congestion

### Scenario 2: Variable Network

**Current Implementation**:

```
1MB → 2MB → 1MB → 2MB → 1MB (oscillating)
```

- Unstable, keeps oscillating

**TCP-Like Implementation**:

```
1MB → 2MB → 1MB (ssthresh) → 1.1MB → 1.2MB (stable)
```

- Finds stable point
- Remembers threshold

### Scenario 3: Degrading Network

**Current Implementation**:

```
4MB → 2MB → 4MB → 2MB (no learning)
```

- Doesn't learn from congestion

**TCP-Like Implementation**:

```
4MB → 2MB (ssthresh) → 2.2MB → 1MB (ssthresh) → 1.1MB
```

- Adapts threshold based on experience
- More conservative after congestion

## When to Use Each

### TCP-Like Strategy (Default) ✅

**Pros**:

- More stable on variable networks
- Learns from past performance
- Better congestion handling
- Closer to proven TCP algorithm
- Reduces oscillation

**Cons**:

- More complex
- Slightly higher overhead

**Best for**:

- Variable network conditions
- Production environments
- When stability is critical
- Large file uploads
- **Most use cases (default)**

### Simple Strategy

**Pros**:

- Simple to understand
- Low overhead
- Works well for stable networks

**Cons**:

- Can oscillate on variable networks
- No learning from past performance
- May overshoot optimal size

**Best for**:

- Stable network conditions
- Simple use cases
- When simplicity is preferred
- Educational purposes

## Configuration

ChunkFlow makes it easy to choose between strategies or provide your own:

### Using Default (TCP-Like) ✅

```typescript
const manager = new UploadManager({
  requestAdapter: adapter,
});

const task = manager.createTask(file);
// Uses TCP-like strategy by default
```

### Choosing Simple Strategy

```typescript
const task = manager.createTask(file, {
  chunkSizeStrategy: "simple",
});
```

### Customizing TCP-Like Strategy

```typescript
const task = manager.createTask(file, {
  chunkSizeStrategy: "tcp-like",
  initialSsthresh: 5 * 1024 * 1024, // 5MB threshold (default)
});
```

### Custom Implementation

```typescript
import type { IChunkSizeAdjuster } from "@chunkflow/core";

class CustomAdjuster implements IChunkSizeAdjuster {
  adjust(uploadTimeMs: number): number {
    // Your custom logic
  }
  getCurrentSize(): number {
    // Return current size
  }
  reset(): void {
    // Reset to initial state
  }
}

const task = manager.createTask(file, {
  chunkSizeStrategy: new CustomAdjuster(),
});
```

## Conclusion

ChunkFlow uses a **TCP slow start inspired algorithm by default**, providing sophisticated congestion control with three phases: Slow Start, Congestion Avoidance, and Fast Recovery.

The TCP-like strategy (default) provides better stability and adaptability compared to the simple strategy, making it ideal for production environments and variable network conditions. The simple strategy remains available for use cases where simplicity is preferred or network conditions are stable.

Both strategies implement the `IChunkSizeAdjuster` interface, allowing you to easily switch between them or provide your own custom implementation.

## See Also

- [Dynamic Chunking Guide](/guide/dynamic-chunking)
- [Performance Optimization](/guide/performance)
- [TCP Congestion Control (RFC 5681)](https://tools.ietf.org/html/rfc5681)
