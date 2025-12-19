# Port Conflict Fix Guide

## Problem

You're seeing this error:
```
Error response from daemon: failed to set up container networking:
driver failed programming external connectivity on endpoint menufic-db:
Bind for 0.0.0.0:5432 failed: port is already allocated
```

This means port 5432 (PostgreSQL's default port) is already in use on your system.

## Quick Fix - Already Implemented ✅

The docker-compose.yml has been updated to use **port 5433** instead of 5432 by default. This avoids conflicts with existing PostgreSQL installations.

### Steps to Apply the Fix:

1. **Update your .env file** (if it exists):
   ```bash
   # Change this line:
   DATABASE_URL=postgresql://menufic:menufic_password@localhost:5432/menufic_db

   # To this:
   DATABASE_URL=postgresql://menufic:menufic_password@localhost:5433/menufic_db
   ```

2. **Stop any running containers**:
   ```bash
   docker-compose down
   ```

3. **Start the services** (they'll now use port 5433):
   ```bash
   docker-compose up -d
   ```

## Alternative Solutions

If you still have issues or want to customize the port:

### Option 1: Use a Custom Port

You can set a custom port in your `.env` file:

```bash
# In your .env file
POSTGRES_PORT=5434  # Or any available port
DATABASE_URL=postgresql://menufic:menufic_password@localhost:5434/menufic_db
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```

### Option 2: Stop the Existing PostgreSQL Service

If you don't need the existing PostgreSQL instance:

**On Linux:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Stop it
sudo systemctl stop postgresql

# Disable auto-start (optional)
sudo systemctl disable postgresql
```

**On macOS:**
```bash
# If installed via Homebrew
brew services stop postgresql

# Or if running manually
pg_ctl stop -D /usr/local/var/postgres
```

**On Windows:**
```powershell
# Open Services (services.msc)
# Find "postgresql-x64-XX" service
# Stop it

# Or use command line:
net stop postgresql-x64-XX
```

### Option 3: Don't Expose PostgreSQL Port

If you only need the database accessible from the Menufic container (not from your host machine), you can remove the port mapping entirely:

Edit `docker-compose.yml`:
```yaml
postgres:
  image: postgres:15-alpine
  container_name: menufic-db
  environment:
    POSTGRES_USER: ${POSTGRES_USER:-menufic}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-menufic_password}
    POSTGRES_DB: ${POSTGRES_DB:-menufic_db}
  expose:
    - 5432
  # Remove the ports section entirely
  volumes:
    - ${DOCKER_VOLUME_STORAGE:-./data}/postgres:/var/lib/postgresql/data
```

Then update your DATABASE_URL in `.env` to use the **container name**:
```bash
DATABASE_URL=postgresql://menufic:menufic_password@postgres:5432/menufic_db
```

This works because Docker containers can communicate using container names as hostnames.

## Finding Which Process is Using Port 5432

### Linux:
```bash
sudo lsof -i :5432
# Or
sudo netstat -tlnp | grep 5432
```

### macOS:
```bash
lsof -i :5432
# Or
sudo lsof -iTCP:5432 -sTCP:LISTEN
```

### Windows (PowerShell):
```powershell
netstat -ano | findstr :5432
# Note the PID, then:
tasklist | findstr <PID>
```

## Verification

After applying the fix, verify everything is working:

```bash
# Check containers are running
docker-compose ps

# Check PostgreSQL logs
docker-compose logs postgres

# Test database connection
docker exec menufic-db psql -U menufic -d menufic_db -c "SELECT version();"
```

You should see the PostgreSQL version information.

## Summary of Changes Made

1. **docker-compose.yml**: Changed default port from `5432` to `5433`
2. **.env.example**: Updated DATABASE_URL to use port `5433`
3. Added POSTGRES_PORT environment variable for easy customization

The application will now work even if you have PostgreSQL already installed on your system!
