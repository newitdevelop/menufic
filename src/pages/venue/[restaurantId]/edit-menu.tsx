import { useState } from "react";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Box, Breadcrumbs, Center, Grid, Loader, SimpleGrid, Tabs, Text } from "@mantine/core";
import { type NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import { NextSeo } from "next-seo";

import type { Menu } from "@prisma/client";

import { AppShell } from "src/components/AppShell";
import { Categories } from "src/components/EditMenu/Categories";
import { Packs } from "src/components/EditMenu/Packs";
import { Menus } from "src/components/EditMenu/Menus";
import { PublishButton } from "src/components/PublishButton";
import { api } from "src/utils/api";
import { loadTranslations } from "src/utils/loadTranslations";
import { showErrorToast } from "src/utils/helpers";

/** Page to manage all the menus and related items of a selected restaurant */
const EditMenuPage: NextPage = () => {
    const router = useRouter();
    const [selectedMenu, setSelectedMenu] = useState<Menu | undefined>();
    const [activeTab, setActiveTab] = useState<string | null>("categories");
    const [gridItemParent] = useAutoAnimate<HTMLDivElement>();
    const [rootParent] = useAutoAnimate<HTMLDivElement>();
    const restaurantId = router.query?.restaurantId as string;
    const t = useTranslations("dashboard.editMenu");
    const tRestaurant = useTranslations("dashboard.venueManage");

    const { data: restaurant, isLoading } = api.restaurant.get.useQuery(
        { id: restaurantId },
        {
            enabled: !!restaurantId,
            onError: () => {
                showErrorToast(tRestaurant("venueFetchError"));
                router.push("/venue");
            },
        }
    );

    return (
        <>
            <NextSeo description={t("seoDescription")} title={t("seoTitle")} />
            <main>
                <AppShell>
                    <Box ref={rootParent}>
                        {isLoading ? (
                            <Center h="50vh" w="100%">
                                <Loader size="lg" />
                            </Center>
                        ) : (
                            <>
                                <SimpleGrid
                                    breakpoints={[
                                        { cols: 2, minWidth: "sm" },
                                        { cols: 1, minWidth: "xs" },
                                    ]}
                                >
                                    <Breadcrumbs>
                                        <Link href="/venue">{tRestaurant("breadcrumb")}</Link>
                                        <Link href={`/venue/${restaurant?.id}`}>{restaurant?.name}</Link>
                                        <Text>{t("breadcrumb")}</Text>
                                    </Breadcrumbs>
                                    {restaurant && <PublishButton restaurant={restaurant} />}
                                </SimpleGrid>
                                <Grid gutter="lg" justify="center" mt="xl" ref={gridItemParent}>
                                    <Grid.Col lg={3} md={4} sm={12}>
                                        {router.query?.restaurantId && (
                                            <Menus
                                                restaurantId={restaurantId}
                                                selectedMenu={selectedMenu}
                                                setSelectedMenu={setSelectedMenu}
                                            />
                                        )}
                                    </Grid.Col>
                                    {selectedMenu && (
                                        <Grid.Col lg={9} md={8} sm={12}>
                                            <Tabs value={activeTab} onTabChange={setActiveTab}>
                                                <Tabs.List>
                                                    <Tabs.Tab value="categories">{t("categoriesTab")}</Tabs.Tab>
                                                    <Tabs.Tab value="packs">{t("packsTab")}</Tabs.Tab>
                                                </Tabs.List>

                                                <Tabs.Panel value="categories" pt="md">
                                                    <Categories menuId={selectedMenu?.id} />
                                                </Tabs.Panel>

                                                <Tabs.Panel value="packs" pt="md">
                                                    <Packs menuId={selectedMenu?.id} />
                                                </Tabs.Panel>
                                            </Tabs>
                                        </Grid.Col>
                                    )}
                                </Grid>
                            </>
                        )}
                    </Box>
                </AppShell>
            </main>
        </>
    );
};

export const getStaticProps = async () => ({ props: { messages: await loadTranslations("en") } });

export const getStaticPaths = async () => ({ fallback: "blocking", paths: [] });

export default EditMenuPage;
