import { Metadata } from "next";
import { translations } from "@/config/translations";
import { getActiveSectionsServer } from "@/lib/api/sections";
import type { SectionDto } from "@/lib/api/sections";
import RentCarClient from "./RentCarClient";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = (params.locale || "vi") as keyof typeof translations;
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

export default async function RentCarPage({ params }: { params: { locale: string } }) {
  const locale = params.locale || "vi";
  let sections: SectionDto[] = [];
  try {
    sections = await getActiveSectionsServer("/rent-car", locale);
  } catch {
    sections = [];
  }
  return <RentCarClient sections={sections} />;
}
