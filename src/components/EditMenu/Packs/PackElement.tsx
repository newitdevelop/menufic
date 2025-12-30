import type { FC } from "react";
import { useState } from "react";

import { Box, Center, Text } from "@mantine/core";
import { IconGripVertical } from "@tabler/icons";
import { useTranslations } from "next-intl";
import { Draggable } from "react-beautiful-dnd";

import type { Pack, PackSection } from "@prisma/client";

import { api } from "src/utils/api";
import { showErrorToast, showSuccessToast } from "src/utils/helpers";

import { useStyles } from "./styles";
import { DeleteConfirmModal } from "../../DeleteConfirmModal";
import { EditDeleteOptions } from "../../EditDeleteOptions";
import { PackForm } from "../../Forms/PackForm";

interface Props {
    /** Pack which will be represented by the component */
    packItem: Pack & { sections: PackSection[] };
    /** Id of the menu to which the pack belongs to */
    menuId: string;
}

/** Individual pack component with an option to edit or delete */
export const PackElement: FC<Props> = ({ packItem, menuId }) => {
    const trpcCtx = api.useContext();
    const { classes, cx, theme } = useStyles();
    const [deletePackModalOpen, setDeletePackModalOpen] = useState(false);
    const [packFormOpen, setPackFormOpen] = useState(false);
    const t = useTranslations("dashboard.editMenu.pack");
    const tCommon = useTranslations("common");

    const { mutate: deletePack, isLoading: isDeleting } = (api.pack as any).delete.useMutation({
        onError: (err: unknown) => showErrorToast(t("deletePackError"), err as { message: string }),
        onSettled: () => setDeletePackModalOpen(false),
        onSuccess: (data: any) => {
            (trpcCtx.pack as any).getByMenuId.setData({ menuId }, (packs: any) =>
                packs?.filter((item: any) => item.id !== data.id)
            );
            showSuccessToast(tCommon("deleteSuccess"), t("deleteSuccessToast", { name: data.name }));
        },
    });

    return (
        <>
            <Draggable key={packItem.id} draggableId={packItem.id} index={packItem.position}>
                {(provided, snapshot) => (
                    <Box
                        className={cx(classes.item, {
                            [classes.itemDragging]: snapshot.isDragging,
                        })}
                        data-testid={`pack-item ${packItem.name}`}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                    >
                        <Center {...provided.dragHandleProps} className={classes.dragHandle}>
                            <IconGripVertical size={18} stroke={1.5} />
                        </Center>
                        <Box sx={{ flex: 1 }}>
                            <Text className={classes.itemTitle}>{packItem.name}</Text>
                            <Text className={classes.itemSubTitle}>
                                {packItem.price} {packItem.currency} • {packItem.sections?.length || 0} {t("sectionsCount")}
                            </Text>
                        </Box>
                        <EditDeleteOptions
                            onDeleteClick={() => setDeletePackModalOpen(true)}
                            onEditClick={() => setPackFormOpen(true)}
                        />
                    </Box>
                )}
            </Draggable>
            <PackForm
                pack={packItem}
                menuId={menuId}
                onClose={() => setPackFormOpen(false)}
                opened={packFormOpen}
            />
            <DeleteConfirmModal
                description={t("deleteConfirmDesc")}
                loading={isDeleting}
                onClose={() => setDeletePackModalOpen(false)}
                onDelete={() => deletePack({ id: packItem?.id })}
                opened={deletePackModalOpen}
                title={t("deleteConfirmTitle", { name: packItem.name })}
            />
        </>
    );
};
