import type { NextApiRequest, NextApiResponse } from "next";

import { prisma } from "src/server/db";
import { requireApiKey, toImageUrl } from "src/server/api/rest/auth";

/**
 * GET /api/v1/venues
 *
 * Returns a list of all venues with basic information.
 *
 * Authentication: Authorization: Bearer <PUBLIC_API_KEY>
 */
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (!requireApiKey(req, res)) return;

    const venues = await prisma.restaurant.findMany({
        include: { image: true },
        orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
        data: venues.map((v) => ({
            id: v.id,
            name: v.name,
            location: v.location,
            contactNo: v.contactNo,
            isPublished: v.isPublished,
            imageUrl: toImageUrl(v.image?.path),
            createdAt: v.createdAt,
            updatedAt: v.updatedAt,
        })),
    });
};

export default handler;
