# Server Deployment Guide

This guide covers how to deploy your TarkovNextQuest application to your own server using the automated CI/CD pipeline.

## 🏗️ How It Works

1. **Push to GitHub** → GitHub Actions automatically builds a Docker image
2. **Image is published** → Stored in GitHub Container Registry (ghcr.io)
3. **Pull on your server** → Download and run the latest version

## 📋 Prerequisites

### On Your Server

- Docker installed ([Get Docker](https://docs.docker.com/engine/install/))
- Open port 80 (or your chosen port)
- SSH access to your server

## 🚀 Deployment Methods

### Method 1: Automated Script (Recommended)

**On Windows Server:**
```powershell
# Download the deployment script
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/Hamster2k/TarkovNextQuest/main/deploy.ps1" -OutFile "deploy.ps1"

# Run the deployment
.\deploy.ps1
```

**On Linux Server:**
```bash
# Download the deployment script
curl -O https://raw.githubusercontent.com/Hamster2k/TarkovNextQuest/main/deploy.sh
chmod +x deploy.sh

# Run the deployment
./deploy.sh
```

### Method 2: Docker Compose

1. **Copy docker-compose.production.yml to your server:**
   ```bash
   scp docker-compose.production.yml user@your-server:/opt/tarkov-quest/
   ```

2. **On your server, run:**
   ```bash
   cd /opt/tarkov-quest
   docker-compose -f docker-compose.production.yml pull
   docker-compose -f docker-compose.production.yml up -d
   ```

### Method 3: Manual Docker Commands

```bash
# Pull the latest image
docker pull ghcr.io/hamster2k/tarkovnextquest:latest

# Stop and remove old container (if exists)
docker stop tarkov-quest-app 2>/dev/null || true
docker rm tarkov-quest-app 2>/dev/null || true

# Run the new container
docker run -d \
  --name tarkov-quest-app \
  -p 80:80 \
  --restart unless-stopped \
  ghcr.io/hamster2k/tarkovnextquest:latest

# View logs
docker logs -f tarkov-quest-app
```

## 🔐 Authentication

The GitHub Container Registry package is currently **private** by default. You have two options:

### Option 1: Make the Package Public (Easiest)

1. Go to https://github.com/users/Hamster2k/packages/container/tarkovnextquest
2. Click "Package settings"
3. Scroll to "Danger Zone"
4. Click "Change visibility" → "Public"

Now anyone can pull the image without authentication!

### Option 2: Use Authentication

If you keep it private, you'll need to login on your server:

```bash
# Create a Personal Access Token (PAT) with read:packages permission
# Go to: Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
# Grant: read:packages

# Login to GitHub Container Registry
echo YOUR_PAT_TOKEN | docker login ghcr.io -u Hamster2k --password-stdin
```

## 🔄 Updating Your Deployment

Every time you push to the `main` branch, a new Docker image is automatically built.

**To update your server:**

```bash
# Pull the latest version
docker pull ghcr.io/hamster2k/tarkovnextquest:latest

# Restart the container
docker restart tarkov-quest-app

# Or use the deployment script
./deploy.sh  # Linux
.\deploy.ps1 # Windows
```

## 🌐 Custom Domain & HTTPS

### Using nginx Reverse Proxy

1. **Install nginx on your server:**
   ```bash
   sudo apt install nginx certbot python3-certbot-nginx
   ```

2. **Create nginx config:** `/etc/nginx/sites-available/tarkov-quest`
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Enable the site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/tarkov-quest /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Get SSL certificate:**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

5. **Update your container to use port 3000:**
   ```bash
   docker run -d \
     --name tarkov-quest-app \
     -p 3000:80 \
     --restart unless-stopped \
     ghcr.io/hamster2k/tarkovnextquest:latest
   ```

### Using Caddy (Easier HTTPS)

1. **Install Caddy:**
   ```bash
   sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
   sudo apt update
   sudo apt install caddy
   ```

2. **Create Caddyfile:** `/etc/caddy/Caddyfile`
   ```
   your-domain.com {
       reverse_proxy localhost:3000
   }
   ```

3. **Reload Caddy:**
   ```bash
   sudo systemctl reload caddy
   ```

Caddy automatically handles HTTPS certificates!

## 📊 Monitoring

### View Logs
```bash
docker logs -f tarkov-quest-app
```

### Check Status
```bash
docker ps | grep tarkov-quest-app
```

### Resource Usage
```bash
docker stats tarkov-quest-app
```

## 🔧 Troubleshooting

### Container won't start
```bash
docker logs tarkov-quest-app
```

### Port already in use
```bash
# Use a different port
docker run -d -p 8080:80 --name tarkov-quest-app ghcr.io/hamster2k/tarkovnextquest:latest
```

### Image pull fails
- Make sure the package is public, or
- Login with: `docker login ghcr.io -u Hamster2k`

### Can't access from outside
- Check firewall: `sudo ufw allow 80/tcp`
- Check if container is running: `docker ps`

## 🔄 Automatic Updates with Watchtower

Install Watchtower to automatically update your container when new images are pushed:

```bash
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --interval 300 \
  tarkov-quest-app
```

Now your container will automatically update every 5 minutes if a new image is available!

## 🏷️ Using Specific Versions

Instead of `:latest`, you can pin to specific versions:

```bash
# Use a specific commit SHA
docker pull ghcr.io/hamster2k/tarkovnextquest:main-abc1234

# Use a version tag (if you create git tags)
docker pull ghcr.io/hamster2k/tarkovnextquest:v1.0.0
```

## 📦 Docker Compose Example with Watchtower

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    image: ghcr.io/hamster2k/tarkovnextquest:latest
    container_name: tarkov-quest-app
    ports:
      - "80:80"
    restart: unless-stopped
    
  watchtower:
    image: containrrr/watchtower
    container_name: watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 300 tarkov-quest-app
    restart: unless-stopped
```

Then run: `docker-compose up -d`

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| Deploy | `./deploy.sh` or `.\deploy.ps1` |
| Update | `docker pull ghcr.io/hamster2k/tarkovnextquest:latest && docker restart tarkov-quest-app` |
| View logs | `docker logs -f tarkov-quest-app` |
| Stop | `docker stop tarkov-quest-app` |
| Start | `docker start tarkov-quest-app` |
| Restart | `docker restart tarkov-quest-app` |
| Remove | `docker rm -f tarkov-quest-app` |

---

**Your application will be live at:** `http://your-server-ip`
