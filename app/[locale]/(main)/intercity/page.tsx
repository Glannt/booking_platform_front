import { Metadata } from "next";
import { translations } from "@/config/translations";
import { getActiveSectionsServer } from "@/lib/api/sections";
import type { SectionDto } from "@/lib/api/sections";
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

export default async function RentCarPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const resolvedLocale = locale || "vi";
  let sections: SectionDto[] = [];
  try {
    sections = await getActiveSectionsServer("/rent-car", resolvedLocale);
  } catch {
    sections = [];
  }
  return <RentCarClient sections={sections} />;
}
