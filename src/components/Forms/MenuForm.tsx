import type { FC } from "react";
import { useEffect } from "react";

import { ActionIcon, Button, Checkbox, Chip, Group, MultiSelect, Stack, Textarea, Text, TextInput, useMantineTheme, Select, NumberInput, Divider } from "@mantine/core";
import { DatePicker, TimeInput } from "@mantine/dates";
import { useForm, zodResolver } from "@mantine/form";
import { IconPlus, IconTrash } from "@tabler/icons";
import { useTranslations } from "next-intl";

import type { ModalProps } from "@mantine/core";
import type { Menu } from "@prisma/client";

import { api } from "src/utils/api";
import { showErrorToast, showSuccessToast } from "src/utils/helpers";
import { menuInput } from "src/utils/validators";

import { Modal } from "../Modal";

interface TimeRange {
    startTime: Date | null;
    endTime: Date | null;
}

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

    // Parse availableTime string into array of TimeRange objects
    const parseAvailableTime = (timeString: string): TimeRange[] => {
        if (!timeString) return [{ startTime: null, endTime: null }];

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

        // Split by comma for multiple time ranges, then by dash for start-end
        const ranges = timeString.split(",").map(range => {
            const parts = range.trim().split(" - ");
            return {
                startTime: parseTime(parts[0] || ""),
                endTime: parseTime(parts[1] || ""),
            };
        });

        return ranges.length > 0 ? ranges : [{ startTime: null, endTime: null }];
    };

    const initialTimeRanges = parseAvailableTime(menuItem?.availableTime || "");

    // Parse time string (HH:mm) to Date object
    const parseTimeString = (timeStr: string | null | undefined): Date | null => {
        if (!timeStr) return null;
        const [hours, minutes] = timeStr.split(":").map(Number);
        if (Number.isNaN(hours)) return null;
        const date = new Date();
        date.setHours(hours, minutes || 0, 0, 0);
        return date;
    };

    const { getInputProps, onSubmit, isDirty, resetDirty, setValues, values, setFieldValue, insertListItem, removeListItem } = useForm({
        initialValues: {
            timeRanges: initialTimeRanges,
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
            // Menu type fields
            menuType: (menuItem as any)?.menuType || "EXTERNAL",
            externalUrl: (menuItem as any)?.externalUrl || "",
            // Schedule fields - map legacy isTemporary to PERIOD schedule type
            scheduleType: (menuItem as any)?.scheduleType || ((menuItem as any)?.isTemporary ? "PERIOD" : "ALWAYS"),
            dailyStartTime: (menuItem as any)?.dailyStartTime || null,
            dailyEndTime: (menuItem as any)?.dailyEndTime || null,
            weeklyDays: (menuItem as any)?.weeklyDays || [],
            monthlyDays: (menuItem as any)?.monthlyDays || [],
            monthlyWeekday: (menuItem as any)?.monthlyWeekday ?? null,
            monthlyWeekdayOrdinal: (menuItem as any)?.monthlyWeekdayOrdinal ?? null,
            yearlyStartDate: (menuItem as any)?.yearlyStartDate || null,
            yearlyEndDate: (menuItem as any)?.yearlyEndDate || null,
            // Map legacy startDate/endDate to period fields if isTemporary was set
            periodStartDate: (menuItem as any)?.periodStartDate ? new Date((menuItem as any).periodStartDate) : ((menuItem as any)?.isTemporary && (menuItem as any)?.startDate ? new Date((menuItem as any).startDate) : null),
            periodEndDate: (menuItem as any)?.periodEndDate ? new Date((menuItem as any).periodEndDate) : ((menuItem as any)?.isTemporary && (menuItem as any)?.endDate ? new Date((menuItem as any).endDate) : null),
            // New reservation system fields
            reservationType: (menuItem as any)?.reservationType || "NONE",
            reservationUrl: (menuItem as any)?.reservationUrl || "",
            reservationEmail: (menuItem as any)?.reservationEmail || menuItem?.email || "",
            reservationStartTime: parseTimeString((menuItem as any)?.reservationStartTime),
            reservationEndTime: parseTimeString((menuItem as any)?.reservationEndTime),
            reservationMaxPartySize: (menuItem as any)?.reservationMaxPartySize || 12,
            reservationSlotDuration: (menuItem as any)?.reservationSlotDuration || 30,
        },
        validate: zodResolver(menuInput),
    });

    useEffect(() => {
        if (opened) {
            const timeRanges = parseAvailableTime(menuItem?.availableTime || "");
            const newValues = {
                timeRanges,
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
                // Menu type fields
                menuType: (menuItem as any)?.menuType || "EXTERNAL",
                externalUrl: (menuItem as any)?.externalUrl || "",
                // Schedule fields - map legacy isTemporary to PERIOD schedule type
                scheduleType: (menuItem as any)?.scheduleType || ((menuItem as any)?.isTemporary ? "PERIOD" : "ALWAYS"),
                dailyStartTime: (menuItem as any)?.dailyStartTime || null,
                dailyEndTime: (menuItem as any)?.dailyEndTime || null,
                weeklyDays: (menuItem as any)?.weeklyDays || [],
                monthlyDays: (menuItem as any)?.monthlyDays || [],
                monthlyWeekday: (menuItem as any)?.monthlyWeekday ?? null,
                monthlyWeekdayOrdinal: (menuItem as any)?.monthlyWeekdayOrdinal ?? null,
                yearlyStartDate: (menuItem as any)?.yearlyStartDate || null,
                yearlyEndDate: (menuItem as any)?.yearlyEndDate || null,
                // Map legacy startDate/endDate to period fields if isTemporary was set
                periodStartDate: (menuItem as any)?.periodStartDate ? new Date((menuItem as any).periodStartDate) : ((menuItem as any)?.isTemporary && (menuItem as any)?.startDate ? new Date((menuItem as any).startDate) : null),
                periodEndDate: (menuItem as any)?.periodEndDate ? new Date((menuItem as any).periodEndDate) : ((menuItem as any)?.isTemporary && (menuItem as any)?.endDate ? new Date((menuItem as any).endDate) : null),
                // New reservation system fields
                reservationType: (menuItem as any)?.reservationType || "NONE",
                reservationUrl: (menuItem as any)?.reservationUrl || "",
                reservationEmail: (menuItem as any)?.reservationEmail || menuItem?.email || "",
                reservationStartTime: parseTimeString((menuItem as any)?.reservationStartTime),
                reservationEndTime: parseTimeString((menuItem as any)?.reservationEndTime),
                reservationMaxPartySize: (menuItem as any)?.reservationMaxPartySize || 12,
                reservationSlotDuration: (menuItem as any)?.reservationSlotDuration || 30,
            };
            setValues(newValues);
            resetDirty(newValues);
        }
    }, [menuItem, opened]);

    const loading = isCreating || isUpdating;

    const addTimeRange = () => {
        insertListItem("timeRanges", { startTime: null, endTime: null });
    };

    const removeTimeRange = (index: number) => {
        if (values.timeRanges.length > 1) {
            removeListItem("timeRanges", index);
        }
    };

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

                    // Combine all time ranges into comma-separated availableTime string
                    const availableTime = values.timeRanges
                        .map(range => {
                            const startTimeStr = formatTime(range.startTime);
                            const endTimeStr = formatTime(range.endTime);
                            if (startTimeStr && endTimeStr) {
                                return `${startTimeStr} - ${endTimeStr}`;
                            }
                            return "";
                        })
                        .filter(Boolean)
                        .join(", ");

                    // Remove timeRanges from the data, only send availableTime
                    const { timeRanges, reservationStartTime, reservationEndTime, ...restValues } = values;

                    // Map PERIOD schedule type to legacy isTemporary fields for backward compatibility
                    const isTemporaryFromSchedule = values.scheduleType === "PERIOD";
                    const startDateFromSchedule = isTemporaryFromSchedule ? values.periodStartDate : null;
                    const endDateFromSchedule = isTemporaryFromSchedule ? values.periodEndDate : null;

                    const submitData = {
                        ...restValues,
                        availableTime,
                        reservationStartTime: formatTime(reservationStartTime),
                        reservationEndTime: formatTime(reservationEndTime),
                        // Set isTemporary and dates based on PERIOD schedule type
                        isTemporary: isTemporaryFromSchedule,
                        startDate: startDateFromSchedule,
                        endDate: endDateFromSchedule,
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

                    <Divider my="md" label="Menu Type" labelPosition="center" />

                    <Select
                        disabled={loading}
                        label="Menu Type"
                        description="Choose who this menu is for"
                        data={[
                            { value: "INTERNAL", label: "Internal Menu (for employees)" },
                            { value: "EXTERNAL", label: "External Menu (for guests)" },
                        ]}
                        withAsterisk
                        {...getInputProps("menuType")}
                    />


                    <div>
                        <Text size="sm" weight={500} mb={8}>
                            Available Times
                        </Text>
                        {values.timeRanges.map((_, index) => (
                            <Group key={index} grow mb="xs" align="flex-end">
                                <TimeInput
                                    disabled={loading}
                                    label={index === 0 ? "Start Time" : undefined}
                                    placeholder="e.g., 11:00"
                                    format="24"
                                    clearable
                                    {...getInputProps(`timeRanges.${index}.startTime`)}
                                />
                                <TimeInput
                                    disabled={loading}
                                    label={index === 0 ? "End Time" : undefined}
                                    placeholder="e.g., 23:00"
                                    format="24"
                                    clearable
                                    {...getInputProps(`timeRanges.${index}.endTime`)}
                                />
                                <ActionIcon
                                    color="red"
                                    variant="subtle"
                                    onClick={() => removeTimeRange(index)}
                                    disabled={loading || values.timeRanges.length === 1}
                                    mb={4}
                                >
                                    <IconTrash size={18} />
                                </ActionIcon>
                            </Group>
                        ))}
                        <Button
                            variant="subtle"
                            leftIcon={<IconPlus size={16} />}
                            onClick={addTimeRange}
                            disabled={loading}
                            size="xs"
                            mt={4}
                        >
                            Add Time Range
                        </Button>
                    </div>

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
                    <Textarea
                        disabled={loading}
                        label={t("inputMessageLabel")}
                        placeholder={t("inputMessagePlaceholder")}
                        {...getInputProps("message")}
                    />

                    <Divider my="md" label="Reservation System" labelPosition="center" />

                    <Select
                        disabled={loading}
                        label="Reservation Type"
                        description="Choose how customers can make reservations"
                        data={[
                            { value: "NONE", label: "No Reservations" },
                            { value: "EXTERNAL", label: "External URL (e.g., TheFork, OpenTable)" },
                            { value: "FORM", label: "Built-in Reservation Form" },
                        ]}
                        {...getInputProps("reservationType")}
                    />

                    {values.reservationType === "EXTERNAL" && (
                        <TextInput
                            disabled={loading}
                            label="External Reservation URL"
                            placeholder="https://www.thefork.com/restaurant/..."
                            type="url"
                            withAsterisk
                            {...getInputProps("reservationUrl")}
                        />
                    )}

                    {values.reservationType === "FORM" && (
                        <Stack spacing="sm">
                            <TextInput
                                disabled={loading}
                                label="Reservation Email"
                                description="Email address to receive reservation requests"
                                placeholder="reservations@restaurant.com"
                                type="email"
                                withAsterisk
                                {...getInputProps("reservationEmail")}
                            />
                            <Group grow>
                                <TimeInput
                                    disabled={loading}
                                    label="Reservation Start Time"
                                    description="First available reservation time"
                                    placeholder="10:00"
                                    format="24"
                                    clearable
                                    withAsterisk
                                    {...getInputProps("reservationStartTime")}
                                />
                                <TimeInput
                                    disabled={loading}
                                    label="Reservation End Time"
                                    description="Last available reservation time"
                                    placeholder="22:00"
                                    format="24"
                                    clearable
                                    withAsterisk
                                    {...getInputProps("reservationEndTime")}
                                />
                            </Group>
                            <Group grow>
                                <NumberInput
                                    disabled={loading}
                                    label="Maximum Party Size"
                                    description="Maximum number of people per reservation"
                                    placeholder="12"
                                    min={1}
                                    max={50}
                                    withAsterisk
                                    {...getInputProps("reservationMaxPartySize")}
                                />
                                <Select
                                    disabled={loading}
                                    label="Time Slot Duration"
                                    description="Duration of each reservation slot"
                                    data={[
                                        { value: "15", label: "15 minutes" },
                                        { value: "30", label: "30 minutes" },
                                        { value: "45", label: "45 minutes" },
                                        { value: "60", label: "1 hour" },
                                        { value: "90", label: "1.5 hours" },
                                        { value: "120", label: "2 hours" },
                                    ]}
                                    value={String(values.reservationSlotDuration)}
                                    onChange={(val) => setFieldValue("reservationSlotDuration", val ? parseInt(val, 10) : 30)}
                                    withAsterisk
                                />
                            </Group>
                        </Stack>
                    )}
                    <Checkbox
                        disabled={loading}
                        label="Festive Menu (🎄 highlighted)"
                        {...getInputProps("isFestive", { type: "checkbox" })}
                    />
                    <Divider my="md" label="Display Schedule" labelPosition="center" />

                    <Select
                        disabled={loading}
                        label="Display Schedule"
                        description="Choose when this menu should be displayed"
                        data={[
                            { value: "ALWAYS", label: "Always Display" },
                            { value: "DAILY", label: "Daily (specific time range)" },
                            { value: "WEEKLY", label: "Weekly (specific days)" },
                            { value: "MONTHLY", label: "Monthly (specific days)" },
                            { value: "YEARLY", label: "Yearly (seasonal/annual period)" },
                            { value: "PERIOD", label: "Specific Period (date range)" },
                        ]}
                        {...getInputProps("scheduleType")}
                    />

                    {values.scheduleType === "DAILY" && (
                        <Group grow mt="sm">
                            <TimeInput
                                label="Start Time"
                                description="Menu starts displaying at this time each day"
                                disabled={loading}
                                format="24"
                                value={values.dailyStartTime ? new Date(`2000-01-01T${values.dailyStartTime}`) : undefined}
                                onChange={(date) => {
                                    if (date) {
                                        const hours = String(date.getHours()).padStart(2, "0");
                                        const minutes = String(date.getMinutes()).padStart(2, "0");
                                        setFieldValue("dailyStartTime", `${hours}:${minutes}`);
                                    } else {
                                        setFieldValue("dailyStartTime", null);
                                    }
                                }}
                            />
                            <TimeInput
                                label="End Time"
                                description="Menu stops displaying at this time each day"
                                disabled={loading}
                                format="24"
                                value={values.dailyEndTime ? new Date(`2000-01-01T${values.dailyEndTime}`) : undefined}
                                onChange={(date) => {
                                    if (date) {
                                        const hours = String(date.getHours()).padStart(2, "0");
                                        const minutes = String(date.getMinutes()).padStart(2, "0");
                                        setFieldValue("dailyEndTime", `${hours}:${minutes}`);
                                    } else {
                                        setFieldValue("dailyEndTime", null);
                                    }
                                }}
                            />
                        </Group>
                    )}

                    {values.scheduleType === "WEEKLY" && (
                        <>
                            <Text size="sm" weight={500} mt="sm">Select Days of Week</Text>
                            <Chip.Group
                                multiple
                                value={values.weeklyDays.map(String)}
                                onChange={(selected) => {
                                    setFieldValue("weeklyDays", selected.map(Number));
                                }}
                            >
                                <Group mt="xs">
                                    <Chip value="0">Sunday</Chip>
                                    <Chip value="1">Monday</Chip>
                                    <Chip value="2">Tuesday</Chip>
                                    <Chip value="3">Wednesday</Chip>
                                    <Chip value="4">Thursday</Chip>
                                    <Chip value="5">Friday</Chip>
                                    <Chip value="6">Saturday</Chip>
                                </Group>
                            </Chip.Group>
                        </>
                    )}

                    {values.scheduleType === "MONTHLY" && (
                        <Stack spacing="sm" mt="sm">
                            <Select
                                label="Monthly Schedule Type"
                                description="Choose how to schedule monthly display"
                                data={[
                                    { value: "days", label: "Specific days of month (e.g., 1st, 15th, 30th)" },
                                    { value: "weekday", label: "Specific weekday (e.g., first Monday)" },
                                ]}
                                disabled={loading}
                                value={values.monthlyWeekday !== null && values.monthlyWeekday !== undefined ? "weekday" : "days"}
                                onChange={(value) => {
                                    if (value === "weekday") {
                                        setFieldValue("monthlyDays", []);
                                        setFieldValue("monthlyWeekday", 1); // Default to Monday
                                        setFieldValue("monthlyWeekdayOrdinal", 1); // Default to first
                                    } else {
                                        setFieldValue("monthlyWeekday", null);
                                        setFieldValue("monthlyWeekdayOrdinal", null);
                                    }
                                }}
                            />

                            {(values.monthlyWeekday === null || values.monthlyWeekday === undefined) && (
                                <MultiSelect
                                    label="Days of Month"
                                    description="Select which days of the month to display menu"
                                    placeholder="Select days (1-31)"
                                    data={Array.from({ length: 31 }, (_, i) => ({
                                        value: String(i + 1),
                                        label: String(i + 1),
                                    }))}
                                    searchable
                                    disabled={loading}
                                    value={values.monthlyDays.map(String)}
                                    onChange={(selected) => {
                                        setFieldValue("monthlyDays", selected.map(Number));
                                    }}
                                />
                            )}

                            {values.monthlyWeekday !== null && values.monthlyWeekday !== undefined && (
                                <Group grow>
                                    <Select
                                        label="Which occurrence"
                                        description="Select which occurrence in the month"
                                        data={[
                                            { value: "1", label: "First" },
                                            { value: "2", label: "Second" },
                                            { value: "3", label: "Third" },
                                            { value: "4", label: "Fourth" },
                                            { value: "-1", label: "Last" },
                                        ]}
                                        disabled={loading}
                                        value={String(values.monthlyWeekdayOrdinal ?? 1)}
                                        onChange={(value) => {
                                            setFieldValue("monthlyWeekdayOrdinal", value ? parseInt(value) : 1);
                                        }}
                                    />
                                    <Select
                                        label="Day of week"
                                        description="Select which day of the week"
                                        data={[
                                            { value: "0", label: "Sunday" },
                                            { value: "1", label: "Monday" },
                                            { value: "2", label: "Tuesday" },
                                            { value: "3", label: "Wednesday" },
                                            { value: "4", label: "Thursday" },
                                            { value: "5", label: "Friday" },
                                            { value: "6", label: "Saturday" },
                                        ]}
                                        disabled={loading}
                                        value={String(values.monthlyWeekday ?? 1)}
                                        onChange={(value) => {
                                            setFieldValue("monthlyWeekday", value ? parseInt(value) : 1);
                                        }}
                                    />
                                </Group>
                            )}
                        </Stack>
                    )}

                    {values.scheduleType === "YEARLY" && (
                        <Group grow mt="sm">
                            <Stack spacing={4}>
                                <Text size="sm" weight={500}>Start Date (Annual)</Text>
                                <Text size="xs" color="dimmed">Menu starts displaying from this date every year</Text>
                                <DatePicker
                                    disabled={loading}
                                    value={
                                        values.yearlyStartDate
                                            ? (() => {
                                                try {
                                                    const parts = values.yearlyStartDate.split("-");
                                                    const month = parseInt(parts[0]) - 1;
                                                    const day = parseInt(parts[1]);
                                                    return new Date(new Date().getFullYear(), month, day);
                                                } catch {
                                                    return null;
                                                }
                                            })()
                                            : null
                                    }
                                    onChange={(date) => {
                                        if (date) {
                                            const month = String(date.getMonth() + 1).padStart(2, "0");
                                            const day = String(date.getDate()).padStart(2, "0");
                                            setFieldValue("yearlyStartDate", `${month}-${day}`);
                                        } else {
                                            setFieldValue("yearlyStartDate", null);
                                        }
                                    }}
                                />
                            </Stack>
                            <Stack spacing={4}>
                                <Text size="sm" weight={500}>End Date (Annual)</Text>
                                <Text size="xs" color="dimmed">Menu stops displaying after this date every year</Text>
                                <DatePicker
                                    disabled={loading}
                                    value={
                                        values.yearlyEndDate
                                            ? (() => {
                                                try {
                                                    const parts = values.yearlyEndDate.split("-");
                                                    const month = parseInt(parts[0]) - 1;
                                                    const day = parseInt(parts[1]);
                                                    return new Date(new Date().getFullYear(), month, day);
                                                } catch {
                                                    return null;
                                                }
                                            })()
                                            : null
                                    }
                                    onChange={(date) => {
                                        if (date) {
                                            const month = String(date.getMonth() + 1).padStart(2, "0");
                                            const day = String(date.getDate()).padStart(2, "0");
                                            setFieldValue("yearlyEndDate", `${month}-${day}`);
                                        } else {
                                            setFieldValue("yearlyEndDate", null);
                                        }
                                    }}
                                />
                            </Stack>
                        </Group>
                    )}

                    {values.scheduleType === "PERIOD" && (
                        <Group grow mt="sm">
                            <DatePicker
                                label="Period Start Date"
                                description="Menu starts displaying from this date"
                                disabled={loading}
                                clearable
                                {...getInputProps("periodStartDate")}
                            />
                            <DatePicker
                                label="Period End Date"
                                description="Menu stops displaying after this date"
                                disabled={loading}
                                clearable
                                {...getInputProps("periodEndDate")}
                            />
                        </Group>
                    )}

                    <Checkbox
                        disabled={loading}
                        label={t("isActiveLabel", {
                            audience: values.menuType === "INTERNAL"
                                ? t("audienceEmployees")
                                : t("audienceCustomers")
                        })}
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
