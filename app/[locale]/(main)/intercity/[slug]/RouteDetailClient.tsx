"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Calendar as CalendarIcon,
  Car,
  Info,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  Button,
  Skeleton,
  DatePicker,
  DateField,
  Calendar,
  Label,
  TextField,
  Input,
  FieldError,
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalCloseTrigger,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
  Select,
  ListBox,
  RadioGroup,
  Radio,
  Description,
} from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { parseDate, today, getLocalTimeZone } from "@internationalized/date";
import dynamic from "next/dynamic";
import { TimePicker, type TimeValue } from "@/components/time-picker";
import { calculateRentalDays } from "@/lib/utils/rentalDate";
import { HighlightBadge } from "@/components/common/HighlightBadge";

import { useI18n } from "@/context/LanguageContext";
import {
  getIntercityRouteByIdOrSlug,
  getIntercityRoutePrices,
  getPublicIntercityRoutePrices,
  type IntercityRouteDto,
  type IntercityRoutePriceDto,
  type IntercityDepartureTimeDto,
} from "@/lib/api/intercity";
import {
  getSharedRoute,
  getDayOfWeekFromDate,
  type SharedRouteDto,
  type SharedRouteScheduleDto,
} from "@/lib/api/sharedRoute";
import { resolveImageUrls } from "@/lib/api/media";
import {
  getVehicleCategories,
  getRentableVehiclesByCategory,
  type VehicleCategoryDto,
  type VehicleDto,
} from "@/lib/api/fleet";
import { formatPriceSync as _formatPrice } from "@/lib/format";
import {
  calcIntercityDailyRatePrice,
  pickPriceListRow,
  resolveInDayPrice,
} from "@/lib/pricing";
import { IntercityPriceTypeCode } from "@/types/intercity";
import { backendUrl } from "@/lib/api/client";
import {
  parseRouteComponents,
  extractComponentContent,
  DEFAULT_COMPARISON_DATA,
  type ComparisonItemData,
} from "@/types/routeComponents";

const RouteMap = dynamic(() => import("@/components/route-map"), { ssr: false });
import type { SectionDto } from "@/lib/api/sections";

interface CategoryWithVehicles {
  category: VehicleCategoryDto;
  vehicles: VehicleDto[];
  price: number;
}

interface RouteDetailClientProps {
  sections: SectionDto[];
  routeIdentifier: string | number;
  initialRoute?: IntercityRouteDto | null;
}

export default function RouteDetailClient({
  sections,
  routeIdentifier,
  initialRoute,
}: RouteDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useI18n();

  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `${backendUrl}${url}`;
  };

  const prefixUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const segments = url.split("/");
    if (segments.length > 1 && ["vi", "en", "ko", "ru"].includes(segments[1])) return url;
    return `/${language}${url === "/" ? "" : url}`;
  };

  const [route, setRoute] = useState<IntercityRouteDto | null>(initialRoute || null);
  /** price_lists rows for this route — the only price source, fetched separately. */
  const [routePrices, setRoutePrices] = useState<IntercityRoutePriceDto[]>([]);
  const [linkedSharedRoute, setLinkedSharedRoute] = useState<SharedRouteDto | null>(null);
  const [categories, setCategories] = useState<CategoryWithVehicles[]>([]);
  const [loading, setLoading] = useState(!initialRoute);

  // Service Type: "PRIVATE" (Xe riêng) vs "SHARED" (Vé xe ghép chỗ)
  const [serviceType, setServiceType] = useState<"PRIVATE" | "SHARED">("PRIVATE");
  const [sharedDirection, setSharedDirection] = useState<"OUTBOUND" | "RETURN">("OUTBOUND");
  const [durationMode, setDurationMode] = useState<"IN_DAY" | "DAILY_RATE">("IN_DAY");
  const [tripType, setTripType] = useState<"one-way" | "round-trip">("one-way");
  const [dateValue, setDateValue] = useState<DateValue | null>(null);
  const [dateRange, setDateRange] = useState<{ start: DateValue; end: DateValue } | null>(() => {
    const cur = today(getLocalTimeZone());
    return { start: cur, end: cur };
  });
  const [departureTime, setDepartureTime] = useState("");
  const [selectedOutboundScheduleId, setSelectedOutboundScheduleId] = useState<number | null>(null);
  const [returnDateValue, setReturnDateValue] = useState<DateValue | null>(null);
  const [returnDepartureTime, setReturnDepartureTime] = useState("");
  const [selectedReturnScheduleId, setSelectedReturnScheduleId] = useState<number | null>(null);
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentDate = today(getLocalTimeZone());
  const rentalDays = useMemo(() => {
    if (!dateRange?.start || !dateRange?.end) return 1;
    return calculateRentalDays(dateRange.start, dateRange.end, 1);
  }, [dateRange]);

  const isDateInvalid = Boolean(errors.date);
  const isDateRangeInvalid = Boolean(
    !dateRange?.start ||
    !dateRange?.end ||
    dateRange.start.compare(currentDate) < 0 ||
    dateRange.end.compare(dateRange.start) < 0
  );
  const isDepartureTimeInvalid = Boolean(errors.departureTime);
  const isReturnDateInvalid = Boolean(errors.returnDate);
  const isReturnTimeInvalid = Boolean(errors.returnTime);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [vehicleModalCategoryId, setVehicleModalCategoryId] = useState<number | null>(null);
  const carouselRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [heroImageIndex, setHeroImageIndex] = useState(0);

  useEffect(() => {
    const serviceTypeParam = searchParams.get("serviceType") || searchParams.get("type");
    if (serviceTypeParam === "SHARED" || serviceTypeParam === "shared") {
      setServiceType("SHARED");
    } else if (serviceTypeParam === "PRIVATE" || serviceTypeParam === "private") {
      setServiceType("PRIVATE");
    }

    const tripTypeParam = searchParams.get("tripType");
    if (tripTypeParam === "DAILY_RATE") {
      setDurationMode("DAILY_RATE");
    } else if (tripTypeParam === "return" || tripTypeParam === "round-trip") {
      setDurationMode("IN_DAY");
      setTripType("round-trip");
    } else if (tripTypeParam === "one-way") {
      setDurationMode("IN_DAY");
      setTripType("one-way");
    }

    const paxParam = searchParams.get("passengers") || searchParams.get("pax");
    if (paxParam && Number(paxParam) > 0) {
      setPassengerCount(Math.min(9, Math.max(1, Number(paxParam))));
    }

    const dateParam = searchParams.get("date");
    if (dateParam) {
      try {
        const parsed = parseDate(dateParam);
        setDateValue(parsed);
        const returnDateParam = searchParams.get("returnDate");
        if (returnDateParam) {
          try {
            const parsedReturn = parseDate(returnDateParam);
            setReturnDateValue(parsedReturn);
            setDateRange({ start: parsed, end: parsedReturn });
          } catch { }
        }
      } catch { }
    }

    const returnDateParam = searchParams.get("returnDate");
    if (returnDateParam && !dateRange) {
      try {
        setReturnDateValue(parseDate(returnDateParam));
      } catch { }
    }

    const dirParam = searchParams.get("directionType") || searchParams.get("direction");
    if (dirParam === "RETURN" || dirParam === "return") {
      setSharedDirection("RETURN");
    }

    const timeParam = searchParams.get("time") || searchParams.get("departureTime");
    if (timeParam) setDepartureTime(timeParam);

    const returnTimeParam = searchParams.get("returnTime");
    if (returnTimeParam) setReturnDepartureTime(returnTimeParam);
  }, [searchParams]);

  const formatPrice = (value: number) => _formatPrice(value, language);

  const timeStringToValue = (s: string): TimeValue => {
    if (!s) return { hour: 8, minute: 0, period: "AM" };
    const parts = s.split(":");
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return { hour: hour12, minute: m, period: period as "AM" | "PM" };
  };

  const timeValueToString = (v: TimeValue): string => {
    let h24 = v.hour + (v.period === "PM" ? 12 : 0);
    if (h24 === 24) h24 = 12;
    if (v.period === "AM" && v.hour === 12) h24 = 0;
    return `${String(h24).padStart(2, "0")}:${String(v.minute).padStart(2, "0")}`;
  };

  const scrollCarousel = (vehicleId: number, dir: "left" | "right") => {
    const el = carouselRefs.current.get(vehicleId);
    if (!el) return;
    const amount = 220;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  const getRouteName = (r: IntercityRouteDto) => {
    const tr = r.translations?.find((t) => t.locale === language);
    if (tr?.name) return tr.name;
    return `${r.originCity} ⇌ ${r.destinationCity}`;
  };

  const getRouteDescription = (r: IntercityRouteDto) => {
    const tr = r.translations?.find((t) => t.locale === language);
    return tr?.description || "";
  };

  const [routeImages, setRouteImages] = useState<string[]>([]);

  const heroSection = sections.find((s) => s.sectionType === "HERO_BANNER");
  const fallbackHeroImages = heroSection?.imageUrls?.filter((url) => url) ?? [];
  const displayHeroImages = routeImages.length > 0 ? routeImages : fallbackHeroImages;
  const isHeroCarousel = displayHeroImages.length > 1;

  useEffect(() => {
    if (!isHeroCarousel) return;
    const timer = setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % displayHeroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHeroCarousel, displayHeroImages.length]);

  const prevHero = () =>
    setHeroImageIndex((prev) => (prev - 1 + displayHeroImages.length) % displayHeroImages.length);
  const nextHero = () =>
    setHeroImageIndex((prev) => (prev + 1) % displayHeroImages.length);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [routeRes, catsRes] = await Promise.all([
          getIntercityRouteByIdOrSlug(routeIdentifier),
          getVehicleCategories({ active: true, page: 0, size: 100 }),
        ]);

        const foundRoute = (routeRes?.data ?? null) as IntercityRouteDto | null;

        if (foundRoute) {
          setRoute(foundRoute);

          if (foundRoute.linkedSharedRouteId) {
            getSharedRoute(foundRoute.linkedSharedRouteId)
              .then((res) => setLinkedSharedRoute(res))
              .catch((err) => console.warn("Failed to load linked shared route:", err));
          }

          if (foundRoute.imageIds && foundRoute.imageIds.length > 0) {
            try {
              const resolved = await resolveImageUrls(foundRoute.imageIds);
              setRouteImages(resolved.map((r) => r.url));
            } catch (err) {
              console.error("Failed to resolve route images:", err);
            }
          }

          const allCats = (catsRes?.data?.content ?? []) as VehicleCategoryDto[];
          let fetchedPrices: IntercityRoutePriceDto[] = [];
          try {
            const priceRes = await getPublicIntercityRoutePrices(foundRoute.id);
            fetchedPrices = (priceRes?.data ?? []) as IntercityRoutePriceDto[];
          } catch {
            try {
              const priceRes = await getIntercityRoutePrices(foundRoute.id);
              fetchedPrices = (priceRes?.data ?? []) as IntercityRoutePriceDto[];
            } catch {
              /* unpriced route: 0 categories, never a fabricated price */
            }
          }
          setRoutePrices(fetchedPrices);

          const catsWithVehicles: CategoryWithVehicles[] = [];
          for (const cat of allCats) {
            const inDayEntry = pickPriceListRow(fetchedPrices, cat.id, IntercityPriceTypeCode.ONE_WAY);
            const dailyRateEntry = pickPriceListRow(fetchedPrices, cat.id, IntercityPriceTypeCode.DAILY_RATE);

            if (!inDayEntry && !dailyRateEntry) {
              continue;
            }

            let vehicles: VehicleDto[] = [];
            try {
              const vehiclesRes = await getRentableVehiclesByCategory(cat.id);
              vehicles = (vehiclesRes?.data ?? []) as VehicleDto[];
            } catch (err) {
              console.warn(`[RouteDetail] Failed to load vehicles for ${cat.code}:`, err);
            }

            let cardPrice = 0;
            if (inDayEntry) {
              cardPrice = Number(inDayEntry.basePrice ?? 0);
            } else if (dailyRateEntry) {
              cardPrice = Number(dailyRateEntry.basePrice ?? 0);
            }

            catsWithVehicles.push({ category: cat, vehicles, price: cardPrice });
          }

          setCategories(catsWithVehicles);
          if (catsWithVehicles.length > 0) {
            const defaultCat = catsWithVehicles.find(
              (c) =>
                (c.category as VehicleCategoryDto & { isDefault?: boolean }).isDefault ??
                c.category.default
            );
            setSelectedCategoryId(
              defaultCat ? defaultCat.category.id : catsWithVehicles[0].category.id
            );
          }
        }
      } catch (err) {
        console.error("Failed to load route detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [routeIdentifier]);

  const selectedCategory =
    categories.find((c) => c.category.id === selectedCategoryId) || categories[0];

  const supportsShared = Boolean(route?.linkedSharedRouteId || route?.hasSharedRoute);

  // Direction & Schedule filtering for Shared Ride
  const outboundDirection = useMemo(() => {
    if (!linkedSharedRoute?.directions) return null;
    return (
      linkedSharedRoute.directions.find((d) => d.directionType === "OUTBOUND") ||
      linkedSharedRoute.directions[0] ||
      null
    );
  }, [linkedSharedRoute]);

  const returnDirection = useMemo(() => {
    if (!linkedSharedRoute?.directions) return null;
    return (
      linkedSharedRoute.directions.find((d) => d.directionType === "RETURN") ||
      linkedSharedRoute.directions[1] ||
      null
    );
  }, [linkedSharedRoute]);

  const travelDayOfWeek = useMemo(() => {
    if (!dateValue) return null;
    const iso = `${dateValue.year}-${String(dateValue.month).padStart(2, "0")}-${String(dateValue.day).padStart(2, "0")}`;
    return getDayOfWeekFromDate(iso);
  }, [dateValue]);

  const filteredOutboundSchedules = useMemo(() => {
    if (!outboundDirection?.schedules) return [];
    const activeList = outboundDirection.schedules.filter((s) => s.active !== false);
    if (!travelDayOfWeek) return activeList;
    return activeList.filter((s) => {
      if (!s.operatingDays || s.operatingDays.length === 0) return true;
      return s.operatingDays.includes(travelDayOfWeek);
    });
  }, [outboundDirection, travelDayOfWeek]);

  const filteredReturnSchedules = useMemo(() => {
    if (!returnDirection?.schedules) return [];
    const activeList = returnDirection.schedules.filter((s) => s.active !== false);
    if (!travelDayOfWeek) return activeList;
    return activeList.filter((s) => {
      if (!s.operatingDays || s.operatingDays.length === 0) return true;
      return s.operatingDays.includes(travelDayOfWeek);
    });
  }, [returnDirection, travelDayOfWeek]);

  const activeSharedSchedules = sharedDirection === "OUTBOUND" ? filteredOutboundSchedules : filteredReturnSchedules;
  const activeDirection = sharedDirection === "OUTBOUND" ? outboundDirection : returnDirection;

  // Auto-sync schedule selection when filtered schedules change
  useEffect(() => {
    if (serviceType === "SHARED") {
      if (activeSharedSchedules.length > 0) {
        const stillValid = activeSharedSchedules.some((s) => s.departureTime === departureTime);
        if (!stillValid) {
          setDepartureTime(activeSharedSchedules[0].departureTime);
          if (sharedDirection === "OUTBOUND") {
            setSelectedOutboundScheduleId(activeSharedSchedules[0].id ?? null);
          } else {
            setSelectedReturnScheduleId(activeSharedSchedules[0].id ?? null);
          }
        }
      } else if (activeDirection?.schedules && activeDirection.schedules.length > 0) {
        setDepartureTime("");
        if (sharedDirection === "OUTBOUND") setSelectedOutboundScheduleId(null);
        else setSelectedReturnScheduleId(null);
      }
    }
  }, [activeSharedSchedules, serviceType, sharedDirection, activeDirection, departureTime]);

  useEffect(() => {
    if (route && !supportsShared && serviceType === "SHARED") {
      setServiceType("PRIVATE");
    }
  }, [route, supportsShared, serviceType]);

  // Shared price per pax
  const sharedOutboundPrice = outboundDirection?.price ?? 0;
  const sharedReturnPrice = returnDirection?.price ?? 0;

  // No configured shared-ride price means no price to show — never a stand-in figure.
  const sharedPerPaxPrice = sharedDirection === "OUTBOUND" ? sharedOutboundPrice : sharedReturnPrice;
  const formatSharedPrice = (price: number) => (price > 0 ? formatPrice(price) : t.common.contact);

  // A price table that has not loaded yet must not decide the UI: keep both options until
  // price_lists arrives, then narrow to exactly the configured trip types.
  const pricesLoaded = routePrices.length > 0;

  const hasInDay = useMemo(() => {
    if (!pricesLoaded) return true;
    return routePrices.some(
      (p) =>
        (p.priceTypeCategory === "IN_DAY" || p.priceTypeCode === "ONE_WAY" || p.priceTypeCode === "ROUND_TRIP_SAME_DAY") &&
        (p.active ?? (p.status !== "INACTIVE"))
    );
  }, [routePrices, pricesLoaded]);

  const hasDailyRate = useMemo(() => {
    if (!pricesLoaded) return true;
    return routePrices.some(
      (p) =>
        (p.priceTypeCategory === "DAILY_RATE" || p.priceTypeCode === "DAILY_RATE") &&
        (p.active ?? (p.status !== "INACTIVE"))
    );
  }, [routePrices, pricesLoaded]);

  // Dynamically compute supported price types based on active price lists for this route / selected vehicle
  const availablePriceTypes = useMemo(() => {
    const prices = routePrices;
    if (!pricesLoaded) {
      return [
        { code: "ONE_WAY", value: "one-way", label: t.rentCar.oneWay },
        { code: "ROUND_TRIP_SAME_DAY", value: "round-trip", label: t.rentCar.roundTrip },
        { code: "DAILY_RATE", value: "DAILY_RATE", label: t.rentCar.dailyRate },
      ];
    }

    // Filter for selected category if available
    const activePrices = prices.filter((p) => {
      const isActive = p.active ?? (p.status !== "INACTIVE");
      if (!isActive) return false;
      if (selectedCategoryId) {
        return Number(p.vehicleCategoryId) === Number(selectedCategoryId);
      }
      return true;
    });

    const targetList = activePrices.length > 0 ? activePrices : prices.filter(p => (p.active ?? (p.status !== "INACTIVE")));

    const supported: Array<{ code: string; value: string; label: string }> = [];

    const getTranslatedName = (p: IntercityRoutePriceDto | undefined, defaultLabel: string) => {
      if (!p) return defaultLabel;
      if (p.translations && p.translations.length > 0) {
        const trans = p.translations.find((tr) => tr.locale === language)
          || p.translations.find((tr) => tr.locale === "en")
          || p.translations.find((tr) => tr.locale === "vi");
        if (trans?.name) return trans.name;
      }
      return p.priceTypeName || defaultLabel;
    };

    const oneWayPriceItem = targetList.find((p) => p.priceTypeCode === "ONE_WAY");
    if (oneWayPriceItem) {
      supported.push({
        code: "ONE_WAY",
        value: "one-way",
        label: getTranslatedName(oneWayPriceItem, t.rentCar.oneWay),
      });
    }

    const roundTripPriceItem = targetList.find((p) => p.priceTypeCode === "ROUND_TRIP_SAME_DAY");
    if (roundTripPriceItem) {
      supported.push({
        code: "ROUND_TRIP_SAME_DAY",
        value: "round-trip",
        label: getTranslatedName(roundTripPriceItem, t.rentCar.roundTrip),
      });
    } else if (oneWayPriceItem) {
      const routeHasExplicitRoundTrip = prices.find(
        (p) => p.priceTypeCode === "ROUND_TRIP_SAME_DAY" && (p.active ?? (p.status !== "INACTIVE"))
      );
      if (routeHasExplicitRoundTrip) {
        supported.push({
          code: "ROUND_TRIP_SAME_DAY",
          value: "round-trip",
          label: getTranslatedName(routeHasExplicitRoundTrip, t.rentCar.roundTrip),
        });
      }
    }

    const dailyPriceItem = targetList.find(
      (p) => p.priceTypeCode === "DAILY_RATE" || p.priceTypeCategory === "DAILY_RATE"
    );
    if (dailyPriceItem) {
      supported.push({
        code: "DAILY_RATE",
        value: "DAILY_RATE",
        label: getTranslatedName(dailyPriceItem, t.rentCar.dailyRate),
      });
    }

    if (supported.length === 0) {
      return [
        { code: "ONE_WAY", value: "one-way", label: t.rentCar.oneWay },
        { code: "ROUND_TRIP_SAME_DAY", value: "round-trip", label: t.rentCar.roundTrip },
      ];
    }

    return supported;
  }, [routePrices, pricesLoaded, selectedCategoryId, language, t.rentCar]);

  useEffect(() => {
    if (availablePriceTypes.length > 0) {
      const currentVal = durationMode === "DAILY_RATE" ? "DAILY_RATE" : tripType;
      const isCurrentSupported = availablePriceTypes.some((pt) => pt.value === currentVal);
      if (!isCurrentSupported) {
        const first = availablePriceTypes[0];
        if (first.value === "DAILY_RATE") {
          setDurationMode("DAILY_RATE");
        } else {
          setDurationMode("IN_DAY");
          setTripType(first.value as "one-way" | "round-trip");
        }
      }
    }
  }, [availablePriceTypes, durationMode, tripType]);

  useEffect(() => {
    if (!hasInDay && hasDailyRate && durationMode === "IN_DAY") {
      setDurationMode("DAILY_RATE");
    } else if (hasInDay && !hasDailyRate && durationMode === "DAILY_RATE") {
      setDurationMode("IN_DAY");
    }
  }, [hasInDay, hasDailyRate, durationMode]);

  // Price calculations
  const calculatePrivatePrice = (catId: number, isRoundTrip: boolean, isDailyRate: boolean = false) => {
    if (!route) return 0;

    if (isDailyRate) {
      const dailyEntry = pickPriceListRow(routePrices, catId, IntercityPriceTypeCode.DAILY_RATE);
      if (!dailyEntry) return 0;

      return calcIntercityDailyRatePrice(
        Number(dailyEntry.basePrice ?? 0),
        rentalDays,
        dailyEntry.minDays ?? 1
      );
    }

    return resolveInDayPrice(routePrices, catId, isRoundTrip);
  };

  const calculateSharedTotalPrice = () => {
    return sharedPerPaxPrice * passengerCount;
  };

  // Directional Departure Times for Shared Rides
  const outboundTimes: IntercityDepartureTimeDto[] =
    outboundDirection?.schedules && outboundDirection.schedules.length > 0
      ? outboundDirection.schedules.filter((s) => s.active !== false).map((s, idx) => ({
        id: s.id!,
        routeId: route?.id,
        departureTime: s.departureTime.substring(0, 5),
        direction: "OUTBOUND",
        active: true,
        orderIndex: idx,
      }))
      : (route?.departureTimes ?? [])
        .filter((dt) => (dt.direction === "OUTBOUND" || !dt.direction) && dt.active)
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

  const returnTimes: IntercityDepartureTimeDto[] =
    returnDirection?.schedules && returnDirection.schedules.length > 0
      ? returnDirection.schedules.filter((s) => s.active !== false).map((s, idx) => ({
        id: s.id!,
        routeId: route?.id,
        departureTime: s.departureTime.substring(0, 5),
        direction: "RETURN",
        active: true,
        orderIndex: idx,
      }))
      : (route?.departureTimes ?? [])
        .filter((dt) => dt.direction === "RETURN" && dt.active)
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

  const activeTimes = sharedDirection === "OUTBOUND" ? outboundTimes : returnTimes;

  const handleBooking = () => {
    const newErrors: Record<string, string> = {};

    if (serviceType === "PRIVATE") {
      // For private trips, detailed dates/times are selected on the confirm page.
      if (!selectedCategory) {
        newErrors.category = t.rentCar.noVehiclesForRoute;
      }
    } else {
      // SHARED requires selecting slot
      if (!dateValue) newErrors.date = t.errors.dateRequired;
      if (!departureTime) {
        newErrors.departureTime =
          sharedDirection === "OUTBOUND" ? t.rentCar.selectOutboundTime : t.rentCar.selectReturnTime;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const params = new URLSearchParams();
    if (route) params.set("routeId", String(route.id));
    params.set("serviceType", serviceType);

    if (serviceType === "PRIVATE") {
      if (durationMode === "DAILY_RATE") {
        params.set("tripType", "DAILY_RATE");
        params.set("rentalDays", "1");
      } else if (tripType === "round-trip") {
        params.set("tripType", "round-trip");
      } else {
        // one-way
        params.set("tripType", "one-way");
      }

      if (selectedCategory) {
        params.set("vehicleCategoryId", String(selectedCategory.category.id));
        params.set("seats", selectedCategory.category.code);
      }
    } else {
      params.set("passengerCount", String(passengerCount));
      params.set("pax", String(passengerCount));
      params.set("sharedTripType", "one-way");
      params.set("tripType", "one-way");
      params.set("directionType", sharedDirection);
      if (dateValue) {
        const d = `${dateValue.year}-${String(dateValue.month).padStart(2, "0")}-${String(dateValue.day).padStart(2, "0")}`;
        params.set("tripDate", d);
        params.set("departureDate", d);
        params.set("date", d);
      }
      if (departureTime) params.set("departureTime", departureTime);
      if (linkedSharedRoute) {
        params.set("sharedRouteId", String(linkedSharedRoute.id));
        const activeDir = sharedDirection === "OUTBOUND" ? outboundDirection : returnDirection;
        if (activeDir?.id) params.set("directionId", String(activeDir.id));
        const activeSchedId = sharedDirection === "OUTBOUND" ? selectedOutboundScheduleId : selectedReturnScheduleId;
        if (activeSchedId) {
          params.set("scheduleId", String(activeSchedId));
        } else if (activeSharedSchedules.length > 0) {
          const match = activeSharedSchedules.find((s) => s.departureTime === departureTime);
          if (match?.id) params.set("scheduleId", String(match.id));
        }
      }
    }

    router.push(prefixUrl(`/intercity/confirm?${params.toString()}`));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[var(--bg-page)] text-slate-800 dark:text-slate-100 flex flex-col font-sans">
        <div className="relative w-full h-[320px] md:h-[400px] bg-slate-900 overflow-hidden">
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
          <div className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 pb-8 relative z-10 space-y-4 pt-48">
            <Skeleton className="h-8 w-48 rounded-lg bg-white/20" />
            <Skeleton className="h-10 w-3/5 rounded-lg bg-white/20" />
            <Skeleton className="h-4 w-1/3 rounded-lg bg-white/20" />
          </div>
        </div>

        <div className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-3xl border border-separator shadow-sm space-y-4">
              <Skeleton className="h-4 w-48 rounded-lg" />
              <Skeleton className="h-3 w-full rounded-lg" />
              <Skeleton className="h-3 w-full rounded-lg" />
              <Skeleton className="h-3 w-4/5 rounded-lg" />
            </div>
          </div>
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-3xl border border-separator shadow-sm space-y-4">
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[var(--bg-page)] flex flex-col items-center justify-center gap-4">
        <p className="text-sm font-bold text-slate-500">{t.common.noResults}</p>
        <Button
          onClick={() => router.push(`/${language}/intercity`)}
          className="bg-accent hover:bg-accent-hover text-accent-foreground text-sm font-bold px-5 py-2.5 rounded-xl border-none cursor-pointer shadow-sm transition-colors"
        >
          {t.common.goBack}
        </Button>
      </div>
    );
  }

  const modalCategory = categories.find((c) => c.category.id === vehicleModalCategoryId);
  const extracted = extractComponentContent(parseRouteComponents(route.components));
  const comparisonData = extracted.comparisonData ?? DEFAULT_COMPARISON_DATA;
  const currentTotal =
    serviceType === "PRIVATE"
      ? selectedCategory
        ? calculatePrivatePrice(
          selectedCategory.category.id,
          tripType === "round-trip",
          durationMode === "DAILY_RATE"
        )
        : 0
      : calculateSharedTotalPrice();

  const renderComparisonCard = (
    items: ComparisonItemData[],
    icon: React.ReactNode,
    chipColor: "accent" | "warning",
    isSelected: boolean,
    onClick: () => void
  ) => {
    const title = items.find((i) => i.type === "title");
    const badges = items.filter((i) => i.type === "badge");
    const desc = items.find((i) => i.type === "description");
    const ticks = items.filter((i) => i.type === "tick");
    const selectedClass =
      chipColor === "warning"
        ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/10"
        : "border-accent bg-accent/5 ring-2 ring-accent/10";
    const unselectedClass =
      "border-border hover:border-primary/50 bg-slate-50/50 dark:bg-[var(--bg-card)]";
    return (
      <div
        onClick={onClick}
        className={`p-4 rounded-2xl border transition-all cursor-pointer ${isSelected ? selectedClass : unselectedClass}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-black text-slate-900 dark:text-white uppercase">
              {title?.value || ""}
            </span>
          </div>
          {badges.map((badge, idx) => (
            <Chip key={idx} size="md" color={chipColor} variant="soft" className="text-sm font-bold px-3.5 py-1">
              {badge.value}
            </Chip>
          ))}
        </div>
        {desc && (
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-3">
            {desc.value}
          </p>
        )}
        <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300 font-medium">
          {ticks.map((tick, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>
                {tick.value.includes("{price}")
                  ? tick.value.replace(
                    "{price}",
                    formatSharedPrice(sharedOutboundPrice)
                  )
                  : tick.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[var(--bg-page)] text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      {/* Hero Banner */}
      <section className="relative w-full h-[320px] md:h-[400px] bg-slate-900 overflow-hidden flex items-end">
        {displayHeroImages.length > 0 ? (
          displayHeroImages.map((imgUrl, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${idx === heroImageIndex ? "opacity-100" : "opacity-0"}`}
              style={{ backgroundImage: `url('${getImageUrl(imgUrl)}')` }}
            />
          ))
        ) : (
          <div className="absolute inset-0 bg-slate-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

        {isHeroCarousel && (
          <>
            <button
              onClick={prevHero}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition cursor-pointer border-none"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextHero}
              aria-label="Next image"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition cursor-pointer border-none"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        <div className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 pb-8 relative z-10 text-white space-y-4">
          <Button
            onClick={() => router.push(`/${language}/intercity`)}
            className="flex items-center gap-1.5 text-sm font-bold text-slate-200 hover:text-white bg-black/40 hover:bg-black/60 border-none rounded-full px-4 py-2 cursor-pointer mb-2"
          >
            <ArrowLeft size={15} />
            <span>{t.common.goBack}</span>
          </Button>

          <div className="space-y-1">
            <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight">
              {getRouteName(route)}
            </h1>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {route.distanceKm && (
                <HighlightBadge
                  icon={<MapPin size={14} className="text-accent" />}
                  value={`${route.distanceKm} km`}
                  bg="bg-black/40 backdrop-blur-xs"
                  border="border border-white/10"
                  textColor="text-white font-semibold"
                />
              )}
              {route.estimatedHours && (
                <HighlightBadge
                  icon={<Clock size={14} className="text-amber-400" />}
                  value={`~${route.estimatedHours} ${t.common.hours}`}
                  bg="bg-black/40 backdrop-blur-xs"
                  border="border border-white/10"
                  textColor="text-white font-semibold"
                />
              )}
              {supportsShared && (
                <HighlightBadge
                  icon={<Sparkles size={13} />}
                  value={linkedSharedRoute?.vehicleName || t.rentCar.sharedVehicleDefault}
                  variant="amber"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Route Details, Fleet & Comparison */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Overview */}
          <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-3xl border border-separator shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-wider border-b border-separator pb-2">
              {t.rentCar.tripInformation}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              {getRouteDescription(route) || t.rentCar.routeDetailDesc}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator">
                <span className="text-sm text-slate-400 font-bold block uppercase tracking-wider">
                  {t.rentCar.departure}
                </span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {route.originCity}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator">
                <span className="text-sm text-slate-400 font-bold block uppercase tracking-wider">
                  {t.rentCar.route}
                </span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {route.destinationCity}
                </span>
              </div>
              {route.distanceKm && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator">
                  <span className="text-sm text-slate-400 font-bold block uppercase tracking-wider">
                    {t.rentCar.durationMinutes}
                  </span>
                  <span className="text-base font-black text-accent">{route.distanceKm} km</span>
                </div>
              )}
            </div>
          </div>

          {/* Route Map */}
          {route.originLat && route.originLng && route.destinationLat && route.destinationLng && (
            <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-3xl border border-separator shadow-sm space-y-4">
              <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-wider border-b border-separator pb-2 flex items-center gap-2">
                <MapPin size={16} className="text-accent" />
                {t.rentCar.routeMap}
              </h2>
              <div className="h-[300px] rounded-2xl overflow-hidden border border-separator">
                <RouteMap
                  originLat={Number(route.originLat)}
                  originLng={Number(route.originLng)}
                  originLabel={route.originCity}
                  destinationLat={Number(route.destinationLat)}
                  destinationLng={Number(route.destinationLng)}
                  destinationLabel={route.destinationCity}
                />
              </div>
            </div>
          )}

          {/* SEO Comparison Table: PRIVATE vs SHARED (Only when supportsShared) */}
          {supportsShared && comparisonData && (
            <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-3xl border border-separator shadow-sm space-y-5">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  {comparisonData.title || t.rentCar.compareTitle}
                </h2>
                <p className="text-sm text-slate-400 font-semibold mt-1">
                  {getRouteName(route)} — {comparisonData.subtitle || t.rentCar.serviceType}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderComparisonCard(
                  comparisonData.privateCard,
                  <Car size={18} className="text-accent" />,
                  "accent",
                  serviceType === "PRIVATE",
                  () => setServiceType("PRIVATE")
                )}
                {renderComparisonCard(
                  comparisonData.sharedCard,
                  <Users size={18} className="text-amber-500" />,
                  "warning",
                  serviceType === "SHARED",
                  () => setServiceType("SHARED")
                )}
              </div>
            </div>
          )}

          {/* Services Included & Not Included (Dynamic from DB) */}
          {(extracted.inclusions.length > 0 || extracted.exclusions.length > 0) && (
            <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-3xl border border-separator shadow-sm space-y-5">
              <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-500" />
                {t.rentCar.inclusionExclusionTitle}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-emerald-100 dark:border-emerald-950/30 bg-slate-50/50 dark:bg-[var(--bg-card)] space-y-3">
                  <h3 className="text-sm font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                    {extracted.inclusionsTitle}
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    {extracted.inclusions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 font-medium">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-2xl border border-amber-100 dark:border-amber-950/30 bg-slate-50/50 dark:bg-[var(--bg-card)] space-y-3">
                  <h3 className="text-sm font-black text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                    {extracted.exclusionsTitle}
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    {extracted.exclusions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 font-medium">
                        <XCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Live Scheduled Departure Times Section (Only if supportsShared) */}
          {supportsShared && (outboundTimes.length > 0 || returnTimes.length > 0) && (
            <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-3xl border border-separator shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-separator pb-3">
                <div>
                  <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Clock size={16} className="text-accent" />
                    {t.rentCar.liveScheduleTitle}
                  </h2>
                  <p className="text-sm text-slate-400 font-medium mt-0.5">
                    {t.rentCar.liveScheduleDesc}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Outbound schedule */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                      <ArrowRight size={14} className="text-accent" />
                      {t.rentCar.outboundTrip}: {route.originCity} → {route.destinationCity}
                    </span>
                  </div>
                  {outboundTimes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {outboundTimes.map((dt) => (
                        <div
                          key={dt.id}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-[var(--bg-surface)] border border-border text-sm font-black text-slate-800 dark:text-slate-200 shadow-2xs"
                        >
                          {dt.departureTime}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">
                      {t.rentCar.noDepartureTimesForDirection}
                    </p>
                  )}
                </div>

                {/* Return schedule */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                      <ArrowRight size={14} className="text-amber-500 rotate-180" />
                      {t.rentCar.returnTrip}: {route.destinationCity} → {route.originCity}
                    </span>
                  </div>
                  {returnTimes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {returnTimes.map((dt) => (
                        <div
                          key={dt.id}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-[var(--bg-surface)] border border-border text-sm font-black text-slate-800 dark:text-slate-200 shadow-2xs"
                        >
                          {dt.departureTime}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">
                      {t.rentCar.noDepartureTimesForDirection}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Vehicle Fleet for private charters OR Shared Vehicle Card */}
          {serviceType === "PRIVATE" ? (
            <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-3xl border border-separator shadow-sm space-y-4">
              <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-wider border-b border-separator pb-2 flex items-center justify-between">
                <span>{t.rentCar.representativeVehicles}</span>
                <span className="text-sm text-slate-400 font-medium normal-case">
                  {categories.reduce((acc, c) => acc + c.vehicles.length, 0)} {t.common.seats}
                </span>
              </h2>

              <div className="space-y-4">
                {categories.map(({ category, vehicles }) => {
                  const tr = category.translations?.find((t) => t.locale === language);
                  const catName = tr?.name || category.code || "";
                  const displayCatPrice = calculatePrivatePrice(
                    category.id,
                    tripType === "round-trip",
                    durationMode === "DAILY_RATE"
                  );

                  return (
                    <div
                      key={category.id}
                      className="p-4 rounded-2xl border border-separator space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Car size={16} className="text-accent" />
                          <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                            {catName}
                          </span>
                          <span className="text-sm text-slate-400 font-bold bg-slate-100 dark:bg-[var(--bg-card)] px-3 py-1 rounded-full">
                            {category.minSeat === category.maxSeat
                              ? `${category.minSeat} ${t.common.seats}`
                              : `${category.minSeat}-${category.maxSeat} ${t.common.seats}`}
                          </span>
                        </div>
                        <span className="text-base font-black text-amber-500">
                          {formatPrice(displayCatPrice)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {vehicles.slice(0, 3).map((v) => (
                          <div
                            key={v.id}
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator text-center"
                          >
                            {v.thumbnailUrl && (
                              <img
                                src={getImageUrl(v.thumbnailUrl)}
                                alt=""
                                className="w-full h-16 object-cover rounded-lg mb-1.5"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            )}
                            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 block truncate">
                              {v.brand} {v.model}
                            </span>
                            <span className="text-sm text-slate-500 font-medium">{v.year}</span>
                          </div>
                        ))}
                      </div>

                      {vehicles.length > 3 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setVehicleModalCategoryId(category.id)}
                          className="w-full text-sm font-bold text-accent py-1.5 cursor-pointer"
                        >
                          {t.rentCar.moreVehicles} ({vehicles.length - 3}+)
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Shared Vehicle Information Card */
            <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-3xl border border-amber-500/30 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-separator pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      {linkedSharedRoute?.vehicleName || t.rentCar.sharedVehicleDefault || "Dcar Limousine 9 chỗ VIP"}
                    </h2>
                    <p className="text-sm text-slate-400 font-medium">
                      {t.rentCar.sharedDesc}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-black text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-xl shrink-0">
                  9 {t.common.seats} VIP
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator text-center space-y-1">
                  <div className="text-sm font-black text-slate-800 dark:text-slate-200">Wifi 5G Miễn phí</div>
                  <div className="text-sm text-slate-500 font-medium">Tốc độ cao</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator text-center space-y-1">
                  <div className="text-sm font-black text-slate-800 dark:text-slate-200">Ghế massage VIP</div>
                  <div className="text-sm text-slate-500 font-medium">Êm ái ngả lưng</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator text-center space-y-1">
                  <div className="text-sm font-black text-slate-800 dark:text-slate-200">Cổng sạc USB</div>
                  <div className="text-sm text-slate-500 font-medium">Từng vị trí ngồi</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator text-center space-y-1">
                  <div className="text-sm font-black text-slate-800 dark:text-slate-200">Nước suối & Khăn</div>
                  <div className="text-sm text-slate-500 font-medium">Phục vụ suốt tuyến</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Booking Form Sidebar */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-28">
          <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-3xl border border-separator shadow-sm space-y-5">
            {/* Service Type Select */}
            <div className="space-y-1.5">
              <Select
                aria-label={t.rentCar.serviceType}
                selectedKey={serviceType}
                onSelectionChange={(key) => {
                  if (key) {
                    const newType = key as "PRIVATE" | "SHARED";
                    setServiceType(newType);
                    setDepartureTime("");
                  }
                }}
                className="w-full"
              >
                <Label className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t.rentCar.serviceType}
                </Label>
                <Select.Trigger className="w-full h-14 px-3 text-sm font-black bg-slate-50 dark:bg-[var(--bg-card)] border border-border rounded-xl cursor-pointer flex items-center justify-between">
                  <Select.Value className="text-sm font-bold text-left truncate text-slate-800 dark:text-slate-100" />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-border-secondary rounded-xl shadow-xl p-1 z-50 w-[var(--trigger-width)]">
                  <ListBox>
                    <ListBox.Item
                      id="PRIVATE"
                      textValue={t.rentCar.privateService}
                      className="px-3 py-2 rounded-lg text-sm font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)]"
                    >
                      <div className="flex items-center gap-2.5">
                        <Car size={16} className="text-accent shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {t.rentCar.privateService}
                          </span>
                          <span className="text-sm text-slate-400 font-medium">
                            {t.rentCar.privateDesc}
                          </span>
                        </div>
                      </div>
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    {supportsShared && (
                      <ListBox.Item
                        id="SHARED"
                        textValue={t.rentCar.sharedService}
                        className="px-3 py-2 rounded-lg text-sm font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)]"
                      >
                        <div className="flex items-center gap-2.5">
                          <Users size={16} className="text-amber-500 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {t.rentCar.sharedService}
                            </span>
                            <span className="text-sm text-slate-400 font-medium">
                              {t.rentCar.sharedDesc}
                            </span>
                          </div>
                        </div>
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    )}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>

            {/* Trip Duration & Type Selector */}
            {serviceType === "PRIVATE" && availablePriceTypes.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-bold uppercase tracking-wider">
                  {t.rentCar.tripType}
                </Label>
                <RadioGroup
                  orientation="horizontal"
                  value={durationMode === "DAILY_RATE" ? "DAILY_RATE" : tripType}
                  onChange={(val) => {
                    if (val === "DAILY_RATE") {
                      setDurationMode("DAILY_RATE");
                    } else {
                      setDurationMode("IN_DAY");
                      setTripType(val as "one-way" | "round-trip");
                    }
                  }}
                  aria-label={t.rentCar.tripType}
                  className={`grid gap-1 p-1.5 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-border w-full ${availablePriceTypes.length === 1
                    ? "grid-cols-1"
                    : "grid-cols-2"
                    }`}
                >
                  {availablePriceTypes.map((pt) => (
                    <Radio key={pt.value} value={pt.value} className="w-full flex items-center justify-center m-0">
                      <Radio.Content className="flex items-center ml-8 justify-start gap-1.5 sm:gap-2 cursor-pointer py-1.5 px-1 w-full text-center">
                        <Radio.Control className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shrink-0">
                          <Radio.Indicator className="rounded-full [&:empty::before]:rounded-full" />
                        </Radio.Control>
                        <Label className="text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer select-none whitespace-nowrap">
                          {pt.label}
                        </Label>
                      </Radio.Content>
                    </Radio>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* SHARED: Chiều đi vs Chiều về */}
            {serviceType === "SHARED" && (
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-[var(--bg-card)] rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setSharedDirection("OUTBOUND");
                    setDepartureTime("");
                    setSelectedOutboundScheduleId(null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-sm font-black transition cursor-pointer border-none ${sharedDirection === "OUTBOUND"
                    ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white bg-transparent"
                    }`}
                >
                  {t.rentCar.outboundTrip}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSharedDirection("RETURN");
                    setDepartureTime("");
                    setSelectedReturnScheduleId(null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-sm font-black transition cursor-pointer border-none ${sharedDirection === "RETURN"
                    ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white bg-transparent"
                    }`}
                >
                  {t.rentCar.returnTrip}
                </button>
              </div>
            )}

            {/* If PRIVATE: Vehicle Category Selector */}
            {serviceType === "PRIVATE" && (
              <div className="space-y-2">
                <Label className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t.rentCar.vehicleType}
                </Label>
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {categories.map(({ category }) => {
                    const isSelected = selectedCategoryId === category.id;
                    const tr = category.translations?.find((t) => t.locale === language);
                    const catName = tr?.name || category.code || "";
                    const catPrice = calculatePrivatePrice(
                      category.id,
                      tripType === "round-trip",
                      durationMode === "DAILY_RATE"
                    );

                    return (
                      <div
                        key={category.id}
                        onClick={() => setSelectedCategoryId(category.id)}
                        className={`cursor-pointer rounded-2xl border p-3 transition-all duration-200 flex items-center justify-between ${isSelected
                          ? "border-accent bg-accent/5 ring-2 ring-accent/10 shadow-xs"
                          : "border-border hover:border-primary/50 bg-white dark:bg-[var(--bg-surface)]"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                            <Car size={18} />
                          </div>
                          <div>
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                              {catName}
                            </span>
                            <span className="text-sm text-slate-400 font-semibold">
                              {category.minSeat === category.maxSeat
                                ? `${category.minSeat} ${t.common.seats}`
                                : `${category.minSeat}-${category.maxSeat} ${t.common.seats}`}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm sm:text-base font-black text-accent block">
                            {formatPrice(catPrice)}
                          </span>
                          {durationMode === "DAILY_RATE" && (
                            <span className="text-sm text-slate-400 font-semibold block">
                              1 {t.rentCar.dayUnit}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {categories.length === 0 && (
                    <p className="text-sm text-slate-400 font-semibold px-1 py-3 text-center">
                      {t.rentCar.noVehiclesForRoute}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* If SHARED: Vehicle badge + Passenger count selector */}
            {serviceType === "SHARED" && (
              <div className="space-y-3">
                {/* Vehicle badge */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-500" />
                    <div>
                      <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white block">
                        {linkedSharedRoute?.vehicleName || t.rentCar.sharedVehicleDefault}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400">
                      {formatSharedPrice(sharedPerPaxPrice)}
                    </span>
                    <span className="text-sm text-slate-400 block font-semibold">
                      / {t.rentCar.pax}
                    </span>
                  </div>
                </div>

                {/* Passenger count */}
                <div className="space-y-1">
                  <Label className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t.rentCar.paxCount}
                  </Label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPassengerCount(num)}
                        className={`flex-1 py-2 rounded-xl text-sm font-black border transition cursor-pointer ${passengerCount === num
                          ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-2xs"
                          : "border-border bg-white dark:bg-[var(--bg-surface)] text-slate-700 dark:text-slate-300 hover:border-primary/50"
                          }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Date & Time Selection (for SHARED ride only) */}
            {serviceType === "SHARED" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {sharedDirection === "OUTBOUND"
                      ? `Điểm xuất phát ${route.originCity} (${route.originName || route.originCity} → ${route.destinationCity})`
                      : `Điểm xuất phát ${route.destinationCity} (${route.destinationCity} → ${route.originCity})`}
                  </Label>
                  <DatePicker
                    className="w-full"
                    value={dateValue}
                    minValue={currentDate}
                    onChange={(val) => setDateValue(val as DateValue)}
                  >
                    <DateField.Group
                      fullWidth
                      className="h-10 bg-slate-50 dark:bg-[var(--bg-card)] border border-border rounded-xl px-3 flex items-center justify-between"
                    >
                      <DateField.Input className="text-sm font-semibold bg-transparent border-none outline-none">
                        {(segment) => <DateField.Segment segment={segment} />}
                      </DateField.Input>
                      <DateField.Suffix>
                        <DatePicker.Trigger className="cursor-pointer">
                          <DatePicker.TriggerIndicator />
                        </DatePicker.Trigger>
                      </DateField.Suffix>
                    </DateField.Group>
                    <DatePicker.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-border-secondary rounded-2xl p-4 shadow-xl z-50">
                      <Calendar aria-label="Pick departure date">
                        <Calendar.Header className="flex items-center justify-between mb-2">
                          <Calendar.YearPickerTrigger className="text-sm font-bold flex items-center gap-1 cursor-pointer">
                            <Calendar.YearPickerTriggerHeading />
                            <Calendar.YearPickerTriggerIndicator />
                          </Calendar.YearPickerTrigger>
                          <div className="flex gap-1">
                            <Calendar.NavButton
                              slot="previous"
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer"
                            />
                            <Calendar.NavButton
                              slot="next"
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer"
                            />
                          </div>
                        </Calendar.Header>
                        <Calendar.Grid className="w-full">
                          <Calendar.GridHeader className="text-slate-400 text-sm font-bold">
                            {(day) => <Calendar.HeaderCell className="w-8 h-8 text-center">{day}</Calendar.HeaderCell>}
                          </Calendar.GridHeader>
                          <Calendar.GridBody>
                            {(date) => (
                              <Calendar.Cell
                                date={date}
                                className="w-8 h-8 text-sm font-semibold text-center cursor-pointer rounded-lg hover:bg-accent/10 hover:text-accent aria-selected:bg-accent aria-selected:text-accent-foreground"
                              />
                            )}
                          </Calendar.GridBody>
                        </Calendar.Grid>
                      </Calendar>
                    </DatePicker.Popover>
                  </DatePicker>
                  {isDateInvalid && <p className="text-sm text-red-500 font-semibold">{errors.date}</p>}
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {sharedDirection === "OUTBOUND"
                      ? `${t.rentCar.selectOutboundTime} (${route.originName || route.originCity} → ${route.destinationCity})`
                      : `${t.rentCar.selectReturnTime} (${route.destinationCity} → ${route.originCity})`}
                  </Label>
                  {activeSharedSchedules.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {activeSharedSchedules.map((dt) => {
                        const isSelected = departureTime === dt.departureTime;
                        const slotPrice = activeDirection?.price || sharedPerPaxPrice;
                        return (
                          <button
                            key={dt.id || dt.departureTime}
                            type="button"
                            onClick={() => {
                              setDepartureTime(dt.departureTime);
                              if (sharedDirection === "OUTBOUND") {
                                setSelectedOutboundScheduleId(dt.id ?? null);
                              } else {
                                setSelectedReturnScheduleId(dt.id ?? null);
                              }
                              if (errors.departureTime) setErrors((prev) => ({ ...prev, departureTime: "" }));
                            }}
                            className={`py-2 px-2.5 rounded-xl border transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${isSelected
                              ? "border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black shadow-2xs"
                              : "border-border bg-white dark:bg-[var(--bg-card)] text-slate-700 dark:text-slate-300 hover:border-primary/50"
                              }`}
                          >
                            <span className="text-sm font-black">{dt.departureTime.substring(0, 5)}</span>
                            <span className={`text-sm font-bold ${isSelected ? "text-amber-600 dark:text-amber-400" : "text-amber-500/90 dark:text-amber-400/90"}`}>
                              {formatSharedPrice(slotPrice)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : activeDirection?.schedules && activeDirection.schedules.length > 0 ? (
                    <p className="text-sm text-amber-600 dark:text-amber-400 italic bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                      Không có chuyến xe chạy vào ngày này. Quý khách vui lòng chọn ngày khác.
                    </p>
                  ) : activeTimes.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {activeTimes.map((dt) => {
                        const isSelected = departureTime === dt.departureTime;
                        const slotPrice = activeDirection?.price || sharedPerPaxPrice;
                        return (
                          <button
                            key={dt.id}
                            type="button"
                            onClick={() => {
                              setDepartureTime(dt.departureTime);
                              if (errors.departureTime) setErrors((prev) => ({ ...prev, departureTime: "" }));
                            }}
                            className={`py-2 px-2.5 rounded-xl border transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${isSelected
                              ? "border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black shadow-2xs"
                              : "border-border bg-white dark:bg-[var(--bg-card)] text-slate-700 dark:text-slate-300 hover:border-primary/50"
                              }`}
                          >
                            <span className="text-sm font-black">{dt.departureTime.substring(0, 5)}</span>
                            <span className={`text-sm font-bold ${isSelected ? "text-amber-600 dark:text-amber-400" : "text-amber-500/90 dark:text-amber-400/90"}`}>
                              {formatSharedPrice(slotPrice)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <TimePicker
                      value={timeStringToValue(departureTime)}
                      onChange={(v) => {
                        setDepartureTime(timeValueToString(v));
                        if (errors.departureTime) setErrors((prev) => ({ ...prev, departureTime: "" }));
                      }}
                      popoverTitle="Chọn giờ xuất phát"
                      language={language}
                      triggerClassName="bg-white dark:bg-[var(--bg-surface)]"
                    />
                  )}
                  {isDepartureTimeInvalid && (
                    <p className="text-sm text-red-500 font-semibold">{errors.departureTime}</p>
                  )}
                </div>
              </div>
            )}

            {/* Price Summary & CTA */}
            <div className="border-t border-separator pt-4 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">
                    {t.common.totalPrice}
                  </span>
                  <span className="text-sm text-accent font-bold block mt-0.5">
                    {serviceType === "PRIVATE" ? (
                      durationMode === "DAILY_RATE" ? (
                        `${t.rentCar.dailyRate} (1 ${t.rentCar.dayUnit})`
                      ) : tripType === "round-trip" ? (
                        t.rentCar.roundTrip
                      ) : (
                        t.rentCar.oneWay
                      )
                    ) : (
                      <>
                        {passengerCount} {t.rentCar.pax} •{" "}
                        {sharedDirection === "OUTBOUND" ? t.rentCar.outboundTrip : t.rentCar.returnTrip}
                      </>
                    )}
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-amber-500">
                  {formatPrice(currentTotal)}
                </span>
              </div>

              <Button
                onClick={handleBooking}
                className="w-full h-11 bg-accent hover:bg-accent-hover text-accent-foreground font-black text-sm uppercase tracking-wider rounded-2xl border-none cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                {`${t.common.bookNow} →`}
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Vehicle Modal */}
      {modalCategory && (
        <Modal isOpen={Boolean(modalCategory)} onOpenChange={() => setVehicleModalCategoryId(null)}>
          <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
            <ModalContainer>
              <ModalDialog className="max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-border-secondary overflow-hidden">
                <ModalHeader className="px-6 py-4 border-b border-separator flex items-center justify-between shrink-0">
                  <span className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    {modalCategory.category.code} - {t.rentCar.representativeVehicles}
                  </span>
                  <ModalCloseTrigger className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer">
                    <X size={16} />
                  </ModalCloseTrigger>
                </ModalHeader>
                <ModalBody className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {modalCategory.vehicles.map((v) => (
                      <div
                        key={v.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator space-y-2"
                      >
                        {v.thumbnailUrl && (
                          <img
                            src={getImageUrl(v.thumbnailUrl)}
                            alt=""
                            className="w-full h-24 object-cover rounded-xl"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        )}
                        <div>
                          <span className="text-sm font-black text-slate-900 dark:text-white block">
                            {v.brand} {v.model}
                          </span>
                          <div className="flex gap-2 text-sm text-slate-400 font-bold mt-0.5">
                            <span>{v.year}</span>
                            {v.fuelType && (
                              <>
                                <span>•</span>
                                <span>{v.fuelType}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ModalBody>
                <ModalFooter className="px-6 py-4 border-t border-separator bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => setVehicleModalCategoryId(null)}
                    className="rounded-xl font-bold text-sm h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    {t.common.close}
                  </Button>
                </ModalFooter>
              </ModalDialog>
            </ModalContainer>
          </ModalBackdrop>
        </Modal>
      )}
    </div>
  );
}
