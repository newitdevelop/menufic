# Database Setup Script for Menufic (PowerShell)
# This script helps initialize the database for first-time setup

$ErrorActionPreference = "Stop"

Write-Host "======================================" -ForegroundColor Green
Write-Host "Menufic Database Setup" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "No .env file found. Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✓ Created .env file" -ForegroundColor Green
    Write-Host "⚠ Please update the credentials in .env file before continuing" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to continue after updating .env"
}

# Check if docker-compose is available
try {
    docker-compose --version | Out-Null
} catch {
    Write-Host "✗ docker-compose is not installed" -ForegroundColor Red
    Write-Host "Please install docker-compose and try again"
    exit 1
}

# Start PostgreSQL
Write-Host "Starting PostgreSQL database..." -ForegroundColor Green
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if PostgreSQL is healthy
$ready = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        docker-compose exec -T postgres pg_isready -U menufic 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ PostgreSQL is ready" -ForegroundColor Green
            $ready = $true
            break
        }
    } catch {
        # Continue waiting
    }
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 1
}

if (-not $ready) {
    Write-Host ""
    Write-Host "⚠ PostgreSQL might not be ready yet. Continuing anyway..." -ForegroundColor Yellow
}
Write-Host ""

# Generate Prisma Client
Write-Host "Generating Prisma Client..." -ForegroundColor Green
npx prisma generate
Write-Host "✓ Prisma Client generated" -ForegroundColor Green

# Run migrations
Write-Host "Running database migrations..." -ForegroundColor Green
npx prisma migrate deploy
Write-Host "✓ Migrations completed" -ForegroundColor Green

# Verify setup
Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "Database setup completed!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Start the application: docker-compose up -d"
Write-Host "2. View logs: docker-compose logs -f menufic"
Write-Host "3. Open Prisma Studio to view data: npx prisma studio"
Write-Host ""
Write-Host "Database is ready to use!" -ForegroundColor Green
