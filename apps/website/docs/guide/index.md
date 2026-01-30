# What is ChunkFlow?

ChunkFlow is a universal large file upload solution that provides a complete, production-ready SDK for handling file uploads of any size. It's designed with a layered architecture that makes it highly flexible, performant, and easy to integrate into any project.

## The Problem

Uploading large files on the web is challenging:

- **Network Instability**: Long uploads can fail due to network interruptions
- **Memory Constraints**: Loading entire files into memory can crash browsers
- **Poor User Experience**: Users have no visibility into upload progress or ability to pause/resume
- **Duplicate Uploads**: Same files uploaded multiple times waste bandwidth and storage
- **Performance**: One-size-fits-all approaches don't adapt to varying network conditions

## The Solution

ChunkFlow solves these problems with a comprehensive set of features:

### 🚀 Smart Upload Strategy

Automatically selects the optimal upload strategy based on file size:

- Files < 5MB: Direct upload for speed
- Files ≥ 5MB: Chunked upload for reliability

### 📦 Dynamic Chunking

Adapts chunk size based on network conditions, similar to TCP slow start:

- Fast network → Larger chunks (up to 10MB)
- Slow network → Smaller chunks (down to 256KB)
- Optimizes for both speed and reliability

### ⚡ Instant Upload (Deduplication)

Hash-based deduplication enables instant uploads:

- **Full Instant Upload**: File already exists → Skip entire upload
- **Partial Instant Upload**: Some chunks exist → Upload only missing chunks
- Saves bandwidth and time

### 🔄 Resumable Upload

Continue from where you left off:

- Progress persisted to IndexedDB
- Automatic recovery on page reload
- Manual pause/resume controls

### 🎯 Framework Agnostic

Works with any framework or vanilla JavaScript:

- React Hooks and Components
- Vue Composables and Components
- Framework-independent Core layer

### 🛠️ Highly Extensible

Plugin system for custom functionality:

- Logging
- Analytics
- Custom validation
- Progress tracking
- And more...

## Architecture

ChunkFlow uses a layered architecture where each layer has a specific responsibility:

```
┌─────────────────────────────────────┐
│     Component Layer                 │  Ready-to-use UI components
│  (React/Vue Components)             │
├─────────────────────────────────────┤
│     Client Layer                    │  Framework adapters
│  (React Hooks / Vue Composables)   │
├─────────────────────────────────────┤
│     Core Layer                      │  Upload logic & state machine
│  (UploadManager, UploadTask)       │
├─────────────────────────────────────┤
│     Shared Layer                    │  Common utilities
│  (Events, Concurrency, File Utils) │
├─────────────────────────────────────┤
│     Protocol Layer                  │  Type definitions & interfaces
│  (TypeScript Types)                │
└─────────────────────────────────────┘
```

Each layer is independent and can be used separately, giving you maximum flexibility.

## Key Features

### Parallel Hash Calculation

Hash calculation and upload happen simultaneously:

- Don't wait for hash to complete before starting upload
- Cancel ongoing upload if file already exists
- Prioritize first few chunks for quick feedback

### Concurrency Control

Smart management of parallel uploads:

- Configurable concurrent chunk uploads (default: 3)
- Queue management for optimal resource usage
- Dynamic adjustment based on performance

### Error Handling & Retry

Robust error handling with automatic retry:

- Exponential backoff strategy
- Configurable retry count and delay
- Graceful degradation when features unavailable

### Progress Tracking

Real-time progress information:

- Upload percentage
- Upload speed (bytes/second)
- Estimated remaining time
- Per-chunk progress

### Lifecycle Events

Complete event system for custom logic:

- `onStart`: Upload begins
- `onProgress`: Progress updates
- `onSuccess`: Upload completes
- `onError`: Error occurs
- `onPause`: Upload paused
- `onResume`: Upload resumed
- `onCancel`: Upload cancelled

## Use Cases

ChunkFlow is perfect for:

- **Media Platforms**: Video and image upload platforms
- **Cloud Storage**: File storage and backup services
- **Content Management**: CMS with large file support
- **E-Learning**: Course material and video uploads
- **Enterprise Apps**: Document management systems
- **Any Application**: That needs reliable large file uploads

## Next Steps

Ready to get started? Check out the [Getting Started](/guide/getting-started) guide to begin using ChunkFlow in your project.
