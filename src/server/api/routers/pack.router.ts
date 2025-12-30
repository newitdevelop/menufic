import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "src/server/api/trpc";
import { encodeImageToBlurhash, getColor, imageKit, rgba2hex, uploadImage } from "src/server/imageUtil";
import { detectAllergensWithAI, isAllergenAIAvailable } from "src/server/services/openai.service";
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
        let imageId: string | undefined;
        if (input.imageBase64) {
            const [uploadedResponse, blurHash, color] = await Promise.all([
                uploadImage(input.imageBase64, `user/${ctx.session.user.id}/pack`),
                encodeImageToBlurhash(input.imageBase64),
                getColor(input.imageBase64),
            ]);

            const image = await ctx.prisma.image.create({
                data: {
                    blurHash,
                    color: rgba2hex(color[0], color[1], color[2]),
                    id: uploadedResponse.fileId,
                    path: uploadedResponse.filePath,
                    isAiGenerated: input.isAiGeneratedImage ?? false,
                },
            });
            imageId = image.id;
        }

        // Use allergen map from input if provided, otherwise use empty map
        const allergenMap: Record<string, string[]> = input.allergenMap || {};

        // Create pack and sections separately to avoid relationMode issues
        const pack = await ctx.prisma.$transaction(async (tx) => {
            // Create the pack first
            const createdPack = await tx.pack.create({
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
                },
            });

            // Create sections separately (using individual creates because createMany doesn't support JSON fields properly)
            await Promise.all(
                input.sections.map((section) => {
                    // Filter allergenMap to only include items in this section
                    const sectionAllergenMap: Record<string, string[]> = {};
                    section.items.forEach((item) => {
                        if (allergenMap[item]) {
                            sectionAllergenMap[item] = allergenMap[item];
                        }
                    });

                    return tx.packSection.create({
                        data: {
                            packId: createdPack.id,
                            title: section.title,
                            items: section.items,
                            itemAllergens: sectionAllergenMap as any,
                            position: section.position,
                            userId: ctx.session.user.id,
                        },
                    });
                })
            );

            // Fetch the complete pack with sections
            const packWithSections = await tx.pack.findUnique({
                where: { id_userId: { id: createdPack.id, userId: ctx.session.user.id } },
                include: {
                    sections: {
                        orderBy: { position: "asc" },
                    },
                    image: true,
                },
            });

            if (!packWithSections) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to create pack",
                });
            }

            return packWithSections;
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
            if (input.imageBase64) {
                // Delete old image if exists
                if (existingPack.imageId) {
                    await imageKit.deleteFile(existingPack.imageId);
                    await ctx.prisma.image.delete({ where: { id: existingPack.imageId } }).catch(() => {
                        // Ignore errors - image might already be deleted
                    });
                }

                // Upload new image
                const [uploadedResponse, blurHash, color] = await Promise.all([
                    uploadImage(input.imageBase64, `user/${ctx.session.user.id}/pack`),
                    encodeImageToBlurhash(input.imageBase64),
                    getColor(input.imageBase64),
                ]);

                const image = await ctx.prisma.image.create({
                    data: {
                        blurHash,
                        color: rgba2hex(color[0], color[1], color[2]),
                        id: uploadedResponse.fileId,
                        path: uploadedResponse.filePath,
                        isAiGenerated: input.isAiGeneratedImage ?? false,
                    },
                });
                imageId = image.id;
            }

            // Use allergen map from input if provided, otherwise use empty map
            const allergenMap: Record<string, string[]> = input.allergenMap || {};

            // Use transaction to ensure atomic operations
            const pack = await ctx.prisma.$transaction(async (tx) => {
                // Delete existing sections first
                await tx.packSection.deleteMany({
                    where: { packId: input.id, userId: ctx.session.user.id },
                });

                // Update pack (without sections in the same operation)
                const updatedPack = await tx.pack.update({
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
                    },
                });

                // Create new sections separately (using individual creates because createMany doesn't support JSON fields properly)
                await Promise.all(
                    input.sections.map((section) => {
                        // Filter allergenMap to only include items in this section
                        const sectionAllergenMap: Record<string, string[]> = {};
                        section.items.forEach((item) => {
                            if (allergenMap[item]) {
                                sectionAllergenMap[item] = allergenMap[item];
                            }
                        });

                        return tx.packSection.create({
                            data: {
                                packId: input.id,
                                title: section.title,
                                items: section.items,
                                itemAllergens: sectionAllergenMap as any,
                                position: section.position,
                                userId: ctx.session.user.id,
                            },
                        });
                    })
                );

                // Fetch the complete pack with sections
                const packWithSections = await tx.pack.findUnique({
                    where: { id_userId: { id: input.id, userId: ctx.session.user.id } },
                    include: {
                        sections: {
                            orderBy: { position: "asc" },
                        },
                        image: true,
                    },
                });

                if (!packWithSections) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Pack not found after update",
                    });
                }

                return packWithSections;
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
            await imageKit.deleteFile(pack.imageId);
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

        return pack;
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

    /** Detect allergens using AI for pack items */
    detectAllergensAI: protectedProcedure
        .input(
            z.object({
                items: z.array(z.string()),
            })
        )
        .mutation(async ({ input }) => {
            if (!isAllergenAIAvailable()) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: "AI allergen detection is not available. OpenAI API key not configured.",
                });
            }

            try {
                // Detect allergens for each item
                const allergenMap: Record<string, string[]> = {};

                await Promise.all(
                    input.items.map(async (item) => {
                        if (item.trim()) {
                            const allergens = await detectAllergensWithAI(item, "");
                            allergenMap[item] = allergens;
                        }
                    })
                );

                return { allergenMap };
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error instanceof Error ? error.message : "Failed to detect allergens",
                });
            }
        }),
});
