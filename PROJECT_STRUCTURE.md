# ChunkFlow Upload SDK - Project Structure

## Overview

This document describes the complete project structure created for the ChunkFlow Upload SDK monorepo.

## Directory Structure

```
chunkflow-upload-sdk/
├── .changeset/                    # Changeset configuration for versioning
│   ├── config.json
│   └── README.md
├── .git/                          # Git repository
├── .kiro/                         # Kiro specs
│   └── specs/
│       └── chunkflow-upload-sdk/
├── packages/                      # SDK packages
│   ├── protocol/                  # Protocol layer
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   ├── shared/                    # Shared utilities
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   ├── core/                      # Core upload engine
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   ├── upload-client-react/       # React adapter
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   ├── upload-client-vue/         # Vue adapter
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   ├── upload-component-react/    # React components
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   ├── upload-component-vue/      # Vue components
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   └── upload-server/             # Server SDK
│       ├── src/
│       │   └── index.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
├── apps/                          # Applications
│   ├── server/                    # Nest.js server
│   │   ├── src/
│   │   ├── docker-compose.yml
│   │   ├── Dockerfile
│   │   ├── init.sql
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   ├── playground/                # Demo application
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   └── website/                   # Documentation site
│       ├── docs/
│       │   ├── .vitepress/
│       │   │   └── config.ts
│       │   ├── guide/
│       │   │   └── index.md
│       │   └── index.md
│       ├── package.json
│       └── README.md
├── .gitignore                     # Git ignore rules
├── .npmrc                         # pnpm configuration
├── CONTRIBUTING.md                # Contributing guidelines
├── LICENSE                        # MIT License
├── package.json                   # Root package.json
├── pnpm-workspace.yaml            # pnpm workspace configuration
├── PROJECT_STRUCTURE.md           # This file
├── README.md                      # Project README
├── tsconfig.json                  # Root TypeScript configuration
├── turbo.json                     # Turbo configuration
└── vitest.config.ts               # Vitest configuration
```

## Package Dependencies

### Dependency Graph

```
@chunkflow/protocol (no dependencies)
    ↓
@chunkflow/shared (depends on protocol)
    ↓
@chunkflow/core (depends on protocol, shared)
    ↓
├── @chunkflow/upload-client-react (depends on core, protocol)
│       ↓
│   @chunkflow/upload-component-react (depends on upload-client-react, core)
│
├── @chunkflow/upload-client-vue (depends on core, protocol)
│       ↓
│   @chunkflow/upload-component-vue (depends on upload-client-vue, core)
│
└── @chunkflow/upload-server (depends on protocol)
```

## Technology Stack

### Build Tools

- **pnpm** - Package manager with workspace support
- **Turbo** - Monorepo build system for fast, incremental builds
- **tsdown** - TypeScript bundler for library packages

### Development Tools

- **TypeScript** - Type-safe JavaScript
- **Vitest** - Fast unit testing framework
- **fast-check** - Property-based testing library
- **oxlint** - Fast JavaScript/TypeScript linter
- **oxfmt** - Fast code formatter
- **lint-staged** - Run linters on git staged files
- **simple-git-hooks** - Git hooks management

### Version Management

- **changesets** - Version and changelog management

### Frontend Frameworks

- **React 18+** - For React packages and playground
- **Vue 3+** - For Vue packages
- **Vite** - Build tool for playground
- **VitePress** - Documentation site generator

### Backend Framework

- **Nest.js** - Server framework
- **Fastify** - Fast HTTP server
- **PostgreSQL** - Database

### Core Dependencies

- **mitt** - Event emitter (2KB)
- **p-limit** - Concurrency control
- **spark-md5** - MD5 hashing for file deduplication
- **jsonwebtoken** - JWT token generation

## Configuration Files

### Root Configuration

- `package.json` - Root package with scripts and dev dependencies
- `pnpm-workspace.yaml` - Workspace package definitions
- `turbo.json` - Turbo pipeline configuration
- `tsconfig.json` - Base TypeScript configuration
- `vitest.config.ts` - Vitest test configuration
- `.npmrc` - pnpm configuration

### Package Configuration

Each package has:

- `package.json` - Package metadata and dependencies
- `tsconfig.json` - TypeScript configuration extending root
- `README.md` - Package documentation

### Build Configuration

- **tsdown** is used for building library packages (ESM format)
- **tsc** is used for building the server application
- **Vite** is used for building the playground and website

## Scripts

### Root Scripts

- `pnpm build` - Build all packages and apps
- `pnpm dev` - Run all packages in watch mode
- `pnpm test` - Run all tests
- `pnpm lint` - Lint all code
- `pnpm format` - Format all code
- `pnpm typecheck` - Type check all packages
- `pnpm clean` - Clean all build outputs
- `pnpm changeset` - Create a changeset
- `pnpm version` - Version packages
- `pnpm release` - Build and publish packages

### Package Scripts

Each package has:

- `build` - Build the package
- `dev` - Build in watch mode
- `test` - Run tests
- `test:watch` - Run tests in watch mode
- `typecheck` - Type check
- `clean` - Clean build output

## Next Steps

After completing Task 1 (Project Initialization), the next tasks will implement:

1. **Task 2** - Protocol layer with type definitions
2. **Task 3** - Shared layer with utilities
3. **Task 4** - Core layer with upload engine
4. **Task 5-7** - Upload task and manager implementation
5. **Task 8-9** - Client adapters (React and Vue)
6. **Task 10-11** - UI components
7. **Task 12-17** - Server implementation
8. **Task 18-19** - Playground and documentation
9. **Task 20-21** - Release preparation and final verification

## Development Workflow

1. Install dependencies: `pnpm install`
2. Build all packages: `pnpm build`
3. Run tests: `pnpm test`
4. Start development: `pnpm dev`
5. Lint code: `pnpm lint`
6. Format code: `pnpm format`

## Testing Strategy

The project uses a dual testing approach:

1. **Unit Tests** - Test specific examples and edge cases
   - Located in `*.test.ts` files
   - Run with Vitest

2. **Property-Based Tests** - Test universal properties
   - Use fast-check library
   - Run at least 100 iterations
   - Validate correctness properties from design document

## Version Management

The project uses changesets for version management:

1. Create a changeset: `pnpm changeset`
2. Version packages: `pnpm version`
3. Publish packages: `pnpm release`

Each package can be versioned and published independently.

## Docker Support

The server application includes Docker support:

- `docker-compose.yml` - Defines PostgreSQL and server services
- `Dockerfile` - Multi-stage build for production
- `init.sql` - Database initialization script

Start with: `docker-compose up -d`

## Documentation

Documentation is built with VitePress and includes:

- Getting started guide
- API reference
- Usage examples
- Best practices

Build documentation: `cd apps/website && pnpm build`

## License

MIT License - See LICENSE file for details
