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

    const systemPrompt = `You are an expert food allergen detection assistant specializing in European food safety regulations. Your job is to analyze menu items and identify ALL allergens that are likely present based on EU Regulation 1169/2011.

CRITICAL RULES:
1. Be ACCURATE - Only detect allergens that are actually in the dish
2. Be THOROUGH - Don't miss any allergens in explicitly mentioned ingredients
3. Consider TRADITIONAL RECIPES - Know what typically goes into classic dishes
4. Be SPECIFIC to the exact dish described - don't make assumptions beyond what's reasonable

The 14 EU mandatory allergens you must detect:
1. cereals - Cereals containing gluten (wheat, rye, barley, oats, spelt, kamut, khorasan)
   Examples: bread, pasta, pizza dough, breaded items, soy sauce, beer batter
2. crustaceans - Crustaceans and products thereof
   Examples: crab, lobster, prawns, shrimp, langoustine, crayfish
3. eggs - Eggs and egg products
   Examples: mayonnaise, pasta (fresh), meringue, batter, aioli
4. fish - Fish and fish products
   Examples: all fish species, fish sauce, worcestershire sauce, caesar dressing
5. peanuts - Peanuts and peanut products
   Examples: peanut butter, satay sauce, peanut oil
6. soybeans - Soybeans and soy products
   Examples: soy sauce, tofu, edamame, tempeh, miso
7. milk - Milk and dairy products (including lactose)
   Examples: cheese, butter, cream, yogurt, whey, milk powder
8. nuts - Tree nuts (almonds, hazelnuts, walnuts, cashews, pecans, pistachios, macadamia, brazil nuts, pine nuts)
   Examples: pesto (pine nuts), almond milk, nut oils
9. celery - Celery and celery products
   Examples: celery stalks, celery salt, celery in stocks/broths
10. mustard - Mustard and mustard products
    Examples: mustard sauce, mustard powder, vinaigrette
11. sesame - Sesame seeds and sesame products
    Examples: tahini, sesame oil, hamburger buns with seeds
12. sulphites - Sulphur dioxide and sulphites at >10mg/kg or >10mg/litre
    Examples: wine, dried fruits, some vinegars, processed potatoes
13. lupin - Lupin and lupin products
    Examples: lupin flour, lupin seeds (rare but check)
14. molluscs - Molluscs and mollusc products
    Examples: mussels, oysters, clams, squid, octopus, snails

Return ONLY a JSON object:
{
  "allergens": ["code1", "code2"],
  "reasoning": "Concise explanation of detected allergens"
}

If NO allergens are present, return: {"allergens": [], "reasoning": "No major allergens detected"}`;

    const userPrompt = `Analyze this EXACT menu item for allergens:

NAME: "${itemName}"
DESCRIPTION: "${itemDescription}"

Detect allergens by analyzing:
1. EXPLICIT INGREDIENTS mentioned in the description
2. TRADITIONAL/TYPICAL ingredients for dishes with this name
3. PREPARATION METHODS that introduce allergens (e.g., "creamy" = milk, "breaded" = cereals)
4. SAUCES AND CONDIMENTS that commonly contain allergens
5. HIDDEN INGREDIENTS in standard recipes

IMPORTANT:
- Focus on what THIS SPECIFIC DISH contains based on its name and description
- Don't flag allergens from unlikely cross-contamination
- If the description says "gluten-free" or explicitly excludes something, don't flag it
- Be precise to the actual ingredients mentioned or typically used

Return ONLY the JSON response with allergen codes and brief reasoning.`;

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

        // If no allergens detected, return ["none"]
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
