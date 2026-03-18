import type { NextApiRequest, NextApiResponse } from "next";

import { prisma } from "src/server/db";
import { requireApiKey, toImageUrl } from "src/server/api/rest/auth";
import { formatMenuSchedule } from "src/server/api/rest/schedule";

/**
 * GET /api/v1/venues/:id
 *
 * Returns full venue details: venue info, all menus with their categories and items.
 *
 * Authentication: Authorization: Bearer <PUBLIC_API_KEY>
 */
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (!requireApiKey(req, res)) return;

    const { id } = req.query;
    if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Invalid venue ID" });
    }

    const venue = await prisma.restaurant.findFirst({
        include: {
            banners: true,
            image: true,
            menus: {
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
                },
                orderBy: { position: "asc" },
                where: { isActive: true },
            },
        },
        where: { id },
    });

    if (!venue) {
        return res.status(404).json({ error: "Venue not found" });
    }

    return res.status(200).json({
        data: {
            id: venue.id,
            name: venue.name,
            location: venue.location,
            contactNo: venue.contactNo,
            isPublished: venue.isPublished,
            imageUrl: toImageUrl(venue.image?.path),
            createdAt: venue.createdAt,
            updatedAt: venue.updatedAt,
            banners: venue.banners.map((banner) => ({
                id: banner.id,
                imageUrl: toImageUrl(banner.path),
                notifyGuests: (banner as any).notifyGuests ?? false,
                guestMessage: (banner as any).guestMessage ?? null,
                expiryDate: (banner as any).expiryDate ?? null,
                ...formatMenuSchedule(banner as any),
            })),
            menus: venue.menus.map((menu) => ({
                id: menu.id,
                name: menu.name,
                menuType: menu.menuType,
                availableTime: menu.availableTime,
                isFestive: menu.isFestive,
                externalUrl: menu.externalUrl,
                reservationType: menu.reservationType,
                reservationUrl: menu.reservationUrl,
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
            })),
        },
    });
};

export default handler;
