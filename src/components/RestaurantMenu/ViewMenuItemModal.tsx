import type { FC } from "react";
import { useMemo } from "react";

import { Box, Stack, Text, useMantineTheme } from "@mantine/core";

import type { ModalProps } from "@mantine/core";
import type { Image, MenuItem } from "@prisma/client";

import { calculateVATInclusivePrice } from "src/utils/helpers";

import { ImageKitImage } from "../ImageKitImage";
import { Modal } from "../Modal";

interface Props extends ModalProps {
    /** Menu item for which the modal needs to be displayed */
    menuItem?: MenuItem & { image: Image | null };
}

/** Modal to view details of a selected menu item */
export const ViewMenuItemModal: FC<Props> = ({ menuItem, ...rest }) => {
    const theme = useMantineTheme();
    const bgColor = useMemo(() => {
        if (menuItem?.image?.color) {
            if (theme.colorScheme === "light") {
                return theme.fn.lighten(menuItem?.image?.color, 0.85);
            }
            return theme.fn.darken(menuItem?.image?.color, 0.85);
        }
        return theme.white;
    }, [menuItem?.image?.color, theme.colorScheme]);

    const displayPrice = menuItem
        ? calculateVATInclusivePrice(menuItem.price, menuItem.vatRate || 23, menuItem.vatIncluded ?? true)
        : "0.00";

    return (
        <Modal
            centered
            data-testid="menu-item-card-modal"
            styles={{ modal: { background: bgColor } }}
            title={
                <Text color={theme.black} size="xl" translate="yes" weight="bold">
                    {menuItem?.name}
                </Text>
            }
            {...rest}
        >
            <Stack spacing="sm">
                {menuItem?.image?.path && (
                    <Box sx={{ borderRadius: theme.radius.lg, overflow: "hidden" }}>
                        <ImageKitImage
                            blurhash={menuItem?.image?.blurHash}
                            height={400}
                            imageAlt={menuItem?.name}
                            imagePath={menuItem?.image?.path}
                            width={400}
                        />
                    </Box>
                )}
                <Text color="red" mt="sm" size="lg" translate="no">
                    {menuItem?.currency || "€"}{displayPrice} ({menuItem?.vatRate || 23}% VAT included)
                </Text>
                <Text color={theme.black} opacity={0.6} translate="yes">
                    {menuItem?.description}
                </Text>
            </Stack>
        </Modal>
    );
};
