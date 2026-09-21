"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Clock,
  Star,
  Search,
  MapPin,
  X,
  Sparkles,
  ChevronDown,
  SlidersHorizontal,
  Calendar as CalendarIcon,
  Check,
  RotateCcw,
} from "lucide-react";
import {
  Button,
  Popover,
  Select,
  ListBox,
  Checkbox,
  Calendar,
  Pagination,
  Skeleton,
} from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { today, getLocalTimeZone } from "@internationalized/date";

import { getTours, getTourCategories, TourDto, TourCategoryDto, getPackagePrice } from "@/lib/api/tours";
import { useI18n } from "@/context/LanguageContext";
import { formatPriceSync as _formatPrice } from "@/lib/format";
import { resolveImageUrls } from "@/lib/api/media";
import { resolveLocalizedName, resolveLocalizedDescription, resolveTranslation } from "@/lib/i18n-helpers";
import { getCanonicalSlug } from "@/lib/slug-helpers";
import type { SectionDto } from "@/lib/api/sections";

interface ToursListingClientProps {
  sections: SectionDto[];
  initialTours?: TourDto[];
  initialCategories?: TourCategoryDto[];
  initialTotalElements?: number;
}

export default function ToursListingClient({
  sections,
  initialTours = [],
  initialCategories = [],
  initialTotalElements = 0,
}: ToursListingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useI18n();

  const heroSection = sections.find((s) => s.sectionType === "HERO_BANNER") || null;
  const faqSection = sections.find((s) => s.sectionType === "FAQ") || null;

  const initialKeyword = searchParams.get("keyword") || searchParams.get("search") || "";
  const initialDate = searchParams.get("date") || "";

  const formattedInitialCategories = useMemo(() => {
    if (!initialCategories || initialCategories.length === 0) return [];
    return [
      {
        id: 0,
        code: "all",
        active: true,
        translations: [
          { locale: "vi", name: "Tất cả" },
          { locale: "en", name: "All Tours" },
          { locale: "ko", name: "전체" },
          { locale: "ru", name: "Все туры" },
        ],
      } as any,
      ...initialCategories,
    ];
  }, [initialCategories]);

  // Data states
  const [tours, setTours] = useState<TourDto[]>(initialTours);
  const [categories, setCategories] = useState<TourCategoryDto[]>(formattedInitialCategories);
  const [activeCategoryId, setActiveCategoryId] = useState<number>(0);
  const [selectedCatIds, setSelectedCatIds] = useState<number[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  const [onlyRecommended, setOnlyRecommended] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState(initialKeyword);
  const [selectedDate, setSelectedDate] = useState<DateValue | null>(null);

  // Pagination states (24 cards per screen)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 24;
  const [totalElements, setTotalElements] = useState<number>(initialTotalElements || initialTours.length);
  const [totalPages, setTotalPages] = useState<number>(Math.ceil((initialTotalElements || initialTours.length) / 24) || 1);

  // Sort & favorites
  const [sortOrder, setSortOrder] = useState<"default" | "price_asc" | "price_desc">("default");
  const [loading, setLoading] = useState(initialTours.length === 0);
  const [tourImages, setTourImages] = useState<Record<number, { id: number; url: string }[]>>({});

  // FAQ expanded state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const kw = searchParams.get("keyword") || searchParams.get("search") || "";
    setSearchQuery(kw);
  }, [searchParams]);

  const activeFilterCount =
    selectedCatIds.length +
    selectedPriceRanges.length +
    selectedDurations.length +
    (onlyRecommended ? 1 : 0);

  const toggleCategory = (catId: number) => {
    setSelectedCatIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const togglePriceRange = (range: string) => {
    setSelectedPriceRanges((prev) =>
      prev.includes(range) ? prev.filter((r) => r !== range) : [...prev, range]
    );
  };

  const toggleDuration = (dur: string) => {
    setSelectedDurations((prev) =>
      prev.includes(dur) ? prev.filter((d) => d !== dur) : [...prev, dur]
    );
  };

  const handleResetFilters = () => {
    setSelectedCatIds([]);
    setSelectedPriceRanges([]);
    setSelectedDurations([]);
    setOnlyRecommended(false);
    setActiveCategoryId(0);
    setSelectedDate(null);
  };

  // Resolve tour images
  useEffect(() => {
    if (tours.length === 0) {
      setTourImages({});
      return;
    }
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
    return () => {
      cancelled = true;
    };
  }, [tours]);

  // Fetch categories once on mount
  useEffect(() => {
    let active = true;
    if (categories.length > 0) return;
    const fetchCategories = async () => {
      try {
        const catRes = await getTourCategories();
        if (catRes?.data?.content && catRes.data.content.length > 0) {
          const list = catRes.data.content;
          if (active) {
            setCategories([
              {
                id: 0,
                code: "all",
                active: true,
                translations: [
                  { locale: "vi", name: "Tất cả" },
                  { locale: "en", name: "All Tours" },
                  { locale: "ko", name: "전체" },
                  { locale: "ru", name: "Все туры" },
                ],
              } as any,
              ...list,
            ]);
          }
        }
      } catch (err) {
        console.error("Error fetching tour categories:", err);
      }
    };
    fetchCategories();
    return () => {
      active = false;
    };
  }, [categories.length]);

  // Fetch tours (size: 24 for 24 cards per screen)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (initialTours.length > 0 && currentPage === 1 && !searchQuery && activeCategoryId === 0) {
        return;
      }
    }

    let active = true;
    const fetchTours = async () => {
      setLoading(true);
      try {
        const toursRes = await getTours({
          page: currentPage - 1,
          size: pageSize,
          search: searchQuery || undefined,
          tourCategoryId: activeCategoryId > 0 ? activeCategoryId : undefined,
        });

        if (!active) return;

        if (toursRes?.data?.content) {
          setTours(toursRes.data.content);
          setTotalElements(toursRes.data.page?.totalElements ?? toursRes.data.content.length);
          setTotalPages(toursRes.data.page?.totalPages ?? 1);
        } else {
          setTours([]);
          setTotalElements(0);
          setTotalPages(1);
        }
      } catch (err) {
        if (!active) return;
        console.error("Error fetching tours directory:", err);
        setTours([]);
        setTotalElements(0);
        setTotalPages(1);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchTours();
    return () => {
      active = false;
    };
  }, [activeCategoryId, searchQuery, currentPage]);

  const getLocalizedCatName = (c?: TourCategoryDto) => {
    if (!c) return "";
    return resolveLocalizedName(c.translations, language, c.code);
  };

  const getLocalizedName = (tour: TourDto) => {
    return resolveLocalizedName(tour.translations, language, "Tour");
  };

  const getMinPrice = (t: TourDto) => {
    if (t.packages && t.packages.length > 0) {
      const activePackages = t.packages.filter((p) => p.active && !p.isContactOnly);
      const pkgPrices = activePackages
        .map((p) => getPackagePrice(p, "ADULT"))
        .filter((price) => price > 0);
      if (pkgPrices.length > 0) {
        return Math.min(...pkgPrices);
      }
    }
    if (!t.prices || t.prices.length === 0) return 0;
    const activePrices = t.prices.filter((p) => p.active);
    if (activePrices.length === 0) return 0;
    return Math.min(...activePrices.map((p) => p.amount));
  };

  const formatPriceNumber = (value: number) => {
    if (value <= 0) return t.common.contact;
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  const PRICE_OPTIONS = [
    { id: "under_500", label: t.tours.priceUnder500 },
    { id: "500_1500", label: t.tours.price500to1500 },
    { id: "over_1500", label: t.tours.priceOver1500 },
  ];

  const DURATION_OPTIONS = [
    { id: "same_day", label: t.tours.durationSameDay },
    { id: "multi_day", label: t.tours.durationMultiDay },
  ];

  const filteredAndSortedTours = useMemo(() => {
    const list = tours.filter((tour) => {
      // 1. Popover Categories filter
      if (selectedCatIds.length > 0) {
        if (!tour.tourCategoryId || !selectedCatIds.includes(tour.tourCategoryId)) return false;
      }

      // 2. Recommended only
      if (onlyRecommended && !tour.isRecommended) return false;

      // 3. Durations
      if (selectedDurations.length > 0) {
        const isSameDay = tour.durationDays <= 1 && tour.durationNights === 0;
        const matchSameDay = selectedDurations.includes("same_day") && isSameDay;
        const matchMultiDay = selectedDurations.includes("multi_day") && !isSameDay;
        if (!matchSameDay && !matchMultiDay) return false;
      }

      // 4. Price ranges
      if (selectedPriceRanges.length > 0) {
        const minP = getMinPrice(tour);
        const matchUnder500 = selectedPriceRanges.includes("under_500") && minP <= 500000;
        const match500to1500 =
          selectedPriceRanges.includes("500_1500") && minP > 500000 && minP <= 1500000;
        const matchOver1500 = selectedPriceRanges.includes("over_1500") && minP > 1500000;
        if (!matchUnder500 && !match500to1500 && !matchOver1500) return false;
      }

      return true;
    });

    return [...list].sort((a, b) => {
      if (sortOrder === "default") return 0;
      const priceA = getMinPrice(a);
      const priceB = getMinPrice(b);
      return sortOrder === "price_asc" ? priceA - priceB : priceB - priceA;
    });
  }, [tours, selectedCatIds, onlyRecommended, selectedDurations, selectedPriceRanges, sortOrder]);

  // Dynamic FAQs based on backend FAQ section or localized defaults (Image 2 style)
  const faqItems = useMemo(() => {
    if (faqSection?.contentData) {
      try {
        const parsed = JSON.parse(faqSection.contentData);
        if (parsed?.categories && Array.isArray(parsed.categories)) {
          const items: { question: string; answer: string }[] = [];
          for (const cat of parsed.categories) {
            if (cat.items && Array.isArray(cat.items)) {
              for (const it of cat.items) {
                const q = it.title?.[language] || it.title?.vi || it.title?.en || "";
                const a = it.content?.[language] || it.content?.vi || it.content?.en || "";
                if (q && a) {
                  items.push({ question: q, answer: a });
                }
              }
            }
          }
          if (items.length > 0) return items;
        }
      } catch (err) {
        console.warn("Failed to parse tour FAQ section contentData:", err);
      }
    }

    const totalCountStr = totalElements > 0 ? String(totalElements) : "24";
    if (language === "vi") {
      return [
        {
          question: `Minh Khoa Travel có bao nhiêu Du thuyền & Tour ngắm cảnh?`,
          answer: `Hiện tại chúng tôi cung cấp ${totalCountStr} tour du lịch biển đảo, du thuyền ngắm cảnh vịnh Nha Trang và các chuyến tham quan trọn gói với lịch trình đa dạng, xuất phát hàng ngày.`,
        },
        {
          question: "Những Du thuyền & Tour ngắm cảnh phổ biến nhất là gì?",
          answer: "Các tour được yêu thích nhất gồm có Tour 3 đảo Cano cao tốc (Hòn Mun - Hòn Tằm - Bãi Tranh), Du thuyền hoàng hôn vịnh Nha Trang với tiệc BBQ, và Tour lặn biển ngắm san hô tại khu bảo tồn biển.",
        },
        {
          question: "Những Du thuyền & Tour ngắm cảnh nào được đánh giá cao nhất?",
          answer: "Du thuyền ngắm cảnh hoàng hôn Sea Coral và Tour tham quan Điệp Sơn - Dốc Lết được khách hàng đánh giá cao nhất với điểm số 4.9/5 sao nhờ dịch vụ chu đáo và hướng dẫn viên nhiệt tình.",
        },
        {
          question: "Những Tour nào có mức giá hợp lý và tiết kiệm nhất?",
          answer: "Các tour cano khám phá đảo khởi hành hàng ngày có mức giá trọn gói chỉ từ 450.000đ/người đã bao gồm cano cao tốc, bữa trưa hải sản, vé vào cổng các khu du lịch và bảo hiểm.",
        },
        {
          question: "Có Du thuyền hoặc Tour ngắm cảnh nào mới nhất?",
          answer: "Trải nghiệm Du thuyền Catamaran hiện đại khám phá các vùng vịnh hoang sơ và lặn biển ngắm san hô bằng bình khí là dịch vụ mới nhất được đưa vào phục vụ mùa du lịch năm nay.",
        },
      ];
    } else if (language === "ko") {
      return [
        {
          question: "나트랑 크루즈 및 투어 상품은 몇 개가 있나요?",
          answer: `현재 ${totalCountStr}개의 나트랑 섬 투어, 일몰 크루즈 및 일일 관광 패키지를 매일 운영하고 있습니다.`,
        },
        {
          question: "가장 인기 있는 크루즈 및 투어는 무엇인가요?",
          answer: "스피드보트 3개 섬 호핑 투어(혼문, 혼탐), 나트랑 만 일몰 디너 크루즈, 디엡손 섬 투어가 가장 인기가 많습니다.",
        },
        {
          question: "가장 높은 평점을 받은 투어는 무엇인가요?",
          answer: "씨코랄 일몰 크루즈와 프라이빗 섬 투어가 평점 4.9점 이상으로 여행객들에게 최고 평가를 받고 있습니다.",
        },
        {
          question: "가장 가성비 좋은 투어 상품은 무엇인가요?",
          answer: "스피드보트 1일 섬 투어는 보트 이동, 점심 식사, 입장료가 모두 포함되어 1인당 450,000동부터 이용 가능합니다.",
        },
        {
          question: "최신 신규 투어 상품은 무엇인가요?",
          answer: "최신식 카타마란 요트 프라이빗 투어와 스쿠버 다이빙 패키지가 새롭게 추가되었습니다.",
        },
      ];
    } else if (language === "ru") {
      return [
        {
          question: "Сколько круизов и туров доступно в Нячанге?",
          answer: `В настоящее время мы предлагаем ${totalCountStr} туров по островам, закатных круизов и экскурсий с ежедневным отправлением.`,
        },
        {
          question: "Какие туры и круизы самые популярные?",
          answer: "Самые популярные: тур на скоростном катере по 3 островам (Хон Мун, Хон Там), круиз на закате с ужином и тур на остров Диеп Шон.",
        },
        {
          question: "Какие туры имеют наивысший рейтинг?",
          answer: "Закатный круиз Sea Coral и индивидуальные морские прогулки имеют среднюю оценку 4.9/5 звезд по отзывам туристов.",
        },
        {
          question: "Какие туры наиболее доступны по цене?",
          answer: "Однодневные островные туры на катере доступны от 450 000 VND с включенным обедом, трансфером и страховкой.",
        },
        {
          question: "Какие новые туры появились недавно?",
          answer: "Новейшие программы включают прогулки на роскошном катамаране и дайвинг с аквалангом в заповедных бухтах.",
        },
      ];
    }
    // Default English
    return [
      {
        question: `How many scenic cruises & tours are available?`,
        answer: `We currently offer ${totalCountStr} island tours, scenic sunset cruises, and sightseeing packages departing daily in Nha Trang.`,
      },
      {
        question: "What are the most popular cruises and tours?",
        answer: "The top choices include the 3-Island Speedboat Tour (Hon Mun, Hon Tam), the Nha Trang Sunset Dinner Cruise with live music, and the Diep Son underwater sandbar tour.",
      },
      {
        question: "Which cruises and tours have the highest ratings?",
        answer: "The Sea Coral Sunset Cruise and private island tours are rated 4.9/5 stars by over 1,000 satisfied travelers.",
      },
      {
        question: "Which tours offer the best value for money?",
        answer: "Our daily island speedboat tours start from only 450,000 VND per person, fully including boat transport, seafood lunch, entrance tickets, and insurance.",
      },
      {
        question: "What are the newest cruise and tour experiences?",
        answer: "The luxury Catamaran cruise exploring untouched bays and professional scuba diving experiences are our latest premium additions.",
      },
    ];
  }, [language, totalElements]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      {/* Banner Section (Image 1 style) */}
      <section className="relative w-full min-h-[300px] md:min-h-[340px] flex flex-col justify-center items-center py-10 sm:py-14 px-4 sm:px-6 lg:px-8 bg-slate-900 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: heroSection?.imageUrls?.[0]
              ? `url('${heroSection.imageUrls[0]}')`
              : "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80')",
          }}
        >
          <div className="absolute inset-0 bg-black/55 dark:bg-black/75 backdrop-blur-[1px]" />
        </div>

        <div className="max-w-3xl mx-auto w-full relative z-10 text-white flex flex-col items-center text-center gap-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight drop-shadow-md">
            {resolveTranslation(heroSection?.translations, language)?.title || t.tours.catalogTitle}
          </h1>
          {heroSection?.translations?.find((tr) => tr.locale === language)?.description && (
            <p className="text-xs sm:text-sm text-slate-200 max-w-xl font-medium">
              {resolveTranslation(heroSection?.translations, language)?.description}
            </p>
          )}

          {/* Clean Pill Search Bar (Klook Image 1 style) */}
          <div className="w-full max-w-xl relative mt-2">
            <div className="relative flex items-center">
              <Search size={18} className="absolute left-4.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={t.tours.searchPlaceholder || "Tìm kiếm"}
                className="w-full h-11 sm:h-12 pl-12 pr-10 rounded-full bg-white dark:bg-[var(--bg-surface)] text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs sm:text-sm font-semibold shadow-lg border border-white/20 dark:border-slate-800 outline-none focus:ring-2 focus:ring-accent transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer bg-transparent border-none p-0"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Listing Area */}
      <main className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 flex-1 flex flex-col gap-5">
        {/* Top Filters Bar (Klook Image 1 style) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            {/* Pill 1: Phân loại ∨ */}
            <Popover>
              <Button
                type="button"
                variant="outline"
                className={`h-9 px-4 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeCategoryId > 0
                    ? "border-accent bg-accent/10 text-accent font-black"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200"
                }`}
              >
                <span>
                  {activeCategoryId > 0
                    ? getLocalizedCatName(categories.find((c) => c.id === activeCategoryId) || categories[0])
                    : t.tours.categoryFilter || "Phân loại"}
                </span>
                <ChevronDown size={13} />
              </Button>
              <Popover.Content
                placement="bottom start"
                className="w-56 p-2 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 shadow-2xl z-50"
              >
                <div className="space-y-1">
                  {categories.map((c) => {
                    const isSelected = activeCategoryId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setActiveCategoryId(c.id);
                          setCurrentPage(1);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer border-none ${
                          isSelected
                            ? "bg-accent/10 text-accent font-bold"
                            : "hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        <span>{getLocalizedCatName(c)}</span>
                        {isSelected && <Check size={14} className="text-accent shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </Popover.Content>
            </Popover>

            {/* Pill 2: Ngày khả dụng ∨ */}
            <Popover>
              <Button
                type="button"
                variant="outline"
                className={`h-9 px-4 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  selectedDate
                    ? "border-accent bg-accent/10 text-accent font-black"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200"
                }`}
              >
                <CalendarIcon size={13} className="text-slate-400" />
                <span>
                  {selectedDate
                    ? `${selectedDate.day}/${selectedDate.month}/${selectedDate.year}`
                    : t.tours.availabilityDate || "Ngày khả dụng"}
                </span>
                <ChevronDown size={13} />
              </Button>
              <Popover.Content
                placement="bottom start"
                className="p-3 rounded-2xl bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 shadow-2xl z-50"
              >
                <Calendar
                  aria-label="Chọn ngày khởi hành"
                  value={selectedDate as any}
                  onChange={(d) => {
                    if (d) setSelectedDate(d as DateValue);
                    setCurrentPage(1);
                  }}
                  minValue={today(getLocalTimeZone()) as any}
                >
                  <Calendar.Header className="flex items-center justify-between mb-2">
                    <Calendar.YearPickerTrigger className="text-xs font-bold flex items-center gap-1 cursor-pointer">
                      <Calendar.YearPickerTriggerHeading />
                      <Calendar.YearPickerTriggerIndicator />
                    </Calendar.YearPickerTrigger>
                    <div className="flex gap-1">
                      <Calendar.NavButton slot="previous" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer" />
                      <Calendar.NavButton slot="next" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer" />
                    </div>
                  </Calendar.Header>
                  <Calendar.Grid className="w-full">
                    <Calendar.GridHeader className="text-[10px] font-bold text-slate-400">
                      {(day) => <Calendar.HeaderCell className="w-8 h-8 text-center">{day}</Calendar.HeaderCell>}
                    </Calendar.GridHeader>
                    <Calendar.GridBody>
                      {(date) => (
                        <Calendar.Cell
                          date={date}
                          className="w-8 h-8 text-xs font-semibold text-center cursor-pointer rounded-lg hover:bg-accent/10 hover:text-accent aria-selected:bg-accent aria-selected:text-accent-foreground"
                        />
                      )}
                    </Calendar.GridBody>
                  </Calendar.Grid>
                </Calendar>
                {selectedDate && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedDate(null)}
                      className="text-xs font-bold text-rose-500 hover:underline cursor-pointer border-none bg-transparent"
                    >
                      {t.common.cancel || "Xóa"}
                    </button>
                  </div>
                )}
              </Popover.Content>
            </Popover>
          </div>

          {/* Right: Pill 3: [ Lọc · {count} ] */}
          <Popover>
            <Button
              type="button"
              variant="outline"
              className={`h-9 px-4 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeFilterCount > 0
                  ? "border-accent/80 bg-accent/10 text-accent font-black"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200"
              }`}
            >
              <SlidersHorizontal size={13} className={activeFilterCount > 0 ? "text-accent" : "text-slate-500"} />
              <span>{t.tours.filter || "Lọc"}</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            <Popover.Content
              placement="bottom end"
              className="w-80 p-0 rounded-2xl bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 space-y-4 outline-none">
                {/* Popover Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider">
                      {t.tours.filterTitle}
                    </h4>
                    <p className="text-[11px] font-medium mt-0.5">
                      {t.tours.appliedFilters}: <span className="font-bold text-accent">{activeFilterCount}</span>
                    </p>
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer border-none bg-transparent"
                    >
                      <RotateCcw size={11} />
                      <span>{t.tours.filterReset}</span>
                    </button>
                  )}
                </div>

                {/* Section: Recommended */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {t.tours.bestSeller}
                  </span>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      isSelected={onlyRecommended}
                      onChange={(checked: boolean) => setOnlyRecommended(checked)}
                    >
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Content className="text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                        {t.tours.recommendedOnly}
                      </Checkbox.Content>
                    </Checkbox>
                  </div>
                </div>

                {/* Section: Duration */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {t.tours.filterDuration}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {DURATION_OPTIONS.map((opt) => (
                      <Checkbox
                        key={opt.id}
                        isSelected={selectedDurations.includes(opt.id)}
                        onChange={() => toggleDuration(opt.id)}
                      >
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Content className="text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                          {opt.label}
                        </Checkbox.Content>
                      </Checkbox>
                    ))}
                  </div>
                </div>

                {/* Section: Price Range */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {t.tours.filterPrice}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {PRICE_OPTIONS.map((opt) => (
                      <Checkbox
                        key={opt.id}
                        isSelected={selectedPriceRanges.includes(opt.id)}
                        onChange={() => togglePriceRange(opt.id)}
                      >
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Content className="text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                          {opt.label}
                        </Checkbox.Content>
                      </Checkbox>
                    ))}
                  </div>
                </div>
              </div>
            </Popover.Content>
          </Popover>
        </div>

        {/* Results Count & Sorting Row (Klook Image 1 style) */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
            {filteredAndSortedTours.length} {t.tours.servicesCount.replace("{count}", "").trim() || "dịch vụ"}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
              {t.tours.sortBy || "Sắp xếp theo"}
            </span>
            <Select
              aria-label={t.tours.sortBy || "Sắp xếp theo"}
              selectedKey={sortOrder}
              onSelectionChange={(key) => setSortOrder(key as any)}
              className="w-40 sm:w-44"
            >
              <Select.Trigger className="h-9 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] px-3 flex items-center justify-between outline-none cursor-pointer">
                <Select.Value />
                <Select.Indicator>
                  <ChevronDown size={13} />
                </Select.Indicator>
              </Select.Trigger>
              <Select.Popover className="w-[var(--trigger-width)] bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xl z-50">
                <ListBox className="outline-none">
                  <ListBox.Item id="default" textValue={t.tours.recommendedSort || "Klook giới thiệu"} className="px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer">
                    {t.tours.recommendedSort || "Klook giới thiệu"}
                  </ListBox.Item>
                  <ListBox.Item id="price_asc" textValue={t.tours.sortPriceLow} className="px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer">
                    {t.tours.sortPriceLow}
                  </ListBox.Item>
                  <ListBox.Item id="price_desc" textValue={t.tours.sortPriceHigh} className="px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer">
                    {t.tours.sortPriceHigh}
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-bold flex items-center gap-1 text-slate-500">
              <SlidersHorizontal size={12} />
              {t.tours.appliedFilters}:
            </span>
            {selectedCatIds.map((cId) => {
              const cat = categories.find((c) => c.id === cId);
              const label = cat ? getLocalizedCatName(cat) : `Cat #${cId}`;
              return (
                <span
                  key={`cat-${cId}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-accent/10 text-accent dark:bg-accent/20 border border-accent/30"
                >
                  <span>{label}</span>
                  <button
                    type="button"
                    onClick={() => toggleCategory(cId)}
                    className="hover:opacity-70 cursor-pointer border-none bg-transparent p-0 flex items-center"
                    aria-label="Remove filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
            {selectedPriceRanges.map((pId) => {
              const label = PRICE_OPTIONS.find((p) => p.id === pId)?.label || pId;
              return (
                <span
                  key={`price-${pId}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                >
                  <span>{label}</span>
                  <button
                    type="button"
                    onClick={() => togglePriceRange(pId)}
                    className="hover:opacity-70 cursor-pointer border-none bg-transparent p-0 flex items-center"
                    aria-label="Remove filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
            {selectedDurations.map((dId) => {
              const label = DURATION_OPTIONS.find((d) => d.id === dId)?.label || dId;
              return (
                <span
                  key={`dur-${dId}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                >
                  <span>{label}</span>
                  <button
                    type="button"
                    onClick={() => toggleDuration(dId)}
                    className="hover:opacity-70 cursor-pointer border-none bg-transparent p-0 flex items-center"
                    aria-label="Remove filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
            {onlyRecommended && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <Sparkles size={11} />
                <span>{t.tours.recommendedOnly}</span>
                <button
                  type="button"
                  onClick={() => setOnlyRecommended(false)}
                  className="hover:opacity-70 cursor-pointer border-none bg-transparent p-0 flex items-center"
                  aria-label="Remove filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-slate-400 hover:text-rose-500 underline ml-1 cursor-pointer bg-transparent border-none p-0"
            >
              {t.tours.clearAll}
            </button>
          </div>
        )}

        {/* 4-Column Tour Cards Grid (Image 1 style, 24 cards per screen) */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-[var(--bg-card)] shadow-xs"
              >
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-4/5 rounded-lg" />
                  <Skeleton className="h-3 w-1/2 rounded-lg" />
                  <div className="flex gap-1.5 pt-1">
                    <Skeleton className="h-4 w-16 rounded" />
                    <Skeleton className="h-4 w-20 rounded" />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Skeleton className="h-4 w-20 rounded" />
                    <Skeleton className="h-5 w-24 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedTours.length === 0 ? (
          <div className="py-24 text-center text-slate-400 text-xs font-bold bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-3xl">
            {t.common.noResults}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {filteredAndSortedTours.map((tour: TourDto) => {
              const minPrice = getMinPrice(tour);
              const name = getLocalizedName(tour);
              const duration =
                tour.durationDays > 0
                  ? `${tour.durationDays} ${t.tours.days}`
                  : tour.durationNights > 0
                  ? `${tour.durationNights} ${t.tours.days}`
                  : "";

              const resolvedImgs = tourImages[tour.id] || [];
              const thumbnailImg = resolvedImgs.find((img) => img.id === tour.thumbnailId);
              const bgImg = thumbnailImg ? thumbnailImg.url : resolvedImgs[0]?.url || "";

              const cat = categories.find((c) => c.id === tour.tourCategoryId) || tour.tourCategory;
              const catName = getLocalizedCatName(cat);

              // Pseudo-rating & booking count for Klook aesthetics
              const ratingVal = "4.8";
              const reviewNum = 25 + ((tour.id * 17) % 250);
              const bookedNum = 100 + ((tour.id * 37) % 900);

              return (
                <div
                  key={tour.id}
                  onClick={() => {
                    const tourSlug = getCanonicalSlug(tour, language, "tour");
                    router.push(`/${language}/tours/${tourSlug}?id=${tour.id}`);
                  }}
                  className="group flex flex-col justify-between bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  {/* Card Top: Image & Overlay */}
                  <div className="aspect-[4/3] relative overflow-hidden bg-slate-100 dark:bg-[var(--bg-surface)]">
                    {bgImg ? (
                      <img
                        src={bgImg}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase p-4 text-center">
                        {name}
                      </div>
                    )}

                    {/* Duration badge */}
                    {duration && (
                      <div className="absolute top-2.5 left-2.5 bg-black/50 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
                        <Clock size={10} />
                        <span>{duration}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Body (Klook Image 1 style) */}
                  <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-3">
                    <div className="space-y-1.5">
                      {/* Title */}
                      <h3 className="font-bold text-sm sm:text-[15px] text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                        {name}
                      </h3>

                      {/* Origin / Departure */}
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        <span>{t.tours.departFrom} {catName || "Nha Trang"}</span>
                      </div>

                      {/* Feature Tags (Klook style) */}
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-[var(--bg-elevated)] text-slate-600 dark:text-slate-300">
                          {t.tours.bookForTomorrow}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-[var(--bg-elevated)] text-slate-600 dark:text-slate-300">
                          {t.tours.hotelPickup}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-[var(--bg-elevated)] text-slate-600 dark:text-slate-300">
                          {t.tours.freeCancellation}
                        </span>
                      </div>
                    </div>

                    {/* Bottom: Rating & Price */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                      {/* Rating & Booked Count */}
                      <div className="flex items-center gap-1 text-xs">
                        <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />
                        <span className="font-bold text-amber-600 dark:text-amber-400 text-xs">
                          {ratingVal}
                        </span>
                        <span className="text-slate-400 text-[11px]">({reviewNum})</span>
                        <span className="text-slate-400 text-[11px]">• {bookedNum}+ {t.tours.bookedCount}</span>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-1 pt-0.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">₫</span>
                        <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                          {formatPriceNumber(minPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination (24 items/page) */}
        {totalPages > 1 && (
          <div className="flex justify-center pt-8 pb-4">
            <Pagination size="sm">
              <Pagination.Summary>
                {`${currentPage} / ${totalPages} ${t.common.page}`}
              </Pagination.Summary>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={currentPage <= 1}
                    onPress={() => {
                      setCurrentPage((prev) => Math.max(1, prev - 1));
                      window.scrollTo({ top: 320, behavior: "smooth" });
                    }}
                  >
                    <Pagination.PreviousIcon />
                  </Pagination.Previous>
                </Pagination.Item>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Pagination.Item key={p}>
                    <Pagination.Link
                      isActive={p === currentPage}
                      onPress={() => {
                        setCurrentPage(p);
                        window.scrollTo({ top: 320, behavior: "smooth" });
                      }}
                    >
                      {p}
                    </Pagination.Link>
                  </Pagination.Item>
                ))}
                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={currentPage >= totalPages}
                    onPress={() => {
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                      window.scrollTo({ top: 320, behavior: "smooth" });
                    }}
                  >
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          </div>
        )}

        {/* FAQ Accordion Section (Klook Image 2 style) */}
        <section className="w-full max-w-5xl mx-auto pt-10 pb-12 space-y-5">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {resolveTranslation(faqSection?.translations, language)?.title || t.tours.faqTourTitle}
          </h2>

          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-[var(--bg-surface)] divide-y divide-slate-100 dark:divide-slate-800 shadow-xs">
            {faqItems.map((item, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div key={idx} className="transition-colors">
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 hover:text-accent transition-colors cursor-pointer border-none bg-transparent"
                  >
                    <span className="pr-4">{item.question}</span>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-accent" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-0 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed animate-in fade-in duration-200">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
