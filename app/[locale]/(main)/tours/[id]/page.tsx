import { Metadata } from "next";
import { translations } from "@/config/translations";
import { getActiveSectionsServer } from "@/lib/api/sections";
import type { SectionDto } from "@/lib/api/sections";
import TourDetailClient from "./TourDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: `${locale === "vi" ? "Chi tiết tour" : "Tour Detail"} | Minh Khoa Travel`,
    description: locale === "vi"
      ? "Xem chi tiết tour, lịch trình, giá tour và chọn xe đồng hành."
      : "View tour details, itinerary, pricing and choose your vehicle.",
    openGraph: {
      title: `${locale === "vi" ? "Chi tiết tour" : "Tour Detail"} | Minh Khoa Travel`,
      description: locale === "vi"
        ? "Xem chi tiết tour, lịch trình, giá tour và chọn xe đồng hành."
        : "View tour details, itinerary, pricing and choose your vehicle.",
      type: "website",
    },
  };
}

export default async function TourDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const tourId = Number(id);
  let sections: SectionDto[] = [];
  try {
    sections = await getActiveSectionsServer("/tours", locale);
  } catch {
    sections = [];
  }
  return <TourDetailClient sections={sections} tourId={tourId} />;
}
