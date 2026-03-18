import type { FC } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Carousel } from "@mantine/carousel";
import { useRouter } from "next/router";
import {
    ActionIcon,
    Alert,
    Box,
    Button,
    createStyles,
    Flex,
    Group,
    MediaQuery,
    MultiSelect,
    SimpleGrid,
    Stack,
    Tabs,
    Text,
    TextInput,
    useMantineColorScheme,
    useMantineTheme,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconCalendar, IconMail, IconMapPin, IconMessage, IconMoonStars, IconPhone, IconSearch, IconSun, IconX } from "@tabler/icons";
import Autoplay from "embla-carousel-autoplay";
import { useTranslations } from "next-intl";

import type { Category, Image, Menu, MenuItem, Restaurant } from "@prisma/client";

import { Black, White } from "src/styles/theme";
import { LANGUAGES, getFlagUrl } from "src/constants/languages";
import { useSmartTVNavigation } from "src/hooks/useSmartTVNavigation";
import { getInitialMenuSelection, isSmartTV } from "src/utils/detectSmartTV";
import { getFestiveEmoji } from "src/utils/getFestiveEmoji";
import { allergenCodes, allergenSymbols } from "src/utils/validators";

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
    const [isTV, setIsTV] = useState(false);
    useEffect(() => { setIsTV(isSmartTV()); }, []);

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
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch] = useDebouncedValue(searchQuery, 200);
    const [excludedAllergens, setExcludedAllergens] = useState<string[]>([]);
    const t = useTranslations("menu");

    // Extract uiTranslations from first menu item (all items share same UI translations)
    const uiTranslations = useMemo(() => {
        const firstItem = restaurant?.menus?.[0]?.categories?.[0]?.items?.[0];
        return (firstItem as any)?.uiTranslations || { remoteShortcuts: t("remoteShortcuts") };
    }, [restaurant?.menus, t]);

    // Get reservation translations from language files
    const reservationTranslations = useMemo(() => ({
        title: t("reservation.title"),
        titleService: t("reservation.titleService"),
        dateLabel: t("reservation.dateLabel"),
        dateDescription: t("reservation.dateDescription"),
        datePrompt: t("reservation.datePrompt"),
        timeLabel: t("reservation.timeLabel"),
        timeDescription: t("reservation.timeDescription"),
        timePrompt: t("reservation.timePrompt"),
        timeContext: t("reservation.timeContext", { date: "" }),
        guestsLabel: t("reservation.guestsLabel"),
        guestsDescription: t("reservation.guestsDescription"),
        guestsPrompt: t("reservation.guestsPrompt"),
        moreThan12: t("reservation.moreThan12"),
        serviceLabel: t("reservation.serviceLabel"),
        serviceDescription: t("reservation.serviceDescription"),
        servicePrompt: t("reservation.servicePrompt"),
        servicesLabel: t("reservation.servicesLabel"),
        servicesDescription: t("reservation.servicesDescription"),
        servicesPrompt: t("reservation.servicesPrompt"),
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
        summaryService: t("reservation.summaryService"),
        summaryServices: t("reservation.summaryServices"),
        serviceSelectedSingular: t("reservation.serviceSelectedSingular"),
        serviceSelectedPlural: t("reservation.serviceSelectedPlural"),
        person: t("reservation.person"),
        people: t("reservation.people"),
        backButton: t("reservation.backButton"),
        nextButton: t("reservation.nextButton"),
        confirmButton: t("reservation.confirmButton"),
        confirmButtonService: t("reservation.confirmButtonService"),
        successTitle: t("reservation.successTitle"),
        successTitleService: t("reservation.successTitleService"),
        successMessage: t("reservation.successMessage"),
        successMessageService: t("reservation.successMessageService"),
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

    // Handle menu tab change - clear categoryId and packId from URL when switching menus
    const handleMenuChange = (menuId: string | null) => {
        setSelectedMenu(menuId);
        setSearchQuery("");
        setExcludedAllergens([]);

        // If URL has categoryId or packId, clear them when switching menus
        // (they belong to a different menu and would cause empty display)
        if (categoryIdFromQuery || packIdFromQuery || menuIdFromQuery) {
            const currentQuery = { ...router.query };
            delete currentQuery.categoryId;
            delete currentQuery.packId;
            delete currentQuery.menuId;
            router.replace(
                {
                    pathname: router.pathname,
                    query: currentQuery,
                },
                undefined,
                { shallow: true }
            );
        }
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

    // Search and allergen filtering
    const normalizeSearch = (text: string) =>
        text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const itemPassesAllergenFilter = (item: any): boolean => {
        if (excludedAllergens.length === 0) return true;
        if (!(item as any)?.isEdible) return true;
        const itemAllergens: string[] = (item as any)?.allergens || [];
        if (itemAllergens.includes("none") && itemAllergens.length === 1) return true;
        return !excludedAllergens.some((allergen) => itemAllergens.includes(allergen));
    };

    const { filteredCategories, filteredPacks, hasSearchResults } = useMemo(() => {
        const query = normalizeSearch(debouncedSearch.trim());
        const hasQuery = !!query;
        const hasAllergenFilter = excludedAllergens.length > 0;

        if (!hasQuery && !hasAllergenFilter) {
            return {
                filteredCategories: menuDetails?.categories || [],
                filteredPacks: (menuDetails as any)?.packs || [],
                hasSearchResults: true,
            };
        }

        const filteredCats = (menuDetails?.categories || [])
            .map((category) => ({
                ...category,
                items: category.items.filter((item) => {
                    // Allergen filter
                    if (!itemPassesAllergenFilter(item)) return false;
                    // Search filter
                    if (!hasQuery) return true;
                    const nameMatch = normalizeSearch(item.name).includes(query);
                    const descMatch = item.description
                        ? normalizeSearch(item.description).includes(query)
                        : false;
                    return nameMatch || descMatch;
                }),
            }))
            .filter((category) => category.items.length > 0);

        const filteredPacksList = ((menuDetails as any)?.packs || []).filter((pack: any) => {
            if (hasQuery) {
                if (normalizeSearch(pack.name).includes(query)) return true;
                if (pack.description && normalizeSearch(pack.description).includes(query)) return true;
                return pack.sections?.some((section: any) => {
                    if (section.title && normalizeSearch(section.title).includes(query)) return true;
                    return section.items?.some((item: any) => {
                        const itemName = typeof item === "string" ? item : item?.name || "";
                        return normalizeSearch(itemName).includes(query);
                    });
                });
            }
            return true;
        });

        return {
            filteredCategories: filteredCats,
            filteredPacks: filteredPacksList,
            hasSearchResults: filteredCats.length > 0 || filteredPacksList.length > 0,
        };
    }, [debouncedSearch, excludedAllergens, menuDetails]);

    // Clear categoryId from URL if it doesn't belong to the current menu
    useEffect(() => {
        if (categoryIdFromQuery && menuDetails) {
            const categoryBelongsToMenu = menuDetails.categories?.some(
                (cat) => cat.id === categoryIdFromQuery
            );
            if (!categoryBelongsToMenu) {
                const currentQuery = { ...router.query };
                delete currentQuery.categoryId;
                router.replace(
                    { pathname: router.pathname, query: currentQuery },
                    undefined,
                    { shallow: true }
                );
            }
        }
    }, [categoryIdFromQuery, menuDetails, router]);

    const isBannerActive = (banner: any, now: Date) => {
        if (banner.expiryDate && new Date(banner.expiryDate) <= now) return false;
        switch (banner.scheduleType) {
            case "ALWAYS": return true;
            case "DAILY": {
                if (!banner.dailyStartTime || !banner.dailyEndTime) return true;
                const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
                return currentTime >= banner.dailyStartTime && currentTime <= banner.dailyEndTime;
            }
            case "WEEKLY": {
                if (!banner.weeklyDays || banner.weeklyDays.length === 0) return true;
                return banner.weeklyDays.includes(now.getDay());
            }
            case "MONTHLY": {
                if (!banner.monthlyDays || banner.monthlyDays.length === 0) return true;
                return banner.monthlyDays.includes(now.getDate());
            }
            case "YEARLY": {
                if (!banner.yearlyStartDate || !banner.yearlyEndDate) return true;
                const currentMMDD = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                return currentMMDD >= banner.yearlyStartDate && currentMMDD <= banner.yearlyEndDate;
            }
            case "PERIOD": {
                if (!banner.periodStartDate || !banner.periodEndDate) return true;
                return now >= new Date(banner.periodStartDate) && now <= new Date(banner.periodEndDate);
            }
            default: return true;
        }
    };

    const images: Image[] = useMemo(() => {
        const now = new Date();
        const activeBanners = restaurant?.banners?.filter((b) => isBannerActive(b, now)) || [];
        if (restaurant?.image) {
            return [restaurant?.image, ...activeBanners];
        }
        return activeBanners;
    }, [restaurant]);

    const guestNotification = useMemo(() => {
        const now = new Date();
        const activeBanners = restaurant?.banners?.filter((b) => isBannerActive(b, now)) || [];
        const notifyBanner = activeBanners.find((b: any) => b.notifyGuests && b.guestMessage);
        return notifyBanner ? (notifyBanner as any).guestMessage as string : null;
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
                    {/* Smart TV keyboard shortcuts hint — only on actual TV devices */}
                    {isTV && (
                        <Box
                            sx={{
                                backgroundColor: "rgba(0, 0, 0, 0.8)",
                                borderRadius: "4px",
                                color: "white",
                                display: "flex",
                                flexDirection: "column",
                                fontSize: "1rem",
                                gap: 6,
                                padding: "0.75rem 1rem",
                            }}
                        >
                            <Text weight={600} sx={{ fontSize: "inherit" }}>
                                📱 Control Shortcuts:
                            </Text>
                            <Text sx={{ fontSize: "inherit", lineHeight: 1.4 }}>
                                1=PT · 2=EN · 3=ES · 4=FR · 5=DE · 6=IT
                            </Text>
                        </Box>
                    )}
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

            {/* Leave a Review buttons — non-TV only, shown when configured */}
            {!isTV && ((restaurant as any).googlePlaceId || (restaurant as any).tripadvisorUrl) && (
                <Flex
                    className="no-print"
                    align="center"
                    direction={{ base: "column", md: "row" }}
                    gap="xs"
                    mb="md"
                    mt="xs"
                    wrap="wrap"
                >
                    {(restaurant as any).googlePlaceId && (
                        <Button
                            color="blue"
                            component="a"
                            href={`https://search.google.com/local/writereview?placeid=${(restaurant as any).googlePlaceId}`}
                            radius="xl"
                            rel="noopener noreferrer"
                            size="xs"
                            target="_blank"
                            variant="outline"
                        >
                            ⭐ {t("leaveGoogleReview")}
                        </Button>
                    )}
                    {(restaurant as any).tripadvisorUrl && (
                        <Button
                            color="green"
                            component="a"
                            href={(restaurant as any).tripadvisorUrl}
                            radius="xl"
                            rel="noopener noreferrer"
                            size="xs"
                            target="_blank"
                            variant="outline"
                        >
                            🦉 {t("leaveTripAdvisorReview")}
                        </Button>
                    )}
                </Flex>
            )}

            {guestNotification && (
                <Alert color="teal" mb="md" radius="md" variant="light">
                    {guestNotification}
                </Alert>
            )}

            <Tabs my={40} onTabChange={handleMenuChange} value={selectedMenu}>
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
                                {(menu as any).menuType === "INTERNAL" ? "💼 " : ""}
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
                <Flex
                    className="no-print"
                    mb="lg"
                    gap="xs"
                    direction={{ base: "column", md: "row" }}
                    align={{ base: "stretch", md: "center" }}
                    wrap="wrap"
                >
                    {(menuDetails as any).reservationType === "EXTERNAL" && (menuDetails as any).reservationUrl && (
                        <Button
                            component="a"
                            href={(menuDetails as any).reservationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            leftIcon={<IconCalendar size={16} />}
                            variant="filled"
                            color="primary"
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
                        >
                            {t("reservations")}
                        </Button>
                    )}
                    {!(menuDetails as any).reservationType && (menuDetails as any).reservations && (
                        <Button
                            component="a"
                            href={(menuDetails as any).reservations}
                            target="_blank"
                            rel="noopener noreferrer"
                            leftIcon={<IconCalendar size={16} />}
                            variant="filled"
                            color="primary"
                        >
                            {t("reservations")}
                        </Button>
                    )}
                    {!isSmartTV() && menuDetails.telephone && (
                        <Button
                            component="a"
                            href={`tel:${menuDetails.telephone.replace(/\s/g, "")}`}
                            leftIcon={<IconPhone size={14} />}
                            variant="outline"
                            color="gray"
                            radius="xl"
                            size="xs"
                            sx={(theme) => ({
                                color: theme.colors.dark[6],
                                borderColor: theme.colors.gray[4],
                                '&:hover': { backgroundColor: theme.colors.gray[1] },
                            })}
                        >
                            <Text size="xs" translate="no">{menuDetails.telephone}</Text>
                        </Button>
                    )}
                    {!isSmartTV() && menuDetails.email && (
                        <Button
                            component="a"
                            href={`mailto:${menuDetails.email}`}
                            leftIcon={<IconMail size={14} />}
                            variant="outline"
                            color="gray"
                            radius="xl"
                            size="xs"
                            sx={(theme) => ({
                                color: theme.colors.dark[6],
                                borderColor: theme.colors.gray[4],
                                '&:hover': { backgroundColor: theme.colors.gray[1] },
                            })}
                        >
                            <Text size="xs" translate="no">{menuDetails.email}</Text>
                        </Button>
                    )}
                    {menuDetails.message && (
                        <Button
                            component="span"
                            leftIcon={<IconMessage size={14} />}
                            variant="outline"
                            color="gray"
                            radius="xl"
                            size="xs"
                            sx={(theme) => ({
                                color: theme.colors.dark[6],
                                borderColor: theme.colors.gray[4],
                                cursor: 'default',
                                '&:hover': { backgroundColor: theme.colors.gray[0] },
                            })}
                        >
                            <Text size="xs" translate="yes">{menuDetails.message}</Text>
                        </Button>
                    )}
                </Flex>
            )}
            {menuDetails && (() => {
                const hasEdibleItems = menuDetails.categories?.some((cat) =>
                    cat.items?.some((item: any) => item.isEdible)
                );
                const allergenOptions = allergenCodes
                    .filter((code) => code !== "none")
                    .map((code) => ({
                        value: code,
                        label: `${allergenSymbols[code]} ${uiTranslations?.allergens?.[code] || code}`,
                    }));

                return (
                    <Flex
                        className="no-print"
                        my="md"
                        gap="sm"
                        direction={{ base: "column", md: "row" }}
                        align={{ base: "stretch", md: "flex-end" }}
                    >
                        <Box
                            sx={(theme) => ({
                                flex: 1,
                                padding: theme.spacing.sm,
                                borderRadius: theme.radius.sm,
                                border: `1px solid ${searchQuery ? theme.colors.blue[3] : theme.colors.gray[3]}`,
                                backgroundColor: searchQuery ? theme.fn.rgba(theme.colors.blue[0], 0.5) : theme.colors.gray[0],
                                [theme.fn.smallerThan("md")]: { maxWidth: "100%" },
                            })}
                        >
                            <Group spacing={6} mb={6}>
                                <IconSearch size={14} />
                                <Text size="xs" weight={600} color="dark">
                                    {t("searchPlaceholder")}
                                </Text>
                            </Group>
                            <TextInput
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                                rightSection={
                                    searchQuery ? (
                                        <ActionIcon onClick={() => setSearchQuery("")} variant="transparent" aria-label="Clear search">
                                            <IconX size={16} />
                                        </ActionIcon>
                                    ) : null
                                }
                                size="sm"
                                styles={() => ({
                                    input: {
                                        backgroundColor: 'white',
                                    },
                                })}
                            />
                        </Box>
                        {hasEdibleItems && (
                            <Box
                                sx={(theme) => ({
                                    flex: 1,
                                    padding: theme.spacing.sm,
                                    borderRadius: theme.radius.sm,
                                    border: `1px solid ${excludedAllergens.length > 0 ? theme.colors.orange[3] : theme.colors.gray[3]}`,
                                    backgroundColor: excludedAllergens.length > 0 ? theme.fn.rgba(theme.colors.orange[0], 0.5) : theme.colors.gray[0],
                                    [theme.fn.smallerThan("md")]: { maxWidth: "100%" },
                                })}
                            >
                                <Group spacing={6} mb={6}>
                                    <Text size="xs" color="orange.7">&#9888;</Text>
                                    <Text size="xs" weight={600} color="dark">
                                        {t("allergenFilterLabel")}
                                    </Text>
                                </Group>
                                <MultiSelect
                                    data={allergenOptions}
                                    value={excludedAllergens}
                                    onChange={setExcludedAllergens}
                                    placeholder={t("allergenFilterPlaceholder")}
                                    clearable
                                    searchable
                                    nothingFound=""
                                    size="sm"
                                    styles={() => ({
                                        input: {
                                            backgroundColor: 'white',
                                        },
                                    })}
                                />
                            </Box>
                        )}
                    </Flex>
                );
            })()}

            {/* Reservation Form Modal */}
            {menuDetails && (menuDetails as any).reservationType === "FORM" && (() => {
                // Check if this is a service menu (all items are non-edible)
                const allItems = menuDetails.categories?.flatMap((cat) => cat.items || []) || [];
                const nonEdibleItems = allItems.filter((item: any) => !item.isEdible);
                const isServiceMenu = nonEdibleItems.length > 0 && nonEdibleItems.length === allItems.length;

                // Extract services for the service menu
                // Convert price to number since Prisma Decimal is serialized as string
                const services = isServiceMenu
                    ? nonEdibleItems.map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        price: item.price != null ? Number(item.price) : null,
                        description: item.description,
                    }))
                    : [];

                return (
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
                        isServiceMenu={isServiceMenu}
                        services={services}
                    />
                );
            })()}

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
                {!categoryIdFromQuery && filteredPacks
                    ?.filter((pack: any) => {
                        // Filter by pack ID if provided in query params (for printing), but not when searching
                        if (!debouncedSearch.trim() && packIdFromQuery) {
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
                {!packIdFromQuery && filteredCategories
                    ?.filter((category) => {
                        // Filter by category ID if provided in query params, but not when searching
                        if (!debouncedSearch.trim() && categoryIdFromQuery) {
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
                {(debouncedSearch.trim() || excludedAllergens.length > 0) && !hasSearchResults && (
                    <Empty height={300} text={t("searchNoResults")} />
                )}
                {sortedMenus?.length === 0 && !haveMenuItems && (
                    <Empty height={400} text={t("noMenusForVenue")} />
                )}
                {!!sortedMenus?.length && !haveMenuItems && !havePacks && !debouncedSearch.trim() && excludedAllergens.length === 0 && <Empty height={400} text={t("noItemsForMenu")} />}
            </Box>

            {/* Fixed bottom language bar — TV only */}
            {isTV && <Box
                className="no-print"
                sx={{
                    alignItems: "center",
                    backgroundColor: "rgba(0, 0, 0, 0.88)",
                    bottom: 0,
                    display: "flex",
                    gap: 6,
                    justifyContent: "center",
                    left: 0,
                    padding: "8px 16px",
                    position: "fixed",
                    right: 0,
                    zIndex: 200,
                }}
            >
                {LANGUAGES.map((lang) => (
                    <Box
                        component="button"
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        sx={(theme) => ({
                            "&:focus": { outline: `2px solid ${theme.colors.blue[4]}`, outlineOffset: 2 },
                            "&:hover": { backgroundColor: theme.colors.blue[6] },
                            alignItems: "center",
                            backgroundColor: language.toUpperCase() === lang.code
                                ? theme.colors.blue[7]
                                : "rgba(255,255,255,0.12)",
                            border: "none",
                            borderRadius: theme.radius.sm,
                            color: "white",
                            cursor: "pointer",
                            display: "flex",
                            fontSize: 13,
                            fontWeight: 600,
                            gap: 6,
                            padding: "5px 12px",
                            transition: "background 0.2s",
                        })}
                    >
                        <Box
                            alt={lang.label}
                            component="img"
                            {...getFlagUrl(lang.countryCode, "small")}
                            sx={{ borderRadius: 2 }}
                        />
                        {lang.code}
                        <Text sx={{ color: "rgba(255,255,255,0.55)", fontSize: 10 }}>
                            {lang.shortcut}
                        </Text>
                    </Box>
                ))}
            </Box>}
        </Box>
    );
};
