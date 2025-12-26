import type { AbstractIntlMessages } from "next-intl";
import enMessages from "src/lang/en.json";

/**
 * Safely load translation messages for a given language
 * Falls back to English if the requested language file doesn't exist
 *
 * This allows the app to build and run without requiring all translation files
 * Translation files can be generated later using: npm run translate
 */
export async function loadTranslations(locale?: string): Promise<AbstractIntlMessages> {
    // Default to English
    if (!locale || locale.toLowerCase() === "en") {
        return enMessages;
    }

    // Try to load the requested language
    try {
        const messages = await import(`src/lang/${locale.toLowerCase()}.json`);
        return messages.default;
    } catch (error) {
        // Language file doesn't exist, fall back to English
        console.warn(
            `Translation file for "${locale}" not found, falling back to English. ` +
            `Run "npm run translate" to generate missing translations.`
        );
        return enMessages;
    }
}
