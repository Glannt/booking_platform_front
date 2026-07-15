import { Metadata } from "next";
import { getServiceById } from "@/lib/api/services";
import { translations } from "@/config/translations";
import BookingDetailClient from "./BookingDetailClient";

type Params = Promise<{ id: string; locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id: rawId, locale: rawLocale } = await params;
  const id = Number(rawId);
  const locale = rawLocale || "vi";
  const t = translations[locale as "vi" | "en" | "ko" | "ru"] || translations.vi;

  try {
    const res = await getServiceById(id);
    const service = res.data;
    if (service) {
      const translation = service.translations.find(tr => tr.locale === locale) || service.translations[0];
      return {
        title: `${translation?.name || "Booking"} | Minh Khoa Travel`,
        description: translation?.description || "Book top travel services in Nha Trang.",
        openGraph: {
          title: `${translation?.name || "Booking"} | Minh Khoa Travel`,
          description: translation?.description || "Book top travel services in Nha Trang.",
          type: "website"
        }
      };
    }
  } catch (err) {
    console.error("Failed to fetch service metadata:", err);
  }

  return {
    title: `${t.nav.booking} | Minh Khoa Travel`,
  };
}

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  let service = null;

  try {
    const res = await getServiceById(id);
    service = res.data || null;
  } catch (err) {
    console.error("Failed to fetch service details:", err);
  }

  return <BookingDetailClient id={id} initialService={service} />;
}
