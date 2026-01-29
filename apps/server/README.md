# ChunkFlow Upload Server

A high-performance file upload server built with Nest.js and Fastify, supporting chunked uploads, deduplication, and instant upload (秒传).

## Features

- **Chunked Upload**: Upload large files in chunks with automatic retry
- **Deduplication**: Identical chunks are stored only once
- **Instant Upload (秒传)**: Skip uploading if file already exists
- **Partial Instant Upload**: Skip uploading chunks that already exist
- **Range Requests**: Support for partial content delivery
- **PostgreSQL**: Reliable metadata storage
- **Local Storage**: Efficient chunk storage with hash-based directory structure

## Prerequisites

- Node.js 18+
- Docker and Docker Compose (for PostgreSQL)
- pnpm

## Quick Start

### 1. Start PostgreSQL

```bash
cd apps/server
docker-compose up postgres -d
```

### 2. Configure Environment

Create a `.env` file or set environment variables:

```bash
DATABASE_URL=postgresql://chunkflow:chunkflow@localhost:5432/chunkflow
JWT_SECRET=your-secret-key-change-in-production
STORAGE_PATH=./storage
PORT=3001
```

### 3. Build and Run

```bash
# Build
pnpm build

# Development mode
pnpm dev

# Production mode
pnpm start
```

The server will start on `http://localhost:3001`.

## API Endpoints

### POST /upload/create

Create a new upload session.

**Request:**
```json
{
  "fileName": "example.pdf",
  "fileSize": 1048576,
  "fileType": "application/pdf",
  "fileHash": "abc123...",
  "chunkSize": 2097152
}
```

**Response:**
```json
{
  "fileId": "abc123...",
  "uploadToken": "eyJhbGc...",
  "negotiatedChunkSize": 2097152
}
```

### POST /upload/verify

Verify file/chunk hashes for instant upload.

**Request:**
```json
{
  "uploadToken": "eyJhbGc...",
  "fileHash": "abc123...",
  "chunkHashes": ["hash1", "hash2", ...]
}
```

**Response:**
```json
{
  "fileExists": false,
  "existingChunks": [0, 2],
  "missingChunks": [1, 3, 4]
}
```

### POST /upload/chunk

Upload a file chunk (multipart/form-data).

**Form Fields:**
- `uploadToken`: Upload token from create response
- `chunkIndex`: Chunk index (0-based)
- `chunkHash`: MD5 hash of the chunk
- `file`: The chunk data

**Response:**
```json
{
  "success": true,
  "chunkHash": "abc123..."
}
```

### POST /upload/merge

Merge all chunks and complete the upload.

**Request:**
```json
{
  "uploadToken": "eyJhbGc...",
  "fileHash": "abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "fileId": "abc123...",
  "fileUrl": "/files/abc123..."
}
```

### GET /files/:fileId

Download a file. Supports Range requests.

**Headers:**
- `Range`: Optional, e.g., `bytes=0-1023`

**Response:**
- Status 200 (full file) or 206 (partial content)
- File stream

## Architecture

### Database Schema

**files table:**
- `file_id`: Unique file identifier
- `file_name`: Original filename
- `file_size`: File size in bytes
- `file_type`: MIME type
- `file_hash`: MD5 hash of the entire file
- `upload_token`: JWT token for authentication
- `chunk_size`: Negotiated chunk size
- `total_chunks`: Total number of chunks
- `uploaded_chunks`: Number of uploaded chunks
- `status`: Upload status (pending/uploading/completed/failed)
- `url`: File access URL (when completed)
- `created_at`, `updated_at`, `completed_at`: Timestamps

**chunks table:**
- `chunk_hash`: MD5 hash (primary key)
- `chunk_size`: Chunk size in bytes
- `storage_path`: Path in storage
- `reference_count`: Number of files using this chunk
- `created_at`: Timestamp

**file_chunks table:**
- `file_id`: File identifier
- `chunk_index`: Chunk index in the file
- `chunk_hash`: Chunk hash
- `created_at`: Timestamp

### Storage Structure

Chunks are stored in a hash-based directory structure:

```
storage/
  ab/
    abc123def456...
  cd/
    cdef789abc012...
```

The first two characters of the chunk hash are used as the subdirectory name for better filesystem performance.

## Development

### Running Tests

```bash
# Unit tests
pnpm test

# Integration tests (requires running PostgreSQL)
pnpm test:e2e
```

### Building

```bash
pnpm build
```

### Linting

```bash
pnpm lint
```

## Docker Deployment

Build and run the entire stack:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Upload server on port 3001

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://chunkflow:chunkflow@localhost:5432/chunkflow` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key-change-in-production` |
| `STORAGE_PATH` | Directory for storing chunks | `./storage` |
| `PORT` | Server port | `3001` |

## License

MIT
