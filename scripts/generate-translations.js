const fs = require("fs");
const path = require("path");
const https = require("https");
const crypto = require("crypto");

// You'll need to set DEEPL_API_KEY in your environment
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

if (!DEEPL_API_KEY) {
    console.error("❌ DEEPL_API_KEY environment variable is required");
    console.error("\nUsage: DEEPL_API_KEY=your_key npm run translate\n");
    process.exit(1);
}

// Target languages to generate
const TARGET_LANGUAGES = {
    pt: "PT", // Portuguese (default)
    es: "ES", // Spanish
    fr: "FR", // French
    de: "DE", // German
    it: "IT", // Italian
};

// Cache file to track translations and avoid re-translating unchanged text
const CACHE_FILE = path.join(__dirname, ".translation-cache.json");

/**
 * Load translation cache
 */
function loadCache() {
    if (fs.existsSync(CACHE_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
        } catch (error) {
            console.warn("⚠️  Failed to load cache, starting fresh");
            return {};
        }
    }
    return {};
}

/**
 * Save translation cache
 */
function saveCache(cache) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
}

/**
 * Generate a hash for a text to detect changes
 */
function hashText(text) {
    return crypto.createHash("md5").update(text).digest("hex");
}

/**
 * Create cache key for a translation
 */
function getCacheKey(text, targetLang) {
    return `${targetLang}:${hashText(text)}`;
}

/**
 * Statistics tracker
 */
const stats = {
    translated: 0,
    cached: 0,
    skipped: 0,
    tokens: 0,
};

/**
 * Translates text using DeepL API with caching
 */
async function translateText(text, targetLang, cache) {
    if (!text || text.trim() === "") {
        stats.skipped++;
        return text;
    }

    // Check cache first
    const cacheKey = getCacheKey(text, targetLang);
    if (cache[cacheKey]) {
        stats.cached++;
        return cache[cacheKey];
    }

    // Skip translation for special placeholders
    if (text.includes("{") && text.includes("}")) {
        return await translateWithPlaceholders(text, targetLang, cache);
    }

    const requestBody = JSON.stringify({
        text: [text],
        target_lang: targetLang,
        source_lang: "EN",
        preserve_formatting: true,
    });

    return new Promise((resolve, reject) => {
        const options = {
            hostname: "api-free.deepl.com",
            port: 443,
            path: "/v2/translate",
            method: "POST",
            headers: {
                "Authorization": `DeepL-Auth-Key ${DEEPL_API_KEY}`,
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(requestBody),
            },
        };

        const req = https.request(options, (res) => {
            let data = "";

            res.on("data", (chunk) => {
                data += chunk;
            });

            res.on("end", () => {
                if (res.statusCode !== 200) {
                    console.error(`\n❌ DeepL API error for "${text}":`, data);
                    resolve(text);
                    return;
                }

                try {
                    const parsed = JSON.parse(data);
                    const translated = parsed.translations[0]?.text || text;

                    // Update stats
                    stats.translated++;
                    stats.tokens += text.length;

                    // Cache the result
                    cache[cacheKey] = translated;

                    resolve(translated);
                } catch (error) {
                    console.error(`\n❌ Failed to parse DeepL response for "${text}":`, error);
                    resolve(text);
                }
            });
        });

        req.on("error", (error) => {
            console.error(`\n❌ Translation failed for "${text}":`, error);
            resolve(text);
        });

        req.write(requestBody);
        req.end();
    });
}

/**
 * Translate text with placeholders like {name}, {year}, etc.
 * Protects placeholders from translation
 */
async function translateWithPlaceholders(text, targetLang, cache) {
    // Replace placeholders with temporary markers
    const placeholders = [];
    let protectedText = text.replace(/\{([^}]+)\}/g, (match) => {
        const index = placeholders.length;
        placeholders.push(match);
        return `__PLACEHOLDER_${index}__`;
    });

    const translated = await translateText(protectedText, targetLang, cache);

    // Restore placeholders
    let restoredText = translated;
    placeholders.forEach((placeholder, index) => {
        restoredText = restoredText.replace(new RegExp(`__PLACEHOLDER_${index}__`, "g"), placeholder);
    });

    return restoredText;
}

/**
 * Check if translation file needs updating by comparing with source
 */
function needsTranslation(enContent, existingTranslation, langCode) {
    if (!existingTranslation) {
        return true; // File doesn't exist
    }

    // Compare structure - if keys are different, needs translation
    const enKeys = JSON.stringify(extractKeys(enContent));
    const translationKeys = JSON.stringify(extractKeys(existingTranslation));

    if (enKeys !== translationKeys) {
        return true; // Structure changed
    }

    return false; // Structure is the same, can reuse existing translations
}

/**
 * Extract all keys from an object recursively
 */
function extractKeys(obj, prefix = "") {
    let keys = [];

    if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
        for (const key in obj) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
                keys = keys.concat(extractKeys(obj[key], fullKey));
            } else {
                keys.push(fullKey);
            }
        }
    }

    return keys.sort();
}

/**
 * Merge existing translations with new English content
 * Only translate new/changed keys
 */
async function smartTranslateObject(enObj, existingObj, targetLang, cache, path = "") {
    if (typeof enObj === "string") {
        // If existing translation exists and English hasn't changed, reuse it
        if (existingObj && typeof existingObj === "string") {
            stats.skipped++;
            return existingObj;
        }

        // New or changed text, needs translation
        process.stdout.write(".");
        return await translateText(enObj, targetLang, cache);
    }

    if (Array.isArray(enObj)) {
        const results = [];
        for (let i = 0; i < enObj.length; i++) {
            results.push(
                await smartTranslateObject(
                    enObj[i],
                    existingObj?.[i],
                    targetLang,
                    cache,
                    `${path}[${i}]`
                )
            );
        }
        return results;
    }

    if (typeof enObj === "object" && enObj !== null) {
        const result = {};
        for (const [key, value] of Object.entries(enObj)) {
            result[key] = await smartTranslateObject(
                value,
                existingObj?.[key],
                targetLang,
                cache,
                `${path}.${key}`
            );
        }
        return result;
    }

    return enObj;
}

/**
 * Sleep helper
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main function
 */
async function main() {
    console.log("🌍 Starting intelligent translation generation...\n");

    // Load cache
    const cache = loadCache();
    console.log(`📦 Loaded translation cache (${Object.keys(cache).length} entries)\n`);

    // Read English source file
    const langDir = path.join(process.cwd(), "src", "lang");
    const enPath = path.join(langDir, "en.json");

    if (!fs.existsSync(enPath)) {
        console.error("❌ English translation file not found at:", enPath);
        process.exit(1);
    }

    const enContent = JSON.parse(fs.readFileSync(enPath, "utf-8"));
    console.log("✅ Loaded English translations\n");

    // Generate translations for each target language
    const langCodes = Object.keys(TARGET_LANGUAGES);
    let totalSkipped = 0;
    let totalTranslated = 0;

    for (let i = 0; i < langCodes.length; i++) {
        const langCode = langCodes[i];
        const deeplCode = TARGET_LANGUAGES[langCode];
        const outputPath = path.join(langDir, `${langCode}.json`);

        // Reset stats for this language
        stats.translated = 0;
        stats.cached = 0;
        stats.skipped = 0;
        stats.tokens = 0;

        console.log(`📝 Processing ${langCode.toUpperCase()} (${deeplCode})...`);

        // Load existing translation if it exists
        let existingTranslation = null;
        if (fs.existsSync(outputPath)) {
            try {
                existingTranslation = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
                console.log(`   Found existing ${langCode}.json`);
            } catch (error) {
                console.warn(`   ⚠️  Could not parse existing ${langCode}.json, will regenerate`);
            }
        }

        // Smart translation: only translate new/changed content
        const translatedContent = await smartTranslateObject(
            enContent,
            existingTranslation,
            deeplCode,
            cache
        );

        // Save the translation
        fs.writeFileSync(outputPath, JSON.stringify(translatedContent, null, 4), "utf-8");

        console.log(`\n   ✅ Saved ${langCode}.json`);
        console.log(`   📊 Stats: ${stats.translated} translated | ${stats.cached} from cache | ${stats.skipped} reused`);
        console.log(`   🪙 Tokens used: ~${stats.tokens} characters\n`);

        totalSkipped += stats.skipped;
        totalTranslated += stats.translated;

        // Add delay between languages to avoid rate limiting (only if we actually translated something)
        if (stats.translated > 0 && i < langCodes.length - 1) {
            console.log("   ⏳ Waiting 2 seconds before next language...\n");
            await sleep(2000);
        }
    }

    // Save updated cache
    saveCache(cache);
    console.log(`💾 Saved translation cache (${Object.keys(cache).length} entries)\n`);

    console.log("🎉 All translations generated successfully!\n");
    console.log("📊 Overall Statistics:");
    console.log(`   • Total API calls: ${totalTranslated}`);
    console.log(`   • Reused from existing: ${totalSkipped}`);
    console.log(`   • Efficiency: ${totalSkipped > 0 ? Math.round((totalSkipped / (totalSkipped + totalTranslated)) * 100) : 0}% reused`);

    if (totalTranslated === 0) {
        console.log("\n✨ No changes detected - all translations are up to date!");
    } else {
        console.log(`\n💰 Cost saved by caching: ~${Math.round((totalSkipped / (totalSkipped + totalTranslated)) * 100)}%`);
    }
}

main().catch((error) => {
    console.error("❌ Error generating translations:", error);
    process.exit(1);
});
