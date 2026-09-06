import { Metadata } from "next";
import { translations } from "@/config/translations";
import BookingPageClient from "./BookingPageClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = rawLocale || "vi";
  const t = translations[locale as "vi" | "en" | "ko" | "ru"] || translations.vi;
  return {
    title: `${t.nav.booking} | Minh Khoa Travel`,
    description: locale === "vi" 
      ? "Danh mục dịch vụ Minh Khoa Travel: Xe đón tiễn sân bay Cam Ranh, Thuê xe tự lái, Tour du lịch Nha Trang giá tốt." 
      : "Minh Khoa Travel catalog: Cam Ranh Airport transfer, Self-drive car rental, Nha Trang day tours at the best price.",
    openGraph: {
      title: `${t.nav.booking} | Minh Khoa Travel`,
      description: locale === "vi" 
        ? "Danh mục dịch vụ Minh Khoa Travel: Xe đón tiễn sân bay Cam Ranh, Thuê xe tự lái, Tour du lịch Nha Trang giá tốt." 
        : "Minh Khoa Travel catalog: Cam Ranh Airport transfer, Self-drive car rental, Nha Trang day tours at the best price.",
      type: "website"
    }
  };
}

export default function BookingPage() {
  return <BookingPageClient />;
}
