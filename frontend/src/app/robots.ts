import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/content/company";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/politika-konfidencialnosti"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
