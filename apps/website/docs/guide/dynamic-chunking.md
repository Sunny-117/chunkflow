# Dynamic Chunking

ChunkFlow dynamically adjusts chunk size based on network performance using TCP-inspired algorithms.

## Default Strategy: TCP-Like (Recommended)

By default, ChunkFlow uses a TCP slow start inspired algorithm with three phases:

### 1. Slow Start Phase

- **Initial size**: Starts with negotiated chunk size (typically 1MB)
- **Growth**: Exponential - doubles every successful upload
- **Transition**: Switches to Congestion Avoidance when reaching `ssthresh` (default: 5MB)

### 2. Congestion Avoidance Phase

- **Growth**: Linear - increases by 10% per successful upload
- **Purpose**: More conservative growth to find optimal size
- **Stability**: Reduces oscillation and overshooting

### 3. Fast Recovery Phase

- **Trigger**: When upload is slow (> 150% of target time)
- **Action**: Sets `ssthresh = currentSize / 2`, reduces size
- **Recovery**: Gradually increases size again

## Algorithm

```typescript
// TCP-like strategy (default)
if (uploadTime < targetTime * 0.5) {
  // Fast upload
  if (state === SLOW_START) {
    size = size * 2; // Exponential growth
    if (size >= ssthresh) {
      state = CONGESTION_AVOIDANCE;
    }
  } else if (state === CONGESTION_AVOIDANCE) {
    size = size + size * 0.1; // Linear growth
  }
} else if (uploadTime > targetTime * 1.5) {
  // Slow upload (congestion detected)
  ssthresh = size / 2;
  size = ssthresh;
  state = FAST_RECOVERY;
}
```

## Alternative: Simple Strategy

ChunkFlow also provides a simpler binary adjustment strategy:

```typescript
// Simple strategy
if (uploadTime < targetTime * 0.5) {
  size = size * 2; // Double when fast
} else if (uploadTime > targetTime * 1.5) {
  size = size / 2; // Halve when slow
}
```

## Configuration

### Using Default (TCP-Like)

```typescript
const task = manager.createTask(file);
// Uses TCP-like strategy by default
```

### Choosing a Strategy

```typescript
const task = manager.createTask(file, {
  chunkSizeStrategy: "tcp-like", // Default, recommended
  initialSsthresh: 5 * 1024 * 1024, // 5MB threshold
});

// Or use simple strategy
const task = manager.createTask(file, {
  chunkSizeStrategy: "simple",
});
```

### Custom Adjuster

You can provide your own chunk size adjuster:

```typescript
import type { IChunkSizeAdjuster } from "@chunkflow/core";

class CustomAdjuster implements IChunkSizeAdjuster {
  private currentSize: number;

  constructor(initialSize: number) {
    this.currentSize = initialSize;
  }

  adjust(uploadTimeMs: number): number {
    // Your custom logic here
    if (uploadTimeMs < 1000) {
      this.currentSize *= 1.5; // Increase by 50%
    } else if (uploadTimeMs > 5000) {
      this.currentSize *= 0.8; // Decrease by 20%
    }
    return this.currentSize;
  }

  getCurrentSize(): number {
    return this.currentSize;
  }

  reset(): void {
    this.currentSize = 1024 * 1024; // Reset to 1MB
  }
}

// Use custom adjuster
const task = manager.createTask(file, {
  chunkSizeStrategy: new CustomAdjuster(1024 * 1024),
});
```

## Benefits

### TCP-Like Strategy (Default)

- ✅ More stable on variable networks
- ✅ Learns from past performance
- ✅ Better congestion handling
- ✅ Reduces oscillation
- ✅ Proven algorithm from TCP

### Simple Strategy

- ✅ Easy to understand
- ✅ Low overhead
- ✅ Works well for stable networks

## Performance Comparison

See [TCP Slow Start Comparison](/guide/tcp-slow-start-comparison) for detailed analysis.

## See Also

- [Upload Strategies](/guide/upload-strategies)
- [TCP Slow Start Comparison](/guide/tcp-slow-start-comparison)
- [Performance Optimization](/guide/performance)
