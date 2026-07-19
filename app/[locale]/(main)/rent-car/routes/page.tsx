import { Metadata } from "next";
import { translations } from "@/config/translations";
import { getActiveSectionsServer } from "@/lib/api/sections";
import type { SectionDto } from "@/lib/api/sections";
import RoutesListingClient from "./RoutesListingClient";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params.locale || "vi";
  const t = translations[locale as "vi" | "en" | "ko" | "ru"] || translations.vi;
  return {
    title: `${locale === "vi" ? "Tất cả tuyến xe đi tỉnh" : "All Intercity Routes"} | Minh Khoa Travel`,
    description: locale === "vi"
      ? "Danh sách tất cả tuyến xe đi tỉnh từ Nha Trang: Đà Lạt, Mũi Né, Phan Rang, Buôn Ma Thuột. Xem giá, giờ khởi hành và loại xe."
      : "All intercity routes from Nha Trang: Da Lat, Mui Ne, Phan Rang, Buon Ma Thuot. View prices, departure times and vehicle types.",
    openGraph: {
      title: `${locale === "vi" ? "Tất cả tuyến xe đi tỉnh" : "All Intercity Routes"} | Minh Khoa Travel`,
      description: locale === "vi"
        ? "Danh sách tất cả tuyến xe đi tỉnh từ Nha Trang: Đà Lạt, Mũi Né, Phan Rang, Buôn Ma Thuột."
        : "All intercity routes from Nha Trang: Da Lat, Mui Ne, Phan Rang, Buon Ma Thuot.",
      type: "website",
    },
  };
}

export default async function RoutesListingPage({ params }: { params: { locale: string } }) {
  const locale = params.locale || "vi";
  let sections: SectionDto[] = [];
  try {
    sections = await getActiveSectionsServer("/rent-car/routes", locale);
  } catch {
    sections = [];
  }
  return <RoutesListingClient sections={sections} />;
}
