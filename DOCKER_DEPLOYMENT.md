# Docker Deployment Guide

This guide explains how to deploy the Tarkov Next Quest application using Docker.

## Prerequisites

- Docker installed on your system ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose (usually included with Docker Desktop)

## Quick Start

### Option 1: Using Docker Compose (Recommended)

1. **Build and start the container:**
   ```bash
   docker-compose up -d
   ```

2. **Access the application:**
   Open your browser and navigate to `http://localhost:3000`

3. **Stop the container:**
   ```bash
   docker-compose down
   ```

### Option 2: Using Docker CLI

1. **Build the image:**
   ```bash
   docker build -t tarkov-quest-app .
   ```

2. **Run the container:**
   ```bash
   docker run -d -p 3000:80 --name tarkov-quest-app tarkov-quest-app
   ```

3. **Access the application:**
   Open your browser and navigate to `http://localhost:3000`

4. **Stop the container:**
   ```bash
   docker stop tarkov-quest-app
   docker rm tarkov-quest-app
   ```

## Configuration

### Changing the Port

To run the app on a different port (e.g., 8080):

**Docker Compose:**
Edit `docker-compose.yml` and change the ports mapping:
```yaml
ports:
  - "8080:80"  # Change 3000 to your desired port
```

**Docker CLI:**
```bash
docker run -d -p 8080:80 --name tarkov-quest-app tarkov-quest-app
```

### View Logs

**Docker Compose:**
```bash
docker-compose logs -f
```

**Docker CLI:**
```bash
docker logs -f tarkov-quest-app
```

## Production Deployment

### Deploy to a Cloud Provider

#### Docker Hub (for sharing the image)

1. **Tag the image:**
   ```bash
   docker tag tarkov-quest-app yourusername/tarkov-quest-app:latest
   ```

2. **Push to Docker Hub:**
   ```bash
   docker login
   docker push yourusername/tarkov-quest-app:latest
   ```

3. **Pull and run on any server:**
   ```bash
   docker pull yourusername/tarkov-quest-app:latest
   docker run -d -p 80:80 yourusername/tarkov-quest-app:latest
   ```

#### Deploy to Cloud Platforms

- **AWS ECS/Fargate:** Use the Dockerfile with AWS ECS task definitions
- **Google Cloud Run:** Deploy with `gcloud run deploy`
- **Azure Container Instances:** Use `az container create`
- **DigitalOcean App Platform:** Connect your Git repo with the Dockerfile
- **Heroku:** Use container registry with `heroku container:push`

### Environment Variables

If you need to add environment variables, modify `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - API_URL=https://api.tarkov.dev/graphql
```

## Architecture

The Docker setup uses a **multi-stage build**:

1. **Stage 1 (Builder):** 
   - Uses Node.js to install dependencies and build the Vue app
   - Compiles TypeScript and bundles with Vite
   - Outputs static files to `/dist`

2. **Stage 2 (Production):**
   - Uses lightweight nginx:alpine image
   - Serves static files from the builder stage
   - Configured with optimized nginx settings

**Benefits:**
- Small final image size (~25MB vs ~200MB+ with Node)
- Fast startup time
- Production-ready nginx configuration
- Automatic gzip compression
- Proper caching headers
- SPA routing support

## Troubleshooting

### Container won't start
```bash
docker-compose logs
```

### Port already in use
Change the port in `docker-compose.yml` or stop the conflicting service.

### Rebuild after code changes
```bash
docker-compose up -d --build
```

### Clear everything and start fresh
```bash
docker-compose down -v
docker-compose up -d --build
```

## Performance Optimization

The nginx configuration includes:
- ✅ Gzip compression for text assets
- ✅ 1-year caching for static assets (JS, CSS, images)
- ✅ No caching for index.html (ensures updates are seen)
- ✅ Security headers
- ✅ SPA routing support (all routes serve index.html)

## Development vs Production

For **development**, continue using:
```bash
npm run dev
```

For **production deployment**, use Docker:
```bash
docker-compose up -d
```

The Docker container serves the optimized, minified production build.
