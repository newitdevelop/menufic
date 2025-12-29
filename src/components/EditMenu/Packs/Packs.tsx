import type { FC } from "react";
import { useState } from "react";

import { Box, Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons";
import { useTranslations } from "next-intl";

import { api } from "src/utils/api";
import { showErrorToast } from "src/utils/helpers";

import { PackElement } from "./PackElement";
import { PackForm } from "../../Forms/PackForm";

interface Props {
    /** Id of the menu to which the packs belong to */
    menuId: string;
}

/** List of packs with add, edit and delete options */
export const Packs: FC<Props> = ({ menuId }) => {
    const [packFormOpen, setPackFormOpen] = useState(false);
    const t = useTranslations("dashboard.editMenu.pack");

    const { isLoading: packsLoading, data: packs = [] } = api.pack.getByMenuId.useQuery(
        { menuId },
        {
            enabled: !!menuId,
            onError: () => showErrorToast(t("fetchError")),
        }
    );

    return (
        <>
            <Box mt="xl">
                {packs.map((pack: any) => (
                    <PackElement key={pack.id} menuId={menuId} pack={pack} />
                ))}

                <Button
                    key="add-new-pack"
                    data-testid="add-new-pack-button"
                    fullWidth
                    leftIcon={<IconPlus size={20} />}
                    loading={packsLoading}
                    mt={packs?.length === 0 ? 0 : "md"}
                    onClick={() => setPackFormOpen(true)}
                    size={packs?.length === 0 ? "lg" : "md"}
                    variant={packs?.length === 0 ? "filled" : "default"}
                >
                    {t("addPackLabel")}
                </Button>
            </Box>

            <PackForm menuId={menuId} onClose={() => setPackFormOpen(false)} opened={packFormOpen} />
        </>
    );
};
