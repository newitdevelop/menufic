import type { FC } from "react";
import { useEffect, useState } from "react";

import { Button, Checkbox, Chip, Group, MultiSelect, Select, Stack, Text, TextInput, useMantineTheme } from "@mantine/core";
import { DatePicker, TimeInput } from "@mantine/dates";
import { useForm, zodResolver } from "@mantine/form";
import { useTranslations } from "next-intl";

import type { ModalProps } from "@mantine/core";

import { api } from "src/utils/api";
import { showErrorToast, showSuccessToast } from "src/utils/helpers";
import { bannerInput } from "src/utils/validators";

import { ImageUpload } from "../ImageUpload";
import { Modal } from "../Modal";

interface Props extends ModalProps {
    /** Id of the restaurant for the the banner needs to be attached to */
    restaurantId: string;
}

/** Form to be used when allowing users to upload banners for restaurant */
export const BannerForm: FC<Props> = ({ opened, onClose, restaurantId, ...rest }) => {
    const trpcCtx = api.useContext();
    const theme = useMantineTheme();
    const [imagePath, setImagePath] = useState("");
    const [hasExpiry, setHasExpiry] = useState(false);
    const t = useTranslations("dashboard.banner");
    const tCommon = useTranslations("common");

    const { mutate: addBanner, isLoading: isCreating } = api.restaurant.addBanner.useMutation({
        onError: (err: unknown) => showErrorToast(t("createError"), err as { message: string }),
        onSuccess: (data: any) => {
            onClose();
            (trpcCtx.restaurant as any).getBanners.setData({ id: restaurantId }, (banners = []) => [...banners, data]);
            showSuccessToast(tCommon("createSuccess"), t("createSuccessDesc"));
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
    }, [restaurantId, opened]);

    return (
        <Modal loading={isCreating} onClose={onClose} opened={opened} title={t("addModalTitle")} {...rest}>
            <form
                onSubmit={onSubmit((values) => {
                    if (isDirty()) {
                        addBanner(values);
                    } else {
                        onClose();
                    }
                })}
            >
                <Stack spacing="sm">
                    <ImageUpload
                        disabled={isCreating}
                        error={!!errors.imageBase64}
                        height={400}
                        imageRequired
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
                    <Text color={theme.colors.red[7]} size="xs">
                        {errors.imageBase64}
                    </Text>

                    <Select
                        label="Display Schedule"
                        description="Choose when this banner should be displayed"
                        disabled={isCreating}
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
                                disabled={isCreating}
                                {...getInputProps("dailyStartTime")}
                            />
                            <TimeInput
                                label="End Time"
                                description="Banner stops displaying at this time each day"
                                disabled={isCreating}
                                {...getInputProps("dailyEndTime")}
                            />
                        </Group>
                    )}

                    {getInputProps("scheduleType").value === "WEEKLY" && (
                        <Chip.Group
                            multiple
                            {...getInputProps("weeklyDays")}
                        >
                            <Text size="sm" weight={500} mt="sm">Select Days of Week</Text>
                            <Group mt="xs">
                                <Chip value={0}>Sunday</Chip>
                                <Chip value={1}>Monday</Chip>
                                <Chip value={2}>Tuesday</Chip>
                                <Chip value={3}>Wednesday</Chip>
                                <Chip value={4}>Thursday</Chip>
                                <Chip value={5}>Friday</Chip>
                                <Chip value={6}>Saturday</Chip>
                            </Group>
                        </Chip.Group>
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
                            disabled={isCreating}
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
                            <TextInput
                                label="Start Date (MM-DD)"
                                description="e.g., 12-01 for December 1st"
                                placeholder="MM-DD"
                                disabled={isCreating}
                                {...getInputProps("yearlyStartDate")}
                            />
                            <TextInput
                                label="End Date (MM-DD)"
                                description="e.g., 12-31 for December 31st"
                                placeholder="MM-DD"
                                disabled={isCreating}
                                {...getInputProps("yearlyEndDate")}
                            />
                        </Group>
                    )}

                    {getInputProps("scheduleType").value === "PERIOD" && (
                        <Group grow mt="sm">
                            <Stack>
                                <Text size="sm" weight={500}>Start Date</Text>
                                <Text size="xs" color="dimmed">Banner starts displaying from this date</Text>
                                <DatePicker
                                    disabled={isCreating}
                                    {...getInputProps("periodStartDate")}
                                />
                            </Stack>
                            <Stack>
                                <Text size="sm" weight={500}>End Date</Text>
                                <Text size="xs" color="dimmed">Banner stops displaying after this date</Text>
                                <DatePicker
                                    disabled={isCreating}
                                    {...getInputProps("periodEndDate")}
                                />
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
                        disabled={isCreating}
                        mt="md"
                    />

                    {hasExpiry && (
                        <Stack mt="sm">
                            <Text size="sm" weight={500}>Final Expiry Date</Text>
                            <Text size="xs" color="dimmed">Banner will be permanently hidden after this date</Text>
                            <DatePicker
                                minDate={new Date()}
                                disabled={isCreating}
                                {...getInputProps("expiryDate")}
                            />
                        </Stack>
                    )}

                    <Group mt="md" position="right">
                        <Button data-testid="save-banner-form" loading={isCreating} px="xl" type="submit">
                            {tCommon("save")}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};
