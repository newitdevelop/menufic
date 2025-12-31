import type { FC } from "react";
import { useMemo } from "react";

import { Box, Paper, Table, Text, createStyles } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons";

const useStyles = createStyles((theme) => ({
    tableContainer: {
        marginTop: theme.spacing.lg,
        backgroundColor: theme.colorScheme === "light" ? theme.colors.yellow[0] : theme.colors.dark[6],
        border: `2px solid ${theme.colors.yellow[4]}`,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
    },
    tableHeader: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.sm,
        color: theme.colors.yellow[9],
    },
    table: {
        "& thead tr th": {
            backgroundColor: theme.colorScheme === "light" ? theme.colors.yellow[1] : theme.colors.dark[7],
            fontWeight: 600,
            fontSize: "0.875rem",
            padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
        },
        "& tbody tr td": {
            padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
            fontSize: "0.875rem",
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
                <IconAlertTriangle size={20} />
                <Text weight={600} size="sm">
                    Allergen Information / Informações sobre Alergénios / Informations sur les allergènes
                </Text>
            </div>

            <Table className={classes.table} striped highlightOnHover>
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Allergen / Alergénio / Allergène</th>
                    </tr>
                </thead>
                <tbody>
                    {allergenSummary.map((code) => (
                        <tr key={code}>
                            <td>
                                <Text className={classes.allergenCode}>{code}</Text>
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

            <Text size="xs" color="dimmed" mt="xs" align="center">
                This pack contains dishes with the allergens listed above. Please inform staff of any dietary requirements.
            </Text>
            <Text size="xs" color="dimmed" align="center">
                Este pack contém pratos com os alergénios listados acima. Informe a equipe sobre quaisquer requisitos dietéticos.
            </Text>
            <Text size="xs" color="dimmed" align="center">
                Ce pack contient des plats avec les allergènes listés ci-dessus. Veuillez informer le personnel de toute exigence alimentaire.
            </Text>
        </Paper>
    );
};
