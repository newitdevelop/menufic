import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { PrismaPromise } from "@prisma/client";

import { env } from "src/env/server.mjs";
import { createTRPCRouter, protectedProcedure } from "src/server/api/trpc";
import { imageKit } from "src/server/imageUtil";
import { invalidateTranslations } from "src/server/services/translation.service";
import { id, menuInput, restaurantId } from "src/utils/validators";

export const menuRouter = createTRPCRouter({
    /** Create a new menu under a restaurant */
    create: protectedProcedure.input(menuInput.merge(restaurantId)).mutation(async ({ ctx, input }) => {
        const [count, lastMenuItem] = await ctx.prisma.$transaction([
            ctx.prisma.menu.count({ where: { restaurantId: input.restaurantId } }),
            ctx.prisma.menu.findFirst({
                orderBy: { position: "desc" },
                where: { restaurantId: input.restaurantId, userId: ctx.session.user.id },
            }),
        ]);

        /** Check whether the maximum number of menus per restaurant has been reached */
        if (count >= Number(env.NEXT_PUBLIC_MAX_MENUS_PER_RESTAURANT)) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Reached maximum number of menus per restaurant",
            });
        }

        // Calculate isActive: user's toggle AND date logic
        // If temporary menu, check if we're still within the date range
        const userActiveState = input.isActive ?? true;
        let isWithinDateRange = true;

        if (input.isTemporary) {
            const now = new Date();

            // If start date is set, check if we've reached it (menu starts at beginning of start date)
            if (input.startDate) {
                const startOfStartDate = new Date(input.startDate);
                startOfStartDate.setHours(0, 0, 0, 0);
                if (now < startOfStartDate) {
                    isWithinDateRange = false; // Not started yet
                }
            }

            // If end date is set, check if we've passed it (menu ends at end of end date)
            if (input.endDate) {
                const endOfEndDate = new Date(input.endDate);
                endOfEndDate.setHours(23, 59, 59, 999); // End of the day
                if (now > endOfEndDate) {
                    isWithinDateRange = false; // Already ended
                }
            }
        }

        const finalIsActive = userActiveState && isWithinDateRange;

        return ctx.prisma.menu.create({
            data: {
                availableTime: input.availableTime ?? "",
                email: input.email,
                reservations: input.reservations,
                message: input.message,
                name: input.name,
                position: lastMenuItem ? lastMenuItem.position + 1 : 0,
                restaurantId: input.restaurantId,
                telephone: input.telephone,
                userId: ctx.session.user.id,
                isTemporary: input.isTemporary ?? false,
                startDate: input.startDate ?? null,
                endDate: input.endDate ?? null,
                isFestive: input.isFestive ?? false,
                isActive: finalIsActive,
                // New reservation system fields
                reservationType: input.reservationType ?? "NONE",
                reservationUrl: input.reservationUrl ?? null,
                reservationEmail: input.reservationEmail ?? null,
                reservationStartTime: input.reservationStartTime ?? null,
                reservationEndTime: input.reservationEndTime ?? null,
                reservationMaxPartySize: input.reservationMaxPartySize ?? null,
                reservationSlotDuration: input.reservationSlotDuration ?? 30,
            },
        });
    }),

    /** Delete a restaurant menu along with all the categories, items and images belonging to it */
    delete: protectedProcedure.input(id).mutation(async ({ ctx, input }) => {
        const currentItem = await ctx.prisma.menu.findUniqueOrThrow({
            include: { categories: { include: { items: true } } },
            where: { id_userId: { id: input.id, userId: ctx.session.user.id } },
        });

        const imagePaths: string[] = [];
        const promiseList: any[] = [];
        const transactions: PrismaPromise<unknown>[] = [];

        currentItem.categories.forEach((category) => {
            transactions.push(ctx.prisma.menuItem.deleteMany({ where: { categoryId: category.id } }));
            category.items.forEach((item) => {
                if (item.imageId) {
                    imagePaths.push(item.imageId);
                }
            });
        });

        transactions.push(ctx.prisma.category.deleteMany({ where: { menuId: input.id } }));

        transactions.push(
            ctx.prisma.menu.delete({ where: { id_userId: { id: input.id, userId: ctx.session.user.id } } })
        );

        if (imagePaths.length > 0) {
            promiseList.push(imageKit.bulkDeleteFiles(imagePaths));
            transactions.push(ctx.prisma.image.deleteMany({ where: { id: { in: imagePaths } } }));
        }

        await Promise.all([ctx.prisma.$transaction(transactions), promiseList]);

        return currentItem;
    }),

    /** Get all the menus belonging toa restaurant */
    getAll: protectedProcedure.input(restaurantId).query(({ ctx, input }) =>
        ctx.prisma.menu.findMany({
            orderBy: { position: "asc" },
            where: { restaurantId: input.restaurantId, userId: ctx.session.user.id },
        })
    ),

    /** Update the details of a restaurant menu */
    update: protectedProcedure.input(menuInput.merge(id)).mutation(async ({ ctx, input }) => {
        // Get current menu to check what changed
        const currentMenu = await ctx.prisma.menu.findUniqueOrThrow({
            include: { restaurant: true },
            where: { id_userId: { id: input.id, userId: ctx.session.user.id } },
        });

        // Check if any translatable field changed
        const shouldInvalidate =
            input.name !== currentMenu.name ||
            input.availableTime !== currentMenu.availableTime ||
            input.message !== currentMenu.message;

        // Calculate isActive: user's toggle AND date logic
        // If temporary menu, check if we're still within the date range
        const userActiveState = input.isActive ?? true;
        let isWithinDateRange = true;

        if (input.isTemporary) {
            const now = new Date();

            // If start date is set, check if we've reached it (menu starts at beginning of start date)
            if (input.startDate) {
                const startOfStartDate = new Date(input.startDate);
                startOfStartDate.setHours(0, 0, 0, 0);
                if (now < startOfStartDate) {
                    isWithinDateRange = false; // Not started yet
                }
            }

            // If end date is set, check if we've passed it (menu ends at end of end date)
            if (input.endDate) {
                const endOfEndDate = new Date(input.endDate);
                endOfEndDate.setHours(23, 59, 59, 999); // End of the day
                if (now > endOfEndDate) {
                    isWithinDateRange = false; // Already ended
                }
            }
        }

        const finalIsActive = userActiveState && isWithinDateRange;

        const [updatedMenu] = await Promise.all([
            ctx.prisma.menu.update({
                data: {
                    availableTime: input.availableTime ?? "",
                    email: input.email ?? null,
                    reservations: input.reservations ?? null,
                    message: input.message ?? null,
                    name: input.name,
                    telephone: input.telephone ?? null,
                    isTemporary: input.isTemporary ?? false,
                    startDate: input.startDate ?? null,
                    endDate: input.endDate ?? null,
                    isFestive: input.isFestive ?? false,
                    isActive: finalIsActive,
                    // New reservation system fields
                    reservationType: input.reservationType ?? "NONE",
                    reservationUrl: input.reservationUrl ?? null,
                    reservationEmail: input.reservationEmail ?? null,
                    reservationStartTime: input.reservationStartTime ?? null,
                    reservationEndTime: input.reservationEndTime ?? null,
                    reservationMaxPartySize: input.reservationMaxPartySize ?? null,
                    reservationSlotDuration: input.reservationSlotDuration ?? 30,
                },
                where: { id_userId: { id: input.id, userId: ctx.session.user.id } },
            }),
            // Invalidate translations if any translatable field changed
            shouldInvalidate ? invalidateTranslations("menu", input.id) : Promise.resolve(),
        ]);

        // Revalidate the public menu page to reflect translation changes immediately
        if (shouldInvalidate && currentMenu.restaurant?.id) {
            const restaurantId = currentMenu.restaurant.id;
            console.log(`[Menu Update] Revalidating /venue/${restaurantId}/menu due to translatable field change`);
            await ctx.res?.revalidate(`/venue/${restaurantId}/menu`);
        }

        return updatedMenu;
    }),

    /** Update the position the menus of the restaurant */
    updatePosition: protectedProcedure
        .input(z.array(id.extend({ newPosition: z.number() })))
        .mutation(async ({ ctx, input }) =>
            ctx.prisma.$transaction(
                input.map((item) =>
                    ctx.prisma.menu.update({
                        data: { position: item.newPosition },
                        where: { id_userId: { id: item.id, userId: ctx.session.user.id } },
                    })
                )
            )
        ),
});
