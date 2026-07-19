import { Metadata } from "next";
import { translations } from "@/config/translations";
import { getActiveSectionsServer } from "@/lib/api/sections";
import type { SectionDto } from "@/lib/api/sections";
import AirportTransferClient from "./AirportTransferClient";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = (params.locale || "vi") as keyof typeof translations;
  const t = translations[locale] || translations.vi;
  return {
    title: `${t.airportTransfer.title} | Minh Khoa Travel`,
    description: t.airportTransfer.subtitle,
    openGraph: {
      title: `${t.airportTransfer.title} | Minh Khoa Travel`,
      description: t.airportTransfer.subtitle,
      type: "website",
    },
  };
}

export default async function AirportTransferPage({ params }: { params: { locale: string } }) {
  const locale = params.locale || "vi";
  let sections: SectionDto[] = [];
  try {
    sections = await getActiveSectionsServer("/airport-transfer", locale);
  } catch {
    sections = [];
  }
  return <AirportTransferClient sections={sections} />;
}
