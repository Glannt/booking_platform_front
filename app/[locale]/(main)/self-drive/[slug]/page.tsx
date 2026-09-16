import { Metadata } from "next";
import { redirect, RedirectType } from "next/navigation";
import { translations } from "@/config/translations";
import { getActiveSectionsServer } from "@/lib/api/sections";
import type { SectionDto } from "@/lib/api/sections";
import { getVehicleCategoryByIdOrSlug } from "@/lib/api/fleet";
import { getCanonicalSlug, isNumeric } from "@/lib/slug-helpers";
import SelfDriveDetailClient from "./SelfDriveDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  return {
    title: `${locale === "vi" ? "Thuê xe tự lái" : "Self-Drive Rental"} | Minh Khoa Travel`,
    description: locale === "vi"
      ? "Xem chi tiết dòng xe, giá thuê tự lái và quy trình đặt xe."
      : "View vehicle category details, self-drive rental pricing and booking process.",
    alternates: {
      canonical: `/${locale}/self-drive/${slug}`,
    },
    openGraph: {
      title: `${locale === "vi" ? "Thuê xe tự lái" : "Self-Drive Rental"} | Minh Khoa Travel`,
      description: locale === "vi"
        ? "Xem chi tiết dòng xe, giá thuê tự lái và quy trình đặt xe."
        : "View vehicle category details, self-drive rental pricing and booking process.",
      type: "website",
    },
  };
}

export default async function SelfDriveDetailPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;

  if (isNumeric(slug)) {
    try {
      const res = await getVehicleCategoryByIdOrSlug(slug);
      if (res?.data) {
        const canonicalSlug = getCanonicalSlug(res.data, locale, "xe-tu-lai");
        if (canonicalSlug && canonicalSlug !== slug && !isNumeric(canonicalSlug)) {
          redirect(`/${locale}/self-drive/${canonicalSlug}?id=${slug}`, RedirectType.replace);
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
  return <SelfDriveDetailClient sections={sections} categoryIdentifier={slug} />;
}

