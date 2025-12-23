import type { FC } from "react";

import { Box, Menu, Text } from "@mantine/core";

const LANGUAGES = [
    { code: "PT", flag: "🇵🇹", label: "Português" },
    { code: "EN", flag: "🇬🇧", label: "English" },
    { code: "ES", flag: "🇪🇸", label: "Español" },
    { code: "FR", flag: "🇫🇷", label: "Français" },
    { code: "DE", flag: "🇩🇪", label: "Deutsch" },
    { code: "IT", flag: "🇮🇹", label: "Italiano" },
];

interface Props {
    currentLanguage?: string;
    onLanguageChange: (language: string) => void;
}

export const LanguageSelector: FC<Props> = ({ currentLanguage = "PT", onLanguageChange }) => {
    const current = LANGUAGES.find((l) => l.code === currentLanguage.toUpperCase()) || LANGUAGES[0];

    return (
        <Menu position="bottom-end" shadow="md" width={200}>
            <Menu.Target>
                <Box
                    sx={(theme) => ({
                        "&:hover": { backgroundColor: theme.fn.rgba(theme.colors.dark[0], 0.8), opacity: 1 },
                        alignItems: "center",
                        backgroundColor: theme.fn.rgba(theme.colors.dark[0], 0.6),
                        borderRadius: theme.radius.md,
                        boxShadow: theme.shadows.md,
                        cursor: "pointer",
                        display: "flex",
                        gap: 6,
                        opacity: 0.8,
                        padding: "6px 10px",
                        transition: "all 500ms ease",
                    })}
                    title="Select Language"
                >
                    <Text size="lg" sx={{ lineHeight: 1 }}>
                        {current?.flag}
                    </Text>
                    <Text size="sm" sx={{ color: "white", fontWeight: 600 }}>
                        {current?.code}
                    </Text>
                </Box>
            </Menu.Target>

            <Menu.Dropdown>
                <Menu.Label>Select Language</Menu.Label>
                {LANGUAGES.map((lang) => (
                    <Menu.Item
                        key={lang.code}
                        icon={<span style={{ fontSize: "1.2em" }}>{lang.flag}</span>}
                        onClick={() => onLanguageChange(lang.code)}
                        sx={(theme) => ({
                            backgroundColor: lang.code === current?.code ? theme.colors.gray[1] : undefined,
                            fontWeight: lang.code === current?.code ? 600 : undefined,
                        })}
                    >
                        {lang.label}
                    </Menu.Item>
                ))}
            </Menu.Dropdown>
        </Menu>
    );
};
