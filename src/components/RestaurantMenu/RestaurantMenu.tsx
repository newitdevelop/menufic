import type { FC } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Carousel } from "@mantine/carousel";
import { useRouter } from "next/router";
import {
    ActionIcon,
    Box,
    createStyles,
    Flex,
    MediaQuery,
    SimpleGrid,
    Stack,
    Tabs,
    Text,
    useMantineColorScheme,
} from "@mantine/core";
import { IconCalendar, IconMail, IconMapPin, IconMessage, IconMoonStars, IconPhone, IconSun } from "@tabler/icons";
import Autoplay from "embla-carousel-autoplay";
import { useTranslations } from "next-intl";

import type { Category, Image, Menu, MenuItem, Restaurant } from "@prisma/client";

import { Black, White } from "src/styles/theme";
import { useSmartTVNavigation } from "src/hooks/useSmartTVNavigation";
import { getInitialMenuSelection } from "src/utils/detectSmartTV";

import { MenuItemCard } from "./MenuItemCard";
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
    },
    carousalTitleText: {
        fontSize: "2.5rem", // 40px base, scales automatically with viewport
        fontWeight: "bold",
        [`@media (max-width: ${theme.breakpoints.lg})`]: { fontSize: "1.875rem" }, // 30px
        [`@media (max-width: ${theme.breakpoints.sm})`]: { fontSize: "1.5rem" }, // 24px
    },
    darkFontColor: { color: theme.colors.dark[7] },
    headerImageBox: {
        aspectRatio: "3",
        borderRadius: theme.radius.lg,
        overflow: "hidden",
        position: "relative",
        [theme.fn.smallerThan("md")]: { aspectRatio: "2.5" },
        [theme.fn.smallerThan("sm")]: { aspectRatio: "2" },
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
    const bannerCarousalRef = useRef(Autoplay({ delay: 5000 }));
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();
    const [menuParent] = useAutoAnimate<HTMLDivElement>();

    // Smart TV detection: Auto-select "Room*" menu if accessing from TV
    const initialMenu = useMemo(
        () => getInitialMenuSelection(restaurant?.menus || [], restaurant?.menus?.[0]?.id),
        [restaurant?.menus]
    );
    const [selectedMenu, setSelectedMenu] = useState<string | null | undefined>(initialMenu);

    const router = useRouter();
    const language = (router.query?.lang as string) || "PT";
    const t = useTranslations("menu");

    // Extract uiTranslations from first menu item (all items share same UI translations)
    const uiTranslations = useMemo(() => {
        const firstItem = restaurant?.menus?.[0]?.categories?.[0]?.items?.[0];
        return (firstItem as any)?.uiTranslations || { remoteShortcuts: t("remoteShortcuts") };
    }, [restaurant?.menus, t]);

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

    // Keyboard shortcuts for language switching (Smart TV remote control)
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
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
        () => restaurant?.menus?.find((item) => item.id === selectedMenu),
        [selectedMenu, restaurant]
    );

    const images: Image[] = useMemo(() => {
        const banners = restaurant?.banners;
        if (restaurant?.image) {
            return [restaurant?.image, ...banners];
        }
        return banners;
    }, [restaurant]);

    const haveMenuItems = menuDetails?.categories?.some((category) => category?.items?.length > 0);

    // Smart TV remote control navigation
    const menuIds = useMemo(() => restaurant?.menus?.map(m => m.id) || [], [restaurant]);
    useSmartTVNavigation({
        currentMenuId: selectedMenu,
        menuIds,
        onMenuChange: setSelectedMenu,
        enabled: true,
    });

    return (
        <Box mih="calc(100vh - 100px)">
            <Box pos="relative">
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
                            📱 Remote Control Shortcuts:
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
                <Tabs.List>
                    {restaurant?.menus?.map((menu) => (
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
                            <Text color={theme.black} size="lg" translate="no" weight={selectedMenu === menu.id ? "bold" : "normal"}>
                                {(menu as any).isFestive ? `🎄 ${menu.name}` : menu.name}
                            </Text>
                            <Text color={theme.colors.dark[8]} opacity={selectedMenu === menu.id ? 1 : 0.5} size="xs" translate="yes">
                                {menu.availableTime}
                            </Text>
                        </Tabs.Tab>
                    ))}
                </Tabs.List>
            </Tabs>
            {menuDetails && (
                <Stack spacing="xs" mb="lg">
                    {(menuDetails as any).reservations && (
                        <Flex align="center" gap={8}>
                            <IconCalendar size={16} color={theme.colors.primary[6]} />
                            <a href={(menuDetails as any).reservations} rel="noopener noreferrer" target="_blank" style={{ textDecoration: 'underline' }}>
                                <Text size="sm" translate="yes" weight={600} color={theme.colors.primary[6]}>{t("reservations")}</Text>
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
            <Box ref={menuParent}>
                {menuDetails?.categories
                    ?.filter((category) => category?.items.length)
                    ?.map((category) => (
                        <Box key={category.id}>
                            <Text my="lg" size="lg" translate="no" weight={600}>
                                {category.name}
                            </Text>
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
                {restaurant?.menus?.length === 0 && !haveMenuItems && (
                    <Empty height={400} text={t("noMenusForVenue")} />
                )}
                {!!restaurant?.menus?.length && !haveMenuItems && <Empty height={400} text={t("noItemsForMenu")} />}
            </Box>
        </Box>
    );
};
