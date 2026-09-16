import { Metadata } from "next";
import { translations } from "@/config/translations";
import { getActiveSectionsServer } from "@/lib/api/sections";
import type { SectionDto } from "@/lib/api/sections";
import RoutesListingClient from "./RoutesListingClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = rawLocale || "vi";
  const t = translations[locale as "vi" | "en" | "ko" | "ru"] || translations.vi;
  return {
    title: `${t.rentCar.allIntercityRoutes} | Minh Khoa Travel`,
    description: t.rentCar.allIntercityRoutesDesc,
    openGraph: {
      title: `${t.rentCar.allIntercityRoutes} | Minh Khoa Travel`,
      description: t.rentCar.allIntercityRoutesDesc,
      type: "website",
    },
  };
}

export default async function RoutesListingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale || "vi";
  let sections: SectionDto[] = [];
  try {
    sections = await getActiveSectionsServer("/rent-car/routes", locale);
  } catch {
    sections = [];
  }
  return <RoutesListingClient sections={sections} />;
}
