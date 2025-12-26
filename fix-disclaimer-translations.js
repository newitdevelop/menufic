/**
 * Fix incorrect disclaimer translations in the database
 * Deletes Portuguese text that should be translated
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing incorrect disclaimer translations...');

  try {
    // Delete disclaimer translations that are still in Portuguese (incorrect)
    const result = await prisma.translation.deleteMany({
      where: {
        entityType: 'menu',
        entityId: 'ui-disclaimers',
        OR: [
          {
            // AI image disclaimer in Portuguese when it should be translated
            field: 'aiImageDisclaimer',
            translated: 'Imagem gerada por IA - o prato real pode variar',
            language: {
              not: 'PT' // Delete if language is NOT Portuguese
            }
          },
          {
            // Regular image disclaimer in Portuguese when it should be translated
            field: 'imageDisclaimer',
            translated: 'A apresentação real pode variar',
            language: {
              not: 'PT' // Delete if language is NOT Portuguese
            }
          }
        ]
      }
    });

    console.log(`✅ Deleted ${result.count} incorrect disclaimer translations`);
    console.log('   Next time these disclaimers are requested, they will be translated correctly via DeepL');

  } catch (error) {
    console.error('❌ Failed to fix translations:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
