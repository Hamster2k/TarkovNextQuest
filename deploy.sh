#!/bin/bash

# Deployment script for TarkovNextQuest
# This script pulls the latest Docker image and restarts the container

set -e

echo "🚀 Deploying TarkovNextQuest..."

# Configuration
CONTAINER_NAME="tarkov-quest-app"
IMAGE_NAME="ghcr.io/hamster2k/tarkovnextquest:latest"
PORT="${PORT:-80}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Login to GitHub Container Registry (if not already logged in)
echo "🔐 Logging in to GitHub Container Registry..."
echo "Please enter your GitHub Personal Access Token (with read:packages permission):"
read -s GITHUB_TOKEN
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USER --password-stdin

# Pull the latest image
echo "📦 Pulling latest image..."
docker pull $IMAGE_NAME

# Stop and remove existing container if it exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "🛑 Stopping existing container..."
    docker stop $CONTAINER_NAME
    echo "🗑️  Removing old container..."
    docker rm $CONTAINER_NAME
fi

# Run the new container
echo "▶️  Starting new container..."
docker run -d \
    --name $CONTAINER_NAME \
    -p $PORT:80 \
    --restart unless-stopped \
    $IMAGE_NAME

# Check if container is running
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "✅ Deployment successful!"
    echo "🌐 Application is running at http://localhost:$PORT"
    echo ""
    echo "📊 Container status:"
    docker ps --filter "name=$CONTAINER_NAME"
else
    echo "❌ Deployment failed. Check container logs:"
    docker logs $CONTAINER_NAME
    exit 1
fi

# Show logs
echo ""
echo "📝 Recent logs:"
docker logs --tail 20 $CONTAINER_NAME

echo ""
echo "🔍 To view logs: docker logs -f $CONTAINER_NAME"
echo "🛑 To stop: docker stop $CONTAINER_NAME"
echo "🔄 To restart: docker restart $CONTAINER_NAME"
