import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "src/server/api/trpc";
import { imageKit } from "src/server/imageUtil";
import { invalidateTranslations } from "src/server/services/translation.service";
import { id, menuId, packId, packInput } from "src/utils/validators";

export const packRouter = createTRPCRouter({
    /** Create a new pack under a menu */
    create: protectedProcedure.input(packInput.merge(menuId)).mutation(async ({ ctx, input }) => {
        const lastPack = await ctx.prisma.pack.findFirst({
            orderBy: { position: "desc" },
            where: { menuId: input.menuId, userId: ctx.session.user.id },
        });

        // Handle image upload if provided
        let imageId: string | undefined = undefined;
        if (input.imageBase64 && input.imagePath) {
            const { path, blurHash, color } = await imageKit.uploadImage(
                input.imageBase64,
                input.imagePath,
                ctx.session.user.id
            );

            const image = await ctx.prisma.image.create({
                data: {
                    blurHash,
                    color,
                    id: path,
                    path,
                    isAiGenerated: input.isAiGeneratedImage ?? false,
                },
            });
            imageId = image.id;
        }

        // Create pack with sections
        const pack = await ctx.prisma.pack.create({
            data: {
                name: input.name,
                description: input.description,
                price: input.price,
                currency: input.currency,
                vatRate: input.vatRate,
                vatIncluded: input.vatIncluded,
                isActive: input.isActive,
                position: lastPack ? lastPack.position + 1 : 0,
                menuId: input.menuId,
                userId: ctx.session.user.id,
                imageId,
                sections: {
                    create: input.sections.map((section) => ({
                        title: section.title,
                        items: section.items,
                        position: section.position,
                        userId: ctx.session.user.id,
                    })),
                },
            },
            include: {
                sections: {
                    orderBy: { position: "asc" },
                },
                image: true,
            },
        });

        return pack;
    }),

    /** Update an existing pack */
    update: protectedProcedure
        .input(packInput.merge(id))
        .mutation(async ({ ctx, input }) => {
            // Get existing pack to check ownership and get old image
            const existingPack = await ctx.prisma.pack.findUnique({
                where: { id_userId: { id: input.id, userId: ctx.session.user.id } },
                include: {
                    image: true,
                    sections: true,
                },
            });

            if (!existingPack) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Pack not found",
                });
            }

            // Handle image update
            let imageId: string | undefined = existingPack.imageId ?? undefined;
            if (input.imageBase64 && input.imagePath) {
                // Delete old image if exists
                if (existingPack.imageId) {
                    await imageKit.deleteImage(existingPack.imageId);
                    await ctx.prisma.image.delete({ where: { id: existingPack.imageId } }).catch(() => {
                        // Ignore errors - image might already be deleted
                    });
                }

                // Upload new image
                const { path, blurHash, color } = await imageKit.uploadImage(
                    input.imageBase64,
                    input.imagePath,
                    ctx.session.user.id
                );

                const image = await ctx.prisma.image.create({
                    data: {
                        blurHash,
                        color,
                        id: path,
                        path,
                        isAiGenerated: input.isAiGeneratedImage ?? false,
                    },
                });
                imageId = image.id;
            }

            // Delete existing sections
            await ctx.prisma.packSection.deleteMany({
                where: { packId: input.id, userId: ctx.session.user.id },
            });

            // Update pack with new sections
            const pack = await ctx.prisma.pack.update({
                where: { id_userId: { id: input.id, userId: ctx.session.user.id } },
                data: {
                    name: input.name,
                    description: input.description,
                    price: input.price,
                    currency: input.currency,
                    vatRate: input.vatRate,
                    vatIncluded: input.vatIncluded,
                    isActive: input.isActive,
                    imageId,
                    sections: {
                        create: input.sections.map((section) => ({
                            title: section.title,
                            items: section.items,
                            position: section.position,
                            userId: ctx.session.user.id,
                        })),
                    },
                },
                include: {
                    sections: {
                        orderBy: { position: "asc" },
                    },
                    image: true,
                },
            });

            // Invalidate translations when pack is updated
            await invalidateTranslations("pack", input.id);

            return pack;
        }),

    /** Delete a pack */
    delete: protectedProcedure.input(id).mutation(async ({ ctx, input }) => {
        const pack = await ctx.prisma.pack.findUnique({
            where: { id_userId: { id: input.id, userId: ctx.session.user.id } },
            include: { image: true },
        });

        if (!pack) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Pack not found",
            });
        }

        // Delete image if exists
        if (pack.imageId) {
            await imageKit.deleteImage(pack.imageId);
            await ctx.prisma.image.delete({ where: { id: pack.imageId } }).catch(() => {
                // Ignore errors
            });
        }

        // Delete pack (sections will be cascade deleted)
        await ctx.prisma.pack.delete({
            where: { id_userId: { id: input.id, userId: ctx.session.user.id } },
        });

        // Invalidate translations
        await invalidateTranslations("pack", input.id);

        return { success: true };
    }),

    /** Get all packs for a menu */
    getByMenuId: protectedProcedure.input(menuId).query(async ({ ctx, input }) => {
        const packs = await ctx.prisma.pack.findMany({
            where: {
                menuId: input.menuId,
                userId: ctx.session.user.id,
            },
            include: {
                sections: {
                    orderBy: { position: "asc" },
                },
                image: true,
            },
            orderBy: { position: "asc" },
        });

        return packs;
    }),

    /** Get a single pack by ID */
    getById: protectedProcedure.input(id).query(async ({ ctx, input }) => {
        const pack = await ctx.prisma.pack.findUnique({
            where: { id_userId: { id: input.id, userId: ctx.session.user.id } },
            include: {
                sections: {
                    orderBy: { position: "asc" },
                },
                image: true,
            },
        });

        if (!pack) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Pack not found",
            });
        }

        return pack;
    }),

    /** Reorder packs within a menu */
    reorder: protectedProcedure
        .input(
            z.object({
                menuId: z.string().cuid(),
                packIds: z.array(z.string().cuid()),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Update positions in a transaction
            await ctx.prisma.$transaction(
                input.packIds.map((packId, index) =>
                    ctx.prisma.pack.update({
                        where: { id_userId: { id: packId, userId: ctx.session.user.id } },
                        data: { position: index },
                    })
                )
            );

            return { success: true };
        }),
});
