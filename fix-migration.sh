#!/bin/bash
# Fix failed migration

echo "🔧 Fixing failed migration..."

# Step 1: Check if the column already exists in the database
echo "📋 Checking if isAiGenerated column exists..."
COLUMN_EXISTS=$(npx prisma db execute --stdin --schema=./prisma/schema.prisma <<EOF
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'Image'
AND column_name = 'isAiGenerated';
EOF
)

if echo "$COLUMN_EXISTS" | grep -q "isAiGenerated"; then
  echo "✅ Column already exists - marking migration as resolved"
  # Mark the migration as resolved (applied)
  npx prisma migrate resolve --applied 20251226203500_add_is_ai_generated_to_image --schema=./prisma/schema.prisma
else
  echo "❌ Column doesn't exist - rolling back and reapplying"
  # Mark as rolled back and try again
  npx prisma migrate resolve --rolled-back 20251226203500_add_is_ai_generated_to_image --schema=./prisma/schema.prisma
  # Deploy again
  npx prisma migrate deploy --schema=./prisma/schema.prisma
fi

echo "✅ Migration resolved!"
echo "🔄 Regenerating Prisma Client..."
npx prisma generate --schema=./prisma/schema.prisma

echo "✅ Done! You can now restart the application."
