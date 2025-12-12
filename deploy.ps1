# PowerShell Deployment Script for TarkovNextQuest
# This script pulls the latest Docker image and restarts the container

$ErrorActionPreference = "Stop"

Write-Host "🚀 Deploying TarkovNextQuest..." -ForegroundColor Green

# Configuration
$CONTAINER_NAME = "tarkov-quest-app"
$IMAGE_NAME = "ghcr.io/hamster2k/tarkovnextquest:latest"
$PORT = if ($env:PORT) { $env:PORT } else { "80" }

# Check if Docker is installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed. Please install Docker first." -ForegroundColor Red
    exit 1
}

# Pull the latest image
Write-Host "📦 Pulling latest image..." -ForegroundColor Cyan
docker pull $IMAGE_NAME

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to pull image. Make sure the image is public or you're logged in." -ForegroundColor Red
    Write-Host "To login: docker login ghcr.io -u Hamster2k" -ForegroundColor Yellow
    exit 1
}

# Stop and remove existing container if it exists
$existingContainer = docker ps -a --filter "name=$CONTAINER_NAME" --format "{{.Names}}"
if ($existingContainer -eq $CONTAINER_NAME) {
    Write-Host "🛑 Stopping existing container..." -ForegroundColor Yellow
    docker stop $CONTAINER_NAME
    Write-Host "🗑️  Removing old container..." -ForegroundColor Yellow
    docker rm $CONTAINER_NAME
}

# Run the new container
Write-Host "▶️  Starting new container..." -ForegroundColor Cyan
docker run -d `
    --name $CONTAINER_NAME `
    -p "${PORT}:80" `
    --restart unless-stopped `
    $IMAGE_NAME

# Check if container is running
$runningContainer = docker ps --filter "name=$CONTAINER_NAME" --format "{{.Names}}"
if ($runningContainer -eq $CONTAINER_NAME) {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host "🌐 Application is running at http://localhost:$PORT" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Container status:" -ForegroundColor Cyan
    docker ps --filter "name=$CONTAINER_NAME"
} else {
    Write-Host "❌ Deployment failed. Check container logs:" -ForegroundColor Red
    docker logs $CONTAINER_NAME
    exit 1
}

# Show logs
Write-Host ""
Write-Host "📝 Recent logs:" -ForegroundColor Cyan
docker logs --tail 20 $CONTAINER_NAME

Write-Host ""
Write-Host "🔍 To view logs: docker logs -f $CONTAINER_NAME" -ForegroundColor Yellow
Write-Host "🛑 To stop: docker stop $CONTAINER_NAME" -ForegroundColor Yellow
Write-Host "🔄 To restart: docker restart $CONTAINER_NAME" -ForegroundColor Yellow
