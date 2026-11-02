import { Metadata } from "next";
import { translations } from "@/config/translations";
import { getActiveSectionsServer } from "@/lib/api/sections";
import type { SectionDto } from "@/lib/api/sections";
import TourConfirmClient from "./TourConfirmClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: `${locale === "vi" ? "Xác nhận đặt tour" : "Confirm Tour Booking"} | Minh Khoa Travel`,
    description: locale === "vi"
      ? "Xác nhận thông tin và hoàn tất đặt tour."
      : "Review and finalize your tour booking.",
    openGraph: {
      title: `${locale === "vi" ? "Xác nhận đặt tour" : "Confirm Tour Booking"} | Minh Khoa Travel`,
      description: locale === "vi"
        ? "Xác nhận thông tin và hoàn tất đặt tour."
        : "Review and finalize your tour booking.",
      type: "website",
    },
  };
}

import { redirect, RedirectType } from "next/navigation";
import { getTourByIdOrSlug } from "@/lib/api/tours";
import { getCanonicalSlug, isNumeric } from "@/lib/slug-helpers";

export default async function TourConfirmPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;

  if (isNumeric(slug)) {
    try {
      const res = await getTourByIdOrSlug(slug);
      if (res?.data) {
        const canonicalSlug = getCanonicalSlug(res.data, locale, "tour");
        if (canonicalSlug && canonicalSlug !== slug && !isNumeric(canonicalSlug)) {
          redirect(`/${locale}/tours/${canonicalSlug}/confirm?tourId=${slug}`, RedirectType.replace);
        }
      }
    } catch {
      // Fall through to client component
    }
  }

  let sections: SectionDto[] = [];
  try {
    sections = await getActiveSectionsServer("/tours", locale);
  } catch {
    sections = [];
  }
  return <TourConfirmClient tourIdentifier={slug} sections={sections} />;
}
