import { Metadata } from "next";
import { getActiveSectionsServer, type SectionDto } from "@/lib/api/sections";
import VehiclesListingClient from "./VehiclesListingClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isVi = locale === "vi";

  return {
    title: `${isVi ? "Danh Sách Xe Tự Lái" : "Self-Drive Vehicles Catalog"} | Minh Khoa Travel`,
    description: isVi
      ? "Khám phá danh sách xe tự lái 4 chỗ, 7 chỗ đời mới tại Nha Trang. Giá thuê tốt, giao xe tận nơi, thủ tục 15 phút."
      : "Explore modern 4-seater and 7-seater self-drive vehicles in Nha Trang. Competitive rates, door-to-door delivery, 15-minute check-in.",
    alternates: {
      canonical: `/${locale}/self-drive/vehicles`,
    },
    openGraph: {
      title: `${isVi ? "Danh Sách Xe Tự Lái" : "Self-Drive Vehicles Catalog"} | Minh Khoa Travel`,
      description: isVi
        ? "Khám phá danh sách xe tự lái 4 chỗ, 7 chỗ đời mới tại Nha Trang."
        : "Explore modern self-drive vehicles in Nha Trang.",
      type: "website",
    },
  };
}

export default async function SelfDriveVehiclesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  let sections: SectionDto[] = [];
  try {
    sections = await getActiveSectionsServer("/self-drive", locale);
  } catch {
    sections = [];
  }

  return <VehiclesListingClient sections={sections} />;
}
