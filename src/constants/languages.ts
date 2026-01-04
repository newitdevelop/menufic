/**
 * Supported languages in the application
 * Order matches keyboard shortcuts (1-6)
 * Flag images from flagcdn.com for better cross-browser support
 */
export const LANGUAGES = [
    { code: "PT", countryCode: "pt", label: "Português", shortcut: "1" },
    { code: "EN", countryCode: "gb", label: "English", shortcut: "2" },
    { code: "ES", countryCode: "es", label: "Español", shortcut: "3" },
    { code: "FR", countryCode: "fr", label: "Français", shortcut: "4" },
    { code: "DE", countryCode: "de", label: "Deutsch", shortcut: "5" },
    { code: "IT", countryCode: "it", label: "Italiano", shortcut: "6" },
] as const;

export type LanguageCode = typeof LANGUAGES[number]["code"];

/**
 * Available flag sizes on flagcdn.com
 * Format: widthxheight
 * Note: srcset is only available for sizes up to 112x84 (based on flagcdn.com documentation)
 */
const FLAG_SIZES = {
    small: { width: 20, height: 15 },   // For small icons (supports srcset)
    medium: { width: 28, height: 21 },  // For medium icons (supports srcset)
    large: { width: 40, height: 30 },   // For large icons (supports srcset)
} as const;

/**
 * Get flag image URL from flagcdn.com with proper srcset for high-DPI displays
 * @param countryCode - ISO 3166-1 alpha-2 country code (lowercase)
 * @param size - Predefined size: 'small' (20x15), 'medium' (28x21), or 'large' (40x30)
 * @returns Object with src and srcset for responsive images
 */
export const getFlagUrl = (countryCode: string, size: 'small' | 'medium' | 'large' = 'medium') => {
    const { width, height } = FLAG_SIZES[size];

    // Calculate 2x and 3x sizes for srcset
    // All our predefined sizes support srcset (max is 40x30, which goes up to 120x90 for 3x)
    const width2x = width * 2;
    const height2x = height * 2;
    const width3x = width * 3;
    const height3x = height * 3;

    return {
        src: `https://flagcdn.com/${width}x${height}/${countryCode}.png`,
        srcSet: `https://flagcdn.com/${width2x}x${height2x}/${countryCode}.png 2x, https://flagcdn.com/${width3x}x${height3x}/${countryCode}.png 3x`,
        width,
        height,
    };
};
