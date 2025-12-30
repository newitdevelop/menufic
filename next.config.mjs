// @ts-check
import { withSentryConfig } from "@sentry/nextjs";
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
if (!process.env.SKIP_ENV_VALIDATION) {
    await import("./src/env/server.mjs");
}

/** @type {import("next").NextConfig} */
const config = {
    i18n: { defaultLocale: "en", locales: ["en"] },
    images: {
        formats: ["image/avif", "image/webp"],
        remotePatterns: [{ hostname: "ik.imagekit.io", pathname: "/**", protocol: "https" }],
        unoptimized: true,
        // Optimize for Smart TV displays
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },
    reactStrictMode: false,
    sentry: {
        hideSourceMaps: true,
    },
    swcMinify: true,
    // Compiler options for Smart TVs (Samsung Tizen, LG WebOS, Philips, Hisense)
    compiler: {
        // Remove console logs in production to reduce bundle size
        removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
        // Emotion support for better CSS-in-JS performance on TVs
        emotion: true,
    },
    // Experimental features for better TV compatibility
    experimental: {
        // Optimize for older browsers
        legacyBrowsers: false,
    },
    // Output standalone for better Docker performance
    output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
    // Webpack optimizations for Smart TVs
    webpack: (config, { isServer }) => {
        if (!isServer) {
            // Reduce bundle size for client-side (TV browsers have limited memory)
            config.optimization = {
                ...config.optimization,
                minimize: true,
                splitChunks: {
                    chunks: "all",
                    cacheGroups: {
                        default: false,
                        vendors: false,
                        // Vendor chunks - smaller chunks for better loading on slow TVs
                        framework: {
                            name: "framework",
                            chunks: "all",
                            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                            priority: 40,
                            enforce: true,
                        },
                        commons: {
                            name: "commons",
                            minChunks: 2,
                            priority: 20,
                        },
                        lib: {
                            test: /[\\/]node_modules[\\/]/,
                            name(module) {
                                const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)?.[1];
                                return `npm.${packageName?.replace("@", "")}`;
                            },
                            priority: 30,
                            minChunks: 1,
                            reuseExistingChunk: true,
                        },
                    },
                },
            };
        }
        return config;
    },
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    {
                        key: "X-DNS-Prefetch-Control",
                        value: "on",
                    },
                    {
                        key: "X-Frame-Options",
                        value: "SAMEORIGIN",
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "origin-when-cross-origin",
                    },
                    {
                        key: "Access-Control-Allow-Origin",
                        value: "*",
                    },
                    {
                        key: "Access-Control-Allow-Methods",
                        value: "GET, POST, PUT, DELETE, OPTIONS",
                    },
                    {
                        key: "Access-Control-Allow-Headers",
                        value: "X-Requested-With, Content-Type, Authorization",
                    },
                ],
            },
        ];
    },
    async rewrites() {
        return [
            {
                source: "/robots.txt",
                destination: "/api/robots",
            },
        ];
    },
};

const sentryWebpackPluginOptions = {
    dryRun: !process.env.VERCEL,
    silent: true,
};

export default withSentryConfig(config, sentryWebpackPluginOptions);
