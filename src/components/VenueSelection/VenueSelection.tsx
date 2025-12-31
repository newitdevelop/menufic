import type { FC } from "react";
import { useState } from "react";

import { Badge, Box, Card, Center, Container, Grid, Group, Loader, Stack, Text, Title } from "@mantine/core";
import { IconExternalLink, IconMapPin, IconPhone } from "@tabler/icons";
import Link from "next/link";

import { api } from "src/utils/api";
import { ImageKitImage } from "../ImageKitImage";
import { LanguageSelector } from "../LanguageSelector";

export const VenueSelection: FC = () => {
    const { data: restaurants, isLoading } = api.restaurant.getAllPublished.useQuery();
    const [language, setLanguage] = useState<string>("PT");

    if (isLoading) {
        return (
            <Container size="xl" py={80}>
                <Center style={{ minHeight: 400 }}>
                    <Loader size="lg" />
                </Center>
            </Container>
        );
    }

    if (!restaurants || restaurants.length === 0) {
        return (
            <Container size="xl" py={80}>
                <Center style={{ minHeight: 400 }}>
                    <Stack align="center" spacing="md">
                        <Text size="xl" color="dimmed">
                            No venues available at the moment
                        </Text>
                    </Stack>
                </Center>
            </Container>
        );
    }

    return (
        <Box
            sx={(theme) => ({
                background: `linear-gradient(135deg, ${theme.colors.gray[0]} 0%, ${theme.colors.blue[0]} 100%)`,
                minHeight: "calc(100vh - 120px)",
                paddingBottom: theme.spacing.xl * 3,
                paddingTop: theme.spacing.xl * 3,
            })}
        >
            <Container size="xl">
                <Box
                    sx={{
                        position: "absolute",
                        right: 24,
                        top: 80,
                        zIndex: 10,
                    }}
                >
                    <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} />
                </Box>
                <Stack spacing={50}>
                    <Stack align="center" spacing="md">
                        <Title
                            align="center"
                            order={1}
                            size={48}
                            sx={(theme) => ({
                                color: theme.colors.dark[9],
                                letterSpacing: "-0.02em",
                            })}
                            weight={700}
                        >
                            Select Your Venue
                        </Title>
                        <Text align="center" color="dimmed" size="xl" sx={{ maxWidth: 600 }}>
                            Explore our collection of venues and discover their menus
                        </Text>
                    </Stack>

                    <Grid gutter={30}>
                        {restaurants.map((restaurant) => {
                            return (
                                <Grid.Col key={restaurant.id} xs={12} sm={6} md={4}>
                                    <Link
                                        href={`/venue/${restaurant.id}/menu`}
                                        style={{ textDecoration: "none" }}
                                    >
                                        <Card
                                            radius="lg"
                                            shadow="md"
                                            sx={(theme) => ({
                                                "&:hover": {
                                                    boxShadow: theme.shadows.xl,
                                                    transform: "translateY(-8px)",
                                                },
                                                cursor: "pointer",
                                                height: "100%",
                                                transition: "all 0.3s ease",
                                            })}
                                        >
                                            <Card.Section>
                                                <Box
                                                    sx={{
                                                        aspectRatio: "3 / 2",
                                                        overflow: "hidden",
                                                        position: "relative",
                                                    }}
                                                >
                                                    {restaurant.image ? (
                                                        <ImageKitImage
                                                            blurhash={restaurant.image.blurHash}
                                                            color={restaurant.image.color}
                                                            height={400}
                                                            imageAlt={restaurant.name}
                                                            imagePath={restaurant.image.path}
                                                            width={600}
                                                        />
                                                    ) : (
                                                        <Box
                                                            sx={(theme) => ({
                                                                alignItems: "center",
                                                                backgroundColor: theme.colors.gray[1],
                                                                display: "flex",
                                                                height: "100%",
                                                                justifyContent: "center",
                                                                width: "100%",
                                                            })}
                                                        >
                                                            <Text color="dimmed" size="sm">
                                                                No Image
                                                            </Text>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Card.Section>

                                            <Stack mt="md" p="md" spacing="md">
                                                <Group align="flex-start" position="apart">
                                                    <Title
                                                        order={3}
                                                        size={22}
                                                        sx={(theme) => ({
                                                            color: theme.colors.dark[7],
                                                            lineHeight: 1.3,
                                                        })}
                                                        weight={600}
                                                    >
                                                        {restaurant.name}
                                                    </Title>
                                                    <Badge
                                                        color="blue"
                                                        leftSection={<IconExternalLink size={12} />}
                                                        size="sm"
                                                        variant="light"
                                                    >
                                                        View Menu
                                                    </Badge>
                                                </Group>

                                                {restaurant.location && (
                                                    <Group noWrap spacing="xs">
                                                        <IconMapPin color="gray" size={18} />
                                                        <Text color="dimmed" size="sm" sx={{ flex: 1 }}>
                                                            {restaurant.location}
                                                        </Text>
                                                    </Group>
                                                )}

                                                {restaurant.contactNo && (
                                                    <Group noWrap spacing="xs">
                                                        <IconPhone color="gray" size={18} />
                                                        <Text color="dimmed" size="sm" sx={{ flex: 1 }}>
                                                            {restaurant.contactNo}
                                                        </Text>
                                                    </Group>
                                                )}
                                            </Stack>
                                        </Card>
                                    </Link>
                                </Grid.Col>
                            );
                        })}
                    </Grid>
                </Stack>
            </Container>
        </Box>
    );
};

export default VenueSelection;
