import type { FC } from "react";
import { useMemo, useState } from "react";

import { Box, createStyles, Paper, Stack, Text } from "@mantine/core";

import type { Image, MenuItem } from "@prisma/client";

import { calculateVATInclusivePrice } from "src/utils/helpers";

import { ViewMenuItemModal } from "./ViewMenuItemModal";
import { ImageKitImage } from "../ImageKitImage";

export interface StyleProps {
    imageColor?: string;
}

const useStyles = createStyles((theme, { imageColor }: StyleProps, getRef) => {
    const image = getRef("image");

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
            [`@media (min-width: ${theme.breakpoints.tv})`]: { padding: theme.spacing.xl * 1.5 },
            [`@media (min-width: ${theme.breakpoints["4k"]})`]: { padding: theme.spacing.xl * 2 },
        },
        cardImage: {
            height: 150,
            ref: image,
            transition: "transform 500ms ease",
            width: 150,
            [`@media (min-width: ${theme.breakpoints.tv})`]: { height: 240, width: 240 },
            [`@media (min-width: ${theme.breakpoints["4k"]})`]: { height: 360, width: 360 },
        },
        cardImageWrap: {
            borderRadius: theme.radius.lg,
            height: 150,
            overflow: "hidden",
            position: "relative",
            width: 150,
            [`@media (min-width: ${theme.breakpoints.tv})`]: { height: 240, width: 240 },
            [`@media (min-width: ${theme.breakpoints["4k"]})`]: { height: 360, width: 360 },
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
            [`&:hover .${image}`]: { transform: "scale(1.05)" },
            [`&:focus .${image}`]: { transform: "scale(1.05)" },
        },
        cardItemDesc: { WebkitLineClamp: 3 },
        cardItemTitle: { WebkitLineClamp: 1 },
        cardText: {
            WebkitBoxOrient: "vertical",
            color: theme.black,
            display: "-webkit-box",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "normal",
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

    const displayPrice = calculateVATInclusivePrice(item.price, item.vatRate || 23, item.vatIncluded ?? true);

    return (
        <>
            <Paper
                className={classes.cardItem}
                component="button"
                data-testid="menu-item-card"
                h={150}
                onClick={() => setModalVisible(true)}
                sx={(theme) => ({
                    [`@media (min-width: ${theme.breakpoints.tv})`]: { height: 240 },
                    [`@media (min-width: ${theme.breakpoints["4k"]})`]: { height: 360 },
                })}
                tabIndex={0}
            >
                {item?.image?.path && (
                    <Box className={classes.cardImageWrap}>
                        <Box className={classes.cardImage}>
                            <ImageKitImage
                                blurhash={item?.image?.blurHash}
                                color={item?.image?.color}
                                height={150}
                                imageAlt={item.name}
                                imagePath={item?.image?.path}
                                width={150}
                            />
                        </Box>
                    </Box>
                )}

                <Stack className={classes.cardDescWrap}>
                    <Text
                        className={cx(classes.cardText, classes.cardItemTitle)}
                        size="lg"
                        translate="yes"
                        weight={700}
                        sx={(theme) => ({
                            [`@media (min-width: ${theme.breakpoints.tv})`]: { fontSize: "28px" },
                            [`@media (min-width: ${theme.breakpoints["4k"]})`]: { fontSize: "42px" },
                        })}
                    >
                        {item.name}
                    </Text>
                    <Text
                        color="red"
                        size="sm"
                        translate="no"
                        sx={(theme) => ({
                            [`@media (min-width: ${theme.breakpoints.tv})`]: { fontSize: "20px" },
                            [`@media (min-width: ${theme.breakpoints["4k"]})`]: { fontSize: "30px" },
                        })}
                    >
                        {item.currency || "€"}{displayPrice} ({item.vatRate || 23}% VAT included)
                    </Text>
                    <Text
                        className={cx(classes.cardText, classes.cardItemDesc)}
                        opacity={0.7}
                        size="xs"
                        translate="yes"
                        sx={(theme) => ({
                            [`@media (min-width: ${theme.breakpoints.tv})`]: { fontSize: "18px" },
                            [`@media (min-width: ${theme.breakpoints["4k"]})`]: { fontSize: "26px" },
                        })}
                    >
                        {item.description}
                    </Text>
                </Stack>
            </Paper>
            <ViewMenuItemModal menuItem={item} onClose={() => setModalVisible(false)} opened={modalVisible} />
        </>
    );
};
