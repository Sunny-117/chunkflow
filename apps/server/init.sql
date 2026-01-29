-- Initialize database schema for ChunkFlow Upload

-- Files table
CREATE TABLE IF NOT EXISTS files (
  file_id VARCHAR(64) PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100),
  file_hash VARCHAR(64),
  upload_token VARCHAR(512) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_file_hash ON files(file_hash);
CREATE INDEX IF NOT EXISTS idx_upload_token ON files(upload_token);

-- Chunks table
CREATE TABLE IF NOT EXISTS chunks (
  chunk_hash VARCHAR(64) PRIMARY KEY,
  chunk_size INT NOT NULL,
  storage_path VARCHAR(512) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reference_count INT DEFAULT 0
);

-- File-Chunk association table
CREATE TABLE IF NOT EXISTS file_chunks (
  id BIGSERIAL PRIMARY KEY,
  file_id VARCHAR(64) NOT NULL,
  chunk_index INT NOT NULL,
  chunk_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES files(file_id) ON DELETE CASCADE,
  FOREIGN KEY (chunk_hash) REFERENCES chunks(chunk_hash),
  UNIQUE (file_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_file_chunks_file_id ON file_chunks(file_id);
CREATE INDEX IF NOT EXISTS idx_file_chunks_chunk_hash ON file_chunks(chunk_hash);
