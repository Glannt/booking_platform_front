"use client";

import React from "react";
import { useI18n } from "@/context/LanguageContext";
import { MapPin, Clock, Phone, Navigation, Plane } from "lucide-react";
import { Button } from "@heroui/react";
import { Reveal } from "@/components/Reveal";
import type { SectionDto } from "@/lib/api/sections";

interface CompanyLocationSectionProps {
  section?: SectionDto;
  locale?: string;
}

function getLocalized(val?: any, locale?: string): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  return val[locale || ""] || val["vi"] || val["en"] || Object.values(val)[0] || "";
}

export function CompanyLocationSection({ section, locale }: CompanyLocationSectionProps) {
  const { language, t, contacts } = useI18n();
  const activeLocale = locale || language;

  const trans = section
    ? section.translations?.find((tr) => tr.locale === activeLocale) || section.translations?.[0]
    : null;

  let data: any = {};
  try {
    if (section?.contentData) {
      data = JSON.parse(section.contentData);
    }
  } catch {}

  const title = trans?.title || t.homePage.companyLocationTitle;
  const subtitle = trans?.subtitle || trans?.description || t.homePage.companyLocationSubtitle;
  const btnText = trans?.btnText || t.homePage.companyDirectionsBtn;

  const address = getLocalized(data.address, activeLocale) || t.homePage.companyAddressValue;
  const workingHours = getLocalized(data.workingHours, activeLocale) || t.homePage.companyWorkingHoursValue;
  const hotline = data.hotline || contacts?.phone || "0764971971";
  const hub = getLocalized(data.hub, activeLocale) || t.homePage.companyHubValue;

  const mapQuery = data.mapQuery || "18 Thủy Xưởng, Phương Sơn, Nha Trang, Khánh Hòa";
  const googleMapsUrl =
    data.directionsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  const embedMapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    mapQuery
  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <section className="w-full py-12 md:py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Reveal
            as="span"
            variant="fade"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 dark:bg-accent/20 text-accent text-xs font-extrabold tracking-wider uppercase"
          >
            <MapPin size={13} />
            <span>{title}</span>
          </Reveal>
          <Reveal as="h2" delay={100} className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
            {title}
          </Reveal>
          <Reveal as="p" delay={200} className="text-xs sm:text-sm text-foreground/70 font-medium">
            {subtitle}
          </Reveal>
        </div>

        {/* Content Grid: Info & Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Details Cards */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              {/* Address Card */}
              <Reveal variant="left" className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-accent/10 text-accent shrink-0 mt-0.5">
                  <MapPin size={20} />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider block mb-1">
                    {t.homePage.companyAddressLabel}
                  </span>
                  <p className="text-sm font-extrabold text-foreground leading-snug">
                    {address}
                  </p>
                </div>
              </Reveal>

              {/* Working Hours Card */}
              <Reveal variant="left" delay={100} className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 shrink-0 mt-0.5">
                  <Clock size={20} />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider block mb-1">
                    {t.homePage.companyWorkingHoursLabel}
                  </span>
                  <p className="text-sm font-semibold text-foreground leading-snug">
                    {workingHours}
                  </p>
                </div>
              </Reveal>

              {/* Hotline Card */}
              <Reveal variant="left" delay={200} className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                  <Phone size={20} />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider block mb-1">
                    {t.homePage.companyHotlineLabel}
                  </span>
                  <a
                    href={`tel:${hotline}`}
                    className="text-base font-black text-accent hover:underline inline-block"
                  >
                    {hotline}
                  </a>
                </div>
              </Reveal>

              {/* Airport & Hubs Card */}
              <Reveal variant="left" delay={300} className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 shrink-0 mt-0.5">
                  <Plane size={20} />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider block mb-1">
                    {t.homePage.companyHubLabel}
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-foreground/80 leading-snug">
                    {hub}
                  </p>
                </div>
              </Reveal>
            </div>

            {/* Directions Action */}
            <Reveal variant="left" delay={400}>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline block"
              >
                <Button
                  className="w-full h-12 rounded-xl font-bold text-xs sm:text-sm bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm flex items-center justify-center gap-2 border-none transition-colors cursor-pointer"
                >
                  <Navigation size={16} />
                  <span>{btnText}</span>
                </Button>
              </a>
            </Reveal>
          </div>

          {/* Right Column: Google Maps Embed */}
          <Reveal
            variant="right"
            delay={200}
            duration={900}
            className="lg:col-span-7 min-h-[340px] sm:min-h-[400px] rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] shadow-xs relative"
          >
            <iframe
              title="Minh Khoa Travel Location Map"
              src={embedMapUrl}
              width="100%"
              height="100%"
              className="absolute inset-0 w-full h-full border-0"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
