import type { FC } from "react";
import { useEffect, useState } from "react";

import { ActionIcon, Button, Checkbox, Divider, Group, Select, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { IconPlus, IconTrash } from "@tabler/icons";
import { useTranslations } from "next-intl";

import type { ModalProps } from "@mantine/core";
import type { Pack, PackSection } from "@prisma/client";

import { api } from "src/utils/api";
import { showErrorToast, showSuccessToast } from "src/utils/helpers";
import { allergenCodes, packInput } from "src/utils/validators";

import { Modal } from "../Modal";

interface Props extends ModalProps {
    /** Pack to be edited */
    pack?: Pack & { sections?: PackSection[] };
    /** Id of the menu that the pack belongs to */
    menuId: string;
}

/** Form to be used when allowing users to add or edit packs */
export const PackForm: FC<Props> = ({ opened, onClose, menuId, pack: packItem, ...rest }) => {
    const trpcCtx = api.useContext();
    const t = useTranslations("dashboard.editMenu.pack");
    const tCommon = useTranslations("common");
    const [allergenMap, setAllergenMap] = useState<Record<string, (typeof allergenCodes)[number][]>>({});

    // AI allergen detection mutation
    const { mutate: detectAllergensAI, isLoading: isDetectingAllergens } = (api.pack as any).detectAllergensAI.useMutation({
        onError: (err: unknown) => showErrorToast("AI Detection Error", err as { message: string }),
        onSuccess: (data: any) => {
            setAllergenMap(data.allergenMap);
            showSuccessToast("Allergens Detected", `Successfully detected allergens for ${Object.keys(data.allergenMap).length} items`);
        },
    });

    const { mutate: createPack, isLoading: isCreating } = (api.pack as any).create.useMutation({
        onError: (err: unknown) => showErrorToast(t("createError"), err as { message: string }),
        onSuccess: (data: any) => {
            onClose();
            (trpcCtx.pack as any).getByMenuId.setData({ menuId }, (packs: any) => [...(packs || []), data]);
            showSuccessToast(tCommon("createSuccess"), t("createSuccessDesc", { name: data.name }));
        },
    });

    const { mutate: updatePack, isLoading: isUpdating } = (api.pack as any).update.useMutation({
        onError: (err: unknown) => showErrorToast(t("updateError"), err as { message: string }),
        onSuccess: (data: any) => {
            onClose();
            (trpcCtx.pack as any).getByMenuId.setData({ menuId }, (packs: any) =>
                packs?.map((item: any) => (item.id === data.id ? { ...item, ...data } : item))
            );
            showSuccessToast(tCommon("updateSuccess"), t("updateSuccessDesc", { name: data.name }));
        },
    });

    const { getInputProps, onSubmit, isDirty, resetDirty, setValues, values } = useForm({
        initialValues: {
            name: packItem?.name || "",
            description: packItem?.description || "",
            price: packItem?.price || "",
            currency: packItem?.currency || "€",
            vatRate: packItem?.vatRate || 23,
            vatIncluded: packItem?.vatIncluded ?? true,
            isActive: packItem?.isActive ?? true,
            sections: packItem?.sections?.map((section, index) => ({
                title: section.title,
                items: section.items || [],
                position: section.position ?? index,
            })) || [{ title: "", items: [], position: 0 }],
        },
        validate: zodResolver(packInput),
    });

    useEffect(() => {
        if (opened) {
            const values = {
                name: packItem?.name || "",
                description: packItem?.description || "",
                price: packItem?.price || "",
                currency: packItem?.currency || "€",
                vatRate: packItem?.vatRate || 23,
                vatIncluded: packItem?.vatIncluded ?? true,
                isActive: packItem?.isActive ?? true,
                sections: packItem?.sections?.map((section, index) => ({
                    title: section.title,
                    items: section.items || [],
                    position: section.position ?? index,
                })) || [{ title: "", items: [], position: 0 }],
            };
            setValues(values);
            resetDirty(values);
        }
    }, [packItem, opened]);

    const loading = isCreating || isUpdating;

    const addSection = () => {
        setValues({
            ...values,
            sections: [...values.sections, { title: "", items: [], position: values.sections.length }],
        });
    };

    const removeSection = (index: number) => {
        const newSections = values.sections.filter((_, i) => i !== index);
        setValues({
            ...values,
            sections: newSections.map((section, i) => ({ ...section, position: i })),
        });
    };

    return (
        <Modal
            loading={loading}
            onClose={onClose}
            opened={opened}
            size="lg"
            title={packItem ? t("updateModalTitle") : t("createModalTitle")}
            {...rest}
        >
            <form
                onSubmit={onSubmit((values) => {
                    if (isDirty()) {
                        // Clean up empty items before submitting
                        const cleanedValues = {
                            ...values,
                            sections: values.sections.map(section => ({
                                ...section,
                                items: section.items.filter(item => item.trim() !== ""),
                            })),
                            allergenMap,
                        };

                        if (packItem) {
                            updatePack({ ...cleanedValues, id: packItem?.id });
                        } else {
                            createPack({ ...cleanedValues, menuId });
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
                    />
                    <Textarea
                        disabled={loading}
                        label={t("inputDescriptionLabel")}
                        placeholder={t("inputDescriptionPlaceholder")}
                        minRows={3}
                        {...getInputProps("description")}
                    />
                    <Group grow>
                        <TextInput
                            disabled={loading}
                            label={t("inputPriceLabel")}
                            placeholder={t("inputPricePlaceholder")}
                            withAsterisk
                            {...getInputProps("price")}
                        />
                        <Select
                            disabled={loading}
                            label={t("inputCurrencyLabel")}
                            data={[
                                { value: "€", label: "€ (Euro)" },
                                { value: "$", label: "$ (Dollar)" },
                            ]}
                            {...getInputProps("currency")}
                        />
                    </Group>
                    <Group grow>
                        <Select
                            disabled={loading}
                            label={t("inputVatRateLabel")}
                            data={[
                                { value: "6", label: "6%" },
                                { value: "13", label: "13%" },
                                { value: "23", label: "23%" },
                            ]}
                            value={String(values.vatRate)}
                            onChange={(value) => setValues({ ...values, vatRate: Number(value) as 6 | 13 | 23 })}
                        />
                        <Checkbox
                            disabled={loading}
                            label={t("vatIncludedLabel")}
                            mt="xl"
                            {...getInputProps("vatIncluded", { type: "checkbox" })}
                        />
                    </Group>

                    <Divider my="md" label={t("sectionsLabel")} labelPosition="center" />

                    {values.sections.map((section, index) => (
                        <Stack key={index} spacing="xs" p="sm" sx={(theme) => ({ backgroundColor: theme.colors.gray[0], borderRadius: theme.radius.md })}>
                            <Group position="apart">
                                <Text size="sm" weight={600}>Section {index + 1}</Text>
                                {values.sections.length > 1 && (
                                    <ActionIcon
                                        color="red"
                                        onClick={() => removeSection(index)}
                                        size="sm"
                                        variant="subtle"
                                    >
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                )}
                            </Group>
                            <TextInput
                                disabled={loading}
                                label={t("sectionTitleLabel")}
                                placeholder={t("sectionTitlePlaceholder")}
                                withAsterisk
                                {...getInputProps(`sections.${index}.title`)}
                            />
                            <Textarea
                                disabled={loading}
                                label={t("sectionItemsLabel")}
                                placeholder={t("sectionItemsPlaceholder")}
                                minRows={3}
                                withAsterisk
                                value={values.sections[index].items.join("\n")}
                                onChange={(e) => {
                                    const newSections = [...values.sections];
                                    newSections[index] = {
                                        ...newSections[index],
                                        items: e.target.value.split("\n"),
                                    };
                                    setValues({ ...values, sections: newSections });
                                }}
                            />
                        </Stack>
                    ))}

                    <Button
                        disabled={loading}
                        leftIcon={<IconPlus size={16} />}
                        onClick={addSection}
                        variant="light"
                    >
                        {t("addSectionButton")}
                    </Button>

                    <Divider my="md" />

                    <Button
                        compact
                        disabled={loading || isDetectingAllergens || values.sections.length === 0}
                        loading={isDetectingAllergens}
                        onClick={() => {
                            // Collect all items from all sections
                            const allItems: string[] = [];
                            values.sections.forEach((section) => {
                                section.items.forEach((item) => {
                                    if (item.trim()) {
                                        allItems.push(item.trim());
                                    }
                                });
                            });

                            if (allItems.length === 0) {
                                showErrorToast("No Items", { message: "Please add items to sections before detecting allergens" });
                                return;
                            }

                            // If allergens are already detected, confirm before overriding
                            if (Object.keys(allergenMap).length > 0) {
                                // eslint-disable-next-line no-alert
                                if (!window.confirm("Allergens have already been detected. Do you want to override them?")) {
                                    return;
                                }
                            }

                            detectAllergensAI({ items: allItems });
                        }}
                        variant="light"
                    >
                        Detect Allergens with AI
                    </Button>

                    {Object.keys(allergenMap).length > 0 && (
                        <Text size="xs" color="dimmed">
                            Allergens detected for {Object.keys(allergenMap).length} items
                        </Text>
                    )}

                    <Group mt="md" position="right">
                        <Button data-testid="save-pack-form" loading={loading} px="xl" type="submit">
                            {tCommon("save")}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};
