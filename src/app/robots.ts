import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/dashboard", "/vehicles", "/fuel", "/history", "/chat", "/drivers", "/settings", "/api/"] },
    ],
    sitemap: "/sitemap.xml",
  };
}
