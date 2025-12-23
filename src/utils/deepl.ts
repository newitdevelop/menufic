import { env } from "src/env/server.mjs";

/**
 * Translates text using DeepL API
 * @param text The text to translate
 * @param targetLang Target language code (e.g., 'PT', 'ES', 'FR', 'DE')
 * @param sourceLang Source language code (default: 'EN', or 'auto' for auto-detect)
 * @returns Translated text
 */
export async function translateWithDeepL(
    text: string,
    targetLang: string,
    sourceLang: string = "EN"
): Promise<string> {
    if (!env.DEEPL_API_KEY) {
        console.warn("DEEPL_API_KEY not configured, returning original text");
        return text;
    }

    if (!text || text.trim() === "") {
        return text;
    }

    try {
        const response = await fetch("https://api-free.deepl.com/v2/translate", {
            method: "POST",
            headers: {
                Authorization: `DeepL-Auth-Key ${env.DEEPL_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                source_lang: sourceLang === "auto" ? undefined : sourceLang.toUpperCase(),
                target_lang: targetLang.toUpperCase(),
                text: [text],
            }),
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
