import { env } from "src/env/server.mjs";
import { allergenCodes } from "src/utils/validators";

/**
 * OpenAI Service Configuration
 * Centralized configuration for all OpenAI API calls
 *
 * Model Selection Rationale (as of January 2025):
 * - Text Analysis: gpt-4o-mini - Best cost/performance for structured outputs like allergen detection
 * - Image Generation: dall-e-3 - Latest DALL-E model with best quality
 *
 * Update these models as newer versions become available
 */
export const OPENAI_CONFIG = {
    /**
     * Model for text analysis tasks (allergen detection, content analysis, etc.)
     * gpt-4o-mini: Affordable and intelligent - ideal for structured JSON outputs
     * Cost: ~$0.00006 per request for allergen detection
     */
    TEXT_MODEL: "gpt-4o-mini" as const,

    /**
     * Model for image generation tasks
     * dall-e-3: Latest DALL-E model with superior quality and prompt following
     * Cost: $0.04 per standard 1024x1024 image, $0.08 for HD
     */
    IMAGE_MODEL: "dall-e-3" as const,

    /**
     * Image generation settings optimized for menu item display (400x400px in app)
     */
    IMAGE_SETTINGS: {
        size: "1024x1024" as const, // Smallest DALL-E 3 size, sufficient for 400x400 display
        quality: "standard" as const, // Standard quality ($0.04) vs HD ($0.08)
    },
} as const;

/**
 * Check if OpenAI API is available
 */
export function isOpenAIAvailable(): boolean {
    return !!env.OPENAI_API_KEY;
}

interface AllergenDetectionResponse {
    allergens: (typeof allergenCodes)[number][];
    reasoning?: string;
}

/**
 * Detects allergens in a menu item using OpenAI GPT
 * @param itemName - Name of the menu item
 * @param itemDescription - Description of the menu item
 * @returns Array of detected allergen codes
 */
export async function detectAllergensWithAI(
    itemName: string,
    itemDescription: string
): Promise<(typeof allergenCodes)[number][]> {
    if (!isOpenAIAvailable()) {
        throw new Error("OpenAI API key not configured. Set OPENAI_API_KEY environment variable.");
    }

    const availableAllergens = allergenCodes.filter((code) => code !== "none");

    const systemPrompt = `You are an expert food allergen detection assistant. Analyze menu items and identify ALL allergens present according to EU Regulation 1169/2011.

The 14 EU mandatory allergens:
1. cereals - Gluten-containing cereals (wheat, rye, barley, oats, spelt, kamut). Note: Rice, corn, quinoa are gluten-free.
2. crustaceans - Crab, lobster, prawns, shrimp, crayfish
3. eggs - All egg products
4. fish - All fish and fish-based products (including fish sauce, worcestershire sauce)
5. peanuts - Peanuts and peanut products
6. soybeans - Soy products (soy sauce, tofu, tempeh, miso)
7. milk - All dairy products (cheese, butter, cream, yogurt, whey)
8. nuts - Tree nuts (almonds, hazelnuts, walnuts, cashews, pecans, pistachios, pine nuts, etc.)
9. celery - Celery and celery products
10. mustard - Mustard seeds, powder, sauce
11. sesame - Sesame seeds and products
12. sulphites - In wine, dried fruits, vinegars (>10mg/kg)
13. lupin - Lupin flour and products
14. molluscs - Mussels, oysters, clams, squid, octopus, snails

Use your culinary knowledge to detect allergens from:
- Explicitly mentioned ingredients
- Traditional recipe components
- Common preparation methods
- Typical sauces and condiments
- Hidden ingredients in standard dishes

Return JSON format:
{
  "allergens": ["code1", "code2"],
  "reasoning": "Brief explanation"
}

If no allergens detected: {"allergens": [], "reasoning": "No allergens detected"}`;

    const userPrompt = `Analyze this menu item for all allergens:

NAME: "${itemName}"
DESCRIPTION: "${itemDescription}"

Identify all allergens using your knowledge of ingredients and traditional recipes.`;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: OPENAI_CONFIG.TEXT_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                temperature: 0.3, // Lower temperature for more consistent results
                max_tokens: 500,
                response_format: { type: "json_object" }, // Force JSON response
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                `OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
            );
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error("No response from OpenAI API");
        }

        // Parse the JSON response
        const result: AllergenDetectionResponse = JSON.parse(content);

        // Validate allergen codes
        const validAllergens = result.allergens.filter((code) =>
            availableAllergens.includes(code as any)
        ) as (typeof allergenCodes)[number][];

        // Log reasoning for debugging
        if (result.reasoning) {
            console.log(`AI Allergen Detection - ${itemName}:`, result.reasoning);
        }

        // If no allergens detected, return ["none"] (required field for edible items)
        if (validAllergens.length === 0) {
            return ["none"];
        }

        return validAllergens;
    } catch (error) {
        console.error("Error detecting allergens with OpenAI:", error);
        throw new Error(`Failed to detect allergens: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

/**
 * Check if OpenAI allergen detection is available
 * @returns true if OpenAI API key is configured
 */
export function isAllergenAIAvailable(): boolean {
    return isOpenAIAvailable();
}

/**
 * Generate a realistic food image using DALL-E 3
 * Downloads the image from OpenAI and converts to base64 data URL
 * @param itemName Name of the menu item
 * @param itemDescription Description of the menu item
 * @returns Base64 data URL (data:image/png;base64,...)
 */
export async function generateFoodImage(itemName: string, itemDescription: string): Promise<string> {
    if (!isOpenAIAvailable()) {
        throw new Error("OpenAI API key not configured. Set OPENAI_API_KEY environment variable.");
    }

    // Craft a detailed prompt for professional food photography
    const prompt = `Professional food photography: ${itemName}. ${itemDescription}.
High-quality restaurant menu photo, beautifully plated on white dish,
shot from 45-degree angle, natural lighting, shallow depth of field,
appetizing presentation, Michelin-star quality, photorealistic.`;

    try {
        const response = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: OPENAI_CONFIG.IMAGE_MODEL,
                prompt,
                n: 1,
                size: OPENAI_CONFIG.IMAGE_SETTINGS.size,
                quality: OPENAI_CONFIG.IMAGE_SETTINGS.quality,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                `OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
            );
        }

        const data = await response.json();
        const imageUrl = data.data?.[0]?.url;

        if (!imageUrl) {
            throw new Error("No image URL returned from OpenAI API");
        }

        // Download the image from OpenAI on the backend to avoid CORS issues
        const imageResponse = await fetch(imageUrl);

        if (!imageResponse.ok) {
            throw new Error(`Failed to download generated image: ${imageResponse.status} ${imageResponse.statusText}`);
        }

        // Convert to buffer and then to base64 data URL
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64 = Buffer.from(imageBuffer).toString('base64');
        const dataUrl = `data:image/png;base64,${base64}`;

        return dataUrl;
    } catch (error) {
        console.error("Error generating image with DALL-E:", error);
        throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

/**
 * Check if AI image generation is available
 * @returns true if OpenAI API key is configured
 */
export function isImageAIAvailable(): boolean {
    return isOpenAIAvailable();
}
