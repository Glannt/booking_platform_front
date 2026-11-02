import { Metadata } from "next";
import { Suspense } from "react";
import { translations } from "@/config/translations";
import { getActiveSectionsServer } from "@/lib/api/sections";
import type { SectionDto } from "@/lib/api/sections";
import { getActiveAirports, type AirportDto } from "@/lib/api/fleet";
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

  const [sectionsRes, airportsRes] = await Promise.allSettled([
    getActiveSectionsServer("/airport-transfer", activeLocale),
    getActiveAirports(),
  ]);

  const sections: SectionDto[] =
    sectionsRes.status === "fulfilled" && Array.isArray(sectionsRes.value)
      ? sectionsRes.value
      : [];

  const initialAirports: AirportDto[] =
    airportsRes.status === "fulfilled" && Array.isArray(airportsRes.value?.data)
      ? airportsRes.value.data
      : [];

  return (
    <Suspense fallback={null}>
      <AirportTransferClient sections={sections} initialAirports={initialAirports} />
    </Suspense>
  );
}
