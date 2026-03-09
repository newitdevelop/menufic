import type { NextApiRequest, NextApiResponse } from "next";

import { prisma } from "src/server/db";
import { requireApiKey, toImageUrl } from "src/server/api/rest/auth";
import { formatMenuSchedule } from "src/server/api/rest/schedule";

/**
 * GET /api/v1/venues/:id/menus/:menuId
 *
 * Returns a single menu with its categories and items.
 *
 * Authentication: Authorization: Bearer <PUBLIC_API_KEY>
 */
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (!requireApiKey(req, res)) return;

    const { id: venueId, menuId } = req.query;
    if (!venueId || typeof venueId !== "string") {
        return res.status(400).json({ error: "Invalid venue ID" });
    }
    if (!menuId || typeof menuId !== "string") {
        return res.status(400).json({ error: "Invalid menu ID" });
    }

    const menu = await prisma.menu.findFirst({
        include: {
            categories: {
                include: {
                    items: {
                        include: { image: true },
                        orderBy: { position: "asc" },
                    },
                },
                orderBy: { position: "asc" },
            },
            restaurant: { select: { id: true, name: true } },
        },
        where: { id: menuId, restaurantId: venueId },
    });

    if (!menu) {
        return res.status(404).json({ error: "Menu not found" });
    }

    return res.status(200).json({
        data: {
            id: menu.id,
            name: menu.name,
            menuType: menu.menuType,
            availableTime: menu.availableTime,
            isFestive: menu.isFestive,
            isActive: menu.isActive,
            externalUrl: menu.externalUrl,
            reservationType: menu.reservationType,
            reservationUrl: menu.reservationUrl,
            venueId: menu.restaurantId,
            venueName: menu.restaurant?.name ?? null,
            createdAt: menu.createdAt,
            updatedAt: menu.updatedAt,
            ...formatMenuSchedule(menu),
            categories: menu.categories.map((cat) => ({
                id: cat.id,
                name: cat.name,
                createdAt: cat.createdAt,
                updatedAt: cat.updatedAt,
                items: cat.items.map((item) => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    currency: item.currency,
                    vatRate: item.vatRate,
                    vatIncluded: item.vatIncluded,
                    allergens: item.allergens,
                    bomId: (item as any).bomId ?? null,
                    isEdible: (item as any).isEdible ?? null,
                    imageUrl: toImageUrl(item.image?.path),
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                })),
            })),
        },
    });
};

export default handler;
