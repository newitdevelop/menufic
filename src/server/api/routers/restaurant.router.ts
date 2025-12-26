import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Image, Prisma, PrismaPromise, Restaurant } from "@prisma/client";

import { env } from "src/env/server.mjs";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "src/server/api/trpc";
import { encodeImageToBlurhash, getColor, imageKit, rgba2hex, uploadImage } from "src/server/imageUtil";
import { bannerInput, id, restaurantId, restaurantInput } from "src/utils/validators";

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
                restaurantBanner: { connect: { id_userId: { id: input.restaurantId, userId: ctx.session.user.id } } },
            },
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
    getAllPublished: protectedProcedure.query(({ ctx }) =>
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
            const restaurant = await ctx.prisma.restaurant.findFirstOrThrow({
                include: {
                    banners: true,
                    image: true,
                    menus: {
                        include: {
                            categories: {
                                include: { items: { include: { image: true }, orderBy: { position: "asc" } } },
                                orderBy: { position: "asc" },
                            },
                        },
                        orderBy: { position: "asc" },
                    },
                },
                where: { id: input.id },
            });

            // Import translation services
            const { translateMenu, translateCategory, translateMenuItem, getImageDisclaimer, getUITranslation, getAllergenTranslation } = await import(
                "src/server/services/translation.service"
            );

            // Get UI translations
            const targetLang = input.language || "PT";
            const [vatIncluded, allergensInfo, allergenTranslations] = await Promise.all([
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
                        return { ...menu, categories: categoriesWithDisclaimers };
                    })
                );
                return { ...restaurant, menus: menusWithDisclaimers, uiTranslations };
            }

            // Translate all menus, categories, and items
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

                    return {
                        ...translatedMenu,
                        categories: translatedCategories,
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
});
