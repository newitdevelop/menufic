import type { FC } from "react";
import { useState } from "react";

import { ActionIcon, Box, Card, Group, Image, Menu, Text } from "@mantine/core";
import { IconDotsVertical, IconEdit, IconTrash } from "@tabler/icons";
import { useTranslations } from "next-intl";

import { api } from "src/utils/api";
import { showErrorToast, showSuccessToast } from "src/utils/helpers";

import { PackForm } from "../../Forms/PackForm";

interface Props {
    /** Id of the menu */
    menuId: string;
    /** Pack item */
    pack: any;
}

/** Individual pack element with edit and delete options */
export const PackElement: FC<Props> = ({ pack, menuId }) => {
    const trpcCtx = api.useContext();
    const [packFormOpen, setPackFormOpen] = useState(false);
    const t = useTranslations("dashboard.editMenu.pack");
    const tCommon = useTranslations("common");

    const { mutate: deletePack, isLoading: isDeleting } = api.pack.delete.useMutation({
        onError: (err: unknown) => showErrorToast(t("deleteError"), err as { message: string }),
        onSuccess: () => {
            (trpcCtx.pack as any).getByMenuId.setData({ menuId }, (packs: any) =>
                packs?.filter((item: any) => item.id !== pack.id)
            );
            showSuccessToast(tCommon("deleteSuccess"), t("deleteSuccessDesc", { name: pack.name }));
        },
    });

    return (
        <>
            <Card mb="md" p="md" shadow="sm" withBorder>
                <Group position="apart">
                    <Group>
                        {pack.image?.path && (
                            <Image
                                alt={pack.name}
                                height={60}
                                radius="md"
                                src={`https://ik.imagekit.io/test/${pack.image.path}`}
                                width={60}
                            />
                        )}
                        <Box>
                            <Text size="lg" weight={600}>
                                {pack.name}
                            </Text>
                            <Text color="dimmed" size="sm">
                                {pack.price} {pack.currency}
                                {pack.vatIncluded ? " (VAT incl.)" : " (VAT excl.)"}
                            </Text>
                        </Box>
                    </Group>

                    <Menu position="bottom-end" shadow="md" width={200}>
                        <Menu.Target>
                            <ActionIcon loading={isDeleting} variant="subtle">
                                <IconDotsVertical size={18} />
                            </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                            <Menu.Item icon={<IconEdit size={14} />} onClick={() => setPackFormOpen(true)}>
                                {tCommon("edit")}
                            </Menu.Item>
                            <Menu.Item color="red" icon={<IconTrash size={14} />} onClick={() => deletePack({ id: pack.id })}>
                                {tCommon("delete")}
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Group>

                {pack.description && (
                    <Text color="dimmed" mt="sm" size="sm">
                        {pack.description}
                    </Text>
                )}

                {pack.sections && pack.sections.length > 0 && (
                    <Box mt="md">
                        {pack.sections.map((section: any, index: number) => (
                            <Box key={`section-${index}`} mb="sm">
                                <Text size="sm" weight={600}>
                                    {section.title}
                                </Text>
                                <Text color="dimmed" size="xs">
                                    {section.items.join(", ")}
                                </Text>
                            </Box>
                        ))}
                    </Box>
                )}
            </Card>

            <PackForm menuId={menuId} onClose={() => setPackFormOpen(false)} opened={packFormOpen} pack={pack} />
        </>
    );
};
