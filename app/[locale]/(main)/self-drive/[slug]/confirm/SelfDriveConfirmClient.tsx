"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Label,
  Button,
  Skeleton,
  Input,
  TextField,
  TextArea,
  RangeCalendar,
  FieldError,
} from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { getLocalTimeZone, today, parseDate } from "@internationalized/date";
import {
  calculateRentalDays,
  formatToIsoDate,
  formatToDisplayDate,
} from "@/lib/utils/rentalDate";
import {
  Car,
  MapPin,
  CalendarDays,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Ban,
  AlertCircle,
  Sparkles,
  Users,
  Fuel,
  ChevronRight,
  ShieldCheck,
  Clock,
  FileText,
} from "lucide-react";
import { HighlightBadge } from "@/components/common/HighlightBadge";

import { TimePicker, type TimeValue } from "@/components/time-picker";
import { useI18n } from "@/context/LanguageContext";
import { useAuthStore } from "@/lib/store/authStore";
import { AutofillButton } from "@/components/AutofillButton";
import { getActiveRentals, getRentalPricesByRental, type RentalPriceDto } from "@/lib/api/selfDrive";
import {
  createSelfDriveBooking,
  getSelfDriveAvailability,
  type CategoryAvailabilityDto,
} from "@/lib/api/self-drive/bookings";
import { calculateDeposit, DepositType } from "@/lib/pricing/deposit";
import {
  getVehicleCategories,
  getVehicleCategoryByIdOrSlug,
  getPublicAddOnCategories,
  getRentableVehiclesByCategory,
  type VehicleCategoryDto,
  type PublicAddOnCategoryDto,
  type VehicleDto,
} from "@/lib/api/fleet";
import BookingConfirmationModal from "@/components/BookingConfirmationModal";
import SuccessOverlay from "@/components/SuccessOverlay";
import ErrorOverlay from "@/components/ErrorOverlay";
import type { SectionDto } from "@/lib/api/sections";
import { SectionRenderer } from "@/components/sections/SectionRenderer";
import { CustomerDiscountSection, type AppliedDiscountInfo } from "@/components/common/CustomerDiscountSection";
import { Reveal } from "@/components/Reveal";

interface SelfDriveConfirmClientProps {
  categoryIdentifier: string;
  sections?: SectionDto[];
}

interface CategoryVehicleData {
  rentalId: number;
  vehicleCategoryId: number;
  name: string;
  desc: string;
  pricePerDay: number;
  deposit: number;
  depositType?: "FIXED" | "PERCENT";
  depositRate?: number;
  minimumDays: number;
  capacity: string;
  categoryTotalVehicles?: number;
  categoryAvailableVehicles?: number;
}

export default function SelfDriveConfirmClient({
  categoryIdentifier,
  sections = [],
}: SelfDriveConfirmClientProps) {
  const { language, t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const categoryIdParam = searchParams.get("id") || searchParams.get("categoryId");
  const vehicleIdParam = searchParams.get("vehicleId");

  const [categoryData, setCategoryData] = useState<CategoryVehicleData | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscountInfo | null>(null);
  const [concreteVehicles, setConcreteVehicles] = useState<VehicleDto[]>([]);
  const [selectedConcreteVehicle, setSelectedConcreteVehicle] = useState<VehicleDto | null>(null);
  const [loading, setLoading] = useState(true);

  // Availability
  const [availabilities, setAvailabilities] = useState<CategoryAvailabilityDto[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // Add-ons (Fuel & Seat)
  const [filterableAddOnCategories, setFilterableAddOnCategories] = useState<PublicAddOnCategoryDto[]>([]);
  const [selectedFuelAddOnId, setSelectedFuelAddOnId] = useState<number | null>(null);
  const [selectedFuelType, setSelectedFuelType] = useState<string>("all");

  // Form Fields
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [zaloId, setZaloId] = useState("");
  const [kakaoTalkId, setKakaoTalkId] = useState("");
  const [dateRange, setDateRange] = useState<{ start: DateValue; end: DateValue } | null>(() => {
    const t = today(getLocalTimeZone());
    return { start: t, end: t };
  });
  const [timeValue, setTimeValue] = useState<TimeValue>({ hour: 8, minute: 0, period: "AM" });
  const [pickupLocation, setPickupLocation] = useState("");
  const [notes, setNotes] = useState("");

  const [price, setPrice] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const rentalDays = useMemo(() => {
    if (!dateRange?.start || !dateRange?.end) {
      return categoryData?.minimumDays || 1;
    }
    return calculateRentalDays(dateRange.start, dateRange.end, categoryData?.minimumDays || 1);
  }, [dateRange, categoryData?.minimumDays]);

  const currentDate = today(getLocalTimeZone());
  const isDateInvalid = Boolean(
    !dateRange?.start ||
    !dateRange?.end ||
    dateRange.start.compare(currentDate) < 0 ||
    dateRange.end.compare(dateRange.start) < 0
  );

  // 1. Fetch Category and Pricing
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const [rentalsRes, categoriesRes, catDetailRes] = await Promise.all([
          getActiveRentals({ skipTranslationFilter: true }),
          getVehicleCategories({ active: true }, { skipTranslationFilter: true }),
          getVehicleCategoryByIdOrSlug(categoryIdentifier).catch(() => null),
        ]);

        if (!active) return;

        const rentals = rentalsRes?.data || [];
        const categories = categoriesRes?.data?.content || [];
        const targetCategory =
          catDetailRes?.data ||
          categories.find((c) => String(c.id) === categoryIdParam || String(c.id) === categoryIdentifier);

        const categoryId = targetCategory?.id || (categoryIdParam ? Number(categoryIdParam) : null);

        if (!categoryId) {
          setLoading(false);
          return;
        }

        const relatedRental = rentals.find((r) => !r.driverRequired && r.vehicleCategoryId === categoryId) || rentals.find((r) => !r.driverRequired);

        let dailyRate = 0;
        if (relatedRental) {
          try {
            const pricesRes = await getRentalPricesByRental(relatedRental.id);
            const rentalPrices = (pricesRes?.data || []) as RentalPriceDto[];
            const activePrice = rentalPrices.find((p) => p.active && p.vehicleCategoryId === categoryId) || rentalPrices.find((p) => p.active);
            if (activePrice) dailyRate = Number(activePrice.amount);
          } catch {
            dailyRate = 0;
          }
        }

        const trans =
          targetCategory?.translations?.find((tr) => tr.locale === language) ||
          targetCategory?.translations?.find((tr) => tr.locale === "vi") ||
          targetCategory?.translations?.[0];

        const name = trans?.name || targetCategory?.code || "Phân khúc xe";
        const desc = trans?.description || "";
        const capacity = targetCategory ? `${targetCategory.minSeat}-${targetCategory.maxSeat}` : "4-7";

        const mappedData: CategoryVehicleData = {
          rentalId: relatedRental?.id || 1,
          vehicleCategoryId: categoryId,
          name,
          desc,
          pricePerDay: dailyRate,
          deposit: relatedRental?.deposit || 0,
          depositType: relatedRental?.depositType,
          depositRate: relatedRental?.depositRate,
          minimumDays: relatedRental?.minimumDays || 1,
          capacity,
          categoryTotalVehicles: targetCategory?.totalVehicles,
          categoryAvailableVehicles: targetCategory?.availableVehicles,
        };

        setCategoryData(mappedData);

        // Fetch concrete vehicles under this category
        try {
          const vehsRes = await getRentableVehiclesByCategory(categoryId);
          if (vehsRes?.data && active) {
            setConcreteVehicles(vehsRes.data);
            if (vehicleIdParam) {
              const matchedVeh = vehsRes.data.find(
                (v) => String(v.id) === vehicleIdParam || `${mappedData.rentalId}-${mappedData.vehicleCategoryId}` === vehicleIdParam
              );
              if (matchedVeh) setSelectedConcreteVehicle(matchedVeh);
            }
          }
        } catch (vehErr) {
          console.error("Failed to load category vehicles:", vehErr);
        }
      } catch (err) {
        console.error("Failed to load self-drive confirm data:", err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [categoryIdentifier, categoryIdParam, language, vehicleIdParam]);

  // 2. Load Add-ons
  useEffect(() => {
    let active = true;
    getPublicAddOnCategories({ locale: language, filterableOnly: true })
      .then((res) => {
        if (active && res?.data) {
          setFilterableAddOnCategories(res.data);
        }
      })
      .catch((err) => console.error("Failed to load add-ons:", err));
    return () => {
      active = false;
    };
  }, [language]);

  // 3. Populate query params into initial form state
  useEffect(() => {
    const pickupDateParam = searchParams.get("pickupDate") || searchParams.get("date");
    const returnDateParam = searchParams.get("returnDate");
    const daysParam = searchParams.get("days");

    if (pickupDateParam) {
      try {
        const start = parseDate(pickupDateParam);
        let end = start;
        if (returnDateParam) {
          end = parseDate(returnDateParam);
        } else if (daysParam) {
          const parsedDays = parseInt(daysParam, 10);
          if (!isNaN(parsedDays) && parsedDays > 1) {
            end = start.add({ days: parsedDays });
          }
        }
        setDateRange({ start, end });
      } catch {
        // ignore invalid date
      }
    }

    const pickupLocParam = searchParams.get("pickupLocation") || searchParams.get("pickup");
    if (pickupLocParam) setPickupLocation(pickupLocParam);

    const nameParam = searchParams.get("customerName");
    if (nameParam) setCustomerName(nameParam);

    const phoneParam = searchParams.get("customerPhone");
    if (phoneParam) setCustomerPhone(phoneParam);
  }, [searchParams]);

  // 4. Autofill User info if logged in
  useEffect(() => {
    if (user) {
      if (user.fullname && !customerName) setCustomerName(user.fullname);
      if (user.email && !customerEmail) setCustomerEmail(user.email);
      if (user.phone && !customerPhone) setCustomerPhone(user.phone);
    }
  }, [user, customerName, customerEmail, customerPhone]);

  // 5. Availability Check
  useEffect(() => {
    if (!dateRange?.start || !dateRange?.end || isDateInvalid || !categoryData) {
      setAvailabilities([]);
      return;
    }

    let active = true;
    setIsCheckingAvailability(true);

    const startDate = formatToIsoDate(dateRange.start);
    const endDate = formatToIsoDate(dateRange.end);

    getSelfDriveAvailability({
      startDate,
      endDate,
      categoryId: categoryData.vehicleCategoryId,
      locale: language,
    })
      .then((res) => {
        if (active && res?.data) {
          setAvailabilities(res.data);
        }
      })
      .catch((err) => console.error("Failed to check availability:", err))
      .finally(() => {
        if (active) setIsCheckingAvailability(false);
      });

    return () => {
      active = false;
    };
  }, [dateRange, isDateInvalid, categoryData, language]);

  const availability = availabilities.find((a) => a.vehicleCategoryId === categoryData?.vehicleCategoryId);
  const currentAvailableCount =
    availability !== undefined ? availability.availableVehicles : (categoryData?.categoryAvailableVehicles ?? 0);
  const currentTotalCount =
    availability !== undefined ? availability.totalVehicles : (categoryData?.categoryTotalVehicles ?? 0);
  const isSoldOut = Boolean(dateRange?.start && dateRange?.end && !isDateInvalid && currentAvailableCount <= 0);

  // 6. Pricing & Deposit Calculation
  useEffect(() => {
    if (!categoryData || !categoryData.pricePerDay) {
      setPrice(0);
      return;
    }
    setIsCalculating(true);
    const timer = setTimeout(() => {
      setPrice(categoryData.pricePerDay * rentalDays);
      setIsCalculating(false);
    }, 120);
    return () => clearTimeout(timer);
  }, [categoryData, rentalDays]);

  const rawTotalPrice = price;
  const finalTotalPrice = Math.max(0, rawTotalPrice - (appliedDiscount?.amount || 0));

  // Deposit comes from the rental behind this category, and there is no default: an unconfigured
  // rental quotes 0đ and the box stays hidden, matching what the server charges. A rate with no
  // type is an untouched rental, exactly as `DepositPolicies.configured` treats it on the server.
  const depositCalc = useMemo(() => {
    return calculateDeposit({
      totalAmount: finalTotalPrice,
      depositType: categoryData?.depositType,
      depositRate: categoryData?.depositRate ?? null,
      depositAmount: categoryData?.deposit ?? null,
    });
  }, [finalTotalPrice, categoryData]);

  // Fuel Options configuration
  const fuelCategory = filterableAddOnCategories.find((cat) => cat.code === "FUEL");
  const fuelAddOns = fuelCategory?.addOns || [];

  const handleFuelSelect = (fuelKey: string) => {
    setSelectedFuelType(fuelKey);
    if (fuelKey === "all") {
      setSelectedFuelAddOnId(null);
      return;
    }
    // Match addOn by fuelKey
    const matchedAo = fuelAddOns.find((ao) => {
      const code = (ao.code || "").toLowerCase();
      const name = (ao.name || "").toLowerCase();
      if (fuelKey === "petrol") return code.includes("petrol") || name.includes("xăng") || code.includes("gas");
      if (fuelKey === "diesel") return code.includes("diesel") || name.includes("dầu");
      if (fuelKey === "electric") return code.includes("elec") || name.includes("điện");
      if (fuelKey === "hybrid") return code.includes("hybrid") || name.includes("hybrid");
      return false;
    });

    if (matchedAo) {
      setSelectedFuelAddOnId(matchedAo.id);
    } else {
      setSelectedFuelAddOnId(null);
    }
  };

  const getFuelDisplayLabel = () => {
    if (selectedFuelType === "petrol") return t.selfDrive.petrol;
    if (selectedFuelType === "diesel") return t.selfDrive.diesel;
    if (selectedFuelType === "electric") return t.selfDrive.electric;
    if (selectedFuelType === "hybrid") return t.selfDrive.hybrid;
    return t.selfDrive.allFuels;
  };

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDateInvalid || !dateRange?.start || !dateRange?.end || isSubmitting || !customerName.trim() || !customerPhone.trim() || !categoryData) {
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmBooking = async () => {
    if (isDateInvalid || !dateRange?.start || !dateRange?.end || isSubmitting || !customerName.trim() || !customerPhone.trim() || !categoryData) {
      return;
    }

    setIsSubmitting(true);
    try {
      const startDate = formatToIsoDate(dateRange.start);
      const endDate = formatToIsoDate(dateRange.end);

      const res = await createSelfDriveBooking({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || `${customerPhone.trim()}@traveler.com`,
        customerPhone: customerPhone.trim(),
        customerNotes: notes.trim() || undefined,
        vehicleCategoryId: categoryData.vehicleCategoryId,
        zaloId: zaloId || undefined,
        kakaoTalkId: kakaoTalkId || undefined,
        contactChannel: zaloId ? "zalo" : kakaoTalkId ? "kakaotalk" : undefined,
        contactId: zaloId || kakaoTalkId || undefined,
        startDate,
        endDate,
        rentalDays,
        pickupLocation,
        basePrice: categoryData.pricePerDay,
        deposit: categoryData.deposit,
        totalPrice: finalTotalPrice,
        depositType: depositCalc.depositType,
        depositRate: depositCalc.depositRate,
        depositAmount: depositCalc.depositAmount,
        discountCode: appliedDiscount?.code,
        discountAmount: appliedDiscount?.amount,
        fuelAddOnId: selectedFuelAddOnId || undefined,
        addOnIds: selectedFuelAddOnId ? [selectedFuelAddOnId] : [],
      });

      if (res?.data?.bookingCode) {
        setBookingSuccess(res.data.bookingCode);
      } else {
        setErrorMessage(t.errors.bookingFailed);
      }
    } catch (err: any) {
      console.error("Self-drive booking failed:", err);
      const serverMsg = err?.response?.data?.message || (err instanceof Error ? err.message : t.errors.bookingFailed);
      setErrorMessage(serverMsg);
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[var(--bg-page)] font-sans pb-16">
      {/* 1. Header Section */}
      <Reveal as="section" variant="fade" className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-5 pb-4 space-y-3">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-sm font-medium overflow-hidden whitespace-nowrap"
        >
          <Link href={`/${language}`} className="hover:text-accent transition-colors">
            {t.nav.home}
          </Link>
          <ChevronRight size={14} className="shrink-0 opacity-60" />
          <Link href={`/${language}/self-drive`} className="hover:text-accent transition-colors">
            {t.selfDrive.selfDriveRental || t.nav.selfDrive || "Thuê xe tự lái"}
          </Link>
          <ChevronRight size={14} className="shrink-0 opacity-60" />
          <Link
            href={`/${language}/self-drive/${categoryIdentifier}${categoryData?.vehicleCategoryId ? `?id=${categoryData.vehicleCategoryId}` : ""}`}
            className="hover:text-accent transition-colors truncate max-w-[200px]"
          >
            {categoryData?.name || t.selfDrive.heroTitle}
          </Link>
          <ChevronRight size={14} className="shrink-0 opacity-60" />
          <span className="font-semibold truncate">
            {t.selfDrive.confirmBadge}
          </span>
        </nav>

        {/* Top Header: Badge, Title & Back Button */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <HighlightBadge
                value={t.selfDrive.confirmBadge}
                variant="accent"
              />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black dark:text-white tracking-tight leading-snug">
              {t.selfDrive.bookingDetails}
            </h1>
            {categoryData && (
              <p className="text-sm sm:text-base font-medium">
                {categoryData.name} • {categoryData.capacity} {t.selfDrive.seatsCount}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] px-4 py-2 rounded-full text-sm font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-800 shadow-2xs shrink-0"
          >
            <ArrowLeft size={16} />
            {t.selfDrive.back}
          </button>
        </div>
      </Reveal>

      {/* 2. Main Content: Form (Left) & Sticky Summary (Right) */}
      <main className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Form */}
          <Reveal variant="up" className="lg:col-span-8 space-y-6">
            {bookingSuccess ? (
              <SuccessOverlay
                bookingCode={bookingSuccess}
                onComplete={() => {
                  router.push(`/${language}/self-drive/success?bookingCode=${bookingSuccess}`);
                }}
                title={t.selfDrive.confirmSuccessTitle}
                subtitle={t.selfDrive.redirecting}
              />
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white dark:bg-[var(--bg-surface)] rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6"
              >
                {/* Category & Concrete Vehicle Info Banner */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center font-bold shrink-0">
                      <Car size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold uppercase tracking-wider text-accent">
                          {t.selfDrive.vehicleCategory}
                        </span>
                        {categoryData && (
                          <HighlightBadge
                            value={`${categoryData.capacity} ${t.selfDrive.seatsCount}`}
                            variant="accent"
                            className="text-xs px-2.5 py-0.5"
                          />
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-extrabold dark:text-white leading-tight">
                        {categoryData?.name || <Skeleton className="w-32 h-5 rounded" />}
                      </h3>
                      {/* {selectedConcreteVehicle && (
                        <p className="text-sm font-medium mt-0.5">
                          Xe: {selectedConcreteVehicle.brand} {selectedConcreteVehicle.model} ({selectedConcreteVehicle.year})
                        </p>
                      )} */}
                    </div>
                  </div>

                  {categoryData && categoryData.pricePerDay > 0 && (
                    <div className="sm:text-right shrink-0">
                      <span className="text-sm font-bold uppercase tracking-wider block">
                        {t.selfDrive.dailyRateLabel}
                      </span>
                      <div className="text-base font-black text-accent">
                        {categoryData.pricePerDay.toLocaleString("vi-VN")}đ
                        <span className="text-sm font-normal">/{t.selfDrive.perTrip}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 1. Fuel Selection (Tất cả nhiên liệu, Xăng, Dầu Diesel, Điện, Hybrid) */}
                <div className="space-y-2">
                  <Label className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-1.5 pl-1">
                    <Fuel size={16} className="text-accent" />
                    <span>{t.selfDrive.fuel}</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleFuelSelect("all")}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border cursor-pointer ${selectedFuelType === "all"
                        ? "bg-accent text-accent-foreground border-accent shadow-sm"
                        : "bg-slate-50 dark:bg-[var(--bg-card)]   border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                    >
                      {t.selfDrive.allFuels}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFuelSelect("petrol")}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border cursor-pointer ${selectedFuelType === "petrol"
                        ? "bg-accent text-accent-foreground border-accent shadow-sm"
                        : "bg-slate-50 dark:bg-[var(--bg-card)]   border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                    >
                      {t.selfDrive.petrol}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFuelSelect("diesel")}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border cursor-pointer ${selectedFuelType === "diesel"
                        ? "bg-accent text-accent-foreground border-accent shadow-sm"
                        : "bg-slate-50 dark:bg-[var(--bg-card)]   border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                    >
                      {t.selfDrive.diesel}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFuelSelect("electric")}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border cursor-pointer ${selectedFuelType === "electric"
                        ? "bg-accent text-accent-foreground border-accent shadow-sm"
                        : "bg-slate-50 dark:bg-[var(--bg-card)]   border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                    >
                      {t.selfDrive.electric}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFuelSelect("hybrid")}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border cursor-pointer ${selectedFuelType === "hybrid"
                        ? "bg-accent text-accent-foreground border-accent shadow-sm"
                        : "bg-slate-50 dark:bg-[var(--bg-card)]   border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                    >
                      {t.selfDrive.hybrid}
                    </button>
                  </div>
                </div>

                {/* 2. Date Range & Time Selection (HeroUI RangeCalendar) */}
                <div className="space-y-4">
                  {/* Header row with Pickup & Return summary cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Pickup Card */}
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-border flex items-center justify-between gap-2 sm:gap-3 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold shrink-0">
                          <CalendarDays size={18} />
                        </div>
                        <div className="min-w-0">
                          <Label isRequired className="text-xs sm:text-sm font-extrabold uppercase tracking-wider block truncate">
                            {t.selfDrive.pickupDate}
                          </Label>
                          <span className="text-xs sm:text-base font-black dark:text-white block truncate">
                            {dateRange?.start ? formatToDisplayDate(dateRange.start) : "--/--/----"}
                          </span>
                        </div>
                      </div>

                      {/* Pickup Time */}
                      <div className="shrink-0">
                        <TimePicker
                          label=""
                          value={timeValue}
                          onChange={setTimeValue}
                          popoverTitle={t.selfDrive.confirmTime}
                          language={language}
                          isRequired
                          triggerClassName="bg-background dark:bg-[var(--bg-surface)] border h-9 sm:h-10 text-xs sm:text-sm font-semibold"
                        />
                      </div>
                    </div>

                    {/* Return Card */}
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-border flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-3 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                          <CalendarDays size={18} />
                        </div>
                        <div className="min-w-0">
                          <Label isRequired className="text-xs sm:text-sm font-extrabold uppercase tracking-wider block truncate">
                            {t.selfDrive.returnDate}
                          </Label>
                          <span className="text-xs sm:text-base font-black dark:text-white block truncate">
                            {dateRange?.end ? formatToDisplayDate(dateRange.end) : "--/--/----"}
                          </span>
                        </div>
                      </div>

                      {/* Auto-calculated rental duration badge */}
                      <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-accent/10 dark:bg-accent/20 border border-accent/30 text-accent font-black text-xs sm:text-sm shrink-0 flex items-center gap-1 sm:gap-1.5 max-w-full">
                        <Clock size={14} className="shrink-0" />
                        <span className="truncate">
                          {dateRange?.start && dateRange?.end && dateRange.start.compare(dateRange.end) === 0
                            ? t.selfDrive.sameDayRental
                            : t.selfDrive.calculatedDays.replace("{days}", String(rentalDays))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Presets */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider pl-1 flex items-center gap-1 text-foreground/70">
                      <Sparkles size={14} className="text-accent" />
                      <span>{t.selfDrive.rentalPeriod}</span>
                    </span>

                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const s = dateRange?.start || today(getLocalTimeZone());
                          setDateRange({ start: s, end: s });
                        }}
                        className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-white dark:bg-[var(--bg-card)] hover:bg-accent/15 hover:text-accent transition-colors cursor-pointer border border-border"
                      >
                        {t.selfDrive.preset1Day}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const s = dateRange?.start || today(getLocalTimeZone());
                          setDateRange({ start: s, end: s.add({ days: 2 }) });
                        }}
                        className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-white dark:bg-[var(--bg-card)] hover:bg-accent/15 hover:text-accent transition-colors cursor-pointer border border-border"
                      >
                        {t.selfDrive.preset2Days}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const s = dateRange?.start || today(getLocalTimeZone());
                          setDateRange({ start: s, end: s.add({ days: 3 }) });
                        }}
                        className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-white dark:bg-[var(--bg-card)] hover:bg-accent/15 hover:text-accent transition-colors cursor-pointer border border-border"
                      >
                        {t.selfDrive.preset3Days}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const s = dateRange?.start || today(getLocalTimeZone());
                          setDateRange({ start: s, end: s.add({ days: 7 }) });
                        }}
                        className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-white dark:bg-[var(--bg-card)] hover:bg-accent/15 hover:text-accent transition-colors cursor-pointer border border-border"
                      >
                        {t.selfDrive.preset1Week}
                      </button>
                    </div>
                  </div>

                  {/* Embedded HeroUI RangeCalendar */}
                  <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-border flex justify-center">
                    <RangeCalendar
                      aria-label={t.selfDrive.rentalPeriod}
                      firstDayOfWeek="mon"
                      minValue={today(getLocalTimeZone())}
                      value={dateRange}
                      onChange={(v) => {
                        if (v) setDateRange(v);
                      }}
                      className="w-full max-w-sm mx-auto"
                    >
                      <RangeCalendar.Header className="flex items-center justify-between mb-3 px-1">
                        <RangeCalendar.Heading className="text-sm sm:text-base font-black dark:text-white" />
                        <div className="flex items-center gap-1">
                          <RangeCalendar.NavButton
                            slot="previous"
                            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] cursor-pointer transition-colors"
                          />
                          <RangeCalendar.NavButton
                            slot="next"
                            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] cursor-pointer transition-colors"
                          />
                        </div>
                      </RangeCalendar.Header>
                      <RangeCalendar.Grid className="w-full">
                        <RangeCalendar.GridHeader className="text-sm font-bold text-foreground/50">
                          {(day) => (
                            <RangeCalendar.HeaderCell className="w-full text-center py-1">
                              {day}
                            </RangeCalendar.HeaderCell>
                          )}
                        </RangeCalendar.GridHeader>
                        <RangeCalendar.GridBody>
                          {(date) => <RangeCalendar.Cell date={date} />}
                        </RangeCalendar.GridBody>
                      </RangeCalendar.Grid>
                    </RangeCalendar>
                  </div>

                  {/* Realtime Pricing Formula Breakdown */}
                  <div className="p-3.5 rounded-xl bg-accent/5 dark:bg-[var(--bg-surface)] border border-accent/20 flex items-center justify-between text-sm font-semibold">
                    <span className="">
                      {categoryData?.pricePerDay ? `${categoryData.pricePerDay.toLocaleString("vi-VN")}đ` : "0đ"} × {rentalDays} {t.selfDrive.dayUnit}
                    </span>
                    <span className="font-extrabold text-accent text-sm sm:text-base">
                      = {price.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>

                {/* 4. Delivery / Pickup Location */}
                <TextField isRequired className="w-full">
                  <Label className="text-sm font-extrabold uppercase tracking-wider pl-1">
                    {t.selfDrive.pickupLocationLabel}
                  </Label>

                  <Input
                    type="text"
                    required
                    placeholder={t.selfDrive.pickupLocationPlaceholder}
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="w-full border-1 border-[var(--accent-border)] shadow-sm dark:shadow-none text-sm font-semibold outline-none"
                  />

                </TextField>

                {/* 5. Contact Information */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-extrabold uppercase tracking-wider pl-1">
                      {t.selfDrive.contactInfo}
                    </Label>
                    <AutofillButton
                      onFill={(d) => {
                        setCustomerName(d.fullname);
                        setCustomerPhone(d.phone);
                        setCustomerEmail(d.email);
                        setZaloId(d.zaloId ?? "");
                        setKakaoTalkId(d.kakaoTalkId ?? "");
                      }}
                      label={t.common.autoFill}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <TextField isRequired className="w-full">
                      <Label className="text-sm font-extrabold uppercase tracking-wider">{t.common.name}</Label>
                      <Input
                        type="text"
                        placeholder={t.selfDrive.namePlaceholder}
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="text-sm border-1 border-[var(--accent-border)] shadow-sm dark:shadow-none font-semibold"
                      />
                    </TextField>
                    <TextField className="w-full">
                      <Label className="text-sm font-extrabold uppercase tracking-wider">{t.selfDrive.email}</Label>
                      <Input
                        type="email"
                        placeholder={t.selfDrive.emailPlaceholder}
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="text-sm border-1 border-[var(--accent-border)] shadow-sm dark:shadow-none font-semibold"
                      />
                    </TextField>
                    <TextField isRequired className="w-full">
                      <Label className="text-sm font-extrabold uppercase tracking-wider">{t.common.phone}</Label>
                      <Input
                        type="tel"
                        placeholder={t.selfDrive.phonePlaceholder}
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="text-sm border-1 border-[var(--accent-border)] shadow-sm dark:shadow-none font-semibold"
                      />
                    </TextField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <TextField className="w-full">
                      <Label className="text-sm font-extrabold uppercase tracking-wider">{t.selfDrive.zaloId}</Label>
                      <Input
                        type="text"
                        value={zaloId}
                        onChange={(e) => setZaloId(e.target.value)}
                        placeholder="Zalo ID"
                        className="text-sm border-1 border-[var(--accent-border)] shadow-sm dark:shadow-none font-semibold"
                      />
                    </TextField>
                    <TextField className="w-full">
                      <Label className="text-sm font-extrabold uppercase tracking-wider">{t.selfDrive.kakaoTalkId}</Label>
                      <Input
                        type="text"
                        value={kakaoTalkId}
                        onChange={(e) => setKakaoTalkId(e.target.value)}
                        placeholder="KakaoTalk ID"
                        className="text-sm border-1 border-[var(--accent-border)] shadow-sm dark:shadow-none font-semibold"
                      />
                    </TextField>
                  </div>
                </div>

                {/* 6. Notes */}
                <TextField className="w-full">
                  <Label className="text-sm font-extrabold uppercase tracking-wider block pl-1">
                    {t.rentCar.notes}
                  </Label>
                  <TextArea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t.selfDrive.notesPlaceholder}
                    rows={3}
                    className="w-full text-sm font-semibold rounded-xl border-1 border-[var(--accent-border)] shadow-sm dark:shadow-none resize-none"
                  />
                </TextField>

                {/* Sold out alert */}
                {isSoldOut && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm">
                    <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                    <div className="space-y-1">
                      <p className="font-extrabold">{t.selfDrive.soldOutNotice}</p>
                      <p className="text-sm opacity-90">
                        {t.selfDrive.availableVehicles}: 0 / {currentTotalCount}
                      </p>
                    </div>
                  </div>
                )}

                {/* Submit button on form */}
                <Button
                  type="submit"
                  isDisabled={
                    isDateInvalid ||
                    !dateRange?.start ||
                    !dateRange?.end ||
                    isSubmitting ||
                    !customerName.trim() ||
                    !customerPhone.trim() ||
                    isSoldOut
                  }
                  className={`w-full h-12 rounded-2xl font-black text-sm shadow-md gap-2 border-none transition-all ${isSoldOut
                    ? "bg-slate-200 dark:bg-zinc-800  dark:text-zinc-500 cursor-not-allowed"
                    : "bg-accent text-accent-foreground hover:bg-accent-hover cursor-pointer"
                    }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      {t.selfDrive.processing}
                    </span>
                  ) : isSoldOut ? (
                    <span className="flex items-center gap-2">
                      <Ban size={16} />
                      {t.selfDrive.soldOut}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle size={16} />
                      {t.selfDrive.bookNowBtn}
                    </span>
                  )}
                </Button>
              </form>
            )}
          </Reveal>

          {/* Right: Sticky Booking Summary */}
          <Reveal variant="fade" className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
            {/* Customer Discount Section */}
            <CustomerDiscountSection
              scopeType="SELF_DRIVE"
              scopeRefId={categoryData?.rentalId}
              orderTotal={rawTotalPrice}
              onDiscountChange={setAppliedDiscount}
            />

            <div className="bg-white dark:bg-[var(--bg-surface)] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider">
                {t.selfDrive.bookingSummary}
              </h3>

              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-28 w-full rounded-2xl" />
                  <Skeleton className="h-4 w-3/4 rounded-lg" />
                  <Skeleton className="h-4 w-1/2 rounded-lg" />
                </div>
              ) : categoryData ? (
                <>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-sm font-bold uppercase tracking-wide">
                      <span>{t.selfDrive.vehicleLabel}</span>
                      <span className="font-extrabold text-right max-w-[60%] truncate">
                        {categoryData.name}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm font-bold uppercase tracking-wide">
                      <span>{t.selfDrive.capacityLabel}</span>
                      <span className="font-extrabold">
                        {categoryData.capacity} {t.selfDrive.seatsCount}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm font-bold uppercase tracking-wide">
                      <span>{t.selfDrive.fuel}</span>
                      <span className="text-accent font-extrabold">{getFuelDisplayLabel()}</span>
                    </div>

                    {dateRange?.start && (
                      <div className="flex justify-between items-center text-sm font-bold uppercase tracking-wide">
                        <span>{t.selfDrive.pickupDate}</span>
                        <span className="font-extrabold">
                          {formatToDisplayDate(dateRange.start)} ({String(timeValue.hour).padStart(2, "0")}:
                          {String(timeValue.minute).padStart(2, "0")} {timeValue.period})
                        </span>
                      </div>
                    )}

                    {dateRange?.end && (
                      <div className="flex justify-between items-center text-sm font-bold uppercase tracking-wide">
                        <span>{t.selfDrive.returnDate}</span>
                        <span className="font-extrabold">
                          {formatToDisplayDate(dateRange.end)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-sm font-bold uppercase tracking-wide">
                      <span>{t.selfDrive.durationLabel}</span>
                      <span className="font-extrabold">
                        {dateRange?.start && dateRange?.end && dateRange.start.compare(dateRange.end) === 0
                          ? t.selfDrive.sameDayRental
                          : `${rentalDays} ${t.selfDrive.dayUnit}`}
                      </span>
                    </div>

                    {pickupLocation && (
                      <div className="flex justify-between items-start text-sm font-bold uppercase tracking-wide">
                        <span className="shrink-0">{t.selfDrive.pickupLocationLabel}</span>
                        <span className="font-extrabold text-right max-w-[60%] truncate">
                          {pickupLocation}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
                    {categoryData.pricePerDay > 0 && (
                      <div className="flex justify-between items-center text-sm font-bold uppercase tracking-wide">
                        <span>{t.selfDrive.dailyRateLabel}</span>
                        <span className="font-extrabold">
                          {categoryData.pricePerDay.toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    )}

                    {appliedDiscount && (
                      <div className="flex justify-between items-center text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                        <span>Giảm giá ({appliedDiscount.code})</span>
                        <span className="font-extrabold">
                          - {appliedDiscount.amount.toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dynamic Deposit Info Box — hidden when the rental has no deposit */}
                  {depositCalc.depositAmount > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                          <ShieldCheck size={16} className="text-amber-600 shrink-0" />
                          {depositCalc.depositType === DepositType.PERCENT
                            ? `${t.selfDrive.depositLabel} (${depositCalc.depositRate}%)`
                            : `${t.selfDrive.depositLabel} (Cố định/xe)`}
                        </span>
                        <span className="text-sm sm:text-base font-black text-amber-700 dark:text-amber-400">
                          {depositCalc.depositAmount.toLocaleString("vi-VN")}đ
                        </span>
                      </div>

                      <p className="text-sm text-amber-700/80 dark:text-amber-400/80 leading-normal">
                        {depositCalc.depositType === DepositType.PERCENT
                          ? `Đặt cọc ${depositCalc.depositRate}% tính trên tổng giá trị thuê xe sau khuyến mãi.`
                          : "Tiền thế chân xe cố định quy định theo phân khúc xe."}
                      </p>

                      <div className="flex justify-between items-center pt-2 border-t border-amber-200/50 dark:border-amber-900/30 text-sm font-semibold">
                        <span>{t.discounts.remainingPayment}:</span>
                        <span className="font-bold">
                          {depositCalc.remainingAmount.toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-black">
                        {t.selfDrive.estTotalLabel}
                      </span>
                      {isCalculating ? (
                        <Skeleton className="w-24 h-5 rounded-lg bg-slate-200 dark:bg-[var(--bg-card)]" />
                      ) : (
                        <span className="text-base sm:text-lg font-black text-accent">
                          {finalTotalPrice.toLocaleString("vi-VN")}đ
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-center py-4">{t.selfDrive.noVehicleSelected}</p>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-sm font-medium">
                <ShieldCheck size={14} className="text-accent" />
                <span>{t.selfDrive.guarantee}</span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Dynamic CMS Sections if provided */}
        {sections && sections.length > 0 && (
          <div className="mt-12">
            <SectionRenderer sections={sections} locale={language} />
          </div>
        )}
      </main>

      {/* Error Overlay */}
      {errorMessage && <ErrorOverlay message={errorMessage} onClose={() => setErrorMessage("")} />}

      {/* Confirmation Modal */}
      <BookingConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmBooking}
        serviceType={t.selfDrive.serviceType}
        summaryItems={[
          { label: t.selfDrive.confirmName, value: categoryData?.name || "" },
          { label: t.selfDrive.fuel, value: getFuelDisplayLabel() },
          {
            label: t.selfDrive.confirmDate,
            value: dateRange?.start ? formatToDisplayDate(dateRange.start) : "",
          },
          {
            label: t.selfDrive.returnDate,
            value: dateRange?.end ? formatToDisplayDate(dateRange.end) : "",
          },
          {
            label: t.selfDrive.confirmTime,
            value: `${String(timeValue.hour).padStart(2, "0")}:${String(timeValue.minute).padStart(2, "0")} ${timeValue.period}`,
          },
          {
            label: t.selfDrive.duration,
            value:
              dateRange?.start && dateRange?.end && dateRange.start.compare(dateRange.end) === 0
                ? t.selfDrive.sameDayRental
                : `${rentalDays} ${t.selfDrive.dayUnit}`,
          },
          { label: t.selfDrive.pickupLocationLabel, value: pickupLocation || "-" },
          { label: t.selfDrive.confirmNotes, value: notes || "-" },
        ]}
        contactInfo={{
          fullName: customerName,
          phone: customerPhone,
          email: customerEmail || "-",
        }}
        totalAmount={finalTotalPrice}
        totalLabel={t.selfDrive.estimatedTotal}
        depositAmount={depositCalc.depositAmount}
        depositRate={depositCalc.depositRate}
        depositType={depositCalc.depositType}
        remainingAmount={depositCalc.remainingAmount}
        submitting={isSubmitting}
      />
    </div>
  );
}
