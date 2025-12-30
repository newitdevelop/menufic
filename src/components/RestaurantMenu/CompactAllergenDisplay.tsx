import type { FC } from "react";

import { Group, Tooltip } from "@mantine/core";

import { allergenSymbols } from "src/utils/validators";

interface Props {
    allergens: string[];
    allergenTranslations?: Record<string, string>;
    size?: string;
}

/**
 * Compact allergen display showing only emoji symbols with tooltips
 * Used in pack items for space-efficient allergen information
 */
export const CompactAllergenDisplay: FC<Props> = ({ allergens, allergenTranslations = {}, size = "1.2rem" }) => {
    if (!allergens || allergens.length === 0 || allergens[0] === "none") {
        return null;
    }

    return (
        <Group spacing={4} sx={{ display: "inline-flex" }}>
            {allergens.map((allergen) => (
                <Tooltip
                    key={allergen}
                    events={{ hover: true, focus: true, touch: true }}
                    label={allergenTranslations[allergen] || allergen}
                    withArrow
                >
                    <span
                        style={{
                            fontSize: size,
                            cursor: "help",
                            lineHeight: 1,
                            display: "inline-block",
                        }}
                    >
                        {allergenSymbols[allergen as keyof typeof allergenSymbols]}
                    </span>
                </Tooltip>
            ))}
        </Group>
    );
};
