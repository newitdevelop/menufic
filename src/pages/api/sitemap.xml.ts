import type { NextApiRequest, NextApiResponse } from "next";

import { env } from "src/env/client.mjs";
import { prisma } from "src/server/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const prodUrl = env.NEXT_PUBLIC_PROD_URL || "https://menufic.com";

    // Fetch all published venues dynamically
    const publishedVenues = await prisma.restaurant.findMany({
        where: { isPublished: true },
        select: { id: true, updatedAt: true },
    });

    // Build venue URLs
    const venueUrls = publishedVenues
        .map(
            (venue) => `  <url>
    <loc>${prodUrl}/venue/${venue.id}/menu</loc>
    <lastmod>${venue.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
        )
        .join("\n");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${prodUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${prodUrl}/privacy-policy</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${prodUrl}/terms-and-conditions</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
${venueUrls}
</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(sitemap);
}
