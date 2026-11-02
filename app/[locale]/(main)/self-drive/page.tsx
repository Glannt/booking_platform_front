import { Metadata } from "next";
import { Suspense } from "react";
import { translations } from "@/config/translations";
import { fetchSelfDriveInitialData } from "@/lib/api/selfdrive-preloader";
import SelfDriveClient from "./SelfDriveClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale || "vi") as keyof typeof translations;
  const t = translations[locale] || translations.vi;
  return {
    title: `${t.selfDrive.title} | Minh Khoa Travel`,
    description: t.selfDrive.subtitle,
    openGraph: {
      title: `${t.selfDrive.title} | Minh Khoa Travel`,
      description: t.selfDrive.subtitle,
      type: "website",
    },
  };
}

export default async function SelfDrivePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const activeLocale = locale || "vi";
  const { sections, vehicles } = await fetchSelfDriveInitialData(activeLocale);

  return (
    <Suspense fallback={null}>
      <SelfDriveClient sections={sections} initialVehicles={vehicles} />
    </Suspense>
  );
}
