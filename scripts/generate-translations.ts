import * as fs from "fs";
import * as path from "path";

// You'll need to set DEEPL_API_KEY in your environment
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

if (!DEEPL_API_KEY) {
    console.error("❌ DEEPL_API_KEY environment variable is required");
    process.exit(1);
}

// Target languages to generate
const TARGET_LANGUAGES = {
    pt: "PT", // Portuguese (default)
    es: "ES", // Spanish
    fr: "FR", // French
    de: "DE", // German
    it: "IT", // Italian
} as const;

/**
 * Translates text using DeepL API
 */
async function translateText(text: string, targetLang: string): Promise<string> {
    if (!text || text.trim() === "") {
        return text;
    }

    // Skip translation for special placeholders
    if (text.includes("{") && text.includes("}")) {
        // Has interpolation - need careful handling
        return await translateWithPlaceholders(text, targetLang);
    }

    try {
        const response = await fetch("https://api-free.deepl.com/v2/translate", {
            method: "POST",
            headers: {
                "Authorization": `DeepL-Auth-Key ${DEEPL_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                text: [text],
                target_lang: targetLang,
                source_lang: "EN",
                preserve_formatting: true,
                tag_handling: "xml",
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error(`DeepL API error for "${text}":`, error);
            return text;
        }

        const data = (await response.json()) as { translations: Array<{ text: string }> };
        return data.translations[0]?.text || text;
    } catch (error) {
        console.error(`Translation failed for "${text}":`, error);
        return text;
    }
}

/**
 * Translate text with placeholders like {name}, {year}, etc.
 * Protects placeholders from translation
 */
async function translateWithPlaceholders(text: string, targetLang: string): Promise<string> {
    // Replace placeholders with XML tags that DeepL preserves
    const placeholders: string[] = [];
    let protectedText = text.replace(/\{([^}]+)\}/g, (match) => {
        const index = placeholders.length;
        placeholders.push(match);
        return `<x id="${index}"/>`;
    });

    const translated = await translateText(protectedText, targetLang);

    // Restore placeholders
    let restoredText = translated;
    placeholders.forEach((placeholder, index) => {
        restoredText = restoredText.replace(new RegExp(`<x id="${index}"\\s*/>`, "g"), placeholder);
    });

    return restoredText;
}

/**
 * Recursively translate an object structure
 */
async function translateObject(obj: any, targetLang: string, path = ""): Promise<any> {
    if (typeof obj === "string") {
        process.stdout.write(".");
        return await translateText(obj, targetLang);
    }

    if (Array.isArray(obj)) {
        return Promise.all(obj.map((item, i) => translateObject(item, targetLang, `${path}[${i}]`)));
    }

    if (typeof obj === "object" && obj !== null) {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = await translateObject(value, targetLang, `${path}.${key}`);
        }
        return result;
    }

    return obj;
}

/**
 * Main function
 */
async function main() {
    console.log("🌍 Starting translation generation...\n");

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
    for (const [langCode, deeplCode] of Object.entries(TARGET_LANGUAGES)) {
        console.log(`📝 Translating to ${langCode.toUpperCase()} (${deeplCode})...`);

        const translatedContent = await translateObject(enContent, deeplCode);

        const outputPath = path.join(langDir, `${langCode}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(translatedContent, null, 4), "utf-8");

        console.log(`\n✅ Saved ${langCode}.json\n`);

        // Add delay between languages to avoid rate limiting
        if (langCode !== Object.keys(TARGET_LANGUAGES).pop()) {
            console.log("⏳ Waiting 2 seconds before next language...\n");
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
    }

    console.log("🎉 All translations generated successfully!");
}

main().catch((error) => {
    console.error("❌ Error generating translations:", error);
    process.exit(1);
});
