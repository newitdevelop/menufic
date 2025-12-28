import { prisma } from "src/server/db";
import { translateWithDeepL } from "src/utils/deepl";

type EntityType = "menuItem" | "category" | "menu";
type TranslatableField = "name" | "description" | "availableTime" | "message" | "aiImageDisclaimer" | "imageDisclaimer" | string;

/**
 * Get or create translation for a specific entity field
 * @param entityType Type of entity (menuItem, category, menu)
 * @param entityId ID of the entity
 * @param field Field name to translate
 * @param originalText Original text in source language
 * @param targetLang Target language code
 * @param sourceLang Source language code (default: 'EN')
 * @returns Translated text
 */
/**
 * Validate if a translation is correct
 * Returns true if the translation appears to be valid
 */
function isTranslationValid(originalText: string, translatedText: string, targetLang: string, sourceLang: string): boolean {
    // If target language is same as source language, translation should match original
    if (targetLang.toUpperCase() === sourceLang.toUpperCase() ||
        (sourceLang.toUpperCase() === "PT" && targetLang.toUpperCase() === "PT")) {
        return true;
    }

    // Check if translation is identical to source (likely failed translation)
    // Allow some tolerance for proper nouns and short words
    if (translatedText === originalText && originalText.length > 10) {
        console.warn(`[Translation] INVALID: Translation is identical to source for target language ${targetLang}`);
        return false;
    }

    // Check if translation contains Portuguese-specific characters when it shouldn't
    // This catches cases where DeepL returned the original Portuguese text
    const portuguesePattern = /[ãõçáéíóúâêôà]/i;
    if (targetLang.toUpperCase() !== "PT" && portuguesePattern.test(translatedText) && originalText === translatedText) {
        console.warn(`[Translation] INVALID: Translation contains Portuguese characters for language ${targetLang}: "${translatedText}"`);
        return false;
    }

    return true;
}

export async function getOrCreateTranslation(
    entityType: EntityType,
    entityId: string,
    field: TranslatableField,
    originalText: string,
    targetLang: string,
    sourceLang = "auto"
): Promise<string> {
    // If source is auto-detect, we can't skip translation based on language match
    // Let DeepL handle the detection

    // Check if translation exists in cache
    const cached = await prisma.translation.findUnique({
        where: {
            entityType_entityId_language_field: {
                entityType,
                entityId,
                language: targetLang.toUpperCase(),
                field,
            },
        },
    });

    if (cached) {
        // Validate cached translation
        const isValid = isTranslationValid(originalText, cached.translated, targetLang, sourceLang);

        if (isValid) {
            console.log(`[Translation] Cache HIT for ${entityType}/${entityId}/${field}/${targetLang}: "${cached.translated}"`);
            return cached.translated;
        }

        // Invalid translation found - delete it and retranslate
        console.warn(`[Translation] Cache HIT but INVALID for ${entityType}/${entityId}/${field}/${targetLang}: "${cached.translated}"`);
        console.log(`[Translation] Deleting invalid translation and retranslating...`);

        await prisma.translation.delete({
            where: {
                entityType_entityId_language_field: {
                    entityType,
                    entityId,
                    language: targetLang.toUpperCase(),
                    field,
                },
            },
        }).catch(() => {
            // Ignore deletion errors
        });
    }

    console.log(`[Translation] Cache MISS for ${entityType}/${entityId}/${field}/${targetLang} - calling DeepL with source: "${originalText}"`);
    // Translation not cached, call DeepL
    const translated = await translateWithDeepL(originalText, targetLang, sourceLang);
    console.log(`[Translation] DeepL returned: "${translated}"`);

    // Validate new translation before caching
    const isValid = isTranslationValid(originalText, translated, targetLang, sourceLang);
    if (!isValid) {
        console.error(`[Translation] ERROR: DeepL returned invalid translation for ${targetLang}.`);
        console.log(`[Translation] Caching invalid translation to prevent repeated API calls. Will be auto-corrected when DeepL works.`);

        // Cache the invalid translation anyway to prevent repeated API calls
        // This saves money by not calling DeepL repeatedly for the same failing translation
        // The validation will catch it next time and retry if DeepL is working again
        try {
            await prisma.translation.create({
                data: {
                    entityType,
                    entityId,
                    language: targetLang.toUpperCase(),
                    field,
                    translated,
                },
            });
        } catch (error) {
            console.warn("Failed to cache invalid translation:", error);
        }

        return translated;
    }

    // Save valid translation to cache
    try {
        await prisma.translation.create({
            data: {
                entityType,
                entityId,
                language: targetLang.toUpperCase(),
                field,
                translated,
            },
        });
        console.log(`[Translation] Cached new translation for ${entityType}/${entityId}/${field}/${targetLang}`);
    } catch (error) {
        // Ignore unique constraint violations (race condition)
        console.warn("Failed to cache translation:", error);
    }

    return translated;
}

/**
 * Invalidate all translations for a specific entity
 * Call this when an entity is updated
 * @param entityType Type of entity
 * @param entityId ID of the entity
 */
export async function invalidateTranslations(entityType: EntityType, entityId: string): Promise<void> {
    await prisma.translation.deleteMany({
        where: {
            entityType,
            entityId,
        },
    });
}

/**
 * Translate a menu item with all its fields
 * Source language is Portuguese (PT) - the default content language
 */
export async function translateMenuItem(
    menuItem: { id: string; name: string; description: string },
    targetLang: string
) {
    if (!targetLang || targetLang.toUpperCase() === "PT") {
        // Don't translate if target is Portuguese (source language)
        return menuItem;
    }

    const [name, description] = await Promise.all([
        getOrCreateTranslation("menuItem", menuItem.id, "name", menuItem.name, targetLang, "PT"),
        getOrCreateTranslation("menuItem", menuItem.id, "description", menuItem.description, targetLang, "PT"),
    ]);

    return {
        ...menuItem,
        name,
        description,
    };
}

/**
 * Translate a category with its name
 * Source language is Portuguese (PT) - the default content language
 */
export async function translateCategory(category: { id: string; name: string }, targetLang: string) {
    if (!targetLang || targetLang.toUpperCase() === "PT") {
        // Don't translate if target is Portuguese (source language)
        return category;
    }

    const name = await getOrCreateTranslation("category", category.id, "name", category.name, targetLang, "PT");

    return {
        ...category,
        name,
    };
}

/**
 * Translate a menu with its fields
 * Source language is Portuguese (PT) - the default content language
 * NOTE: Menu name and availableTime are NOT translated (brand names and times should stay as-is)
 * Only the message field is translated
 * Festive menus get a 🎄 emoji prefix
 */
export async function translateMenu(
    menu: { id: string; name: string; availableTime: string; message?: string | null; isFestive?: boolean },
    targetLang: string
) {
    if (!targetLang || targetLang.toUpperCase() === "PT") {
        // Don't translate if target is Portuguese (source language)
        // But still add festive emoji if needed
        return {
            ...menu,
            name: menu.isFestive ? `🎄 ${menu.name}` : menu.name,
        };
    }

    // Only translate the message field, keep name and availableTime unchanged
    const translatedMessage = menu.message
        ? await getOrCreateTranslation("menu", menu.id, "message", menu.message, targetLang, "PT")
        : menu.message;

    return {
        ...menu,
        // name: keep original (brand names should not be translated) but add festive emoji
        name: menu.isFestive ? `🎄 ${menu.name}` : menu.name,
        // availableTime: keep original (time formats should stay consistent)
        message: translatedMessage,
    };
}

/**
 * Get translated disclaimer text for images
 * Uses a special entity type "ui" to cache UI translations
 * @param isAiGenerated Whether the image is AI-generated
 * @param targetLang Target language code
 * @returns Translated disclaimer text
 */
export async function getImageDisclaimer(isAiGenerated: boolean, targetLang: string): Promise<string> {
    if (!targetLang || targetLang.toUpperCase() === "PT") {
        // Return Portuguese (source language) disclaimers
        return isAiGenerated
            ? "Imagem gerada por IA - o prato real pode variar"
            : "A apresentação real pode variar";
    }

    // Use different field names for AI vs regular disclaimers
    const field = isAiGenerated ? "aiImageDisclaimer" : "imageDisclaimer";
    const sourceText = isAiGenerated
        ? "Imagem gerada por IA - o prato real pode variar"
        : "A apresentação real pode variar";

    console.log(`[Translation] Getting disclaimer translation - field: ${field}, targetLang: ${targetLang}, sourceText: "${sourceText}"`);

    // Use a static entity ID for UI translations
    const cached = await getOrCreateTranslation("menu", "ui-disclaimers", field, sourceText, targetLang, "PT");

    console.log(`[Translation] Disclaimer result: "${cached}"`);

    return cached;
}

/**
 * UI text translations in Portuguese (source language)
 */
const UI_TRANSLATIONS_PT = {
    vatIncluded: "IVA incluído",
    allergensInfo: "Pode conter os seguintes alergénios",
    allergens: {
        cereals: "Cereais que contêm glúten",
        crustaceans: "Crustáceos",
        eggs: "Ovos",
        fish: "Peixe",
        peanuts: "Amendoins",
        soybeans: "Soja",
        milk: "Leite",
        nuts: "Frutos de casca rija",
        celery: "Aipo",
        mustard: "Mostarda",
        sesame: "Sementes de sésamo",
        sulphites: "Dióxido de enxofre e sulfitos",
        lupin: "Tremoço",
        molluscs: "Moluscos",
        none: "Nenhum",
    },
} as const;

/**
 * Get translated UI text
 * @param key UI translation key (e.g., "vatIncluded", "allergensInfo")
 * @param targetLang Target language code
 * @returns Translated text
 */
export async function getUITranslation(key: string, targetLang: string): Promise<string> {
    if (!targetLang || targetLang.toUpperCase() === "PT") {
        // Return Portuguese (source language)
        return (UI_TRANSLATIONS_PT as any)[key] || key;
    }

    const sourceText = (UI_TRANSLATIONS_PT as any)[key];
    if (!sourceText) return key;

    // Use a static entity ID for UI translations
    const cached = await getOrCreateTranslation("menu", "ui-text", key, sourceText, targetLang, "PT");

    return cached;
}

/**
 * Get translated allergen name
 * @param allergenCode Allergen code (e.g., "cereals", "milk")
 * @param targetLang Target language code
 * @returns Translated allergen name
 */
export async function getAllergenTranslation(allergenCode: string, targetLang: string): Promise<string> {
    if (!targetLang || targetLang.toUpperCase() === "PT") {
        // Return Portuguese (source language)
        return UI_TRANSLATIONS_PT.allergens[allergenCode as keyof typeof UI_TRANSLATIONS_PT.allergens] || allergenCode;
    }

    const sourceText = UI_TRANSLATIONS_PT.allergens[allergenCode as keyof typeof UI_TRANSLATIONS_PT.allergens];
    if (!sourceText) return allergenCode;

    // Use a static entity ID for allergen translations
    const cached = await getOrCreateTranslation("menu", "ui-allergens", allergenCode, sourceText, targetLang, "PT");

    return cached;
}
