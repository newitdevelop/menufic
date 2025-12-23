import { prisma } from "src/server/db";
import { translateWithDeepL } from "src/utils/deepl";

type EntityType = "menuItem" | "category" | "menu";
type TranslatableField = "name" | "description" | "availableTime" | "message";

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
export async function getOrCreateTranslation(
    entityType: EntityType,
    entityId: string,
    field: TranslatableField,
    originalText: string,
    targetLang: string,
    sourceLang = "EN"
): Promise<string> {
    // If no translation needed (original language), return original
    if (targetLang.toUpperCase() === sourceLang.toUpperCase()) {
        return originalText;
    }

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
        return cached.translated;
    }

    // Translation not cached, call DeepL
    const translated = await translateWithDeepL(originalText, targetLang, sourceLang);

    // Save to cache
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
 */
export async function translateMenuItem(
    menuItem: { id: string; name: string; description: string },
    targetLang: string
) {
    if (!targetLang || targetLang.toUpperCase() === "EN") {
        return menuItem;
    }

    const [name, description] = await Promise.all([
        getOrCreateTranslation("menuItem", menuItem.id, "name", menuItem.name, targetLang),
        getOrCreateTranslation("menuItem", menuItem.id, "description", menuItem.description, targetLang),
    ]);

    return {
        ...menuItem,
        name,
        description,
    };
}

/**
 * Translate a category with its name
 */
export async function translateCategory(category: { id: string; name: string }, targetLang: string) {
    if (!targetLang || targetLang.toUpperCase() === "EN") {
        return category;
    }

    const name = await getOrCreateTranslation("category", category.id, "name", category.name, targetLang);

    return {
        ...category,
        name,
    };
}

/**
 * Translate a menu with its fields
 */
export async function translateMenu(
    menu: { id: string; name: string; availableTime: string; message?: string | null },
    targetLang: string
) {
    if (!targetLang || targetLang.toUpperCase() === "EN") {
        return menu;
    }

    const translations = await Promise.all([
        getOrCreateTranslation("menu", menu.id, "name", menu.name, targetLang),
        getOrCreateTranslation("menu", menu.id, "availableTime", menu.availableTime, targetLang),
        menu.message ? getOrCreateTranslation("menu", menu.id, "message", menu.message, targetLang) : Promise.resolve(menu.message),
    ]);

    return {
        ...menu,
        name: translations[0],
        availableTime: translations[1],
        message: translations[2],
    };
}
