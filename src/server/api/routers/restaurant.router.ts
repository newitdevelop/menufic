import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Image, Prisma, PrismaPromise, Restaurant } from "@prisma/client";

import { env } from "src/env/server.mjs";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "src/server/api/trpc";
import { encodeImageToBlurhash, getColor, imageKit, rgba2hex, uploadImage } from "src/server/imageUtil";
import { bannerInput, bannerUpdateInput, id, restaurantId, restaurantInput } from "src/utils/validators";

export const restaurantRouter = createTRPCRouter({
    /** Add a banner to a restaurant */
    addBanner: protectedProcedure.input(bannerInput).mutation(async ({ ctx, input }) => {
        const restaurant = await ctx.prisma.restaurant.findUniqueOrThrow({
            select: { banners: true },
            where: { id_userId: { id: input.restaurantId, userId: ctx.session.user.id } },
        });

        // Check if the maximum banner count of the restaurant has been reached
        if (restaurant?.banners.length >= Number(env.NEXT_PUBLIC_MAX_BANNERS_PER_RESTAURANT)) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Maximum number of banners reached",
            });
        }

        const [uploadedResponse, blurHash, color] = await Promise.all([
            uploadImage(input.imageBase64, `user/${ctx.session.user.id}/venue/banners`),
            encodeImageToBlurhash(input.imageBase64),
            getColor(input.imageBase64),
        ]);

        return ctx.prisma.image.create({
            data: {
                blurHash,
                color: rgba2hex(color[0], color[1], color[2]),
                id: uploadedResponse.fileId,
                path: uploadedResponse.filePath,
                expiryDate: input.expiryDate || null,
                // Schedule fields
                scheduleType: input.scheduleType,
                dailyStartTime: input.dailyStartTime || null,
                dailyEndTime: input.dailyEndTime || null,
                weeklyDays: input.weeklyDays,
                monthlyDays: input.monthlyDays,
                monthlyWeekday: input.monthlyWeekday ?? null,
                monthlyWeekdayOrdinal: input.monthlyWeekdayOrdinal ?? null,
                monthlyWeekdayRules: input.monthlyWeekdayRules && input.monthlyWeekdayRules.length > 0 ? input.monthlyWeekdayRules : undefined,
                yearlyStartDate: input.yearlyStartDate || null,
                yearlyEndDate: input.yearlyEndDate || null,
                periodStartDate: input.periodStartDate || null,
                periodEndDate: input.periodEndDate || null,
                restaurantBanner: { connect: { id_userId: { id: input.restaurantId, userId: ctx.session.user.id } } },
            },
        });
    }),

    /** Update an existing banner */
    updateBanner: protectedProcedure.input(bannerUpdateInput).mutation(async ({ ctx, input }) => {
        // Verify the banner belongs to the user's restaurant
        const restaurant = await ctx.prisma.restaurant.findUniqueOrThrow({
            include: { banners: true },
            where: { id_userId: { id: input.restaurantId, userId: ctx.session.user.id } },
        });

        const banner = restaurant.banners.find((b) => b.id === input.id);
        if (!banner) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Banner not found or does not belong to this restaurant" });
        }

        // Prepare update data
        const updateData: any = {
            expiryDate: input.expiryDate || null,
            scheduleType: input.scheduleType,
            dailyStartTime: input.dailyStartTime || null,
            dailyEndTime: input.dailyEndTime || null,
            weeklyDays: input.weeklyDays,
            monthlyDays: input.monthlyDays,
            monthlyWeekday: input.monthlyWeekday ?? null,
            monthlyWeekdayOrdinal: input.monthlyWeekdayOrdinal ?? null,
            monthlyWeekdayRules: input.monthlyWeekdayRules && input.monthlyWeekdayRules.length > 0 ? input.monthlyWeekdayRules : undefined,
            yearlyStartDate: input.yearlyStartDate || null,
            yearlyEndDate: input.yearlyEndDate || null,
            periodStartDate: input.periodStartDate || null,
            periodEndDate: input.periodEndDate || null,
        };

        // If user uploaded a new image, process it
        if (input.imageBase64) {
            const [uploadedResponse, blurHash, color] = await Promise.all([
                uploadImage(input.imageBase64, `user/${ctx.session.user.id}/venue/banners`),
                encodeImageToBlurhash(input.imageBase64),
                getColor(input.imageBase64),
                imageKit.deleteFile(banner.id), // Delete old image
            ]);

            updateData.blurHash = blurHash;
            updateData.color = rgba2hex(color[0], color[1], color[2]);
            updateData.id = uploadedResponse.fileId;
            updateData.path = uploadedResponse.filePath;
        }

        return ctx.prisma.image.update({
            where: { id: input.id },
            data: updateData,
        });
    }),

    /** Create a new restaurant for the user */
    create: protectedProcedure.input(restaurantInput).mutation(async ({ ctx, input }) => {
        const count = await ctx.prisma.restaurant.count({ where: { userId: ctx.session.user.id } });

        // Check if user has reached the maximum number of restaurants that he/she can create
        if (count >= Number(env.NEXT_PUBLIC_MAX_RESTAURANTS_PER_USER)) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Maximum number of restaurants reached",
            });
        }

        const [uploadedResponse, blurHash, color] = await Promise.all([
            uploadImage(input.imageBase64, `user/${ctx.session.user.id}/venue`),
            encodeImageToBlurhash(input.imageBase64),
            getColor(input.imageBase64),
        ]);

        return ctx.prisma.restaurant.create({
            data: {
                contactNo: input.contactNo,
                image: {
                    create: {
                        blurHash,
                        color: rgba2hex(color[0], color[1], color[2]),
                        id: uploadedResponse.fileId,
                        path: uploadedResponse.filePath,
                    },
                },
                isPublished: false,
                location: input.location,
                name: input.name,
                privacyPolicyUrl: input.privacyPolicyUrl,
                termsAndConditionsUrl: input.termsAndConditionsUrl,
                userId: ctx.session.user.id,
            },
            include: { image: true },
        });
    }),

    /** Delete restaurant along with all the menus, categories, items and images */
    delete: protectedProcedure.input(id).mutation(async ({ ctx, input }) => {
        const currentItem = await ctx.prisma.restaurant.findUniqueOrThrow({
            include: { banners: true, menus: { include: { categories: { include: { items: true } } } } },
            where: { id_userId: { id: input.id, userId: ctx.session.user.id } },
        });

        const transactions: PrismaPromise<unknown>[] = [];

        const imagePaths: string[] = [];
        if (currentItem.imageId) {
            imagePaths.push(currentItem.imageId);
        }

        currentItem?.banners?.forEach((banner) => {
            imagePaths.push(banner.id);
        });

        currentItem?.menus?.forEach((menu) => {
            menu.categories?.forEach((category) => {
                transactions.push(ctx.prisma.menuItem.deleteMany({ where: { categoryId: category.id } }));
                category.items?.forEach((item) => {
                    if (item.imageId) {
                        imagePaths.push(item.imageId);
                    }
                });
            });

            transactions.push(ctx.prisma.category.deleteMany({ where: { menuId: menu.id } }));
        });

        transactions.push(ctx.prisma.menu.deleteMany({ where: { restaurantId: input.id } }));

        transactions.push(ctx.prisma.image.deleteMany({ where: { id: { in: imagePaths } } }));

        transactions.push(
            ctx.prisma.restaurant.delete({ where: { id_userId: { id: input.id, userId: ctx.session.user.id } } })
        );

        await Promise.all([imageKit.bulkDeleteFiles(imagePaths), ctx.prisma.$transaction(transactions)]);

        return currentItem;
    }),

    /** Delete a banner from the user's restaurant */
    deleteBanner: protectedProcedure.input(restaurantId.extend({ id: z.string() })).mutation(async ({ ctx, input }) => {
        const restaurant = await ctx.prisma.restaurant.findUniqueOrThrow({
            include: { banners: true },
            where: { id_userId: { id: input.restaurantId, userId: ctx.session.user.id } },
        });
        if (restaurant.banners.find((item) => item.id === input.id)) {
            const [, deletedImage] = await Promise.all([
                imageKit.deleteFile(input.id),
                ctx.prisma.image.delete({ where: { id: input.id } }),
            ]);
            return deletedImage;
        }
        throw new TRPCError({ code: "FORBIDDEN" });
    }),

    /** Get basic info of a restaurant */
    get: protectedProcedure.input(id).query(({ ctx, input }) =>
        ctx.prisma.restaurant.findUniqueOrThrow({
            where: { id_userId: { id: input.id, userId: ctx.session.user.id } },
        })
    ),

    /** Get all the restaurants belonging to a user */
    getAll: protectedProcedure.query(({ ctx }) =>
        ctx.prisma.restaurant.findMany({ include: { image: true }, where: { userId: ctx.session.user.id } })
    ),

    /** Get all the restaurants that have been published by all users */
    getAllPublished: publicProcedure.query(({ ctx }) =>
        ctx.prisma.restaurant.findMany({ include: { image: true }, where: { isPublished: true } })
    ),

    /** Get banner images belonging to a restaurant */
    getBanners: protectedProcedure.input(id).query(async ({ ctx, input }) => {
        const restaurant = await ctx.prisma.restaurant.findUniqueOrThrow({
            select: { banners: true },
            where: { id_userId: { id: input.id, userId: ctx.session.user.id } },
        });
        return restaurant.banners;
    }),

    /** Get all the details including items and images, for a given restaurant ID */
    getDetails: publicProcedure
        .input(id.extend({ language: z.string().optional() }))
        .query(async ({ ctx, input }) => {
            // Check if user is logged in and owns this restaurant
            const userId = ctx.session?.user?.id;
            let isOwner = false;

            if (userId) {
                // Check if this user owns the restaurant
                const ownership = await ctx.prisma.restaurant.findUnique({
                    where: { id_userId: { id: input.id, userId } },
                    select: { id: true },
                });
                isOwner = !!ownership;
            }

            // Build menu filter based on ownership status
            // - External menus: show if active (public)
            // - Internal menus: show only if user is owner AND active
            const menuFilter: { menuType?: "EXTERNAL" | "INTERNAL"; isActive: boolean } = isOwner
                ? {
                      isActive: true, // Show both external and internal menus to owner
                  }
                : {
                      menuType: "EXTERNAL",
                      isActive: true,
                  };

            const restaurantData = await ctx.prisma.restaurant.findFirstOrThrow({
                include: {
                    banners: true,
                    image: true,
                    menus: {
                        include: {
                            categories: {
                                include: { items: { include: { image: true }, orderBy: { position: "asc" } } },
                                orderBy: { position: "asc" },
                            },
                            packs: {
                                include: {
                                    sections: { orderBy: { position: "asc" } },
                                    image: true,
                                },
                                orderBy: { position: "asc" },
                                where: { isActive: true }, // Only show active packs
                            },
                        },
                        orderBy: { position: "asc" },
                        where: menuFilter,
                    },
                },
                where: { id: input.id },
            });

            // Import schedule service and filter menus by schedule
            const { isActiveBySchedule } = await import("src/server/services/schedule.service");

            // Filter menus based on their schedule settings
            // Schedule filtering applies to ALL users (including owners)
            // The menuFilter already handles visibility (INTERNAL vs EXTERNAL)
            const now = new Date();
            console.log(`[getDetails] Filtering menus at ${now.toISOString()}, isOwner=${isOwner}, userId=${userId || 'none'}`);
            console.log(`[getDetails] Total menus before filter: ${restaurantData.menus.length}`);

            const filteredMenus = restaurantData.menus.filter((menu) => {
                const scheduleConfig = {
                    scheduleType: menu.scheduleType as any,
                    dailyStartTime: menu.dailyStartTime,
                    dailyEndTime: menu.dailyEndTime,
                    weeklyDays: menu.weeklyDays,
                    monthlyDays: menu.monthlyDays,
                    monthlyWeekday: menu.monthlyWeekday,
                    monthlyWeekdayOrdinal: menu.monthlyWeekdayOrdinal,
                    monthlyWeekdayRules: menu.monthlyWeekdayRules as any,
                    yearlyStartDate: menu.yearlyStartDate,
                    yearlyEndDate: menu.yearlyEndDate,
                    periodStartDate: menu.periodStartDate,
                    periodEndDate: menu.periodEndDate,
                };
                // Log schedule config for MONTHLY menus
                if (menu.scheduleType === 'MONTHLY') {
                    console.log(`[getDetails] Menu "${menu.name}" MONTHLY config:`, {
                        monthlyWeekday: menu.monthlyWeekday,
                        monthlyWeekdayOrdinal: menu.monthlyWeekdayOrdinal,
                        monthlyWeekdayRules: menu.monthlyWeekdayRules,
                        monthlyDays: menu.monthlyDays,
                    });
                }
                // Enable debug logging for non-ALWAYS schedules
                const debug = menu.scheduleType !== 'ALWAYS';
                const isActive = isActiveBySchedule(scheduleConfig, now, debug);
                console.log(`[getDetails] Menu "${menu.name}" (${menu.scheduleType}): isActive=${isActive}`);
                return isActive;
            });

            console.log(`[getDetails] Total menus after filter: ${filteredMenus.length}`);

            // Also filter banners by schedule
            const filteredBanners = restaurantData.banners.filter((banner) => {
                const scheduleConfig = {
                    scheduleType: banner.scheduleType as any,
                    dailyStartTime: banner.dailyStartTime,
                    dailyEndTime: banner.dailyEndTime,
                    weeklyDays: banner.weeklyDays,
                    monthlyDays: banner.monthlyDays,
                    monthlyWeekday: banner.monthlyWeekday,
                    monthlyWeekdayOrdinal: banner.monthlyWeekdayOrdinal,
                    monthlyWeekdayRules: banner.monthlyWeekdayRules as any,
                    yearlyStartDate: banner.yearlyStartDate,
                    yearlyEndDate: banner.yearlyEndDate,
                    periodStartDate: banner.periodStartDate,
                    periodEndDate: banner.periodEndDate,
                };
                return isActiveBySchedule(scheduleConfig, now);
            });

            const restaurant = {
                ...restaurantData,
                menus: filteredMenus,
                banners: filteredBanners,
            };

            // Import translation services
            const { translateMenu, translateCategory, translateMenuItem, translatePack, translatePackSection, getImageDisclaimer, getUITranslation, getAllergenTranslation, getReservationTranslations } = await import(
                "src/server/services/translation.service"
            );

            // Get UI translations
            const targetLang = input.language || "PT";
            const [vatIncluded, allergensInfo, allergenTranslations, reservationTranslations] = await Promise.all([
                getUITranslation("vatIncluded", targetLang),
                getUITranslation("allergensInfo", targetLang),
                Promise.all([
                    getAllergenTranslation("cereals", targetLang),
                    getAllergenTranslation("crustaceans", targetLang),
                    getAllergenTranslation("eggs", targetLang),
                    getAllergenTranslation("fish", targetLang),
                    getAllergenTranslation("peanuts", targetLang),
                    getAllergenTranslation("soybeans", targetLang),
                    getAllergenTranslation("milk", targetLang),
                    getAllergenTranslation("nuts", targetLang),
                    getAllergenTranslation("celery", targetLang),
                    getAllergenTranslation("mustard", targetLang),
                    getAllergenTranslation("sesame", targetLang),
                    getAllergenTranslation("sulphites", targetLang),
                    getAllergenTranslation("lupin", targetLang),
                    getAllergenTranslation("molluscs", targetLang),
                    getAllergenTranslation("none", targetLang),
                ]),
                getReservationTranslations(targetLang),
            ]);

            const uiTranslations = {
                vatIncluded,
                allergensInfo,
                allergens: {
                    cereals: allergenTranslations[0],
                    crustaceans: allergenTranslations[1],
                    eggs: allergenTranslations[2],
                    fish: allergenTranslations[3],
                    peanuts: allergenTranslations[4],
                    soybeans: allergenTranslations[5],
                    milk: allergenTranslations[6],
                    nuts: allergenTranslations[7],
                    celery: allergenTranslations[8],
                    mustard: allergenTranslations[9],
                    sesame: allergenTranslations[10],
                    sulphites: allergenTranslations[11],
                    lupin: allergenTranslations[12],
                    molluscs: allergenTranslations[13],
                    none: allergenTranslations[14],
                },
                reservation: reservationTranslations,
            };

            // If no language specified or language is Portuguese, add disclaimers but don't translate
            if (!input.language || input.language.toUpperCase() === "PT") {
                const menusWithDisclaimers = await Promise.all(
                    restaurant.menus.map(async (menu) => {
                        const categoriesWithDisclaimers = await Promise.all(
                            menu.categories.map(async (category) => {
                                const itemsWithDisclaimers = await Promise.all(
                                    category.items.map(async (item) => {
                                        const updates: any = { uiTranslations };

                                        if (item.image) {
                                            const disclaimer = await getImageDisclaimer(
                                                item.image.isAiGenerated ?? false,
                                                input.language || "PT"
                                            );
                                            updates.image = {
                                                ...item.image,
                                                disclaimer,
                                            };
                                        }

                                        return {
                                            ...item,
                                            ...updates,
                                        };
                                    })
                                );
                                return { ...category, items: itemsWithDisclaimers };
                            })
                        );

                        // Add UI translations to packs
                        const packsWithUiTranslations = menu.packs?.map(pack => ({
                            ...pack,
                            uiTranslations,
                        })) || [];

                        return { ...menu, categories: categoriesWithDisclaimers, packs: packsWithUiTranslations };
                    })
                );
                return { ...restaurant, menus: menusWithDisclaimers, uiTranslations };
            }

            // Translate all menus, categories, items, and packs
            const translatedMenus = await Promise.all(
                restaurant.menus.map(async (menu) => {
                    const translatedMenu = await translateMenu(menu, input.language!);

                    const translatedCategories = await Promise.all(
                        menu.categories.map(async (category) => {
                            const translatedCategory = await translateCategory(category, input.language!);

                            const translatedItems = await Promise.all(
                                category.items.map(async (item) => {
                                    const translatedItem = await translateMenuItem(item, input.language!);

                                    const updates: any = { uiTranslations };

                                    // Add translated disclaimer if item has an image
                                    if (item.image) {
                                        const disclaimer = await getImageDisclaimer(
                                            item.image.isAiGenerated ?? false,
                                            input.language!
                                        );
                                        updates.image = {
                                            ...item.image,
                                            disclaimer,
                                        };
                                    }

                                    return {
                                        ...translatedItem,
                                        ...updates,
                                    };
                                })
                            );

                            return {
                                ...translatedCategory,
                                items: translatedItems,
                            };
                        })
                    );

                    // Translate packs and their sections
                    const translatedPacks = await Promise.all(
                        (menu.packs || []).map(async (pack) => {
                            const translatedPack = await translatePack(pack, input.language!);

                            const translatedSections = await Promise.all(
                                pack.sections.map(async (section) => {
                                    return await translatePackSection(section, input.language!);
                                })
                            );

                            return {
                                ...translatedPack,
                                sections: translatedSections,
                                uiTranslations,
                            };
                        })
                    );

                    return {
                        ...translatedMenu,
                        categories: translatedCategories,
                        packs: translatedPacks,
                    };
                })
            );

            return {
                ...restaurant,
                menus: translatedMenus,
                uiTranslations,
            };
        }),

    /** Update the published status of the restaurant */
    setPublished: protectedProcedure.input(id.extend({ isPublished: z.boolean() })).mutation(async ({ ctx, input }) => {
        const restaurant = await ctx.prisma.restaurant.update({
            data: { isPublished: input.isPublished },
            where: { id_userId: { id: input.id, userId: ctx.session.user.id } },
        });
        /** Revalidate the published menu page */
        await ctx.res?.revalidate(`/venue/${input.id}/menu`);
        return restaurant;
    }),

    /** Update the restaurant details */
    update: protectedProcedure.input(restaurantInput.merge(id)).mutation(async ({ ctx, input }) => {
        const currentItem = await ctx.prisma.restaurant.findUniqueOrThrow({
            where: { id_userId: { id: input.id, userId: ctx.session.user.id } },
        });

        const updateData: Partial<Restaurant> = {
            contactNo: input.contactNo,
            location: input.location,
            name: input.name,
            privacyPolicyUrl: input.privacyPolicyUrl ?? null,
            termsAndConditionsUrl: input.termsAndConditionsUrl ?? null,
        };

        const transactions: (Prisma.Prisma__ImageClient<Image> | Prisma.Prisma__RestaurantClient<Restaurant>)[] = [];

        if (input.imageBase64 && currentItem.imageId) {
            const [uploadedResponse, blurHash, color] = await Promise.all([
                uploadImage(input.imageBase64, `user/${ctx.session.user.id}/venue`),
                encodeImageToBlurhash(input.imageBase64),
                getColor(input.imageBase64),
                imageKit.deleteFile(currentItem.imageId),
            ]);

            transactions.push(
                ctx.prisma.image.create({
                    data: {
                        blurHash,
                        color: rgba2hex(color[0], color[1], color[2]),
                        id: uploadedResponse.fileId,
                        path: uploadedResponse.filePath,
                    },
                })
            );
            updateData.imageId = uploadedResponse.fileId;
        }

        transactions.push(
            ctx.prisma.restaurant.update({
                data: updateData,
                include: { image: true },
                where: { id_userId: { id: input.id, userId: ctx.session.user.id } },
            })
        );

        const transactionRes = await ctx.prisma.$transaction(transactions);

        if (currentItem.imageId && input.imageBase64) {
            await ctx.prisma.image.delete({ where: { id: currentItem.imageId } });
        }

        return transactionRes.pop() as Restaurant & { image: Image | null };
    }),

    /** Track a page view for a restaurant (public) */
    trackPageView: publicProcedure
        .input(z.object({
            restaurantId: z.string(),
            path: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            // Create page view record with visitor info from context
            await ctx.prisma.pageView.create({
                data: {
                    restaurantId: input.restaurantId,
                    path: input.path,
                    ip: ctx.visitorIp,
                    country: ctx.visitorCountry,
                    userAgent: ctx.visitorUserAgent,
                    referer: ctx.visitorReferer,
                },
            });
            return { success: true };
        }),

    /** Get page view analytics for a restaurant (owner only) */
    getAnalytics: protectedProcedure
        .input(z.object({
            restaurantId: z.string(),
            startDate: z.date().optional(),
            endDate: z.date().optional(),
        }))
        .query(async ({ ctx, input }) => {
            // Verify user owns this restaurant
            await ctx.prisma.restaurant.findUniqueOrThrow({
                where: { id_userId: { id: input.restaurantId, userId: ctx.session.user.id } },
            });

            // Build date filter
            const dateFilter: { createdAt?: { gte?: Date; lte?: Date } } = {};
            if (input.startDate || input.endDate) {
                dateFilter.createdAt = {};
                if (input.startDate) dateFilter.createdAt.gte = input.startDate;
                if (input.endDate) dateFilter.createdAt.lte = input.endDate;
            }

            // Get total views
            const totalViews = await ctx.prisma.pageView.count({
                where: {
                    restaurantId: input.restaurantId,
                    ...dateFilter,
                },
            });

            // Get unique visitors (by IP)
            const uniqueVisitors = await ctx.prisma.pageView.groupBy({
                by: ['ip'],
                where: {
                    restaurantId: input.restaurantId,
                    ip: { not: null },
                    ...dateFilter,
                },
            });

            // Get views by country
            const viewsByCountry = await ctx.prisma.pageView.groupBy({
                by: ['country'],
                _count: { country: true },
                where: {
                    restaurantId: input.restaurantId,
                    country: { not: null },
                    ...dateFilter,
                },
                orderBy: { _count: { country: 'desc' } },
                take: 10,
            });

            // Get views by day (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const recentViews = await ctx.prisma.pageView.findMany({
                where: {
                    restaurantId: input.restaurantId,
                    createdAt: { gte: thirtyDaysAgo },
                },
                select: { createdAt: true },
                orderBy: { createdAt: 'asc' },
            });

            // Group views by day
            const viewsByDay: Record<string, number> = {};
            recentViews.forEach((view) => {
                const day = view.createdAt.toISOString().split('T')[0];
                viewsByDay[day] = (viewsByDay[day] || 0) + 1;
            });

            return {
                totalViews,
                uniqueVisitors: uniqueVisitors.length,
                viewsByCountry: viewsByCountry.map((v) => ({
                    country: v.country,
                    count: v._count.country,
                })),
                viewsByDay: Object.entries(viewsByDay).map(([date, count]) => ({
                    date,
                    count,
                })),
            };
        }),

    /**
     * Cleanup old page views and aggregate into daily stats
     * This should be called periodically (e.g., daily via cron or manually)
     * - Aggregates detailed page views older than retentionDays into DailyStats
     * - Deletes the detailed records after aggregation
     * - Protected: only authenticated users can trigger for their restaurants
     */
    cleanupPageViews: protectedProcedure
        .input(z.object({
            restaurantId: z.string(),
            retentionDays: z.number().int().min(1).max(365).default(30), // Keep detailed data for N days
        }))
        .mutation(async ({ ctx, input }) => {
            // Verify user owns this restaurant
            await ctx.prisma.restaurant.findUniqueOrThrow({
                where: { id_userId: { id: input.restaurantId, userId: ctx.session.user.id } },
            });

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - input.retentionDays);
            cutoffDate.setHours(0, 0, 0, 0); // Start of day

            // Get all page views older than cutoff, grouped by day
            const oldViews = await ctx.prisma.pageView.findMany({
                where: {
                    restaurantId: input.restaurantId,
                    createdAt: { lt: cutoffDate },
                },
                select: {
                    id: true,
                    ip: true,
                    country: true,
                    createdAt: true,
                },
            });

            if (oldViews.length === 0) {
                return { aggregated: 0, deleted: 0, message: 'No old records to cleanup' };
            }

            // Group by day and aggregate
            const dailyAggregates: Record<string, {
                totalViews: number;
                uniqueIps: Set<string>;
                countryCounts: Record<string, number>;
            }> = {};

            oldViews.forEach((view) => {
                const dateKey = view.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD

                if (!dailyAggregates[dateKey]) {
                    dailyAggregates[dateKey] = {
                        totalViews: 0,
                        uniqueIps: new Set(),
                        countryCounts: {},
                    };
                }

                dailyAggregates[dateKey].totalViews++;

                if (view.ip) {
                    dailyAggregates[dateKey].uniqueIps.add(view.ip);
                }

                if (view.country) {
                    dailyAggregates[dateKey].countryCounts[view.country] =
                        (dailyAggregates[dateKey].countryCounts[view.country] || 0) + 1;
                }
            });

            // Upsert daily stats (merge with existing if any)
            const upsertPromises = Object.entries(dailyAggregates).map(async ([dateStr, stats]) => {
                const date = new Date(dateStr);

                // Check if we already have stats for this day
                const existing = await ctx.prisma.dailyStats.findUnique({
                    where: {
                        restaurantId_date: {
                            restaurantId: input.restaurantId,
                            date,
                        },
                    },
                });

                if (existing) {
                    // Merge with existing stats
                    const existingCountryStats = (existing.countryStats as Record<string, number>) || {};
                    const mergedCountryStats = { ...existingCountryStats };

                    Object.entries(stats.countryCounts).forEach(([country, count]) => {
                        mergedCountryStats[country] = (mergedCountryStats[country] || 0) + count;
                    });

                    return ctx.prisma.dailyStats.update({
                        where: { id: existing.id },
                        data: {
                            totalViews: existing.totalViews + stats.totalViews,
                            // For unique visitors, we can't perfectly merge, so we take max as approximation
                            uniqueVisitors: Math.max(existing.uniqueVisitors, stats.uniqueIps.size),
                            countryStats: mergedCountryStats,
                        },
                    });
                } else {
                    // Create new daily stats
                    return ctx.prisma.dailyStats.create({
                        data: {
                            restaurantId: input.restaurantId,
                            date,
                            totalViews: stats.totalViews,
                            uniqueVisitors: stats.uniqueIps.size,
                            countryStats: stats.countryCounts,
                        },
                    });
                }
            });

            await Promise.all(upsertPromises);

            // Delete the old detailed records
            const deleteResult = await ctx.prisma.pageView.deleteMany({
                where: {
                    restaurantId: input.restaurantId,
                    createdAt: { lt: cutoffDate },
                },
            });

            return {
                aggregated: Object.keys(dailyAggregates).length,
                deleted: deleteResult.count,
                message: `Aggregated ${Object.keys(dailyAggregates).length} days, deleted ${deleteResult.count} detailed records`,
            };
        }),

    /**
     * Get aggregated daily stats for a restaurant (historical data)
     * This includes data from both recent PageViews and older DailyStats
     */
    getDailyStats: protectedProcedure
        .input(z.object({
            restaurantId: z.string(),
            startDate: z.date().optional(),
            endDate: z.date().optional(),
        }))
        .query(async ({ ctx, input }) => {
            // Verify user owns this restaurant
            await ctx.prisma.restaurant.findUniqueOrThrow({
                where: { id_userId: { id: input.restaurantId, userId: ctx.session.user.id } },
            });

            // Default to last 90 days
            const endDate = input.endDate || new Date();
            const startDate = input.startDate || new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);

            // Get aggregated stats from DailyStats table
            const dailyStats = await ctx.prisma.dailyStats.findMany({
                where: {
                    restaurantId: input.restaurantId,
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                orderBy: { date: 'asc' },
            });

            // Get recent detailed views (not yet aggregated) and group by day
            const recentViews = await ctx.prisma.pageView.findMany({
                where: {
                    restaurantId: input.restaurantId,
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                select: {
                    ip: true,
                    country: true,
                    createdAt: true,
                },
            });

            // Group recent views by day
            const recentByDay: Record<string, {
                totalViews: number;
                uniqueIps: Set<string>;
                countryCounts: Record<string, number>;
            }> = {};

            recentViews.forEach((view) => {
                const dateKey = view.createdAt.toISOString().split('T')[0];

                if (!recentByDay[dateKey]) {
                    recentByDay[dateKey] = {
                        totalViews: 0,
                        uniqueIps: new Set(),
                        countryCounts: {},
                    };
                }

                recentByDay[dateKey].totalViews++;
                if (view.ip) recentByDay[dateKey].uniqueIps.add(view.ip);
                if (view.country) {
                    recentByDay[dateKey].countryCounts[view.country] =
                        (recentByDay[dateKey].countryCounts[view.country] || 0) + 1;
                }
            });

            // Merge both sources
            const allDays: Record<string, {
                date: string;
                totalViews: number;
                uniqueVisitors: number;
                countryStats: Record<string, number>;
            }> = {};

            // Add aggregated stats
            dailyStats.forEach((stat) => {
                const dateKey = stat.date.toISOString().split('T')[0];
                allDays[dateKey] = {
                    date: dateKey,
                    totalViews: stat.totalViews,
                    uniqueVisitors: stat.uniqueVisitors,
                    countryStats: (stat.countryStats as Record<string, number>) || {},
                };
            });

            // Add/merge recent stats
            Object.entries(recentByDay).forEach(([dateKey, stats]) => {
                if (allDays[dateKey]) {
                    // Merge with existing aggregated data
                    allDays[dateKey].totalViews += stats.totalViews;
                    allDays[dateKey].uniqueVisitors = Math.max(
                        allDays[dateKey].uniqueVisitors,
                        stats.uniqueIps.size
                    );
                    Object.entries(stats.countryCounts).forEach(([country, count]) => {
                        allDays[dateKey].countryStats[country] =
                            (allDays[dateKey].countryStats[country] || 0) + count;
                    });
                } else {
                    allDays[dateKey] = {
                        date: dateKey,
                        totalViews: stats.totalViews,
                        uniqueVisitors: stats.uniqueIps.size,
                        countryStats: stats.countryCounts,
                    };
                }
            });

            // Sort by date and return
            return Object.values(allDays).sort((a, b) => a.date.localeCompare(b.date));
        }),

    /**
     * Get storage stats for page views (helps decide when to cleanup)
     */
    getPageViewStats: protectedProcedure
        .input(z.object({
            restaurantId: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            // Verify user owns this restaurant
            await ctx.prisma.restaurant.findUniqueOrThrow({
                where: { id_userId: { id: input.restaurantId, userId: ctx.session.user.id } },
            });

            const [totalDetailedRecords, oldestRecord, newestRecord, aggregatedDays] = await Promise.all([
                ctx.prisma.pageView.count({
                    where: { restaurantId: input.restaurantId },
                }),
                ctx.prisma.pageView.findFirst({
                    where: { restaurantId: input.restaurantId },
                    orderBy: { createdAt: 'asc' },
                    select: { createdAt: true },
                }),
                ctx.prisma.pageView.findFirst({
                    where: { restaurantId: input.restaurantId },
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true },
                }),
                ctx.prisma.dailyStats.count({
                    where: { restaurantId: input.restaurantId },
                }),
            ]);

            return {
                totalDetailedRecords,
                oldestRecord: oldestRecord?.createdAt || null,
                newestRecord: newestRecord?.createdAt || null,
                aggregatedDays,
                // Rough estimate: ~200 bytes per detailed record
                estimatedStorageBytes: totalDetailedRecords * 200,
            };
        }),
});
