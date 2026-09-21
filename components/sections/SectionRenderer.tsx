"use client";

import React from "react";
import { SectionDto } from "@/lib/api/sections";
import { Shield, DollarSign, Clock, Star, CheckCircle } from "lucide-react";
import { SlideCardSection } from "./SlideCardSection";
import { SlideReviewSection } from "./SlideReviewSection";
import { TravelInspirationSection } from "./TravelInspirationSection";
import { FaqSection } from "./FaqSection";
import { CompanyLocationSection } from "@/components/home/CompanyLocationSection";
import { PartnerCooperationSection } from "@/components/home/PartnerCooperationSection";
import { HomeDestinationSection } from "@/components/home/HomeDestinationSection";
import { HomeToursSection } from "@/components/home/HomeToursSection";
import { HomeSelfDriveSection } from "@/components/home/HomeSelfDriveSection";
import { HomeIntercitySection } from "@/components/home/HomeIntercitySection";
import { HomeAirportTransferSection } from "@/components/home/HomeAirportTransferSection";
import { FormattedDescription } from "@/components/FormattedDescription";
import * as Icons from "@/components/icons";
import type { TourDto } from "@/lib/api/tours";
import type { IntercityRouteDto } from "@/lib/api/intercity";
import type { SharedRouteDto } from "@/lib/api/sharedRoute";
import type { SelfDriveVehicleItem } from "@/components/self-drive/SelfDriveVehicleCard";
import { applyAirportPackageConfig, type AirportPackageCard } from "@/lib/airport-packages";

export interface SectionRendererSystemData {
  tours?: TourDto[];
  vehicles?: SelfDriveVehicleItem[];
  routes?: IntercityRouteDto[];
  sharedRoutes?: SharedRouteDto[];
  airportTransfers?: AirportPackageCard[];
}

interface SectionRendererProps {
  sections: SectionDto[];
  locale: string;
  systemData?: SectionRendererSystemData;
}

const ICONS: Record<string, React.ReactNode> = {
  shield: <Shield size={32} className="text-primary" />,
  dollar: <DollarSign size={32} className="text-primary" />,
  clock: <Clock size={32} className="text-primary" />,
  star: <Star size={32} className="text-primary" />,
  check: <CheckCircle size={32} className="text-primary" />,
};

function FeaturesSection({ section, locale }: { section: SectionDto; locale: string }) {
  const trans =
    section.translations.find((t) => t.locale === locale) ||
    section.translations[0];

  let features: any[] = [];
  try {
    if (section.contentData) {
      const parsed = JSON.parse(section.contentData);
      features = parsed.features || [];
    }
  } catch {}

  const getLocalizedText = (textObj: any) => {
    if (!textObj) return "";
    if (typeof textObj === "string") return textObj;
    return textObj[locale] || textObj["vi"] || textObj["en"] || "";
  };

  const featureLabels: Record<string, Record<string, string>> = {
    safety: { vi: "An toàn tuyệt đối", en: "Absolute Safety", ko: "완전한 안전", ru: "Безопасность" },
    price: { vi: "Giá tốt nhất", en: "Best Price", ko: "최저가", ru: "Лучшая цена" },
    support: { vi: "Hỗ trợ 24/7", en: "24/7 Support", ko: "24/7 지원", ru: "Поддержка 24/7" },
    quality: { vi: "Chất lượng hàng đầu", en: "Top Quality", ko: "최고 품질", ru: "Высокое качество" },
  };

  const isHorizontalLayout = features.some((f) => f.title || f.description);

  if (isHorizontalLayout) {
    return (
      <section className="w-full py-16 bg-muted/30 border-b border-separator/60">
        {trans?.title && (
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-10 text-foreground">
            {trans.title}
          </h2>
        )}
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, idx) => {
            const IconComp = (Icons as any)[f.icon] || Icons.ShieldCheck;

            const styleProps = {
              "--icon-bg-light": f.styles?.iconBg || "rgba(59, 130, 246, 0.1)",
              "--icon-bg-dark": f.styles?.iconBgDark || "rgba(30, 58, 138, 0.3)",
              "--icon-color-light": f.styles?.iconColor || "rgba(37, 99, 235, 1)",
              "--icon-color-dark": f.styles?.iconColorDark || "rgba(96, 165, 250, 1)",
              "--title-color-light": f.styles?.titleColor || "currentColor",
              "--title-color-dark": f.styles?.titleColorDark || "currentColor",
              "--desc-color-light": f.styles?.descColor || "currentColor",
              "--desc-color-dark": f.styles?.descColorDark || "currentColor",
            } as React.CSSProperties;

            return (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 rounded-2xl hover:bg-surface transition-all duration-300"
              >
                <div
                  style={styleProps}
                  className="p-3 rounded-2xl shrink-0 bg-[var(--icon-bg-light)] dark:bg-[var(--icon-bg-dark)] text-[var(--icon-color-light)] dark:text-[var(--icon-color-dark)]"
                >
                  <IconComp size={24} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-foreground">
                    {getLocalizedText(f.title)}
                  </h3>
                  <p className="text-xs mt-1 font-medium leading-relaxed text-foreground/70">
                    {getLocalizedText(f.description)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      {trans?.title && (
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4 text-foreground">
          {trans.title}
        </h2>
      )}
      {trans?.subtitle && (
        <p className="text-center text-foreground/60 mb-10">
          {trans.subtitle}
        </p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {features.map((f, idx) => {
          const IconComp = (Icons as any)[f.icon] || ICONS[f.icon] || <CheckCircle size={32} className="text-primary" />;
          return (
            <div
              key={idx}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-muted/40 border border-separator/60 hover:shadow-md transition-shadow"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                {typeof IconComp === "function" ? <IconComp size={32} className="text-primary" /> : IconComp}
              </div>
              <p className="font-bold text-foreground text-sm">
                {featureLabels[f.key]?.[locale] || f.key}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CtaSection({ section, locale }: { section: SectionDto; locale: string }) {
  const trans =
    section.translations.find((t) => t.locale === locale) ||
    section.translations[0];

  return (
    <section
      className="py-16 rounded-3xl text-center"
      style={{
        backgroundColor: section.bgColor || "#f0fdf4",
        color: section.textColor || "#1a1a2e",
      }}
    >
      {trans?.title && (
        <h2 className="text-3xl md:text-4xl font-extrabold mb-4">{trans.title}</h2>
      )}
      {trans?.description && (
        <FormattedDescription
          description={trans.description}
          className="text-lg opacity-90 max-w-xl mx-auto mb-8 font-medium"
        />
      )}
      {trans?.btnText && trans?.btnLink && (
        <a
          href={trans.btnLink}
          className="inline-flex items-center gap-2 px-8 py-3 bg-accent text-accent-foreground font-bold rounded-xl hover:bg-accent-hover transition-colors shadow-lg"
        >
          {trans.btnText}
        </a>
      )}
    </section>
  );
}

function PromoSection({ section, locale }: { section: SectionDto; locale: string }) {
  const trans =
    section.translations.find((t) => t.locale === locale) ||
    section.translations[0];

  const images = section.imageUrls || [];

  return (
    <section className="py-12">
      <div className="flex flex-col md:flex-row items-center gap-8">
        {images.length > 0 && (
          <div className="w-full md:w-1/2">
            <img
              src={images[0]}
              alt={trans?.title || ""}
              className="w-full h-64 object-cover rounded-2xl"
            />
          </div>
        )}
        <div className={`w-full ${images.length > 0 ? "md:w-1/2" : ""} space-y-4`}>
          {trans?.title && (
            <h2 className="text-3xl font-extrabold text-foreground">
              {trans.title}
            </h2>
          )}
          {trans?.description && (
            <FormattedDescription
              description={trans.description}
              className="text-foreground/80 font-medium"
            />
          )}
          {trans?.btnText && trans?.btnLink && (
            <a
              href={trans.btnLink}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground font-bold rounded-xl hover:bg-accent-hover transition-colors"
            >
              {trans.btnText}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function BannerSection({ section, locale }: { section: SectionDto; locale: string }) {
  const trans =
    section.translations.find((t) => t.locale === locale) ||
    section.translations[0];
  const images = section.imageUrls || [];

  return (
    <section className="relative py-16 rounded-3xl overflow-hidden">
      {images.length > 0 && (
        <img src={images[0]} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 text-center px-6">
        {trans?.title && (
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            {trans.title}
          </h2>
        )}
        {trans?.description && (
          <FormattedDescription
            description={trans.description}
            className="text-white/90 text-lg max-w-xl mx-auto mb-6 font-medium"
          />
        )}
        {trans?.btnText && trans?.btnLink && (
          <a
            href={trans.btnLink}
            className="inline-flex items-center gap-2 px-8 py-3 bg-accent text-accent-foreground font-bold rounded-xl hover:bg-accent-hover transition-colors shadow-lg"
          >
            {trans.btnText}
          </a>
        )}
      </div>
    </section>
  );
}

function SystemCatalogSection({
  section,
  locale,
  systemData,
}: {
  section: SectionDto;
  locale: string;
  systemData?: SectionRendererSystemData;
}) {
  const trans =
    section.translations.find((t) => t.locale === locale) ||
    section.translations[0];

  let config: any = {};
  try {
    if (section.contentData) {
      config = JSON.parse(section.contentData);
    }
  } catch {}

  const systemSource = config.systemSource || "tours";
  const limit = config.itemLimit || config.limit || 8;
  const linkUrl = config.viewAllLink || config.linkUrl || "";
  const title = trans?.title || undefined;
  const subtitle = trans?.subtitle || trans?.description || undefined;

  switch (systemSource) {
    case "destinations":
      return (
        <HomeDestinationSection
          title={title}
          subtitle={subtitle}
          viewAllLink={linkUrl || undefined}
          destinations={config.destinations}
        />
      );
    case "tours":
      return (
        <HomeToursSection
          title={title}
          subtitle={subtitle}
          viewAllLink={linkUrl || undefined}
          tours={systemData?.tours}
          limit={limit}
        />
      );
    case "self-drive":
      return (
        <HomeSelfDriveSection
          title={title}
          subtitle={subtitle}
          viewAllLink={linkUrl || undefined}
          vehicles={systemData?.vehicles}
          limit={limit}
        />
      );
    case "intercity":
      return (
        <HomeIntercitySection
          title={title}
          subtitle={subtitle}
          viewAllLink={linkUrl || undefined}
          routes={systemData?.routes}
          sharedRoutes={systemData?.sharedRoutes}
          limit={limit}
        />
      );
    case "airport-transfer":
      return (
        <HomeAirportTransferSection
          title={title}
          subtitle={subtitle}
          viewAllLink={linkUrl || undefined}
          packages={applyAirportPackageConfig(systemData?.airportTransfers || [], config.packages)}
        />
      );
    default:
      return null;
  }
}

export function SectionRenderer({ sections, locale, systemData }: SectionRendererProps) {
  if (!sections || sections.length === 0) return null;

  return (
    <div className="space-y-8">
      {sections.map((section) => {
        switch (section.sectionType) {
          case "SYSTEM_CATALOG":
            return (
              <SystemCatalogSection
                key={section.id}
                section={section}
                locale={locale}
                systemData={systemData}
              />
            );
          case "FEATURES":
            return <FeaturesSection key={section.id} section={section} locale={locale} />;
          // ponytail: CTA/PROMO/BANNER used to be wrapped by IndexPageClient; keep
          // their horizontal padding here so the global section ordering stays safe.
          case "CTA":
            return (
              <div key={section.id} className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 my-4">
                <CtaSection section={section} locale={locale} />
              </div>
            );
          case "PROMO":
            return (
              <div key={section.id} className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 my-4">
                <PromoSection section={section} locale={locale} />
              </div>
            );
          case "BANNER":
            return (
              <div key={section.id} className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 my-4">
                <BannerSection section={section} locale={locale} />
              </div>
            );
          case "SLIDE_CARD":
            return <SlideCardSection key={section.id} section={section} locale={locale} />;
          case "SLIDE_REVIEW":
            return <SlideReviewSection key={section.id} section={section} locale={locale} />;
          case "INSPIRATION":
            return <TravelInspirationSection key={section.id} section={section} locale={locale} />;
          case "FAQ":
          case "FAQS":
            return <FaqSection key={section.id} section={section} locale={locale} />;
          case "COMPANY_LOCATION":
            return <CompanyLocationSection key={section.id} section={section} locale={locale} />;
          case "PARTNER_COOPERATION":
            return <PartnerCooperationSection key={section.id} section={section} locale={locale} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

export default SectionRenderer;
