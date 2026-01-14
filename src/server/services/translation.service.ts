import { prisma } from "src/server/db";
import { translateWithDeepL } from "src/utils/deepl";

type EntityType = "menuItem" | "category" | "menu" | "pack" | "packSection";
type TranslatableField = "name" | "description" | "availableTime" | "message" | "title" | "aiImageDisclaimer" | "imageDisclaimer" | string;

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
    // For short texts (allergen names), still check if they're identical
    if (translatedText === originalText) {
        // For texts over 10 chars, always flag identical as invalid
        if (originalText.length > 10) {
            console.warn(`[Translation] INVALID: Translation is identical to source for target language ${targetLang}`);
            return false;
        }
        // For short texts, check for Portuguese-specific patterns that indicate untranslated text
        // Common Portuguese words that should be translated
        const portugueseWords = /^(ovos|leite|peixe|soja|aipo|mostarda|tremoço|nenhum|cereais|crustáceos|amendoins|moluscos)$/i;
        if (portugueseWords.test(translatedText.trim())) {
            console.warn(`[Translation] INVALID: Short text "${translatedText}" appears to be untranslated Portuguese for target ${targetLang}`);
            return false;
        }
    }

    // Check if translation contains Portuguese-specific characters when it shouldn't
    // This catches cases where DeepL returned the original Portuguese text
    const portuguesePattern = /[ãõçáéíóúâêôà]/i;
    if (targetLang.toUpperCase() !== "PT" && portuguesePattern.test(translatedText)) {
        // Check for common Portuguese allergen phrases
        const portugueseAllergenPhrases = /(cereais que contêm|frutos de casca rija|sementes de sésamo|dióxido de enxofre)/i;
        if (portugueseAllergenPhrases.test(translatedText)) {
            console.warn(`[Translation] INVALID: Translation contains Portuguese allergen phrase for language ${targetLang}: "${translatedText}"`);
            return false;
        }
        // Also flag if translation is identical to original with Portuguese chars
        if (originalText === translatedText) {
            console.warn(`[Translation] INVALID: Translation contains Portuguese characters for language ${targetLang}: "${translatedText}"`);
            return false;
        }
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
    console.log(`[Translation] Invalidating translations for ${entityType}/${entityId}`);
    const result = await prisma.translation.deleteMany({
        where: {
            entityType,
            entityId,
        },
    });
    console.log(`[Translation] Deleted ${result.count} cached translations for ${entityType}/${entityId}`);
}

/**
 * Invalidate all UI allergen translations
 * Call this to force re-translation of allergens (e.g., when fixing translation issues)
 */
export async function invalidateAllergenTranslations(): Promise<void> {
    console.log(`[Translation] Invalidating all UI allergen translations`);
    const result = await prisma.translation.deleteMany({
        where: {
            entityType: "menu",
            entityId: "ui-allergens",
        },
    });
    console.log(`[Translation] Deleted ${result.count} cached allergen translations`);
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
 * NOTE: Menu name is translated ONLY for festive or temporary/timed menus
 * Regular menu names are kept as-is (brand names should not be translated)
 * availableTime is NOT translated (time formats should stay consistent)
 */
export async function translateMenu(
    menu: { id: string; name: string; availableTime: string; message?: string | null; isFestive?: boolean; isTemporary?: boolean },
    targetLang: string
) {
    if (!targetLang || targetLang.toUpperCase() === "PT") {
        // Don't translate if target is Portuguese (source language)
        return menu;
    }

    // Translate menu name ONLY for festive or temporary menus
    const shouldTranslateName = menu.isFestive || menu.isTemporary;
    const translatedName = shouldTranslateName
        ? await getOrCreateTranslation("menu", menu.id, "name", menu.name, targetLang, "PT")
        : menu.name;

    // Translate the message field if present
    const translatedMessage = menu.message
        ? await getOrCreateTranslation("menu", menu.id, "message", menu.message, targetLang, "PT")
        : menu.message;

    return {
        ...menu,
        name: translatedName,
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
    reservation: {
        title: "Reserve a Table",
        dateLabel: "Date",
        dateDescription: "Select date",
        datePrompt: "Select a date",
        timeLabel: "Time",
        timeDescription: "Select time",
        timePrompt: "Select a time",
        timeContext: "For {date}",
        guestsLabel: "Guests",
        guestsDescription: "Number of people",
        guestsPrompt: "Number of people",
        moreThan12: "More than 12?",
        contactLabel: "Contact Info",
        emailLabel: "Email Address",
        emailPlaceholder: "your.email@example.com",
        emailPrompt: "Enter your email to confirm the reservation",
        summaryTitle: "Reservation Summary:",
        person: "person",
        people: "people",
        backButton: "Back",
        nextButton: "Next",
        confirmButton: "Confirm Reservation",
        successTitle: "Reservation Sent",
        successMessage: "Your reservation request has been sent successfully!",
        errorTitle: "Reservation Error",
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

/**
 * Get all reservation form translations
 * Source language is English (EN) since the reservation form was created in English
 * @param targetLang Target language code
 * @returns Object with all reservation form translations
 */
export async function getReservationTranslations(targetLang: string): Promise<typeof UI_TRANSLATIONS_PT.reservation> {
    if (!targetLang || targetLang.toUpperCase() === "EN") {
        // Return English (source language for reservation forms)
        return UI_TRANSLATIONS_PT.reservation;
    }

    // Translate all reservation UI strings in parallel from English to target language
    const keys = Object.keys(UI_TRANSLATIONS_PT.reservation) as Array<keyof typeof UI_TRANSLATIONS_PT.reservation>;

    const translations = await Promise.all(
        keys.map(async (key) => {
            const sourceText = UI_TRANSLATIONS_PT.reservation[key];
            const translated = await getOrCreateTranslation("menu", "ui-reservation", key, sourceText, targetLang, "EN");
            return [key, translated] as const;
        })
    );

    return Object.fromEntries(translations) as typeof UI_TRANSLATIONS_PT.reservation;
}

/**
 * Translate a pack with its fields
 * Source language is Portuguese (PT) - the default content language
 */
export async function translatePack(
    pack: { id: string; name: string; description?: string | null },
    targetLang: string
) {
    if (!targetLang || targetLang.toUpperCase() === "PT") {
        // Don't translate if target is Portuguese (source language)
        return pack;
    }

    const [name, description] = await Promise.all([
        getOrCreateTranslation("pack", pack.id, "name", pack.name, targetLang, "PT"),
        pack.description
            ? getOrCreateTranslation("pack", pack.id, "description", pack.description, targetLang, "PT")
            : Promise.resolve(pack.description),
    ]);

    return {
        ...pack,
        name,
        description,
    };
}

/**
 * Translate a pack section with its fields
 * Source language is Portuguese (PT) - the default content language
 */
export async function translatePackSection(
    section: { id: string; title: string; items: string[]; itemAllergens?: Record<string, string[]> | null },
    targetLang: string
) {
    if (!targetLang || targetLang.toUpperCase() === "PT") {
        // Don't translate if target is Portuguese (source language)
        return section;
    }

    // Translate section title
    const title = await getOrCreateTranslation("packSection", section.id, "title", section.title, targetLang, "PT");

    // Translate all items
    const items = await Promise.all(
        section.items.map((item, index) =>
            getOrCreateTranslation("packSection", section.id, `item_${index}`, item, targetLang, "PT")
        )
    );

    // Remap itemAllergens keys from original to translated item names
    // This ensures allergens can be looked up by the translated item text
    let translatedItemAllergens: Record<string, string[]> | undefined;
    if (section.itemAllergens && typeof section.itemAllergens === 'object') {
        translatedItemAllergens = {};
        const allergenMap = section.itemAllergens as Record<string, string[]>;
        for (let i = 0; i < section.items.length; i++) {
            const originalItem = section.items[i];
            const translatedItem = items[i];
            // Copy allergens from original key to translated key
            if (allergenMap[originalItem]) {
                translatedItemAllergens[translatedItem] = allergenMap[originalItem];
            }
        }
    }

    return {
        ...section,
        title,
        items,
        itemAllergens: translatedItemAllergens,
    };
}
