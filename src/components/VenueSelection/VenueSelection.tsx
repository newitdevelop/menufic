import { Card, Container, Grid, Group, Image, Stack, Text, Title, Badge, Loader, Center, Box } from "@mantine/core";
import { IconMapPin, IconPhone, IconExternalLink } from "@tabler/icons";
import Link from "next/link";
import { api } from "src/utils/api";

export default function VenueSelection() {
    const { data: restaurants, isLoading } = api.restaurant.getAllPublished.useQuery();

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
                paddingTop: theme.spacing.xl * 3,
                paddingBottom: theme.spacing.xl * 3,
            })}
        >
            <Container size="xl">
                <Stack spacing={50}>
                    <Stack align="center" spacing="md">
                        <Title
                            order={1}
                            size={48}
                            weight={700}
                            align="center"
                            sx={(theme) => ({
                                color: theme.colors.dark[9],
                                letterSpacing: "-0.02em",
                            })}
                        >
                            Select Your Venue
                        </Title>
                        <Text
                            size="xl"
                            color="dimmed"
                            align="center"
                            sx={{ maxWidth: 600 }}
                        >
                            Explore our collection of dining venues and discover their menus
                        </Text>
                    </Stack>

                    <Grid gutter={30}>
                        {restaurants.map((restaurant) => {
                            const imageUrl = restaurant.image
                                ? `https://ik.imagekit.io/menufic/${restaurant.image.path}`
                                : "/placeholder-restaurant.jpg";

                            return (
                                <Grid.Col key={restaurant.id} xs={12} sm={6} md={4}>
                                    <Link
                                        href={`/venue/${restaurant.id}/menu`}
                                        style={{ textDecoration: "none" }}
                                    >
                                        <Card
                                            shadow="md"
                                            radius="lg"
                                            sx={(theme) => ({
                                                height: "100%",
                                                cursor: "pointer",
                                                transition: "all 0.3s ease",
                                                "&:hover": {
                                                    transform: "translateY(-8px)",
                                                    boxShadow: theme.shadows.xl,
                                                },
                                            })}
                                        >
                                            <Card.Section>
                                                <Box sx={{ position: "relative", paddingTop: "66.67%", overflow: "hidden" }}>
                                                    <Image
                                                        src={imageUrl}
                                                        alt={restaurant.name}
                                                        fit="cover"
                                                        sx={{
                                                            position: "absolute",
                                                            top: 0,
                                                            left: 0,
                                                            width: "100%",
                                                            height: "100%",
                                                        }}
                                                    />
                                                </Box>
                                            </Card.Section>

                                            <Stack spacing="md" mt="md" p="md">
                                                <Group position="apart" align="flex-start">
                                                    <Title
                                                        order={3}
                                                        size={22}
                                                        weight={600}
                                                        sx={(theme) => ({
                                                            color: theme.colors.dark[7],
                                                            lineHeight: 1.3,
                                                        })}
                                                    >
                                                        {restaurant.name}
                                                    </Title>
                                                    <Badge
                                                        color="blue"
                                                        variant="light"
                                                        size="sm"
                                                        leftSection={<IconExternalLink size={12} />}
                                                    >
                                                        View Menu
                                                    </Badge>
                                                </Group>

                                                {restaurant.location && (
                                                    <Group spacing="xs" noWrap>
                                                        <IconMapPin size={18} color="gray" />
                                                        <Text
                                                            size="sm"
                                                            color="dimmed"
                                                            sx={{ flex: 1 }}
                                                        >
                                                            {restaurant.location}
                                                        </Text>
                                                    </Group>
                                                )}

                                                {restaurant.contactNo && (
                                                    <Group spacing="xs" noWrap>
                                                        <IconPhone size={18} color="gray" />
                                                        <Text
                                                            size="sm"
                                                            color="dimmed"
                                                            sx={{ flex: 1 }}
                                                        >
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
}
