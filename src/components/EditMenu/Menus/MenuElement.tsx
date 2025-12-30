import type { FC } from "react";
import { useState } from "react";

import { ActionIcon, Box, Center, Text } from "@mantine/core";
import { IconGripVertical, IconPrinter } from "@tabler/icons";
import { useTranslations } from "next-intl";
import { Draggable } from "react-beautiful-dnd";

import type { Menu } from "@prisma/client";

import { api } from "src/utils/api";
import { showErrorToast, showSuccessToast } from "src/utils/helpers";

import { useStyles } from "./styles";
import { DeleteConfirmModal } from "../../DeleteConfirmModal";
import { EditDeleteOptions } from "../../EditDeleteOptions";
import { MenuForm } from "../../Forms/MenuForm";
import { PrintLanguageModal } from "../../PrintLanguageModal";

interface Props {
    /** Menu which will be represented by the component */
    item: Menu;
    /** Index or the position  of the item */
    restaurantId: string;
    /** Selected Menu of the restaurant */
    selectedMenu: Menu | undefined;
    /** Callback to be fired when user selects a new menu */
    setSelectedMenu: (menu: Menu | undefined) => void;
}

/** Individual Menu selection component with an option to edit or delete */
export const MenuElement: FC<Props> = ({ item, selectedMenu, restaurantId, setSelectedMenu }) => {
    const trpcCtx = api.useContext();
    const { classes, cx, theme } = useStyles();
    const [deleteMenuModalOpen, setDeleteMenuModalOpen] = useState(false);
    const [menuFormOpen, setMenuFormOpen] = useState(false);
    const [printLanguageModalOpen, setPrintLanguageModalOpen] = useState(false);
    const t = useTranslations("dashboard.editMenu.menu");
    const tCommon = useTranslations("common");

    const { mutate: deleteMenu, isLoading: isDeleting } = api.menu.delete.useMutation({
        onError: (err: unknown) => showErrorToast(t("deleteMenuError"), err as { message: string }),
        onSettled: () => setDeleteMenuModalOpen(false),
        onSuccess: (data: any) => {
            const filteredMenuData = (trpcCtx.menu as any).getAll
                .getData({ restaurantId })
                ?.filter((menuItem) => menuItem.id !== data.id);
            (trpcCtx.menu as any).getAll.setData({ restaurantId }, filteredMenuData);

            if (data.id === selectedMenu?.id && filteredMenuData) {
                setSelectedMenu(filteredMenuData?.length > 0 ? filteredMenuData[0] : undefined);
            }

            showSuccessToast(tCommon("deleteSuccess"), t("deleteSuccessToast", { name: data.name }));
        },
    });

    const isSelected = item.id === selectedMenu?.id;
    const isInactive = !(item as any).isActive;

    const getIconColor = () => {
        if (isInactive) return theme.colors.red[7];
        if (isSelected) return theme.colors.primary?.[7];
        return theme.colors.dark[6];
    };

    const getEditDeleteColor = () => {
        if (isInactive) return theme.colors.red[7];
        if (isSelected) return theme.colors?.primary?.[7];
        return theme.colors.dark[6];
    };

    const getEditDeleteHoverColor = () => {
        if (isInactive) return theme.colors.red[8];
        if (isSelected) return theme.black;
        return theme.colors.primary?.[5];
    };

    const iconColor = getIconColor();
    const editDeleteColor = getEditDeleteColor();
    const editDeleteHoverColor = getEditDeleteHoverColor();

    const handlePrint = (event: React.MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        setPrintLanguageModalOpen(true);
    };

    return (
        <>
            <Draggable key={item.id} draggableId={item.id} index={item.position}>
                {(provided, snapshot) => (
                    <Box
                        className={cx(classes.item, {
                            [classes.itemDragging]: snapshot.isDragging,
                            [classes.itemSelected]: isSelected,
                        })}
                        data-testid={`menu-item ${item.name}`}
                        ref={provided.innerRef}
                        sx={{
                            borderColor: isInactive ? `${theme.colors.red[5]} !important` : undefined,
                            borderWidth: isInactive ? '2px !important' : undefined,
                            backgroundColor: isInactive ? theme.colors.red[0] : undefined,
                        }}
                        {...provided.draggableProps}
                        onClick={() => setSelectedMenu(item)}
                    >
                        <Center {...provided.dragHandleProps} className={classes.dragHandle}>
                            <IconGripVertical color={iconColor} size={18} />
                        </Center>
                        <Box sx={{ flex: 1 }}>
                            <Text
                                className={classes.itemTitle}
                                sx={{ color: isInactive ? theme.colors.red[7] : undefined }}
                            >
                                {(item as any).isFestive ? "🎄 " : ""}
                                {item.name}
                                {isInactive ? " (Disabled)" : ""}
                            </Text>
                            <Text
                                className={classes.itemSubTitle}
                                sx={{ color: isInactive ? theme.colors.red[6] : undefined }}
                            >
                                {(item as any).isTemporary && (item as any).startDate && (item as any).endDate
                                    ? `${new Date((item as any).startDate).toLocaleDateString("en-GB", {
                                          day: "numeric",
                                          month: "short",
                                      })} - ${new Date((item as any).endDate).toLocaleDateString("en-GB", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                      })}`
                                    : item.availableTime}
                            </Text>
                        </Box>
                        <ActionIcon
                            onClick={handlePrint}
                            sx={{
                                "&:hover": { background: "unset", color: editDeleteHoverColor },
                                color: editDeleteColor,
                                transition: "color 500ms ease",
                            }}
                        >
                            <IconPrinter size={18} />
                        </ActionIcon>
                        <EditDeleteOptions
                            color={editDeleteColor}
                            hoverColor={editDeleteHoverColor}
                            onDeleteClick={() => setDeleteMenuModalOpen(true)}
                            onEditClick={() => setMenuFormOpen(true)}
                        />
                    </Box>
                )}
            </Draggable>
            <MenuForm
                menu={item}
                onClose={() => setMenuFormOpen(false)}
                opened={menuFormOpen}
                restaurantId={restaurantId}
            />
            <DeleteConfirmModal
                description={t("deleteConfirmDesc")}
                loading={isDeleting}
                onClose={() => setDeleteMenuModalOpen(false)}
                onDelete={() => deleteMenu({ id: item.id })}
                opened={deleteMenuModalOpen}
                title={t("deleteConfirmTitle", { name: item.name })}
            />
            <PrintLanguageModal
                menuId={item.id}
                onClose={() => setPrintLanguageModalOpen(false)}
                opened={printLanguageModalOpen}
                restaurantId={restaurantId}
            />
        </>
    );
};
