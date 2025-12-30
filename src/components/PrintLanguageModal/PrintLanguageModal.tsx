import type { FC } from "react";

import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useTranslations } from "next-intl";

import type { ModalProps } from "@mantine/core";

import { LANGUAGES } from "src/constants/languages";

interface Props extends ModalProps {
    /** The restaurant ID */
    restaurantId: string;
    /** The menu ID to print */
    menuId: string;
    /** Optional category ID to filter print */
    categoryId?: string;
}

/** Modal to select language before printing a menu */
export const PrintLanguageModal: FC<Props> = ({ opened, onClose, restaurantId, menuId, categoryId, ...rest }) => {
    const t = useTranslations("dashboard.editMenu.menu");

    const handlePrint = (languageCode: string) => {
        // Build URL with specific menu ID, language, and optional category ID
        const baseUrl = window.location.origin;
        const langParam = languageCode === "PT" ? "" : `lang=${languageCode}&`;
        const categoryParam = categoryId ? `categoryId=${categoryId}&` : "";
        const menuUrl = `${baseUrl}/venue/${restaurantId}/menu?${langParam}${categoryParam}menuId=${menuId}`;

        // Open the menu in a new window and trigger print
        const printWindow = window.open(menuUrl, "_blank");
        if (printWindow) {
            printWindow.addEventListener("load", () => {
                // Wait for page to fully load, then print
                setTimeout(() => {
                    printWindow.print();
                }, 1000);
            });
        }

        // Close the modal
        onClose();
    };

    return (
        <Modal
            onClose={onClose}
            opened={opened}
            title={t("printLanguageModalTitle")}
            centered
            {...rest}
        >
            <Stack spacing="xs">
                <Text size="sm" color="dimmed">
                    {t("printLanguageModalDescription")}
                </Text>

                {LANGUAGES.map((lang) => (
                    <Button
                        key={lang.code}
                        variant="light"
                        fullWidth
                        onClick={() => handlePrint(lang.code)}
                        leftIcon={<span style={{ fontSize: "1.5rem" }}>{lang.flag}</span>}
                        rightIcon={
                            <Text color="dimmed" size="xs" weight={500}>
                                {lang.shortcut}
                            </Text>
                        }
                        styles={{
                            inner: {
                                justifyContent: "flex-start",
                            },
                        }}
                    >
                        {lang.label}
                    </Button>
                ))}
            </Stack>
        </Modal>
    );
};
