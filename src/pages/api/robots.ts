import type { NextApiRequest, NextApiResponse } from "next";

import { env } from "src/env/client.mjs";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const prodUrl = env.NEXT_PUBLIC_PROD_URL || "https://menufic.com";

    const robotsTxt = `# *
User-agent: *
Allow: /

# Disallow all non-public pages
Disallow: /auth/
Disallow: /venue/index
Disallow: /venue/*/banners
Disallow: /venue/*/edit-menu
Disallow: /venue/*/preview
Disallow: /explore

# Host
Host: ${prodUrl}

# Sitemaps
Sitemap: ${prodUrl}/sitemap.xml
`;

    res.setHeader("Content-Type", "text/plain");
    res.status(200).send(robotsTxt);
}
