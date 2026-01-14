/**
 * Script to clear invalid translations from the database
 *
 * This script removes cached translations that failed to translate properly
 * (e.g., Portuguese text cached as English translation when DeepL API was not available)
 *
 * Usage:
 *   npx ts-node scripts/clear-invalid-translations.ts
 *
 * Or to clear translations for a specific entity:
 *   npx ts-node scripts/clear-invalid-translations.ts category <categoryId>
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearInvalidTranslations(entityType?: string, entityId?: string) {
    try {
        console.log("🔍 Searching for invalid translations...");

        // Portuguese-specific character pattern
        const portuguesePattern = /[ãõçáéíóúâêôà]/i;

        // Portuguese allergen words that should be translated
        const portugueseAllergenWords = /^(ovos|leite|peixe|soja|aipo|mostarda|tremoço|nenhum|cereais|crustáceos|amendoins|moluscos)$/i;

        // Portuguese allergen phrases
        const portugueseAllergenPhrases = /(cereais que contêm|frutos de casca rija|sementes de sésamo|dióxido de enxofre)/i;

        // Get all translations
        const where: any = {};
        if (entityType) {
            where.entityType = entityType;
        }
        if (entityId) {
            where.entityId = entityId;
        }

        const translations = await prisma.translation.findMany({ where });

        console.log(`📊 Found ${translations.length} total translations`);

        let invalidCount = 0;
        const toDelete: string[] = [];

        for (const translation of translations) {
            // Skip Portuguese translations (they should match original)
            if (translation.language === "PT") {
                continue;
            }

            let isInvalid = false;

            // Check if non-PT translation contains Portuguese characters
            // This indicates it's likely an untranslated Portuguese text
            if (portuguesePattern.test(translation.translated)) {
                isInvalid = true;
            }

            // Check for Portuguese allergen words (short words without accents)
            if (translation.entityId === "ui-allergens" && portugueseAllergenWords.test(translation.translated.trim())) {
                isInvalid = true;
            }

            // Check for Portuguese allergen phrases
            if (portugueseAllergenPhrases.test(translation.translated)) {
                isInvalid = true;
            }

            if (isInvalid) {
                console.log(
                    `❌ Invalid translation found: ${translation.entityType}/${translation.entityId}/${translation.field}/${translation.language}: "${translation.translated}"`
                );
                toDelete.push(translation.id);
                invalidCount++;
            }
        }

        if (toDelete.length > 0) {
            console.log(`\n🗑️  Deleting ${toDelete.length} invalid translations...`);

            await prisma.translation.deleteMany({
                where: {
                    id: { in: toDelete },
                },
            });

            console.log(`✅ Successfully deleted ${toDelete.length} invalid translations`);
            console.log(`\n💡 Next time the menu is loaded in a non-PT language, these will be retranslated.`);
        } else {
            console.log("\n✅ No invalid translations found!");
        }

        console.log(`\n📈 Summary:`);
        console.log(`   Total translations checked: ${translations.length}`);
        console.log(`   Invalid translations removed: ${invalidCount}`);

    } catch (error) {
        console.error("❌ Error:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const entityType = args[0];
const entityId = args[1];

if (args.length > 0 && !["menu", "category", "menuItem", "pack", "packSection"].includes(entityType)) {
    console.error(`\n❌ Invalid entity type: ${entityType}`);
    console.error(`   Valid types: menu, category, menuItem, pack, packSection\n`);
    process.exit(1);
}

if (args.length > 0) {
    console.log(`\n🎯 Clearing translations for ${entityType}${entityId ? `/${entityId}` : " (all)"}\n`);
} else {
    console.log(`\n🎯 Clearing all invalid translations\n`);
}

clearInvalidTranslations(entityType, entityId)
    .then(() => {
        console.log("\n✅ Done!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Failed:", error);
        process.exit(1);
    });
