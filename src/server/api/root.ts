import { categoryRouter } from "./routers/category.router";
import { menuRouter } from "./routers/menu.router";
import { menuItemRouter } from "./routers/menuItem.router";
import { packRouter } from "./routers/pack.router";
import { reservationRouter } from "./routers/reservation.router";
import { restaurantRouter } from "./routers/restaurant.router";
import { translationRouter } from "./routers/translation.router";
import { createTRPCRouter } from "./trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
    category: categoryRouter,
    menu: menuRouter,
    menuItem: menuItemRouter,
    pack: packRouter,
    reservation: reservationRouter,
    restaurant: restaurantRouter,
    translation: translationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
