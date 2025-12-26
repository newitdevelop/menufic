import { env } from "src/env/server.mjs";
import { allergenCodes } from "src/utils/validators";

/**
 * OpenAI Service for AI-powered allergen detection
 */

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
    // Check if OpenAI API key is configured
    if (!env.OPENAI_API_KEY) {
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
                model: "gpt-4o-mini", // Using mini for cost-effectiveness
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
    return !!env.OPENAI_API_KEY;
}
