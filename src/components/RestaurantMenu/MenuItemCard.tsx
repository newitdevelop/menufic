import type { FC } from "react";
import { useMemo, useState } from "react";

import { Box, createStyles, Group, Paper, Stack, Text } from "@mantine/core";
import { IconPhoto } from "@tabler/icons";

import type { Image, MenuItem } from "@prisma/client";

import { calculateVATInclusivePrice } from "src/utils/helpers";

import { ViewMenuItemModal } from "./ViewMenuItemModal";

export interface StyleProps {
    imageColor?: string;
}

const useStyles = createStyles((theme, { imageColor }: StyleProps) => {
    const bgColor = useMemo(() => {
        if (imageColor) {
            if (theme.colorScheme === "light") {
                return theme.fn.lighten(imageColor, 0.95);
            }
            return theme.fn.darken(imageColor, 0.95);
        }
        return theme.colors.dark[0];
    }, [imageColor, theme.colorScheme]);

    return {
        cardDescWrap: {
            flex: 1,
            gap: 0,
            overflow: "hidden",
            padding: theme.spacing.lg,
        },
        cardItem: {
            "&:hover": {
                backgroundColor:
                    theme.colorScheme === "light" ? theme.fn.darken(bgColor, 0.05) : theme.fn.lighten(bgColor, 0.05),
                boxShadow: theme.shadows.xs,
            },
            "&:focus": {
                backgroundColor:
                    theme.colorScheme === "light" ? theme.fn.darken(bgColor, 0.08) : theme.fn.lighten(bgColor, 0.08),
                boxShadow: theme.shadows.md,
                outline: `3px solid ${theme.colors.primary[6]}`,
                outlineOffset: "2px",
            },
            backgroundColor: bgColor,
            border: `1px solid ${theme.colors.dark[3]}`,
            color: theme.colors.dark[8],
            cursor: "pointer",
            display: "flex",
            overflow: "hidden",
            padding: "0 !important",
            transition: "all 500ms ease",
        },
        cardItemDesc: { WebkitLineClamp: 3 },
        cardItemTitle: { WebkitLineClamp: 2 },
        cardText: {
            WebkitBoxOrient: "vertical",
            color: theme.black,
            display: "-webkit-box",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "normal",
        },
        photoIcon: {
            color: theme.colors.primary[5],
            flexShrink: 0,
            opacity: 0.7,
        },
    };
});

interface Props {
    /** Menu item to be displayed in the card */
    item: MenuItem & { image: Image | null };
}

/** Display each menu item as a card in the full restaurant menu */
export const MenuItemCard: FC<Props> = ({ item }) => {
    const { classes, cx } = useStyles({ imageColor: item?.image?.color });
    const [modalVisible, setModalVisible] = useState(false);

    // Get UI translations from menu item (server-side translated via DeepL)
    const uiTranslations = (item as any)?.uiTranslations || {
        vatIncluded: "IVA incluído",
        allergensInfo: "Pode conter os seguintes alergénios",
        allergens: {},
    };

    const displayPrice = calculateVATInclusivePrice(item.price, item.vatRate || 23, item.vatIncluded ?? true);

    return (
        <>
            <Paper
                className={classes.cardItem}
                component="button"
                data-testid="menu-item-card"
                onClick={() => setModalVisible(true)}
                sx={{ minHeight: "80px" }}
                tabIndex={0}
            >
                <Stack className={classes.cardDescWrap}>
                    <Group spacing={6} noWrap align="flex-start">
                        <Text
                            className={cx(classes.cardText, classes.cardItemTitle)}
                            size="lg"
                            translate="yes"
                            weight={700}
                            sx={{ flex: 1 }}
                        >
                            {item.name}
                        </Text>
                        {item?.image?.path && (
                            <IconPhoto className={classes.photoIcon} size={16} />
                        )}
                    </Group>
                    {item.price ? (
                        <Text color="red" size="sm">
                            {item.currency || "€"}{displayPrice} ({item.vatRate || 23}% {uiTranslations.vatIncluded})
                        </Text>
                    ) : null}
                    <Text
                        className={cx(classes.cardText, classes.cardItemDesc)}
                        opacity={0.7}
                        size="xs"
                        translate="yes"
                    >
                        {item.description}
                    </Text>
                </Stack>
            </Paper>
            <ViewMenuItemModal menuItem={item} onClose={() => setModalVisible(false)} opened={modalVisible} />
        </>
    );
};
