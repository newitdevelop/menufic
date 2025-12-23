import { Container } from "@mantine/core";
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

/** Restaurant menu page that will be shared publicly */
const RestaurantMenuPage: NextPage<{ restaurantId?: string }> = ({ restaurantId: restaurantIdProp }) => {
    const router = useRouter();
    const restaurantId = (restaurantIdProp || router.query?.restaurantId) as string;
    const language = (router.query?.lang as string) || "EN";
    const t = useTranslations("menu");

    const { data: restaurant, error, isLoading } = (api.restaurant as any).getDetails.useQuery(
        { id: restaurantId, language },
        { enabled: !!restaurantId }
    );

    // Debug logging
    if (error) {
        console.error("Restaurant query error:", error);
    }

    return (
        <>
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
                <Container py="lg" size="xl">
                    {(() => {
                        if (isLoading) {
                            return <Empty height="calc(100vh - 100px)" text="Loading..." />;
                        }
                        if (restaurant && restaurant?.isPublished === true) {
                            return <RestaurantMenu restaurant={restaurant} />;
                        }
                        return <Empty height="calc(100vh - 100px)" text={t("noDetailsAvailable")} />;
                    })()}
                </Container>
            </main>
            <Footer />
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
    const messages = (await import("src/lang/en.json")).default;
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
