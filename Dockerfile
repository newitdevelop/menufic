FROM node:22.2.0
WORKDIR /app
COPY package*.json ./
RUN npm i
COPY . .

# Run patch-package
RUN npx patch-package

# Create a minimal .env for build-time (DATABASE_URL not needed for generate)
RUN echo "DATABASE_URL=postgresql://placeholder:placeholder@placeholder:5432/placeholder" > .env

# Generate Prisma Client with explicit schema path
RUN npx prisma generate --schema=./prisma/schema.prisma

# Remove the placeholder .env (real one will be mounted at runtime)
RUN rm .env

RUN npm run build

# Copy and make the entrypoint script executable
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
