import type { FC } from "react";
import { useEffect } from "react";

import { Button, Checkbox, Group, Stack, Textarea, TextInput, useMantineTheme } from "@mantine/core";
import { DatePicker, TimeInput } from "@mantine/dates";
import { useForm, zodResolver } from "@mantine/form";
import { useTranslations } from "next-intl";

import type { ModalProps } from "@mantine/core";
import type { Menu } from "@prisma/client";

import { api } from "src/utils/api";
import { showErrorToast, showSuccessToast } from "src/utils/helpers";
import { menuInput } from "src/utils/validators";

import { Modal } from "../Modal";

interface Props extends ModalProps {
    /** Menu to be edited */
    menu?: Menu;
    /** Id of the restaurant that the menu belongs to */
    restaurantId: string;
}

/** Form to be used when allowing users to add or edit menus of restaurant */
export const MenuForm: FC<Props> = ({ opened, onClose, restaurantId, menu: menuItem, ...rest }) => {
    const trpcCtx = api.useContext();
    const theme = useMantineTheme();
    const t = useTranslations("dashboard.editMenu.menu");
    const tCommon = useTranslations("common");

    const { mutate: createMenu, isLoading: isCreating } = api.menu.create.useMutation({
        onError: (err: unknown) => showErrorToast(t("createError"), err as { message: string }),
        onSuccess: (data: any) => {
            onClose();
            (trpcCtx.menu as any).getAll.setData({ restaurantId }, (menus: any) => [...(menus || []), data]);
            showSuccessToast(tCommon("createSuccess"), t("createSuccessDesc", { name: data.name }));
        },
    });

    const { mutate: updateMenu, isLoading: isUpdating } = api.menu.update.useMutation({
        onError: (err: unknown) => showErrorToast(t("updateError"), err as { message: string }),
        onSuccess: (data: any) => {
            onClose();
            (trpcCtx.menu as any).getAll.setData({ restaurantId }, (menus: any) =>
                menus?.map((item: any) => (item.id === data.id ? { ...item, ...data } : item))
            );
            showSuccessToast(tCommon("updateSuccess"), t("updateSuccessDesc", { name: data.name }));
        },
    });

    // Parse availableTime into start and end times as Date objects
    const parseAvailableTime = (timeString: string) => {
        if (!timeString) return { startTime: null, endTime: null };
        const parts = timeString.split(" - ");

        const parseTime = (timeStr: string): Date | null => {
            if (!timeStr) return null;
            // Handle both "10h" and "10:00" formats
            const cleaned = timeStr.trim().replace("h", ":00");
            const [hours, minutes] = cleaned.split(":").map(Number);
            if (Number.isNaN(hours)) return null;

            const date = new Date();
            date.setHours(hours, minutes || 0, 0, 0);
            return date;
        };

        return {
            startTime: parseTime(parts[0] || ""),
            endTime: parseTime(parts[1] || ""),
        };
    };

    const { startTime: initialStartTime, endTime: initialEndTime } = parseAvailableTime(menuItem?.availableTime || "");

    const { getInputProps, onSubmit, isDirty, resetDirty, setValues, values } = useForm({
        initialValues: {
            startTime: initialStartTime,
            endTime: initialEndTime,
            email: menuItem?.email || "",
            reservations: (menuItem as any)?.reservations || "",
            message: menuItem?.message || "",
            name: menuItem?.name || "",
            telephone: menuItem?.telephone || "",
            isTemporary: (menuItem as any)?.isTemporary || false,
            startDate: (menuItem as any)?.startDate ? new Date((menuItem as any).startDate) : null,
            endDate: (menuItem as any)?.endDate ? new Date((menuItem as any).endDate) : null,
            isFestive: (menuItem as any)?.isFestive || false,
            isActive: (menuItem as any)?.isActive !== undefined ? (menuItem as any).isActive : true,
        },
    });

    useEffect(() => {
        if (opened) {
            const { startTime, endTime } = parseAvailableTime(menuItem?.availableTime || "");
            const values = {
                startTime,
                endTime,
                email: menuItem?.email || "",
                reservations: (menuItem as any)?.reservations || "",
                message: menuItem?.message || "",
                name: menuItem?.name || "",
                telephone: menuItem?.telephone || "",
                isTemporary: (menuItem as any)?.isTemporary || false,
                startDate: (menuItem as any)?.startDate ? new Date((menuItem as any).startDate) : null,
                endDate: (menuItem as any)?.endDate ? new Date((menuItem as any).endDate) : null,
                isFestive: (menuItem as any)?.isFestive || false,
                isActive: (menuItem as any)?.isActive !== undefined ? (menuItem as any).isActive : true,
            };
            setValues(values);
            resetDirty(values);
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
                onSubmit={onSubmit((values) => {
                    // Convert Date objects to time strings in HH:mm format
                    const formatTime = (date: Date | null): string => {
                        if (!date) return "";
                        const hours = date.getHours().toString().padStart(2, '0');
                        const minutes = date.getMinutes().toString().padStart(2, '0');
                        return `${hours}:${minutes}`;
                    };

                    // Combine start and end times into availableTime string
                    const startTimeStr = formatTime(values.startTime);
                    const endTimeStr = formatTime(values.endTime);
                    const availableTime = startTimeStr && endTimeStr
                        ? `${startTimeStr} - ${endTimeStr}`
                        : startTimeStr || endTimeStr || "";

                    // Remove startTime and endTime from the data, only send availableTime
                    const { startTime, endTime, ...restValues } = values;
                    const submitData = {
                        ...restValues,
                        availableTime,
                    };

                    if (menuItem) {
                        updateMenu({ ...submitData, id: menuItem?.id });
                    } else {
                        createMenu({ ...submitData, restaurantId });
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
                    <Group grow>
                        <TimeInput
                            disabled={loading}
                            label="Start Time"
                            placeholder="e.g., 11:00"
                            format="24"
                            clearable
                            {...getInputProps("startTime")}
                        />
                        <TimeInput
                            disabled={loading}
                            label="End Time"
                            placeholder="e.g., 23:00"
                            format="24"
                            clearable
                            {...getInputProps("endTime")}
                        />
                    </Group>
                    <TextInput
                        disabled={loading}
                        label={t("inputTelephoneLabel")}
                        placeholder={t("inputTelephonePlaceholder")}
                        {...getInputProps("telephone")}
                    />
                    <TextInput
                        disabled={loading}
                        label={t("inputEmailLabel")}
                        placeholder={t("inputEmailPlaceholder")}
                        type="email"
                        {...getInputProps("email")}
                    />
                    <TextInput
                        disabled={loading}
                        label={t("inputReservationsLabel")}
                        placeholder={t("inputReservationsPlaceholder")}
                        type="url"
                        {...getInputProps("reservations")}
                    />
                    <Textarea
                        disabled={loading}
                        label={t("inputMessageLabel")}
                        placeholder={t("inputMessagePlaceholder")}
                        {...getInputProps("message")}
                    />
                    <Checkbox
                        disabled={loading}
                        label="Festive Menu (🎄 highlighted)"
                        {...getInputProps("isFestive", { type: "checkbox" })}
                    />
                    <Checkbox
                        disabled={loading}
                        label="Temporary Menu (with start/end dates)"
                        {...getInputProps("isTemporary", { type: "checkbox" })}
                    />
                    {values.isTemporary && (
                        <>
                            <DatePicker
                                disabled={loading}
                                label="Start Date"
                                placeholder="Select start date"
                                clearable
                                {...getInputProps("startDate")}
                            />
                            <DatePicker
                                disabled={loading}
                                label="End Date (menu will be disabled after this)"
                                placeholder="Select end date"
                                withAsterisk
                                clearable
                                {...getInputProps("endDate")}
                            />
                        </>
                    )}
                    <Checkbox
                        disabled={loading}
                        label={t("isActiveLabel")}
                        description={t("isActiveDescription")}
                        styles={{
                            label: {
                                color: !values.isActive ? theme.colors.red[7] : undefined,
                                fontWeight: !values.isActive ? 600 : undefined,
                            },
                            description: {
                                color: !values.isActive ? theme.colors.red[6] : undefined,
                            }
                        }}
                        {...getInputProps("isActive", { type: "checkbox" })}
                    />
                    <Group mt="md" position="right">
                        <Button data-testid="save-menu-form" loading={loading} px="xl" type="submit">
                            {tCommon("save")}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};
