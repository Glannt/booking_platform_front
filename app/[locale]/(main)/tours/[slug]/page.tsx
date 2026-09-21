import { Metadata } from "next";
import { translations } from "@/config/translations";
import { getActiveSectionsServer } from "@/lib/api/sections";
import type { SectionDto } from "@/lib/api/sections";
import TourDetailClient from "./TourDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = translations[locale as keyof typeof translations] || translations.vi;
  return {
    title: `${t.tours.tourDetailTitle} | Minh Khoa Travel`,
    description: t.tours.tourDetailDescription,
    alternates: {
      canonical: `/${locale}/tours/${slug}`,
    },
    openGraph: {
      title: `${t.tours.tourDetailTitle} | Minh Khoa Travel`,
      description: t.tours.tourDetailDescription,
      type: "website",
    },
  };
}

import { redirect, RedirectType } from "next/navigation";
import { getTourByIdOrSlug } from "@/lib/api/tours";
import { getCanonicalSlug, isNumeric } from "@/lib/slug-helpers";

export default async function TourDetailPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;

  if (isNumeric(slug)) {
    try {
      const res = await getTourByIdOrSlug(slug);
      if (res?.data) {
        const canonicalSlug = getCanonicalSlug(res.data, locale, "tour");
        if (canonicalSlug && canonicalSlug !== slug && !isNumeric(canonicalSlug)) {
          redirect(`/${locale}/tours/${canonicalSlug}?id=${slug}`, RedirectType.replace);
        }
      }
    } catch {
      // Fall through to client component
    }
  }

  const [sectionsRes, tourRes] = await Promise.allSettled([
    getActiveSectionsServer("/tours", locale),
    getTourByIdOrSlug(slug),
  ]);
  const sections: SectionDto[] = sectionsRes.status === "fulfilled" ? sectionsRes.value : [];
  const initialTour = tourRes.status === "fulfilled" && tourRes.value?.data ? tourRes.value.data : null;

  return <TourDetailClient sections={sections} tourIdentifier={slug} initialTour={initialTour} />;
}
