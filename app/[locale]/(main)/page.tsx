import IndexPageClient from "./IndexPageClient";
import { Metadata } from "next";

async function getFeedbacks() {
  try {
    const backendUrl = process.env.BACKEND_API || "http://localhost:8080";
    const res = await fetch(`${backendUrl}/api/v1/feedbacks`, {
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn("Feedbacks backend fetch returned non-ok:", res.status);
      return [];
    }
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Failed to fetch feedbacks on server:", err);
    return [];
  }
}

type Params = Promise<{ locale: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  return {
    title: "Booking Travel Nha Trang - Dịch Vụ Du Lịch Uy Tín",
    description: "Đặt tour Nha Trang, xe đưa đón sân bay Cam Ranh giá tốt. Thuê xe tự lái, có tài xế, xe sân bay Nha Trang.",
  };
}

export default async function Page({ params }: { params: Params }) {
  const { locale } = await params;
  const feedbacks = await getFeedbacks();

  return <IndexPageClient feedbacks={feedbacks} />;
}
