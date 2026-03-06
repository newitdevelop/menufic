import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "src/server/api/trpc";
import { enhanceImage } from "src/server/imageUtil";

export const imageRouter = createTRPCRouter({
    /** Enhance a base64 image using Sharp: auto-rotate, normalize exposure, saturation boost, sharpen */
    enhancePhoto: protectedProcedure
        .input(z.object({ imageBase64: z.string().min(1) }))
        .mutation(async ({ input }) => {
            const enhancedBase64 = await enhanceImage(input.imageBase64);
            return { imageBase64: enhancedBase64 };
        }),
});
