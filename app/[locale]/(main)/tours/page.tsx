import { Metadata } from "next";
import { translations } from "@/config/translations";
import { getActiveSectionsServer } from "@/lib/api/sections";
import type { SectionDto } from "@/lib/api/sections";
import { getTours, getTourCategories, TourDto, TourCategoryDto } from "@/lib/api/tours";
import ToursListingClient from "./ToursListingClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale || "vi") as keyof typeof translations;
  const t = translations[locale] || translations.vi;
  return {
    title: `${t.tours.catalogTitle} | Minh Khoa Travel`,
    description: t.tours.subtitle,
    openGraph: {
      title: `${t.tours.catalogTitle} | Minh Khoa Travel`,
      description: t.tours.subtitle,
      type: "website",
    },
  };
}

export default async function ToursPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale || "vi";

  const [sectionsRes, toursRes, categoriesRes] = await Promise.allSettled([
    getActiveSectionsServer("/tours", locale),
    getTours({ page: 0, size: 24 }),
    getTourCategories(),
  ]);

  const sections: SectionDto[] = sectionsRes.status === "fulfilled" ? sectionsRes.value : [];
  const initialTours: TourDto[] =
    toursRes.status === "fulfilled" && toursRes.value?.data?.content ? toursRes.value.data.content : [];
  const initialTotalElements: number =
    toursRes.status === "fulfilled"
      ? (toursRes.value?.data?.page?.totalElements ?? initialTours.length)
      : 0;
  const initialCategories: TourCategoryDto[] =
    categoriesRes.status === "fulfilled" && categoriesRes.value?.data?.content
      ? categoriesRes.value.data.content
      : [];

  return (
    <ToursListingClient
      sections={sections}
      initialTours={initialTours}
      initialCategories={initialCategories}
      initialTotalElements={initialTotalElements}
    />
  );
}
