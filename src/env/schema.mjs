// @ts-check
import { z } from "zod";

/**
 * Specify your server-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 */
export const serverSchema = z.object({
    AZURE_AD_CLIENT_ID: z.string().optional(),
    AZURE_AD_CLIENT_SECRET: z.string().optional(),
    AZURE_AD_TENANT_ID: z.string().optional(),
    DATABASE_URL: z.string().url(),
    DEEPL_API_KEY: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    IMAGEKIT_BASE_FOLDER: z.string(),
    IMAGEKIT_PRIVATE_KEY: z.string(),
    IMAGEKIT_PUBLIC_KEY: z.string(),
    NEXTAUTH_SECRET: process.env.NODE_ENV === "production" ? z.string().min(1) : z.string().min(1).optional(),
    NEXTAUTH_URL: z.preprocess(
        // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
        // Since NextAuth automatically uses the VERCEL_URL if present.
        (str) => process.env.VERCEL_URL ?? str,
        // VERCEL_URL doesnt include `https` so it cant be validated as a URL
        process.env.VERCEL ? z.string() : z.string().url()
    ),
    NODE_ENV: z.enum(["development", "test", "production"]),
    OPENAI_API_KEY: z.string().optional(), // OpenAI API key for AI-powered allergen detection
    SENTRY_AUTH_TOKEN: z.string().optional(),
    SENTRY_ORG: z.string().optional(),
    SENTRY_PROJECT: z.string().optional(),
    // SMTP Email Configuration (all optional - email features will be disabled if not set)
    SMTP_HOST: z.string().optional(), // SMTP server hostname (e.g., smtp.gmail.com)
    SMTP_PORT: z.string().optional(), // SMTP port (typically 587 for TLS, 465 for SSL, 25 for unencrypted)
    SMTP_USER: z.string().optional(), // SMTP username/email
    SMTP_PASS: z.string().optional(), // SMTP password
    SMTP_FROM: z.string().optional(), // From email address (defaults to SMTP_USER if not set)
    TEST_MENUFIC_USER_LOGIN_KEY: z.string().optional(),
});

/**
 * Specify your client-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 * To expose them to the client, prefix them with `NEXT_PUBLIC_`.
 */
export const clientSchema = z.object({
    NEXT_PUBLIC_APP_NAME: z.string().optional().default("Menufic"),
    NEXT_PUBLIC_APP_URL: z.string().optional().default("https://menufic.com"),
    NEXT_PUBLIC_CONTACT_EMAIL: z.string().optional().default("bob@email.com"),
    NEXT_PUBLIC_FORM_API_KEY: z.string().optional(),
    NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT: z.string(),
    // Logo path can be either a local path (/logo.svg) or absolute URL (https://...)
    NEXT_PUBLIC_LOGO_PATH: z
        .string()
        .optional()
        .default("/menufic_logo.svg")
        .refine((val) => val.startsWith("/") || val.startsWith("http://") || val.startsWith("https://"), {
            message: "Logo path must be a relative path (starting with /) or absolute URL (starting with http:// or https://)",
        }),
    NEXT_PUBLIC_MAX_BANNERS_PER_RESTAURANT: z.string().regex(/^\d+$/).default("5"),
    NEXT_PUBLIC_MAX_CATEGORIES_PER_MENU: z.string().regex(/^\d+$/).default("10"),
    NEXT_PUBLIC_MAX_MENUS_PER_RESTAURANT: z.string().regex(/^\d+$/).default("5"),
    NEXT_PUBLIC_MAX_MENU_ITEMS_PER_CATEGORY: z.string().regex(/^\d+$/).default("20"),
    NEXT_PUBLIC_MAX_RESTAURANTS_PER_USER: z.string().regex(/^\d+$/).default("5"),
    NEXT_PUBLIC_PRIVACY_POLICY_URL: z.string().optional().default("/privacy-policy"),
    NEXT_PUBLIC_PROD_URL: z.string().optional().default("https://menufic.com"),
    NEXT_PUBLIC_SAMPLE_MENU_ID: z.string().optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
    NEXT_PUBLIC_TERMS_CONDITIONS_URL: z.string().optional().default("/terms-and-conditions"),
});

/**
 * You can't destruct `process.env` as a regular object, so you have to do
 * it manually here. This is because Next.js evaluates this at build time,
 * and only used environment variables are included in the build.
 * @type {{ [k in keyof z.infer<typeof clientSchema>]: z.infer<typeof clientSchema>[k] | undefined }}
 */
export const clientEnv = {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
    NEXT_PUBLIC_FORM_API_KEY: process.env.NEXT_PUBLIC_FORM_API_KEY,
    NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
    NEXT_PUBLIC_LOGO_PATH: process.env.NEXT_PUBLIC_LOGO_PATH,
    NEXT_PUBLIC_MAX_BANNERS_PER_RESTAURANT: process.env.NEXT_PUBLIC_MAX_BANNERS_PER_RESTAURANT,
    NEXT_PUBLIC_MAX_CATEGORIES_PER_MENU: process.env.NEXT_PUBLIC_MAX_CATEGORIES_PER_MENU,
    NEXT_PUBLIC_MAX_MENUS_PER_RESTAURANT: process.env.NEXT_PUBLIC_MAX_MENUS_PER_RESTAURANT,
    NEXT_PUBLIC_MAX_MENU_ITEMS_PER_CATEGORY: process.env.NEXT_PUBLIC_MAX_MENU_ITEMS_PER_CATEGORY,
    NEXT_PUBLIC_MAX_RESTAURANTS_PER_USER: process.env.NEXT_PUBLIC_MAX_RESTAURANTS_PER_USER,
    NEXT_PUBLIC_PRIVACY_POLICY_URL: process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL,
    NEXT_PUBLIC_PROD_URL: process.env.NEXT_PUBLIC_PROD_URL,
    NEXT_PUBLIC_SAMPLE_MENU_ID: process.env.NEXT_PUBLIC_SAMPLE_MENU_ID,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_TERMS_CONDITIONS_URL: process.env.NEXT_PUBLIC_TERMS_CONDITIONS_URL,
};
