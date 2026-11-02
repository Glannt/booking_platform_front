import { Metadata } from "next";
import { redirect, RedirectType } from "next/navigation";
import { getActiveSectionsServer } from "@/lib/api/sections";
import type { SectionDto } from "@/lib/api/sections";
import { getVehicleCategoryByIdOrSlug } from "@/lib/api/fleet";
import { getCanonicalSlug, isNumeric } from "@/lib/slug-helpers";
import SelfDriveConfirmClient from "./SelfDriveConfirmClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const title = locale === "vi" ? "Xác nhận thông tin" : "Booking Confirmation";
  return {
    title: `${title} | Minh Khoa Travel`,
    description: locale === "vi"
      ? "Xác nhận thông tin đặt xe tự lái, thời gian, địa điểm giao nhận xe."
      : "Confirm self-drive rental booking details, schedule, and vehicle pickup location.",
    alternates: {
      canonical: `/${locale}/self-drive/${slug}/confirm`,
    },
    openGraph: {
      title: `${title} | Minh Khoa Travel`,
      description: locale === "vi"
        ? "Xác nhận thông tin đặt xe tự lái, thời gian, địa điểm giao nhận xe."
        : "Confirm self-drive rental booking details, schedule, and vehicle pickup location.",
      type: "website",
    },
  };
}

export default async function SelfDriveConfirmPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;

  if (isNumeric(slug)) {
    try {
      const res = await getVehicleCategoryByIdOrSlug(slug);
      if (res?.data) {
        const canonicalSlug = getCanonicalSlug(res.data, locale, "xe-tu-lai");
        if (canonicalSlug && canonicalSlug !== slug && !isNumeric(canonicalSlug)) {
          redirect(`/${locale}/self-drive/${canonicalSlug}/confirm?id=${slug}`, RedirectType.replace);
        }
      }
    } catch {
      // Fall through to client component
    }
  }

  let sections: SectionDto[] = [];
  try {
    sections = await getActiveSectionsServer("/self-drive", locale);
  } catch {
    sections = [];
  }

  return <SelfDriveConfirmClient sections={sections} categoryIdentifier={slug} />;
}
