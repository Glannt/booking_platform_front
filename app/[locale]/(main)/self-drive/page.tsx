"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Skeleton,
  Select,
  ListBox,
  RangeCalendar,
  Label,
  Form,
  FieldError,
  TextField,
  Input,
  Typography,
  Pagination
} from "@heroui/react";
import { parseDate, today, getLocalTimeZone } from "@internationalized/date";
import type { DateValue } from "@internationalized/date";
import {
  Car,
  ShieldCheck,
  ChevronUp,
  Phone,
  MessageCircle,
  Sparkles,
  Headset,
  FileText,
  UserCheck,
  DollarSign,
  CheckCircle,
  CalendarDays
} from "lucide-react";
import {
  calculateRentalDays,
  formatToIsoDate,
  formatToDisplayDate,
} from "@/lib/utils/rentalDate";

import { useI18n } from "@/context/LanguageContext";
import { getPublicServices } from "@/lib/api/services";
import { getMediaDetails } from "@/lib/api/media";
import { backendUrl } from "@/lib/api/client";
import { getActiveSections, type SectionDto } from "@/lib/api/sections";
import { getActiveRentals, getRentalPricesByRental, type RentalPriceDto, type RentalDto } from "@/lib/api/selfDrive";
import { getVehicleCategories, getRentableVehiclesByCategory, type VehicleCategoryDto } from "@/lib/api/fleet";
import { FormattedDescription } from "@/components/FormattedDescription";
import { AutofillButton } from "@/components/AutofillButton";
import { resolveLocalizedSlug } from "@/lib/i18n-helpers";
import { getCanonicalSlug } from "@/lib/slug-helpers";

interface Vehicle {
  id: string;
  rentalId: number;
  vehicleCategoryId: number;
  categorySlug?: string;
  nameVi: string;
  nameEn: string;
  descVi: string;
  descEn: string;
  pricePerDay: number;
  deposit: number;
  minimumDays: number;
  featuresVi: string[];
  featuresEn: string[];
  capacity: string;
  luggage: string;
  imgUrl: string;
  resolvedImages?: { id: number; url: string }[];
}

export default function SelfDrivePage() {
  const { language, t, contacts } = useI18n();
  const router = useRouter();
  const todayDate = today(getLocalTimeZone());

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");

  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [vehiclePage, setVehiclePage] = useState(1);
  const vehiclesPerPage = 4;
  const totalVehiclePages = Math.ceil(vehicles.length / vehiclesPerPage);
  const safeVehiclePage = Math.min(vehiclePage, Math.max(1, totalVehiclePages));
  const paginatedVehicles = vehicles.slice(
    (safeVehiclePage - 1) * vehiclesPerPage,
    safeVehiclePage * vehiclesPerPage
  );

  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [sections, setSections] = useState<SectionDto[]>([]);
  const [heroSection, setHeroSection] = useState<SectionDto | null>(null);
  const [introSection, setIntroSection] = useState<SectionDto | null>(null);

  const [formVehicleId, setFormVehicleId] = useState<string>("");
  const [formDateRange, setFormDateRange] = useState<{ start: DateValue; end: DateValue } | null>(() => {
    const t = today(getLocalTimeZone());
    return { start: t, end: t };
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [formName, setFormName] = useState<string>("");
  const [formPhone, setFormPhone] = useState<string>("");

  const formDays = useMemo(() => {
    return calculateRentalDays(formDateRange?.start, formDateRange?.end);
  }, [formDateRange]);

  const [vehicleCategories, setVehicleCategories] = useState<VehicleCategoryDto[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const bookableCategories = vehicleCategories.filter(cat =>
    vehicles.some(v => v.vehicleCategoryId === cat.id)
  );

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  const getTranslation = (
    translations: { locale: string; name?: string; description?: string }[] | undefined,
  ) => {
    if (!translations?.length) return undefined;
    return translations.find(t => t.locale === language)
      || translations.find(t => t.locale === "en")
      || translations.find(t => t.locale === "vi")
      || translations[0];
  };

  useEffect(() => {
    getActiveSections("/self-drive", language).then(secList => {
      setSections(secList);
      const hero = secList.find(s => s.sectionType === "HERO_BANNER");
      if (hero) setHeroSection(hero);
      const intro = secList.find(s => s.sectionType === "FEATURES" || s.sectionType === "INTRO" || s.sectionType === "TEXT_CONTENT");
      if (intro) setIntroSection(intro);
    }).catch(() => { });
  }, [language]);

  useEffect(() => {
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
        rentals = rentRes?.data || [];
      } catch (e) {
        console.error("Failed to fetch active rentals:", e);
      }

      if (!active) return;

      const getCategoryIdFromCapacity = (seatCapacity: number): number => {
        const match = categories.find(c => seatCapacity >= c.minSeat && seatCapacity <= c.maxSeat);
        return match ? match.id : (categories[0]?.id || 0);
      };

      let vehiclesFromApi: Vehicle[] = [];

      if (rentals.length > 0 && categories.length > 0) {
        const catMap = new Map<number, VehicleCategoryDto>();
        categories.forEach(c => catMap.set(c.id, c));

        try {
          // Fetch rental prices and category thumbnails in parallel
          const [priceResults, categoryThumbResults] = await Promise.all([
            Promise.all(
              rentals.filter(r => !r.driverRequired).map(r =>
                getRentalPricesByRental(r.id).then(res => ({
                  rentalId: r.id,
                  prices: (res?.data || []) as RentalPriceDto[]
                })).catch(() => ({ rentalId: r.id, prices: [] as RentalPriceDto[] }))
              )
            ),
            Promise.all(
              categories.map(async (c) => {
                if (c.thumbnailUrl) {
                  const url = c.thumbnailUrl.startsWith("http") ? c.thumbnailUrl : `${backendUrl}${c.thumbnailUrl}`;
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
            )
          ]);

          const priceMap = new Map<number, RentalPriceDto[]>();
          priceResults.forEach(p => priceMap.set(p.rentalId, p.prices));

          const catThumbMap = new Map<number, string>();
          categoryThumbResults.forEach(ct => catThumbMap.set(ct.categoryId, ct.thumbnailUrl));

          vehiclesFromApi = rentals
            .filter(r => !r.driverRequired)
            .map(r => {
              const cat = catMap.get(r.vehicleCategoryId);
              const trans = getTranslation(cat?.translations);
              const name = trans?.name
                || cat?.translations?.find(t => t.locale === "en")?.name
                || cat?.translations?.find(t => t.locale === "vi")?.name
                || "Phân khúc xe";
              const desc = trans?.description
                || cat?.translations?.find(t => t.locale === "en")?.description
                || cat?.translations?.find(t => t.locale === "vi")?.description
                || "";

              let capacity = "5";
              let luggageVal = "2-3";
              if (cat) {
                capacity = `${cat.minSeat}-${cat.maxSeat}`;
                luggageVal = `${cat.minLuggage}-${cat.maxLuggage}`;
              }

              let features = desc.split(/[,\n;•✓]/).map(f => f.trim()).filter(f => f.length > 2);

              const rentalPrices = priceMap.get(r.id) || [];
              const activePrice = rentalPrices.find(p => p.active && p.vehicleCategoryId === r.vehicleCategoryId);
              const dailyRate = activePrice ? Number(activePrice.amount) : 0;
              const categorySlug = getCanonicalSlug(cat, language, "xe-tu-lai");
              const imgUrl = catThumbMap.get(r.vehicleCategoryId) || "";

              return {
                id: `${r.id}-${r.vehicleCategoryId}`,
                rentalId: r.id,
                vehicleCategoryId: r.vehicleCategoryId,
                categorySlug,
                nameVi: name,
                nameEn: name,
                descVi: desc,
                descEn: desc,
                pricePerDay: dailyRate,
                deposit: r.deposit || 0,
                minimumDays: r.minimumDays || 1,
                featuresVi: features,
                featuresEn: features,
                capacity,
                luggage: `${t.selfDrive.luggageMaxLabel}: ${luggageVal} ${t.selfDrive.bags || "vali"}`,
                imgUrl,
              };
            });
        } catch (e) {
          console.error("Failed to map vehicles from API:", e);
        }
      }

      if (vehiclesFromApi.length > 0) {
        if (active) {
          setVehicleCategories(categories);
          setVehicles(vehiclesFromApi);
          setSelectedVehicleId(vehiclesFromApi[0].id);
        }
      } else {
        // Fallback: load from services API
        let fallbackSuccess = false;
        try {
          const serviceRes = await getPublicServices(3);
          if (!active) return;
          if (serviceRes?.data) {
            const vehicleService = serviceRes.data.find(s => s.applyVehiclePricing === true);
            if (vehicleService?.options?.length) {
              const mapped = await Promise.all(
                vehicleService.options.map(async (opt) => {
                  const trans = getTranslation(opt.translations);
                  const name = trans?.name
                    || opt.translations?.find(t => t.locale === "en")?.name
                    || opt.translations?.find(t => t.locale === "vi")?.name
                    || opt.vehicleBrand
                    || "";
                  const desc = trans?.description
                    || opt.translations?.find(t => t.locale === "en")?.description
                    || opt.translations?.find(t => t.locale === "vi")?.description
                    || "";

                  let imgUrl = "";
                  if (opt.thumbnailId) {
                    try {
                      const media = await getMediaDetails(opt.thumbnailId);
                      if (media?.filePath) {
                        imgUrl = media.filePath.startsWith("http")
                          ? media.filePath
                          : `${backendUrl}${media.filePath}`;
                      }
                    } catch (e) {
                      console.error("Failed to load vehicle image:", e);
                    }
                  }

                  let features = desc.split(/[,\n;•✓]/).map(f => f.trim()).filter(f => f.length > 2);

                  const matchedCatId = getCategoryIdFromCapacity(opt.seatCapacity || 5);

                  return {
                    id: opt.id?.toString() || Math.random().toString(),
                    rentalId: 0,
                    vehicleCategoryId: matchedCatId,
                    nameVi: name,
                    nameEn: name,
                    descVi: desc,
                    descEn: desc,
                    pricePerDay: opt.price,
                    deposit: 500000,
                    minimumDays: 1,
                    featuresVi: features,
                    featuresEn: features,
                    capacity: opt.seatCapacity?.toString() || "5",
                    luggage: `${t.selfDrive.luggageMaxLabel}: ${opt.maxLuggage || 2} ${t.selfDrive.bags || "vali"}`,
                    imgUrl
                  };
                })
              );
              if (active && mapped.length > 0) {
                if (categories.length === 0) {
                  const defaultCat: VehicleCategoryDto = {
                    id: 0,
                    code: "default",
                    minSeat: 4,
                    maxSeat: 7,
                    minLuggage: 2,
                    maxLuggage: 4,
                    unitLuggage: "vali",
                    active: true,
                    default: true,
                    translations: [
                      { id: 99, locale: "vi", name: "Dòng xe phổ thông", slug: "standard", description: "Các dòng xe tự lái" },
                      { id: 100, locale: "en", name: "Standard Category", slug: "standard", description: "Self-drive vehicles" }
                    ]
                  };
                  setVehicleCategories([defaultCat]);
                  mapped.forEach(m => m.vehicleCategoryId = 0);
                } else {
                  setVehicleCategories(categories);
                }

                setVehicles(mapped);
                setSelectedVehicleId(mapped[0].id);
                fallbackSuccess = true;
              }
            }
          }
        } catch (e) {
          console.error("Services fallback failed:", e);
        }


      }

      if (active) {
        setVehiclesLoading(false);
      }
    }

    loadVehicles();
    return () => { active = false; };
  }, [language]);

  useEffect(() => {
    if (vehicles.length > 0 && bookableCategories.length > 0 && !selectedCategoryId) {
      const firstCat = bookableCategories[0];
      const matchedVehicle = vehicles.find(v => v.vehicleCategoryId === firstCat.id);
      if (matchedVehicle) {
        setFormVehicleId(matchedVehicle.id);
        setSelectedCategoryId(String(firstCat.id));
      }
    }
  }, [vehicles, bookableCategories, selectedCategoryId]);

  const handleCall = () => window.open(`tel:${contacts.phone}`);

  const handleQuickBookSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const vId = formVehicleId || vehicles[0]?.id;
    if (!vId) return;
    const targetVeh = vehicles.find((v) => v.id === vId) || vehicles[0];
    const catSlug = targetVeh?.categorySlug || "xe-tu-lai";
    const catId = targetVeh?.vehicleCategoryId;
    const params = new URLSearchParams();
    if (catId) params.set("id", String(catId));
    params.set("vehicleId", vId);
    if (formDateRange?.start) params.set("pickupDate", formatToIsoDate(formDateRange.start));
    if (formDateRange?.end) params.set("returnDate", formatToIsoDate(formDateRange.end));
    params.set("days", String(formDays));
    if (formName.trim()) params.set("customerName", formName.trim());
    if (formPhone.trim()) params.set("customerPhone", formPhone.trim());
    router.push(`/${language}/self-drive/${catSlug}/confirm?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 flex flex-col font-sans">

      {/* Hero Banner Section */}
      <section className="relative w-full min-h-[340px] flex items-center pt-28 pb-14 px-4 sm:px-6 lg:px-8 xl:px-10 [overflow:clip]">
        <div
          className={`absolute inset-0 ${heroSection?.imageUrls?.[0] ? "bg-cover bg-center bg-no-repeat" : "bg-gradient-to-br from-slate-900 to-slate-800"}`}
          style={heroSection?.imageUrls?.[0] ? { backgroundImage: `url('${heroSection.imageUrls[0]}')` } : undefined}
        >
          <div className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-[1.5px]" />
        </div>

        <div className="max-w-[1536px] mx-auto w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10 text-white">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 dark:bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
              <Sparkles size={13} className="text-accent" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-100">
                {heroSection?.translations?.find(tr => tr.locale === language)?.subtitle || t.selfDrive.subtitle}
              </span>
            </div>
            <Typography type="h1" className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
              {heroSection?.translations?.find(tr => tr.locale === language)?.title || t.selfDrive.title}
            </Typography>
            <FormattedDescription
              description={heroSection?.translations?.find(tr => tr.locale === language)?.description || t.selfDrive.heroDesc}
              className="text-sm md:text-base text-slate-200 font-semibold max-w-2xl"
            />

            <div className="flex flex-wrap gap-3 pt-2">
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/15 backdrop-blur-sm shadow-sm">
                <Car size={15} className="text-blue-400" />
                <span className="text-xs font-black">
                  {t.selfDrive.price5Seater}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/15 backdrop-blur-sm shadow-sm">
                <Car size={15} className="text-green-400" />
                <span className="text-xs font-black">
                  {t.selfDrive.price7Seater}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Booking Form */}
          <div className="w-full max-w-sm dark:backdrop-blur-xl bg-white dark:bg-black p-6 rounded-3xl border border-white/20 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-slate-800 flex flex-col gap-4">
            <div className="space-y-1 pb-3 border-b border-white/20 dark:border-slate-700">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-accent">
                {t.selfDrive.quickBookLabel}
              </span>
              <Typography className="text-sm font-extrabold uppercase tracking-wider">
                {t.selfDrive.selfDriveRental}
              </Typography>
            </div>

            <Form className="flex flex-col gap-4" onSubmit={handleQuickBookSubmit}>
              {/* Vehicle Select */}
              <div className="space-y-1">
                <Select
                  isRequired
                  className="w-full"
                  placeholder={t.selfDrive.selectCategoryPlaceholder}
                  selectedKey={selectedCategoryId || null}
                  onSelectionChange={(key) => { if (key) { const catId = Number(key); const matchedVehicle = vehicles.find(v => v.vehicleCategoryId === catId); if (matchedVehicle) { setFormVehicleId(matchedVehicle.id); setSelectedCategoryId(String(catId)); } } else { setFormVehicleId(""); setSelectedCategoryId(""); } }}
                >
                  <Label className="text-[10px] font-bold uppercase tracking-wider block mb-1">{t.selfDrive.selectCategory}</Label>
                  <Select.Trigger className="w-full h-10 bg-white/15 dark:bg-black/30 border border-white/20 dark:border-slate-700 rounded-xl px-3 flex items-center justify-between cursor-pointer hover:bg-white/20 transition-all outline-none">
                    <Select.Value className="text-xs font-semibold" />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xl z-50 w-[var(--trigger-width)]">
                    <ListBox className="outline-none">
                      {bookableCategories.map((cat) => {
                        const tr = cat.translations?.find(t => t.locale === language) || cat.translations?.[0];
                        const name = tr?.name || cat.code;
                        return (
                          <ListBox.Item key={cat.id} id={String(cat.id)} textValue={name} className="text-xs font-semibold px-3 py-2 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] rounded-lg cursor-pointer text-slate-800 dark:text-slate-100 flex items-center justify-between outline-none">
                            {name}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        );
                      })}
                    </ListBox>
                  </Select.Popover>
                  <FieldError className="text-[10px] text-red-500 font-bold mt-1">
                    {t.selfDrive.selectCategoryError}
                  </FieldError>
                </Select>
              </div>

              {/* Date Range Selection (HeroUI RangeCalendar) */}
              <div className="space-y-1">
                <Label className="text-[0.625rem] font-bold uppercase tracking-wider block mb-1">
                  {t.selfDrive.rentalPeriod}
                </Label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    className="w-full h-10 bg-white/15 dark:bg-black/30 hover:bg-white/20 dark:hover:bg-black/40 border border-white/20 dark:border-slate-700 rounded-xl px-3 flex items-center justify-between text-xs font-semibold cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <CalendarDays size={15} className="text-accent shrink-0" />
                      <span className="truncate">
                        {formDateRange?.start && formDateRange?.end
                          ? `${formatToDisplayDate(formDateRange.start)} - ${formatToDisplayDate(formDateRange.end)}`
                          : t.selfDrive.rentalPeriod}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-accent/20 text-accent text-[10px] font-black shrink-0">
                      {formDateRange?.start && formDateRange?.end && formDateRange.start.compare(formDateRange.end) === 0
                        ? t.selfDrive.sameDayRental
                        : t.selfDrive.calculatedDays.replace("{days}", String(formDays))}
                    </span>
                  </button>

                  {isCalendarOpen && (
                    <div className="absolute top-12 left-0 z-50 p-3 rounded-2xl bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 shadow-2xl">
                      <RangeCalendar
                        aria-label={t.selfDrive.rentalPeriod}
                        firstDayOfWeek="mon"
                        minValue={todayDate}
                        value={formDateRange}
                        onChange={(v) => {
                          if (v) {
                            setFormDateRange(v);
                          }
                        }}
                        className="w-72"
                      >
                        <RangeCalendar.Header className="flex items-center justify-between mb-2">
                          <RangeCalendar.Heading className="text-xs font-bold text-slate-900 dark:text-white" />
                          <div className="flex items-center gap-1">
                            <RangeCalendar.NavButton slot="previous" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer text-slate-600 dark:text-slate-300" />
                            <RangeCalendar.NavButton slot="next" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer text-slate-600 dark:text-slate-300" />
                          </div>
                        </RangeCalendar.Header>
                        <RangeCalendar.Grid className="w-full">
                          <RangeCalendar.GridHeader className="text-slate-400 dark:text-slate-500 text-[10px] font-bold">
                            {(day) => <RangeCalendar.HeaderCell className="w-full text-center py-1">{day}</RangeCalendar.HeaderCell>}
                          </RangeCalendar.GridHeader>
                          <RangeCalendar.GridBody>
                            {(date) => <RangeCalendar.Cell date={date} />}
                          </RangeCalendar.GridBody>
                        </RangeCalendar.Grid>
                      </RangeCalendar>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                        <span className="text-[10px] font-extrabold text-accent">
                          {formDays} {t.selfDrive.dayUnit}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsCalendarOpen(false)}
                          className="text-[11px] font-bold text-slate-500 hover:text-accent cursor-pointer"
                        >
                          Xong
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Info Header with Autofill */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t.selfDrive.contactInfo}</span>
                <AutofillButton
                  onFill={(d) => {
                    setFormName(d.fullname);
                    setFormPhone(d.phone);
                  }}
                  label={t.common.autoFill}
                />
              </div>

              {/* Name */}
              <div className="space-y-1">
                <TextField isRequired className="w-full" name="customerName">
                  <Label className="text-[10px] font-bold uppercase tracking-wider block mb-1">{t.selfDrive.customerName}</Label>
                  <Input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={t.selfDrive.customerName}
                    className="w-full h-10 bg-white/15 dark:bg-black/30 border border-white/20 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold outline-none focus:border-accent transition-all"
                  />
                  <FieldError className="text-[10px] text-red-500 font-bold mt-1">
                    {t.selfDrive.nameError}
                  </FieldError>
                </TextField>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <TextField isRequired className="w-full" name="customerPhone">
                  <Label className="text-[10px] font-bold uppercase tracking-wider block mb-1">{t.selfDrive.customerPhone}</Label>
                  <Input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder={t.selfDrive.customerPhone}
                    className="w-full h-10 bg-white/15 dark:bg-black/30 border border-white/20 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold outline-none focus:border-accent transition-all"
                  />
                  <FieldError className="text-[10px] text-red-500 font-bold mt-1">
                    {t.selfDrive.phoneError}
                  </FieldError>
                </TextField>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-accent hover:bg-accent-hover rounded-2xl text-xs font-black transition-all shadow-md flex items-center justify-center cursor-pointer hover:scale-[1.01] active:scale-95 border-none"
              >
                <span>{t.selfDrive.bookNowBtn}</span>
              </button>
            </Form>

            <p className="text-[0.625rem] text-center font-medium">
              {t.selfDrive.guarantee}
            </p>
          </div>
        </div>
      </section>

      {/* Main Layout Area */}
      <main className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-8 flex-1 space-y-8">
        <div className="bg-white dark:bg-[var(--bg-card)] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/80 leading-relaxed font-semibold text-xs md:text-sm text-slate-600 dark:text-slate-300">
          <p>
            {introSection?.translations?.find(t => t.locale === language)?.description
              || introSection?.translations?.[0]?.description
              || t.selfDrive.introDescription}
          </p>
        </div>

        {/* Catalog & Car list */}
        <div className="space-y-4">
          <Typography type="h2" className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="bg-accent w-2.5 h-5 rounded-full inline-block" />
            {t.selfDrive.vehicleList}
          </Typography>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider pl-1">
            {t.selfDrive.vehicleListSubtitle}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {vehiclesLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-black">
                    <Skeleton className="h-44 w-full rounded-none" />
                    <div className="p-5 space-y-3">
                      <div className="flex justify-between items-start">
                        <Skeleton className="h-4 w-36 rounded-lg" />
                        <Skeleton className="h-5 w-14 rounded" />
                      </div>
                      <Skeleton className="h-3 w-48 rounded-lg" />
                      <Skeleton className="h-3 w-full rounded-lg" />
                      <div className="flex flex-wrap gap-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                        <Skeleton className="h-5 w-16 rounded-lg" />
                        <Skeleton className="h-5 w-20 rounded-lg" />
                        <Skeleton className="h-5 w-14 rounded-lg" />
                      </div>
                    </div>
                  </div>
                ))
              ) : paginatedVehicles.map((vehicle) => {
                const isSelected = selectedVehicleId === vehicle.id;
                const slug = vehicle.categorySlug || "xe-tu-lai";
                const goToDetail = () => {
                  router.push(`/${language}/self-drive/${slug}?id=${vehicle.vehicleCategoryId}`);
                };

                return (
                  <div
                    key={vehicle.id}
                    onClick={goToDetail}
                    className={`flex flex-col rounded-3xl overflow-hidden border cursor-pointer transition-all duration-300 bg-white dark:bg-black ${isSelected
                      ? "border-accent border-2 shadow-md ring-2 ring-accent/10"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                      }`}
                  >
                    <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-[var(--bg-card)] flex items-center justify-center">
                      {vehicle.imgUrl ? (
                        <img
                          src={vehicle.imgUrl}
                          alt=""
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-slate-400">
                          <Car size={32} className="opacity-40" />
                          <span className="text-[10px] font-semibold">{t.selfDrive.noPhotos}</span>
                        </div>
                      )}
                      <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-extrabold px-3 py-1 rounded-full tracking-wider">
                        {vehicle.pricePerDay.toLocaleString("vi-VN")}đ{t.selfDrive.perTrip.startsWith("/") ? t.selfDrive.perTrip : `/${t.selfDrive.perTrip}`}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <Typography type="h4" className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {language === "vi" ? vehicle.nameVi : vehicle.nameEn}
                          </Typography>
                          <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-[var(--bg-card)] px-2 py-0.5 rounded">
                            {vehicle.capacity} {t.selfDrive.capacity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                          {language === "vi" ? vehicle.descVi : vehicle.descEn}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/60">
                        {(language === "vi" ? vehicle.featuresVi : vehicle.featuresEn).map((f, i) => (
                          <span
                            key={i}
                            className="text-[9px] font-extrabold uppercase bg-slate-100 dark:bg-blend-lighten px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-800"
                          >
                            <span className="text-green-400">✓</span> {f}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/${language}/self-drive/${slug}/confirm?id=${vehicle.vehicleCategoryId}&vehicleId=${vehicle.id}`);
                          }}
                          className="flex-1 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer border-none"
                        >
                          {t.selfDrive.bookNowBtn}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            goToDetail();
                          }}
                          className="shrink-0 py-2.5 px-4 bg-slate-100 dark:bg-[var(--bg-card)] hover:bg-slate-200 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200 rounded-xl text-xs font-extrabold transition-all cursor-pointer border-none whitespace-nowrap"
                        >
                          {t.selfDrive.details || t.common.details || "Chi tiết"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalVehiclePages > 1 && (
              <div className="flex justify-center pt-6">
                <Pagination size="sm">
                  <Pagination.Summary>
                    {`${safeVehiclePage} / ${totalVehiclePages} ${t.common.page}`}
                  </Pagination.Summary>
                  <Pagination.Content>
                    <Pagination.Item>
                      <Pagination.Previous isDisabled={safeVehiclePage <= 1} onPress={() => setVehiclePage(Math.max(1, safeVehiclePage - 1))}>
                        <Pagination.PreviousIcon />
                      </Pagination.Previous>
                    </Pagination.Item>
                    {Array.from({ length: totalVehiclePages }, (_, i) => i + 1).map((p) => (
                      <Pagination.Item key={p}>
                        <Pagination.Link isActive={p === safeVehiclePage} onPress={() => setVehiclePage(p)}>{p}</Pagination.Link>
                      </Pagination.Item>
                    ))}
                    <Pagination.Item>
                      <Pagination.Next isDisabled={safeVehiclePage >= totalVehiclePages} onPress={() => setVehiclePage(Math.min(totalVehiclePages, safeVehiclePage + 1))}>
                        <Pagination.NextIcon />
                      </Pagination.Next>
                    </Pagination.Item>
                  </Pagination.Content>
                </Pagination>
              </div>
            )}
          </div>

          {/* Pricing Table Section */}
          <div className="space-y-4">
            <Typography type="h2" className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="bg-accent w-2.5 h-5 rounded-full inline-block" />
              {t.selfDrive.priceOneWay}
            </Typography>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t.selfDrive.priceTableDesc}
            </p>

            <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-black shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 dark:bg-black/60 border-b border-slate-200 dark:border-slate-800/80 font-black text-slate-900 dark:text-white text-[11px] uppercase tracking-wider">
                      <th className="p-4">{t.selfDrive.segmentHeader}</th>
                      <th className="p-4 text-right">{t.selfDrive.dailyRateHeader}</th>
                      <th className="p-4 text-right">{t.selfDrive.depositHeader}</th>
                      <th className="p-4 text-right">{t.selfDrive.minDaysHeader}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                    {vehicles.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/55 dark:hover:bg-[var(--bg-card)]/40 transition-colors">
                        <td className="p-4 font-bold text-slate-900 dark:text-slate-200">
                          {language === "vi" ? v.nameVi : v.nameEn}
                        </td>
                        <td className="p-4 text-right font-extrabold text-accent">
                          {v.pricePerDay.toLocaleString("vi-VN")}đ
                        </td>
                        <td className="p-4 text-right">
                          {v.deposit.toLocaleString("vi-VN")}đ
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

            <div className="p-4 bg-blue-50/40 dark:bg-black/30 border border-blue-500/10 rounded-2xl flex items-start gap-2.5">
              <span className="text-accent shrink-0 text-sm">💡</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                {t.selfDrive.airportTransferNoticeBefore}{" "}
                <a href="/airport-transfer" className="text-accent underline font-extrabold">
                  {t.selfDrive.airportTransferLinkText}
                </a>
                {t.selfDrive.airportTransferNoticeAfter}
              </p>
            </div>
          </div>

          {/* Procedure steps */}
          <div className="space-y-4">
            <Typography type="h2" className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="bg-accent w-2.5 h-5 rounded-full inline-block" />
              {t.selfDrive.procedureTitle}
            </Typography>

            <div className="grid grid-cols-1 gap-4">
              {[
                {
                  step: 1,
                  title: t.selfDrive.step1Title,
                  desc: t.selfDrive.step1Desc,
                  icon: <Phone className="text-blue-600" size={16} />
                },
                {
                  step: 2,
                  title: t.selfDrive.step2Title,
                  desc: t.selfDrive.step2Desc,
                  icon: <FileText className="text-amber-600" size={16} />
                },
                {
                  step: 3,
                  title: t.selfDrive.step3Title,
                  desc: t.selfDrive.step3Desc,
                  icon: <DollarSign className="text-green-600" size={16} />
                },
                {
                  step: 4,
                  title: t.selfDrive.step4Title,
                  desc: t.selfDrive.step4Desc,
                  icon: <UserCheck className="text-indigo-600" size={16} />
                },
                {
                  step: 5,
                  title: t.selfDrive.step5Title,
                  desc: t.selfDrive.step5Desc,
                  icon: <ShieldCheck className="text-emerald-600" size={16} />
                }
              ].map((stepItem, idx) => (
                <div key={idx} className="flex gap-4 p-4 bg-white dark:bg-black border border-slate-200/50 dark:border-slate-800/80 rounded-2xl shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-black flex items-center justify-center shrink-0">
                    {stepItem.icon}
                  </div>
                  <div className="space-y-1">
                    <Typography type="h4" className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {stepItem.title}
                    </Typography>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                      {stepItem.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call to action panel */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
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
                className="flex items-center gap-1.5 bg-white text-blue-700 hover:bg-slate-100 px-4 py-2.5 rounded-xl text-xs font-black shadow-sm transition-all border-none cursor-pointer"
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
          </div>

          {/* FAQ Accordions */}
          <div className="space-y-4 bg-white dark:bg-black p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
            <Typography type="h3" className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
              {t.selfDrive.faqSectionTitle}
            </Typography>

            {[
              {
                q: t.selfDrive.faq1,
                a: t.selfDrive.faq1Answer
              },
              {
                q: t.selfDrive.faq2,
                a: t.selfDrive.faq2Answer
              },
              {
                q: t.selfDrive.faq3,
                a: t.selfDrive.faq3Answer
              }
            ].map((faq, index) => {
              const isOpen = activeFaq === index;

              return (
                <div
                  key={index}
                  className="border-b border-slate-100 dark:border-slate-800/80 pb-2.5 last:border-0 last:pb-0"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between text-left py-2 hover:text-accent transition-colors cursor-pointer border-none bg-transparent"
                  >
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {faq.q}
                    </span>
                    <span className="text-slate-400 dark:text-slate-600 font-bold ml-2">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1.5 pb-1 font-semibold pl-1">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
      </main>


    </div>
  );
}

