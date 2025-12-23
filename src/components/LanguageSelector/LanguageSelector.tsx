import type { FC } from "react";

import { ActionIcon, Menu } from "@mantine/core";
import { IconLanguage } from "@tabler/icons";

const LANGUAGES = [
    { code: "EN", label: "English", flag: "🇬🇧" },
    { code: "PT", label: "Português", flag: "🇵🇹" },
    { code: "ES", label: "Español", flag: "🇪🇸" },
    { code: "FR", label: "Français", flag: "🇫🇷" },
    { code: "DE", label: "Deutsch", flag: "🇩🇪" },
    { code: "IT", label: "Italiano", flag: "🇮🇹" },
];

interface Props {
    currentLanguage?: string;
    onLanguageChange: (language: string) => void;
}

export const LanguageSelector: FC<Props> = ({ currentLanguage = "EN", onLanguageChange }) => {
    const current = LANGUAGES.find((l) => l.code === currentLanguage.toUpperCase()) || LANGUAGES[0];

    return (
        <Menu position="bottom-end" shadow="md" width={200}>
            <Menu.Target>
                <ActionIcon
                    size="lg"
                    sx={(theme) => ({
                        "&:hover": { backgroundColor: theme.fn.rgba(theme.colors.dark[0], 0.8) },
                        backgroundColor: theme.fn.rgba(theme.colors.dark[0], 0.6),
                        color: theme.colors.dark[9],
                        transition: "all 500ms ease",
                    })}
                    title="Select Language"
                >
                    <IconLanguage size={18} strokeWidth={2.5} />
                </ActionIcon>
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
