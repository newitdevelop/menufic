/**
 * Supported languages in the application
 * Order matches keyboard shortcuts (1-6)
 */
export const LANGUAGES = [
    { code: "PT", flag: "🇵🇹", label: "Português", shortcut: "1" },
    { code: "EN", flag: "🇬🇧", label: "English", shortcut: "2" },
    { code: "ES", flag: "🇪🇸", label: "Español", shortcut: "3" },
    { code: "FR", flag: "🇫🇷", label: "Français", shortcut: "4" },
    { code: "DE", flag: "🇩🇪", label: "Deutsch", shortcut: "5" },
    { code: "IT", flag: "🇮🇹", label: "Italiano", shortcut: "6" },
] as const;

export type LanguageCode = typeof LANGUAGES[number]["code"];
