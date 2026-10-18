import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aicapitaltracker.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/v1/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
