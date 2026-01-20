import type { NextApiRequest, NextApiResponse } from "next";

import { prisma } from "src/server/db";

/**
 * Cron endpoint to clean up old PageView records and aggregate into DailyStats.
 *
 * Security: Requires CRON_SECRET environment variable to be set and passed as
 * Authorization header or ?secret= query parameter.
 *
 * Usage:
 * - External cron service: GET /api/cron/cleanup-analytics?secret=YOUR_SECRET
 * - curl: curl -H "Authorization: Bearer YOUR_SECRET" https://your-domain/api/cron/cleanup-analytics
 *
 * Query parameters:
 * - retentionDays: Number of days to keep detailed PageView records (default: 30)
 */
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    // Only allow GET and POST
    if (req.method !== "GET" && req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Verify cron secret
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        console.error("CRON_SECRET environment variable not set");
        return res.status(500).json({ error: "Cron not configured" });
    }

    // Check authorization (header or query parameter)
    const authHeader = req.headers.authorization;
    const querySecret = req.query.secret as string | undefined;

    const providedSecret = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : querySecret;

    if (providedSecret !== cronSecret) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    // Parse retention days from query (default: 30)
    const retentionDays = parseInt(req.query.retentionDays as string) || 30;
    if (retentionDays < 1 || retentionDays > 365) {
        return res.status(400).json({ error: "retentionDays must be between 1 and 365" });
    }

    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        cutoffDate.setHours(0, 0, 0, 0);

        // Get all restaurants with old page views
        const restaurantsWithOldViews = await prisma.pageView.groupBy({
            by: ["restaurantId"],
            where: {
                createdAt: { lt: cutoffDate },
            },
        });

        let totalAggregated = 0;
        let totalDeleted = 0;
        const results: Array<{ restaurantId: string; aggregated: number; deleted: number }> = [];

        for (const { restaurantId } of restaurantsWithOldViews) {
            // Get old page views for this restaurant
            const oldPageViews = await prisma.pageView.findMany({
                where: {
                    restaurantId,
                    createdAt: { lt: cutoffDate },
                },
                select: {
                    ip: true,
                    country: true,
                    createdAt: true,
                },
            });

            if (oldPageViews.length === 0) continue;

            // Group by date
            const dailyData: Record<string, {
                views: number;
                uniqueIps: Set<string>;
                countries: Record<string, number>;
            }> = {};

            for (const view of oldPageViews) {
                const dateKey = view.createdAt.toISOString().split("T")[0]!;

                if (!dailyData[dateKey]) {
                    dailyData[dateKey] = {
                        views: 0,
                        uniqueIps: new Set(),
                        countries: {},
                    };
                }

                dailyData[dateKey].views++;

                if (view.ip) {
                    dailyData[dateKey].uniqueIps.add(view.ip);
                }

                if (view.country) {
                    dailyData[dateKey].countries[view.country] =
                        (dailyData[dateKey].countries[view.country] || 0) + 1;
                }
            }

            // Upsert daily stats
            for (const [dateKey, data] of Object.entries(dailyData)) {
                const date = new Date(dateKey);

                await prisma.dailyStats.upsert({
                    where: {
                        restaurantId_date: {
                            restaurantId,
                            date,
                        },
                    },
                    create: {
                        restaurantId,
                        date,
                        totalViews: data.views,
                        uniqueVisitors: data.uniqueIps.size,
                        countryStats: Object.keys(data.countries).length > 0 ? data.countries : null,
                    },
                    update: {
                        totalViews: { increment: data.views },
                        uniqueVisitors: { increment: data.uniqueIps.size },
                        // Note: For countryStats, we'd need a more complex merge
                        // For simplicity, we'll skip updating countryStats on existing records
                    },
                });
            }

            // Delete old page views
            const deleteResult = await prisma.pageView.deleteMany({
                where: {
                    restaurantId,
                    createdAt: { lt: cutoffDate },
                },
            });

            const aggregatedCount = Object.keys(dailyData).length;
            totalAggregated += aggregatedCount;
            totalDeleted += deleteResult.count;

            results.push({
                restaurantId,
                aggregated: aggregatedCount,
                deleted: deleteResult.count,
            });
        }

        console.log(`Cron cleanup completed: ${totalAggregated} days aggregated, ${totalDeleted} records deleted`);

        return res.status(200).json({
            success: true,
            summary: {
                restaurantsProcessed: restaurantsWithOldViews.length,
                totalDaysAggregated: totalAggregated,
                totalRecordsDeleted: totalDeleted,
                retentionDays,
                cutoffDate: cutoffDate.toISOString(),
            },
            details: results,
        });
    } catch (error) {
        console.error("Cron cleanup failed:", error);
        return res.status(500).json({
            error: "Cleanup failed",
            message: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

export default handler;
