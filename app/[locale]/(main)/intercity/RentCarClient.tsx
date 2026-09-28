"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import {
  Car,
  MapPin,
  ShieldCheck,
  Home as HomeIcon,
  Clock as ClockIcon,
  ArrowRight,
  Users
} from "lucide-react";

import { useI18n } from "@/context/LanguageContext";
import { getActiveIntercityRoutes, type IntercityRouteDto } from "@/lib/api/intercity";
import { getSharedRoutes, type SharedRouteDto } from "@/lib/api/sharedRoute";
import IntercityRouteCard from "@/components/intercity/IntercityRouteCard";
import { HeroBanner } from "@/components/sections/HeroBanner";
import { RentalHorizontalSearch } from "@/components/search-bar/RentalHorizontalSearch";
import { BookingProcessSection } from "@/components/sections/BookingProcessSection";
import { FaqSection } from "@/components/sections/FaqSection";
import type { SectionDto } from "@/lib/api/sections";

interface RentCarClientProps {
  sections: SectionDto[];
  initialRoutes?: IntercityRouteDto[];
  initialSharedRoutes?: SharedRouteDto[];
}

export default function RentCarClient({
  sections,
  initialRoutes = [],
  initialSharedRoutes = [],
}: RentCarClientProps) {
  const { language, t } = useI18n();
  const router = useRouter();

  const heroSection = sections.find(s => s.sectionType === "HERO_BANNER") || null;
  const processSection = sections.find(s => s.sectionType === "BOOKING_PROCESS") || null;
  const featuresSection = sections.find(s => s.sectionType === "FEATURES") || null;
  const faqSection = sections.find(s => s.sectionType === "FAQ") || null;

  const prefixUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const segments = url.split("/");
    if (segments.length > 1 && ["vi", "en", "ko", "ru"].includes(segments[1])) return url;
    return `/${language}${url === "/" ? "" : url}`;
  };

  const [routes, setRoutes] = useState<IntercityRouteDto[]>(initialRoutes);
  const [sharedRoutes, setSharedRoutes] = useState<SharedRouteDto[]>(initialSharedRoutes);

  useEffect(() => {
    if (initialRoutes.length > 0 || initialSharedRoutes.length > 0) return;
    let active = true;
    (async () => {
      try {
        const [routesRes, sharedRes] = await Promise.allSettled([
          getActiveIntercityRoutes(),
          getSharedRoutes(true),
        ]);
        if (!active) return;
        if (routesRes.status === "fulfilled") {
          const data = (routesRes.value?.data ?? []) as IntercityRouteDto[];
          setRoutes(data);
        }
        if (sharedRes.status === "fulfilled") {
          setSharedRoutes(sharedRes.value ?? []);
        }
      } catch (err) {
        console.error("Failed to load intercity routes:", err);
      }
    })();
    return () => { active = false; };
  }, []);

  const sharedRideRoutes = useMemo(() => {
    return routes.filter((r) =>
      Boolean(
        r.hasSharedRoute ||
        r.linkedSharedRouteId ||
        sharedRoutes.some((s) => s.linkedIntercityRouteId === r.id || s.id === r.linkedSharedRouteId)
      )
    );
  }, [routes, sharedRoutes]);

  return (
    <div className="relative flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* Hero Section with Stacked RentalHorizontalSearch */}
      <HeroBanner
        sections={sections}
        locale={language}
        layout="stacked"
        className="rounded-none min-h-[380px] md:min-h-[420px]"
      >
        <RentalHorizontalSearch initialMode="intercity" />
      </HeroBanner>

      {/* Routes Listing */}
      {routes.length > 0 && (
        <section className="w-full pt-24 sm:pt-28 md:pt-32 pb-16 bg-white dark:bg-[var(--bg-page)] border-t border-border">
          <div className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
              <h2 className="text-2xl md:text-3xl font-black text-foreground">
                {t.rentCar.intercityRoutes}
              </h2>
              <p className="text-xs md:text-sm text-foreground/70 font-medium">
                {t.rentCar.intercityRoutesDesc}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {routes.map((route) => (
                <IntercityRouteCard
                  key={route.id}
                  route={route}
                  sharedRoutes={sharedRoutes}
                />
              ))}
            </div>

            <div className="flex justify-center pt-8">
              <Button
                onClick={() => router.push(prefixUrl("/intercity/routes"))}
                className="px-6 py-2.5 bg-white dark:bg-[var(--bg-card)] border border-border text-foreground rounded-2xl text-xs font-black hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] shadow-xs cursor-pointer gap-2"
              >
                {t.rentCar.viewAllRoutes}
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Shared Routes Section */}
      {sharedRideRoutes.length > 0 && (
        <section className="w-full py-16 bg-muted/40 dark:bg-[var(--bg-surface)] border-t border-border">
          <div className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider border border-amber-500/20">
                <Users size={13} />
                {t.rentCar.sharedService}
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-foreground">
                {t.rentCar.sharedRoutesSectionTitle}
              </h2>
              <p className="text-xs md:text-sm text-foreground/70 font-medium">
                {t.rentCar.sharedRoutesSectionDesc}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {sharedRideRoutes.map((route) => (
                <IntercityRouteCard
                  key={`shared-${route.id}`}
                  route={route}
                  sharedRoutes={sharedRoutes}
                  defaultServiceType="SHARED"
                  highlightShared
                />
              ))}
            </div>

            <div className="flex justify-center pt-8">
              <Button
                onClick={() => router.push(prefixUrl("/intercity/routes?service=shared"))}
                className="px-6 py-2.5 bg-amber-500 text-white hover:bg-amber-600 rounded-2xl text-xs font-black shadow-md cursor-pointer gap-2 border-none transition-colors"
              >
                {t.rentCar.viewAllSharedRoutes}
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Benefits Section */}
      <section className="w-full py-20 bg-muted/20 dark:bg-black/10 border-t border-border">
        <div className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-2xl md:text-3xl font-black text-foreground">
              {featuresSection?.translations?.find(tr => tr.locale === language)?.title || t.rentCar.benefitsTitle}
            </h2>
            <p className="text-xs md:text-sm text-foreground/70 font-medium leading-relaxed">
              {featuresSection?.translations?.find(tr => tr.locale === language)?.subtitle
                || heroSection?.translations?.find(tr => tr.locale === language)?.description
                || t.rentCar.heroDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-black/20 dark:border-white/10 p-6 rounded-3xl border border-border shadow-[0_2px_15px_rgba(0,0,0,0.01)] flex flex-col gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-accent"><MapPin size={20} /></div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-foreground">{t.rentCar.benefit1Title}</h4>
                  <p className="text-xs text-foreground/70 leading-relaxed font-medium">{t.rentCar.benefitDesc1}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-black/20 dark:border-white/10 p-6 rounded-3xl border border-border shadow-[0_2px_15px_rgba(0,0,0,0.01)] flex flex-col gap-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600"><Car size={20} /></div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-foreground">{t.rentCar.benefit2Title}</h4>
                  <p className="text-xs text-foreground/70 leading-relaxed font-medium">{t.rentCar.benefitDesc2}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-black/20 dark:border-white/10 p-6 rounded-3xl border border-border shadow-[0_2px_15px_rgba(0,0,0,0.01)] flex flex-col gap-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600"><ShieldCheck size={20} /></div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-foreground">{t.rentCar.benefit3Title}</h4>
                  <p className="text-xs text-foreground/70 leading-relaxed font-medium">{t.rentCar.benefitDesc3}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-black/20 dark:border-white/10 p-6 rounded-3xl border border-border shadow-[0_2px_15px_rgba(0,0,0,0.01)] flex flex-col gap-4">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600"><HomeIcon size={20} /></div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-foreground">{t.rentCar.benefit4Title}</h4>
                  <p className="text-xs text-foreground/70 leading-relaxed font-medium">{t.rentCar.benefitDesc4}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-black/20 dark:border-white/10 p-6 rounded-3xl border border-border shadow-[0_2px_15px_rgba(0,0,0,0.01)] sm:col-span-2 flex flex-col gap-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600"><ClockIcon size={20} /></div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-foreground">{t.rentCar.benefit5Title}</h4>
                  <p className="text-xs text-foreground/70 leading-relaxed font-medium">{t.rentCar.benefitDesc5}</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl overflow-hidden shadow-sm relative h-full min-h-[300px] flex flex-col justify-end p-6">
              <img
                src="/dcar-2.jpg"
                alt="Luxury limousine Dcar"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
              <div className="space-y-2 relative z-10">
                <h4 className="text-white font-extrabold text-sm">{t.rentCar.luxuryTitle}</h4>
                <p className="text-white/80 text-[10px] leading-relaxed">{t.rentCar.luxuryDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Process Section */}
      {processSection && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <BookingProcessSection section={processSection} locale={language} />
        </section>
      )}

      {/* FAQ Section (CMS-driven; hidden when no FAQ section configured) */}
      {faqSection && (
        <FaqSection section={faqSection} locale={language} />
      )}

    </div>
  );
}
