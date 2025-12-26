/**
 * Quick migration script to add isAiGenerated column to Image table
 * Run this with: node apply-migration.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Applying migration: Add isAiGenerated to Image table...');

  try {
    // Check if column already exists
    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Image'
      AND column_name = 'isAiGenerated'
    `);

    if (result.length > 0) {
      console.log('✅ Column isAiGenerated already exists - migration not needed');
      return;
    }

    // Add the column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Image" ADD COLUMN "isAiGenerated" BOOLEAN NOT NULL DEFAULT false;
    `);

    console.log('✅ Migration applied successfully!');
    console.log('   Column isAiGenerated added to Image table');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
