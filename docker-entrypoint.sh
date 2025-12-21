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
fi

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate --schema=./prisma/schema.prisma

echo "✅ Initialization complete!"
echo "🎉 Starting Next.js application..."

# Start the Next.js application
exec npm run start
