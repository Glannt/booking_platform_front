import { Metadata } from "next";
import { translations } from "@/config/translations";
import { getActiveSectionsServer } from "@/lib/api/sections";
import type { SectionDto } from "@/lib/api/sections";
import { getActiveIntercityRoutes, type IntercityRouteDto } from "@/lib/api/intercity";
import { getSharedRoutes, type SharedRouteDto } from "@/lib/api/sharedRoute";
import RentCarClient from "./RentCarClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale || "vi") as keyof typeof translations;
  const t = translations[locale] || translations.vi;
  return {
    title: `${t.rentCar.title} | Minh Khoa Travel`,
    description: t.rentCar.subtitle,
    openGraph: {
      title: `${t.rentCar.title} | Minh Khoa Travel`,
      description: t.rentCar.subtitle,
      type: "website",
    },
  };
}

export default async function IntercityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const resolvedLocale = locale || "vi";

  const [sectionsRes, routesRes, sharedRes] = await Promise.allSettled([
    getActiveSectionsServer("/intercity", resolvedLocale),
    getActiveIntercityRoutes(),
    getSharedRoutes(true),
  ]);

  const sections: SectionDto[] = sectionsRes.status === "fulfilled" ? sectionsRes.value : [];
  const initialRoutes: IntercityRouteDto[] =
    routesRes.status === "fulfilled" && Array.isArray(routesRes.value?.data) ? routesRes.value.data : [];
  const initialSharedRoutes: SharedRouteDto[] =
    sharedRes.status === "fulfilled" && Array.isArray(sharedRes.value) ? sharedRes.value : [];

  return (
    <RentCarClient
      sections={sections}
      initialRoutes={initialRoutes}
      initialSharedRoutes={initialSharedRoutes}
    />
  );
}
