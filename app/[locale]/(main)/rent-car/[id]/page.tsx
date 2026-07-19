import { Metadata } from "next";
import { translations } from "@/config/translations";
import { getActiveSectionsServer } from "@/lib/api/sections";
import type { SectionDto } from "@/lib/api/sections";
import RouteDetailClient from "./RouteDetailClient";

export async function generateMetadata({ params }: { params: { id: string; locale: string } }): Promise<Metadata> {
  const locale = params.locale || "vi";
  const t = translations[locale as "vi" | "en" | "ko" | "ru"] || translations.vi;
  return {
    title: `${locale === "vi" ? "Chi tiết tuyến xe" : "Route Detail"} | Minh Khoa Travel`,
    description: locale === "vi"
      ? "Xem chi tiết tuyến xe, bảng giá, giờ khởi hành và loại xe."
      : "View route details, pricing, departure times and vehicle types.",
    openGraph: {
      title: `${locale === "vi" ? "Chi tiết tuyến xe" : "Route Detail"} | Minh Khoa Travel`,
      description: locale === "vi"
        ? "Xem chi tiết tuyến xe, bảng giá, giờ khởi hành và loại xe."
        : "View route details, pricing, departure times and vehicle types.",
      type: "website",
    },
  };
}

export default async function RouteDetailPage({ params }: { params: { id: string; locale: string } }) {
  const locale = params.locale || "vi";
  let sections: SectionDto[] = [];
  try {
    sections = await getActiveSectionsServer("/rent-car", locale);
  } catch {
    sections = [];
  }
  return <RouteDetailClient sections={sections} />;
}
