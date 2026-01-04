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
 * Get flag image URL from flagcdn.com
 * @param countryCode - ISO 3166-1 alpha-2 country code (lowercase)
 * @param size - Size of the flag image (16, 24, 32, 48, 64)
 */
export const getFlagUrl = (countryCode: string, size: 16 | 24 | 32 | 48 | 64 = 32) => {
    return `https://flagcdn.com/w${size}/${countryCode}.png`;
};
