import { Metadata } from "next";
import { translations } from "@/config/translations";
import { getActiveSectionsServer } from "@/lib/api/sections";
import type { SectionDto } from "@/lib/api/sections";
import { getIntercityRouteByIdOrSlug, type IntercityRouteDto } from "@/lib/api/intercity";
import RouteDetailClient from "./RouteDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = rawLocale || "vi";
  const t = translations[locale as "vi" | "en" | "ko" | "ru"] || translations.vi;
  return {
    title: `${t.rentCar.routeDetailTitle} | Minh Khoa Travel`,
    description: t.rentCar.routeDetailDesc,
    openGraph: {
      title: `${t.rentCar.routeDetailTitle} | Minh Khoa Travel`,
      description: t.rentCar.routeDetailDesc,
      type: "website",
    },
  };
}

export default async function RouteDetailPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale: rawLocale } = await params;
  const locale = rawLocale || "vi";

  const [sectionsRes, routeRes] = await Promise.allSettled([
    getActiveSectionsServer("/intercity", locale),
    getIntercityRouteByIdOrSlug(slug),
  ]);

  const sections: SectionDto[] = sectionsRes.status === "fulfilled" ? sectionsRes.value : [];
  const initialRoute: IntercityRouteDto | null =
    routeRes.status === "fulfilled" && routeRes.value?.data ? routeRes.value.data : null;

  return <RouteDetailClient sections={sections} routeIdentifier={slug} initialRoute={initialRoute} />;
}
