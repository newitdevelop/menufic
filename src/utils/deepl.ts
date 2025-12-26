import { env } from "src/env/server.mjs";

/**
 * Translates text using DeepL API
 * @param text The text to translate
 * @param targetLang Target language code (e.g., 'PT', 'ES', 'FR', 'DE')
 * @param sourceLang Source language code (default: 'EN', or 'auto' for auto-detect)
 * @returns Translated text
 */
export async function translateWithDeepL(text: string, targetLang: string, sourceLang = "EN"): Promise<string> {
    if (!env.DEEPL_API_KEY) {
        console.warn("DEEPL_API_KEY not configured, returning original text");
        return text;
    }

    if (!text || text.trim() === "") {
        return text;
    }

    try {
        // Normalize target language for DeepL API
        // DeepL supports EN-GB and EN-US as target languages
        const normalizedTargetLang = targetLang.toUpperCase();

        const requestBody: Record<string, unknown> = {
            target_lang: normalizedTargetLang,
            text: [text],
        };

        // Only include source_lang if it's not auto-detect
        // For source_lang, DeepL uses "EN" (not EN-GB or EN-US)
        if (sourceLang !== "auto") {
            const normalizedSourceLang = sourceLang.toUpperCase().startsWith("EN") ? "EN" : sourceLang.toUpperCase();
            requestBody.source_lang = normalizedSourceLang;
        }

        const response = await fetch("https://api-free.deepl.com/v2/translate", {
            body: JSON.stringify(requestBody),
            headers: {
                "Authorization": `DeepL-Auth-Key ${env.DEEPL_API_KEY}`,
                "Content-Type": "application/json",
            },
            method: "POST",
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("DeepL API error:", error);
            return text; // Return original text on error
        }

        const data = (await response.json()) as { translations: Array<{ text: string }> };
        return data.translations[0]?.text || text;
    } catch (error) {
        console.error("DeepL translation failed:", error);
        return text; // Return original text on error
    }
}

/**
 * Supported DeepL language codes
 */
export const SUPPORTED_LANGUAGES = {
    "EN-GB": "English (British)",
    "EN-US": "English (American)",
    PT: "Portuguese",
    ES: "Spanish",
    FR: "French",
    DE: "German",
    IT: "Italian",
    NL: "Dutch",
    PL: "Polish",
    RU: "Russian",
    JA: "Japanese",
    ZH: "Chinese",
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;
