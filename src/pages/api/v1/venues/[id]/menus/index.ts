import type { NextApiRequest, NextApiResponse } from "next";

import { prisma } from "src/server/db";
import { requireApiKey } from "src/server/api/rest/auth";

/**
 * GET /api/v1/venues/:id/menus
 *
 * Returns the list of menus for a venue (without category/item detail).
 * Use GET /api/v1/venues/:id/menus/:menuId to fetch a specific menu with full detail.
 *
 * Authentication: Authorization: Bearer <PUBLIC_API_KEY>
 */
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (!requireApiKey(req, res)) return;

    const { id: venueId } = req.query;
    if (!venueId || typeof venueId !== "string") {
        return res.status(400).json({ error: "Invalid venue ID" });
    }

    const venue = await prisma.restaurant.findFirst({
        select: { id: true },
        where: { id: venueId },
    });

    if (!venue) {
        return res.status(404).json({ error: "Venue not found" });
    }

    const menus = await prisma.menu.findMany({
        orderBy: { position: "asc" },
        select: {
            id: true,
            name: true,
            menuType: true,
            availableTime: true,
            isFestive: true,
            isActive: true,
            externalUrl: true,
            reservationType: true,
            reservationUrl: true,
            scheduleType: true,
            createdAt: true,
            updatedAt: true,
        },
        where: { restaurantId: venueId },
    });

    return res.status(200).json({
        data: menus,
    });
};

export default handler;
