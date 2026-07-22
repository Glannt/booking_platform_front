"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Car,
  Users,
  Luggage,
  Fuel,
  CheckCircle,
  Phone,
  Calendar,
  MapPin,
  ShieldCheck,
  Headset,
  MessageCircle,
  ChevronUp,
} from "lucide-react";
import { Button, Skeleton } from "@heroui/react";

import { useI18n } from "@/context/LanguageContext";
import { getVehicleCategories, getRentableVehiclesByCategory, type VehicleCategoryDto, type VehicleDto } from "@/lib/api/fleet";
import { getActiveRentals, getRentalPricesByRental, type RentalDto, type RentalPriceDto } from "@/lib/api/rental";
import type { SectionDto } from "@/lib/api/sections";

interface RentalWithPrice extends RentalDto {
  dailyRate: number;
  category: VehicleCategoryDto | null;
}

interface SelfDriveDetailClientProps {
  sections: SectionDto[];
  categoryId: number;
}

export default function SelfDriveDetailClient({ sections, categoryId }: SelfDriveDetailClientProps) {
  const router = useRouter();
  const { language, t, contacts } = useI18n();
  const vi = language === "vi";

  const prefixUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const segments = url.split("/");
    if (segments.length > 1 && ["vi", "en", "ko", "ru"].includes(segments[1])) return url;
    return `/${language}${url === "/" ? "" : url}`;
  };

  const [category, setCategory] = useState<VehicleCategoryDto | null>(null);
  const [rentals, setRentals] = useState<RentalWithPrice[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showContactMenu, setShowContactMenu] = useState(false);

  const getCatName = (cat: VehicleCategoryDto) => {
    const tr = cat.translations?.find((t) => t.locale === language);
    return tr?.name || cat.code;
  };

  const getCatDesc = (cat: VehicleCategoryDto) => {
    const tr = cat.translations?.find((t) => t.locale === language);
    return tr?.description || "";
  };

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [catsRes, rentalsRes] = await Promise.all([
          getVehicleCategories({ active: true, page: 0, size: 100 }),
          getActiveRentals(),
        ]);

        if (!active) return;

        const cats = (catsRes?.data?.content ?? []) as VehicleCategoryDto[];
        const foundCat = cats.find((c) => c.id === categoryId);

        if (foundCat) {
          setCategory(foundCat);
        }

        const allRentals = (rentalsRes?.data ?? []) as RentalDto[];
        const selfDriveRentals = allRentals.filter((r) => !r.driverRequired && r.vehicleCategoryId === categoryId);

        const rentalPricesResults = await Promise.all(
          selfDriveRentals.map((r) =>
            getRentalPricesByRental(r.id)
              .then((res) => ({
                rentalId: r.id,
                prices: (res?.data ?? []) as RentalPriceDto[],
              }))
              .catch(() => ({ rentalId: r.id, prices: [] as RentalPriceDto[] }))
          )
        );

        const priceMap = new Map<number, RentalPriceDto[]>();
        rentalPricesResults.forEach((p) => priceMap.set(p.rentalId, p.prices));

        const enrichedRentals: RentalWithPrice[] = selfDriveRentals.map((r) => {
          const rentalPrices = priceMap.get(r.id) ?? [];
          const activePrice = rentalPrices.find((p) => p.active && p.vehicleCategoryId === r.vehicleCategoryId);
          const dailyRate = activePrice ? Number(activePrice.amount) : 0;
          const cat = cats.find((c) => c.id === r.vehicleCategoryId) ?? null;
          return { ...r, dailyRate, category: cat };
        });

        if (active) setRentals(enrichedRentals);

        try {
          const vehiclesRes = await getRentableVehiclesByCategory(categoryId);
          if (active) setVehicles((vehiclesRes?.data ?? []) as VehicleDto[]);
        } catch {
          if (active) setVehicles([]);
        }
      } catch (err) {
        console.error("Failed to load self-drive detail:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [categoryId, language]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col font-sans">
        <div className="relative w-full h-[280px] md:h-[340px] bg-slate-900 overflow-hidden">
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
          <div className="max-w-7xl mx-auto w-full px-6 pb-8 relative z-10 space-y-4 pt-40">
            <Skeleton className="h-8 w-48 rounded-lg bg-white/20" />
            <Skeleton className="h-4 w-64 rounded-lg bg-white/20" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Skeleton className="h-48 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
          <div className="lg:col-span-5">
            <Skeleton className="h-96 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col items-center justify-center gap-4">
        <p className="text-sm font-bold text-slate-500">{t.selfDrive.categoryNotFound}</p>
        <Button onClick={() => router.push(prefixUrl("/self-drive"))} className="bg-accent text-white text-xs font-bold px-4 py-2 rounded-xl">
          {t.common.goBack}
        </Button>
      </div>
    );
  }

  const rental = rentals[0];
  const catDesc = getCatDesc(category);
  const features = catDesc.split(/[,\n;•✓]/).map((f) => f.trim()).filter((f) => f.length > 2);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      {/* Hero Banner */}
      <section className="relative w-full h-[280px] md:h-[340px] overflow-hidden flex items-end">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: category.thumbnailUrl ? `url('${category.thumbnailUrl}')` : undefined }}>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 to-slate-950/95" />
        </div>
        {!category.thumbnailUrl && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />

        <div className="max-w-7xl mx-auto w-full px-6 pb-8 relative z-10 text-white space-y-3">
          <Button
            onClick={() => router.push(prefixUrl("/self-drive"))}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-200 hover:text-white bg-black/40 hover:bg-black/60 border-none rounded-full px-4 py-2 cursor-pointer mb-2"
          >
            <ArrowLeft size={13} />
            <span>{t.common.goBack}</span>
          </Button>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-white/70 font-semibold">
              <Car size={14} className="text-white" />
              <span>{t.selfDrive.title}</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight">{getCatName(category)}</h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-white/80 font-semibold">
              <span className="flex items-center gap-1">
                <Users size={13} className="text-white/60" />
                {category.minSeat}-{category.maxSeat} {t.selfDrive.seats}
              </span>
              <span className="flex items-center gap-1">
                <Luggage size={13} className="text-white/60" />
                {category.minLuggage}-{category.maxLuggage} {category.unitLuggage || "kg"}
              </span>
              {rental && (
                <span className="flex items-center gap-1">
                  <Calendar size={13} className="text-white/60" />
                  {rental.minimumDays || 1} {t.selfDrive.minDaysLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Detail Layout */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Category Info */}
        <div className="lg:col-span-7 space-y-6">
          {/* Overview */}
          <div className="bg-white dark:bg-black p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
              {t.selfDrive.overview}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              {catDesc || t.selfDrive.subtitle}
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <Users size={18} className="text-accent mx-auto mb-1" />
                <p className="text-lg font-black text-slate-800 dark:text-white">{category.minSeat}-{category.maxSeat}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{t.selfDrive.seats}</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <Luggage size={18} className="text-accent mx-auto mb-1" />
                <p className="text-lg font-black text-slate-800 dark:text-white">{category.minLuggage}-{category.maxLuggage}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{category.unitLuggage || "kg"}</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <Car size={18} className="text-accent mx-auto mb-1" />
                <p className="text-lg font-black text-slate-800 dark:text-white">{vehicles.length}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{t.selfDrive.capacity}</p>
              </div>
            </div>
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div className="bg-white dark:bg-black p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                {t.selfDrive.keyFeatures}
              </h2>
              <div className="flex flex-wrap gap-2">
                {features.map((f, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-[11px] font-bold bg-accent/8 text-accent px-3 py-1.5 rounded-xl border border-accent/15">
                    <CheckCircle size={12} />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Representative Vehicles */}
          {vehicles.length > 0 && (
            <div className="bg-white dark:bg-black p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                {t.selfDrive.representativeVehicles}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vehicles.slice(0, 6).map((v) => (
                  <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                      {v.thumbnailUrl ? (
                        <img src={v.thumbnailUrl} alt={`${v.brand} ${v.model}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car size={20} className="text-slate-300 dark:text-slate-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{v.brand} {v.model}</p>
                      <p className="text-[10px] text-slate-400">{v.year} · {v.fuelType}</p>
                    </div>
                  </div>
                ))}
              </div>
              {vehicles.length > 6 && (
                <p className="text-[10px] text-slate-400 font-bold text-center">
                  +{vehicles.length - 6} {t.selfDrive.moreVehicles}
                </p>
              )}
            </div>
          )}

          {/* Procedure */}
          <div className="bg-white dark:bg-black p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
              {t.selfDrive.procedureTitle}
            </h2>
            <div className="space-y-3">
              {[
                { step: 1, title: vi ? "Chọn xe & ngày" : "Choose car & date", icon: <Car size={14} className="text-blue-600" /> },
                { step: 2, title: vi ? "Gửi giấy tờ (CCCD + Bằng lái)" : "Submit documents (ID + License)", icon: <CheckCircle size={14} className="text-green-600" /> },
                { step: 3, title: vi ? "Đặt cọc giữ xe" : "Deposit to secure", icon: <ShieldCheck size={14} className="text-amber-600" /> },
                { step: 4, title: vi ? "Nhận xe & tận hưởng" : "Receive car & enjoy", icon: <MapPin size={14} className="text-accent" /> },
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-black flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800">
                    {s.icon}
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-white">{s.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Booking Sidebar */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
          {/* Price Card */}
          <div className="bg-white dark:bg-black p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h3 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider">
              {t.selfDrive.bookNow}
            </h3>

            {rental && (
              <div className="space-y-3">
                <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {t.selfDrive.dailyRate}
                    </span>
                    <span className="text-lg font-black text-accent">
                      {rental.dailyRate > 0 ? `${rental.dailyRate.toLocaleString("vi-VN")}đ` : t.common.contact}
                    </span>
                  </div>
                  {rental.deposit && rental.deposit > 0 && (
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{t.selfDrive.deposit}</span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{rental.deposit.toLocaleString("vi-VN")}đ</span>
                    </div>
                  )}
                </div>
                {rental.minimumDays && rental.minimumDays > 1 && (
                  <p className="text-[10px] text-slate-400 font-bold">
                    {vi ? `Tối thiểu ${rental.minimumDays} ngày` : `Minimum ${rental.minimumDays} days`}
                  </p>
                )}
                <Button
                  onClick={() => router.push(`/${language}/self-drive/booking?vehicleId=${rental.vehicleCategoryId}-${rental.id}`)}
                  className="w-full h-12 rounded-2xl font-black text-sm bg-accent text-white hover:bg-accent-hover shadow-md gap-2 border-none cursor-pointer"
                >
                  <CheckCircle size={15} />
                  {t.selfDrive.bookNow}
                </Button>
              </div>
            )}

            {!rental && (
              <div className="text-center py-4">
                <p className="text-xs text-slate-400 font-bold mb-3">{t.selfDrive.contactForInfo}</p>
                <Button
                  onClick={() => window.open("tel:0764971971")}
                  className="w-full h-12 rounded-2xl font-black text-sm bg-accent text-white hover:bg-accent-hover shadow-md gap-2 border-none cursor-pointer"
                >
                  <Phone size={15} />
                  {`${t.common.callNow} 0764.971.971`}
                </Button>
              </div>
            )}

            <p className="text-[10px] text-center text-slate-450 dark:text-slate-500 font-medium">
              🔒 {t.selfDrive.guaranteeText}
            </p>
          </div>

          {/* Quick Info */}
          <div className="bg-white dark:bg-black p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">{t.selfDrive.quickInfo}</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">{t.selfDrive.seats}</span>
                <span className="font-bold text-slate-700 dark:text-white">{category.minSeat}-{category.maxSeat}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">{t.selfDrive.luggageLabel}</span>
                <span className="font-bold text-slate-700 dark:text-white">{category.minLuggage}-{category.maxLuggage} {category.unitLuggage || "kg"}</span>
              </div>
              {rental?.minimumDays && (
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">{t.selfDrive.minDaysLabel}</span>
                  <span className="font-bold text-slate-700 dark:text-white">{rental.minimumDays} {t.common.days}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">{t.selfDrive.available}</span>
                <span className="font-bold text-green-600">{vehicles.length} {t.selfDrive.capacity}</span>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="bg-blue-50/40 dark:bg-blue-950/20 p-5 rounded-3xl border border-blue-100 dark:border-blue-900/30 space-y-3">
            <p className="text-xs font-bold text-slate-700 dark:text-white flex items-center gap-1.5">
              <Headset size={14} className="text-accent" />
              {t.selfDrive.support247}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              {t.selfDrive.supportDesc}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => window.open(`tel:${contacts.phone}`)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white dark:bg-black py-2.5 rounded-xl text-xs font-black text-slate-700 dark:text-white border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-all"
              >
                <Phone size={13} className="text-accent" />
                {t.common.callNow}
              </button>
              <button
                onClick={() => window.open(contacts.zalo.startsWith("http") ? contacts.zalo : `https://zalo.me/${contacts.zalo}`, "_blank")}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white dark:bg-black py-2.5 rounded-xl text-xs font-black text-slate-700 dark:text-white border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-all"
              >
                <MessageCircle size={13} className="text-accent" />
                Zalo
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Floating contact */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {showContactMenu && (
          <div className="bg-white dark:bg-slate-850 border border-slate-250 dark:border-slate-700 rounded-2xl shadow-2xl p-2.5 w-44 flex flex-col gap-2 animate-fade-in-up">
            <a
              href={`tel:${contacts.phone}`}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-accent/10 hover:text-accent transition-colors no-underline"
            >
              <Phone size={14} className="text-accent" />
              <span>{t.common.callNow}</span>
            </a>
            <a
              href={contacts.zalo.startsWith("http") ? contacts.zalo : `https://zalo.me/${contacts.zalo}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-accent/10 hover:text-accent transition-colors no-underline border-t border-slate-100 dark:border-slate-800"
            >
              <MessageCircle size={14} className="text-accent" />
              <span>Zalo Tư vấn</span>
            </a>
            {contacts.kakaotalk && (
              <a
                href={contacts.kakaotalk.startsWith("http") ? contacts.kakaotalk : `https://pf.kakao.com/${contacts.kakaotalk}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-accent/10 hover:text-accent transition-colors no-underline border-t border-slate-100 dark:border-slate-800"
              >
                <span className="text-accent">💛</span>
                <span>KakaoTalk</span>
              </a>
            )}
            {contacts.whatsapp && (
              <a
                href={contacts.whatsapp.startsWith("http") ? contacts.whatsapp : `https://wa.me/${contacts.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-accent/10 hover:text-accent transition-colors no-underline border-t border-slate-100 dark:border-slate-800"
              >
                <span className="text-accent">💚</span>
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        )}
        <button
          onClick={() => setShowContactMenu(!showContactMenu)}
          className={`p-4 rounded-full border shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer flex items-center justify-center border-none ${showContactMenu ? "bg-accent text-white" : "bg-white dark:bg-black text-accent dark:text-white"}`}
          aria-label="Contact Support"
        >
          <Headset size={22} />
        </button>
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="p-4 rounded-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-accent dark:text-white shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer flex items-center justify-center"
            aria-label="Back to Top"
          >
            <ChevronUp size={22} />
          </button>
        )}
      </div>
    </div>
  );
}
