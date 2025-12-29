/**
 * Get the appropriate festive emoji based on the current date and season
 * Detects holidays and seasons automatically
 */
export function getFestiveEmoji(): string {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const day = now.getDate();

    // Christmas season (December 1 - December 31)
    if (month === 11) {
        return "🎄";
    }

    // New Year's (January 1-7)
    if (month === 0 && day <= 7) {
        return "🎆";
    }

    // Valentine's Day (February 10-14)
    if (month === 1 && day >= 10 && day <= 14) {
        return "💝";
    }

    // Easter (approximate - March 15 to April 30)
    // Note: Easter date varies, this is a broad range
    if ((month === 2 && day >= 15) || (month === 3 && day <= 30)) {
        return "🐰";
    }

    // Summer (June 21 - September 21)
    if (month === 5 || month === 6 || month === 7 || (month === 8 && day <= 21)) {
        return "☀️";
    }

    // Halloween (October 20-31)
    if (month === 9 && day >= 20) {
        return "🎃";
    }

    // Thanksgiving (November, approximate)
    if (month === 10) {
        return "🦃";
    }

    // Spring (March 21 - June 20)
    if ((month === 2 && day >= 21) || month === 3 || month === 4 || (month === 5 && day <= 20)) {
        return "🌸";
    }

    // Fall/Autumn (September 22 - December 20)
    if ((month === 8 && day >= 22) || month === 9 || (month === 10) || (month === 11 && day <= 20)) {
        return "🍂";
    }

    // Winter (December 21 - March 20) - not covered by Christmas
    if ((month === 11 && day >= 21) || month === 0 || month === 1 || (month === 2 && day <= 20)) {
        return "❄️";
    }

    // Default fallback (party/celebration)
    return "🎉";
}
