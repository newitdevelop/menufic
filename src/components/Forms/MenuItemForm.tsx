import type { FC } from "react";
import { useEffect } from "react";

import { Button, Checkbox, Group, MultiSelect, SegmentedControl, Select, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { useTranslations } from "next-intl";

import type { ModalProps } from "@mantine/core";
import type { Image, MenuItem } from "@prisma/client";

import { api } from "src/utils/api";
import { showErrorToast, showSuccessToast } from "src/utils/helpers";
import { allergenCodes, menuItemInput } from "src/utils/validators";

import { ImageUpload } from "../ImageUpload";
import { Modal } from "../Modal";

interface Props extends ModalProps {
    /** Id of the category that the item belongs to */
    categoryId: string;
    /** Id of the menu that the item belongs to */
    menuId: string;
    /** Menu item to be edited */
    menuItem?: MenuItem & { image?: Image };
}

/** Form to be used when allowing users to add or edit menu items of restaurant menus categories */
export const MenuItemForm: FC<Props> = ({ opened, onClose, menuId, menuItem, categoryId, ...rest }) => {
    const trpcCtx = api.useContext();
    const t = useTranslations("dashboard.editMenu.menuItem");
    const tCommon = useTranslations("common");

    // Form hook - must be declared before mutations that use setValues
    const { getInputProps, onSubmit, setValues, isDirty, resetDirty, values } = useForm<{
        currency: "€" | "$";
        description: string;
        imageBase64: string;
        imagePath: string;
        name: string;
        price: string;
        vatIncluded: boolean;
        vatRate: 6 | 13 | 23;
        isEdible: boolean;
        allergens: (typeof allergenCodes)[number][];
    }>({
        initialValues: {
            currency: (menuItem?.currency as "€" | "$") || "€",
            description: menuItem?.description || "",
            imageBase64: "",
            imagePath: menuItem?.image?.path || "",
            name: menuItem?.name || "",
            price: menuItem?.price || "",
            vatIncluded: menuItem?.vatIncluded ?? true,
            vatRate: (menuItem?.vatRate as 6 | 13 | 23) || 23,
            isEdible: (menuItem as any)?.isEdible ?? false,
            allergens: (menuItem as any)?.allergens || [],
        },
        validate: zodResolver(menuItemInput),
    });

    // Check if AI allergen detection is available
    const { data: aiAvailability } = api.menuItem.isAllergenAIAvailable.useQuery();
    const isAIAvailable = aiAvailability?.available ?? false;

    // AI allergen detection mutation
    const { mutate: detectAllergensAI, isLoading: isDetectingAllergens } = api.menuItem.detectAllergensAI.useMutation({
        onError: (err: unknown) => showErrorToast(t("aiDetectionError"), err as { message: string }),
        onSuccess: (data: any) => {
            setValues({ allergens: data.allergens });
            showSuccessToast(t("aiDetectionSuccess"), t("aiDetectionSuccess"));
        },
    });

    const { mutate: createMenuItem, isLoading: isCreating } = api.menuItem.create.useMutation({
        onError: (err: unknown) => showErrorToast(t("createError"), err as { message: string }),
        onSuccess: (data: any) => {
            onClose();
            (trpcCtx.category as any).getAll.setData({ menuId }, (categories: any) =>
                categories?.map((item: any) => (item.id === categoryId ? { ...item, items: [...item.items, data] } : item))
            );
            showSuccessToast(tCommon("createSuccess"), t("createSuccessDesc", { name: data.name }));
        },
    });

    const { mutate: updateMenuItem, isLoading: isUpdating } = api.menuItem.update.useMutation({
        onError: (err: unknown) => showErrorToast(t("updateError"), err as { message: string }),
        onSuccess: (data: any) => {
            onClose();
            (trpcCtx.category as any).getAll.setData({ menuId }, (categories: any) =>
                categories?.map((categoryItem: any) =>
                    categoryItem.id === categoryId
                        ? {
                              ...categoryItem,
                              items: categoryItem.items?.map((item: any) => (item.id === data.id ? data : item)),
                          }
                        : categoryItem
                )
            );
            showSuccessToast(tCommon("updateSuccess"), t("updateSuccessDesc", { name: data.name }));
        },
    });

    useEffect(() => {
        if (opened) {
            const newValues = {
                currency: (menuItem?.currency as "€" | "$") || "€",
                description: menuItem?.description || "",
                imageBase64: "",
                imagePath: menuItem?.image?.path || "",
                name: menuItem?.name || "",
                price: menuItem?.price || "",
                vatIncluded: menuItem?.vatIncluded ?? true,
                vatRate: (menuItem?.vatRate as 6 | 13 | 23) || 23,
                isEdible: (menuItem as any)?.isEdible ?? false,
                allergens: (menuItem as any)?.allergens || [],
            };
            setValues(newValues);
            resetDirty(newValues);
        }
    }, [menuItem, opened]);

    const loading = isCreating || isUpdating;

    return (
        <Modal
            loading={loading}
            onClose={onClose}
            opened={opened}
            title={menuItem ? t("updateModalTitle") : t("createModalTitle")}
            {...rest}
        >
            <form
                onSubmit={onSubmit((formValues) => {
                    if (isDirty()) {
                        if (menuItem) {
                            updateMenuItem({ ...formValues, id: menuItem?.id });
                        } else if (categoryId) {
                            createMenuItem({ ...formValues, categoryId, menuId });
                        }
                    } else {
                        onClose();
                    }
                })}
            >
                <Stack spacing="sm">
                    <TextInput
                        disabled={loading}
                        label={t("inputNameLabel")}
                        placeholder={t("inputNamePlaceholder")}
                        withAsterisk
                        {...getInputProps("name")}
                        autoFocus
                    />
                    <Group align="flex-end" grow>
                        <TextInput
                            disabled={loading}
                            label={t("inputPriceLabel")}
                            placeholder={t("inputPricePlaceholder")}
                            withAsterisk
                            {...getInputProps("price")}
                        />
                        <SegmentedControl
                            data={[
                                { label: "€", value: "€" },
                                { label: "$", value: "$" },
                            ]}
                            disabled={loading}
                            {...getInputProps("currency")}
                        />
                    </Group>
                    <Group align="flex-start" grow>
                        <Select
                            data={[
                                { label: "6%", value: "6" },
                                { label: "13%", value: "13" },
                                { label: "23%", value: "23" },
                            ]}
                            disabled={loading}
                            label="VAT Rate"
                            value={String(values.vatRate)}
                            withAsterisk
                            onChange={(value) => setValues({ vatRate: Number(value) as 6 | 13 | 23 })}
                        />
                        <Checkbox
                            checked={values.vatIncluded}
                            disabled={loading}
                            label="VAT included in price"
                            mt="xl"
                            onChange={(event) => setValues({ vatIncluded: event.currentTarget.checked })}
                        />
                    </Group>
                    <Textarea
                        disabled={loading}
                        label={t("inputDescriptionLabel")}
                        minRows={3}
                        {...getInputProps("description")}
                    />
                    <Checkbox
                        checked={values.isEdible}
                        description={t("isEdibleDescription")}
                        disabled={loading}
                        label={t("isEdibleLabel")}
                        onChange={(event) => {
                            const isChecked = event.currentTarget.checked;
                            setValues({ isEdible: isChecked, allergens: isChecked ? values.allergens : [] });
                        }}
                    />
                    {values.isEdible && (
                        <Stack spacing="xs">
                            <MultiSelect
                                data={allergenCodes.map((code) => ({
                                    label: tCommon(`allergens.${code}`),
                                    value: code,
                                }))}
                                description={t("allergensDescription")}
                                disabled={loading || isDetectingAllergens}
                                label={t("allergensLabel")}
                                placeholder={t("allergensRequired")}
                                searchable
                                withAsterisk
                                {...getInputProps("allergens")}
                            />
                            {isAIAvailable && values.name && values.description && (
                                <Button
                                    compact
                                    disabled={loading || isDetectingAllergens}
                                    loading={isDetectingAllergens}
                                    onClick={() => {
                                        // If allergens are already selected, confirm before overriding
                                        if (values.allergens.length > 0) {
                                            // eslint-disable-next-line no-alert
                                            if (!window.confirm(t("aiDetectConfirmOverride"))) {
                                                return;
                                            }
                                        }
                                        detectAllergensAI({
                                            name: values.name,
                                            description: values.description,
                                        });
                                    }}
                                    variant="light"
                                >
                                    {t("aiDetectAllergensButton")}
                                </Button>
                            )}
                        </Stack>
                    )}
                    <ImageUpload
                        disabled={loading}
                        height={400}
                        imageHash={menuItem?.image?.blurHash}
                        imageUrl={values?.imagePath}
                        onImageCrop={(imageBase64, imagePath) => setValues({ imageBase64, imagePath })}
                        onImageDeleteClick={() => setValues({ imageBase64: "", imagePath: "" })}
                        width={400}
                    />
                    <Group mt="md" position="right">
                        <Button data-testid="save-menu-item-form" loading={loading} px="xl" type="submit">
                            {tCommon("save")}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};
