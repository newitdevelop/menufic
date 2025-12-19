# Docker Deployment Guide

This guide covers building, tagging, and pushing the Menufic Docker image to your private registry.

## Quick Start - Local Development

To build and run locally with Docker Compose:

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f menufic

# Stop services
docker-compose down
```

## Building the Docker Image

### Option 1: Build with Docker Compose (Recommended for local development)

```bash
docker-compose build
```

### Option 2: Build directly with Docker

```bash
docker build -t menufic:latest .
```

## Pushing to Your Private Registry

### Docker Hub

1. **Login to Docker Hub**:
   ```bash
   docker login
   ```

2. **Tag the image**:
   ```bash
   docker tag menufic:latest <your-dockerhub-username>/menufic:latest
   docker tag menufic:latest <your-dockerhub-username>/menufic:1.0.0
   ```

3. **Push to Docker Hub**:
   ```bash
   docker push <your-dockerhub-username>/menufic:latest
   docker push <your-dockerhub-username>/menufic:1.0.0
   ```

4. **Update docker-compose.yml** to pull from your registry:
   ```yaml
   menufic:
     image: <your-dockerhub-username>/menufic:latest
     # Remove the build section if you want to pull only
   ```

### Azure Container Registry (ACR)

1. **Login to ACR**:
   ```bash
   az acr login --name <your-registry-name>
   # Or using docker login
   docker login <your-registry-name>.azurecr.io
   ```

2. **Tag the image**:
   ```bash
   docker tag menufic:latest <your-registry-name>.azurecr.io/menufic:latest
   docker tag menufic:latest <your-registry-name>.azurecr.io/menufic:1.0.0
   ```

3. **Push to ACR**:
   ```bash
   docker push <your-registry-name>.azurecr.io/menufic:latest
   docker push <your-registry-name>.azurecr.io/menufic:1.0.0
   ```

4. **Update docker-compose.yml**:
   ```yaml
   menufic:
     image: <your-registry-name>.azurecr.io/menufic:latest
   ```

### GitHub Container Registry (ghcr.io)

1. **Create a Personal Access Token** (if you don't have one):
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Create token with `write:packages` scope

2. **Login to GHCR**:
   ```bash
   echo $GITHUB_TOKEN | docker login ghcr.io -u <your-github-username> --password-stdin
   ```

3. **Tag the image**:
   ```bash
   docker tag menufic:latest ghcr.io/<your-github-username>/menufic:latest
   docker tag menufic:latest ghcr.io/<your-github-username>/menufic:1.0.0
   ```

4. **Push to GHCR**:
   ```bash
   docker push ghcr.io/<your-github-username>/menufic:latest
   docker push ghcr.io/<your-github-username>/menufic:1.0.0
   ```

5. **Make the package public** (optional):
   - Go to the package settings on GitHub
   - Change visibility to public

6. **Update docker-compose.yml**:
   ```yaml
   menufic:
     image: ghcr.io/<your-github-username>/menufic:latest
   ```

### Other Private Registries

1. **Login to your registry**:
   ```bash
   docker login <your-registry-url>
   ```

2. **Tag and push**:
   ```bash
   docker tag menufic:latest <your-registry-url>/menufic:latest
   docker push <your-registry-url>/menufic:latest
   ```

## Build Script

Here's a helper script to automate the build and push process:

```bash
#!/bin/bash
# build-and-push.sh

# Configuration
REGISTRY_URL="your-registry-url"  # e.g., yourusername (Docker Hub), yourregistry.azurecr.io (ACR), ghcr.io/yourusername (GHCR)
IMAGE_NAME="menufic"
VERSION=${1:-latest}  # Use first argument as version, default to 'latest'

# Build the image
echo "Building Docker image..."
docker build -t ${IMAGE_NAME}:${VERSION} .

# Tag for registry
echo "Tagging image for registry..."
docker tag ${IMAGE_NAME}:${VERSION} ${REGISTRY_URL}/${IMAGE_NAME}:${VERSION}

if [ "$VERSION" != "latest" ]; then
    docker tag ${IMAGE_NAME}:${VERSION} ${REGISTRY_URL}/${IMAGE_NAME}:latest
fi

# Push to registry
echo "Pushing to registry..."
docker push ${REGISTRY_URL}/${IMAGE_NAME}:${VERSION}

if [ "$VERSION" != "latest" ]; then
    docker push ${REGISTRY_URL}/${IMAGE_NAME}:latest
fi

echo "Done! Image pushed to ${REGISTRY_URL}/${IMAGE_NAME}:${VERSION}"
```

Make the script executable and use it:
```bash
chmod +x build-and-push.sh
./build-and-push.sh 1.0.0
```

## Multi-Architecture Builds (ARM64 + AMD64)

If you need to support both ARM64 and AMD64 architectures:

```bash
# Create a new builder
docker buildx create --name mybuilder --use

# Build for multiple platforms and push
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t <your-registry>/menufic:latest \
  --push \
  .
```

## Environment Variables for Docker Build

If you need to pass build-time arguments:

```dockerfile
# Add to Dockerfile
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
```

```bash
# Build with custom arguments
docker build --build-arg NODE_ENV=production -t menufic:latest .
```

## Production Deployment

### Using Docker Compose in Production

1. **Create a production docker-compose.yml**:
   ```yaml
   version: "3.6"

   services:
     menufic:
       image: <your-registry>/menufic:latest
       container_name: menufic
       env_file:
         - .env.production
       expose:
         - 3000
       ports:
         - 3000:3000
       restart: unless-stopped
       depends_on:
         - mariadb

     mariadb:
       image: lscr.io/linuxserver/mariadb:latest
       container_name: menufic-db
       env_file:
         - .env.production
       expose:
         - 3306
       volumes:
         - ./data/mariadb:/config
       restart: unless-stopped
   ```

2. **Deploy**:
   ```bash
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Using Docker without Compose

```bash
# Pull the image
docker pull <your-registry>/menufic:latest

# Run the container
docker run -d \
  --name menufic \
  --env-file .env.production \
  -p 3000:3000 \
  --restart unless-stopped \
  <your-registry>/menufic:latest
```

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/docker-build.yml`:

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: <your-dockerhub-username>/menufic

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

## Troubleshooting

### Build fails during npm install
- Check that your `.dockerignore` includes `node_modules`
- Ensure you have enough disk space

### Build fails on "npm run build"
- Verify all required environment variables are set
- Check that the `.env` file exists or use build args
- For Azure AD: Ensure credentials are optional (already configured)

### Image is too large
- Use multi-stage builds (future optimization)
- Clean npm cache in Dockerfile
- Use `.dockerignore` to exclude unnecessary files

### Cannot push to registry
- Verify you're logged in: `docker login <registry-url>`
- Check registry permissions
- Ensure the image is properly tagged

## Image Size Optimization (Future)

Current Dockerfile uses a single-stage build. For optimization, consider:

```dockerfile
# Multi-stage build example
FROM node:22.2.0 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:22.2.0-slim
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

## Support

For issues with:
- **Docker builds**: Check the Dockerfile and build logs
- **Registry access**: Verify credentials and permissions
- **Azure AD**: See AZURE_SSO_SETUP.md
