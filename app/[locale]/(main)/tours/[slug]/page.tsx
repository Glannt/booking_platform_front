import { Metadata } from "next";
import { translations } from "@/config/translations";
import { getActiveSectionsServer } from "@/lib/api/sections";
import type { SectionDto } from "@/lib/api/sections";
import TourDetailClient from "./TourDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = translations[locale as keyof typeof translations] || translations.vi;
  return {
    title: `${t.tours.tourDetailTitle} | Minh Khoa Travel`,
    description: t.tours.tourDetailDescription,
    openGraph: {
      title: `${t.tours.tourDetailTitle} | Minh Khoa Travel`,
      description: t.tours.tourDetailDescription,
      type: "website",
    },
  };
}

export default async function TourDetailPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  let sections: SectionDto[] = [];
  try {
    sections = await getActiveSectionsServer("/tours", locale);
  } catch {
    sections = [];
  }
  return <TourDetailClient sections={sections} tourIdentifier={slug} />;
}
