import type { FC } from "react";
import { useState } from "react";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Box, Button, Center, Loader } from "@mantine/core";
import { IconPlus } from "@tabler/icons";
import { useTranslations } from "next-intl";
import { DragDropContext, Droppable } from "react-beautiful-dnd";

import type { Pack, PackSection } from "@prisma/client";

import { api } from "src/utils/api";
import { reorderList, showErrorToast } from "src/utils/helpers";

import { PackElement } from "./PackElement";
import { useStyles } from "./styles";
import { PackForm } from "../../Forms/PackForm";

interface Props {
    /** Id of the menu to which the packs belong to */
    menuId: string;
    /** Id of the restaurant */
    restaurantId: string;
}

/** Draggable list of pack items with add, edit and delete options */
export const Packs: FC<Props> = ({ menuId, restaurantId }) => {
    const trpcCtx = api.useContext();
    const { classes } = useStyles();
    const [packFormOpen, setPackFormOpen] = useState(false);
    const [packsParent, enableAutoAnimate] = useAutoAnimate<HTMLElement>();
    const [rootParent] = useAutoAnimate<HTMLDivElement>();
    const t = useTranslations("dashboard.editMenu.pack");

    const { isLoading: packsLoading, data: packs = [] } = (api.pack as any).getByMenuId.useQuery(
        { menuId },
        {
            enabled: !!menuId,
            onError: () => showErrorToast(t("fetchError")),
        }
    );

    const { mutate: updatePackPositions } = (api.pack as any).reorder.useMutation({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (_err: any, _newItem: any, context: any) => {
            showErrorToast(t("positionUpdateError"));
            (trpcCtx.pack as any).getByMenuId.setData({ menuId }, context?.previousPacks);
        },
        onMutate: async (reorderedList: any) => {
            await (trpcCtx.pack as any).getByMenuId.cancel({ menuId });
            const previousPacks = (trpcCtx.pack as any).getByMenuId.getData({ menuId });
            const reorderedPacks = reorderedList?.reduce(
                (
                    acc: (Pack & {
                        sections: PackSection[];
                    })[],
                    item: any
                ) => {
                    const matchingItem = previousPacks?.find((prev: any) => prev.id === item.id);
                    if (matchingItem) {
                        acc.push({ ...matchingItem, position: item.newPosition });
                    }
                    return acc;
                },
                []
            );
            (trpcCtx.pack as any).getByMenuId.setData({ menuId }, reorderedPacks);
            return { previousPacks };
        },
    });

    return (
        <>
            <Box ref={rootParent}>
                <DragDropContext
                    onBeforeDragStart={() => enableAutoAnimate(false)}
                    onDragEnd={({ destination, source }) => {
                        if (source.index !== destination?.index) {
                            const reorderedList = reorderList(packs, source.index, destination?.index || 0);
                            updatePackPositions(
                                reorderedList.map((item: any, index: number) => ({
                                    id: item.id,
                                    newPosition: index,
                                }))
                            );
                        }
                        setTimeout(() => enableAutoAnimate(true), 100);
                    }}
                >
                    <Droppable direction="vertical" droppableId={`dnd-pack-list-${menuId}`}>
                        {(provided) => (
                            <Box
                                {...provided.droppableProps}
                                ref={(ref) => {
                                    provided.innerRef(ref);
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    (packsParent as any).current = ref;
                                }}
                            >
                                {packs.map((item: any) => (
                                    <PackElement key={item.id} packItem={item} menuId={menuId} restaurantId={restaurantId} />
                                ))}
                                {provided.placeholder}
                            </Box>
                        )}
                    </Droppable>
                </DragDropContext>
                {packsLoading && (
                    <Center h="50vh" w="100%">
                        <Loader size="lg" />
                    </Center>
                )}

                {!packsLoading && packs?.length < 20 && (
                    <Button
                        key="add-new-pack"
                        data-testid="add-new-pack-button"
                        leftIcon={<IconPlus size={20} />}
                        loading={packsLoading}
                        mt={packs?.length === 0 ? 0 : "md"}
                        onClick={() => setPackFormOpen(true)}
                        px="lg"
                        size={packs?.length === 0 ? "lg" : "md"}
                        variant={packs?.length === 0 ? "filled" : "default"}
                    >
                        {t("addPackLabel")}
                    </Button>
                )}
            </Box>
            <PackForm
                menuId={menuId}
                onClose={() => setPackFormOpen(false)}
                opened={packFormOpen}
            />
        </>
    );
};
