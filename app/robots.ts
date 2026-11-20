import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: { userAgent: "*", allow: "/", disallow: ["/api/admin/", "/api/auth/"] },
        sitemap: `${siteOrigin}/sitemap.xml`,
    };
}
