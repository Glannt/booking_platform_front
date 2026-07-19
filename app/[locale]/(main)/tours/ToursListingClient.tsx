"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Compass, Calendar, User, Search, MapPin, Clock, Tag, Star, CheckCircle, Shield, Ship, Utensils, Award } from "lucide-react";
import { Button, Input, Label, SearchField, Skeleton } from "@heroui/react";

import { getTours, getTourCategories, TourDto, TourCategoryDto } from "@/lib/api/tours";
import { useI18n } from "@/context/LanguageContext";
import { formatPrice as _formatPrice } from "@/lib/format";
import { resolveImageUrls } from "@/lib/api/media";
import { ImageGrid } from "@/components/ImageGallery";
import type { SectionDto } from "@/lib/api/sections";

const ENABLE_MOCK_FALLBACK = true;

const MOCK_CATEGORIES: TourCategoryDto[] = [
  { id: 0, code: "all", active: true, translations: [{ locale: "vi", name: "Tất Cả" }, { locale: "en", name: "All Tours" }, { locale: "ko", name: "전체" }, { locale: "ru", name: "Все туры" }] },
  { id: 1, code: "island", active: true, translations: [{ locale: "vi", name: "Tour Đảo Nha Trang" }, { locale: "en", name: "Nha Trang Island Tours" }, { locale: "ko", name: "섬 투어" }, { locale: "ru", name: "Островные туры" }] },
  { id: 2, code: "daily", active: true, translations: [{ locale: "vi", name: "Tour Hằng Ngày" }, { locale: "en", name: "Daily Sightseeing" }, { locale: "ko", name: "일일 투어" }, { locale: "ru", name: "Дневные туры" }] },
];

const MOCK_TOURS: TourDto[] = [
  {
    id: 1,
    tourCategoryId: 1,
    durationDays: 1,
    durationNights: 0,
    minGuest: 2,
    maxGuest: 30,
    active: true,
    thumbnailId: 1,
    imageIds: [1, 2, 3],
    isDefault: true,
    translations: [
      { locale: "vi", name: "Tour 3 Đảo Nha Trang VIP (Cano Cao Tốc)", description: "Trải nghiệm cano cao tốc tham quan Bãi Tranh, Làng Chài và Vịnh San Hô với bữa trưa hải sản vô cùng hấp dẫn.", content: "" },
      { locale: "en", name: "VIP Nha Trang 3 Islands Tour (Speedboat)", description: "Experience high-speed canoe sightseeing Bãi Tranh, Làng Chài, and Coral Bay with a delicious seafood lunch.", content: "" }
    ],
    options: [
      { id: 1, iconUrl: "ship", colorText: "#0ea5e9", colorIcon: "#0ea5e9", translations: [{ locale: "vi", content: "Cano cao tốc" }, { locale: "en", content: "Speedboat" }] },
      { id: 2, iconUrl: "utensils", colorText: "#f97316", colorIcon: "#f97316", translations: [{ locale: "vi", content: "Ăn trưa hải sản" }, { locale: "en", content: "Seafood lunch" }] },
      { id: 3, iconUrl: "shield", colorText: "#22c55e", colorIcon: "#22c55e", translations: [{ locale: "vi", content: "Bảo hiểm trọn gói" }, { locale: "en", content: "Insurance included" }] }
    ],
    days: [],
    prices: [
      { id: 1, vehicleCategoryId: 1, currency: "VND", amount: 600000, active: true },
      { id: 2, vehicleCategoryId: 2, currency: "VND", amount: 900000, active: true }
    ]
  },
  {
    id: 2,
    tourCategoryId: 2,
    durationDays: 1,
    durationNights: 0,
    minGuest: 1,
    maxGuest: 15,
    active: true,
    thumbnailId: 2,
    imageIds: [4, 5, 6],
    isDefault: false,
    translations: [
      { locale: "vi", name: "Tour Khám Phá Thành Phố Nha Trang Danh Thắng", description: "Tham quan Tháp Bà Ponagar, Chùa Long Sơn, Nhà Thờ Núi và Viện Hải Dương Học bằng xe ô tô riêng đời mới.", content: "" },
      { locale: "en", name: "Nha Trang Cultural City Sightseeing Tour", description: "Visit Ponagar Temple, Long Son Pagoda, Stone Church, and Oceanographic Institute in a private air-conditioned car.", content: "" }
    ],
    options: [
      { id: 4, iconUrl: "award", colorText: "#8b5cf6", colorIcon: "#8b5cf6", translations: [{ locale: "vi", content: "Hướng dẫn viên" }, { locale: "en", content: "Local guide" }] },
      { id: 5, iconUrl: "shield", colorText: "#22c55e", colorIcon: "#22c55e", translations: [{ locale: "vi", content: "Nước uống, khăn lạnh" }, { locale: "en", content: "Bottled water" }] }
    ],
    days: [],
    prices: [
      { id: 3, vehicleCategoryId: 1, currency: "VND", amount: 450000, active: true },
      { id: 4, vehicleCategoryId: 2, currency: "VND", amount: 700000, active: true }
    ]
  }
];

interface ToursListingClientProps {
  sections: SectionDto[];
}

export default function ToursListingClient({ sections }: ToursListingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useI18n();

  const heroSection = sections.find(s => s.sectionType === "HERO_BANNER") || null;

  const initialKeyword = searchParams.get("keyword") || "";
  const initialDate = searchParams.get("date") || "";
  const initialGuests = searchParams.get("guests") || "1";

  const [tours, setTours] = useState<TourDto[]>([]);
  const [categories, setCategories] = useState<TourCategoryDto[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState(initialKeyword);
  const [loading, setLoading] = useState(true);
  const [tourImages, setTourImages] = useState<Record<number, { id: number; url: string }[]>>({});

  useEffect(() => {
    if (tours.length === 0) return;
    let cancelled = false;
    const resolve = async () => {
      const entries = await Promise.all(
        tours.map(async (tour) => {
          const imageIds = tour.imageIds || (tour.thumbnailId ? [tour.thumbnailId] : null);
          const resolved = await resolveImageUrls(imageIds);
          return [tour.id, resolved] as const;
        })
      );
      if (!cancelled) {
        setTourImages(Object.fromEntries(entries));
      }
    };
    resolve();
    return () => { cancelled = true; };
  }, [tours]);

  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      try {
        const catRes = await getTourCategories();
        if (catRes?.data?.content && catRes.data.content.length > 0) {
          const list = catRes.data.content;
          setCategories([
            { id: 0, code: "all", active: true, translations: [{ locale: "vi", name: "Tất Cả" }, { locale: "en", name: "All Tours" }] } as any,
            ...list
          ]);
        } else if (ENABLE_MOCK_FALLBACK) {
          setCategories(MOCK_CATEGORIES);
        }

        const toursRes = await getTours({
          search: searchQuery || undefined,
          tourCategoryId: activeCategoryId > 0 ? activeCategoryId : undefined
        });

        if (toursRes?.data?.content && toursRes.data.content.length > 0) {
          setTours(toursRes.data.content);
        } else if (ENABLE_MOCK_FALLBACK) {
          let filtered = MOCK_TOURS;
          if (activeCategoryId > 0) {
            filtered = filtered.filter(t => t.tourCategoryId === activeCategoryId);
          }
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
              t.translations.some(tr => tr.name.toLowerCase().includes(query) || tr.description.toLowerCase().includes(query))
            );
          }
          setTours(filtered);
        }
      } catch (err) {
        console.error("Error fetching tours directory:", err);
        if (ENABLE_MOCK_FALLBACK) {
          setCategories(MOCK_CATEGORIES);
          setTours(MOCK_TOURS);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, [activeCategoryId]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const toursRes = await getTours({
        search: searchQuery || undefined,
        tourCategoryId: activeCategoryId > 0 ? activeCategoryId : undefined
      });
      if (toursRes?.data?.content) {
        setTours(toursRes.data.content);
      } else if (ENABLE_MOCK_FALLBACK) {
        let filtered = MOCK_TOURS;
        if (activeCategoryId > 0) {
          filtered = filtered.filter(t => t.tourCategoryId === activeCategoryId);
        }
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(t =>
            t.translations.some(tr => tr.name.toLowerCase().includes(query) || tr.description.toLowerCase().includes(query))
          );
        }
        setTours(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedCatName = (c: TourCategoryDto) => {
    const translation = c.translations?.find(tr => tr.locale === language) || c.translations?.[0];
    return translation ? translation.name : c.code;
  };

  const getLocalizedName = (t: TourDto) => {
    const translation = t.translations?.find(tr => tr.locale === language) || t.translations?.[0];
    return translation ? translation.name : "Sightseeing Tour";
  };

  const getLocalizedDesc = (t: TourDto) => {
    const translation = t.translations?.find(tr => tr.locale === language) || t.translations?.[0];
    return translation ? translation.description : "";
  };

  const getMinPrice = (t: TourDto) => {
    if (!t.prices || t.prices.length === 0) return 0;
    const activePrices = t.prices.filter(p => p.active);
    if (activePrices.length === 0) return 0;
    return Math.min(...activePrices.map(p => p.amount));
  };

  const formatPrice = (value: number) => {
    if (value <= 0) return t.common.contact;
    return _formatPrice(value, language);
  };

  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case "ship": return <Ship size={11} />;
      case "utensils": return <Utensils size={11} />;
      case "shield": return <Shield size={11} />;
      case "award": return <Award size={11} />;
      default: return <Compass size={11} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      <section className="relative w-full pt-28 pb-12 px-6 bg-slate-900 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: heroSection?.imageUrls?.[0]
              ? `url('${heroSection.imageUrls[0]}')`
              : `url('')`
          }}
        />
        <div className="max-w-7xl mx-auto w-full relative z-10 text-white flex flex-col gap-5 items-center">
          <div className="text-center space-y-2 max-w-2xl">
            <h1 className="text-2xl md:text-4xl font-black tracking-tight uppercase">
              {heroSection?.translations?.find(tr => tr.locale === language)?.title || t.tours.catalogTitle}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 font-medium">
              {heroSection?.translations?.find(tr => tr.locale === language)?.description || t.tours.catalogSubtitle}
            </p>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="w-full max-w-lg flex flex-col sm:flex-row gap-3 items-stretch sm:items-center sm:bg-white sm:dark:bg-black sm:rounded-2xl sm:p-1.5 sm:shadow-xl sm:border sm:border-white/15"
          >
            <div className="flex items-center gap-2 pl-3 flex-1 bg-white dark:bg-black rounded-2xl p-3 sm:p-0 shadow-lg sm:shadow-none border border-slate-200 dark:border-white/10 sm:border-none min-h-[46px] sm:min-h-0">
              <SearchField
                name="search_tour"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e)}
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none w-full p-0"
              >
                <SearchField.Group className="w-full flex items-center bg-transparent border-none shadow-none">
                  <SearchField.SearchIcon className="text-slate-400 dark:text-slate-500 mr-2 flex-shrink-0" />
                  <SearchField.Input
                    placeholder={t.tours.searchPlaceholder}
                    className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none w-full border-none p-0 focus:ring-0"
                  />
                </SearchField.Group>
              </SearchField>
            </div>
            <Button
              type="submit"
              className="bg-accent hover:bg-accent-hover text-white font-bold text-xs py-3 sm:py-2.5 px-6 rounded-2xl sm:rounded-xl border-none cursor-pointer shadow-md sm:shadow-none min-h-[46px] sm:min-h-0 w-full sm:w-auto flex-shrink-0"
            >
              {t.tours.search}
            </Button>
          </form>
        </div>
      </section>

      <main className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 flex-1 flex flex-col gap-6">
        <div className="flex items-center justify-start md:justify-center overflow-x-auto scrollbar-hide pb-2 gap-2 border-b border-slate-200 dark:border-slate-800">
          {categories.map((c) => {
            const isActive = activeCategoryId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategoryId(c.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border-none shrink-0 cursor-pointer ${isActive
                  ? "bg-accent text-white shadow-md"
                  : "bg-white dark:bg-black text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
              >
                {getLocalizedCatName(c)}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-black shadow-sm">
                <Skeleton className="h-48 w-full rounded-none" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-4 w-3/5 rounded-lg" />
                  <Skeleton className="h-3 w-full rounded-lg" />
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Skeleton className="h-5 w-24 rounded-lg" />
                    <Skeleton className="h-8 w-24 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : tours.length === 0 ? (
          <div className="py-24 text-center text-slate-400 text-xs font-bold bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-3xl">
            {t.common.noResults}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tours.map((tour) => {
              const minPrice = getMinPrice(tour);
              const name = getLocalizedName(tour);
              const desc = getLocalizedDesc(tour);
              const duration = tour.durationDays > 0
                ? `${tour.durationDays} ${t.tours.days}`
                : `${tour.durationNights} ${t.tours.days}`;

              const resolvedImgs = tourImages[tour.id] || [];
              const thumbnailImg = resolvedImgs.find(img => img.id === tour.thumbnailId);
              const bgImg = thumbnailImg ? thumbnailImg.url : (resolvedImgs[0]?.url || "/images/placeholder.jpg");

              return (
                <div
                  key={tour.id}
                  className="group bg-white dark:bg-black rounded-3xl border border-slate-250 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300 transform hover:scale-[1.01]"
                >
                  <div>
                    <div className="h-48 overflow-hidden relative bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-center p-4">
                      {bgImg && bgImg !== "/images/placeholder.jpg" ? (
                        <img
                          src={bgImg}
                          alt={name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 z-10"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : null}
                      <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider relative z-0 px-2 line-clamp-3">{name}</span>
                      {resolvedImgs.length > 1 && (
                        <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/40 z-20">
                          <ImageGrid images={resolvedImgs} thumbnailId={tour.thumbnailId} maxVisible={3} className="h-14" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 z-20">
                        <Clock size={10} /><span>{duration}</span>
                      </div>
                      {tour.isDefault && (
                        <div className="absolute top-3 right-3 bg-amber-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                          <Star size={9} className="fill-white" /><span>{t.tours.bestSeller}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 space-y-3">
                      <h3 className="font-extrabold text-base text-slate-950 dark:text-white leading-tight group-hover:text-accent transition-colors line-clamp-2">{name}</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-400 leading-normal line-clamp-2">{desc}</p>
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {tour.options?.slice(0, 3).map((opt) => {
                          const trans = opt.translations?.find(tr => tr.locale === language) || opt.translations?.[0];
                          return (
                            <span key={opt.id} style={{ color: opt.colorText || "#3b82f6", backgroundColor: `${opt.colorText || "#3b82f6"}10` }} className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                              {renderIcon(opt.iconUrl)}<span>{trans ? trans.content : ""}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold block uppercase tracking-wider">{t.tours.priceFrom}</span>
                      <span className="text-base font-black text-amber-500">{formatPrice(minPrice)}</span>
                    </div>
                    <Button
                      onClick={() => router.push(`/${language}/tours/${tour.id}`)}
                      className="bg-orange-500 hover:bg-orange-650 text-white font-extrabold text-[11px] uppercase tracking-wider px-4 py-2 rounded-xl shadow-sm border-none cursor-pointer"
                    >
                      {t.tours.bookNow} →
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
