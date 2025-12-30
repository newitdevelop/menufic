import { getFestiveEmoji } from "./getFestiveEmoji";

/**
 * Color scheme for festive/seasonal menu packs
 * Returns colors matching the emoji colors of the current season
 */
export interface FestiveColorScheme {
    bg: string;
    border: string;
    sectionTitle: string;
    price: string;
    accent: string;
}

/**
 * Get dynamic festive color scheme based on current season/holiday
 * Colors are inspired by the emoji colors for each season
 */
export function getFestiveColors(): FestiveColorScheme {
    const emoji = getFestiveEmoji();

    // Map emojis to their representative color schemes
    switch (emoji) {
        case "🎄": // Christmas - Green & Red
            return {
                bg: "#f8faf9", // Very light mint/pine
                border: "#2d5a3d", // Deep forest green
                sectionTitle: "#c41e3a", // Rich Christmas red
                price: "#2d5a3d", // Deep forest green
                accent: "#d4af37", // Gold accent
            };

        case "🎆": // New Year - Blue & Gold
            return {
                bg: "#f5f9ff", // Very light blue
                border: "#1e3a8a", // Deep blue
                sectionTitle: "#d4af37", // Gold
                price: "#1e3a8a", // Deep blue
                accent: "#f59e0b", // Bright gold
            };

        case "💝": // Valentine's - Pink & Red
            return {
                bg: "#fff5f7", // Very light pink
                border: "#be123c", // Deep rose red
                sectionTitle: "#ec4899", // Hot pink
                price: "#be123c", // Deep rose red
                accent: "#f472b6", // Light pink accent
            };

        case "🐰": // Easter - Pastel Purple & Yellow
            return {
                bg: "#faf5ff", // Very light lavender
                border: "#7c3aed", // Purple
                sectionTitle: "#a855f7", // Bright purple
                price: "#6b21a8", // Deep purple
                accent: "#fbbf24", // Yellow accent
            };

        case "☀️": // Summer - Yellow & Orange
            return {
                bg: "#fffbeb", // Very light amber
                border: "#ea580c", // Deep orange
                sectionTitle: "#f59e0b", // Amber/gold
                price: "#c2410c", // Dark orange
                accent: "#fbbf24", // Bright yellow
            };

        case "🎃": // Halloween - Orange & Black
            return {
                bg: "#fff7ed", // Very light orange
                border: "#1a1a1a", // Black
                sectionTitle: "#ea580c", // Pumpkin orange
                price: "#1a1a1a", // Black
                accent: "#f97316", // Bright orange
            };

        case "🦃": // Thanksgiving - Brown & Orange
            return {
                bg: "#fef3c7", // Very light amber
                border: "#78350f", // Dark brown
                sectionTitle: "#d97706", // Amber
                price: "#78350f", // Dark brown
                accent: "#ea580c", // Orange accent
            };

        case "🌸": // Spring - Pink & Green
            return {
                bg: "#fdf4ff", // Very light pink
                border: "#166534", // Deep green
                sectionTitle: "#ec4899", // Pink
                price: "#166534", // Deep green
                accent: "#a855f7", // Purple accent
            };

        case "🍂": // Fall/Autumn - Orange & Brown
            return {
                bg: "#fff7ed", // Very light orange
                border: "#92400e", // Dark brown
                sectionTitle: "#ea580c", // Orange
                price: "#78350f", // Brown
                accent: "#f59e0b", // Amber accent
            };

        case "❄️": // Winter - Blue & White
            return {
                bg: "#f0f9ff", // Very light blue
                border: "#0369a1", // Deep blue
                sectionTitle: "#0ea5e9", // Sky blue
                price: "#0c4a6e", // Dark blue
                accent: "#38bdf8", // Light blue accent
            };

        case "🎉": // Default celebration - Purple & Gold
        default:
            return {
                bg: "#faf5ff", // Very light purple
                border: "#6b21a8", // Deep purple
                sectionTitle: "#a855f7", // Purple
                price: "#581c87", // Dark purple
                accent: "#d4af37", // Gold accent
            };
    }
}

/**
 * Professional (non-festive) color scheme for menu packs
 */
export function getProfessionalColors(): FestiveColorScheme {
    return {
        bg: "#fafafa", // Clean off-white
        border: "#d6d6d6", // Subtle gray border
        sectionTitle: "#1a472a", // Deep professional green
        price: "#1a1a1a", // Deep charcoal
        accent: "#1a472a", // Professional green
    };
}
