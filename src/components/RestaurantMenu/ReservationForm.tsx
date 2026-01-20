import type { FC } from "react";
import { useState } from "react";

import { Button, Checkbox, Group, Modal, NumberInput, Paper, Stack, Stepper, Text, TextInput, useMantineTheme, Select } from "@mantine/core";
import { Calendar } from "@mantine/dates";
import { useForm, zodResolver } from "@mantine/form";
import { IconCalendar, IconClock, IconUsers, IconPhone, IconBriefcase, IconCheck } from "@tabler/icons";
import { z } from "zod";

import { api } from "src/utils/api";
import { showErrorToast, showSuccessToast } from "src/utils/helpers";

interface ReservationTranslations {
    title: string;
    titleService?: string;
    serviceLabel?: string;
    serviceDescription?: string;
    servicePrompt?: string;
    servicesLabel?: string;
    servicesDescription?: string;
    servicesPrompt?: string;
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
    contactDescription: string;
    emailLabel: string;
    emailPlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    contactPreferenceLabel: string;
    contactPreferenceDescription: string;
    contactPreferencePhone: string;
    contactPreferenceWhatsApp: string;
    contactPreferenceEmail: string;
    summaryTitle: string;
    summaryService?: string;
    summaryServices?: string;
    person: string;
    people: string;
    backButton: string;
    nextButton: string;
    confirmButton: string;
    confirmButtonService?: string;
    successTitle: string;
    successTitleService?: string;
    successMessage: string;
    successMessageService?: string;
    errorTitle: string;
}

interface ServiceItem {
    id: string;
    name: string;
    price?: number | null;
    description?: string | null;
}

interface Props {
    menuId: string;
    menuName: string;
    restaurantName: string;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    maxPartySize: number;
    slotDuration?: number; // Duration of each slot in minutes (default: 30)
    menuStartDate?: Date | null;
    menuEndDate?: Date | null;
    translations?: ReservationTranslations;
    opened: boolean;
    onClose: () => void;
    isServiceMenu?: boolean; // If true, shows service selection step (for non-edible menus)
    services?: ServiceItem[]; // List of services/items to choose from (for non-edible menus)
}

/** Multi-step reservation form similar to TheFork */
// Default English translations as fallback
const DEFAULT_TRANSLATIONS: ReservationTranslations = {
    title: "Reserve a Table",
    titleService: "Book a Service",
    serviceLabel: "Service",
    serviceDescription: "Select service",
    servicePrompt: "Select a service to book",
    servicesLabel: "Services",
    servicesDescription: "Select services",
    servicesPrompt: "Select one or more services to book",
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
    contactDescription: "Enter your contact information",
    emailLabel: "Email Address",
    emailPlaceholder: "your.email@example.com",
    phoneLabel: "Phone Number",
    phonePlaceholder: "+351 123 456 789",
    contactPreferenceLabel: "Preferred Contact Method",
    contactPreferenceDescription: "How should we contact you?",
    contactPreferencePhone: "Phone Call",
    contactPreferenceWhatsApp: "WhatsApp",
    contactPreferenceEmail: "Email",
    summaryTitle: "Reservation Summary:",
    summaryService: "Service:",
    summaryServices: "Services:",
    person: "person",
    people: "people",
    backButton: "Back",
    nextButton: "Next",
    confirmButton: "Confirm Reservation",
    confirmButtonService: "Confirm Booking",
    successTitle: "Reservation Sent",
    successTitleService: "Booking Sent",
    successMessage: "Your reservation request has been sent successfully!",
    successMessageService: "Your service booking request has been sent successfully!",
    errorTitle: "Reservation Error",
};

export const ReservationForm: FC<Props> = ({
    menuId,
    menuName,
    restaurantName,
    startTime,
    endTime,
    maxPartySize,
    slotDuration = 30,
    menuStartDate,
    menuEndDate,
    translations,
    opened,
    onClose,
    isServiceMenu = false,
    services = [],
}) => {
    const theme = useMantineTheme();
    const t = translations || DEFAULT_TRANSLATIONS;
    const [activeStep, setActiveStep] = useState(0);

    // For service menus, we have 5 steps (service selection + 4 original steps)
    // For regular menus, we have 4 steps
    const totalSteps = isServiceMenu ? 5 : 4;
    const lastStep = totalSteps - 1;

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

        // Generate slots based on configured duration
        const current = new Date(startDate);
        while (current <= endDate) {
            const hours = current.getHours().toString().padStart(2, "0");
            const minutes = current.getMinutes().toString().padStart(2, "0");
            slots.push(`${hours}:${minutes}`);
            current.setMinutes(current.getMinutes() + slotDuration);
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
            // Use the later of today or menu start date (only if menu start is in the future)
            return menuStart > today ? menuStart : today;
        }
        return today;
    };

    const getMaxDate = (): Date => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const defaultMaxDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days ahead

        if (menuEndDate) {
            const menuEnd = new Date(menuEndDate);
            menuEnd.setHours(23, 59, 59, 999);
            // Only use menu end date if it's in the future, otherwise use default
            if (menuEnd >= today) {
                return menuEnd < defaultMaxDate ? menuEnd : defaultMaxDate;
            }
        }
        return defaultMaxDate;
    };

    const { getInputProps, onSubmit, values, setFieldValue, reset } = useForm({
        initialValues: {
            selectedServices: [] as { id: string; name: string; price?: number | null }[],
            date: null as Date | null,
            time: "",
            partySize: 2,
            email: "",
            phone: "",
            contactPreference: "PHONE" as "PHONE" | "WHATSAPP" | "EMAIL",
        },
        validate: zodResolver(
            z.object({
                selectedServices: isServiceMenu
                    ? z.array(z.object({ id: z.string(), name: z.string(), price: z.number().nullable().optional() })).min(1, "Please select at least one service")
                    : z.array(z.any()).optional(),
                date: z.date({ required_error: "Please select a date" }),
                time: z.string().min(1, "Please select a time"),
                partySize: z.number().int().min(1, "At least 1 person").max(maxPartySize, `Maximum ${maxPartySize} people`),
                email: z.string().email("Invalid email address"),
                phone: z.string().min(1, "Phone number is required"),
                contactPreference: z.enum(["PHONE", "WHATSAPP", "EMAIL"]),
            })
        ),
    });

    const { mutate: submitReservation, isLoading } = (api.reservation as any).submit.useMutation({
        onError: (err: unknown) => showErrorToast(t.errorTitle, err as { message: string }),
        onSuccess: () => {
            const successTitle = isServiceMenu ? (t.successTitleService || t.successTitle) : t.successTitle;
            const successMessage = isServiceMenu ? (t.successMessageService || t.successMessage) : t.successMessage;
            showSuccessToast(successTitle, successMessage);
            reset();
            setActiveStep(0);
            onClose();
        },
    });

    const handleNext = () => {
        if (activeStep < lastStep) {
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
        if (isServiceMenu && values.selectedServices.length === 0) return;

        // For service menus, send the selected services info
        const serviceNames = isServiceMenu && values.selectedServices.length > 0
            ? values.selectedServices.map(s => s.name)
            : undefined;

        submitReservation({
            menuId,
            serviceNames: serviceNames, // Array of selected service names for service bookings
            date: values.date,
            time: values.time,
            partySize: values.partySize,
            email: values.email,
            phone: values.phone,
            contactPreference: values.contactPreference,
        });
    };

    const canProceed = (step: number): boolean => {
        // For service menus, step 0 is service selection
        // For regular menus, step 0 is date selection
        if (isServiceMenu) {
            switch (step) {
                case 0: // Service selection (multiple)
                    return values.selectedServices.length > 0;
                case 1: // Date
                    return values.date !== null;
                case 2: // Time
                    return values.time !== "";
                case 3: // Party size
                    return values.partySize >= 1 && values.partySize <= maxPartySize;
                case 4: // Contact info
                    return (
                        values.email !== "" &&
                        z.string().email().safeParse(values.email).success &&
                        values.phone !== "" &&
                        !!values.contactPreference
                    );
                default:
                    return false;
            }
        } else {
            switch (step) {
                case 0: // Date
                    return values.date !== null;
                case 1: // Time
                    return values.time !== "";
                case 2: // Party size
                    return values.partySize >= 1 && values.partySize <= maxPartySize;
                case 3: // Contact info
                    return (
                        values.email !== "" &&
                        z.string().email().safeParse(values.email).success &&
                        values.phone !== "" &&
                        !!values.contactPreference
                    );
                default:
                    return false;
            }
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
                        {isServiceMenu ? (t.titleService || t.title) : t.title}
                    </Text>
                    <Text size="sm" color="dimmed">
                        {restaurantName} - {menuName}
                    </Text>
                </Stack>
            }
            size="xl"
            centered
            styles={{
                modal: {
                    maxWidth: '600px',
                },
            }}
        >
            <form
                onSubmit={onSubmit(handleSubmit, (errors) => {
                    console.error("Form validation errors:", errors);
                })}
            >
                <Stepper
                    active={activeStep}
                    onStepClick={setActiveStep}
                    breakpoint="xs"
                    size="sm"
                    styles={(theme) => ({
                        stepLabel: {
                            fontSize: '0.65rem',
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                            order: 2,
                        },
                        stepDescription: {
                            display: 'none',
                        },
                        step: {
                            padding: '2px 4px',
                            minWidth: 'auto',
                            flexDirection: 'column',
                            alignItems: 'center',
                        },
                        stepWrapper: {
                            flexDirection: 'column',
                            alignItems: 'center',
                        },
                        stepBody: {
                            marginLeft: 0,
                            marginRight: 0,
                            marginTop: '4px',
                            order: 2,
                        },
                        stepIcon: {
                            order: 1,
                        },
                        separator: {
                            marginLeft: '2px',
                            marginRight: '2px',
                            minWidth: '12px',
                            alignSelf: 'center',
                            marginTop: 0,
                        },
                        steps: {
                            flexWrap: 'nowrap',
                            alignItems: 'flex-start',
                        },
                    })}
                >
                    {/* Step 0 (Service Menus Only): Service Selection (Multiple) */}
                    {isServiceMenu && (
                        <Stepper.Step
                            icon={<IconBriefcase size={16} />}
                            label={t.servicesLabel || "Services"}
                            allowStepSelect={activeStep > 0}
                        >
                            <Stack spacing="md" my="lg">
                                <Text size="sm" weight={500}>
                                    {t.servicesPrompt || t.servicePrompt || "Select one or more services to book"}
                                </Text>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "8px",
                                    }}
                                >
                                    {services.map((service) => {
                                        const isSelected = values.selectedServices.some(s => s.id === service.id);
                                        return (
                                            <Paper
                                                key={service.id}
                                                p="md"
                                                sx={(theme) => ({
                                                    cursor: "pointer",
                                                    border: `2px solid ${
                                                        isSelected ? theme.colors.primary[6] : theme.colors.gray[3]
                                                    }`,
                                                    backgroundColor: isSelected ? theme.colors.primary[0] : "white",
                                                    "&:hover": {
                                                        borderColor: theme.colors.primary[4],
                                                    },
                                                })}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        // Remove from selection
                                                        setFieldValue(
                                                            "selectedServices",
                                                            values.selectedServices.filter(s => s.id !== service.id)
                                                        );
                                                    } else {
                                                        // Add to selection
                                                        setFieldValue(
                                                            "selectedServices",
                                                            [...values.selectedServices, { id: service.id, name: service.name, price: service.price }]
                                                        );
                                                    }
                                                }}
                                            >
                                                <Group position="apart" noWrap>
                                                    <Group spacing="sm" noWrap style={{ flex: 1 }}>
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onChange={() => {}} // Handled by Paper onClick
                                                            styles={{ input: { cursor: "pointer" } }}
                                                        />
                                                        <div style={{ flex: 1 }}>
                                                            <Text size="sm" weight={isSelected ? 600 : 400}>
                                                                {service.name}
                                                            </Text>
                                                            {service.description && (
                                                                <Text size="xs" color="dimmed" lineClamp={2}>
                                                                    {service.description}
                                                                </Text>
                                                            )}
                                                        </div>
                                                    </Group>
                                                    {service.price != null && Number(service.price) > 0 && (
                                                        <Text size="sm" weight={500} style={{ whiteSpace: "nowrap" }}>
                                                            €{Number(service.price).toFixed(2)}
                                                        </Text>
                                                    )}
                                                </Group>
                                            </Paper>
                                        );
                                    })}
                                </div>
                                {values.selectedServices.length > 0 && (
                                    <Text size="xs" color="dimmed">
                                        {values.selectedServices.length} service{values.selectedServices.length > 1 ? "s" : ""} selected
                                    </Text>
                                )}
                            </Stack>
                        </Stepper.Step>
                    )}

                    {/* Date Selection */}
                    <Stepper.Step
                        icon={<IconCalendar size={16} />}
                        label={t.dateLabel}
                        allowStepSelect={activeStep > (isServiceMenu ? 1 : 0)}
                    >
                        <Stack spacing="md" my="lg">
                            <Text size="sm" weight={500}>
                                {t.datePrompt}
                            </Text>
                            <Calendar
                                value={values.date}
                                onChange={(date) => setFieldValue("date", date)}
                                minDate={getMinDate()}
                                maxDate={getMaxDate()}
                                excludeDate={(date) => {
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    return date < today;
                                }}
                                firstDayOfWeek="monday"
                                fullWidth
                            />
                        </Stack>
                    </Stepper.Step>

                    {/* Time Selection */}
                    <Stepper.Step
                        icon={<IconClock size={16} />}
                        label={t.timeLabel}
                        allowStepSelect={activeStep > (isServiceMenu ? 2 : 1)}
                    >
                        <Stack spacing="md" my="lg">
                            <Text size="sm" weight={500}>
                                {t.timePrompt}
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

                    {/* Party Size */}
                    <Stepper.Step
                        icon={<IconUsers size={16} />}
                        label={t.guestsLabel}
                        allowStepSelect={activeStep > (isServiceMenu ? 3 : 2)}
                    >
                        <Stack spacing="md" my="lg">
                            <Text size="sm" weight={500}>
                                {t.guestsPrompt}
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
                                    <Text size="sm">{t.moreThan12}</Text>
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

                    {/* Contact Info */}
                    <Stepper.Step
                        icon={<IconPhone size={16} />}
                        label={t.contactLabel}
                        allowStepSelect={activeStep > (isServiceMenu ? 4 : 3)}
                    >
                        <Stack spacing="md" my="lg">
                            <Text size="sm" weight={500}>
                                {t.contactDescription}
                            </Text>
                            <TextInput
                                label={t.emailLabel}
                                placeholder={t.emailPlaceholder}
                                type="email"
                                withAsterisk
                                {...getInputProps("email")}
                            />
                            <TextInput
                                label={t.phoneLabel}
                                placeholder={t.phonePlaceholder}
                                type="tel"
                                withAsterisk
                                {...getInputProps("phone")}
                            />
                            <Select
                                label={t.contactPreferenceLabel}
                                description={t.contactPreferenceDescription}
                                data={[
                                    { value: "PHONE", label: t.contactPreferencePhone },
                                    { value: "WHATSAPP", label: t.contactPreferenceWhatsApp },
                                    { value: "EMAIL", label: t.contactPreferenceEmail },
                                ]}
                                withAsterisk
                                {...getInputProps("contactPreference")}
                            />
                            <Paper p="md" sx={(theme) => ({ backgroundColor: theme.colors.gray[0] })}>
                                <Stack spacing="xs">
                                    <Text size="sm" weight={600}>
                                        {t.summaryTitle}
                                    </Text>
                                    {isServiceMenu && values.selectedServices.length > 0 && (
                                        <Group spacing="xs" align="flex-start">
                                            <IconBriefcase size={16} style={{ marginTop: 2 }} />
                                            <div>
                                                <Text size="xs" color="dimmed">
                                                    {values.selectedServices.length > 1
                                                        ? (t.summaryServices || "Services:")
                                                        : (t.summaryService || "Service:")}
                                                </Text>
                                                {values.selectedServices.map((s, idx) => (
                                                    <Text key={s.id} size="sm">
                                                        {s.name}
                                                    </Text>
                                                ))}
                                            </div>
                                        </Group>
                                    )}
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
                                            {values.partySize} {values.partySize === 1 ? t.person : t.people}
                                        </Text>
                                    </Group>
                                </Stack>
                            </Paper>
                        </Stack>
                    </Stepper.Step>
                </Stepper>

                <Group position="apart" mt="xl">
                    <Button variant="subtle" onClick={handleBack} disabled={activeStep === 0 || isLoading}>
                        {t.backButton}
                    </Button>
                    {activeStep < lastStep ? (
                        <Button onClick={handleNext} disabled={!canProceed(activeStep) || isLoading}>
                            {t.nextButton}
                        </Button>
                    ) : (
                        <Button type="submit" loading={isLoading} disabled={!canProceed(activeStep)}>
                            {isServiceMenu ? (t.confirmButtonService || t.confirmButton) : t.confirmButton}
                        </Button>
                    )}
                </Group>
            </form>
        </Modal>
    );
};
