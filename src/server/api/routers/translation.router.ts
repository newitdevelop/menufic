import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "src/server/api/trpc";

export const translationRouter = createTRPCRouter({
    /**
     * Clear all cached translations for a specific entity
     * This forces retranslation on next request
     */
    clearCache: protectedProcedure
        .input(
            z.object({
                entityType: z.enum(["menu", "category", "menuItem", "pack", "packSection"]),
                entityId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const deleted = await ctx.prisma.translation.deleteMany({
                where: {
                    entityType: input.entityType,
                    entityId: input.entityId,
                },
            });

            return {
                message: `Cleared ${deleted.count} cached translations for ${input.entityType}/${input.entityId}`,
                count: deleted.count,
            };
        }),

    /**
     * Clear all invalid translations
     * Invalid = non-PT translations that contain Portuguese characters
     */
    clearInvalidTranslations: protectedProcedure.mutation(async ({ ctx }) => {
        // Portuguese-specific character pattern
        const portuguesePattern = /[ãõçáéíóúâêôà]/i;

        // Get all non-Portuguese translations
        const allTranslations = await ctx.prisma.translation.findMany({
            where: {
                language: {
                    not: "PT",
                },
            },
        });

        // Filter for invalid ones (contain Portuguese characters)
        const invalidIds = allTranslations
            .filter((t) => portuguesePattern.test(t.translated))
            .map((t) => t.id);

        if (invalidIds.length === 0) {
            return {
                message: "No invalid translations found",
                count: 0,
            };
        }

        // Delete invalid translations
        const deleted = await ctx.prisma.translation.deleteMany({
            where: {
                id: {
                    in: invalidIds,
                },
            },
        });

        return {
            message: `Cleared ${deleted.count} invalid translations`,
            count: deleted.count,
        };
    }),

    /**
     * Get all translations for an entity (for debugging)
     */
    getByEntity: protectedProcedure
        .input(
            z.object({
                entityType: z.enum(["menu", "category", "menuItem", "pack", "packSection"]),
                entityId: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const translations = await ctx.prisma.translation.findMany({
                where: {
                    entityType: input.entityType,
                    entityId: input.entityId,
                },
                orderBy: [{ language: "asc" }, { field: "asc" }],
            });

            return translations;
        }),
});
