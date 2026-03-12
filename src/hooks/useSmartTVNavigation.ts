import { useEffect, useRef } from "react";

interface SmartTVNavigationProps {
    /** Current selected menu/tab ID */
    currentMenuId: string | null | undefined;
    /** Array of available menu IDs */
    menuIds: string[];
    /** Callback to change menu/tab */
    onMenuChange: (menuId: string) => void;
    /** Enable/disable Smart TV navigation */
    enabled?: boolean;
}

/** Close the currently open menu item modal */
function closeModal(): boolean {
    // Mantine 5 close button has aria-label="Close"
    const closeButton = document.querySelector<HTMLButtonElement>('button[aria-label="Close"]');
    if (closeButton) {
        closeButton.click();
        return true;
    }
    return false;
}

/**
 * Custom hook for Smart TV remote control navigation
 *
 * Controls:
 * - Left/Right arrows: Navigate between menu tabs
 * - Up/Down arrows: Navigate between menu items
 * - Enter/OK button: Open focused item OR close open article
 * - Back/Backspace/Escape: Close article (never navigate back)
 */
export const useSmartTVNavigation = ({
    currentMenuId,
    menuIds,
    onMenuChange,
    enabled = true,
}: SmartTVNavigationProps) => {
    const focusedItemRef = useRef<number>(0);
    const isModalOpenRef = useRef<boolean>(false);

    useEffect(() => {
        if (!enabled) return;

        // Reset focus to first item when the active menu tab changes
        focusedItemRef.current = 0;

        const handleKeyDown = (event: KeyboardEvent) => {
            // Don't intercept keys when user is typing in an input field
            const target = event.target as HTMLElement;
            const isTyping = target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable;
            if (isTyping) return;

            // ── Back / Cancel keys ───────────────────────────────────────────
            // Samsung Tizen: keyCode 10009
            // LG WebOS:      keyCode 461
            // Standard:      Escape, Backspace, GoBack, BrowserBack
            const keyCode = (event as KeyboardEvent & { keyCode?: number }).keyCode ?? 0;
            const isBackKey =
                event.key === "Escape" ||
                event.key === "Backspace" ||
                event.key === "GoBack" ||
                event.key === "BrowserBack" ||
                keyCode === 10009 ||  // Samsung Tizen Back
                keyCode === 461;      // LG WebOS Back

            if (isBackKey) {
                event.preventDefault();
                event.stopPropagation();
                if (isModalOpenRef.current) {
                    if (closeModal()) isModalOpenRef.current = false;
                }
                // Always prevent: never let Back navigate the browser away from the menu page
                return;
            }

            // Get all menu item cards
            const menuItemCards = document.querySelectorAll<HTMLElement>('[data-testid="menu-item-card"]');

            // Some older TV browsers send "Up"/"Down" instead of "ArrowUp"/"ArrowDown"
            switch (event.key) {
                case "ArrowLeft":
                case "Left":
                    event.preventDefault();
                    event.stopPropagation();
                    if (!isModalOpenRef.current) {
                        const currentIndex = menuIds.findIndex(id => id === currentMenuId);
                        if (currentIndex > 0) {
                            onMenuChange(menuIds[currentIndex - 1]!);
                            focusedItemRef.current = 0;
                        }
                    }
                    break;

                case "ArrowRight":
                case "Right":
                    event.preventDefault();
                    event.stopPropagation();
                    if (!isModalOpenRef.current) {
                        const currentIndex = menuIds.findIndex(id => id === currentMenuId);
                        if (currentIndex < menuIds.length - 1) {
                            onMenuChange(menuIds[currentIndex + 1]!);
                            focusedItemRef.current = 0;
                        }
                    }
                    break;

                case "ArrowUp":
                case "Up":
                    event.preventDefault();
                    event.stopPropagation();
                    if (!isModalOpenRef.current && menuItemCards.length > 0) {
                        if (focusedItemRef.current <= 0) {
                            // Already at first item — scroll to top to reveal menu tabs
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        } else {
                            focusedItemRef.current = focusedItemRef.current - 1;
                            menuItemCards[focusedItemRef.current]?.focus();
                            menuItemCards[focusedItemRef.current]?.scrollIntoView({ behavior: "smooth", block: "center" });
                        }
                    }
                    break;

                case "ArrowDown":
                case "Down":
                    event.preventDefault();
                    event.stopPropagation();
                    if (!isModalOpenRef.current && menuItemCards.length > 0) {
                        focusedItemRef.current = Math.min(menuItemCards.length - 1, focusedItemRef.current + 1);
                        menuItemCards[focusedItemRef.current]?.focus();
                        menuItemCards[focusedItemRef.current]?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                    break;

                case "Enter":
                    event.preventDefault();
                    event.stopPropagation();
                    if (isModalOpenRef.current) {
                        // OK button closes the open article
                        if (closeModal()) isModalOpenRef.current = false;
                    } else if (menuItemCards.length > 0) {
                        // OK button opens the focused item
                        const focusedCard = menuItemCards[focusedItemRef.current];
                        if (focusedCard) {
                            focusedCard.click();
                            isModalOpenRef.current = true;
                        }
                    }
                    break;

                default:
                    break;
            }
        };

        const handleModalOpen = () => { isModalOpenRef.current = true; };
        const handleModalClose = () => { isModalOpenRef.current = false; };

        // Use { capture: true } to intercept events before TV spatial navigation handles them
        window.addEventListener("keydown", handleKeyDown, { capture: true });
        window.addEventListener("modal:open", handleModalOpen);
        window.addEventListener("modal:close", handleModalClose);

        // Focus first item on mount / menu change
        const menuItemCards = document.querySelectorAll<HTMLElement>('[data-testid="menu-item-card"]');
        if (menuItemCards.length > 0) {
            menuItemCards[0]?.focus();
        }

        return () => {
            window.removeEventListener("keydown", handleKeyDown, { capture: true });
            window.removeEventListener("modal:open", handleModalOpen);
            window.removeEventListener("modal:close", handleModalClose);
        };
    }, [currentMenuId, menuIds, onMenuChange, enabled]);

    return {
        focusedItemIndex: focusedItemRef.current,
        isModalOpen: isModalOpenRef.current,
    };
};
