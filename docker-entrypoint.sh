#!/bin/bash
set -e

echo "🚀 Starting Menufic application..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until npx prisma db execute --schema=./prisma/schema.prisma --stdin <<< "SELECT 1" > /dev/null 2>&1; do
  echo "   PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Check if database needs initialization
echo "🔍 Checking database state..."
if npx prisma db pull --schema=./prisma/schema.prisma 2>&1 | grep -q "P4001"; then
  echo "📦 Database is empty - initializing schema..."
  npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss
  echo "✅ Database schema created successfully!"
else
  echo "✅ Database schema already exists"
  echo "🔄 Running database migrations..."

  # Check if migrations table exists
  if ! npx prisma db execute --schema=./prisma/schema.prisma --stdin <<< "SELECT 1 FROM _prisma_migrations LIMIT 1" > /dev/null 2>&1; then
    echo "⚠️  Migrations table doesn't exist - baselining existing database..."

    # Mark the initial migration as already applied (baseline)
    echo "📋 Marking initial migration as applied..."
    npx prisma migrate resolve --applied 20240308151629_initial_migration --schema=./prisma/schema.prisma

    echo "✅ Database baselined successfully"
  fi

  # Now deploy any new migrations
  echo "📦 Deploying pending migrations..."
  if npx prisma migrate deploy --schema=./prisma/schema.prisma; then
    echo "✅ All migrations deployed successfully"
  else
    echo "❌ Migration deployment failed"
    exit 1
  fi

  echo "✅ Database migrations applied successfully!"
fi

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate --schema=./prisma/schema.prisma

echo "✅ Initialization complete!"
echo "🎉 Starting Next.js application..."

# Start the Next.js application
exec npm run start
