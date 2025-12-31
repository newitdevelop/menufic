import type { FC } from "react";
import { useState } from "react";

import { Button, Group, Modal, NumberInput, Paper, Stack, Stepper, Text, TextInput, useMantineTheme } from "@mantine/core";
import { Calendar } from "@mantine/dates";
import { useForm, zodResolver } from "@mantine/form";
import { IconCalendar, IconClock, IconMail, IconUsers } from "@tabler/icons";
import { z } from "zod";

import { api } from "src/utils/api";
import { showErrorToast, showSuccessToast } from "src/utils/helpers";

interface ReservationTranslations {
    title: string;
    dateLabel: string;
    dateDescription: string;
    datePrompt: string;
    timeLabel: string;
    timeDescription: string;
    timePrompt: string;
    timeContext: string;
    guestsLabel: string;
    guestsDescription: string;
    guestsPrompt: string;
    moreThan12: string;
    contactLabel: string;
    emailLabel: string;
    emailPlaceholder: string;
    emailPrompt: string;
    summaryTitle: string;
    person: string;
    people: string;
    backButton: string;
    nextButton: string;
    confirmButton: string;
    successTitle: string;
    successMessage: string;
    errorTitle: string;
}

interface Props {
    menuId: string;
    menuName: string;
    restaurantName: string;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    maxPartySize: number;
    menuStartDate?: Date | null;
    menuEndDate?: Date | null;
    translations?: ReservationTranslations;
    opened: boolean;
    onClose: () => void;
}

/** 4-step reservation form similar to TheFork */
// Default English translations as fallback
const DEFAULT_TRANSLATIONS: ReservationTranslations = {
    title: "Reserve a Table",
    dateLabel: "Date",
    dateDescription: "Select date",
    datePrompt: "Select a date",
    timeLabel: "Time",
    timeDescription: "Select time",
    timePrompt: "Select a time",
    timeContext: "For {date}",
    guestsLabel: "Guests",
    guestsDescription: "Number of people",
    guestsPrompt: "Number of people",
    moreThan12: "More than 12?",
    contactLabel: "Contact Info",
    emailLabel: "Email Address",
    emailPlaceholder: "your.email@example.com",
    emailPrompt: "Enter your email to confirm the reservation",
    summaryTitle: "Reservation Summary:",
    person: "person",
    people: "people",
    backButton: "Back",
    nextButton: "Next",
    confirmButton: "Confirm Reservation",
    successTitle: "Reservation Sent",
    successMessage: "Your reservation request has been sent successfully!",
    errorTitle: "Reservation Error",
};

export const ReservationForm: FC<Props> = ({
    menuId,
    menuName,
    restaurantName,
    startTime,
    endTime,
    maxPartySize,
    menuStartDate,
    menuEndDate,
    translations,
    opened,
    onClose,
}) => {
    const theme = useMantineTheme();
    const t = translations || DEFAULT_TRANSLATIONS;
    const [activeStep, setActiveStep] = useState(0);

    // Generate available time slots based on start and end times
    const generateTimeSlots = (): string[] => {
        const slots: string[] = [];
        if (!startTime || !endTime) return slots;

        const [startHour, startMinute] = startTime.split(":").map(Number);
        const [endHour, endMinute] = endTime.split(":").map(Number);

        const startDate = new Date();
        startDate.setHours(startHour, startMinute, 0, 0);

        const endDate = new Date();
        endDate.setHours(endHour, endMinute, 0, 0);

        // Generate slots every 30 minutes
        const current = new Date(startDate);
        while (current <= endDate) {
            const hours = current.getHours().toString().padStart(2, "0");
            const minutes = current.getMinutes().toString().padStart(2, "0");
            slots.push(`${hours}:${minutes}`);
            current.setMinutes(current.getMinutes() + 30);
        }

        return slots;
    };

    const timeSlots = generateTimeSlots();

    // Calculate min and max dates for reservations
    const getMinDate = (): Date => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (menuStartDate) {
            const menuStart = new Date(menuStartDate);
            menuStart.setHours(0, 0, 0, 0);
            // Use the later of today or menu start date
            return menuStart > today ? menuStart : today;
        }
        return today;
    };

    const getMaxDate = (): Date => {
        const defaultMaxDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days ahead

        if (menuEndDate) {
            const menuEnd = new Date(menuEndDate);
            menuEnd.setHours(23, 59, 59, 999);
            // Use the earlier of default max or menu end date
            return menuEnd < defaultMaxDate ? menuEnd : defaultMaxDate;
        }
        return defaultMaxDate;
    };

    const { getInputProps, onSubmit, values, setFieldValue, reset } = useForm({
        initialValues: {
            date: null as Date | null,
            time: "",
            partySize: 2,
            email: "",
        },
        validate: zodResolver(
            z.object({
                date: z.date({ required_error: "Please select a date" }),
                time: z.string().min(1, "Please select a time"),
                partySize: z.number().int().min(1, "At least 1 person").max(maxPartySize, `Maximum ${maxPartySize} people`),
                email: z.string().email("Invalid email address"),
            })
        ),
    });

    const { mutate: submitReservation, isLoading } = (api.reservation as any).submit.useMutation({
        onError: (err: unknown) => showErrorToast(t.errorTitle, err as { message: string }),
        onSuccess: () => {
            showSuccessToast(t.successTitle, t.successMessage);
            reset();
            setActiveStep(0);
            onClose();
        },
    });

    const handleNext = () => {
        if (activeStep < 3) {
            setActiveStep(activeStep + 1);
        }
    };

    const handleBack = () => {
        if (activeStep > 0) {
            setActiveStep(activeStep - 1);
        }
    };

    const handleSubmit = () => {
        if (!values.date || !values.time) return;

        submitReservation({
            menuId,
            date: values.date,
            time: values.time,
            partySize: values.partySize,
            email: values.email,
        });
    };

    const canProceed = (step: number): boolean => {
        switch (step) {
            case 0:
                return values.date !== null;
            case 1:
                return values.time !== "";
            case 2:
                return values.partySize >= 1 && values.partySize <= maxPartySize;
            case 3:
                return values.email !== "" && z.string().email().safeParse(values.email).success;
            default:
                return false;
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={() => {
                reset();
                setActiveStep(0);
                onClose();
            }}
            title={
                <Stack spacing={4}>
                    <Text weight={600} size="lg">
                        Reserve a Table
                    </Text>
                    <Text size="sm" color="dimmed">
                        {restaurantName} - {menuName}
                    </Text>
                </Stack>
            }
            size="lg"
            centered
        >
            <form
                onSubmit={onSubmit(handleSubmit, (errors) => {
                    console.error("Form validation errors:", errors);
                })}
            >
                <Stepper active={activeStep} onStepClick={setActiveStep} breakpoint="sm">
                    {/* Step 1: Date Selection */}
                    <Stepper.Step
                        icon={<IconCalendar size={18} />}
                        label="Date"
                        description="Select date"
                        allowStepSelect={activeStep > 0}
                    >
                        <Stack spacing="md" my="lg">
                            <Text size="sm" weight={500}>
                                Select a date
                            </Text>
                            <Calendar
                                value={values.date}
                                onChange={(date) => setFieldValue("date", date)}
                                minDate={getMinDate()}
                                maxDate={getMaxDate()}
                                firstDayOfWeek="monday"
                                fullWidth
                            />
                        </Stack>
                    </Stepper.Step>

                    {/* Step 2: Time Selection */}
                    <Stepper.Step
                        icon={<IconClock size={18} />}
                        label="Time"
                        description="Select time"
                        allowStepSelect={activeStep > 1}
                    >
                        <Stack spacing="md" my="lg">
                            <Text size="sm" weight={500}>
                                Select a time
                            </Text>
                            <Text size="xs" color="dimmed">
                                {values.date
                                    ? `For ${values.date.toLocaleDateString("en-GB", {
                                          weekday: "long",
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                      })}`
                                    : "Please select a date first"}
                            </Text>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                                    gap: "8px",
                                }}
                            >
                                {timeSlots.map((slot) => (
                                    <Paper
                                        key={slot}
                                        p="sm"
                                        sx={(theme) => ({
                                            cursor: "pointer",
                                            textAlign: "center",
                                            border: `2px solid ${
                                                values.time === slot ? theme.colors.primary[6] : theme.colors.gray[3]
                                            }`,
                                            backgroundColor: values.time === slot ? theme.colors.primary[0] : "white",
                                            "&:hover": {
                                                borderColor: theme.colors.primary[4],
                                            },
                                        })}
                                        onClick={() => setFieldValue("time", slot)}
                                    >
                                        <Text size="sm" weight={values.time === slot ? 600 : 400}>
                                            {slot}
                                        </Text>
                                    </Paper>
                                ))}
                            </div>
                        </Stack>
                    </Stepper.Step>

                    {/* Step 3: Party Size */}
                    <Stepper.Step
                        icon={<IconUsers size={18} />}
                        label="Guests"
                        description="Number of people"
                        allowStepSelect={activeStep > 2}
                    >
                        <Stack spacing="md" my="lg">
                            <Text size="sm" weight={500}>
                                Number of people
                            </Text>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))",
                                    gap: "8px",
                                    maxWidth: "400px",
                                }}
                            >
                                {Array.from({ length: Math.min(12, maxPartySize) }, (_, i) => i + 1).map((num) => (
                                    <Paper
                                        key={num}
                                        p="md"
                                        sx={(theme) => ({
                                            cursor: "pointer",
                                            textAlign: "center",
                                            border: `2px solid ${
                                                values.partySize === num ? theme.colors.primary[6] : theme.colors.gray[3]
                                            }`,
                                            backgroundColor: values.partySize === num ? theme.colors.primary[0] : "white",
                                            "&:hover": {
                                                borderColor: theme.colors.primary[4],
                                            },
                                        })}
                                        onClick={() => setFieldValue("partySize", num)}
                                    >
                                        <Text size="lg" weight={values.partySize === num ? 600 : 400}>
                                            {num}
                                        </Text>
                                    </Paper>
                                ))}
                            </div>
                            {maxPartySize > 12 && (
                                <Group>
                                    <Text size="sm">More than 12?</Text>
                                    <NumberInput
                                        {...getInputProps("partySize")}
                                        min={1}
                                        max={maxPartySize}
                                        style={{ width: "100px" }}
                                    />
                                </Group>
                            )}
                        </Stack>
                    </Stepper.Step>

                    {/* Step 4: Contact Info */}
                    <Stepper.Step
                        icon={<IconMail size={18} />}
                        label="Contact Info"
                        allowStepSelect={activeStep > 3}
                    >
                        <Stack spacing="md" my="lg">
                            <Text size="sm" weight={500}>
                                Enter your email to confirm the reservation
                            </Text>
                            <TextInput
                                label="Email Address"
                                placeholder="your.email@example.com"
                                type="email"
                                withAsterisk
                                {...getInputProps("email")}
                            />
                            <Paper p="md" sx={(theme) => ({ backgroundColor: theme.colors.gray[0] })}>
                                <Stack spacing="xs">
                                    <Text size="sm" weight={600}>
                                        Reservation Summary:
                                    </Text>
                                    <Group spacing="xs">
                                        <IconCalendar size={16} />
                                        <Text size="sm">
                                            {values.date
                                                ? values.date.toLocaleDateString("en-GB", {
                                                      weekday: "short",
                                                      day: "numeric",
                                                      month: "short",
                                                      year: "numeric",
                                                  })
                                                : "-"}
                                        </Text>
                                    </Group>
                                    <Group spacing="xs">
                                        <IconClock size={16} />
                                        <Text size="sm">{values.time || "-"}</Text>
                                    </Group>
                                    <Group spacing="xs">
                                        <IconUsers size={16} />
                                        <Text size="sm">
                                            {values.partySize} {values.partySize === 1 ? "person" : "people"}
                                        </Text>
                                    </Group>
                                </Stack>
                            </Paper>
                        </Stack>
                    </Stepper.Step>
                </Stepper>

                <Group position="apart" mt="xl">
                    <Button variant="subtle" onClick={handleBack} disabled={activeStep === 0 || isLoading}>
                        Back
                    </Button>
                    {activeStep < 3 ? (
                        <Button onClick={handleNext} disabled={!canProceed(activeStep) || isLoading}>
                            Next
                        </Button>
                    ) : (
                        <Button type="submit" loading={isLoading} disabled={!canProceed(activeStep)}>
                            Confirm Reservation
                        </Button>
                    )}
                </Group>
            </form>
        </Modal>
    );
};
