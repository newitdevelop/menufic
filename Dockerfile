# ===== BUILDER STAGE =====
FROM node:22.2.0 AS builder

# Install system dependencies required for sharp and jq for audit script
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    DEBIAN_FRONTEND=noninteractive apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
    python3 \
    make \
    g++ \
    jq \
    pkg-config \
    libvips-dev \
    libglib2.0-dev

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma

# Configure npm for better network handling and install dependencies
RUN --mount=type=cache,target=/root/.npm \
    npm config set fetch-timeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set progress false && \
    npm config set loglevel error && \
    npm ci --legacy-peer-deps --prefer-offline

# Copy audit scripts and run conditionally (faster feedback)
ARG SKIP_AUDIT_FIX=0
COPY scripts/check-audit-needed.sh scripts/audit-fix-safe.sh /tmp/
RUN --mount=type=cache,target=/root/.npm \
    chmod +x /tmp/*.sh && \
    if [ "$SKIP_AUDIT_FIX" = "1" ]; then \
        echo "⏭️  Skipping audit"; \
    elif /tmp/check-audit-needed.sh; then \
        /tmp/audit-fix-safe.sh || true; \
    fi

# Copy source files
COPY . .

# Update browserslist database and generate Prisma client and build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx update-browserslist-db@latest --legacy-peer-deps || true && \
    npx prisma generate && \
    NODE_OPTIONS="--max-old-space-size=4096" npm run build

# ===== PRODUCTION STAGE =====
FROM node:22.2.0-slim AS runner

# Install runtime dependencies for Prisma and Sharp
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    DEBIAN_FRONTEND=noninteractive apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
    openssl \
    libvips42

WORKDIR /app

# Copy only necessary files from builder
# Copy in order of likelihood to change (least to most)
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/docker-entrypoint.sh /usr/local/bin/
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/src/lang/en.json /tmp/en.json.backup
# Large directories last
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next

# Make entrypoint executable
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set NODE_ENV to production
ENV NODE_ENV=production

EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
