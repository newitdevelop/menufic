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

    // Only check for clearly wrong-language responses — Portuguese allergen phrases
    // that should never appear in non-PT translations.
    // NOTE: Do NOT flag identical translations as invalid. Dish names like "Naco de Porco"
    // and "Alcatra" are proper nouns that legitimately keep the same text across languages.
    // Flagging them caused an infinite DeepL retry loop on every page load.
    if (targetLang.toUpperCase() !== "PT") {
        const portugueseAllergenPhrases = /(cereais que contêm|frutos de casca rija|sementes de sésamo|dióxido de enxofre)/i;
        if (portugueseAllergenPhrases.test(translatedText)) {
            console.warn(`[Translation] INVALID: Translation contains Portuguese allergen phrase for language ${targetLang}: "${translatedText}"`);
            return false;
        }
        // Only flag if translation contains strictly-Portuguese chars (ã, õ) that are
        // not used in French/Spanish/etc. AND is identical to the original.
        const strictPortuguesePattern = /[ãõ]/;
        if (strictPortuguesePattern.test(translatedText) && translatedText === originalText) {
            console.warn(`[Translation] INVALID: Translation with Portuguese-only chars is identical to source for target ${targetLang}: "${translatedText}"`);
            return false;
        }
    }

    // For PT→non-PT: check common Portuguese food/menu words that should never appear
    // unchanged in another language. This is a targeted list of generic category words —
    // NOT proper dish names like "Naco de Porco" or "Alcatra", which legitimately keep
    // the same name in English/French.
    if (sourceLang.toUpperCase() === "PT" && targetLang.toUpperCase() !== "PT" && translatedText === originalText) {
        // Matches common PT food words optionally followed by "de/com/do/da/..." + anything.
        // E.g.: "Fruta", "Salada de Frutas", "Sopa do Dia", "Bolo de Chocolate"
        const ptCommonFoodWords = /^(fruta[s]?|salada[s]?|sopa[s]?|bolo[s]?|carne[s]?|legumes?|vegetal|vegetais|sobremesa[s]?|entrada[s]?|bebida[s]?|gelado[s]?|queijo[s]?|doce[s]?|prato[s]?|frango[s]?|aperitivo[s]?|charcutaria|couvert[s]?)(\s+(de|com|e|ao?|do?|da?|dos|das|no?|na?|para|em|com)\s+.+)?$/i;
        if (ptCommonFoodWords.test(translatedText.trim())) {
            console.warn(`[Translation] INVALID: Common Portuguese food word "${translatedText}" appears untranslated for target ${targetLang}`);
            return false;
        }
    }

    // For short allergen codes: check common Portuguese words that must be translated
    if (translatedText === originalText && originalText.length <= 10) {
        const portugueseAllergenWords = /^(ovos|leite|peixe|soja|aipo|mostarda|tremoço|nenhum|cereais|crustáceos|amendoins|moluscos)$/i;
        if (portugueseAllergenWords.test(translatedText.trim())) {
            console.warn(`[Translation] INVALID: Short allergen word "${translatedText}" appears untranslated for target ${targetLang}`);
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
    const lang = targetLang.toUpperCase();

    // Check if translation exists in cache
    const cached = await prisma.translation.findUnique({
        where: {
            entityType_entityId_language_field: {
                entityType,
                entityId,
                language: lang,
                field,
            },
        },
    });

    if (cached) {
        // Special pre-check for description fields from Portuguese source:
        // A description that is identical to the original Portuguese text is always a
        // failed translation — natural language descriptions can never legitimately be
        // the same across languages. This handles stale cache entries written during
        // the old DeepL "EN" target-language bug (bare "EN" was rejected by the API,
        // so the original PT text was silently cached as the "translation").
        // NOTE: We do NOT apply this to "name" fields because dish names like
        // "Naco de Porco", "Alcatra", etc. are proper nouns that legitimately keep
        // the same text in all languages.
        // Only retry if the cache entry is older than 5 minutes — prevents a
        // DeepL-failure loop where we delete → call DeepL → same bad result → cache →
        // delete again on the very next request.
        const RETRY_AFTER_MS = 5 * 60 * 1000;
        const cacheAgeMs = Date.now() - new Date(cached.updatedAt).getTime();
        const isStaleDescriptionCache =
            field === "description" &&
            sourceLang.toUpperCase() === "PT" &&
            lang !== "PT" &&
            cached.translated === originalText &&
            cacheAgeMs > RETRY_AFTER_MS;

        // Validate cached translation
        const isValid = !isStaleDescriptionCache && isTranslationValid(originalText, cached.translated, lang, sourceLang);

        if (isValid) {
            console.log(`[Translation] Cache HIT for ${entityType}/${entityId}/${field}/${lang}: "${cached.translated}"`);
            return cached.translated;
        }

        // Invalid translation found - delete it and retranslate
        if (isStaleDescriptionCache) {
            console.warn(`[Translation] Stale PT description cache for ${lang}: "${originalText.substring(0, 50)}..." — deleting and retranslating`);
        } else {
            console.warn(`[Translation] Cache HIT but INVALID for ${entityType}/${entityId}/${field}/${lang}: "${cached.translated}"`);
        }
        console.log(`[Translation] Deleting invalid translation and retranslating...`);

        await prisma.translation.delete({
            where: {
                entityType_entityId_language_field: {
                    entityType,
                    entityId,
                    language: lang,
                    field,
                },
            },
        }).catch(() => {
            // Ignore deletion errors
        });
    }

    console.log(`[Translation] Cache MISS for ${entityType}/${entityId}/${field}/${lang} - calling DeepL with source: "${originalText}"`);
    // Translation not cached, call DeepL
    const translated = await translateWithDeepL(originalText, lang, sourceLang);
    console.log(`[Translation] DeepL returned: "${translated}"`);

    // Validate new translation before caching
    const isValid = isTranslationValid(originalText, translated, lang, sourceLang);
    if (!isValid) {
        console.error(`[Translation] ERROR: DeepL returned invalid translation for ${lang}.`);
        console.log(`[Translation] Caching invalid translation to prevent repeated API calls. Will be auto-corrected when DeepL works.`);

        // Cache the invalid translation anyway to prevent repeated API calls
        // This saves money by not calling DeepL repeatedly for the same failing translation
        // The validation will catch it next time and retry if DeepL is working again
        try {
            await prisma.translation.create({
                data: {
                    entityType,
                    entityId,
                    language: lang,
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
                language: lang,
                field,
                translated,
            },
        });
        console.log(`[Translation] Cached new translation for ${entityType}/${entityId}/${field}/${lang}`);
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
            ? "Imagem gerada por IA - a apresentação real pode variar"
            : "A apresentação real pode variar";
    }

    // Use different field names for AI vs regular disclaimers
    const field = isAiGenerated ? "aiImageDisclaimer" : "imageDisclaimer";
    const sourceText = isAiGenerated
        ? "Imagem gerada por IA - a apresentação real pode variar"
        : "A apresentação real pode variar";

    console.log(`[Translation] Getting disclaimer translation - field: ${field}, targetLang: ${targetLang}, sourceText: "${sourceText}"`);

    // Use a static entity ID for UI translations (v2 to invalidate old "plate may vary" cache)
    const cached = await getOrCreateTranslation("menu", "ui-disclaimers-v2", field, sourceText, targetLang, "PT");

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
    section: { id: string; title: string; items: string[]; itemAllergens?: unknown },
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
    if (section.itemAllergens && typeof section.itemAllergens === 'object' && !Array.isArray(section.itemAllergens)) {
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
