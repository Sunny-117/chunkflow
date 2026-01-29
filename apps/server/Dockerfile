FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

FROM base AS builder

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/server ./apps/server

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build packages
RUN pnpm --filter @chunkflow/protocol build
RUN pnpm --filter @chunkflow/upload-server build
RUN pnpm --filter @chunkflow/server-app build

FROM base AS runner

WORKDIR /app

# Copy built files
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Create storage directory
RUN mkdir -p /app/storage

EXPOSE 3001

CMD ["node", "dist/main.js"]
