import { Metadata } from "next";
import { Suspense } from "react";
import { translations } from "@/config/translations";
import { getActiveSectionsServer } from "@/lib/api/sections";
import type { SectionDto } from "@/lib/api/sections";
import AirportTransferClient from "./AirportTransferClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale || "vi") as keyof typeof translations;
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

export default async function AirportTransferPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const activeLocale = locale || "vi";
  let sections: SectionDto[] = [];
  try {
    sections = await getActiveSectionsServer("/airport-transfer", activeLocale);
  } catch {
    sections = [];
  }
  return (
    <Suspense fallback={null}>
      <AirportTransferClient sections={sections} />
    </Suspense>
  );
}
