import { useEffect, useState } from "react";

import { Container, Global } from "@mantine/core";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import { NextSeo } from "next-seo";
import superjson from "superjson";

import type { GetStaticPropsContext, NextPage } from "next";

import { Empty } from "src/components/Empty";
import { Footer } from "src/components/Footer";
import { RestaurantMenu } from "src/components/RestaurantMenu";
import { env } from "src/env/client.mjs";
import { appRouter } from "src/server/api/root";
import { createInnerTRPCContext } from "src/server/api/trpc";
import { api } from "src/utils/api";
import { loadTranslations } from "src/utils/loadTranslations";

/** Restaurant menu page that will be shared publicly */
const RestaurantMenuPage: NextPage<{ restaurantId?: string }> = ({ restaurantId: restaurantIdProp }) => {
    const router = useRouter();
    const restaurantId = (restaurantIdProp || router.query?.restaurantId) as string;
    const language = (router.query?.lang as string) || "PT";
    const t = useTranslations("menu");

    // Loading timeout for older browsers (Hisense TV)
    const [loadingTimeout, setLoadingTimeout] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const { data: restaurant, error, isLoading, refetch } = (api.restaurant as any).getDetails.useQuery(
        { id: restaurantId, language },
        {
            enabled: !!restaurantId,
            retry: 3,
            retryDelay: 1000,
            staleTime: 30000, // 30 seconds
        }
    );

    // Set timeout for loading state (20 seconds)
    useEffect(() => {
        if (isLoading) {
            const timer = setTimeout(() => {
                setLoadingTimeout(true);
            }, 20000);
            return () => clearTimeout(timer);
        } else {
            setLoadingTimeout(false);
        }
    }, [isLoading]);

    // Debug logging
    if (error) {
        console.error("Restaurant query error:", error);
    }

    // Handle retry after timeout
    const handleRetry = () => {
        setLoadingTimeout(false);
        setRetryCount(prev => prev + 1);
        refetch();
    };

    return (
        <>
            <Global
                styles={{
                    /* Smart TV CSS optimizations - only apply to main content, not modals */
                    'main, footer': {
                        /* Hardware acceleration for Samsung Tizen and LG WebOS */
                        WebkitBackfaceVisibility: 'hidden',
                        MozBackfaceVisibility: 'hidden',
                        backfaceVisibility: 'hidden',
                        /* Force GPU acceleration for smoother rendering */
                        WebkitTransform: 'translateZ(0)',
                        MozTransform: 'translateZ(0)',
                        transform: 'translateZ(0)',
                    },
                    /* Reduce memory usage on older TVs */
                    '@media (min-width: 1440px)': {
                        'main, footer': {
                            /* Disable blur effects on TVs (heavy on GPU) */
                            backdropFilter: 'none !important',
                            WebkitBackdropFilter: 'none !important',
                        },
                    },
                    /* Print styles for A4 layout */
                    '@media print': {
                        '@page': {
                            size: 'A4',
                            margin: '1.5cm',
                        },
                        'body': {
                            margin: 0,
                            padding: 0,
                            backgroundColor: 'white !important',
                        },
                        /* Hide UI elements but keep content images */
                        '.no-print, footer, header, nav, .mantine-Tabs-root, .mantine-Tabs-tabsList, .mantine-Tabs-panel[hidden], .mantine-LanguageSelector-root': {
                            display: 'none !important',
                        },
                        /* Hide banner/carousel images only */
                        '.mantine-Carousel-root, .embla__container': {
                            display: 'none !important',
                        },
                        /* Show print-only elements */
                        '.print-only': {
                            display: 'block !important',
                        },
                        '.print-content': {
                            pageBreakBefore: 'auto',
                            pageBreakAfter: 'auto',
                        },
                        '.print-content > *': {
                            pageBreakInside: 'avoid',
                        },
                        'h1, h2, h3, h4, h5, h6': {
                            pageBreakAfter: 'avoid',
                        },
                        /* Style content images (menu items, packs) */
                        'img': {
                            maxWidth: '100% !important',
                            height: 'auto !important',
                            pageBreakInside: 'avoid',
                        },
                        /* Ensure good contrast for printing */
                        'body, p, span, div': {
                            color: '#000 !important',
                        },
                        /* Remove shadows and effects for print */
                        '*': {
                            boxShadow: 'none !important',
                            textShadow: 'none !important',
                        },
                    },
                }}
            />
            <NextSeo
                description={`${t("seoDescription.venueName", { name: restaurant?.name })}. ${t(
                    "seoDescription.venueLocation",
                    { location: restaurant?.location }
                )}${
                    restaurant?.contactNo
                        ? t("seoDescription.venueContactNo", { contactNo: restaurant?.contactNo })
                        : ""
                } ${t("seoDescription.menufic")}`}
                openGraph={{
                    images: [{ url: `${env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/${restaurant?.image?.path}` }],
                    type: "restaurant.menu",
                }}
                themeColor={restaurant?.image?.color}
                title={t("seoTitle", { name: restaurant?.name })}
            />
            <main>
                <Container py="lg" size="xl" sx={{ maxWidth: "100%", "@media (min-width: 90em)": { padding: "1rem 2rem" } }}>
                    {(() => {
                        // Show timeout message if loading takes too long
                        if (loadingTimeout) {
                            return (
                                <Empty
                                    height="calc(100vh - 100px)"
                                    text={
                                        <>
                                            {t("loadingTooLong")}
                                            <br />
                                            <button
                                                onClick={handleRetry}
                                                type="button"
                                                style={{
                                                    marginTop: "1rem",
                                                    padding: "0.5rem 1rem",
                                                    fontSize: "1rem",
                                                    cursor: "pointer",
                                                    borderRadius: "4px",
                                                    border: "1px solid #ccc",
                                                    background: "#fff"
                                                }}
                                            >
                                                {t("retry")} {retryCount > 0 ? `(${retryCount})` : ""}
                                            </button>
                                        </>
                                    }
                                />
                            );
                        }
                        if (isLoading) {
                            return <Empty height="calc(100vh - 100px)" text={t("loading")} />;
                        }
                        if (error) {
                            return (
                                <Empty
                                    height="calc(100vh - 100px)"
                                    text={
                                        <>
                                            {t("errorLoading")}
                                            <br />
                                            <button
                                                onClick={handleRetry}
                                                type="button"
                                                style={{
                                                    marginTop: "1rem",
                                                    padding: "0.5rem 1rem",
                                                    fontSize: "1rem",
                                                    cursor: "pointer",
                                                    borderRadius: "4px",
                                                    border: "1px solid #ccc",
                                                    background: "#fff"
                                                }}
                                            >
                                                {t("retry")}
                                            </button>
                                        </>
                                    }
                                />
                            );
                        }
                        if (restaurant && restaurant?.isPublished === true) {
                            return <RestaurantMenu restaurant={restaurant} />;
                        }
                        return <Empty height="calc(100vh - 100px)" text={t("noDetailsAvailable")} />;
                    })()}
                </Container>
            </main>
            <Footer restaurant={restaurant} />
        </>
    );
};

export async function getStaticProps(context: GetStaticPropsContext<{ restaurantId: string }>) {
    const ssg = createProxySSGHelpers({
        ctx: createInnerTRPCContext({ session: null }),
        router: appRouter,
        transformer: superjson,
    });
    const restaurantId = context.params?.restaurantId as string;
    const messages = await loadTranslations("en");
    try {
        const restaurant = await (ssg.restaurant as any).getDetails.fetch({ id: restaurantId });
        if (restaurant.isPublished) {
            // Only return restaurants that are published
            return { props: { messages, restaurantId, trpcState: ssg.dehydrate() }, revalidate: 1800 }; // revalidate in 30 mins
        }
        return { props: { messages, restaurantId }, revalidate: 60 };
    } catch {
        return { props: { messages, restaurantId }, revalidate: 1800 };
    }
}

export const getStaticPaths = async () => ({ fallback: "blocking", paths: [] });

export default RestaurantMenuPage;
