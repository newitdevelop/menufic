# Database Setup Guide

This guide will help you set up and troubleshoot the PostgreSQL database for Menufic.

## Quick Fix for "Failed to retrieve restaurants" Error

If you're seeing database connection errors, follow these steps:

### Step 1: Update Your Environment File

1. **Copy the example environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Update the DATABASE_URL** in your `.env` file:

   **If running with docker-compose (app in container):**
   ```bash
   # Use the container name "postgres" as the host
   DATABASE_URL=postgresql://menufic:menufic_password@postgres:5432/menufic_db
   ```

   **If running app locally (not in Docker) but connecting to Docker DB:**
   ```bash
   # Use localhost with port 5433
   DATABASE_URL=postgresql://menufic:menufic_password@localhost:5433/menufic_db
   ```

3. **Add PostgreSQL credentials** (if using docker-compose):
   ```bash
   POSTGRES_USER=menufic
   POSTGRES_PASSWORD=menufic_password
   POSTGRES_DB=menufic_db
   POSTGRES_PORT=5433
   ```

   > **Note:** Port 5433 is used by default to avoid conflicts. If you see a "port already allocated" error, see [PORT_CONFLICT_FIX.md](PORT_CONFLICT_FIX.md)

### Step 2: Start the Database

```bash
# Start only the database
docker-compose up -d postgres

# Wait for the database to be ready (check logs)
docker-compose logs -f postgres
```

You should see: `database system is ready to accept connections`

### Step 3: Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations to create tables
npx prisma migrate deploy

# Or for development (creates a new migration):
npx prisma migrate dev
```

### Step 4: Verify Database Connection

```bash
# Open Prisma Studio to verify the database
npx prisma studio
```

This will open a browser at `http://localhost:5555` where you can see your database tables.

### Step 5: Start the Application

```bash
# Start all services
docker-compose up -d

# Or if you want to see logs
docker-compose up
```

## Common Issues and Solutions

### Issue 0: "Port is already allocated" (Port 5432 conflict)

**Symptoms**:
- `Bind for 0.0.0.0:5432 failed: port is already allocated`
- Docker container fails to start

**Solutions**:

This issue has been **fixed in the default configuration** - the app now uses port 5433 instead of 5432.

1. **Update your .env file** to use port 5433:
   ```bash
   DATABASE_URL=postgresql://menufic:menufic_password@localhost:5433/menufic_db
   POSTGRES_PORT=5433
   ```

2. **Restart the containers**:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

For more details and alternative solutions, see **[PORT_CONFLICT_FIX.md](PORT_CONFLICT_FIX.md)**

### Issue 1: "Can't reach database server"

**Symptoms**:
- `Error: P1001: Can't reach database server`
- Connection refused

**Solutions**:

1. **Check if PostgreSQL is running**:
   ```bash
   docker-compose ps
   ```
   You should see `menufic-db` with status `Up`

2. **Check PostgreSQL logs**:
   ```bash
   docker-compose logs postgres
   ```

3. **Verify the DATABASE_URL**:
   - For Docker Compose: `postgresql://menufic:menufic_password@localhost:5432/menufic_db`
   - For production: Update with your actual credentials

4. **Restart the database**:
   ```bash
   docker-compose restart postgres
   ```

### Issue 2: "Authentication failed"

**Symptoms**:
- `password authentication failed for user`

**Solutions**:

1. **Check credentials match** in:
   - `.env` file: `DATABASE_URL` and `POSTGRES_*` variables
   - `docker-compose.yml`: environment variables

2. **Reset the database**:
   ```bash
   # Stop and remove containers
   docker-compose down

   # Remove database volume
   rm -rf ./data/postgres

   # Start fresh
   docker-compose up -d postgres
   ```

### Issue 3: "Table doesn't exist"

**Symptoms**:
- `The table 'Restaurant' does not exist`
- `relation "Restaurant" does not exist`

**Solutions**:

1. **Run migrations**:
   ```bash
   npx prisma migrate deploy
   ```

2. **Check migration status**:
   ```bash
   npx prisma migrate status
   ```

3. **Reset database** (WARNING: This deletes all data):
   ```bash
   npx prisma migrate reset
   ```

### Issue 4: "Connection pool timeout"

**Symptoms**:
- Connection errors after some time
- Application becomes unresponsive

**Solutions**:

1. **Increase connection pool** in `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     connectionLimit = 10
   }
   ```

2. **Restart the application**:
   ```bash
   docker-compose restart menufic
   ```

## Database Configuration for Different Environments

### Local Development (Docker Compose)

```bash
# .env
DATABASE_URL=postgresql://menufic:menufic_password@localhost:5432/menufic_db
POSTGRES_USER=menufic
POSTGRES_PASSWORD=menufic_password
POSTGRES_DB=menufic_db
```

### Local Development (External PostgreSQL)

```bash
# .env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

### Production (Hosted Database)

```bash
# .env
DATABASE_URL=postgresql://user:password@your-db-host.com:5432/database_name

# For connection pooling (recommended for serverless):
DATABASE_URL=postgresql://user:password@your-db-host.com:5432/database_name?connection_limit=5&pool_timeout=10
```

### Azure PostgreSQL

```bash
# .env
DATABASE_URL=postgresql://username@servername:password@servername.postgres.database.azure.com:5432/database_name?sslmode=require
```

## Running Database Commands Inside Docker

If your application is running in Docker and you need to run Prisma commands:

```bash
# Enter the container
docker exec -it menufic sh

# Inside the container, run migrations
npm run prisma migrate deploy

# Or generate Prisma client
npm run prisma generate

# Exit the container
exit
```

## Backup and Restore

### Backup Database

```bash
# Using docker-compose
docker exec menufic-db pg_dump -U menufic menufic_db > backup.sql

# Or with pg_dump directly
pg_dump -h localhost -p 5432 -U menufic menufic_db > backup.sql
```

### Restore Database

```bash
# Using docker-compose
docker exec -i menufic-db psql -U menufic menufic_db < backup.sql

# Or with psql directly
psql -h localhost -p 5432 -U menufic menufic_db < backup.sql
```

## Prisma Commands Reference

```bash
# Generate Prisma Client
npx prisma generate

# Create a new migration
npx prisma migrate dev --name description_of_changes

# Apply pending migrations
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio

# Validate schema
npx prisma validate

# Format schema file
npx prisma format
```

## Database Connection String Format

```
postgresql://[user[:password]@][host][:port][/database][?parameter_list]
```

**Example**:
```
postgresql://menufic:menufic_password@localhost:5432/menufic_db?schema=public&connection_limit=5
```

**Parameters**:
- `schema`: Database schema (default: `public`)
- `connection_limit`: Maximum number of connections
- `pool_timeout`: Connection timeout in seconds
- `sslmode`: SSL mode (`require`, `prefer`, `disable`)

## Checking Database Inside Container

```bash
# Connect to PostgreSQL
docker exec -it menufic-db psql -U menufic -d menufic_db

# Inside psql:
\dt              # List all tables
\d Restaurant    # Describe Restaurant table
SELECT * FROM "Restaurant";  # Query data
\q               # Quit
```

## Troubleshooting Checklist

- [ ] PostgreSQL container is running: `docker-compose ps`
- [ ] DATABASE_URL is correct in `.env` file
- [ ] Prisma client is generated: `npx prisma generate`
- [ ] Migrations are applied: `npx prisma migrate deploy`
- [ ] Tables exist: Check with Prisma Studio or psql
- [ ] Network connectivity: Can reach database from application
- [ ] Credentials are correct: Username, password, database name match
- [ ] Firewall/ports: Port 5432 is accessible

## Getting Help

If you're still experiencing issues:

1. **Check the logs**:
   ```bash
   docker-compose logs menufic
   docker-compose logs postgres
   ```

2. **Verify database structure**:
   ```bash
   npx prisma studio
   ```

3. **Test connection**:
   ```bash
   npx prisma db pull
   ```

4. **Check GitHub issues**: Look for similar problems in the Menufic repository
