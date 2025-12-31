import type { FC } from "react";

import { Badge, Box, Card, Center, Container, Grid, Group, Image, Loader, Stack, Text, Title } from "@mantine/core";
import { IconExternalLink, IconMapPin, IconPhone } from "@tabler/icons";
import Link from "next/link";

import { api } from "src/utils/api";

export const VenueSelection: FC = () => {
    const { data: restaurants, isLoading } = api.restaurant.getAllPublished.useQuery();

    // Debug logging
    console.log("Restaurants data:", restaurants);

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
                            Explore our collection of dining venues and discover their menus
                        </Text>
                    </Stack>

                    <Grid gutter={30}>
                        {restaurants.map((restaurant) => {
                            const imageUrl = restaurant.image?.path
                                ? `https://ik.imagekit.io/menufic/${restaurant.image.path}`
                                : null;

                            console.log(`Restaurant: ${restaurant.name}, Image path: ${restaurant.image?.path}, Full URL: ${imageUrl}`);

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
                                                        overflow: "hidden",
                                                        paddingTop: "66.67%",
                                                        position: "relative",
                                                    }}
                                                >
                                                    {imageUrl ? (
                                                        <Image
                                                            alt={restaurant.name}
                                                            fit="cover"
                                                            src={imageUrl}
                                                            sx={{
                                                                height: "100%",
                                                                left: 0,
                                                                position: "absolute",
                                                                top: 0,
                                                                width: "100%",
                                                            }}
                                                            withPlaceholder
                                                        />
                                                    ) : (
                                                        <Box
                                                            sx={(theme) => ({
                                                                alignItems: "center",
                                                                backgroundColor: theme.colors.gray[1],
                                                                display: "flex",
                                                                height: "100%",
                                                                justifyContent: "center",
                                                                left: 0,
                                                                position: "absolute",
                                                                top: 0,
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
