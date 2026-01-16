import type { FC } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Carousel } from "@mantine/carousel";
import { useRouter } from "next/router";
import {
    ActionIcon,
    Box,
    Button,
    createStyles,
    Flex,
    MediaQuery,
    SimpleGrid,
    Stack,
    Tabs,
    Text,
    useMantineColorScheme,
    useMantineTheme,
} from "@mantine/core";
import { IconCalendar, IconMail, IconMapPin, IconMessage, IconMoonStars, IconPhone, IconSun } from "@tabler/icons";
import Autoplay from "embla-carousel-autoplay";
import { useTranslations } from "next-intl";

import type { Category, Image, Menu, MenuItem, Restaurant } from "@prisma/client";

import { Black, White } from "src/styles/theme";
import { useSmartTVNavigation } from "src/hooks/useSmartTVNavigation";
import { getInitialMenuSelection, isSmartTV } from "src/utils/detectSmartTV";
import { getFestiveEmoji } from "src/utils/getFestiveEmoji";

import { MenuItemCard } from "./MenuItemCard";
import { PackCard } from "./PackCard";
import { PackAllergenTable } from "./PackAllergenTable";
import { ReservationForm } from "./ReservationForm";
import { Empty } from "../Empty";
import { ImageKitImage } from "../ImageKitImage";
import { LanguageSelector } from "../LanguageSelector";

const useStyles = createStyles((theme) => ({
    carousalOverlay: {
        backgroundImage: theme.fn.linearGradient(
            180,
            theme.fn.rgba(Black, 0),
            theme.fn.rgba(Black, 0.01),
            theme.fn.rgba(Black, 0.025),
            theme.fn.rgba(Black, 0.05),
            theme.fn.rgba(Black, 0.1),
            theme.fn.rgba(Black, 0.2),
            theme.fn.rgba(Black, 0.35),
            theme.fn.rgba(Black, 0.5)
        ),
        bottom: 0,
        left: 0,
        position: "absolute",
        right: 0,
        top: 0,
        zIndex: 1,
    },
    carousalSubWrap: {
        alignItems: "center",
        display: "flex",
        justifyContent: "space-between",
        opacity: 0.8,
    },
    carousalTitle: {
        bottom: 0,
        color: White,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: theme.spacing.md,
        paddingTop: theme.spacing.xl,
        position: "absolute",
        textShadow: `0px 0px 3px ${Black}`,
        width: "100%",
        zIndex: 1,
    },
    carousalTitleSubText: {
        flex: 1,
        fontSize: "1.375rem", // 22px base, scales automatically with viewport
        [`@media (max-width: ${theme.breakpoints.lg})`]: { fontSize: "1.125rem" }, // 18px
        [`@media (max-width: ${theme.breakpoints.sm})`]: { fontSize: "0.875rem" }, // 14px
        [`@media (min-width: 3840px)`]: { fontSize: "2rem" }, // 32px for 4K
    },
    carousalTitleText: {
        fontSize: "2.5rem", // 40px base, scales automatically with viewport
        fontWeight: "bold",
        [`@media (max-width: ${theme.breakpoints.lg})`]: { fontSize: "1.875rem" }, // 30px
        [`@media (max-width: ${theme.breakpoints.sm})`]: { fontSize: "1.5rem" }, // 24px
        [`@media (min-width: 3840px)`]: { fontSize: "3.5rem" }, // 56px for 4K
    },
    darkFontColor: { color: theme.colors.dark[7] },
    headerImageBox: {
        aspectRatio: "4",
        borderRadius: theme.radius.lg,
        overflow: "hidden",
        position: "relative",
        [theme.fn.smallerThan("md")]: { aspectRatio: "3" },
        [theme.fn.smallerThan("sm")]: { aspectRatio: "2.5" },
    },
    mobileTitleWrap: { color: theme.black, gap: 8, marginTop: theme.spacing.lg },
    switchThumb: { background: theme.fn.lighten(Black, 0.2) },
    switchTrack: { background: `${theme.fn.darken(White, 0.1)} !important`, border: "unset" },
    themeSwitch: {
        "&:hover": { backgroundColor: theme.white, opacity: 1 },
        backgroundColor: theme.white,
        boxShadow: theme.shadows.md,
        color: theme.black,
        opacity: 0.8,
        position: "absolute",
        right: 12,
        top: 10,
        transition: "all 500ms ease",
        zIndex: 1,
    },
}));

interface Props {
    restaurant: Restaurant & {
        banners: Image[];
        image: Image | null;
        menus: (Menu & { categories: (Category & { items: (MenuItem & { image: Image | null })[] })[] })[];
    };
}

/** Component to display all the menus and banners of the restaurant */
export const RestaurantMenu: FC<Props> = ({ restaurant }) => {
    const { classes, theme } = useStyles();
    const mantineTheme = useMantineTheme();
    const bannerCarousalRef = useRef(Autoplay({ delay: 5000 }));
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();
    const [menuParent] = useAutoAnimate<HTMLDivElement>();
    const [reservationModalOpened, setReservationModalOpened] = useState(false);

    // Menu sorting: Show room menus first (on Smart TV), then package menus, then standard menus
    const sortedMenus = useMemo(() => {
        const menus = restaurant?.menus || [];
        const now = new Date();

        // Filter out inactive menus and expired temporary menus
        const activeMenus = menus.filter((menu: any) => {
            // Check if menu is marked as inactive
            if (menu.isActive === false) return false;

            // Check if temporary menu is past its end date
            if (menu.isTemporary && menu.endDate) {
                const endDate = new Date(menu.endDate);
                // Set end date to end of day (23:59:59) to include the entire end date
                endDate.setHours(23, 59, 59, 999);
                if (now > endDate) return false;
            }

            // Check if temporary menu hasn't started yet
            if (menu.isTemporary && menu.startDate) {
                const startDate = new Date(menu.startDate);
                // Set start date to beginning of day (00:00:00)
                startDate.setHours(0, 0, 0, 0);
                if (now < startDate) return false;
            }

            return true;
        });

        // Helper to check if menu has packs
        const hasPacks = (menu: any) => menu.packs && menu.packs.length > 0;

        // Only sort for Smart TVs, keep original order for laptops/desktops
        if (isSmartTV()) {
            // Separate room* menus from others
            const roomMenus = activeMenus.filter(menu =>
                menu.name.toLowerCase().startsWith("room")
            );
            const otherMenus = activeMenus.filter(menu =>
                !menu.name.toLowerCase().startsWith("room")
            );

            // Within other menus, separate package menus from standard menus
            const packageMenus = otherMenus.filter(hasPacks);
            const standardMenus = otherMenus.filter(menu => !hasPacks(menu));

            // Put room* menus first, then package menus, then standard menus
            return [...roomMenus, ...packageMenus, ...standardMenus];
        }

        // For non-TV devices, prioritize package menus over standard menus
        const packageMenus = activeMenus.filter(hasPacks);
        const standardMenus = activeMenus.filter(menu => !hasPacks(menu));
        return [...packageMenus, ...standardMenus];
    }, [restaurant?.menus]);

    const router = useRouter();
    const language = (router.query?.lang as string) || "PT";
    const menuIdFromQuery = router.query?.menuId as string | undefined;
    const categoryIdFromQuery = router.query?.categoryId as string | undefined;
    const packIdFromQuery = router.query?.packId as string | undefined;

    // Smart TV detection: Auto-select "Room*" menu if accessing from TV
    // If menuId is provided in query params, use that instead
    const initialMenu = useMemo(
        () => {
            if (menuIdFromQuery) {
                return menuIdFromQuery;
            }
            return getInitialMenuSelection(sortedMenus, sortedMenus?.[0]?.id);
        },
        [sortedMenus, menuIdFromQuery]
    );
    const [selectedMenu, setSelectedMenu] = useState<string | null | undefined>(initialMenu);
    const t = useTranslations("menu");

    // Extract uiTranslations from first menu item (all items share same UI translations)
    const uiTranslations = useMemo(() => {
        const firstItem = restaurant?.menus?.[0]?.categories?.[0]?.items?.[0];
        return (firstItem as any)?.uiTranslations || { remoteShortcuts: t("remoteShortcuts") };
    }, [restaurant?.menus, t]);

    // Get reservation translations from language files
    const reservationTranslations = useMemo(() => ({
        title: t("reservation.title"),
        dateLabel: t("reservation.dateLabel"),
        dateDescription: t("reservation.dateDescription"),
        datePrompt: t("reservation.datePrompt"),
        timeLabel: t("reservation.timeLabel"),
        timeDescription: t("reservation.timeDescription"),
        timePrompt: t("reservation.timePrompt"),
        timeContext: t("reservation.timeContext"),
        guestsLabel: t("reservation.guestsLabel"),
        guestsDescription: t("reservation.guestsDescription"),
        guestsPrompt: t("reservation.guestsPrompt"),
        moreThan12: t("reservation.moreThan12"),
        contactLabel: t("reservation.contactLabel"),
        contactDescription: t("reservation.contactDescription"),
        emailLabel: t("reservation.emailLabel"),
        emailPlaceholder: t("reservation.emailPlaceholder"),
        phoneLabel: t("reservation.phoneLabel"),
        phonePlaceholder: t("reservation.phonePlaceholder"),
        contactPreferenceLabel: t("reservation.contactPreferenceLabel"),
        contactPreferenceDescription: t("reservation.contactPreferenceDescription"),
        contactPreferencePhone: t("reservation.contactPreferencePhone"),
        contactPreferenceWhatsApp: t("reservation.contactPreferenceWhatsApp"),
        contactPreferenceEmail: t("reservation.contactPreferenceEmail"),
        summaryTitle: t("reservation.summaryTitle"),
        person: t("reservation.person"),
        people: t("reservation.people"),
        backButton: t("reservation.backButton"),
        nextButton: t("reservation.nextButton"),
        confirmButton: t("reservation.confirmButton"),
        successTitle: t("reservation.successTitle"),
        successMessage: t("reservation.successMessage"),
        errorTitle: t("reservation.errorTitle"),
    }), [t]);

    const handleLanguageChange = (newLang: string) => {
        const currentQuery = { ...router.query };
        if (newLang === "PT") {
            delete currentQuery.lang;
        } else {
            currentQuery.lang = newLang;
        }
        router.push(
            {
                pathname: router.pathname,
                query: currentQuery,
            },
            undefined,
            { shallow: false }
        );
    };

    // Update selected menu when menuId query parameter changes
    useEffect(() => {
        if (menuIdFromQuery && menuIdFromQuery !== selectedMenu) {
            setSelectedMenu(menuIdFromQuery);
        }
    }, [menuIdFromQuery]);

    // Keyboard shortcuts for language switching (Smart TV remote control)
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            // Don't trigger language shortcuts if user is typing in an input/textarea
            const target = event.target as HTMLElement;
            const isTyping = target.tagName === 'INPUT' ||
                            target.tagName === 'TEXTAREA' ||
                            target.isContentEditable;

            if (isTyping) {
                return; // Allow normal typing in form fields
            }

            // Number key shortcuts for languages
            const languageMap: Record<string, string> = {
                '1': 'PT', // Portuguese
                '2': 'EN', // English
                '3': 'ES', // Spanish
                '4': 'FR', // French
                '5': 'DE', // German
                '6': 'IT', // Italian
            };

            if (languageMap[event.key]) {
                event.preventDefault();
                handleLanguageChange(languageMap[event.key]);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [router]);

    const menuDetails = useMemo(
        () => sortedMenus?.find((item) => item.id === selectedMenu),
        [selectedMenu, sortedMenus]
    );

    const images: Image[] = useMemo(() => {
        const now = new Date();

        const isBannerActive = (banner: any) => {
            // Check final expiry date first
            if (banner.expiryDate && new Date(banner.expiryDate) <= now) {
                return false; // Banner has permanently expired
            }

            // Check schedule type
            switch (banner.scheduleType) {
                case "ALWAYS":
                    return true;

                case "DAILY": {
                    if (!banner.dailyStartTime || !banner.dailyEndTime) return true;
                    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
                    return currentTime >= banner.dailyStartTime && currentTime <= banner.dailyEndTime;
                }

                case "WEEKLY": {
                    if (!banner.weeklyDays || banner.weeklyDays.length === 0) return true;
                    const currentDay = now.getDay(); // 0=Sunday, 1=Monday, etc.
                    return banner.weeklyDays.includes(currentDay);
                }

                case "MONTHLY": {
                    if (!banner.monthlyDays || banner.monthlyDays.length === 0) return true;
                    const currentDate = now.getDate(); // 1-31
                    return banner.monthlyDays.includes(currentDate);
                }

                case "YEARLY": {
                    if (!banner.yearlyStartDate || !banner.yearlyEndDate) return true;
                    const currentMMDD = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                    return currentMMDD >= banner.yearlyStartDate && currentMMDD <= banner.yearlyEndDate;
                }

                case "PERIOD": {
                    if (!banner.periodStartDate || !banner.periodEndDate) return true;
                    const startDate = new Date(banner.periodStartDate);
                    const endDate = new Date(banner.periodEndDate);
                    return now >= startDate && now <= endDate;
                }

                default:
                    return true;
            }
        };

        const activeBanners = restaurant?.banners?.filter(isBannerActive) || [];

        if (restaurant?.image) {
            return [restaurant?.image, ...activeBanners];
        }
        return activeBanners;
    }, [restaurant]);

    const haveMenuItems = menuDetails?.categories?.some((category) => category?.items?.length > 0);
    const havePacks = (menuDetails as any)?.packs?.length > 0;

    // Smart TV remote control navigation
    const menuIds = useMemo(() => sortedMenus?.map(m => m.id) || [], [sortedMenus]);
    useSmartTVNavigation({
        currentMenuId: selectedMenu,
        menuIds,
        onMenuChange: setSelectedMenu,
        enabled: true,
    });

    return (
        <Box mih="calc(100vh - 100px)">
            <Box pos="relative" className="no-print">
                <Carousel
                    className={classes.headerImageBox}
                    data-testid="restaurant-banner"
                    height="100%"
                    loop
                    mx="auto"
                    onMouseEnter={bannerCarousalRef.current.stop}
                    onMouseLeave={bannerCarousalRef.current.reset}
                    plugins={[bannerCarousalRef.current]}
                    slideGap="md"
                    styles={{ indicator: { background: White } }}
                    withControls={false}
                    withIndicators={images.length > 1}
                >
                    {images?.map((banner, index) => (
                        <Carousel.Slide key={banner.id}>
                            <ImageKitImage
                                blurhash={banner.blurHash}
                                color={banner.color}
                                height={400}
                                imageAlt={`${restaurant.name}-banner-${index}`}
                                imagePath={banner.path}
                                width={1000}
                            />
                            <Box className={classes.carousalOverlay} />
                        </Carousel.Slide>
                    ))}
                </Carousel>
                <MediaQuery smallerThan="xs" styles={{ display: "none" }}>
                    <Box className={classes.carousalTitle}>
                        <Text className={classes.carousalTitleText} translate="no">{restaurant?.name}</Text>
                        <Box className={classes.carousalSubWrap}>
                            <Flex align="center" gap={10}>
                                <IconMapPin />
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                        restaurant?.location
                                    )}`}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                >
                                    <Text className={classes.carousalTitleSubText} translate="yes">{restaurant?.location}</Text>
                                </a>
                            </Flex>
                            {restaurant?.contactNo && (
                                <Flex align="center" gap={10}>
                                    <IconPhone />
                                    <a href={`tel:${restaurant?.contactNo.replace(/\s/g, "")}`}>
                                        <Text className={classes.carousalTitleSubText} translate="no">{restaurant?.contactNo}</Text>
                                    </a>
                                </Flex>
                            )}
                        </Box>
                    </Box>
                </MediaQuery>
                <Box pos="absolute" right={12} top={10} sx={{ display: "flex", flexDirection: "column", gap: 8, zIndex: 1, alignItems: "flex-end" }}>
                    <Box sx={{ display: "flex", gap: 8 }}>
                        <LanguageSelector currentLanguage={language} onLanguageChange={handleLanguageChange} />
                        <ActionIcon className={classes.themeSwitch} onClick={() => toggleColorScheme()} size="lg" sx={{ position: "relative", right: "unset", top: "unset" }}>
                            {colorScheme === "dark" ? <IconSun size={18} strokeWidth={2.5} /> : <IconMoonStars size={18} />}
                        </ActionIcon>
                    </Box>
                    {/* Smart TV keyboard shortcuts hint - only show on large screens (1440px+) */}
                    <Box
                        sx={{
                            display: "none",
                            "@media (min-width: 90em)": { // 1440px and up (large TVs)
                                display: "flex",
                                backgroundColor: "rgba(0, 0, 0, 0.8)",
                                borderRadius: "4px",
                                color: "white",
                                padding: "0.75rem 1rem",
                                flexDirection: "column",
                                gap: 6,
                                fontSize: "1rem", // Will scale with viewport
                            },
                        }}
                    >
                        <Text weight={600} sx={{ fontSize: "inherit" }}>
                            📱 Control Shortcuts:
                        </Text>
                        <Text sx={{ fontSize: "inherit", lineHeight: 1.4 }}>
                            1=PT · 2=EN · 3=ES · 4=FR · 5=DE · 6=IT
                        </Text>
                    </Box>
                </Box>
            </Box>

            <MediaQuery largerThan="xs" styles={{ display: "none" }}>
                <Stack className={classes.mobileTitleWrap}>
                    <Text className={classes.carousalTitleText} translate="no">{restaurant?.name}</Text>
                    <Flex align="center" gap={10} opacity={0.6}>
                        <IconMapPin />
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                restaurant?.location
                            )}`}
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            <Text className={classes.carousalTitleSubText} translate="yes">{restaurant?.location}</Text>
                        </a>
                    </Flex>
                    {restaurant?.contactNo && (
                        <Flex align="center" gap={10} opacity={0.6}>
                            <IconPhone />
                            <a href={`tel:${restaurant?.contactNo.replace(/\s/g, "")}`}>
                                <Text className={classes.carousalTitleSubText} translate="no">{restaurant?.contactNo}</Text>
                            </a>
                        </Flex>
                    )}
                </Stack>
            </MediaQuery>
            <Tabs my={40} onTabChange={setSelectedMenu} value={selectedMenu}>
                <Tabs.List className="no-print">
                    {sortedMenus?.map((menu) => (
                        <Tabs.Tab
                            key={menu.id}
                            px="lg"
                            value={menu.id}
                            sx={(theme) => ({
                                // Festive menu highlighting
                                ...((menu as any).isFestive && {
                                    background: `linear-gradient(135deg, ${theme.fn.rgba(theme.colors.green[1], 0.3)} 0%, ${theme.fn.rgba(theme.colors.red[1], 0.3)} 100%)`,
                                    border: `2px solid ${theme.colors.green[3]}`,
                                    borderRadius: theme.radius.md,
                                    '&[data-active]': {
                                        background: `linear-gradient(135deg, ${theme.fn.rgba(theme.colors.green[2], 0.5)} 0%, ${theme.fn.rgba(theme.colors.red[2], 0.5)} 100%)`,
                                        borderColor: theme.colors.green[5],
                                    },
                                }),
                            })}
                        >
                            <Text
                                color={theme.black}
                                size="lg"
                                translate="no"
                                weight={selectedMenu === menu.id ? "bold" : "normal"}
                            >
                                {(menu as any).isFestive ? `${getFestiveEmoji()} ${menu.name}` : menu.name}
                            </Text>
                            <Text color={theme.colors.dark[8]} opacity={selectedMenu === menu.id ? 1 : 0.5} size="xs" translate="yes">
                                {(menu as any).isTemporary && (menu as any).startDate && (menu as any).endDate
                                    ? `${new Date((menu as any).startDate).toLocaleDateString("en-GB", {
                                          day: "numeric",
                                          month: "short",
                                      })} - ${new Date((menu as any).endDate).toLocaleDateString("en-GB", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                      })}`
                                    : menu.availableTime}
                            </Text>
                        </Tabs.Tab>
                    ))}
                </Tabs.List>
            </Tabs>
            {menuDetails && (
                <Stack spacing="xs" mb="lg" className="no-print">
                    {/* New Reservation System - Standardized Button Style */}
                    {(menuDetails as any).reservationType === "EXTERNAL" && (menuDetails as any).reservationUrl && (
                        <Button
                            component="a"
                            href={(menuDetails as any).reservationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            leftIcon={<IconCalendar size={16} />}
                            variant="filled"
                            color="primary"
                            sx={{ width: 'fit-content' }}
                        >
                            {t("reservations")}
                        </Button>
                    )}
                    {(menuDetails as any).reservationType === "FORM" && (
                        <Button
                            leftIcon={<IconCalendar size={16} />}
                            variant="filled"
                            color="primary"
                            onClick={() => setReservationModalOpened(true)}
                            sx={{ width: 'fit-content' }}
                        >
                            {t("reservations")}
                        </Button>
                    )}
                    {/* Legacy reservation link support (deprecated) */}
                    {!(menuDetails as any).reservationType && (menuDetails as any).reservations && (
                        <Flex align="center" gap={8}>
                            <IconCalendar size={16} color={mantineTheme.colors.primary[6]} />
                            <a href={(menuDetails as any).reservations} rel="noopener noreferrer" target="_blank" style={{ textDecoration: 'underline' }}>
                                <Text size="sm" translate="yes" weight={600} color={mantineTheme.colors.primary[6]}>{t("reservations")}</Text>
                            </a>
                        </Flex>
                    )}

                    {menuDetails.telephone && (
                        <Flex align="center" gap={8}>
                            <IconPhone size={16} />
                            <a href={`tel:${menuDetails.telephone.replace(/\s/g, "")}`}>
                                <Text size="sm" translate="no">{menuDetails.telephone}</Text>
                            </a>
                        </Flex>
                    )}
                    {menuDetails.email && (
                        <Flex align="center" gap={8}>
                            <IconMail size={16} />
                            <a href={`mailto:${menuDetails.email}`}>
                                <Text size="sm" translate="no">{menuDetails.email}</Text>
                            </a>
                        </Flex>
                    )}
                    {menuDetails.message && (
                        <Flex align="center" gap={8}>
                            <IconMessage size={16} />
                            <Text size="sm" translate="yes">{menuDetails.message}</Text>
                        </Flex>
                    )}
                </Stack>
            )}

            {/* Reservation Form Modal */}
            {menuDetails && (menuDetails as any).reservationType === "FORM" && (
                <ReservationForm
                    menuId={menuDetails.id}
                    menuName={menuDetails.name}
                    restaurantName={restaurant.name}
                    startTime={(menuDetails as any).reservationStartTime || "10:00"}
                    endTime={(menuDetails as any).reservationEndTime || "22:00"}
                    maxPartySize={(menuDetails as any).reservationMaxPartySize || 12}
                    slotDuration={(menuDetails as any).reservationSlotDuration || 30}
                    menuStartDate={(menuDetails as any).isTemporary ? (menuDetails as any).startDate : null}
                    menuEndDate={(menuDetails as any).isTemporary ? (menuDetails as any).endDate : null}
                    translations={reservationTranslations}
                    opened={reservationModalOpened}
                    onClose={() => setReservationModalOpened(false)}
                />
            )}

            <Box ref={menuParent}>
                {/* Print-only header for category name */}
                {categoryIdFromQuery && (
                    <Box className="print-only" sx={{ display: "none", marginBottom: "1.5rem" }}>
                        <Text size="xl" weight={700} translate="no">
                            {menuDetails?.categories?.find((cat) => cat.id === categoryIdFromQuery)?.name}
                        </Text>
                    </Box>
                )}

                {/* Print-only header for pack name */}
                {packIdFromQuery && (
                    <Box className="print-only" sx={{ display: "none", marginBottom: "1.5rem" }}>
                        <Text size="xl" weight={700} translate="no">
                            {(menuDetails as any)?.packs?.find((pack: any) => pack.id === packIdFromQuery)?.name}
                        </Text>
                    </Box>
                )}

                {/* Hide packs when printing a specific category */}
                {!categoryIdFromQuery && (menuDetails as any)?.packs
                    ?.filter((pack: any) => {
                        // Filter by pack ID if provided in query params (for printing)
                        if (packIdFromQuery) {
                            return pack.id === packIdFromQuery;
                        }
                        return true;
                    })
                    ?.map((pack: any) => (
                    <Box key={pack.id} mb={40}>
                        <PackCard pack={pack} isFestive={(menuDetails as any)?.isFestive} />
                        <PackAllergenTable
                            sections={pack.sections || []}
                            allergenTranslations={pack.uiTranslations?.allergens || {}}
                            allergensInfoLabel={pack.uiTranslations?.allergensInfo}
                        />
                    </Box>
                ))}
                {/* Hide categories when printing a specific pack */}
                {!packIdFromQuery && menuDetails?.categories
                    ?.filter((category) => {
                        // Filter by category ID if provided in query params
                        if (categoryIdFromQuery) {
                            return category.id === categoryIdFromQuery && category?.items.length;
                        }
                        return category?.items.length;
                    })
                    ?.map((category) => (
                        <Box key={category.id}>
                            {/* Hide category name when printing specific category (already shown in print-only header) */}
                            {!categoryIdFromQuery && (
                                <Text my="lg" size="lg" translate="no" weight={600}>
                                    {category.name}
                                </Text>
                            )}
                            <SimpleGrid
                                breakpoints={[
                                    { cols: 3, minWidth: "lg" },
                                    { cols: 2, minWidth: "sm" },
                                    { cols: 1, minWidth: "xs" },
                                ]}
                                mb={30}
                            >
                                {category.items?.map((item: any) => (
                                    <MenuItemCard key={item.id} item={item} />
                                ))}
                            </SimpleGrid>
                        </Box>
                    ))}
                {sortedMenus?.length === 0 && !haveMenuItems && (
                    <Empty height={400} text={t("noMenusForVenue")} />
                )}
                {!!sortedMenus?.length && !haveMenuItems && !havePacks && <Empty height={400} text={t("noItemsForMenu")} />}
            </Box>
        </Box>
    );
};
