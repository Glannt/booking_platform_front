"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Skeleton,
  Typography,
} from "@heroui/react";
import {
  Car,
  ShieldCheck,
  Phone,
  MessageCircle,
  Sparkles,
  FileText,
  UserCheck,
  DollarSign,
  ArrowRight,
  Lightbulb,
} from "lucide-react";

import { useI18n } from "@/context/LanguageContext";
import { backendUrl } from "@/lib/api/client";
import { getActiveSections, type SectionDto } from "@/lib/api/sections";
import { getActiveRentals, getRentalPricesByRental, type RentalPriceDto, type RentalDto } from "@/lib/api/selfDrive";
import { getVehicleCategories, getRentableVehiclesByCategory, type VehicleCategoryDto } from "@/lib/api/fleet";
import { getCanonicalSlug } from "@/lib/slug-helpers";
import { HeroBanner } from "@/components/sections/HeroBanner";
import { FaqSection } from "@/components/sections/FaqSection";
import { RentalHorizontalSearch } from "@/components/search-bar/RentalHorizontalSearch";
import { SelfDriveVehicleCard, type SelfDriveVehicleItem } from "@/components/self-drive/SelfDriveVehicleCard";
import { Reveal } from "@/components/Reveal";

interface SelfDriveClientProps {
  sections?: SectionDto[];
  initialVehicles?: SelfDriveVehicleItem[];
}

export default function SelfDriveClient({
  sections: initialSections = [],
  initialVehicles = [],
}: SelfDriveClientProps) {
  const { language, t, contacts } = useI18n();
  const router = useRouter();

  const prefixUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const segments = url.split("/");
    if (segments.length > 1 && ["vi", "en", "ko", "ru"].includes(segments[1])) return url;
    return `/${language}${url === "/" ? "" : url}`;
  };

  const [vehicles, setVehicles] = useState<SelfDriveVehicleItem[]>(initialVehicles);
  const [vehiclesLoading, setVehiclesLoading] = useState(initialVehicles.length === 0);
  const displayedVehicles = vehicles.slice(0, 4);

  const [sections, setSections] = useState<SectionDto[]>(initialSections);
  const [introSection, setIntroSection] = useState<SectionDto | null>(() => {
    return (
      initialSections.find(
        (s) => s.sectionType === "FEATURES" || s.sectionType === "INTRO" || s.sectionType === "TEXT_CONTENT"
      ) || null
    );
  });
  const faqSection = sections.find((s) => s.sectionType === "FAQ") || null;

  const isFirstRender = useRef(true);

  // Re-fetch sections only if initialSections was empty or language changed
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (initialSections.length > 0) return;
    }
    getActiveSections("/self-drive", language)
      .then((secList) => {
        setSections(secList);
        const intro = secList.find(
          (s) => s.sectionType === "FEATURES" || s.sectionType === "INTRO" || s.sectionType === "TEXT_CONTENT"
        );
        if (intro) setIntroSection(intro);
      })
      .catch(() => {});
  }, [language]);

  useEffect(() => {
    // If we already have initialVehicles on first render, skip refetching
    if (initialVehicles.length > 0 && vehicles.length > 0) return;

    let active = true;
    async function loadVehicles() {
      let categories: VehicleCategoryDto[] = [];
      let rentals: RentalDto[] = [];

      try {
        const catRes = await getVehicleCategories({ active: true }, { skipTranslationFilter: true });
        categories = catRes?.data?.content || [];
      } catch (e) {
        console.error("Failed to fetch vehicle categories:", e);
      }

      try {
        const rentRes = await getActiveRentals({ skipTranslationFilter: true });
        const rawRentals = rentRes?.data || [];
        rentals = rawRentals.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      } catch (e) {
        console.error("Failed to fetch active rentals:", e);
      }

      if (!active) return;

      if (rentals.length > 0 && categories.length > 0) {
        const catMap = new Map<number, VehicleCategoryDto>();
        categories.forEach((c) => catMap.set(c.id, c));

        try {
          const [priceResults, categoryThumbResults] = await Promise.all([
            Promise.all(
              rentals
                .filter((r) => !r.driverRequired)
                .map((r) =>
                  getRentalPricesByRental(r.id)
                    .then((res) => ({
                      rentalId: r.id,
                      prices: (res?.data || []) as RentalPriceDto[],
                    }))
                    .catch(() => ({ rentalId: r.id, prices: [] as RentalPriceDto[] }))
                )
            ),
            Promise.all(
              categories.map(async (c) => {
                if (c.thumbnailUrl) {
                  const url = c.thumbnailUrl.startsWith("http")
                    ? c.thumbnailUrl
                    : `${backendUrl}${c.thumbnailUrl}`;
                  return { categoryId: c.id, thumbnailUrl: url };
                }
                try {
                  const vehsRes = await getRentableVehiclesByCategory(c.id);
                  const firstVehWithImg = (vehsRes?.data || []).find((v) => v.thumbnailUrl);
                  if (firstVehWithImg?.thumbnailUrl) {
                    const url = firstVehWithImg.thumbnailUrl.startsWith("http")
                      ? firstVehWithImg.thumbnailUrl
                      : `${backendUrl}${firstVehWithImg.thumbnailUrl}`;
                    return { categoryId: c.id, thumbnailUrl: url };
                  }
                } catch {
                  // ignore
                }
                return { categoryId: c.id, thumbnailUrl: "" };
              })
            ),
          ]);

          const priceMap = new Map<number, RentalPriceDto[]>();
          priceResults.forEach((p) => priceMap.set(p.rentalId, p.prices));

          const catThumbMap = new Map<number, string>();
          categoryThumbResults.forEach((ct) => catThumbMap.set(ct.categoryId, ct.thumbnailUrl));

          const vehiclesFromApi: SelfDriveVehicleItem[] = rentals
            .filter((r) => !r.driverRequired)
            .map((r) => {
              const cat = catMap.get(r.vehicleCategoryId);
              const nameVi = cat?.translations?.find((t) => t.locale === "vi")?.name || cat?.code || "Phân khúc xe";
              const nameEn = cat?.translations?.find((t) => t.locale === "en")?.name || nameVi;
              const descVi = cat?.translations?.find((t) => t.locale === "vi")?.description || "";
              const descEn = cat?.translations?.find((t) => t.locale === "en")?.description || descVi;

              let capacity = "5";
              let luggage = "2-3 vali";
              if (cat) {
                capacity = cat.minSeat === cat.maxSeat ? `${cat.minSeat}` : `${cat.minSeat}-${cat.maxSeat}`;
                luggage = cat.minLuggage === cat.maxLuggage ? `${cat.minLuggage} vali` : `${cat.minLuggage}-${cat.maxLuggage} vali`;
              }

              const rentalPrices = priceMap.get(r.id) || [];
              const activePrice = rentalPrices.find(
                (p) => p.active && p.vehicleCategoryId === r.vehicleCategoryId
              );
              const dailyRate = activePrice ? Number(activePrice.amount) : 0;
              const categorySlug = getCanonicalSlug(cat, language, "xe-tu-lai");
              const imgUrl = catThumbMap.get(r.vehicleCategoryId) || "";

              const featuresVi = descVi
                .split(/[,\n;•✓]/)
                .map((f) => f.trim())
                .filter((f) => f.length > 2);

              const featuresEn = descEn
                .split(/[,\n;•✓]/)
                .map((f) => f.trim())
                .filter((f) => f.length > 2);

              return {
                id: `rental-${r.id}-${r.vehicleCategoryId}`,
                rentalId: r.id,
                vehicleCategoryId: r.vehicleCategoryId,
                categorySlug,
                nameVi,
                nameEn,
                descVi,
                descEn,
                pricePerDay: dailyRate,
                deposit: r.deposit || 0,
                minimumDays: r.minimumDays || 1,
                featuresVi: featuresVi.length > 0 ? featuresVi : ["Bảo hiểm thân vỏ", "Giao xe tận nơi"],
                featuresEn: featuresEn.length > 0 ? featuresEn : ["Comprehensive insurance", "Door-to-door delivery"],
                capacity,
                luggage,
                transmission: "Tự động",
                fuelType: "Xăng",
                imgUrl,
              };
            });

          if (active) {
            setVehicles(vehiclesFromApi);
          }
        } catch (err) {
          console.error("Failed to load vehicle prices/images:", err);
        }
      }

      if (active) {
        setVehiclesLoading(false);
      }
    }

    loadVehicles();
    return () => {
      active = false;
    };
  }, [language]);

  const handleCall = () => window.open(`tel:${contacts.phone}`);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Hero Section with Stacked RentalHorizontalSearch */}
      <HeroBanner
        sections={sections}
        locale={language}
        layout="stacked"
        className="rounded-none min-h-[380px] md:min-h-[420px]"
      >
        <RentalHorizontalSearch initialMode="self-drive" />
      </HeroBanner>

      {/* Main Layout Area */}
      <main className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-24 sm:pt-28 md:pt-32 pb-16 flex-1 space-y-12">
        {/* Intro Section */}
        {introSection && (
          <Reveal variant="fade">
            <div className="bg-white dark:bg-[var(--bg-card)] rounded-3xl p-6 shadow-sm border border-border leading-relaxed font-semibold text-xs md:text-sm text-foreground/80">
              <p>
                {introSection.translations?.find((t) => t.locale === language)?.description ||
                  introSection.translations?.[0]?.description ||
                  t.selfDrive.introDescription}
              </p>
            </div>
          </Reveal>
        )}

        {/* Catalog & Car list */}
        <Reveal variant="up" className="space-y-5">
          {/* Header Row: Title & Subtitle on Left, 'View All Vehicles' Button on Right (same row) */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-1 border-b border-border/60">
            <div>
              <Typography type="h2" className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                <span className="bg-accent w-2.5 h-5 rounded-full inline-block" />
                {t.selfDrive.vehicleList}
              </Typography>
              <p className="text-xs text-foreground/60 font-semibold pl-1 mt-0.5">
                {t.selfDrive.vehicleListSubtitle}
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push(prefixUrl("/self-drive/vehicles"))}
              className="self-start sm:self-auto px-4 py-2 bg-white dark:bg-[var(--bg-card)] border border-border text-foreground rounded-2xl text-xs font-black hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] shadow-xs cursor-pointer flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <span>{language === "vi" ? "Xem tất cả dòng xe" : "View all vehicles"}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Vehicle Grid using SelfDriveVehicleCard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {vehiclesLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden border border-border shadow-sm bg-white dark:bg-[var(--bg-card)]">
                  <Skeleton className="h-44 sm:h-48 w-full rounded-none" />
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <Skeleton className="h-4 w-36 rounded-lg" />
                      <Skeleton className="h-5 w-14 rounded" />
                    </div>
                    <Skeleton className="h-3 w-48 rounded-lg" />
                    <Skeleton className="h-3 w-full rounded-lg" />
                    <div className="flex flex-wrap gap-1.5 pt-2.5 border-t border-border">
                      <Skeleton className="h-5 w-16 rounded-lg" />
                      <Skeleton className="h-5 w-20 rounded-lg" />
                      <Skeleton className="h-5 w-14 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))
            ) : displayedVehicles.map((vehicle) => (
              <SelfDriveVehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        </Reveal>

        {/* Pricing Table Section */}
        <Reveal variant="up" className="space-y-4 pt-4">
          <Typography type="h2" className="text-base font-extrabold text-foreground flex items-center gap-2">
            <span className="bg-accent w-2.5 h-5 rounded-full inline-block" />
            {t.selfDrive.priceOneWay}
          </Typography>
          <p className="text-xs text-foreground/70 font-medium">
            {t.selfDrive.priceTableDesc}
          </p>

          <div className="overflow-hidden border border-border rounded-2xl bg-white dark:bg-[var(--bg-card)] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/40 dark:bg-black/60 border-b border-border font-black text-foreground text-[11px] uppercase tracking-wider">
                    <th className="p-4">{t.selfDrive.segmentHeader}</th>
                    <th className="p-4 text-right">{t.selfDrive.dailyRateHeader}</th>
                    <th className="p-4 text-right">{t.selfDrive.depositHeader}</th>
                    <th className="p-4 text-right">{t.selfDrive.minDaysHeader}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium text-foreground/80">
                  {vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] transition-colors">
                      <td className="p-4 font-bold text-foreground">
                        {language === "vi" ? v.nameVi : v.nameEn}
                      </td>
                      <td className="p-4 text-right font-extrabold text-accent">
                        {v.pricePerDay.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="p-4 text-right">
                        {v.deposit > 0 ? `${v.deposit.toLocaleString("vi-VN")}đ` : "—"}
                      </td>
                      <td className="p-4 text-right">
                        {v.minimumDays} {t.selfDrive.daysUnit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-accent/5 dark:bg-black/30 border border-accent/20 rounded-2xl flex items-start gap-2.5">
            <Lightbulb size={16} className="text-accent shrink-0 mt-0.5" />
            <p className="text-[11px] text-foreground/70 leading-relaxed font-semibold">
              {t.selfDrive.airportTransferNoticeBefore}{" "}
              <a href="/airport-transfer" className="text-accent underline font-extrabold">
                {t.selfDrive.airportTransferLinkText}
              </a>
              {t.selfDrive.airportTransferNoticeAfter}
            </p>
          </div>
        </Reveal>

        {/* Procedure steps */}
        <Reveal variant="up" className="space-y-4 pt-4">
          <Typography type="h2" className="text-base font-extrabold text-foreground flex items-center gap-2">
            <span className="bg-accent w-2.5 h-5 rounded-full inline-block" />
            {t.selfDrive.procedureTitle}
          </Typography>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                step: 1,
                title: t.selfDrive.step1Title,
                desc: t.selfDrive.step1Desc,
                icon: <Phone className="text-blue-600 dark:text-blue-400" size={16} />,
              },
              {
                step: 2,
                title: t.selfDrive.step2Title,
                desc: t.selfDrive.step2Desc,
                icon: <FileText className="text-amber-600 dark:text-amber-400" size={16} />,
              },
              {
                step: 3,
                title: t.selfDrive.step3Title,
                desc: t.selfDrive.step3Desc,
                icon: <DollarSign className="text-green-600 dark:text-green-400" size={16} />,
              },
              {
                step: 4,
                title: t.selfDrive.step4Title,
                desc: t.selfDrive.step4Desc,
                icon: <UserCheck className="text-indigo-600 dark:text-indigo-400" size={16} />,
              },
              {
                step: 5,
                title: t.selfDrive.step5Title,
                desc: t.selfDrive.step5Desc,
                icon: <ShieldCheck className="text-emerald-600 dark:text-emerald-400" size={16} />,
              },
            ].map((stepItem, idx) => (
              <div key={idx} className="flex gap-4 p-4 bg-white dark:bg-[var(--bg-card)] border border-border rounded-2xl shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-[var(--bg-surface)] flex items-center justify-center shrink-0">
                  {stepItem.icon}
                </div>
                <div className="space-y-1">
                  <Typography type="h4" className="text-xs font-extrabold text-foreground">
                    {stepItem.title}
                  </Typography>
                  <p className="text-xs text-foreground/70 font-medium leading-relaxed">
                    {stepItem.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Call to action panel */}
        <Reveal variant="scale" className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-2 text-center md:text-left">
            <Typography type="h3" className="text-base md:text-lg font-black text-white">
              {t.selfDrive.bookNow}
            </Typography>
            <p className="text-xs text-blue-100 font-semibold max-w-xl leading-relaxed">
              {t.selfDrive.ctaDescription}
            </p>
          </div>

          <div className="flex gap-3 shrink-0">
            <button
              onClick={handleCall}
              className="flex items-center gap-1.5 bg-white text-blue-700 hover:bg-white/90 px-4 py-2.5 rounded-xl text-xs font-black shadow-sm transition-all border-none cursor-pointer"
            >
              <Phone size={14} />
              <span>{`${t.common.callNow} ${contacts.phone}`}</span>
            </button>
            <button
              onClick={() => window.open(contacts.zalo.startsWith("http") ? contacts.zalo : `https://zalo.me/${contacts.zalo}`, "_blank")}
              className="flex items-center gap-1.5 bg-amber-500 text-white hover:bg-amber-600 px-4 py-2.5 rounded-xl text-xs font-black shadow-sm transition-all border-none cursor-pointer"
            >
              <MessageCircle size={14} />
              <span>{t.selfDrive.zaloConsult}</span>
            </button>
          </div>
        </Reveal>

        {/* FAQ (CMS-driven; hidden when no FAQ section configured) */}
        {faqSection && <FaqSection section={faqSection} locale={language} />}
      </main>
    </div>
  );
}
