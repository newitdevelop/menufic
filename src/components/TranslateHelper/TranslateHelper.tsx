import type { FC } from "react";
import { useState } from "react";

import { ActionIcon, List, Text, Title } from "@mantine/core";

import { Modal } from "../Modal";
import { IconLanguage } from "@tabler/icons";
import { useTranslations } from "next-intl";

/** Helper component to guide users to use browser translation */
export const TranslateHelper: FC = () => {
    const [opened, setOpened] = useState(false);
    const t = useTranslations("common");

    return (
        <>
            <ActionIcon
                onClick={() => setOpened(true)}
                size="lg"
                sx={(theme) => ({
                    "&:hover": { backgroundColor: theme.fn.rgba(theme.colors.dark[0], 0.8) },
                    backgroundColor: theme.fn.rgba(theme.colors.dark[0], 0.6),
                    color: theme.colors.dark[9],
                    transition: "all 500ms ease",
                })}
                title={t("translatePage")}
            >
                <IconLanguage size={18} strokeWidth={2.5} />
            </ActionIcon>

            <Modal onClose={() => setOpened(false)} opened={opened} title={<Title order={3}>{t("translatePage")}</Title>}>
                <Text mb="md">{t("translateInstructions")}</Text>
                <List spacing="sm">
                    <List.Item>
                        <Text weight={600}>Chrome / Edge:</Text>
                        <Text color="dimmed" size="sm">
                            {t("translateChrome")}
                        </Text>
                    </List.Item>
                    <List.Item>
                        <Text weight={600}>Safari:</Text>
                        <Text color="dimmed" size="sm">
                            {t("translateSafari")}
                        </Text>
                    </List.Item>
                    <List.Item>
                        <Text weight={600}>Firefox:</Text>
                        <Text color="dimmed" size="sm">
                            {t("translateFirefox")}
                        </Text>
                    </List.Item>
                </List>
            </Modal>
        </>
    );
};
