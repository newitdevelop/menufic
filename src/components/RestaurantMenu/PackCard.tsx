import type { FC } from "react";
import { useMemo } from "react";

import { Box, createStyles, Divider, Group, Paper, Stack, Text } from "@mantine/core";

import type { Image } from "@prisma/client";

import { calculateVATInclusivePrice } from "src/utils/helpers";
import { getFestiveColors, getProfessionalColors } from "src/utils/getFestiveColors";
import { ImageKitImage } from "../ImageKitImage";

export interface StyleProps {
    imageColor?: string;
    isFestive?: boolean;
}

const useStyles = createStyles((theme, { imageColor, isFestive }: StyleProps) => {
    // Get dynamic color scheme based on season/holiday (if festive) or professional colors
    const colors = isFestive ? getFestiveColors() : getProfessionalColors();

    const bgColor = useMemo(() => {
        if (imageColor) {
            if (theme.colorScheme === "light") {
                return theme.fn.lighten(imageColor, 0.95);
            }
            return theme.fn.darken(imageColor, 0.95);
        }
        return colors.bg;
    }, [imageColor, theme.colorScheme]);

    return {
        packCard: {
            backgroundColor: bgColor,
            border: `2px solid ${colors.border}`,
            padding: theme.spacing.xl,
            transition: "all 300ms ease",
            "&:hover": {
                boxShadow: theme.shadows.lg,
                transform: "translateY(-2px)",
            },
            "@media (min-width: 90em)": {
                padding: `${theme.spacing.xl * 1.5}px`,
            },
        },
        packHeader: {
            marginBottom: theme.spacing.lg,
            borderBottom: `2px solid ${colors.accent}`,
            paddingBottom: theme.spacing.md,
        },
        packName: {
            fontSize: "2rem",
            fontWeight: 700,
            color: isFestive ? colors.border : theme.black,
            textAlign: "center",
            "@media (max-width: 768px)": {
                fontSize: "1.5rem",
            },
        },
        packDescription: {
            fontSize: "1rem",
            color: theme.colors.dark[6],
            textAlign: "center",
            fontStyle: "italic",
        },
        packPrice: {
            fontSize: "2.5rem",
            fontWeight: 700,
            color: colors.price,
            textAlign: "center",
            marginTop: theme.spacing.md,
            marginBottom: theme.spacing.md,
            "@media (max-width: 768px)": {
                fontSize: "1.875rem",
            },
        },
        sectionTitle: {
            fontSize: "1.125rem",
            fontWeight: 600,
            color: colors.sectionTitle,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: theme.spacing.xs,
        },
        sectionItems: {
            marginLeft: theme.spacing.md,
        },
        item: {
            fontSize: "0.9375rem",
            color: theme.black,
            lineHeight: 1.6,
            "&::before": {
                content: '"• "',
                marginRight: theme.spacing.xs,
            },
        },
        imageContainer: {
            borderRadius: theme.radius.lg,
            overflow: "hidden",
            marginBottom: theme.spacing.xl,
            maxHeight: "400px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        },
        sectionsGrid: {
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: theme.spacing.lg,
            "@media (min-width: 768px)": {
                gridTemplateColumns: "1fr 1fr",
            },
        },
    };
});

interface PackSection {
    id: string;
    title: string;
    items: string[];
    position: number;
}

interface Pack {
    id: string;
    name: string;
    description?: string | null;
    price: string;
    currency: string;
    vatRate: number;
    vatIncluded: boolean;
    sections: PackSection[];
    image: Image | null;
    uiTranslations?: {
        vatIncluded: string;
    };
}

interface Props {
    pack: Pack;
    isFestive?: boolean;
}

/** Display a menu pack as a card with sections (like a buffet menu) */
export const PackCard: FC<Props> = ({ pack, isFestive }) => {
    const { classes } = useStyles({ imageColor: pack?.image?.color, isFestive });

    // Get UI translations (server-side translated via DeepL)
    const uiTranslations = pack.uiTranslations || {
        vatIncluded: "IVA incluído",
    };

    const displayPrice = calculateVATInclusivePrice(
        pack.price,
        pack.vatRate || 23,
        pack.vatIncluded ?? true
    );

    return (
        <Paper className={classes.packCard} radius="lg">
            <Stack spacing="md">
                {pack.image?.path && (
                    <Box className={classes.imageContainer}>
                        <ImageKitImage
                            blurhash={pack.image.blurHash}
                            height={400}
                            imageAlt={pack.name}
                            imagePath={pack.image.path}
                            width={800}
                        />
                    </Box>
                )}

                <div className={classes.packHeader}>
                    <Text className={classes.packName} translate="yes">
                        {pack.name}
                    </Text>
                    {pack.description && (
                        <Text className={classes.packDescription} mt="xs" translate="yes">
                            {pack.description}
                        </Text>
                    )}
                </div>

                <Divider />

                <div className={classes.sectionsGrid}>
                    {pack.sections
                        .sort((a, b) => a.position - b.position)
                        .map((section) => (
                            <Stack key={section.id} spacing="xs">
                                <Text className={classes.sectionTitle} translate="yes">
                                    {section.title}
                                </Text>
                                <div className={classes.sectionItems}>
                                    {section.items.map((item, index) => (
                                        <Text key={index} className={classes.item} translate="yes">
                                            {item}
                                        </Text>
                                    ))}
                                </div>
                            </Stack>
                        ))}
                </div>

                <Divider />

                <Text className={classes.packPrice}>
                    {pack.currency}{displayPrice}
                </Text>
                <Text align="center" color="dimmed" size="sm">
                    {pack.vatRate}% {uiTranslations.vatIncluded}
                </Text>
            </Stack>
        </Paper>
    );
};
