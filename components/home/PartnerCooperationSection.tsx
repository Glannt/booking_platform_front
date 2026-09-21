"use client";

import React from "react";
import { useI18n } from "@/context/LanguageContext";
import { CarFront, Building2, Briefcase, CheckCircle2, Handshake, MessageSquare, Users, LucideIcon } from "lucide-react";
import { Button } from "@heroui/react";
import type { SectionDto } from "@/lib/api/sections";

interface PartnerCooperationSectionProps {
  section?: SectionDto;
  locale?: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  CarFront,
  Building2,
  Briefcase,
  Users,
  Handshake,
};

function getLocalized(val?: any, locale?: string): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  return val[locale || ""] || val["vi"] || val["en"] || Object.values(val)[0] || "";
}

export function PartnerCooperationSection({ section, locale }: PartnerCooperationSectionProps) {
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

  const title = trans?.title || t.homePage.partnerTitle;
  const subtitle = trans?.subtitle || trans?.description || t.homePage.partnerSubtitle;
  const btnText = trans?.btnText || t.homePage.partnerContactBtn;
  const badgeText = getLocalized(data.badge, activeLocale) || "B2B Partnership";

  // Partner items: from CMS or fallback
  const defaultPartnerCards = [
    {
      id: "drivers",
      icon: CarFront,
      title: t.homePage.partnerDriversTitle,
      desc: t.homePage.partnerDriversDesc,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
      borderColor: "border-amber-500/20 dark:border-amber-500/30",
    },
    {
      id: "hotels",
      icon: Building2,
      title: t.homePage.partnerHotelsTitle,
      desc: t.homePage.partnerHotelsDesc,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
      borderColor: "border-blue-500/20 dark:border-blue-500/30",
    },
    {
      id: "agencies",
      icon: Briefcase,
      title: t.homePage.partnerAgenciesTitle,
      desc: t.homePage.partnerAgenciesDesc,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10 dark:bg-purple-500/20",
      borderColor: "border-purple-500/20 dark:border-purple-500/30",
    },
  ];

  const cmsPartners = Array.isArray(data.partners)
    ? data.partners.map((p: any, idx: number) => {
        const IconComp = ICON_MAP[p.icon] || (idx === 0 ? CarFront : idx === 1 ? Building2 : Briefcase);
        const palette =
          idx === 0
            ? { color: "text-amber-500", bg: "bg-amber-500/10 dark:bg-amber-500/20", border: "border-amber-500/20 dark:border-amber-500/30" }
            : idx === 1
            ? { color: "text-blue-500", bg: "bg-blue-500/10 dark:bg-blue-500/20", border: "border-blue-500/20 dark:border-blue-500/30" }
            : { color: "text-purple-500", bg: "bg-purple-500/10 dark:bg-purple-500/20", border: "border-purple-500/20 dark:border-purple-500/30" };

        return {
          id: p.id || `partner-${idx}`,
          icon: IconComp,
          title: getLocalized(p.title, activeLocale),
          desc: getLocalized(p.desc, activeLocale),
          color: palette.color,
          bgColor: palette.bg,
          borderColor: palette.border,
        };
      })
    : null;

  const partnerCards = cmsPartners && cmsPartners.length > 0 ? cmsPartners : defaultPartnerCards;

  // Benefits: from CMS or fallback
  const defaultBenefits = [
    t.homePage.partnerBenefit1,
    t.homePage.partnerBenefit2,
    t.homePage.partnerBenefit3,
  ];

  const cmsBenefits = Array.isArray(data.benefits)
    ? data.benefits.map((b: any) => getLocalized(b, activeLocale)).filter(Boolean)
    : null;

  const benefits = cmsBenefits && cmsBenefits.length > 0 ? cmsBenefits : defaultBenefits;

  const contactLink = data.contactLink || contacts?.zalo || `tel:${contacts?.phone || "0764971971"}`;

  return (
    <section className="w-full py-12 md:py-16 bg-slate-50/50 dark:bg-black/20 border-y border-slate-100 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 dark:bg-accent/20 text-accent text-xs font-extrabold tracking-wider uppercase">
            <Handshake size={14} />
            <span>{badgeText}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-foreground/70 font-medium leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* 3 Partner Groups Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {partnerCards.map((card: any) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className={`p-6 rounded-3xl bg-white dark:bg-[var(--bg-card)] border ${card.borderColor} shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between`}
              >
                <div className="space-y-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl ${card.bgColor} ${card.color} flex items-center justify-center`}
                  >
                    <Icon size={24} />
                  </div>
                  <h3 className="text-base font-extrabold text-foreground">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed font-medium">
                    {card.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Benefits bar & CTA */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[var(--bg-card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Value propositions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full lg:w-auto flex-1">
            {benefits.map((benefit: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-accent shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-foreground/90">
                  {benefit}
                </span>
              </div>
            ))}
          </div>

          {/* Action button */}
          <a
            href={contactLink}
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline shrink-0 w-full sm:w-auto"
          >
            <Button
              className="w-full sm:w-auto h-11 px-6 rounded-xl font-bold text-xs sm:text-sm bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm flex items-center justify-center gap-2 border-none transition-colors cursor-pointer"
            >
              <MessageSquare size={16} />
              <span>{btnText}</span>
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
