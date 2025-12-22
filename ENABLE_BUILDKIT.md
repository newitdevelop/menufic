# Enable Docker BuildKit Globally

## Method 1: Environment Variable (Temporary - Current Session Only)
```bash
export DOCKER_BUILDKIT=1
```

## Method 2: Add to Shell Profile (Permanent - Recommended)

Add this line to your `~/.bashrc` (or `~/.profile` or `~/.zshrc`):

```bash
echo 'export DOCKER_BUILDKIT=1' >> ~/.bashrc
source ~/.bashrc
```

## Method 3: Docker Daemon Configuration (System-wide)

Create/edit `/etc/docker/daemon.json`:

```bash
sudo nano /etc/docker/daemon.json
```

Add:
```json
{
  "features": {
    "buildkit": true
  }
}
```

Then restart Docker:
```bash
sudo systemctl restart docker
```

## Verify BuildKit is Enabled

After enabling, run:
```bash
docker build --help | grep buildkit
```

Or just run your build command - you'll see different output format if BuildKit is active.

## Your Command

Once BuildKit is enabled globally (via Method 2 or 3), your existing command will automatically use it:

```bash
docker-compose down && git pull origin main && docker build --build-arg CACHEBUST=$(date +%s) -t ghcr.io/newitdevelop/menufic:latest . && docker-compose up -d
```

No changes needed to the command itself!
