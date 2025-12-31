/**
 * Intelligent Translation Synchronization Script
 *
 * This script:
 * 1. Scans en.json as the source of truth
 * 2. Compares with other language files (pt, fr, es, de, it)
 * 3. Detects missing or updated keys
 * 4. Uses DeepL API to translate missing keys
 * 5. Updates all language files automatically
 *
 * Usage:
 *   npm run sync-translations
 *   or
 *   npx tsx scripts/sync-translations.ts
 */

import * as fs from "fs";
import * as path from "path";

// DeepL API configuration
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const DEEPL_API_URL = "https://api-free.deepl.com/v2/translate";

// Supported languages with their DeepL codes
const LANGUAGES = {
    pt: "PT-PT", // Portuguese (Portugal)
    fr: "FR",    // French
    es: "ES",    // Spanish
    de: "DE",    // German
    it: "IT",    // Italian
} as const;

type LanguageCode = keyof typeof LANGUAGES;

interface TranslationObject {
    [key: string]: string | TranslationObject;
}

/**
 * Recursively get all translation paths from a nested object
 */
function getAllPaths(obj: TranslationObject, prefix = ""): Map<string, string> {
    const paths = new Map<string, string>();

    for (const [key, value] of Object.entries(obj)) {
        const fullPath = prefix ? `${prefix}.${key}` : key;

        if (typeof value === "string") {
            paths.set(fullPath, value);
        } else if (typeof value === "object" && value !== null) {
            const nestedPaths = getAllPaths(value, fullPath);
            nestedPaths.forEach((val, path) => paths.set(path, val));
        }
    }

    return paths;
}

/**
 * Set a value in a nested object using dot notation path
 */
function setNestedValue(obj: TranslationObject, path: string, value: string): void {
    const parts = path.split(".");
    let current: any = obj;

    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i]!;
        if (!(part in current)) {
            current[part] = {};
        }
        current = current[part];
    }

    current[parts[parts.length - 1]!] = value;
}

/**
 * Get a value from a nested object using dot notation path
 */
function getNestedValue(obj: TranslationObject, path: string): string | undefined {
    const parts = path.split(".");
    let current: any = obj;

    for (const part of parts) {
        if (current && typeof current === "object" && part in current) {
            current = current[part];
        } else {
            return undefined;
        }
    }

    return typeof current === "string" ? current : undefined;
}

/**
 * Translate text using DeepL API
 */
async function translateText(text: string, targetLang: string): Promise<string> {
    if (!DEEPL_API_KEY) {
        console.warn(`⚠️  DEEPL_API_KEY not set. Using placeholder for ${targetLang}`);
        return `[${targetLang}] ${text}`;
    }

    try {
        const response = await fetch(DEEPL_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `DeepL-Auth-Key ${DEEPL_API_KEY}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                text,
                source_lang: "EN",
                target_lang: targetLang,
            }),
        });

        if (!response.ok) {
            throw new Error(`DeepL API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.translations[0].text;
    } catch (error) {
        console.error(`❌ Translation failed for "${text}" to ${targetLang}:`, error);
        return `[${targetLang}] ${text}`;
    }
}

/**
 * Batch translate multiple texts with rate limiting
 */
async function batchTranslate(
    texts: Map<string, string>,
    targetLang: string,
    delayMs = 100
): Promise<Map<string, string>> {
    const translations = new Map<string, string>();

    let count = 0;
    for (const [path, text] of texts.entries()) {
        count++;
        console.log(`  Translating ${count}/${texts.size}: ${path}`);
        const translated = await translateText(text, targetLang);
        translations.set(path, translated);

        // Rate limiting - wait between requests
        if (count < texts.size) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    return translations;
}

/**
 * Main synchronization function
 */
async function syncTranslations() {
    console.log("🌍 Starting translation synchronization...\n");

    const langDir = path.join(__dirname, "..", "src", "lang");

    // Read source (English) translations
    const enPath = path.join(langDir, "en.json");
    if (!fs.existsSync(enPath)) {
        console.error("❌ en.json not found!");
        process.exit(1);
    }

    const enContent = JSON.parse(fs.readFileSync(enPath, "utf-8")) as TranslationObject;
    const enPaths = getAllPaths(enContent);

    console.log(`📖 Source (en.json): ${enPaths.size} translation keys\n`);

    // Process each target language
    for (const [langCode, deeplCode] of Object.entries(LANGUAGES)) {
        console.log(`\n🔄 Processing ${langCode.toUpperCase()}...`);

        const langPath = path.join(langDir, `${langCode}.json`);
        let langContent: TranslationObject = {};

        // Load existing translations if file exists
        if (fs.existsSync(langPath)) {
            langContent = JSON.parse(fs.readFileSync(langPath, "utf-8"));
            console.log(`  ✅ Loaded existing ${langCode}.json`);
        } else {
            console.log(`  ℹ️  Creating new ${langCode}.json`);
        }

        const langPaths = getAllPaths(langContent);

        // Find missing keys
        const missingKeys = new Map<string, string>();
        for (const [path, enText] of enPaths.entries()) {
            if (!langPaths.has(path)) {
                missingKeys.set(path, enText);
            }
        }

        // Find updated keys (English text changed but translation exists)
        const updatedKeys = new Map<string, string>();
        for (const [path, enText] of enPaths.entries()) {
            const existingTranslation = getNestedValue(langContent, path);
            if (existingTranslation && existingTranslation.startsWith("[") && existingTranslation.includes("]")) {
                // Placeholder translation detected - needs real translation
                updatedKeys.set(path, enText);
            }
        }

        if (missingKeys.size === 0 && updatedKeys.size === 0) {
            console.log(`  ✅ ${langCode}.json is up to date!`);
            continue;
        }

        // Report what needs to be done
        if (missingKeys.size > 0) {
            console.log(`  📝 Missing keys: ${missingKeys.size}`);
        }
        if (updatedKeys.size > 0) {
            console.log(`  🔄 Updated keys: ${updatedKeys.size}`);
        }

        // Translate missing keys
        if (missingKeys.size > 0) {
            console.log(`  🌐 Translating ${missingKeys.size} missing keys to ${langCode.toUpperCase()}...`);
            const translations = await batchTranslate(missingKeys, deeplCode);

            for (const [path, translation] of translations.entries()) {
                setNestedValue(langContent, path, translation);
            }
        }

        // Translate updated keys
        if (updatedKeys.size > 0) {
            console.log(`  🌐 Re-translating ${updatedKeys.size} updated keys to ${langCode.toUpperCase()}...`);
            const translations = await batchTranslate(updatedKeys, deeplCode);

            for (const [path, translation] of translations.entries()) {
                setNestedValue(langContent, path, translation);
            }
        }

        // Write updated file
        fs.writeFileSync(
            langPath,
            JSON.stringify(langContent, null, 4) + "\n",
            "utf-8"
        );

        console.log(`  ✅ Saved ${langCode}.json`);
    }

    console.log("\n✅ Translation synchronization complete!\n");
}

// Run the script
syncTranslations().catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
});
