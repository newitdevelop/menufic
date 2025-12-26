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

/**
 * Custom hook for Smart TV remote control navigation
 *
 * Controls:
 * - Left/Right arrows: Navigate between menu tabs
 * - Up/Down arrows: Navigate between menu items
 * - Enter/OK button: Open menu item detail
 * - Back button: Close menu item detail
 * - Escape: Close any modal
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

        const handleKeyDown = (event: KeyboardEvent) => {
            // Get all menu item cards
            const menuItemCards = document.querySelectorAll<HTMLElement>('[data-testid="menu-item-card"]');

            switch (event.key) {
                case "ArrowLeft":
                    event.preventDefault();
                    // Navigate to previous menu tab
                    if (!isModalOpenRef.current) {
                        const currentIndex = menuIds.findIndex(id => id === currentMenuId);
                        if (currentIndex > 0) {
                            onMenuChange(menuIds[currentIndex - 1]!);
                            focusedItemRef.current = 0;
                        }
                    }
                    break;

                case "ArrowRight":
                    event.preventDefault();
                    // Navigate to next menu tab
                    if (!isModalOpenRef.current) {
                        const currentIndex = menuIds.findIndex(id => id === currentMenuId);
                        if (currentIndex < menuIds.length - 1) {
                            onMenuChange(menuIds[currentIndex + 1]!);
                            focusedItemRef.current = 0;
                        }
                    }
                    break;

                case "ArrowUp":
                    event.preventDefault();
                    // Navigate to previous menu item
                    if (!isModalOpenRef.current && menuItemCards.length > 0) {
                        focusedItemRef.current = Math.max(0, focusedItemRef.current - 1);
                        menuItemCards[focusedItemRef.current]?.focus();
                        menuItemCards[focusedItemRef.current]?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                    break;

                case "ArrowDown":
                    event.preventDefault();
                    // Navigate to next menu item
                    if (!isModalOpenRef.current && menuItemCards.length > 0) {
                        focusedItemRef.current = Math.min(menuItemCards.length - 1, focusedItemRef.current + 1);
                        menuItemCards[focusedItemRef.current]?.focus();
                        menuItemCards[focusedItemRef.current]?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                    break;

                case "Enter":
                    event.preventDefault();
                    // Open focused menu item
                    if (!isModalOpenRef.current && menuItemCards.length > 0) {
                        const focusedCard = menuItemCards[focusedItemRef.current];
                        if (focusedCard) {
                            focusedCard.click();
                            isModalOpenRef.current = true;
                        }
                    }
                    break;

                case "Escape":
                case "Backspace": // Some TV remotes use Backspace for Back button
                    event.preventDefault();
                    // Close modal or go back
                    if (isModalOpenRef.current) {
                        // Find and click the close button in modal
                        const closeButton = document.querySelector<HTMLButtonElement>('[aria-label="Close modal"]');
                        if (closeButton) {
                            closeButton.click();
                            isModalOpenRef.current = false;
                        }
                    }
                    break;

                default:
                    break;
            }
        };

        // Listen for modal open/close events
        const handleModalOpen = () => {
            isModalOpenRef.current = true;
        };

        const handleModalClose = () => {
            isModalOpenRef.current = false;
        };

        // Add event listeners
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("modal:open", handleModalOpen);
        window.addEventListener("modal:close", handleModalClose);

        // Focus first item on mount
        const menuItemCards = document.querySelectorAll<HTMLElement>('[data-testid="menu-item-card"]');
        if (menuItemCards.length > 0) {
            menuItemCards[0]?.focus();
        }

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("modal:open", handleModalOpen);
            window.removeEventListener("modal:close", handleModalClose);
        };
    }, [currentMenuId, menuIds, onMenuChange, enabled]);

    return {
        /** Current focused item index */
        focusedItemIndex: focusedItemRef.current,
        /** Whether a modal is currently open */
        isModalOpen: isModalOpenRef.current,
    };
};
