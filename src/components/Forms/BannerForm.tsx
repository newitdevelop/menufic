import type { FC } from "react";
import { useEffect, useState } from "react";

import { Button, Checkbox, Chip, Group, MultiSelect, Select, Stack, Text, TextInput, useMantineTheme } from "@mantine/core";
import { DatePicker, TimeInput } from "@mantine/dates";
import { useForm, zodResolver } from "@mantine/form";
import { useTranslations } from "next-intl";

import type { ModalProps } from "@mantine/core";
import type { Image } from "@prisma/client";

import { api } from "src/utils/api";
import { env } from "src/env/client.mjs";
import { showErrorToast, showSuccessToast } from "src/utils/helpers";
import { bannerInput } from "src/utils/validators";

import { ImageUpload } from "../ImageUpload";
import { Modal } from "../Modal";

interface Props extends ModalProps {
    /** Id of the restaurant for the the banner needs to be attached to */
    restaurantId: string;
    /** Optional banner to edit. If provided, form will be in edit mode */
    banner?: Image | null;
}

/** Form to be used when allowing users to upload banners for restaurant */
export const BannerForm: FC<Props> = ({ opened, onClose, restaurantId, banner, ...rest }) => {
    const trpcCtx = api.useContext();
    const theme = useMantineTheme();
    const [imagePath, setImagePath] = useState("");
    const [hasExpiry, setHasExpiry] = useState(false);
    const t = useTranslations("dashboard.banner");
    const tCommon = useTranslations("common");
    const isEditMode = !!banner;

    const { mutate: addBanner, isLoading: isCreating } = api.restaurant.addBanner.useMutation({
        onError: (err: unknown) => showErrorToast(t("createError"), err as { message: string }),
        onSuccess: (data: any) => {
            onClose();
            (trpcCtx.restaurant as any).getBanners.setData({ id: restaurantId }, (banners = []) => [...banners, data]);
            showSuccessToast(tCommon("createSuccess"), t("createSuccessDesc"));
        },
    });

    const { mutate: updateBanner, isLoading: isUpdating } = api.restaurant.updateBanner.useMutation({
        onError: (err: unknown) => showErrorToast(t("createError"), err as { message: string }),
        onSuccess: (data: any) => {
            onClose();
            (trpcCtx.restaurant as any).getBanners.setData({ id: restaurantId }, (banners = []) =>
                banners.map((b: any) => b.id === data.id ? data : b)
            );
            showSuccessToast(tCommon("updateSuccess"), t("createSuccessDesc"));
        },
    });

    const { onSubmit, setValues, getInputProps, isDirty, resetDirty, errors } = useForm({
        initialValues: {
            imageBase64: "",
            restaurantId,
            expiryDate: null as Date | null,
            scheduleType: "ALWAYS" as const,
            dailyStartTime: null as string | null,
            dailyEndTime: null as string | null,
            weeklyDays: [] as number[],
            monthlyDays: [] as number[],
            yearlyStartDate: null as string | null,
            yearlyEndDate: null as string | null,
            periodStartDate: null as Date | null,
            periodEndDate: null as Date | null,
        },
        validate: zodResolver(bannerInput),
    });

    useEffect(() => {
        if (opened) {
            if (banner) {
                // Edit mode - populate form with existing banner data
                const imageSrc = banner.path ? `${env.NEXT_PUBLIC_IMAGEKIT_BASE_URL}/${banner.path}` : "";
                setImagePath(imageSrc);
                setHasExpiry(!!banner.expiryDate);

                const values = {
                    imageBase64: "", // Will be filled if user uploads new image
                    restaurantId,
                    expiryDate: banner.expiryDate ? new Date(banner.expiryDate) : null,
                    scheduleType: banner.scheduleType as any,
                    dailyStartTime: banner.dailyStartTime,
                    dailyEndTime: banner.dailyEndTime,
                    weeklyDays: banner.weeklyDays || [],
                    monthlyDays: banner.monthlyDays || [],
                    yearlyStartDate: banner.yearlyStartDate,
                    yearlyEndDate: banner.yearlyEndDate,
                    periodStartDate: banner.periodStartDate ? new Date(banner.periodStartDate) : null,
                    periodEndDate: banner.periodEndDate ? new Date(banner.periodEndDate) : null,
                };
                setValues(values);
                resetDirty(values);
            } else {
                // Create mode - reset form
                setImagePath("");
                setHasExpiry(false);
                const values = {
                    imageBase64: "",
                    restaurantId,
                    expiryDate: null as Date | null,
                    scheduleType: "ALWAYS" as const,
                    dailyStartTime: null as string | null,
                    dailyEndTime: null as string | null,
                    weeklyDays: [] as number[],
                    monthlyDays: [] as number[],
                    yearlyStartDate: null as string | null,
                    yearlyEndDate: null as string | null,
                    periodStartDate: null as Date | null,
                    periodEndDate: null as Date | null,
                };
                setValues(values);
                resetDirty(values);
            }
        }
    }, [restaurantId, opened, banner]);

    return (
        <Modal
            loading={isCreating || isUpdating}
            onClose={onClose}
            opened={opened}
            title={t("addModalTitle")}
            {...rest}
        >
            <form
                onSubmit={onSubmit((values) => {
                    if (isDirty()) {
                        if (isEditMode && banner) {
                            updateBanner({ ...values, id: banner.id });
                        } else {
                            addBanner(values);
                        }
                    } else {
                        onClose();
                    }
                })}
            >
                <Stack spacing="sm">
                    <ImageUpload
                        disabled={isCreating || isUpdating}
                        error={!!errors.imageBase64}
                        height={400}
                        imageRequired={!isEditMode}
                        imageUrl={imagePath}
                        onImageCrop={(imageBase64, newImagePath) => {
                            setValues({ imageBase64 });
                            setImagePath(newImagePath);
                        }}
                        onImageDeleteClick={() => {
                            setValues({ imageBase64: "" });
                            setImagePath("");
                        }}
                        width={1000}
                    />
                    {!isEditMode && (
                        <Text color={theme.colors.red[7]} size="xs">
                            {errors.imageBase64}
                        </Text>
                    )}

                    <Select
                        label="Display Schedule"
                        description="Choose when this banner should be displayed"
                        disabled={isCreating || isUpdating}
                        data={[
                            { value: "ALWAYS", label: "Always Display" },
                            { value: "DAILY", label: "Daily (specific time range)" },
                            { value: "WEEKLY", label: "Weekly (specific days)" },
                            { value: "MONTHLY", label: "Monthly (specific days)" },
                            { value: "YEARLY", label: "Yearly (seasonal/annual period)" },
                            { value: "PERIOD", label: "Specific Period (date range)" },
                        ]}
                        {...getInputProps("scheduleType")}
                        mt="md"
                    />

                    {getInputProps("scheduleType").value === "DAILY" && (
                        <Group grow mt="sm">
                            <TimeInput
                                label="Start Time"
                                description="Banner starts displaying at this time each day"
                                disabled={isCreating || isUpdating}
                                {...getInputProps("dailyStartTime")}
                            />
                            <TimeInput
                                label="End Time"
                                description="Banner stops displaying at this time each day"
                                disabled={isCreating || isUpdating}
                                {...getInputProps("dailyEndTime")}
                            />
                        </Group>
                    )}

                    {getInputProps("scheduleType").value === "WEEKLY" && (
                        <>
                            <Text size="sm" weight={500} mt="sm">Select Days of Week</Text>
                            <Chip.Group
                                multiple
                                value={getInputProps("weeklyDays").value.map(String)}
                                onChange={(values) => {
                                    setValues({ weeklyDays: values.map(Number) });
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

                    {getInputProps("scheduleType").value === "MONTHLY" && (
                        <MultiSelect
                            label="Days of Month"
                            description="Select which days of the month to display banner"
                            placeholder="Select days (1-31)"
                            data={Array.from({ length: 31 }, (_, i) => ({
                                value: String(i + 1),
                                label: String(i + 1),
                            }))}
                            searchable
                            disabled={isCreating || isUpdating}
                            {...getInputProps("monthlyDays")}
                            mt="sm"
                            onChange={(values) => {
                                setValues({ monthlyDays: values.map(Number) });
                            }}
                            value={getInputProps("monthlyDays").value.map(String)}
                        />
                    )}

                    {getInputProps("scheduleType").value === "YEARLY" && (
                        <Group grow mt="sm">
                            <Stack>
                                <Text size="sm" weight={500}>Start Date (Annual)</Text>
                                <Text size="xs" color="dimmed">Banner starts displaying from this date every year</Text>
                                <DatePicker
                                    disabled={isCreating || isUpdating}
                                    value={
                                        getInputProps("yearlyStartDate").value
                                            ? new Date(new Date().getFullYear(), ...getInputProps("yearlyStartDate").value.split("-").map((n, i) => i === 0 ? parseInt(n) - 1 : parseInt(n)))
                                            : null
                                    }
                                    onChange={(date) => {
                                        if (date) {
                                            const month = String(date.getMonth() + 1).padStart(2, "0");
                                            const day = String(date.getDate()).padStart(2, "0");
                                            setValues({ yearlyStartDate: `${month}-${day}` });
                                        } else {
                                            setValues({ yearlyStartDate: null });
                                        }
                                    }}
                                />
                            </Stack>
                            <Stack>
                                <Text size="sm" weight={500}>End Date (Annual)</Text>
                                <Text size="xs" color="dimmed">Banner stops displaying after this date every year</Text>
                                <DatePicker
                                    disabled={isCreating || isUpdating}
                                    value={
                                        getInputProps("yearlyEndDate").value
                                            ? new Date(new Date().getFullYear(), ...getInputProps("yearlyEndDate").value.split("-").map((n, i) => i === 0 ? parseInt(n) - 1 : parseInt(n)))
                                            : null
                                    }
                                    onChange={(date) => {
                                        if (date) {
                                            const month = String(date.getMonth() + 1).padStart(2, "0");
                                            const day = String(date.getDate()).padStart(2, "0");
                                            setValues({ yearlyEndDate: `${month}-${day}` });
                                        } else {
                                            setValues({ yearlyEndDate: null });
                                        }
                                    }}
                                />
                            </Stack>
                        </Group>
                    )}

                    {getInputProps("scheduleType").value === "PERIOD" && (
                        <Group grow mt="sm">
                            <Stack>
                                <Text size="sm" weight={500}>Start Date</Text>
                                <Text size="xs" color="dimmed">Banner starts displaying from this date</Text>
                                <DatePicker
                                    disabled={isCreating || isUpdating}
                                    {...getInputProps("periodStartDate")}
                                />
                            </Stack>
                            <Stack>
                                <Text size="sm" weight={500}>End Date</Text>
                                <Text size="xs" color="dimmed">Banner stops displaying after this date</Text>
                                <DatePicker
                                    disabled={isCreating || isUpdating}
                                    minDate={getInputProps("periodStartDate").value || undefined}
                                    {...getInputProps("periodEndDate")}
                                />
                                {errors.periodEndDate && (
                                    <Text color={theme.colors.red[7]} size="xs">
                                        {errors.periodEndDate}
                                    </Text>
                                )}
                            </Stack>
                        </Group>
                    )}

                    <Checkbox
                        label="Set Final Expiry Date (Optional)"
                        description="Banner will permanently expire after this date regardless of schedule"
                        checked={hasExpiry}
                        onChange={(event) => {
                            const checked = event.currentTarget.checked;
                            setHasExpiry(checked);
                            if (!checked) {
                                setValues({ expiryDate: null });
                            }
                        }}
                        disabled={isCreating || isUpdating}
                        mt="md"
                    />

                    {hasExpiry && (
                        <Stack mt="sm">
                            <Text size="sm" weight={500}>Final Expiry Date</Text>
                            <Text size="xs" color="dimmed">Banner will be permanently hidden after this date</Text>
                            <DatePicker
                                minDate={new Date()}
                                disabled={isCreating || isUpdating}
                                {...getInputProps("expiryDate")}
                            />
                        </Stack>
                    )}

                    <Group mt="md" position="right">
                        <Button data-testid="save-banner-form" loading={isCreating || isUpdating} px="xl" type="submit">
                            {tCommon("save")}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};
