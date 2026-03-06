import type { NextApiRequest, NextApiResponse } from "next";

import { env } from "src/env/server.mjs";

/**
 * Validates the Authorization: Bearer <key> header against PUBLIC_API_KEY env var.
 * Returns true if request is authorized, or sends a 401 and returns false.
 */
export const requireApiKey = (req: NextApiRequest, res: NextApiResponse): boolean => {
    const apiKey = env.PUBLIC_API_KEY;
    if (!apiKey) {
        // No key configured — allow all requests
        return true;
    }
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${apiKey}`) {
        res.status(401).json({ error: "Unauthorized. Provide a valid API key in the Authorization header." });
        return false;
    }
    return true;
};

/** Build a full ImageKit URL from a stored file path */
export const toImageUrl = (path?: string | null): string | null => {
    if (!path) return null;
    return `${env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}${path}`;
};
