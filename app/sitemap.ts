import { MetadataRoute } from "next";

const LOCALES = ["vi", "en", "ko", "ru"];
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://booking.minhkhoatravel.vn";

// Public route paths
const ROUTES = [
  "",
  "/airport-transfer",
  "/rent-car",
  "/self-drive",
  "/tours",
  "/about",
  "/pricing",
  "/blog",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date();

  // Root language selector page
  const rootEntry: MetadataRoute.Sitemap[0] = {
    url: BASE_URL,
    lastModified: currentDate,
    changeFrequency: "weekly",
    priority: 1.0,
  };

  // Localized routes
  const localizedEntries: MetadataRoute.Sitemap = [];

  ROUTES.forEach((route) => {
    LOCALES.forEach((locale) => {
      const url = `${BASE_URL}/${locale}${route}`;
      
      const languages: Record<string, string> = {};
      LOCALES.forEach((l) => {
        languages[l] = `${BASE_URL}/${l}${route}`;
      });

      const isHome = route === "";
      const isKeyService = ["/airport-transfer", "/rent-car", "/self-drive", "/tours"].includes(route);

      localizedEntries.push({
        url,
        lastModified: currentDate,
        changeFrequency: isHome || isKeyService ? "daily" : "weekly",
        priority: isHome ? 1.0 : isKeyService ? 0.9 : 0.7,
        alternates: {
          languages,
        },
      });
    });
  });

  return [rootEntry, ...localizedEntries];
}
