import { isActiveBySchedule } from "src/server/services/schedule.service";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ORDINAL_NAMES: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th", [-1]: "Last" };

function ordinalSuffix(n: number): string {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] ?? s[v] ?? s[0]!;
}

function formatMMDD(mmdd: string): string {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const [month, day] = mmdd.split("-").map(Number);
    return `${months[(month ?? 1) - 1]} ${day}`;
}

function formatDate(d: Date | string | null): string {
    if (!d) return "";
    const date = new Date(d);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Accepts a raw menu/banner record from Prisma and returns a structured,
 * human-readable schedule object plus a live `isAvailableNow` boolean.
 */
export function formatMenuSchedule(menu: {
    scheduleType?: string | null;
    dailyStartTime?: string | null;
    dailyEndTime?: string | null;
    weeklyDays?: number[];
    monthlyDays?: number[];
    monthlyWeekday?: number | null;
    monthlyWeekdayOrdinal?: number | null;
    monthlyWeekdayRules?: any;
    yearlyStartDate?: string | null;
    yearlyEndDate?: string | null;
    periodStartDate?: Date | null;
    periodEndDate?: Date | null;
}) {
    const type = (menu.scheduleType || "ALWAYS") as
        | "ALWAYS"
        | "DAILY"
        | "WEEKLY"
        | "MONTHLY"
        | "YEARLY"
        | "PERIOD";

    const dailyHours =
        menu.dailyStartTime && menu.dailyEndTime
            ? `${menu.dailyStartTime}–${menu.dailyEndTime}`
            : null;

    let description = "";
    let details: Record<string, unknown> = {};

    switch (type) {
        case "ALWAYS":
            description = "Always available";
            break;

        case "DAILY":
            description = dailyHours ? `Daily ${dailyHours}` : "Daily";
            break;

        case "WEEKLY": {
            const days = (menu.weeklyDays ?? []).map((d) => DAY_NAMES[d] ?? d);
            details.weeklyDays = days;
            description = days.length
                ? `${days.join(", ")}${dailyHours ? ` ${dailyHours}` : ""}`
                : "Weekly";
            break;
        }

        case "MONTHLY": {
            const rules: any[] = Array.isArray(menu.monthlyWeekdayRules) ? menu.monthlyWeekdayRules : [];
            if (rules.length > 0) {
                const formatted = rules.map(
                    (r: { weekday: number; ordinal: number }) =>
                        `${ORDINAL_NAMES[r.ordinal] ?? r.ordinal} ${DAY_NAMES[r.weekday] ?? r.weekday}`
                );
                details.monthlyWeekdayRules = formatted;
                description = `${formatted.join(", ")} of each month${dailyHours ? ` ${dailyHours}` : ""}`;
            } else if (menu.monthlyWeekday != null) {
                const rule = `${ORDINAL_NAMES[menu.monthlyWeekdayOrdinal ?? 0] ?? ""} ${DAY_NAMES[menu.monthlyWeekday] ?? ""}`.trim();
                details.monthlyWeekdayRules = [rule];
                description = `${rule} of each month${dailyHours ? ` ${dailyHours}` : ""}`;
            } else {
                const days = (menu.monthlyDays ?? []).map((d) => `${d}${ordinalSuffix(d)}`);
                details.monthlyDays = menu.monthlyDays ?? [];
                description = `Days ${days.join(", ")} of each month${dailyHours ? ` ${dailyHours}` : ""}`;
            }
            break;
        }

        case "YEARLY":
            details.yearlyStart = menu.yearlyStartDate;
            details.yearlyEnd = menu.yearlyEndDate;
            description =
                menu.yearlyStartDate && menu.yearlyEndDate
                    ? `Annually ${formatMMDD(menu.yearlyStartDate)} – ${formatMMDD(menu.yearlyEndDate)}${dailyHours ? ` ${dailyHours}` : ""}`
                    : "Yearly";
            break;

        case "PERIOD":
            details.periodStart = menu.periodStartDate;
            details.periodEnd = menu.periodEndDate;
            description =
                menu.periodStartDate && menu.periodEndDate
                    ? `${formatDate(menu.periodStartDate)} – ${formatDate(menu.periodEndDate)}${dailyHours ? ` ${dailyHours}` : ""}`
                    : "Period";
            break;
    }

    const scheduleConfig = {
        scheduleType: type,
        dailyStartTime: menu.dailyStartTime,
        dailyEndTime: menu.dailyEndTime,
        weeklyDays: menu.weeklyDays,
        monthlyDays: menu.monthlyDays,
        monthlyWeekday: menu.monthlyWeekday,
        monthlyWeekdayOrdinal: menu.monthlyWeekdayOrdinal,
        monthlyWeekdayRules: Array.isArray(menu.monthlyWeekdayRules) ? menu.monthlyWeekdayRules : null,
        yearlyStartDate: menu.yearlyStartDate,
        yearlyEndDate: menu.yearlyEndDate,
        periodStartDate: menu.periodStartDate,
        periodEndDate: menu.periodEndDate,
    };

    return {
        schedule: {
            type,
            description,
            dailyHours,
            ...details,
        },
        isAvailableNow: isActiveBySchedule(scheduleConfig),
    };
}
