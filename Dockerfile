FROM node:22.2.0

# Install system dependencies for sharp
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma

# Skip postinstall during npm install to avoid prisma generate issues
RUN npm install --ignore-scripts

COPY . .

# Now run the scripts manually with proper environment
RUN npx patch-package
RUN npx prisma generate --schema=./prisma/schema.prisma

# Build the app
RUN npm run build

# Copy and make the entrypoint script executable
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
