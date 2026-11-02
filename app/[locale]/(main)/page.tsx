import IndexPageClient from "./IndexPageClient";
import { Metadata } from "next";
import { fetchHomeInitialData } from "@/lib/api/home-preloader";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale } = await params;
  const isVi = locale === "vi";
  return {
    title: isVi
      ? "Booking Travel Nha Trang - Dịch Vụ Du Lịch & Đặt Xe Uy Tín"
      : "Booking Travel Nha Trang - Reliable Travel & Car Services",
    description: isVi
      ? "Đặt tour Nha Trang, xe đưa đón sân bay Cam Ranh giá tốt. Thuê xe tự lái, xe liên tỉnh Nha Trang."
      : "Book Nha Trang tours, Cam Ranh airport transfers, self-drive rentals, and intercity transport at best prices.",
  };
}

export default async function Page({ params }: { params: Params }) {
  const { locale } = await params;
  const initialData = await fetchHomeInitialData(locale);

  return <IndexPageClient initialData={initialData} feedbacks={initialData.feedbacks} />;
}
