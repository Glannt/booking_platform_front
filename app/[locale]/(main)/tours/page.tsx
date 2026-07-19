import { Metadata } from "next";
import { translations } from "@/config/translations";
import { getActiveSectionsServer } from "@/lib/api/sections";
import type { SectionDto } from "@/lib/api/sections";
import ToursListingClient from "./ToursListingClient";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = (params.locale || "vi") as keyof typeof translations;
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

export default async function ToursPage({ params }: { params: { locale: string } }) {
  const locale = params.locale || "vi";
  let sections: SectionDto[] = [];
  try {
    sections = await getActiveSectionsServer("/tours", locale);
  } catch {
    sections = [];
  }
  return <ToursListingClient sections={sections} />;
}
