import type { FC } from "react";

import { Box, Image, Menu, Text } from "@mantine/core";

import { LANGUAGES, getFlagUrl } from "src/constants/languages";

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
                    <Image
                        src={getFlagUrl(current?.countryCode || "pt", 24)}
                        alt={`${current?.label} flag`}
                        width={24}
                        height={16}
                        sx={{
                            borderRadius: 2,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                            objectFit: "cover",
                        }}
                    />
                    <Text size="sm" sx={{ color: "white", fontWeight: 600 }}>
                        {current?.code}
                    </Text>
                </Box>
            </Menu.Target>

            <Menu.Dropdown>
                <Menu.Label>Select Language (or press 1-6)</Menu.Label>
                {LANGUAGES.map((lang) => (
                    <Menu.Item
                        key={lang.code}
                        icon={
                            <Image
                                src={getFlagUrl(lang.countryCode, 24)}
                                alt={`${lang.label} flag`}
                                width={24}
                                height={16}
                                sx={{
                                    borderRadius: 2,
                                    objectFit: "cover",
                                }}
                            />
                        }
                        onClick={() => onLanguageChange(lang.code)}
                        sx={(theme) => ({
                            backgroundColor: lang.code === current?.code ? theme.colors.gray[1] : undefined,
                            fontWeight: lang.code === current?.code ? 600 : undefined,
                        })}
                        rightSection={
                            <Text color="dimmed" size="xs" weight={500}>
                                {lang.shortcut}
                            </Text>
                        }
                    >
                        {lang.label}
                    </Menu.Item>
                ))}
            </Menu.Dropdown>
        </Menu>
    );
};
