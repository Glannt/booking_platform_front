import { Metadata } from "next";
import { translations } from "@/config/translations";
import { getActiveSectionsServer } from "@/lib/api/sections";
import type { SectionDto } from "@/lib/api/sections";
import ToursListingClient from "./ToursListingClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale || "vi") as keyof typeof translations;
  const t = translations[locale] || translations.vi;
  return {
    title: `${t.tours.catalogTitle} | Minh Khoa Travel`,
    description: t.tours.subtitle,
    openGraph: {
      title: `${t.tours.catalogTitle} | Minh Khoa Travel`,
      description: t.tours.subtitle,
      type: "website",
    },
  };
}

export default async function ToursPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale || "vi";
  let sections: SectionDto[] = [];
  try {
    sections = await getActiveSectionsServer("/tours", locale);
  } catch {
    sections = [];
  }
  return <ToursListingClient sections={sections} />;
}
