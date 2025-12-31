import type { FC } from "react";
import { useMemo } from "react";

import { Box, Paper, Table, Text, createStyles } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons";

import { allergenSymbols } from "src/utils/validators";

const useStyles = createStyles((theme) => ({
    tableContainer: {
        marginTop: theme.spacing.sm,
        backgroundColor: theme.colorScheme === "light" ? theme.colors.yellow[0] : theme.colors.dark[6],
        border: `1px solid ${theme.colors.yellow[4]}`,
        padding: theme.spacing.xs,
        borderRadius: theme.radius.sm,
        maxWidth: "400px",
    },
    tableHeader: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.xs,
        color: theme.colors.yellow[9],
    },
    table: {
        fontSize: "0.75rem",
        "& thead tr th": {
            backgroundColor: theme.colorScheme === "light" ? theme.colors.yellow[1] : theme.colors.dark[7],
            fontWeight: 600,
            fontSize: "0.75rem",
            padding: `${theme.spacing.xs / 2}px ${theme.spacing.xs}px`,
        },
        "& tbody tr td": {
            padding: `${theme.spacing.xs / 2}px ${theme.spacing.xs}px`,
            fontSize: "0.75rem",
        },
        "& tbody tr:hover": {
            backgroundColor: theme.colorScheme === "light" ? theme.colors.yellow[0] : theme.colors.dark[5],
        },
    },
    allergenCode: {
        fontWeight: 600,
        color: theme.colors.yellow[9],
        fontFamily: theme.fontFamilyMonospace,
    },
    allergenName: {
        color: theme.colorScheme === "light" ? theme.colors.dark[7] : theme.colors.gray[3],
    },
}));

interface PackSection {
    id: string;
    title: string;
    items: string[];
    itemAllergens?: Record<string, string[]>;
}

interface Props {
    sections: PackSection[];
    allergenTranslations?: Record<string, string>;
}

/** Display a summary table of all allergens found in a pack */
export const PackAllergenTable: FC<Props> = ({ sections, allergenTranslations = {} }) => {
    const { classes } = useStyles();

    // Collect all unique allergens from all sections
    const allergenSummary = useMemo(() => {
        const allergenSet = new Set<string>();

        sections.forEach((section) => {
            if (section.itemAllergens) {
                Object.values(section.itemAllergens).forEach((allergens) => {
                    allergens.forEach((code) => allergenSet.add(code));
                });
            }
        });

        // Convert to array and sort alphabetically
        return Array.from(allergenSet).sort((a, b) => {
            const nameA = allergenTranslations[a] || a;
            const nameB = allergenTranslations[b] || b;
            return nameA.localeCompare(nameB);
        });
    }, [sections, allergenTranslations]);

    // Don't render if no allergens found
    if (allergenSummary.length === 0) {
        return null;
    }

    return (
        <Paper className={classes.tableContainer}>
            <div className={classes.tableHeader}>
                <IconAlertTriangle size={14} />
                <Text weight={600} size="xs">
                    {allergenTranslations.allergensInfo || "Allergen Information"}
                </Text>
            </div>

            <Table className={classes.table} striped highlightOnHover>
                <tbody>
                    {allergenSummary.map((code) => (
                        <tr key={code}>
                            <td style={{ width: "30px" }}>
                                <Text style={{ fontSize: "1rem", lineHeight: 1 }}>
                                    {allergenSymbols[code as keyof typeof allergenSymbols] || "❓"}
                                </Text>
                            </td>
                            <td>
                                <Text className={classes.allergenName}>
                                    {allergenTranslations[code] || code}
                                </Text>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Paper>
    );
};
