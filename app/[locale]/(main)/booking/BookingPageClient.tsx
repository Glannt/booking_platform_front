"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Calendar, Clock, Star, ArrowRight, ShieldCheck, HelpCircle, Filter, X } from "lucide-react";
import { Card, Button, Skeleton, Select, ListBox, Label } from "@heroui/react";
import { getPublicServices, ServiceDto } from "@/lib/api/services";
import { getServiceOptionTypes, ServiceOptionTypeDto } from "@/lib/api/serviceOptionTypes";
import { getMediaDetails } from "@/lib/api/media";
import { backendUrl } from "@/lib/api/client";
import { useI18n } from "@/context/LanguageContext";
import { formatPriceSync as _formatPrice } from "@/lib/format";
import { Reveal } from "@/components/Reveal";

const CATEGORY_NAMES: Record<number, { vi: string; en: string; ko: string; ru: string }> = {
  1: { vi: "Đón Tiễn Sân Bay", en: "Airport Transfer", ko: "공항 픽업/샌딩", ru: "Трансфер в Аэропорт" },
  2: { vi: "Tour Du Lịch", en: "Tours", ko: "일일 투어", ru: "Туры" },
  3: { vi: "Thuê Xe Tự Lái", en: "Self-Drive Rental", ko: "자차 렌터카", ru: "Аrenda bez Voditelya" },
};

export default function BookingPageClient() {
  const router = useRouter();
  const { language, t } = useI18n();
  const isVi = language === "vi";

  const [services, setServices] = useState<ServiceDto[]>([]);
  const [optionTypes, setOptionTypes] = useState<ServiceOptionTypeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [resolvedImages, setResolvedImages] = useState<Record<number, string>>({});
  const [selectedOptionTypeId, setSelectedOptionTypeId] = useState<number | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null);

  const handleCategoryChange = (catId: number | null) => {
    setSelectedCategory(catId);
    setSelectedOptionTypeId(null);
    setSelectedBrand(null);
    setSelectedPriceRange(null);
  };

  // Extract unique brands dynamically from filtered services
  const availableBrands = React.useMemo(() => {
    const brandsSet = new Set<string>();
    services.forEach((srv) => {
      if (selectedCategory === null || srv.categoryId === selectedCategory) {
        srv.options?.forEach((opt) => {
          if (opt.vehicleBrand) brandsSet.add(opt.vehicleBrand);
        });
      }
    });
    return Array.from(brandsSet).sort();
  }, [services, selectedCategory]);

  // Extract unique seat capacities dynamically from service options
  const availableSeatCapacities = React.useMemo(() => {
    const seatsSet = new Set<number>();
    services.forEach((srv) => {
      if (selectedCategory === null || srv.categoryId === selectedCategory) {
        srv.options?.forEach((opt) => {
          if (opt.seatCapacity) seatsSet.add(opt.seatCapacity);
        });
      }
    });
    return Array.from(seatsSet).sort((a, b) => a - b);
  }, [services, selectedCategory]);

  // Extract dynamic price ranges from actual service data
  const priceRanges = React.useMemo(() => {
    const prices: number[] = [];
    services.forEach((srv) => {
      if (selectedCategory === null || srv.categoryId === selectedCategory) {
        srv.options?.forEach((opt) => prices.push(opt.price));
      }
    });
    if (prices.length === 0) return [];
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const ranges: { id: string; label: string; min: number; max: number }[] = [];
    if (min < 500000) ranges.push({ id: "under-500", label: isVi ? "Dưới 500.000 đ" : "Under 500K VND", min: 0, max: 499999 });
    if (min <= 1000000 && max >= 500000) ranges.push({ id: "500-1000", label: "500K – 1.000K đ", min: 500000, max: 1000000 });
    if (max > 1000000) ranges.push({ id: "over-1000", label: isVi ? "Trên 1.000.000 đ" : "Over 1M VND", min: 1000001, max: Infinity });
    return ranges;
  }, [services, selectedCategory, isVi]);

  // Get option type localized name
  const getOptionTypeName = (ot: ServiceOptionTypeDto) => {
    const tr = ot.translations?.find((t) => t.locale === language) || ot.translations?.[0];
    return tr?.name || ot.code;
  };

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch services and option types in parallel
        const [servicesRes, optionTypesRes] = await Promise.all([
          getPublicServices(),
          getServiceOptionTypes().catch(() => ({ data: [] })),
        ]);
        if (!active) return;

        let loadedServices = servicesRes?.data || [];
        setServices(loadedServices);
        setOptionTypes((optionTypesRes as any)?.data || []);

        // Fetch media images
        const imageMap: Record<number, string> = {};
        await Promise.all(
          loadedServices.map(async (srv) => {
            if (srv.thumbnailId) {
              try {
                const media = await getMediaDetails(srv.thumbnailId);
                if (media && media.filePath) {
                  imageMap[srv.id] = media.filePath.startsWith("http")
                    ? media.filePath
                    : `${backendUrl}${media.filePath}`;
                }
              } catch (e) {
                console.error("Failed to load thumbnail details for service ID", srv.id, e);
              }
            }
          })
        );
        if (active) {
          setResolvedImages(imageMap);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, []);

  const getLocalizedName = (srv: ServiceDto) => {
    const translation = srv.translations?.find((tr) => tr.locale === language) || srv.translations?.[0];
    return translation ? translation.name : "Service Name";
  };

  const getLocalizedDesc = (srv: ServiceDto) => {
    const translation = srv.translations?.find((tr) => tr.locale === language) || srv.translations?.[0];
    return translation ? translation.description : "";
  };

  const getCategoryName = (categoryId: number) => {
    const names = CATEGORY_NAMES[categoryId];
    if (!names) return t.booking.selectService;
    return names[language as "vi" | "en" | "ko" | "ru"] || names.vi;
  };

  const getStartingPrice = (srv: ServiceDto) => {
    if (!srv.options || srv.options.length === 0) return srv.basePrice || 0;
    const prices = srv.options.map((opt) => opt.price);
    return Math.min(...prices);
  };

  const formatPrice = (price: number) => _formatPrice(price, language);

  // Filtering Logic
  const filteredServices = services.filter((srv) => {
    // Category match
    if (selectedCategory !== null && srv.categoryId !== selectedCategory) {
      return false;
    }

    // Option Type filter (matches service-level serviceOptionTypeId)
    if (selectedOptionTypeId !== null && srv.serviceOptionTypeId !== selectedOptionTypeId) {
      return false;
    }

    // Check option-level filters (Brand, Price Range)
    const hasMatchingOption = srv.options?.some((opt) => {
      // Brand filter
      if (selectedBrand !== null) {
        if (opt.vehicleBrand?.toLowerCase() !== selectedBrand.toLowerCase()) return false;
      }
      // Price Range filter
      if (selectedPriceRange !== null) {
        const range = priceRanges.find((r) => r.id === selectedPriceRange);
        if (range && (opt.price < range.min || opt.price > range.max)) return false;
      }
      return true;
    });

    const isOptionFilterActive = selectedBrand !== null || selectedPriceRange !== null;
    if (isOptionFilterActive && (!srv.options || srv.options.length === 0 || !hasMatchingOption)) {
      return false;
    }

    // Search match
    if (searchQuery.trim() !== "") {
      const name = getLocalizedName(srv).toLowerCase();
      const desc = getLocalizedDesc(srv).toLowerCase();
      const optionsMatch = srv.options?.some((opt) => {
        const optTrans = opt.translations?.find((tr) => tr.locale === language) || opt.translations?.[0];
        return (
          optTrans?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          optTrans?.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opt.vehicleBrand?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
      return name.includes(searchQuery.toLowerCase()) || desc.includes(searchQuery.toLowerCase()) || optionsMatch;
    }
    return true;
  });

  return (
    <div className="space-y-8 pb-20 md:pb-28 mx-4 sm:mx-10 md:mx-20">
      {/* Search Header Banner */}
      <Reveal variant="fade" className="relative mt-5 rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-12 shadow-xl border border-indigo-950">
        <div className="relative z-10 max-w-2xl space-y-4">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            {t.booking.portalTitle}
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed font-light">
            {isVi
              ? "Tìm kiếm, so sánh và đặt dịch vụ xe đón tiễn sân bay, thuê xe tự lái hoặc tour du lịch Nha Trang giá tốt nhất."
              : "Search, compare and book airport transfer services, self-drive car rentals, or tours in Nha Trang with ease."}
          </p>

          {/* Search Input Box */}
          <div className="flex items-center bg-white dark:bg-black text-slate-800 dark:text-slate-200 rounded-2xl p-2 shadow-lg border border-slate-200/50 dark:border-slate-800 max-w-xl transition-all focus-within:ring-2 focus-within:ring-primary">
            <Search className="text-slate-400 mx-2 flex-shrink-0" size={20} />
            <input
              type="text"
              placeholder={isVi ? "Nhập tên dịch vụ, xe, địa danh..." : "Search services, cars, tours..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full px-2 py-1.5 text-sm"
            />
            {searchQuery && (
              <Button
                size="sm"
                variant="primary"
                onPress={() => setSearchQuery("")}
                className="text-xs text-default-500 font-semibold min-w-0 px-2"
              >
                {isVi ? "Xóa" : "Clear"}
              </Button>
            )}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500 to-transparent" />
      </Reveal>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-default-100">
        <Button
          onPress={() => handleCategoryChange(null)}
          variant={selectedCategory === null ? "primary" : "outline"}
          className={`rounded-lg font-bold transition-all ${selectedCategory === null ? "shadow-md shadow-primary/20 scale-[1.02]" : ""
            }`}
          size="sm"
        >
          {isVi ? "Tất cả dịch vụ" : "All Services"}
        </Button>
        {[1, 2, 3].map((catId) => (
          <Button
            key={catId}
            onPress={() => handleCategoryChange(catId)}
            variant={selectedCategory === catId ? "primary" : "outline"}
            className={`rounded-lg font-bold transition-all ${selectedCategory === catId ? "shadow-md shadow-primary/20 scale-[1.02]" : ""
              }`}
            size="sm"
          >
            {getCategoryName(catId)}
          </Button>
        ))}
      </div>

      {/* Advanced Filters */}
      {selectedCategory !== null && (
        <div className="flex flex-wrap items-center gap-6 bg-content1 p-5 rounded-2xl border border-default-200/50 shadow-sm text-xs">
          <div className="flex items-center gap-1.5 text-default-500">
            <Filter size={14} />
            <span className="font-bold text-foreground text-sm">
              {isVi ? "Bộ lọc" : "Filters"}
            </span>
          </div>

          {/* Service Option Types (from API) */}
          {optionTypes.length > 0 && (
            <div className="flex flex-col gap-1.5 min-w-[160px]">
              <Select
                className="w-full"
                placeholder={isVi ? "Loại dịch vụ" : "Service Type"}
                selectedKey={selectedOptionTypeId?.toString() || ""}
                onSelectionChange={(key) => {
                  setSelectedOptionTypeId(key ? Number(key) : null);
                }}
              >
                <Label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground mb-0.5">
                  {isVi ? "Loại dịch vụ" : "Service Type"}
                </Label>
                <Select.Trigger className="h-9 bg-content1 border border-default-200 rounded-xl px-3">
                  <Select.Value className="text-xs font-semibold" />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover className="bg-content1 border border-default-200 rounded-xl p-1 shadow-xl z-50">
                  <ListBox>
                    <ListBox.Item id="" textValue={isVi ? "Tất cả" : "All"} className="text-xs font-semibold px-3 py-2 hover:bg-default-100 rounded-lg cursor-pointer">
                      {isVi ? "Tất cả" : "All Types"}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    {optionTypes.map((ot) => (
                      <ListBox.Item key={ot.id} id={ot.id.toString()} textValue={getOptionTypeName(ot)} className="text-xs font-semibold px-3 py-2 hover:bg-default-100 rounded-lg cursor-pointer">
                        {getOptionTypeName(ot)}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          )}

          {/* Brand Filter (HeroUI Select) */}
          {availableBrands.length > 0 && (selectedCategory === 1 || selectedCategory === 3) && (
            <div className="flex flex-col gap-1.5 min-w-[150px]">
              <Select
                className="w-full"
                placeholder={isVi ? "Hãng xe" : "Brand"}
                selectedKey={selectedBrand || ""}
                onSelectionChange={(key) => {
                  setSelectedBrand(key ? String(key) : null);
                }}
              >
                <Label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground mb-0.5">
                  {isVi ? "Hãng xe" : "Brand"}
                </Label>
                <Select.Trigger className="h-9 bg-content1 border border-default-200 rounded-xl px-3">
                  <Select.Value className="text-xs font-semibold" />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover className="bg-content1 border border-default-200 rounded-xl p-1 shadow-xl z-50">
                  <ListBox>
                    <ListBox.Item id="" textValue={isVi ? "Tất cả hãng xe" : "All Brands"} className="text-xs font-semibold px-3 py-2 hover:bg-default-100 rounded-lg cursor-pointer">
                      {isVi ? "Tất cả hãng xe" : "All Brands"}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    {availableBrands.map((brand) => (
                      <ListBox.Item key={brand} id={brand} textValue={brand} className="text-xs font-semibold px-3 py-2 hover:bg-default-100 rounded-lg cursor-pointer">
                        {brand}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          )}

          {/* Price Range Filter (HeroUI Select) */}
          {priceRanges.length > 0 && (
            <div className="flex flex-col gap-1.5 min-w-[170px]">
              <Select
                className="w-full"
                placeholder={isVi ? "Khoảng giá" : "Price Range"}
                selectedKey={selectedPriceRange || ""}
                onSelectionChange={(key) => {
                  setSelectedPriceRange(key ? String(key) : null);
                }}
              >
                <Label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground mb-0.5">
                  {isVi ? (selectedCategory === 2 ? "Khoảng giá vé" : "Khoảng giá") : "Price Range"}
                </Label>
                <Select.Trigger className="h-9 bg-content1 border border-default-200 rounded-xl px-3">
                  <Select.Value className="text-xs font-semibold" />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover className="bg-content1 border border-default-200 rounded-xl p-1 shadow-xl z-50">
                  <ListBox>
                    <ListBox.Item id="" textValue={isVi ? "Tất cả mức giá" : "All Prices"} className="text-xs font-semibold px-3 py-2 hover:bg-default-100 rounded-lg cursor-pointer">
                      {isVi ? "Tất cả mức giá" : "All Prices"}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    {priceRanges.map((range) => (
                      <ListBox.Item key={range.id} id={range.id} textValue={range.label} className="text-xs font-semibold px-3 py-2 hover:bg-default-100 rounded-lg cursor-pointer">
                        {range.label}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          )}

          {/* Clear All Filters */}
          {(selectedOptionTypeId !== null || selectedBrand !== null || selectedPriceRange !== null) && (
            <button
              onClick={() => {
                setSelectedOptionTypeId(null);
                setSelectedBrand(null);
                setSelectedPriceRange(null);
              }}
              className="flex items-center gap-1 md:mt-5 px-3 py-1.5 text-primary hover:text-primary/80 font-bold transition-all"
            >
              <X size={12} />
              {isVi ? "Xóa bộ lọc" : "Clear Filters"}
            </button>
          )}
        </div>
      )}

      {/* Services Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-content1 border border-default-200/50 rounded-2xl overflow-hidden shadow-sm h-[320px] max-w-[300px] w-full mx-auto sm:mx-0">
              <Skeleton className="h-32 w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-3.5 w-1/3 rounded-lg" />
                <Skeleton className="h-5 w-3/4 rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <div className="flex justify-between items-center pt-1">
                  <div className="space-y-1 w-1/3">
                    <Skeleton className="h-3 w-1/2 rounded-lg" />
                    <Skeleton className="h-4.5 w-full rounded-lg" />
                  </div>
                  <Skeleton className="h-8.5 w-18 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-16 bg-content1 rounded-3xl border border-default-100 p-8 space-y-4 max-w-md mx-auto">
          <div className="p-4 bg-default-100 rounded-full w-fit mx-auto text-default-400">
            <HelpCircle size={40} />
          </div>
          <h3 className="text-lg font-bold">
            {isVi ? "Không tìm thấy dịch vụ phù hợp" : "No matching services found"}
          </h3>
          <p className="text-sm text-default-500">
            {isVi
              ? "Vui lòng thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc danh mục."
              : "Please try searching with different keywords or change your category filter."}
          </p>
          <Button
            onPress={() => {
              setSearchQuery("");
              setSelectedCategory(null);
            }}
            className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-sm border-none font-sans"
          >
            {isVi ? "Thiết lập lại" : "Reset filters"}
          </Button>
        </div>
      ) : (
        <Reveal variant="up" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
          {filteredServices.map((srv) => {
            const startPrice = getStartingPrice(srv);
            const image = resolvedImages[srv.id] || "";
            const categoryName = getCategoryName(srv.categoryId);

            return (
              <div
                key={srv.id}
                onClick={() => router.push(`/${language}/booking/${srv.id}`)}
                className="group bg-content1 border border-default-200/50 hover:border-primary/45 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer transform hover:-translate-y-0.5 max-w-[300px] w-full mx-auto sm:mx-0"
              >
                <div>
                  {/* Card Image */}
                  <div className="relative h-32 w-full overflow-hidden bg-slate-100 dark:bg-[var(--bg-card)] flex items-center justify-center">
                    {image ? (
                      <img
                        src={image}
                        alt=""
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 opacity-90"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <Clock size={28} className="text-slate-300 dark:text-slate-600" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 pointer-events-none" />
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[8px] font-extrabold uppercase bg-white/95 dark:bg-black/95 text-slate-800 dark:text-slate-200 rounded-md shadow-sm">
                      {categoryName}
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-1.5">
                    <h2 className="text-sm font-bold tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                      {getLocalizedName(srv)}
                    </h2>
                    <p className="text-[10px] text-default-500 leading-relaxed line-clamp-3 min-h-[42px]">
                      {getLocalizedDesc(srv)}
                    </p>

                    {/* Option Count Preview */}
                    <div className="flex items-center gap-1 text-[9px] text-default-450 bg-content2 py-0.5 px-1.5 rounded-md w-fit">
                      <Clock size={10} className="text-primary" />
                      <span className="font-semibold">
                        {srv.options?.length || 0}{" "}
                        {isVi
                          ? `${srv.categoryId === 2 ? "vé/lựa chọn" : "tùy chọn xe"}`
                          : `${srv.categoryId === 2 ? "ticket options" : "vehicle options"}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer (Price & Action) */}
                <div className="p-4 pt-0 border-t border-default-100/60 flex items-center justify-between mt-auto">
                  <div className="pt-2.5">
                    <span className="text-[8px] text-default-450 uppercase tracking-wider font-semibold block">
                      {isVi ? "Giá từ" : "Starting from"}
                    </span>
                    <span className="text-sm font-black text-slate-800 dark:text-white">
                      {formatPrice(startPrice)}
                    </span>
                  </div>
                  <div className="pt-2.5">
                    <div
                      className="flex items-center gap-1 bg-primary hover:bg-primary/95 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition-all shadow-sm shadow-primary/10 group-hover:translate-x-0.5"
                    >
                      <span>{isVi ? "Đặt ngay" : "Book Now"}</span>
                      <ArrowRight size={10} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </Reveal>
      )}
    </div>
  );
}
