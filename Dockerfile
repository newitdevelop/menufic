FROM node:22.2.0

# Install system dependencies required for sharp
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma

# Configure npm for better network handling and install dependencies
RUN npm config set fetch-timeout 60000 && \
    npm config set fetch-retries 3 && \
    npm install

# Fix non-breaking security vulnerabilities automatically
# Note: This only applies safe patches (no major version updates)
# Breaking changes like Next.js 13→16, imagekit 4→6, sharp 0.31→0.34 are SKIPPED
RUN npm audit fix || true

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
