import type { FC } from "react";

import { Container, createStyles, Footer, Group, Stack, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { env } from "src/env/client.mjs";

const useStyles = createStyles((theme) => ({
    copyRights: {
        color: theme.colors.dark[9],
        fontSize: theme.fontSizes.sm,
        "@media (min-width: 120em)": { fontSize: "20px" }, // 1920px Smart TV
        "@media (min-width: 240em)": { fontSize: "32px" }, // 3840px 4K TV
    },
    footer: { background: theme.colors.dark[0], height: "100%" },
    inner: {
        alignItems: "center",
        display: "flex",
        fontSize: theme.fontSizes.sm,
        justifyContent: "space-between",
        opacity: 0.6,
        paddingBottom: theme.spacing.md,
        paddingTop: theme.spacing.md,
        [theme.fn.smallerThan("sm")]: {
            flexDirection: "column",
            alignItems: "flex-start",
            gap: theme.spacing.md,
        },
    },
    linkItem: {
        marginLeft: 10,
        marginRight: 10,
        [theme.fn.smallerThan("sm")]: {
            marginLeft: 0,
            marginRight: 0,
            display: "block",
        },
    },
    links: {
        color: theme.colors.dark[9],
        fontSize: theme.fontSizes.sm,
        "@media (min-width: 120em)": { fontSize: "18px" }, // 1920px Smart TV
        "@media (min-width: 240em)": { fontSize: "28px" }, // 3840px 4K TV
        [theme.fn.smallerThan("sm")]: {
            marginTop: 0,
            width: "100%",
        },
    },
}));

interface Props {
    /** Optional restaurant data for venue-specific footer URLs */
    restaurant?: {
        privacyPolicyUrl?: string | null;
        termsAndConditionsUrl?: string | null;
    };
}

/** Footer to be shown throughout the app */
export const CustomFooter: FC<Props> = ({ restaurant }) => {
    const { classes, theme } = useStyles();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm}px)`);
    const t = useTranslations("common");

    const currentYear = new Date().getFullYear();

    const footerLinks: Array<{ label: string; link: string }> = [];

    // If restaurant is provided, only use venue-specific URLs (no fallback to defaults)
    // If restaurant is not provided, use default URLs from environment
    const privacyUrl = restaurant !== undefined
        ? restaurant.privacyPolicyUrl
        : env.NEXT_PUBLIC_PRIVACY_POLICY_URL;
    if (privacyUrl) {
        footerLinks.push({ label: t("privacyPolicy"), link: privacyUrl });
    }

    const termsUrl = restaurant !== undefined
        ? restaurant.termsAndConditionsUrl
        : env.NEXT_PUBLIC_TERMS_CONDITIONS_URL;
    if (termsUrl) {
        footerLinks.push({ label: t("terms&Conditions"), link: termsUrl });
    }

    // Complaint Book is always shown for Portuguese venues
    footerLinks.push({ label: t("complaintBook"), link: "https://www.livroreclamacoes.pt/inicio" });

    const items = isMobile ? (
        <Stack spacing="xs">
            {footerLinks.map((link) => (
                <Link key={link.label} className={classes.linkItem} href={link.link} rel="noopener noreferrer" target="_blank">
                    <Text size="sm">{link.label}</Text>
                </Link>
            ))}
        </Stack>
    ) : (
        footerLinks.map((link) => (
            <Link key={link.label} className={classes.linkItem} href={link.link} rel="noopener noreferrer" target="_blank">
                {link.label}
            </Link>
        ))
    );

    return (
        <Footer className={classes.footer} height={isMobile ? "auto" : 50}>
            <Container className={classes.inner} size="xl">
                <Link className={classes.copyRights} href={env.NEXT_PUBLIC_APP_URL}>
                    {t("footerCopyright", { appName: env.NEXT_PUBLIC_APP_NAME, year: currentYear })}
                </Link>
                {isMobile ? (
                    <div className={classes.links}>{items}</div>
                ) : (
                    <Group className={classes.links}>{items}</Group>
                )}
            </Container>
        </Footer>
    );
};
