# Quick Server Deployment with Docker Compose

The easiest way to deploy on your server using docker-compose.

## 📋 Prerequisites

- Docker and Docker Compose installed on your server
- SSH access to your server

## 🚀 Deployment Steps

### 1. Copy the compose file to your server

```bash
# SSH into your server
ssh user@your-server

# Create a directory for the app
mkdir -p /opt/tarkov-quest
cd /opt/tarkov-quest

# Download the docker-compose file
curl -O https://raw.githubusercontent.com/Hamster2k/TarkovNextQuest/main/docker-compose.production.yml

# Or use wget
wget https://raw.githubusercontent.com/Hamster2k/TarkovNextQuest/main/docker-compose.production.yml
```

### 2. Start the application

```bash
# Pull the latest image and start
docker-compose -f docker-compose.production.yml up -d
```

That's it! Your app is now running at `http://your-server-ip`

## 🔄 Updating the Application

When you push new code to GitHub, a new Docker image is built automatically. To update your server:

```bash
cd /opt/tarkov-quest

# Pull the latest image and restart
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d
```

Or in one command:
```bash
docker-compose -f docker-compose.production.yml up -d --pull always
```

## 📊 Managing the Application

### View logs
```bash
docker-compose -f docker-compose.production.yml logs -f
```

### Stop the application
```bash
docker-compose -f docker-compose.production.yml down
```

### Restart the application
```bash
docker-compose -f docker-compose.production.yml restart
```

### Check status
```bash
docker-compose -f docker-compose.production.yml ps
```

## ⚙️ Configuration

### Change the port

Edit `docker-compose.production.yml`:

```yaml
ports:
  - "8080:80"  # Run on port 8080 instead
```

Then restart:
```bash
docker-compose -f docker-compose.production.yml up -d
```

### Add environment variables

```yaml
environment:
  - NODE_ENV=production
  - CUSTOM_VAR=value
```

## 🌐 Setup with Reverse Proxy

### Using nginx

1. **Install nginx:**
   ```bash
   sudo apt install nginx
   ```

2. **Change docker port to 3000:**
   ```yaml
   ports:
     - "3000:80"
   ```

3. **Create nginx config:** `/etc/nginx/sites-available/tarkov-quest`
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
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

4. **Enable and get HTTPS:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/tarkov-quest /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   sudo certbot --nginx -d your-domain.com
   ```

## 🔄 Auto-updates with Watchtower

Add Watchtower to automatically update your container:

Create a new file `docker-compose.full.yml`:

```yaml
version: '3.8'

services:
  tarkov-quest-app:
    image: ghcr.io/hamster2k/tarkovnextquest:latest
    container_name: tarkov-quest-app
    ports:
      - "80:80"
    restart: unless-stopped
    pull_policy: always
    environment:
      - NODE_ENV=production
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  watchtower:
    image: containrrr/watchtower
    container_name: watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_POLL_INTERVAL=300  # Check every 5 minutes
      - WATCHTOWER_CLEANUP=true       # Remove old images
    restart: unless-stopped
```

Then deploy:
```bash
docker-compose -f docker-compose.full.yml up -d
```

Now your app will automatically update when you push to GitHub!

## 🔐 If the Image is Private

If you haven't made the GitHub Container Registry package public, login first:

```bash
# Create a Personal Access Token with read:packages permission
# Go to: Settings → Developer Settings → Personal Access Tokens

# Login
echo YOUR_PAT_TOKEN | docker login ghcr.io -u Hamster2k --password-stdin

# Then deploy
docker-compose -f docker-compose.production.yml up -d
```

## 🎯 Quick Commands Reference

```bash
# Deploy
docker-compose -f docker-compose.production.yml up -d

# Update
docker-compose -f docker-compose.production.yml pull && \
docker-compose -f docker-compose.production.yml up -d

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Stop
docker-compose -f docker-compose.production.yml down

# Restart
docker-compose -f docker-compose.production.yml restart

# Status
docker-compose -f docker-compose.production.yml ps
```

## 🔧 Troubleshooting

### Can't pull image
```bash
# Make the GitHub package public, or login:
docker login ghcr.io -u Hamster2k
```

### Port already in use
```bash
# Change the port in docker-compose.production.yml
ports:
  - "8080:80"
```

### Container won't start
```bash
# Check logs
docker-compose -f docker-compose.production.yml logs

# Check if port is available
sudo netstat -tulpn | grep :80
```

---

**Your application will be live at:** `http://your-server-ip` or `https://your-domain.com`
