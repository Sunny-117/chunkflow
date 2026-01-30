# ChunkFlow Upload Server

Complete server application for ChunkFlow Upload SDK built with NestJS.

## Description

This is a production-ready server implementation using:

- NestJS framework
- Fastify for high performance
- PostgreSQL for metadata storage
- Local filesystem for chunk storage

## Project Setup

```bash
# Install dependencies
pnpm install

# Build the project
pnpm run build
```

## Quick Start

```bash
# 1. Setup database (one-time setup)
pnpm run db:setup

# 2. Start the development server
pnpm run start:dev
```

The server will start on `http://localhost:3001`.

## Database Setup

The server requires a PostgreSQL database.

### Option 1: Use Local PostgreSQL (Recommended for Development)

If you have PostgreSQL installed locally with trust authentication:

```bash
# Create the database
psql -h localhost -U $(whoami) -d postgres -c "CREATE DATABASE chunkflow;"

# Initialize the database schema
psql -h localhost -U $(whoami) -d chunkflow -f init.sql
```

The server will automatically connect using your current system user without a password.

### Option 2: Use Docker

Start PostgreSQL with Docker Compose:

```bash
# Start PostgreSQL with Docker Compose
docker-compose up -d postgres

# The database will be automatically initialized with init.sql
```

### Option 3: Custom Database Connection

Set the `DATABASE_URL` environment variable to connect to your existing PostgreSQL instance:

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

## Running the Server

```bash
# Development mode with watch
pnpm run start:dev

# Production mode
pnpm run start:prod

# Debug mode
pnpm run start:debug
```

The server will start on `http://localhost:3001` by default.

## Environment Variables

- `PORT` - Server port (default: 3001)
- `DATABASE_URL` - PostgreSQL connection string
- `STORAGE_PATH` - Path for storing chunks (default: ./storage)
- `JWT_SECRET` - Secret key for JWT tokens (change in production!)

## API Endpoints

### Health Check

```
GET /health
```

### Upload Endpoints

```
POST /upload/create      - Create upload session
POST /upload/verify      - Verify file/chunk hashes
POST /upload/chunk       - Upload a chunk
POST /upload/merge       - Merge chunks into file
GET  /upload/files/:id   - Download file
```

## Testing

```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

## Code Quality

```bash
# Lint code
pnpm run lint

# Format code
pnpm run format

# Type check
pnpm run typecheck
```

## Architecture

The server follows NestJS best practices with a modular structure:

- `src/main.ts` - Application entry point
- `src/app.module.ts` - Root module
- `src/common/` - Shared utilities and filters
- `src/database/` - Database module and adapters
- `src/health/` - Health check controller
- `src/upload/` - Upload module with controllers and services

## License

MIT
