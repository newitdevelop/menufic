import type { FC } from "react";
import { useEffect, useMemo, useRef } from "react";

import { Badge, Box, Group, Stack, Text, Tooltip, useMantineTheme } from "@mantine/core";
import { useTranslations } from "next-intl";
import { useRouter } from "next/router";

import type { ModalProps } from "@mantine/core";
import type { Image, MenuItem } from "@prisma/client";

import { calculateVATInclusivePrice } from "src/utils/helpers";
import { allergenSymbols } from "src/utils/validators";

import { ImageKitImage } from "../ImageKitImage";
import { Modal } from "../Modal";

interface Props extends ModalProps {
    /** Menu item for which the modal needs to be displayed */
    menuItem?: MenuItem & { image: Image | null };
}

/** Modal to view details of a selected menu item */
export const ViewMenuItemModal: FC<Props> = ({ menuItem, opened, onClose, ...rest }) => {
    const theme = useMantineTheme();
    const router = useRouter();
    const onCloseRef = useRef(onClose);
    useEffect(() => { onCloseRef.current = onClose; });

    // Get UI translations from menu item (server-side translated via DeepL)
    const uiTranslations = (menuItem as any)?.uiTranslations || {
        vatIncluded: "IVA incluído",
        allergensInfo: "Pode conter os seguintes alergénios",
        allergens: {},
    };

    // Dispatch events for Smart TV navigation + handle Back key and OK/Enter key
    useEffect(() => {
        if (opened) {
            window.dispatchEvent(new Event("modal:open"));

            // Push a history entry so the TV remote Back key pops it instead of leaving the page
            window.history.pushState({ menuItemModalOpen: true }, '');
            let historyPushed = true;

            // Block Next.js from processing this popstate — we handle it ourselves
            router.beforePopState(() => {
                if (historyPushed) {
                    historyPushed = false;
                    onCloseRef.current();
                    return false; // prevent Next.js navigation
                }
                return true;
            });

            const handleKeyDown = (e: KeyboardEvent) => {
                // OK / centre button on TV remote (Enter) closes the modal
                if (e.key === 'Enter' || e.keyCode === 13) {
                    const target = e.target as HTMLElement;
                    const isInteractive =
                        target.tagName === 'BUTTON' ||
                        target.tagName === 'A' ||
                        target.tagName === 'INPUT' ||
                        target.isContentEditable;
                    if (!isInteractive) {
                        e.preventDefault();
                        onCloseRef.current();
                    }
                }
            };

            window.addEventListener('keydown', handleKeyDown);

            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                router.beforePopState(() => true); // restore normal Next.js navigation
                // If modal was closed by something other than the Back key, pop our history entry
                if (historyPushed) {
                    historyPushed = false;
                    window.history.back();
                }
            };
        } else {
            window.dispatchEvent(new Event("modal:close"));
        }
    }, [opened, router]);

    const bgColor = useMemo(() => {
        if (menuItem?.image?.color) {
            if (theme.colorScheme === "light") {
                return theme.fn.lighten(menuItem?.image?.color, 0.85);
            }
            return theme.fn.darken(menuItem?.image?.color, 0.85);
        }
        return theme.white;
    }, [menuItem?.image?.color, theme.colorScheme]);

    const displayPrice = menuItem
        ? calculateVATInclusivePrice(menuItem.price, menuItem.vatRate || 23, menuItem.vatIncluded ?? true)
        : "0.00";

    return (
        <Modal
            centered
            data-testid="menu-item-card-modal"
            onClose={onClose}
            opened={opened}
            size="xl"
            styles={{
                modal: {
                    background: bgColor,
                    maxWidth: "90vw",
                    "@media (min-width: 90em)": { // Large screens/TVs (1440px+)
                        maxWidth: "70vw",
                        fontSize: "1.2rem",
                    },
                    "@media (min-width: 3840px)": { // 4K TVs
                        maxWidth: "65vw",
                        fontSize: "1.5rem",
                        padding: "2.5rem",
                    },
                }
            }}
            title={
                <Text color={theme.black} size="xl" translate="yes" weight="bold">
                    {menuItem?.name}
                </Text>
            }
            {...rest}
        >
            <Stack spacing="sm">
                {menuItem?.image?.path && (
                    <>
                        <Box sx={{
                            borderRadius: theme.radius.lg,
                            overflow: "hidden",
                            maxHeight: "60vh",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            <ImageKitImage
                                blurhash={menuItem?.image?.blurHash}
                                height={600}
                                imageAlt={menuItem?.name}
                                imagePath={menuItem?.image?.path}
                                width={600}
                            />
                        </Box>
                        {(menuItem?.image as any)?.disclaimer && (
                            <Text align="center" color="dimmed" fs="italic" size="xs">
                                {(menuItem?.image as any).disclaimer}
                            </Text>
                        )}
                    </>
                )}
                {menuItem?.price ? (
                    <Text color="red" mt="sm" size="lg">
                        {menuItem?.currency || "€"}{displayPrice} ({menuItem?.vatRate || 23}% {uiTranslations.vatIncluded})
                    </Text>
                ) : null}
                <Text color={theme.black} opacity={0.6} translate="yes">
                    {menuItem?.description}
                </Text>
                {(menuItem as any)?.isEdible && (menuItem as any)?.allergens && (menuItem as any).allergens.length > 0 && (menuItem as any).allergens[0] !== "none" && (
                    <Box mt="md">
                        <Text color={theme.black} size="sm" weight={600}>
                            {uiTranslations.allergensInfo}:
                        </Text>
                        <Group mt="xs" spacing="md">
                            {(menuItem as any).allergens.map((allergen: string) => (
                                <Stack key={allergen} align="center" spacing={4}>
                                    <Tooltip events={{ hover: true, focus: true, touch: true }} label={uiTranslations.allergens[allergen] || allergen} withArrow>
                                        <Text
                                            style={{
                                                fontSize: "2rem",
                                                cursor: "help",
                                                lineHeight: 1,
                                            }}
                                        >
                                            {allergenSymbols[allergen as keyof typeof allergenSymbols]}
                                        </Text>
                                    </Tooltip>
                                    <Text align="center" color={theme.black} size="xs" sx={{ maxWidth: 80 }}>
                                        {uiTranslations.allergens[allergen] || allergen}
                                    </Text>
                                </Stack>
                            ))}
                        </Group>
                    </Box>
                )}
            </Stack>
        </Modal>
    );
};
