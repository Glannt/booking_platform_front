import { Metadata } from "next";
import { translations } from "@/config/translations";
import { getActiveSectionsServer } from "@/lib/api/sections";
import type { SectionDto } from "@/lib/api/sections";
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
  let sections: SectionDto[] = [];
  try {
    sections = await getActiveSectionsServer("/rent-car", locale);
  } catch {
    sections = [];
  }
  return <RouteDetailClient sections={sections} routeIdentifier={slug} />;
}
