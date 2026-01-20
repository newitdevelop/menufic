/**
 * Schedule Service
 * Utility functions for checking if menus/banners should be displayed based on their schedule settings
 */

export interface ScheduleConfig {
    scheduleType: 'ALWAYS' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'PERIOD';
    dailyStartTime?: string | null;
    dailyEndTime?: string | null;
    weeklyDays?: number[];
    monthlyDays?: number[];
    monthlyWeekday?: number | null;
    monthlyWeekdayOrdinal?: number | null;
    yearlyStartDate?: string | null;
    yearlyEndDate?: string | null;
    periodStartDate?: Date | null;
    periodEndDate?: Date | null;
}

/**
 * Get the ordinal occurrence of a weekday in the given month
 * e.g., "Is Jan 20, 2025 the 3rd Monday of January?"
 * @param date - The date to check
 * @returns The ordinal (1=first, 2=second, 3=third, 4=fourth, 5=fifth)
 */
function getWeekdayOrdinalInMonth(date: Date): number {
    const dayOfMonth = date.getDate();
    return Math.ceil(dayOfMonth / 7);
}

/**
 * Check if the given date is the last occurrence of its weekday in the month
 * e.g., "Is Jan 27, 2025 the last Monday of January?"
 * @param date - The date to check
 * @returns true if it's the last occurrence of that weekday in the month
 */
function isLastWeekdayOfMonth(date: Date): boolean {
    const dayOfMonth = date.getDate();
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    // If adding 7 days would go past the end of the month, this is the last occurrence
    return dayOfMonth + 7 > daysInMonth;
}

/**
 * Parse time string "HH:mm" to minutes since midnight
 */
function parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Get current time in minutes since midnight
 */
function getCurrentTimeMinutes(now: Date): number {
    return now.getHours() * 60 + now.getMinutes();
}

/**
 * Check if the current time is within the daily time range
 */
function isWithinDailyTimeRange(
    now: Date,
    startTime?: string | null,
    endTime?: string | null
): boolean {
    if (!startTime || !endTime) {
        return true; // No time restriction
    }

    const currentMinutes = getCurrentTimeMinutes(now);
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);

    // Handle overnight ranges (e.g., 22:00 to 02:00)
    if (endMinutes < startMinutes) {
        return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * Check if today matches the weekly schedule
 */
function matchesWeeklySchedule(now: Date, weeklyDays?: number[]): boolean {
    if (!weeklyDays || weeklyDays.length === 0) {
        return true; // No days specified means all days
    }
    const dayOfWeek = now.getDay(); // 0=Sunday, 6=Saturday
    return weeklyDays.includes(dayOfWeek);
}

/**
 * Check if today matches the monthly schedule (specific days of month)
 */
function matchesMonthlyDaysSchedule(now: Date, monthlyDays?: number[]): boolean {
    if (!monthlyDays || monthlyDays.length === 0) {
        return true; // No days specified
    }
    const dayOfMonth = now.getDate();
    return monthlyDays.includes(dayOfMonth);
}

/**
 * Check if today matches the monthly weekday schedule (e.g., "third Monday")
 * @param now - Current date
 * @param monthlyWeekday - Day of week (0=Sunday, 6=Saturday)
 * @param monthlyWeekdayOrdinal - Which occurrence (1=first, 2=second, 3=third, 4=fourth, -1=last)
 */
function matchesMonthlyWeekdaySchedule(
    now: Date,
    monthlyWeekday?: number | null,
    monthlyWeekdayOrdinal?: number | null
): boolean {
    // If no weekday specified, check monthly days instead
    if (monthlyWeekday === null || monthlyWeekday === undefined) {
        return true;
    }

    const currentDayOfWeek = now.getDay();

    // First check: is today the correct day of the week?
    if (currentDayOfWeek !== monthlyWeekday) {
        return false;
    }

    // If no ordinal specified, any occurrence of that weekday matches
    if (monthlyWeekdayOrdinal === null || monthlyWeekdayOrdinal === undefined) {
        return true;
    }

    // Check if it's the specified ordinal occurrence
    if (monthlyWeekdayOrdinal === -1) {
        // Check for "last" occurrence
        return isLastWeekdayOfMonth(now);
    }

    // Check for specific ordinal (1st, 2nd, 3rd, 4th)
    const currentOrdinal = getWeekdayOrdinalInMonth(now);
    return currentOrdinal === monthlyWeekdayOrdinal;
}

/**
 * Check if today matches the yearly schedule (date range within each year)
 * @param now - Current date
 * @param yearlyStartDate - Start date in "MM-DD" format
 * @param yearlyEndDate - End date in "MM-DD" format
 */
function matchesYearlySchedule(
    now: Date,
    yearlyStartDate?: string | null,
    yearlyEndDate?: string | null
): boolean {
    if (!yearlyStartDate || !yearlyEndDate) {
        return true;
    }

    const currentMonth = now.getMonth() + 1; // 1-12
    const currentDay = now.getDate();
    const currentMMDD = currentMonth * 100 + currentDay; // e.g., 1225 for Dec 25

    const [startMonth, startDay] = yearlyStartDate.split('-').map(Number);
    const [endMonth, endDay] = yearlyEndDate.split('-').map(Number);
    const startMMDD = startMonth * 100 + startDay;
    const endMMDD = endMonth * 100 + endDay;

    // Handle year-spanning ranges (e.g., Dec 24 to Jan 6)
    if (endMMDD < startMMDD) {
        return currentMMDD >= startMMDD || currentMMDD <= endMMDD;
    }

    return currentMMDD >= startMMDD && currentMMDD <= endMMDD;
}

/**
 * Check if today is within the period schedule (specific date range)
 */
function matchesPeriodSchedule(
    now: Date,
    periodStartDate?: Date | null,
    periodEndDate?: Date | null
): boolean {
    if (!periodStartDate && !periodEndDate) {
        return true;
    }

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (periodStartDate) {
        const start = new Date(periodStartDate);
        start.setHours(0, 0, 0, 0);
        if (today < start) {
            return false;
        }
    }

    if (periodEndDate) {
        const end = new Date(periodEndDate);
        end.setHours(23, 59, 59, 999);
        if (today > end) {
            return false;
        }
    }

    return true;
}

/**
 * Check if a menu or banner should be displayed based on its schedule configuration
 * @param config - The schedule configuration
 * @param now - Optional date to check against (defaults to current date/time)
 * @param debug - Optional flag to enable debug logging
 * @returns true if the item should be displayed
 */
export function isActiveBySchedule(config: ScheduleConfig, now: Date = new Date(), debug: boolean = false): boolean {
    const { scheduleType } = config;

    const log = (message: string) => {
        if (debug) {
            console.log(`[Schedule] ${message}`);
        }
    };

    log(`Checking schedule type: ${scheduleType}`);
    log(`Current date: ${now.toISOString()}, Day of week: ${now.getDay()}, Day of month: ${now.getDate()}`);

    switch (scheduleType) {
        case 'ALWAYS':
            log('ALWAYS -> true');
            return true;

        case 'DAILY':
            const dailyResult = isWithinDailyTimeRange(now, config.dailyStartTime, config.dailyEndTime);
            log(`DAILY time check: ${dailyResult}`);
            return dailyResult;

        case 'WEEKLY':
            // Check day of week AND optional time range
            const weeklyMatch = matchesWeeklySchedule(now, config.weeklyDays);
            log(`WEEKLY day check (days=${JSON.stringify(config.weeklyDays)}): ${weeklyMatch}`);
            if (!weeklyMatch) {
                return false;
            }
            return isWithinDailyTimeRange(now, config.dailyStartTime, config.dailyEndTime);

        case 'MONTHLY':
            // Monthly can be either specific days OR weekday ordinals
            // If monthlyWeekday is set, use weekday logic (e.g., "third Monday")
            // Otherwise, use monthlyDays (e.g., "1st and 15th of each month")
            if (config.monthlyWeekday !== null && config.monthlyWeekday !== undefined) {
                const ordinal = getWeekdayOrdinalInMonth(now);
                const isLast = isLastWeekdayOfMonth(now);
                log(`MONTHLY weekday check: weekday=${config.monthlyWeekday}, ordinal=${config.monthlyWeekdayOrdinal}`);
                log(`Current: dayOfWeek=${now.getDay()}, ordinalInMonth=${ordinal}, isLast=${isLast}`);
                if (!matchesMonthlyWeekdaySchedule(now, config.monthlyWeekday, config.monthlyWeekdayOrdinal)) {
                    log('MONTHLY weekday -> false');
                    return false;
                }
                log('MONTHLY weekday -> true');
            } else {
                const monthlyDaysMatch = matchesMonthlyDaysSchedule(now, config.monthlyDays);
                log(`MONTHLY days check (days=${JSON.stringify(config.monthlyDays)}): ${monthlyDaysMatch}`);
                if (!monthlyDaysMatch) {
                    return false;
                }
            }
            return isWithinDailyTimeRange(now, config.dailyStartTime, config.dailyEndTime);

        case 'YEARLY':
            if (!matchesYearlySchedule(now, config.yearlyStartDate, config.yearlyEndDate)) {
                log('YEARLY date check -> false');
                return false;
            }
            return isWithinDailyTimeRange(now, config.dailyStartTime, config.dailyEndTime);

        case 'PERIOD':
            if (!matchesPeriodSchedule(now, config.periodStartDate, config.periodEndDate)) {
                log('PERIOD date check -> false');
                return false;
            }
            return isWithinDailyTimeRange(now, config.dailyStartTime, config.dailyEndTime);

        default:
            // Unknown schedule type, default to showing
            console.warn(`[Schedule] Unknown schedule type: ${scheduleType}`);
            return true;
    }
}

/**
 * Debug helper to explain why a schedule matches or doesn't match
 */
export function getScheduleDebugInfo(config: ScheduleConfig, now: Date = new Date()): string {
    const lines: string[] = [];
    lines.push(`Schedule Type: ${config.scheduleType}`);
    lines.push(`Current Date: ${now.toISOString()}`);
    lines.push(`Day of Week: ${now.getDay()} (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()]})`);
    lines.push(`Day of Month: ${now.getDate()}`);
    lines.push(`Weekday Ordinal: ${getWeekdayOrdinalInMonth(now)} (is last: ${isLastWeekdayOfMonth(now)})`);

    if (config.monthlyWeekday !== null && config.monthlyWeekday !== undefined) {
        lines.push(`Config monthlyWeekday: ${config.monthlyWeekday} (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][config.monthlyWeekday]})`);
        lines.push(`Config monthlyWeekdayOrdinal: ${config.monthlyWeekdayOrdinal}`);
    }

    lines.push(`Is Active: ${isActiveBySchedule(config, now)}`);

    return lines.join('\n');
}
