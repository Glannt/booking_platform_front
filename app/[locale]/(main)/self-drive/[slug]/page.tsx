import { Metadata } from "next";
import { translations } from "@/config/translations";
import { getActiveSectionsServer } from "@/lib/api/sections";
import type { SectionDto } from "@/lib/api/sections";
import SelfDriveDetailClient from "./SelfDriveDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: `${locale === "vi" ? "Thuê xe tự lái" : "Self-Drive Rental"} | Minh Khoa Travel`,
    description: locale === "vi"
      ? "Xem chi tiết dòng xe, giá thuê tự lái và quy trình đặt xe."
      : "View vehicle category details, self-drive rental pricing and booking process.",
    openGraph: {
      title: `${locale === "vi" ? "Thuê xe tự lái" : "Self-Drive Rental"} | Minh Khoa Travel`,
      description: locale === "vi"
        ? "Xem chi tiết dòng xe, giá thuê tự lái và quy trình đặt xe."
        : "View vehicle category details, self-drive rental pricing and booking process.",
      type: "website",
    },
  };
}

export default async function SelfDriveDetailPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  let sections: SectionDto[] = [];
  try {
    sections = await getActiveSectionsServer("/self-drive", locale);
  } catch {
    sections = [];
  }
  return <SelfDriveDetailClient sections={sections} categoryIdentifier={slug} />;
}
