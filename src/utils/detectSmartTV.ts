/**
 * Utility to detect if the user is accessing from a Smart TV
 */

/**
 * Detects if the current device is a Smart TV based on user agent
 * @returns true if the device is a Smart TV, false otherwise
 */
export function isSmartTV(): boolean {
    if (typeof window === "undefined") {
        return false;
    }

    const userAgent = navigator.userAgent.toLowerCase();

    // Common Smart TV user agent strings
    const tvPatterns = [
        "smart-tv",
        "smarttv",
        "googletv",
        "appletv",
        "hbbtv",
        "pov_tv",
        "netcast",
        "nettv",
        "tv",
        "webos", // LG WebOS
        "web0s",
        "tizen", // Samsung Tizen
        "vidaa", // Hisense
        "operatv",
        "opera tv",
        "orsay", // Old Samsung
        "maple", // Old Samsung
        "viera", // Panasonic
        "aquos", // Sharp
        "philips",
        "roku",
        "chromecast",
        "playstation",
        "xbox",
        "nintendo",
    ];

    // Check if any TV pattern exists in user agent
    const isTVUserAgent = tvPatterns.some((pattern) => userAgent.includes(pattern));

    // Additional checks for screen resolution (typical TV resolutions)
    const isLargeScreen = window.screen.width >= 1920 || window.screen.height >= 1080;

    // Check if browser is in TV mode (some browsers report this)
    const isTVMode = (navigator as any).userAgentData?.mobile === false && isLargeScreen;

    return isTVUserAgent || isTVMode;
}

/**
 * Finds a menu that matches the "Room*" pattern in its name
 * @param menus Array of menus to search
 * @returns The ID of the matching menu, or null if not found
 */
export function findRoomMenu(menus: Array<{ id: string; name: string }>): string | null {
    const roomMenu = menus.find((menu) => {
        const menuName = menu.name.toLowerCase();
        return menuName.startsWith("room") || menuName.includes("room");
    });

    return roomMenu?.id ?? null;
}

/**
 * Gets the appropriate initial menu selection based on device type
 * @param menus Array of available menus
 * @param defaultMenuId The default menu ID to use if no special selection is needed
 * @returns The menu ID to select
 */
export function getInitialMenuSelection(
    menus: Array<{ id: string; name: string }>,
    defaultMenuId?: string
): string | undefined {
    // If accessing from Smart TV, try to find and select "Room*" menu
    if (isSmartTV()) {
        const roomMenuId = findRoomMenu(menus);
        if (roomMenuId) {
            return roomMenuId;
        }
    }

    // Otherwise, use the default (first menu or provided default)
    return defaultMenuId;
}
