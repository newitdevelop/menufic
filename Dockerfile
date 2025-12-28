FROM node:22.2.0

# Install system dependencies required for sharp and jq for audit script
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    jq \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma

# Configure npm for better network handling and install dependencies
RUN npm config set fetch-timeout 60000 && \
    npm config set fetch-retries 3 && \
    npm install --legacy-peer-deps

# Copy audit scripts
COPY scripts/check-audit-needed.sh /tmp/check-audit-needed.sh
COPY scripts/audit-fix-safe.sh /tmp/audit-fix-safe.sh
RUN chmod +x /tmp/check-audit-needed.sh /tmp/audit-fix-safe.sh

# Apply safe security patches conditionally with verbose output
# This automatically checks if safe patches are available before running
# Set SKIP_AUDIT_FIX=1 as build arg to force skip this step
ARG SKIP_AUDIT_FIX=0
RUN if [ "$SKIP_AUDIT_FIX" = "1" ]; then \
        echo "⏭️  Skipping npm audit fix (SKIP_AUDIT_FIX=1)"; \
    elif /tmp/check-audit-needed.sh; then \
        echo ""; \
        echo "🔧 Running security audit..."; \
        echo ""; \
        /tmp/audit-fix-safe.sh || echo "⚠️  Audit fix completed with warnings (non-critical)"; \
    else \
        echo "⏭️  Skipping npm audit fix (no safe patches available)"; \
    fi

# Add build argument to bust cache for source copy
ARG CACHEBUST=1
RUN echo "Cache bust: $CACHEBUST"
COPY . .

# Remove any cached build artifacts and verify structure
RUN rm -rf .next && \
    echo "Verifying source structure..." && \
    ls -la src/pages/ && \
    test -d src/pages/venue || (echo "ERROR: venue folder not found!" && exit 1)

# Regenerate Prisma client with the updated schema
RUN npx prisma generate --schema=./prisma/schema.prisma

# Build the app
RUN npm run build

# Backup en.json for restoration after volume mount
RUN cp src/lang/en.json /tmp/en.json.backup

# Copy and make the entrypoint script executable
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
