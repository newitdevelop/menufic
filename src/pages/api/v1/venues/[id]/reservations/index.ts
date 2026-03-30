import type { NextApiRequest, NextApiResponse } from "next";

import { prisma } from "src/server/db";
import { requireApiKey } from "src/server/api/rest/auth";

/**
 * GET /api/v1/venues/:id/reservations
 *
 * Returns all reservation submissions for a venue.
 *
 * Authentication: Authorization: Bearer <PUBLIC_API_KEY>
 *
 * Query parameters:
 *   from  - ISO date string (inclusive), e.g. 2026-01-01
 *   to    - ISO date string (inclusive), e.g. 2026-12-31
 *   menuId - filter by specific menu ID (optional)
 */
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (!requireApiKey(req, res)) return;

    const { id: venueId, from, to, menuId } = req.query;

    if (!venueId || typeof venueId !== "string") {
        return res.status(400).json({ error: "Invalid venue ID" });
    }

    // Build date filter
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (from && typeof from === "string") {
        const fromDate = new Date(from);
        if (isNaN(fromDate.getTime())) {
            return res.status(400).json({ error: "Invalid 'from' date — use ISO format e.g. 2026-01-01" });
        }
        fromDate.setHours(0, 0, 0, 0);
        dateFilter.gte = fromDate;
    }
    if (to && typeof to === "string") {
        const toDate = new Date(to);
        if (isNaN(toDate.getTime())) {
            return res.status(400).json({ error: "Invalid 'to' date — use ISO format e.g. 2026-12-31" });
        }
        toDate.setHours(23, 59, 59, 999);
        dateFilter.lte = toDate;
    }

    const reservations = await prisma.reservation.findMany({
        where: {
            restaurantId: venueId,
            ...(menuId && typeof menuId === "string" ? { menuId } : {}),
            ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
        },
        orderBy: { date: "asc" },
    });

    return res.status(200).json({
        data: reservations.map((r) => ({
            id: r.id,
            createdAt: r.createdAt,
            menuId: r.menuId,
            menuName: r.menuName,
            venueId: r.restaurantId,
            venueName: r.restaurantName,
            serviceNames: r.serviceNames,
            date: r.date,
            time: r.time,
            partySize: r.partySize,
            email: r.email,
            phone: r.phone,
            contactPreference: r.contactPreference,
            marketingConsent: r.marketingConsent,
        })),
        total: reservations.length,
    });
};

export default handler;
