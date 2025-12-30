import { createStyles } from "@mantine/core";

export const useStyles = createStyles((theme) => ({
    dragHandle: {
        display: "flex",
        marginRight: theme.spacing.md,
        color: theme.colors.dark[6],
        cursor: "grab",
        alignItems: "center",
    },
    item: {
        display: "flex",
        alignItems: "center",
        borderRadius: theme.radius.md,
        border: `1px solid ${theme.colors.gray[3]}`,
        padding: `${theme.spacing.sm}px ${theme.spacing.lg}px`,
        marginBottom: theme.spacing.xs,
        backgroundColor: theme.white,
        cursor: "pointer",
        transition: "all 150ms ease",
        "&:hover": {
            backgroundColor: theme.colors.gray[0],
        },
    },
    itemDragging: {
        boxShadow: theme.shadows.sm,
    },
    itemTitle: {
        fontWeight: 600,
        fontSize: theme.fontSizes.md,
        color: theme.black,
    },
    itemSubTitle: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.dark[3],
        marginTop: 2,
    },
}));
