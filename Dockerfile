# syntax=docker/dockerfile:1

# ── Base: Node 22 Alpine with build deps for better-sqlite3 ────────────────
FROM node:22-alpine AS base
# better-sqlite3 requires python + C++ toolchain on Alpine
RUN apk add --no-cache python3 make g++ libc6-compat
WORKDIR /app

# ── Dependencies ───────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ── Build ──────────────────────────────────────────────────────────────────
FROM deps AS build
COPY . .
RUN npm run build

# ── Production ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS production
RUN apk add --no-cache python3 make g++ libc6-compat tini
WORKDIR /app
ENV NODE_ENV=production

# Copy built app
COPY --from=build /app/build ./

# Re-install production deps only (needs toolchain for better-sqlite3)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Ensure runtime dirs exist and are writable by `node` user
RUN mkdir -p tmp storage/uploads && chown -R node:node /app

USER node
EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=20s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3333/refunds || exit 1

# Use tini as init and auto-run migrations on start
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "node ace.js migration:run --force && node bin/server.js"]

# ── Development (HMR) ──────────────────────────────────────────────────────
FROM base AS development
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 3333
CMD ["npm", "run", "dev", "--", "--host=0.0.0.0"]
