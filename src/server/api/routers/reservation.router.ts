import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "src/server/api/trpc";
import { sendReservationEmail, isEmailServiceAvailable } from "src/server/services/email.service";
import { reservationSubmissionInput } from "src/utils/validators";

export const reservationRouter = createTRPCRouter({
    /** Submit a reservation request */
    submit: publicProcedure.input(reservationSubmissionInput).mutation(async ({ ctx, input }) => {
        // Get menu details to retrieve reservation email and restaurant info
        const menu = await ctx.prisma.menu.findUnique({
            where: { id: input.menuId },
            include: { restaurant: true },
        });

        if (!menu) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Menu not found",
            });
        }

        if (!menu.restaurant) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Restaurant not found",
            });
        }

        // Check if reservations are enabled
        if ((menu as any).reservationType !== "FORM") {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Reservations are not enabled for this menu",
            });
        }

        // Get reservation email (fallback to menu email if not set)
        const reservationEmail = (menu as any).reservationEmail || menu.email;

        if (!reservationEmail) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "No reservation email configured for this menu",
            });
        }

        // Validate party size
        const maxPartySize = (menu as any).reservationMaxPartySize || 12;
        if (input.partySize > maxPartySize) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Party size exceeds maximum of ${maxPartySize} people`,
            });
        }

        // Validate time slot is within reservation hours
        const startTime = (menu as any).reservationStartTime;
        const endTime = (menu as any).reservationEndTime;

        if (startTime && endTime) {
            const [inputHour, inputMinute] = input.time.split(":").map(Number);
            const [startHour, startMinute] = startTime.split(":").map(Number);
            const [endHour, endMinute] = endTime.split(":").map(Number);

            const inputMinutes = inputHour * 60 + inputMinute;
            const startMinutes = startHour * 60 + startMinute;
            const endMinutes = endHour * 60 + endMinute;

            if (inputMinutes < startMinutes || inputMinutes > endMinutes) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Selected time is outside reservation hours",
                });
            }
        }

        // Send reservation email
        try {
            await sendReservationEmail({
                to: reservationEmail,
                restaurantName: menu.restaurant.name,
                menuName: menu.name,
                date: input.date,
                time: input.time,
                partySize: input.partySize,
                customerEmail: input.email,
                customerPhone: input.phone,
                contactPreference: input.contactPreference,
            });
        } catch (error) {
            console.error("Failed to send reservation email:", error);
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to send reservation request. Please try again later.",
            });
        }

        return {
            success: true,
            message: "Reservation request sent successfully",
        };
    }),
});
