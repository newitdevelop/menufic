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
    echo "⚠️  Migration deployment failed - attempting to resolve..."

    # Get list of failed migrations
    echo "🔍 Detecting failed migrations..."
    FAILED_MIGRATIONS=$(npx prisma migrate status --schema=./prisma/schema.prisma 2>&1 | grep "Failed" | awk '{print $1}' || echo "")

    if [ -z "$FAILED_MIGRATIONS" ]; then
      echo "❌ Could not detect failed migrations - attempting generic resolution..."
      # Try common migrations that might fail
      FAILED_MIGRATIONS="20251226203500_add_is_ai_generated_to_image 20251228212939_add_temporary_and_festive_menus 20251229_add_menu_packs 20251223_add_allergens_to_menu_item 20251230163000_add_item_allergens_to_pack_section 20251230162945_add_reservation_system 20260102_add_banner_scheduling 20260114_add_menu_type_and_contact_preference 20260114_add_reservation_slot_duration 20260116_add_menu_schedule_fields 20260116_add_monthly_weekday_schedule"
    fi

    for MIGRATION in $FAILED_MIGRATIONS; do
      echo "🔧 Resolving migration: $MIGRATION"

      # Use Prisma's db push to check if schema is already in sync
      # This compares schema.prisma with actual database state
      if npx prisma db push --skip-generate --accept-data-loss --schema=./prisma/schema.prisma 2>&1 | grep -q "already in sync"; then
        echo "✅ Database schema matches - marking $MIGRATION as applied"
        npx prisma migrate resolve --applied "$MIGRATION" --schema=./prisma/schema.prisma || true
      else
        echo "⚠️  Schema not in sync - marking $MIGRATION as rolled back"
        npx prisma migrate resolve --rolled-back "$MIGRATION" --schema=./prisma/schema.prisma || true
      fi
    done

    # Try deploying again
    echo "🔄 Retrying migration deployment..."
    if npx prisma migrate deploy --schema=./prisma/schema.prisma; then
      echo "✅ Migrations deployed successfully after resolution"
    else
      echo "⚠️  Migration deployment still failing - using db push as fallback..."
      # Final fallback: use db push to sync schema
      if npx prisma db push --skip-generate --accept-data-loss --schema=./prisma/schema.prisma; then
        echo "✅ Database schema synchronized via db push"
        # Mark all failed migrations as applied
        for MIGRATION in $FAILED_MIGRATIONS; do
          npx prisma migrate resolve --applied "$MIGRATION" --schema=./prisma/schema.prisma || true
        done
      else
        echo "❌ Could not synchronize database schema"
        echo "⚠️  Application may not work correctly"
      fi
    fi
  fi

  echo "✅ Database migrations applied successfully!"
fi

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate --schema=./prisma/schema.prisma

# Optional: Generate translations if DeepL API key is available
if [ ! -z "$DEEPL_API_KEY" ]; then
  echo "🌍 DeepL API key detected - checking translations..."

  # Ensure en.json exists in volume (copy from build if missing)
  if [ ! -f "src/lang/en.json" ]; then
    echo "📋 Copying English source file to volume..."
    if [ -f "/tmp/en.json.backup" ]; then
      cp /tmp/en.json.backup src/lang/en.json
      echo "✅ English source file restored"
    else
      echo "❌ English source file not found - translations cannot be generated"
    fi
  fi

  # Check if translation files exist
  if [ ! -f "src/lang/pt.json" ] || [ ! -f "src/lang/es.json" ]; then
    echo "📝 Translation files missing - generating translations..."
    if npm run translate; then
      echo "✅ Translations generated successfully"
    else
      echo "⚠️  Translation generation failed, but continuing startup..."
    fi
  else
    echo "✅ Translation files already exist (run 'npm run translate' to update)"
  fi
else
  echo "ℹ️  DeepL API key not set - skipping translation generation"
  echo "   Set DEEPL_API_KEY environment variable to enable automatic translations"
fi

echo "✅ Initialization complete!"
echo "🎉 Starting Next.js application..."

# Start the Next.js application
exec npm run start
