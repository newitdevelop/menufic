import type { FC } from "react";
import { useEffect, useState } from "react";

import {
    ActionIcon,
    Box,
    Button,
    Checkbox,
    Divider,
    FileButton,
    Group,
    Image,
    NumberInput,
    Select,
    Stack,
    Text,
    Textarea,
    TextInput,
} from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { IconPlus, IconTrash, IconUpload } from "@tabler/icons";
import { useTranslations } from "next-intl";

import type { ModalProps } from "@mantine/core";

import { api } from "src/utils/api";
import { compressImage, showErrorToast, showSuccessToast } from "src/utils/helpers";
import { packInput } from "src/utils/validators";

import { Modal } from "../Modal";

interface PackSection {
    title: string;
    items: string[];
    position: number;
}

interface Props extends ModalProps {
    /** Pack to be edited (if editing) */
    pack?: any;
    /** ID of the menu that the pack belongs to */
    menuId: string;
}

/** Form for creating or editing menu packs */
export const PackForm: FC<Props> = ({ opened, onClose, menuId, pack, ...rest }) => {
    const trpcCtx = api.useContext();
    const t = useTranslations("dashboard.editMenu.pack");
    const tCommon = useTranslations("common");

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    const [isCompressingImage, setIsCompressingImage] = useState(false);

    const { mutate: createPack, isLoading: isCreating } = api.pack.create.useMutation({
        onError: (err: unknown) => showErrorToast(t("createError"), err as { message: string }),
        onSuccess: (data: any) => {
            onClose();
            (trpcCtx.pack as any).getByMenuId.setData({ menuId }, (packs: any) => [...(packs || []), data]);
            showSuccessToast(tCommon("createSuccess"), t("createSuccessDesc", { name: data.name }));
        },
    });

    const { mutate: updatePack, isLoading: isUpdating } = api.pack.update.useMutation({
        onError: (err: unknown) => showErrorToast(t("updateError"), err as { message: string }),
        onSuccess: (data: any) => {
            onClose();
            (trpcCtx.pack as any).getByMenuId.setData({ menuId }, (packs: any) =>
                packs?.map((item: any) => (item.id === data.id ? { ...item, ...data } : item))
            );
            showSuccessToast(tCommon("updateSuccess"), t("updateSuccessDesc", { name: data.name }));
        },
    });

    const { getInputProps, onSubmit, isDirty, resetDirty, setValues, values, setFieldValue } = useForm({
        initialValues: {
            name: pack?.name || "",
            description: pack?.description || "",
            price: pack?.price || "",
            currency: pack?.currency || "€",
            vatRate: pack?.vatRate || 23,
            vatIncluded: pack?.vatIncluded !== undefined ? pack.vatIncluded : true,
            isActive: pack?.isActive !== undefined ? pack.isActive : true,
            sections: pack?.sections || [{ title: "", items: [""], position: 0 }],
            imageBase64: "",
            imagePath: pack?.image?.path || "",
            isAiGeneratedImage: false,
        },
        validate: zodResolver(packInput),
    });

    useEffect(() => {
        if (opened) {
            const initialValues = {
                name: pack?.name || "",
                description: pack?.description || "",
                price: pack?.price || "",
                currency: pack?.currency || "€",
                vatRate: pack?.vatRate || 23,
                vatIncluded: pack?.vatIncluded !== undefined ? pack.vatIncluded : true,
                isActive: pack?.isActive !== undefined ? pack.isActive : true,
                sections: pack?.sections || [{ title: "", items: [""], position: 0 }],
                imageBase64: "",
                imagePath: pack?.image?.path || "",
                isAiGeneratedImage: false,
            };
            setValues(initialValues);
            resetDirty(initialValues);
            setImagePreview(pack?.image?.path || "");
            setImageFile(null);
        }
    }, [opened, pack]);

    const handleImageChange = async (file: File | null) => {
        if (!file) return;

        setImageFile(file);
        setIsCompressingImage(true);

        try {
            const compressedBase64 = await compressImage(file);
            setFieldValue("imageBase64", compressedBase64);
            setFieldValue("imagePath", `pack-${Date.now()}-${file.name}`);
            setImagePreview(compressedBase64);
        } catch (error) {
            showErrorToast(t("imageCompressError"), error as { message: string });
        } finally {
            setIsCompressingImage(false);
        }
    };

    const handleSubmit = (formValues: any) => {
        const data = {
            ...formValues,
            ...(pack ? { id: pack.id } : { menuId }),
        };

        if (pack) {
            updatePack(data);
        } else {
            createPack(data);
        }
    };

    const addSection = () => {
        setFieldValue("sections", [
            ...values.sections,
            { title: "", items: [""], position: values.sections.length },
        ]);
    };

    const removeSection = (index: number) => {
        const newSections = values.sections.filter((_, i) => i !== index);
        setFieldValue(
            "sections",
            newSections.map((s, i) => ({ ...s, position: i }))
        );
    };

    const addItemToSection = (sectionIndex: number) => {
        const newSections = [...values.sections];
        newSections[sectionIndex].items.push("");
        setFieldValue("sections", newSections);
    };

    const removeItemFromSection = (sectionIndex: number, itemIndex: number) => {
        const newSections = [...values.sections];
        newSections[sectionIndex].items = newSections[sectionIndex].items.filter((_, i) => i !== itemIndex);
        setFieldValue("sections", newSections);
    };

    const isLoading = isCreating || isUpdating || isCompressingImage;

    return (
        <Modal
            loading={isLoading}
            onClose={onClose}
            opened={opened}
            size="xl"
            title={pack ? t("editPack") : t("createPack")}
            {...rest}
        >
            <form onSubmit={onSubmit(handleSubmit)}>
                <Stack spacing="md">
                    <TextInput
                        label={t("name")}
                        placeholder={t("namePlaceholder")}
                        required
                        {...getInputProps("name")}
                    />

                    <Textarea
                        label={t("description")}
                        placeholder={t("descriptionPlaceholder")}
                        minRows={2}
                        {...getInputProps("description")}
                    />

                    <Group grow>
                        <TextInput
                            label={t("price")}
                            placeholder="75.00"
                            required
                            {...getInputProps("price")}
                        />

                        <Select
                            data={[
                                { label: "€ (EUR)", value: "€" },
                                { label: "$ (USD)", value: "$" },
                            ]}
                            label={t("currency")}
                            {...getInputProps("currency")}
                        />
                    </Group>

                    <Group grow>
                        <Select
                            data={[
                                { label: "6%", value: "6" },
                                { label: "13%", value: "13" },
                                { label: "23%", value: "23" },
                            ]}
                            label={t("vatRate")}
                            {...getInputProps("vatRate")}
                        />

                        <Checkbox
                            label={t("vatIncluded")}
                            mt="xl"
                            {...getInputProps("vatIncluded", { type: "checkbox" })}
                        />
                    </Group>

                    <Checkbox
                        label={t("isActive")}
                        {...getInputProps("isActive", { type: "checkbox" })}
                    />

                    <Divider label={t("image")} labelPosition="center" />

                    <Stack spacing="xs">
                        {imagePreview && (
                            <Image
                                alt="Pack preview"
                                height={200}
                                radius="md"
                                src={imagePreview.startsWith("data:") ? imagePreview : `https://ik.imagekit.io/test/${imagePreview}`}
                                width="100%"
                                withPlaceholder
                            />
                        )}

                        <FileButton accept="image/*" onChange={handleImageChange}>
                            {(props) => (
                                <Button
                                    {...props}
                                    leftIcon={<IconUpload size={16} />}
                                    loading={isCompressingImage}
                                    variant="light"
                                >
                                    {imagePreview ? t("changeImage") : t("uploadImage")}
                                </Button>
                            )}
                        </FileButton>
                    </Stack>

                    <Divider label={t("sections")} labelPosition="center" />

                    {values.sections.map((section, sectionIndex) => (
                        <Box key={`section-${sectionIndex}-${section.title}`} sx={(theme) => ({ padding: theme.spacing.md, backgroundColor: theme.colors.gray[0], borderRadius: theme.radius.md })}>
                            <Group position="apart" mb="sm">
                                <Text weight={600}>
                                    {t("section")} {sectionIndex + 1}
                                </Text>
                                {values.sections.length > 1 && (
                                    <ActionIcon
                                        color="red"
                                        onClick={() => removeSection(sectionIndex)}
                                        variant="subtle"
                                    >
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                )}
                            </Group>

                            <TextInput
                                label={t("sectionTitle")}
                                placeholder={t("sectionTitlePlaceholder")}
                                required
                                mb="sm"
                                {...getInputProps(`sections.${sectionIndex}.title`)}
                            />

                            <Stack spacing="xs">
                                <Text size="sm" weight={500}>
                                    {t("items")}
                                </Text>
                                {section.items.map((item, itemIndex) => (
                                    <Group key={`item-${sectionIndex}-${itemIndex}-${item}`} spacing="xs">
                                        <TextInput
                                            placeholder={t("itemPlaceholder")}
                                            required
                                            sx={{ flex: 1 }}
                                            {...getInputProps(`sections.${sectionIndex}.items.${itemIndex}`)}
                                        />
                                        {section.items.length > 1 && (
                                            <ActionIcon
                                                color="red"
                                                onClick={() => removeItemFromSection(sectionIndex, itemIndex)}
                                                variant="subtle"
                                            >
                                                <IconTrash size={16} />
                                            </ActionIcon>
                                        )}
                                    </Group>
                                ))}
                                <Button
                                    leftIcon={<IconPlus size={16} />}
                                    onClick={() => addItemToSection(sectionIndex)}
                                    size="xs"
                                    variant="light"
                                >
                                    {t("addItem")}
                                </Button>
                            </Stack>
                        </Box>
                    ))}

                    <Button leftIcon={<IconPlus size={16} />} onClick={addSection} variant="outline">
                        {t("addSection")}
                    </Button>

                    <Group position="right">
                        <Button disabled={!isDirty()} loading={isLoading} type="submit">
                            {pack ? tCommon("update") : tCommon("create")}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};
