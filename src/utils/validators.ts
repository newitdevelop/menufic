import { z } from "zod";

export const menuId = z.object({ menuId: z.string().cuid() });
export const categoryId = z.object({ categoryId: z.string().cuid() });
export const restaurantId = z.object({ restaurantId: z.string().cuid() });
export const packId = z.object({ packId: z.string().cuid() });
export const id = z.object({ id: z.string().cuid() });

// Portuguese law allergens (EU Regulation 1169/2011) + "none" option
export const allergenCodes = [
    "cereals", // Cereais que contêm glúten
    "crustaceans", // Crustáceos
    "eggs", // Ovos
    "fish", // Peixes
    "peanuts", // Amendoins
    "soybeans", // Soja
    "milk", // Leite
    "nuts", // Frutos de casca rija
    "celery", // Aipo
    "mustard", // Mostarda
    "sesame", // Sementes de sésamo
    "sulphites", // Dióxido de enxofre e sulfitos
    "lupin", // Tremoço
    "molluscs", // Moluscos
    "none", // None / Nenhum
] as const;

// Allergen symbol/emoji mapping for visual display
export const allergenSymbols: Record<(typeof allergenCodes)[number], string> = {
    cereals: "🌾",
    crustaceans: "🦐",
    eggs: "🥚",
    fish: "🐟",
    peanuts: "🥜",
    soybeans: "🫘",
    milk: "🥛",
    nuts: "🌰",
    celery: "🥬",
    mustard: "🌭",
    sesame: "🫘",
    sulphites: "🍷",
    lupin: "🫘",
    molluscs: "🦪",
    none: "✓",
};

export const categoryInput = z.object({
    name: z.string().trim().min(1, "Name is required").max(30, "Name cannot be longer than 30 characters"),
});
export const menuInput = z.object({
    availableTime: z
        .string()
        .trim()
        .max(50, "Available time cannot be longer than 50 characters")
        .optional()
        .transform((val) => (val === "" ? undefined : val)),
    email: z
        .string()
        .trim()
        .optional()
        .transform((val) => (val === "" ? undefined : val))
        .pipe(z.string().email("Invalid email address").optional()),
    reservations: z
        .string()
        .trim()
        .optional()
        .transform((val) => (val === "" ? undefined : val))
        .pipe(z.string().url("Invalid URL").optional()),
    message: z
        .string()
        .trim()
        .max(200, "Message cannot be longer than 200 characters")
        .optional()
        .transform((val) => (val === "" ? undefined : val)),
    name: z.string().trim().min(1, "Name is required").max(30, "Name cannot be longer than 30 characters"),
    telephone: z
        .string()
        .trim()
        .max(20, "Telephone cannot be longer than 20 characters")
        .optional()
        .transform((val) => (val === "" ? undefined : val)),
    isTemporary: z.boolean().default(false),
    startDate: z.date().nullable().optional(),
    endDate: z.date().nullable().optional(),
    isFestive: z.boolean().default(false),
    isActive: z.boolean().default(true),
});
export const menuItemInputBase = z.object({
    currency: z.enum(["€", "$"]).default("€"),
    description: z.string().trim().max(185, "Description cannot be longer than 185 characters"),
    imageBase64: z.string().optional(),
    imagePath: z.string().optional(),
    isAiGeneratedImage: z.boolean().default(false),
    name: z.string().trim().min(1, "Name is required").max(50, "Name cannot be longer than 50 characters"),
    price: z.string().trim().min(1, "Price is required").max(12, "Price cannot be longer than 12 characters"),
    vatIncluded: z.boolean().default(true),
    vatRate: z.union([z.literal(6), z.literal(13), z.literal(23)]).default(23),
    isEdible: z.boolean().default(false),
    allergens: z.array(z.enum(allergenCodes)).default([]),
});

export const menuItemInput = menuItemInputBase.refine(
    (data) => {
        // If isEdible is true, allergens array must not be empty
        if (data.isEdible && data.allergens.length === 0) {
            return false;
        }
        return true;
    },
    {
        message: "Allergen selection is required for edible products",
        path: ["allergens"],
    }
);
export const restaurantInput = z.object({
    contactNo: z.union([
        z
            .string()
            .trim()
            .regex(/^[+]?[(]?[0-9]{3}[)]?[-s.]?[0-9]{3}[-s.]?[0-9]{4,6}$/, "Invalid contact number"),
        z.literal(""),
    ]),
    imageBase64: z.string(),
    imagePath: z.string().min(1, "Image is required"),
    location: z.string().trim().min(1, "Location is required").max(75, "Location cannot be longer than 75 characters"),
    name: z.string().trim().min(1, "Name is required").max(40, "Name cannot be longer than 40 characters"),
    privacyPolicyUrl: z
        .string()
        .trim()
        .transform((val) => (val === "" ? undefined : val))
        .pipe(z.string().url("Invalid URL").optional())
        .optional(),
    termsAndConditionsUrl: z
        .string()
        .trim()
        .transform((val) => (val === "" ? undefined : val))
        .pipe(z.string().url("Invalid URL").optional())
        .optional(),
});
export const bannerInput = z.object({
    imageBase64: z.string().min(1, "Image is required"),
    restaurantId: z.string().cuid(),
});

export const packSectionInput = z.object({
    title: z.string().trim().min(1, "Section title is required").max(50, "Title cannot be longer than 50 characters"),
    items: z.array(z.string().trim().min(1).max(200)).min(1, "At least one item is required"),
    position: z.number().int().min(0),
});

export const packInput = z.object({
    name: z.string().trim().min(1, "Name is required").max(100, "Name cannot be longer than 100 characters"),
    description: z
        .string()
        .trim()
        .max(500, "Description cannot be longer than 500 characters")
        .optional()
        .transform((val) => (val === "" ? undefined : val)),
    price: z.string().trim().min(1, "Price is required").max(12, "Price cannot be longer than 12 characters"),
    currency: z.enum(["€", "$"]).default("€"),
    vatRate: z.union([z.literal(6), z.literal(13), z.literal(23)]).default(23),
    vatIncluded: z.boolean().default(true),
    isActive: z.boolean().default(true),
    sections: z.array(packSectionInput).min(1, "At least one section is required"),
    imageBase64: z.string().optional(),
    imagePath: z.string().optional(),
    isAiGeneratedImage: z.boolean().default(false),
    allergenMap: z.record(z.string(), z.array(z.enum(allergenCodes))).optional(),
});
