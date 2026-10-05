"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  Car,
  MapPin,
  Clock,
  User,
  Phone,
  Mail,
  MessageSquare,
  Users,
  Sparkles,
  ShieldCheck,
  Calendar as CalendarIcon,
  Bus,
  Building2,
} from "lucide-react";
import {
  Button,
  Skeleton,
  Input,
  TextArea,
  DatePicker,
  DateField,
  Calendar,
  FieldError,
  Chip,
  Label,
  TextField,
  Select,
  ListBox,
} from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { parseDate, today, getLocalTimeZone } from "@internationalized/date";

import { useI18n } from "@/context/LanguageContext";
import { getActiveIntercityRoutes, getPublicIntercityRoutePrices, type IntercityRouteDto } from "@/lib/api/intercity";
import {
  getVehicleCategories,
  getRentableVehiclesByCategory,
  type VehicleCategoryDto,
  type VehicleDto,
} from "@/lib/api/fleet";
import { createRentCarBooking } from "@/lib/api/rent-car/bookings";
import {
  getSharedRoute,
  getSharedOffices,
  createSharedBooking,
  type SharedRouteDto,
  type SharedOfficeDto,
} from "@/lib/api/sharedRoute";
import { formatPriceSync as _formatPrice } from "@/lib/format";
import { calcIntercityDailyRatePrice, calcSharedPrice, pickPriceListRow } from "@/lib/pricing";
import { backendUrl } from "@/lib/api/client";
import { AutofillButton } from "@/components/AutofillButton";
import BookingConfirmationModal from "@/components/BookingConfirmationModal";
import SuccessOverlay from "@/components/SuccessOverlay";
import ErrorOverlay from "@/components/ErrorOverlay";
import { TimePicker, type TimeValue } from "@/components/time-picker";
import { RentalDateRangePicker } from "@/components/date-picker/RentalDateRangePicker";
import { calculateRentalDays, formatToIsoDate, formatToDisplayDate } from "@/lib/utils/rentalDate";
import { CustomerDiscountSection, type AppliedDiscountInfo } from "@/components/common/CustomerDiscountSection";
import { calculateDeposit, DepositType } from "@/lib/pricing/deposit";
import { DurationMode, IntercityPriceTypeCode, IntercityServiceType, IntercityTripType, PickupType } from "@/types/intercity";

interface CategoryWithVehicles {
  category: VehicleCategoryDto;
  vehicles: VehicleDto[];
  price: number;
  roundTripPrice?: number;
  dailyRate?: number;
  minimumDays?: number;
  depositType?: "PERCENT" | "FIXED";
  depositRate?: number;
  depositAmount?: number;
}

export default function RentCarConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useI18n();

  const prefixUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const segments = url.split("/");
    if (segments.length > 1 && ["vi", "en", "ko", "ru"].includes(segments[1])) return url;
    return `/${language}${url === "/" ? "" : url}`;
  };

  const routeId = Number(searchParams.get("routeId") || "0");
  const serviceTypeParam = searchParams.get("serviceType") || IntercityServiceType.PRIVATE;
  const [serviceType, setServiceType] = useState<IntercityServiceType>(
    serviceTypeParam === IntercityServiceType.SHARED ? IntercityServiceType.SHARED : IntercityServiceType.PRIVATE
  );
  const initialPax = Math.max(1, Number(searchParams.get("passengerCount") || searchParams.get("passengers") || "1"));
  const [passengerCount, setPassengerCount] = useState<number>(initialPax);

  const initialTripType = searchParams.get("tripType") || IntercityTripType.ONE_WAY;
  const departureDate = searchParams.get("departureDate") || searchParams.get("date") || "";
  const departureTime = searchParams.get("departureTime") || searchParams.get("time") || "";
  const returnDate = searchParams.get("returnDate") || "";
  const returnTime = searchParams.get("returnTime") || "";
  const rentalDaysParam = searchParams.get("rentalDays");

  const [durationMode, setDurationMode] = useState<DurationMode>(() => {
    return initialTripType === IntercityTripType.DAILY_RATE || Boolean(rentalDaysParam) ? DurationMode.DAILY_RATE : DurationMode.IN_DAY;
  });
  const [tripType, setTripType] = useState<string>(
    initialTripType === IntercityTripType.DAILY_RATE ? IntercityTripType.ONE_WAY : initialTripType
  );

  const currentDate = today(getLocalTimeZone());

  const [dateRange, setDateRange] = useState<{ start: DateValue; end: DateValue } | null>(() => {
    if (departureDate) {
      try {
        const start = parseDate(departureDate);
        const end = returnDate ? parseDate(returnDate) : start;
        return { start, end };
      } catch {}
    }
    return { start: currentDate, end: currentDate };
  });

  const [dateValue, setDateValue] = useState<DateValue | null>(() => {
    if (departureDate) {
      try {
        return parseDate(departureDate);
      } catch {}
    }
    return currentDate;
  });

  const [returnDateValue, setReturnDateValue] = useState<DateValue | null>(() => {
    if (returnDate) {
      try {
        return parseDate(returnDate);
      } catch {}
    }
    return null;
  });

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

  const defaultTimeValue = timeStringToValue(departureTime);
  const [editTime, setEditTime] = useState(departureTime || timeValueToString(defaultTimeValue));
  const [editTimeValue, setEditTimeValue] = useState<TimeValue>(defaultTimeValue);
  const defaultReturnTimeValue = timeStringToValue(returnTime);
  const [editReturnTime, setEditReturnTime] = useState(returnTime || (returnTime ? timeValueToString(defaultReturnTimeValue) : ""));
  const [editReturnTimeValue, setEditReturnTimeValue] = useState<TimeValue>(defaultReturnTimeValue);

  const customerName = searchParams.get("customerName") || "";
  const customerEmail = searchParams.get("customerEmail") || "";
  const customerPhone = searchParams.get("customerPhone") || "";
  const notes = searchParams.get("notes") || "";
  const initialPickupAddress = searchParams.get("pickupAddress") || searchParams.get("pickup") || "";
  const initialDropoffAddress = searchParams.get("dropoffAddress") || searchParams.get("dropoff") || "";

  const [editName, setEditName] = useState(customerName);
  const [editPhone, setEditPhone] = useState(customerPhone);
  const [editEmail, setEditEmail] = useState(customerEmail);
  const [editNotes, setEditNotes] = useState(notes);
  const [editZaloId, setEditZaloId] = useState("");
  const [editKakaoTalkId, setEditKakaoTalkId] = useState("");
  const [editPickupAddress, setEditPickupAddress] = useState(initialPickupAddress);
  const [editDropoffAddress, setEditDropoffAddress] = useState(initialDropoffAddress);

  const [route, setRoute] = useState<IntercityRouteDto | null>(null);
  const [allCategories, setAllCategories] = useState<CategoryWithVehicles[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [createdCode, setCreatedCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Shared route params & state
  const sharedRouteId = Number(searchParams.get("sharedRouteId") || searchParams.get("routeId") || "0");
  const sharedTripType = searchParams.get("sharedTripType") || searchParams.get("tripType") || IntercityTripType.ONE_WAY;
  const isSharedRoundTrip = sharedTripType === IntercityTripType.RETURN || sharedTripType === IntercityTripType.ROUND_TRIP;
  const pax = Math.max(1, Number(searchParams.get("pax") || searchParams.get("passengerCount") || "1"));

  // Outbound params
  const outboundDirectionId = Number(searchParams.get("directionId") || "0");
  const outboundScheduleId = Number(searchParams.get("scheduleId") || "0");
  const outboundTripDate = searchParams.get("tripDate") || searchParams.get("departureDate") || searchParams.get("date") || "";
  const [outboundPickupType, setOutboundPickupType] = useState<PickupType>(() => {
    const p = searchParams.get("pickupType");
    return p === PickupType.DOOR ? PickupType.DOOR : PickupType.OFFICE;
  });
  const [outboundPickupOfficeId, setOutboundPickupOfficeId] = useState<number | null>(() => {
    const id = Number(searchParams.get("pickupOfficeId"));
    return id || null;
  });
  const [editOutboundPickupAddress, setEditOutboundPickupAddress] = useState(searchParams.get("pickupAddress") || "");
  const [outboundDropoffType, setOutboundDropoffType] = useState<PickupType>(() => {
    const p = searchParams.get("dropoffType");
    return p === PickupType.DOOR ? PickupType.DOOR : PickupType.OFFICE;
  });
  const [outboundDropoffOfficeId, setOutboundDropoffOfficeId] = useState<number | null>(() => {
    const id = Number(searchParams.get("dropoffOfficeId"));
    return id || null;
  });
  const [editOutboundDropoffAddress, setEditOutboundDropoffAddress] = useState(searchParams.get("dropoffAddress") || "");

  // Return params
  const returnDirectionId = Number(searchParams.get("returnDirectionId") || "0");
  const returnScheduleId = Number(searchParams.get("returnScheduleId") || "0");
  const returnTripDate = searchParams.get("returnTripDate") || searchParams.get("returnDate") || "";
  const [returnPickupType, setReturnPickupType] = useState<PickupType>(() => {
    const p = searchParams.get("returnPickupType");
    return p === PickupType.DOOR ? PickupType.DOOR : PickupType.OFFICE;
  });
  const [returnPickupOfficeId, setReturnPickupOfficeId] = useState<number | null>(() => {
    const id = Number(searchParams.get("returnPickupOfficeId"));
    return id || null;
  });
  const [editReturnPickupAddress, setEditReturnPickupAddress] = useState(searchParams.get("returnPickupAddress") || "");
  const [returnDropoffType, setReturnDropoffType] = useState<PickupType>(() => {
    const p = searchParams.get("returnDropoffType");
    return p === PickupType.DOOR ? PickupType.DOOR : PickupType.OFFICE;
  });
  const [returnDropoffOfficeId, setReturnDropoffOfficeId] = useState<number | null>(() => {
    const id = Number(searchParams.get("returnDropoffOfficeId"));
    return id || null;
  });
  const [editReturnDropoffAddress, setEditReturnDropoffAddress] = useState(searchParams.get("returnDropoffAddress") || "");

  const [sharedRoute, setSharedRoute] = useState<SharedRouteDto | null>(null);
  const [allOffices, setAllOffices] = useState<SharedOfficeDto[]>([]);

  const getOfficeText = useCallback((officeId?: number | null) => {
    if (!officeId) return "";
    const off = allOffices.find((o) => o.id === officeId);
    return off ? `${off.name} (${off.address}, ${off.city})` : `Văn phòng #${officeId}`;
  }, [allOffices]);

  const outboundDirection = useMemo(() => {
    if (!sharedRoute?.directions) return null;
    return sharedRoute.directions.find((d) => d.id === outboundDirectionId)
      || sharedRoute.directions.find((d) => d.directionType === "OUTBOUND")
      || sharedRoute.directions[0] || null;
  }, [sharedRoute, outboundDirectionId]);

  const outboundSchedule = useMemo(() => {
    if (!outboundDirection?.schedules) return null;
    return outboundDirection.schedules.find((s) => s.id === outboundScheduleId)
      || outboundDirection.schedules[0] || null;
  }, [outboundDirection, outboundScheduleId]);

  const returnDirection = useMemo(() => {
    if (!sharedRoute?.directions || !isSharedRoundTrip) return null;
    return sharedRoute.directions.find((d) => d.id === returnDirectionId)
      || sharedRoute.directions.find((d) => d.directionType === "RETURN")
      || null;
  }, [sharedRoute, isSharedRoundTrip, returnDirectionId]);

  const returnSchedule = useMemo(() => {
    if (!returnDirection?.schedules) return null;
    return returnDirection.schedules.find((s) => s.id === returnScheduleId)
      || returnDirection.schedules[0] || null;
  }, [returnDirection, returnScheduleId]);

  const availableOriginOffices = useMemo(() => {
    if (outboundDirection?.originOffices && outboundDirection.originOffices.length > 0) {
      return outboundDirection.originOffices;
    }
    if (outboundDirection?.originOfficeIds && outboundDirection.originOfficeIds.length > 0) {
      return allOffices.filter((o) => o.id && outboundDirection.originOfficeIds!.includes(o.id));
    }
    if (outboundDirection?.originCity) {
      return allOffices.filter((o) => o.city?.toLowerCase() === outboundDirection.originCity?.toLowerCase());
    }
    return allOffices;
  }, [outboundDirection, allOffices]);

  const availableDestinationOffices = useMemo(() => {
    if (outboundDirection?.destinationOffices && outboundDirection.destinationOffices.length > 0) {
      return outboundDirection.destinationOffices;
    }
    if (outboundDirection?.destinationOfficeIds && outboundDirection.destinationOfficeIds.length > 0) {
      return allOffices.filter((o) => o.id && outboundDirection.destinationOfficeIds!.includes(o.id));
    }
    if (outboundDirection?.destinationCity) {
      return allOffices.filter((o) => o.city?.toLowerCase() === outboundDirection.destinationCity?.toLowerCase());
    }
    return allOffices;
  }, [outboundDirection, allOffices]);

  const availableReturnOriginOffices = useMemo(() => {
    if (returnDirection?.originOffices && returnDirection.originOffices.length > 0) {
      return returnDirection.originOffices;
    }
    if (returnDirection?.originOfficeIds && returnDirection.originOfficeIds.length > 0) {
      return allOffices.filter((o) => o.id && returnDirection.originOfficeIds!.includes(o.id));
    }
    if (returnDirection?.originCity) {
      return allOffices.filter((o) => o.city?.toLowerCase() === returnDirection.originCity?.toLowerCase());
    }
    return allOffices;
  }, [returnDirection, allOffices]);

  const availableReturnDestinationOffices = useMemo(() => {
    if (returnDirection?.destinationOffices && returnDirection.destinationOffices.length > 0) {
      return returnDirection.destinationOffices;
    }
    if (returnDirection?.destinationOfficeIds && returnDirection.destinationOfficeIds.length > 0) {
      return allOffices.filter((o) => o.id && returnDirection.destinationOfficeIds!.includes(o.id));
    }
    if (returnDirection?.destinationCity) {
      return allOffices.filter((o) => o.city?.toLowerCase() === returnDirection.destinationCity?.toLowerCase());
    }
    return allOffices;
  }, [returnDirection, allOffices]);

  useEffect(() => {
    if (availableOriginOffices.length > 0) {
      if (!outboundPickupOfficeId || !availableOriginOffices.some((o) => o.id === outboundPickupOfficeId)) {
        setOutboundPickupOfficeId(availableOriginOffices[0].id ?? null);
      }
    } else if (outboundPickupType === PickupType.OFFICE) {
      setOutboundPickupType(PickupType.DOOR);
    }
  }, [availableOriginOffices, outboundPickupOfficeId, outboundPickupType]);

  useEffect(() => {
    if (availableDestinationOffices.length > 0) {
      if (!outboundDropoffOfficeId || !availableDestinationOffices.some((o) => o.id === outboundDropoffOfficeId)) {
        setOutboundDropoffOfficeId(availableDestinationOffices[0].id ?? null);
      }
    } else if (outboundDropoffType === PickupType.OFFICE) {
      setOutboundDropoffType(PickupType.DOOR);
    }
  }, [availableDestinationOffices, outboundDropoffOfficeId, outboundDropoffType]);

  useEffect(() => {
    if (availableReturnOriginOffices.length > 0) {
      if (!returnPickupOfficeId || !availableReturnOriginOffices.some((o) => o.id === returnPickupOfficeId)) {
        setReturnPickupOfficeId(availableReturnOriginOffices[0].id ?? null);
      }
    } else if (returnPickupType === PickupType.OFFICE) {
      setReturnPickupType(PickupType.DOOR);
    }
  }, [availableReturnOriginOffices, returnPickupOfficeId, returnPickupType]);

  useEffect(() => {
    if (availableReturnDestinationOffices.length > 0) {
      if (!returnDropoffOfficeId || !availableReturnDestinationOffices.some((o) => o.id === returnDropoffOfficeId)) {
        setReturnDropoffOfficeId(availableReturnDestinationOffices[0].id ?? null);
      }
    } else if (returnDropoffType === PickupType.OFFICE) {
      setReturnDropoffType(PickupType.DOOR);
    }
  }, [availableReturnDestinationOffices, returnDropoffOfficeId, returnDropoffType]);

  const sharedTotalPrice = useMemo(() => {
    const outPrice = outboundDirection?.price || 0;
    const retPrice = isSharedRoundTrip ? (returnDirection?.price || 0) : 0;
    return (outPrice + retPrice) * pax;
  }, [outboundDirection, returnDirection, isSharedRoundTrip, pax]);

  const rentalDays = useMemo(() => {
    if (!dateRange?.start || !dateRange?.end) return 1;
    return calculateRentalDays(dateRange.start, dateRange.end, 1);
  }, [dateRange]);

  const isDateInvalid = Boolean(dateValue && dateValue.compare(currentDate) < 0);
  const isDateRangeInvalid = Boolean(
    !dateRange?.start ||
    !dateRange?.end ||
    dateRange.start.compare(currentDate) < 0 ||
    dateRange.end.compare(dateRange.start) < 0
  );

  const formatPrice = useCallback((value: number) => _formatPrice(value, language), [language]);

  const isRoundTrip = tripType === IntercityTripType.ROUND_TRIP || tripType === IntercityTripType.RETURN;

  useEffect(() => {
    if (serviceType === IntercityServiceType.SHARED) {
      if (!sharedRouteId) {
        router.push(prefixUrl("/intercity"));
        return;
      }
      const fetchSharedData = async () => {
        setLoading(true);
        try {
          const [routeData, officesData] = await Promise.all([
            getSharedRoute(sharedRouteId),
            getSharedOffices(false),
          ]);
          setSharedRoute(routeData);
          setAllOffices(officesData);
        } catch (err) {
          console.error("Failed to load shared route data:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchSharedData();
      return;
    }

    if (!routeId) {
      router.push(prefixUrl("/intercity"));
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [routesRes, catsRes] = await Promise.all([
          getActiveIntercityRoutes(),
          getVehicleCategories({ active: true, page: 0, size: 100 }),
        ]);

        const routes = (routesRes?.data ?? []) as IntercityRouteDto[];
        const foundRoute = routes.find((r) => r.id === routeId);
        if (foundRoute) {
          setRoute(foundRoute);
        }

        const allCats = (catsRes?.data?.content ?? []) as VehicleCategoryDto[];

        // Prefer the public price engine — the same source the route detail page uses.
        // /active only embeds prices from the legacy intercity_route_prices table, which
        // the backend's initDefaultPrices() wipes — relying on it made this page always
        // show 0 VND even though the detail page priced the same trip correctly.
        let routePrices = foundRoute?.prices ?? [];
        try {
          const priceRes = await getPublicIntercityRoutePrices(foundRoute?.id);
          if (priceRes?.data && priceRes.data.length > 0) {
            routePrices = priceRes.data;
          }
        } catch {
          /* keep the foundRoute.prices fallback */
        }

        const catsWithVehicles: CategoryWithVehicles[] = [];
        for (const cat of allCats) {
          const oneWayEntry = pickPriceListRow(routePrices, cat.id, IntercityPriceTypeCode.ONE_WAY);
          const roundTripEntry = pickPriceListRow(routePrices, cat.id, IntercityPriceTypeCode.ROUND_TRIP_SAME_DAY);
          const dailyRateEntry = pickPriceListRow(routePrices, cat.id, IntercityPriceTypeCode.DAILY_RATE);
          if (!oneWayEntry && !roundTripEntry && !dailyRateEntry) continue;

          let vehicles: VehicleDto[] = [];
          try {
            const vehiclesRes = await getRentableVehiclesByCategory(cat.id);
            vehicles = (vehiclesRes?.data ?? []) as VehicleDto[];
          } catch {
            vehicles = [];
          }

          const dailyRate = dailyRateEntry ? Number(dailyRateEntry.basePrice ?? 0) : 0;

          const depositEntry = oneWayEntry ?? roundTripEntry ?? dailyRateEntry;
          catsWithVehicles.push({
            category: cat,
            vehicles,
            price: Number(oneWayEntry?.basePrice ?? 0),
            roundTripPrice: Number(roundTripEntry?.basePrice ?? 0),
            dailyRate,
            minimumDays: dailyRateEntry?.minDays ?? dailyRateEntry?.minimumDays ?? 1,
            // Deposit only when the price entry actually carries a policy — no silent 20% default.
            depositType: depositEntry?.depositType,
            depositRate: depositEntry?.depositRate,
            depositAmount: depositEntry?.depositAmount,
          });
        }

        setAllCategories(catsWithVehicles);

        const seatsParam = searchParams.get("seats") || searchParams.get("vehicleCategoryId");
        let preselectedId: number | null = null;
        if (seatsParam && catsWithVehicles.length > 0) {
          const matched = catsWithVehicles.find(
            (c) => c.category.code === seatsParam || String(c.category.id) === seatsParam
          );
          if (matched) preselectedId = matched.category.id;
        }
        if (!preselectedId && catsWithVehicles.length > 0) {
          preselectedId = catsWithVehicles[0].category.id;
        }
        setSelectedCategoryId(preselectedId);
      } catch (err) {
        console.error("Failed to load confirm data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [routeId, sharedRouteId, serviceType, language]);

  const selectedCategory = allCategories.find((c) => c.category.id === selectedCategoryId) || allCategories[0];

  // Dynamic price calculation for categories
  const calculateCategoryPrice = useCallback((cat: CategoryWithVehicles) => {
    if (durationMode === DurationMode.DAILY_RATE) {
      return calcIntercityDailyRatePrice(cat.dailyRate, rentalDays, cat.minimumDays || 1);
    }
    return isRoundTrip ? cat.roundTripPrice ?? 0 : cat.price;
  }, [durationMode, rentalDays, isRoundTrip]);

  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscountInfo | null>(null);

  const rawTotalPrice = useMemo(() => {
    if (serviceType === IntercityServiceType.SHARED) return sharedTotalPrice;
    if (!selectedCategory) return 0;
    return calculateCategoryPrice(selectedCategory);
  }, [serviceType, sharedTotalPrice, selectedCategory, calculateCategoryPrice]);

  const finalTotalPrice = useMemo(() => {
    return Math.max(0, rawTotalPrice - (appliedDiscount?.amount || 0));
  }, [rawTotalPrice, appliedDiscount]);

  const currentTotalPrice = finalTotalPrice;

  const depositCalc = useMemo(() => {
    // Deposit is only collected when the selected price actually carries a policy.
    // No silent default (e.g. 20%) — no config on the package means no deposit.
    if (serviceType === IntercityServiceType.SHARED) return null; // shared routes carry no deposit config

    const config = selectedCategory;
    if (!config?.depositType) return null;

    if (config.depositType === DepositType.FIXED) {
      const amount = Number(config.depositAmount ?? 0);
      if (amount <= 0) return null;
      return calculateDeposit({
        totalAmount: finalTotalPrice,
        depositType: DepositType.FIXED,
        depositAmount: amount,
      });
    }

    const rate = Number(config.depositRate ?? 0);
    if (rate <= 0) return null;
    return calculateDeposit({
      totalAmount: finalTotalPrice,
      depositType: DepositType.PERCENT,
      depositRate: rate,
      defaultRate: 0,
    });
  }, [serviceType, finalTotalPrice, selectedCategory]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!editName?.trim()) newErrors.name = t.errors.nameRequired;
    if (!editPhone?.trim()) newErrors.phone = t.errors.phoneRequired;
    if (!editEmail?.trim()) newErrors.email = t.errors.emailRequired;

    if (serviceType === IntercityServiceType.SHARED) {
      if (outboundPickupType === PickupType.OFFICE) {
        if (!outboundPickupOfficeId) newErrors.pickupAddress = t.rentCar.selectRouteError || "Vui lòng chọn văn phòng đón";
      } else {
        if (!editOutboundPickupAddress?.trim()) newErrors.pickupAddress = t.errors.pickupAddressRequired;
      }

      if (outboundDropoffType === PickupType.OFFICE) {
        if (!outboundDropoffOfficeId) newErrors.dropoffAddress = t.rentCar.selectRouteError || "Vui lòng chọn văn phòng trả";
      } else {
        if (!editOutboundDropoffAddress?.trim()) newErrors.dropoffAddress = t.errors.dropoffAddressRequired;
      }

      if (isSharedRoundTrip) {
        if (returnPickupType === PickupType.OFFICE) {
          if (!returnPickupOfficeId) newErrors.returnPickupAddress = t.rentCar.selectRouteError || "Vui lòng chọn văn phòng đón chiều về";
        } else {
          if (!editReturnPickupAddress?.trim()) newErrors.returnPickupAddress = t.errors.pickupAddressRequired;
        }

        if (returnDropoffType === PickupType.OFFICE) {
          if (!returnDropoffOfficeId) newErrors.returnDropoffAddress = t.rentCar.selectRouteError || "Vui lòng chọn văn phòng trả chiều về";
        } else {
          if (!editReturnDropoffAddress?.trim()) newErrors.returnDropoffAddress = t.errors.dropoffAddressRequired;
        }
      }
    } else {
      if (!editPickupAddress?.trim()) newErrors.pickupAddress = t.errors.pickupAddressRequired;

      if (durationMode === DurationMode.DAILY_RATE) {
        if (isDateRangeInvalid || !dateRange) newErrors.date = t.errors.dateRequired;
      } else {
        if (!dateValue || isDateInvalid) newErrors.date = t.errors.dateRequired;
        if (isRoundTrip && !editReturnTime) {
          newErrors.returnTime = t.errors.timeRequired || "Vui lòng chọn giờ về";
        }
      }
      if (!editTime) newErrors.time = t.errors.timeRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [
    editName,
    editPhone,
    editEmail,
    serviceType,
    outboundPickupType,
    outboundPickupOfficeId,
    editOutboundPickupAddress,
    outboundDropoffType,
    outboundDropoffOfficeId,
    editOutboundDropoffAddress,
    isSharedRoundTrip,
    returnPickupType,
    returnPickupOfficeId,
    editReturnPickupAddress,
    returnDropoffType,
    returnDropoffOfficeId,
    editReturnDropoffAddress,
    editPickupAddress,
    durationMode,
    isDateRangeInvalid,
    dateRange,
    dateValue,
    isDateInvalid,
    isRoundTrip,
    editTime,
    editReturnTime,
    t.errors,
    t.rentCar.selectRouteError,
  ]);

  // Pure mirror of validate() without setErrors — used to gate the submit button so
  // users cannot book before the required fields are filled.
  const canBook = useMemo(() => {
    if (!editName?.trim() || !editPhone?.trim() || !editEmail?.trim()) return false;

    if (serviceType === IntercityServiceType.SHARED) {
      const addressOk = (type: PickupType, officeId: number | null, address: string) =>
        type === PickupType.OFFICE ? Boolean(officeId) : Boolean(address?.trim());
      if (!addressOk(outboundPickupType, outboundPickupOfficeId, editOutboundPickupAddress)) return false;
      if (!addressOk(outboundDropoffType, outboundDropoffOfficeId, editOutboundDropoffAddress)) return false;
      if (isSharedRoundTrip) {
        if (!addressOk(returnPickupType, returnPickupOfficeId, editReturnPickupAddress)) return false;
        if (!addressOk(returnDropoffType, returnDropoffOfficeId, editReturnDropoffAddress)) return false;
      }
      return Boolean(sharedRoute && outboundDirection && outboundSchedule && finalTotalPrice > 0);
    }

    if (!editPickupAddress?.trim()) return false;
    if (durationMode === DurationMode.DAILY_RATE) {
      if (isDateRangeInvalid || !dateRange) return false;
    } else {
      if (!dateValue || isDateInvalid) return false;
      if (isRoundTrip && !editReturnTime) return false;
    }
    if (!editTime) return false;
    return Boolean(route && selectedCategory && finalTotalPrice > 0);
  }, [
    editName, editPhone, editEmail, serviceType,
    outboundPickupType, outboundPickupOfficeId, editOutboundPickupAddress,
    outboundDropoffType, outboundDropoffOfficeId, editOutboundDropoffAddress,
    isSharedRoundTrip, returnPickupType, returnPickupOfficeId, editReturnPickupAddress,
    returnDropoffType, returnDropoffOfficeId, editReturnDropoffAddress,
    editPickupAddress, durationMode, isDateRangeInvalid, dateRange,
    dateValue, isDateInvalid, isRoundTrip, editTime, editReturnTime,
    sharedRoute, outboundDirection, outboundSchedule, route, selectedCategory, finalTotalPrice,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (serviceType === IntercityServiceType.SHARED) {
      if (!sharedRoute || !outboundDirection || !outboundSchedule) return;
    } else {
      if (!route || !selectedCategory) return;
    }
    if (!validate()) return;
    setShowConfirmModal(true);
  };

  const handleConfirmBooking = async () => {
    if (submitting) return;
    if (serviceType === IntercityServiceType.SHARED) {
      if (!sharedRoute || !outboundDirection || !outboundSchedule) return;
      if (!validate()) {
        setShowConfirmModal(false);
        return;
      }
      setSubmitting(true);
      try {
        const res = await createSharedBooking({
          customerName: editName || "Guest",
          customerPhone: editPhone || "",
          customerEmail: editEmail || `${editPhone || "guest"}@traveler.com`,
          note: editNotes.trim() || undefined,
          directionId: outboundDirection.id!,
          scheduleId: outboundSchedule.id!,
          tripDate: outboundTripDate,
          pickupType: outboundPickupType,
          pickupOfficeId: outboundPickupType === PickupType.OFFICE ? (outboundPickupOfficeId || undefined) : undefined,
          pickupAddress: outboundPickupType === PickupType.DOOR ? (editOutboundPickupAddress.trim() || undefined) : undefined,
          dropoffType: outboundDropoffType,
          dropoffOfficeId: outboundDropoffType === PickupType.OFFICE ? (outboundDropoffOfficeId || undefined) : undefined,
          dropoffAddress: outboundDropoffType === PickupType.DOOR ? (editOutboundDropoffAddress.trim() || undefined) : undefined,
          passengerCount: pax,

          isRoundTrip: isSharedRoundTrip,
          returnDirectionId: isSharedRoundTrip && returnDirection ? returnDirection.id : undefined,
          returnScheduleId: isSharedRoundTrip && returnSchedule ? returnSchedule.id : undefined,
          returnTripDate: isSharedRoundTrip ? returnTripDate : undefined,
          returnPickupType: isSharedRoundTrip ? returnPickupType : undefined,
          returnPickupOfficeId: isSharedRoundTrip && returnPickupType === PickupType.OFFICE ? (returnPickupOfficeId || undefined) : undefined,
          returnPickupAddress: isSharedRoundTrip && returnPickupType === PickupType.DOOR ? (editReturnPickupAddress.trim() || undefined) : undefined,
          returnDropoffType: isSharedRoundTrip ? returnDropoffType : undefined,
          returnDropoffOfficeId: isSharedRoundTrip && returnDropoffType === PickupType.OFFICE ? (returnDropoffOfficeId || undefined) : undefined,
          returnDropoffAddress: isSharedRoundTrip && returnDropoffType === PickupType.DOOR ? (editReturnDropoffAddress.trim() || undefined) : undefined,
        });

        const code = res?.bookingGroupId
          ? `SH-${res.bookingGroupId}`
          : (res?.bookings?.[0]?.id ? `SH-${res.bookings[0].id}` : "SH-CONFIRMED");
        setCreatedCode(code);
        setBookingSuccess(true);
      } catch (err) {
        console.error("Shared booking API error:", err);
        setErrorMessage(err instanceof Error ? err.message : t.errors.bookingFailed);
      } finally {
        setSubmitting(false);
        setShowConfirmModal(false);
      }
      return;
    }

    if (!route || !selectedCategory) return;
    if (!validate()) {
      setShowConfirmModal(false);
      return;
    }

    setSubmitting(true);

    const departureDateStr = durationMode === DurationMode.DAILY_RATE && dateRange?.start
      ? formatToIsoDate(dateRange.start)
      : (dateValue ? `${dateValue.year}-${String(dateValue.month).padStart(2, "0")}-${String(dateValue.day).padStart(2, "0")}` : "");

    const returnDateStr = durationMode === DurationMode.DAILY_RATE && dateRange?.end
      ? formatToIsoDate(dateRange.end)
      : (isRoundTrip && returnDateValue ? `${returnDateValue.year}-${String(returnDateValue.month).padStart(2, "0")}-${String(returnDateValue.day).padStart(2, "0")}` : undefined);

    const finalTripType = durationMode === DurationMode.DAILY_RATE ? DurationMode.DAILY_RATE : tripType;

    try {
      const res = await createRentCarBooking({
        customerName: editName || "Guest",
        customerEmail: editEmail || `${editPhone || "guest"}@traveler.com`,
        customerPhone: editPhone || "",
        customerNotes: editNotes.trim() || undefined,
        zaloId: editZaloId.trim() || undefined,
        kakaoTalkId: editKakaoTalkId.trim() || undefined,
        routeId: route.id,
        serviceType: IntercityServiceType.PRIVATE,
        vehicleCategoryId: selectedCategory?.category.id,
        tripType: finalTripType,
        departureDate: departureDateStr,
        departureTime: editTime,
        returnDate: returnDateStr,
        returnTime: isRoundTrip ? editReturnTime : undefined,
        pickupAddress: editPickupAddress,
        dropoffAddress: route?.destinationCity || "",
        basePrice: rawTotalPrice,
        totalPrice: finalTotalPrice,
        depositType: depositCalc?.depositType as any,
        depositRate: depositCalc?.depositRate,
        depositAmount: depositCalc?.depositAmount,
        discountCode: appliedDiscount?.code,
        discountAmount: appliedDiscount?.amount,
      });

      if (res?.data?.bookingCode) {
        setCreatedCode(res.data.bookingCode);
        setBookingSuccess(true);
      } else {
        setErrorMessage(t.errors.bookingFailed);
      }
    } catch (err) {
      console.error("Booking API error:", err);
      setErrorMessage(err instanceof Error ? err.message : t.errors.bookingFailed);
    } finally {
      setSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="w-48 h-8 rounded-lg" />
          <Skeleton className="w-64 h-4 rounded-lg" />
        </div>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <SuccessOverlay
        bookingCode={createdCode}
        onComplete={() => {
          router.push(`/${language}/intercity/success?bookingCode=${createdCode}`);
        }}
        title={t.rentCar.confirmSuccessTitle}
        subtitle={t.rentCar.redirecting}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* 1. Header Banner */}
      <section className="relative w-full h-[180px] sm:h-[220px] bg-slate-900 overflow-hidden flex items-end">
        {route?.thumbnailUrl ? (
          <img
            src={route.thumbnailUrl.startsWith("http") ? route.thumbnailUrl : `${backendUrl}${route.thumbnailUrl}`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="absolute inset-0 bg-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent" />

        <div className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 pb-6 relative z-10 flex items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md px-3.5 py-1.5 rounded-full text-sm font-bold text-white transition-colors cursor-pointer mb-2"
            >
              <ArrowLeft size={16} />
              <span>{t.common.goBack}</span>
            </button>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              {serviceType === IntercityServiceType.SHARED
                ? (sharedRoute?.name || "Tuyến xe ghép")
                : (route ? `${route.originCity} ⇌ ${route.destinationCity}` : "--- ⇌ ---")}
            </h1>
            <p className="text-sm text-white/80 font-semibold mt-1 flex items-center gap-2">
              <span>{serviceType === IntercityServiceType.SHARED ? t.rentCar.sharedService : t.rentCar.privateService}</span>
              {serviceType === IntercityServiceType.SHARED ? (
                <>
                  <span>•</span>
                  <span>{sharedRoute?.vehicleName || "Limousine VIP"}</span>
                  <span>•</span>
                  <span className="text-accent font-extrabold">{pax} {t.common.seats} ({isSharedRoundTrip ? t.rentCar.roundTrip : t.rentCar.oneWay})</span>
                </>
              ) : (
                <>
                  {route?.distanceKm && (
                    <>
                      <span>•</span>
                      <span>{route.distanceKm} km</span>
                    </>
                  )}
                  {durationMode === DurationMode.DAILY_RATE && (
                    <>
                      <span>•</span>
                      <span className="text-accent font-extrabold">{t.rentCar.dailyRate} ({rentalDays} {t.rentCar.dayUnit})</span>
                    </>
                  )}
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* 2. Main 2-Column Content */}
      <main className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 mt-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Controls (col-span-8) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Card 1: Contact Information */}
            <div className="bg-white dark:bg-[var(--bg-surface)] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-accent" />
                  <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    {t.rentCar.contactInfo}
                  </h2>
                </div>
                <AutofillButton
                  onFill={(data) => {
                    if (data.fullname) setEditName(data.fullname);
                    if (data.phone) setEditPhone(data.phone);
                    if (data.email) setEditEmail(data.email);
                    if (data.zaloId) setEditZaloId(data.zaloId);
                    if (data.kakaoTalkId) setEditKakaoTalkId(data.kakaoTalkId);
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField isRequired isInvalid={Boolean(errors.name)} className="w-full">
                  <Label isRequired className="text-sm font-bold uppercase tracking-wider pl-1">
                    {t.rentCar.fullName}
                  </Label>
                  <Input
                    type="text"
                    placeholder={t.common.name}
                    value={editName}
                    onChange={(e) => {
                      setEditName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    className="text-sm font-semibold bg-slate-50 dark:bg-[var(--bg-card)]"
                  />
                  {errors.name && <FieldError className="text-sm text-red-500 mt-1 pl-1 font-medium">{errors.name}</FieldError>}
                </TextField>

                <TextField isRequired isInvalid={Boolean(errors.phone)} className="w-full">
                  <Label isRequired className="text-sm font-bold uppercase tracking-wider pl-1">
                    {t.rentCar.phone}
                  </Label>
                  <Input
                    type="tel"
                    placeholder="0901 234 567"
                    value={editPhone}
                    onChange={(e) => {
                      setEditPhone(e.target.value);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
                    }}
                    className="text-sm font-semibold bg-slate-50 dark:bg-[var(--bg-card)]"
                  />
                  {errors.phone && <FieldError className="text-sm text-red-500 mt-1 pl-1 font-medium">{errors.phone}</FieldError>}
                </TextField>

                <TextField isRequired isInvalid={Boolean(errors.email)} className="w-full">
                  <Label isRequired className="text-sm font-bold uppercase tracking-wider pl-1">
                    Email
                  </Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={editEmail}
                    onChange={(e) => {
                      setEditEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    className="text-sm font-semibold bg-slate-50 dark:bg-[var(--bg-card)]"
                  />
                  {errors.email && <FieldError className="text-sm text-red-500 mt-1 pl-1 font-medium">{errors.email}</FieldError>}
                </TextField>

                <div className="grid grid-cols-2 gap-2">
                  <TextField className="w-full">
                    <Label className="text-sm font-bold uppercase tracking-wider pl-1">
                      Zalo ID
                    </Label>
                    <Input
                      type="text"
                      placeholder="Zalo (tùy chọn)"
                      value={editZaloId}
                      onChange={(e) => setEditZaloId(e.target.value)}
                      className="text-sm font-semibold bg-slate-50 dark:bg-[var(--bg-card)]"
                    />
                  </TextField>
                  <TextField className="w-full">
                    <Label className="text-sm font-bold uppercase tracking-wider pl-1">
                      KakaoTalk ID
                    </Label>
                    <Input
                      type="text"
                      placeholder="Kakao (tùy chọn)"
                      value={editKakaoTalkId}
                      onChange={(e) => setEditKakaoTalkId(e.target.value)}
                      className="text-sm font-semibold bg-slate-50 dark:bg-[var(--bg-card)]"
                    />
                  </TextField>
                </div>
              </div>
            </div>

            {/* If SHARED: Card 2 - Shared Route Trip Details */}
            {serviceType === IntercityServiceType.SHARED ? (
              <div className="bg-white dark:bg-[var(--bg-surface)] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Bus size={18} className="text-accent" />
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      {t.rentCar.tripDetails}
                    </h2>
                  </div>
                  <Chip size="sm" color="accent" variant="soft" className="text-sm font-bold px-3 py-1">
                    {pax} {t.common.seats} • {isSharedRoundTrip ? t.rentCar.roundTrip : t.rentCar.oneWay}
                  </Chip>
                </div>

                {/* Outbound Leg */}
                <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[var(--bg-card)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-black">
                        1
                      </span>
                      <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                        {t.rentCar.outboundTrip}: {outboundDirection?.originCity} ➔ {outboundDirection?.destinationCity}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-accent">
                      {outboundTripDate} {outboundSchedule?.departureTime ? `(${outboundSchedule.departureTime.slice(0, 5)})` : ""}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {/* Outbound Pickup */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-[var(--bg-surface)] border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-sm">
                          {outboundPickupType === PickupType.OFFICE ? <Building2 size={14} className="text-accent" /> : <MapPin size={14} className="text-accent" />}
                          <span>{t.rentCar.pickupPoint}</span>
                        </div>
                        {availableOriginOffices.length > 0 && (
                          <div className="flex bg-slate-100 dark:bg-[var(--bg-card)] p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                            <button
                              type="button"
                              onClick={() => setOutboundPickupType(PickupType.OFFICE)}
                              className={`px-2.5 py-1 text-sm font-bold rounded-lg transition-all cursor-pointer border-none ${
                                outboundPickupType === PickupType.OFFICE
                                  ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                              }`}
                            >
                              {t.rentCar.officePickup}
                            </button>
                            <button
                              type="button"
                              onClick={() => setOutboundPickupType(PickupType.DOOR)}
                              className={`px-2.5 py-1 text-sm font-bold rounded-lg transition-all cursor-pointer border-none ${
                                outboundPickupType === PickupType.DOOR
                                  ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                              }`}
                            >
                              {t.rentCar.doorPickup}
                            </button>
                          </div>
                        )}
                      </div>

                      {outboundPickupType === PickupType.OFFICE && availableOriginOffices.length > 0 ? (
                        <div className="space-y-1">
                          <Select
                            selectedKey={outboundPickupOfficeId ? String(outboundPickupOfficeId) : undefined}
                            onSelectionChange={(key) => {
                              if (key) {
                                setOutboundPickupOfficeId(Number(key));
                                if (errors.pickupAddress) setErrors((prev) => ({ ...prev, pickupAddress: "" }));
                              }
                            }}
                            className="w-full"
                          >
                            <Label className="sr-only">{t.rentCar.officePickup}</Label>
                            <Select.Trigger className="w-full h-11 px-3 text-sm font-semibold bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer flex items-center justify-between">
                              <Select.Value className="text-sm font-bold text-left truncate text-slate-800 dark:text-slate-100">
                                {getOfficeText(outboundPickupOfficeId) || t.rentCar.officePickup}
                              </Select.Value>
                              <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-50 max-h-60 overflow-y-auto w-[var(--trigger-width)]">
                              <ListBox>
                                {availableOriginOffices.map((off) => (
                                  <ListBox.Item
                                    key={off.id}
                                    id={String(off.id)}
                                    textValue={`${off.name} - ${off.address}`}
                                    className="px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)]"
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-bold text-slate-900 dark:text-white">{off.name}</span>
                                      <span className="text-sm text-slate-400 font-medium">{off.address}, {off.city}</span>
                                    </div>
                                    <ListBox.ItemIndicator />
                                  </ListBox.Item>
                                ))}
                              </ListBox>
                            </Select.Popover>
                          </Select>
                          {errors.pickupAddress && <p className="text-sm text-red-500 font-medium">{errors.pickupAddress}</p>}
                        </div>
                      ) : (
                        <TextField isRequired isInvalid={Boolean(errors.pickupAddress)} className="w-full">
                          <Input
                            type="text"
                            placeholder={t.rentCar.pickupAddressPlaceholder}
                            value={editOutboundPickupAddress}
                            onChange={(e) => {
                              setEditOutboundPickupAddress(e.target.value);
                              if (errors.pickupAddress) setErrors((prev) => ({ ...prev, pickupAddress: "" }));
                            }}
                            className="text-sm font-semibold bg-slate-50 dark:bg-[var(--bg-card)]"
                          />
                          {errors.pickupAddress && <FieldError className="text-sm text-red-500 mt-1 font-medium">{errors.pickupAddress}</FieldError>}
                        </TextField>
                      )}
                    </div>

                    {/* Outbound Dropoff */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-[var(--bg-surface)] border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-sm">
                          {outboundDropoffType === PickupType.OFFICE ? <Building2 size={14} className="text-accent" /> : <MapPin size={14} className="text-accent" />}
                          <span>{t.rentCar.dropoffPoint}</span>
                        </div>
                        {availableDestinationOffices.length > 0 && (
                          <div className="flex bg-slate-100 dark:bg-[var(--bg-card)] p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                            <button
                              type="button"
                              onClick={() => setOutboundDropoffType(PickupType.OFFICE)}
                              className={`px-2.5 py-1 text-sm font-bold rounded-lg transition-all cursor-pointer border-none ${
                                outboundDropoffType === PickupType.OFFICE
                                  ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                              }`}
                            >
                              {t.rentCar.officePickup}
                            </button>
                            <button
                              type="button"
                              onClick={() => setOutboundDropoffType(PickupType.DOOR)}
                              className={`px-2.5 py-1 text-sm font-bold rounded-lg transition-all cursor-pointer border-none ${
                                outboundDropoffType === PickupType.DOOR
                                  ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                              }`}
                            >
                              {t.rentCar.doorPickup}
                            </button>
                          </div>
                        )}
                      </div>

                      {outboundDropoffType === PickupType.OFFICE && availableDestinationOffices.length > 0 ? (
                        <div className="space-y-1">
                          <Select
                            selectedKey={outboundDropoffOfficeId ? String(outboundDropoffOfficeId) : undefined}
                            onSelectionChange={(key) => {
                              if (key) {
                                setOutboundDropoffOfficeId(Number(key));
                                if (errors.dropoffAddress) setErrors((prev) => ({ ...prev, dropoffAddress: "" }));
                              }
                            }}
                            className="w-full"
                          >
                            <Label className="sr-only">{t.rentCar.officePickup}</Label>
                            <Select.Trigger className="w-full h-11 px-3 text-sm font-semibold bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer flex items-center justify-between">
                              <Select.Value className="text-sm font-bold text-left truncate text-slate-800 dark:text-slate-100">
                                {getOfficeText(outboundDropoffOfficeId) || t.rentCar.officePickup}
                              </Select.Value>
                              <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-50 max-h-60 overflow-y-auto w-[var(--trigger-width)]">
                              <ListBox>
                                {availableDestinationOffices.map((off) => (
                                  <ListBox.Item
                                    key={off.id}
                                    id={String(off.id)}
                                    textValue={`${off.name} - ${off.address}`}
                                    className="px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)]"
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-bold text-slate-900 dark:text-white">{off.name}</span>
                                      <span className="text-sm text-slate-400 font-medium">{off.address}, {off.city}</span>
                                    </div>
                                    <ListBox.ItemIndicator />
                                  </ListBox.Item>
                                ))}
                              </ListBox>
                            </Select.Popover>
                          </Select>
                          {errors.dropoffAddress && <p className="text-sm text-red-500 font-medium">{errors.dropoffAddress}</p>}
                        </div>
                      ) : (
                        <TextField isRequired isInvalid={Boolean(errors.dropoffAddress)} className="w-full">
                          <Input
                            type="text"
                            placeholder={t.rentCar.dropoffAddressPlaceholder}
                            value={editOutboundDropoffAddress}
                            onChange={(e) => {
                              setEditOutboundDropoffAddress(e.target.value);
                              if (errors.dropoffAddress) setErrors((prev) => ({ ...prev, dropoffAddress: "" }));
                            }}
                            className="text-sm font-semibold bg-slate-50 dark:bg-[var(--bg-card)]"
                          />
                          {errors.dropoffAddress && <FieldError className="text-sm text-red-500 mt-1 font-medium">{errors.dropoffAddress}</FieldError>}
                        </TextField>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/50 dark:border-slate-800 text-sm font-semibold">
                    <span className="text-slate-400">
                      {pax} vé × {formatPrice(outboundDirection?.price || 0)}
                    </span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {formatPrice((outboundDirection?.price || 0) * pax)}
                    </span>
                  </div>
                </div>

                {/* Return Leg (if return trip) */}
                {isSharedRoundTrip && returnDirection && (
                  <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[var(--bg-card)] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-black">
                          2
                        </span>
                        <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                          {t.rentCar.returnTrip}: {returnDirection.originCity} ➔ {returnDirection.destinationCity}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-accent">
                        {returnTripDate} {returnSchedule?.departureTime ? `(${returnSchedule.departureTime.slice(0, 5)})` : ""}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {/* Return Pickup */}
                      <div className="p-3.5 rounded-xl bg-white dark:bg-[var(--bg-surface)] border border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-sm">
                            {returnPickupType === PickupType.OFFICE ? <Building2 size={14} className="text-accent" /> : <MapPin size={14} className="text-accent" />}
                            <span>{t.rentCar.pickupPoint}</span>
                          </div>
                          {availableReturnOriginOffices.length > 0 && (
                            <div className="flex bg-slate-100 dark:bg-[var(--bg-card)] p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                              <button
                                type="button"
                                onClick={() => setReturnPickupType(PickupType.OFFICE)}
                                className={`px-2.5 py-1 text-sm font-bold rounded-lg transition-all cursor-pointer border-none ${
                                  returnPickupType === PickupType.OFFICE
                                    ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                                }`}
                              >
                                {t.rentCar.officePickup}
                              </button>
                              <button
                                type="button"
                                onClick={() => setReturnPickupType(PickupType.DOOR)}
                                className={`px-2.5 py-1 text-sm font-bold rounded-lg transition-all cursor-pointer border-none ${
                                  returnPickupType === PickupType.DOOR
                                    ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                                }`}
                              >
                                {t.rentCar.doorPickup}
                              </button>
                            </div>
                          )}
                        </div>

                        {returnPickupType === PickupType.OFFICE && availableReturnOriginOffices.length > 0 ? (
                          <div className="space-y-1">
                            <Select
                              selectedKey={returnPickupOfficeId ? String(returnPickupOfficeId) : undefined}
                              onSelectionChange={(key) => {
                                if (key) {
                                  setReturnPickupOfficeId(Number(key));
                                  if (errors.returnPickupAddress) setErrors((prev) => ({ ...prev, returnPickupAddress: "" }));
                                }
                              }}
                              className="w-full"
                            >
                              <Label className="sr-only">{t.rentCar.officePickup}</Label>
                              <Select.Trigger className="w-full h-11 px-3 text-sm font-semibold bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer flex items-center justify-between">
                                <Select.Value className="text-sm font-bold text-left truncate text-slate-800 dark:text-slate-100">
                                  {getOfficeText(returnPickupOfficeId) || t.rentCar.officePickup}
                                </Select.Value>
                                <Select.Indicator />
                              </Select.Trigger>
                              <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-50 max-h-60 overflow-y-auto w-[var(--trigger-width)]">
                                <ListBox>
                                  {availableReturnOriginOffices.map((off) => (
                                    <ListBox.Item
                                      key={off.id}
                                      id={String(off.id)}
                                      textValue={`${off.name} - ${off.address}`}
                                      className="px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)]"
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 dark:text-white">{off.name}</span>
                                        <span className="text-sm text-slate-400 font-medium">{off.address}, {off.city}</span>
                                      </div>
                                      <ListBox.ItemIndicator />
                                    </ListBox.Item>
                                  ))}
                                </ListBox>
                              </Select.Popover>
                            </Select>
                            {errors.returnPickupAddress && <p className="text-sm text-red-500 font-medium">{errors.returnPickupAddress}</p>}
                          </div>
                        ) : (
                          <TextField isRequired isInvalid={Boolean(errors.returnPickupAddress)} className="w-full">
                            <Input
                              type="text"
                              placeholder={t.rentCar.pickupAddressPlaceholder}
                              value={editReturnPickupAddress}
                              onChange={(e) => {
                                setEditReturnPickupAddress(e.target.value);
                                if (errors.returnPickupAddress) setErrors((prev) => ({ ...prev, returnPickupAddress: "" }));
                              }}
                              className="text-sm font-semibold bg-slate-50 dark:bg-[var(--bg-card)]"
                            />
                            {errors.returnPickupAddress && <FieldError className="text-sm text-red-500 mt-1 font-medium">{errors.returnPickupAddress}</FieldError>}
                          </TextField>
                        )}
                      </div>

                      {/* Return Dropoff */}
                      <div className="p-3.5 rounded-xl bg-white dark:bg-[var(--bg-surface)] border border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-sm">
                            {returnDropoffType === PickupType.OFFICE ? <Building2 size={14} className="text-accent" /> : <MapPin size={14} className="text-accent" />}
                            <span>{t.rentCar.dropoffPoint}</span>
                          </div>
                          {availableReturnDestinationOffices.length > 0 && (
                            <div className="flex bg-slate-100 dark:bg-[var(--bg-card)] p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                              <button
                                type="button"
                                onClick={() => setReturnDropoffType(PickupType.OFFICE)}
                                className={`px-2.5 py-1 text-sm font-bold rounded-lg transition-all cursor-pointer border-none ${
                                  returnDropoffType === PickupType.OFFICE
                                    ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                                }`}
                              >
                                {t.rentCar.officePickup}
                              </button>
                              <button
                                type="button"
                                onClick={() => setReturnDropoffType(PickupType.DOOR)}
                                className={`px-2.5 py-1 text-sm font-bold rounded-lg transition-all cursor-pointer border-none ${
                                  returnDropoffType === PickupType.DOOR
                                    ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                                }`}
                              >
                                {t.rentCar.doorPickup}
                              </button>
                            </div>
                          )}
                        </div>

                        {returnDropoffType === PickupType.OFFICE && availableReturnDestinationOffices.length > 0 ? (
                          <div className="space-y-1">
                            <Select
                              selectedKey={returnDropoffOfficeId ? String(returnDropoffOfficeId) : undefined}
                              onSelectionChange={(key) => {
                                if (key) {
                                  setReturnDropoffOfficeId(Number(key));
                                  if (errors.returnDropoffAddress) setErrors((prev) => ({ ...prev, returnDropoffAddress: "" }));
                                }
                              }}
                              className="w-full"
                            >
                              <Label className="sr-only">{t.rentCar.officePickup}</Label>
                              <Select.Trigger className="w-full h-11 px-3 text-sm font-semibold bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer flex items-center justify-between">
                                <Select.Value className="text-sm font-bold text-left truncate text-slate-800 dark:text-slate-100">
                                  {getOfficeText(returnDropoffOfficeId) || t.rentCar.officePickup}
                                </Select.Value>
                                <Select.Indicator />
                              </Select.Trigger>
                              <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-50 max-h-60 overflow-y-auto w-[var(--trigger-width)]">
                                <ListBox>
                                  {availableReturnDestinationOffices.map((off) => (
                                    <ListBox.Item
                                      key={off.id}
                                      id={String(off.id)}
                                      textValue={`${off.name} - ${off.address}`}
                                      className="px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)]"
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 dark:text-white">{off.name}</span>
                                        <span className="text-sm text-slate-400 font-medium">{off.address}, {off.city}</span>
                                      </div>
                                      <ListBox.ItemIndicator />
                                    </ListBox.Item>
                                  ))}
                                </ListBox>
                              </Select.Popover>
                            </Select>
                            {errors.returnDropoffAddress && <p className="text-sm text-red-500 font-medium">{errors.returnDropoffAddress}</p>}
                          </div>
                        ) : (
                          <TextField isRequired isInvalid={Boolean(errors.returnDropoffAddress)} className="w-full">
                            <Input
                              type="text"
                              placeholder={t.rentCar.dropoffAddressPlaceholder}
                              value={editReturnDropoffAddress}
                              onChange={(e) => {
                                setEditReturnDropoffAddress(e.target.value);
                                if (errors.returnDropoffAddress) setErrors((prev) => ({ ...prev, returnDropoffAddress: "" }));
                              }}
                              className="text-sm font-semibold bg-slate-50 dark:bg-[var(--bg-card)]"
                            />
                            {errors.returnDropoffAddress && <FieldError className="text-sm text-red-500 mt-1 font-medium">{errors.returnDropoffAddress}</FieldError>}
                          </TextField>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/50 dark:border-slate-800 text-sm font-semibold">
                      <span className="text-slate-400">
                        {pax} vé × {formatPrice(returnDirection.price || 0)}
                      </span>
                      <span className="font-black text-slate-900 dark:text-white">
                        {formatPrice((returnDirection.price || 0) * pax)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Card 2: Schedule & Rental Mode */}
                <div className="bg-white dark:bg-[var(--bg-surface)] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-accent" />
                      <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        {t.rentCar.rentalPeriod}
                      </h2>
                    </div>
                    {durationMode === DurationMode.DAILY_RATE && (
                      <Chip size="sm" color="accent" variant="soft" className="text-sm font-bold px-3 py-1">
                        {rentalDays} {t.rentCar.dayUnit}
                      </Chip>
                    )}
                  </div>

                  {/* Trip Mode Switcher */}
                  <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-[var(--bg-card)] rounded-2xl border border-slate-200/60 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setDurationMode(DurationMode.IN_DAY);
                        setTripType(IntercityTripType.ONE_WAY);
                      }}
                      className={`flex-1 py-2 text-sm font-black rounded-xl transition-all cursor-pointer border-none text-center ${
                        durationMode === DurationMode.IN_DAY && tripType === IntercityTripType.ONE_WAY
                          ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-white bg-transparent"
                      }`}
                    >
                      {t.rentCar.oneWay}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDurationMode(DurationMode.IN_DAY);
                        setTripType(IntercityTripType.ROUND_TRIP);
                      }}
                      className={`flex-1 py-2 text-sm font-black rounded-xl transition-all cursor-pointer border-none text-center ${
                        durationMode === DurationMode.IN_DAY && tripType === IntercityTripType.ROUND_TRIP
                          ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-white bg-transparent"
                      }`}
                    >
                      {t.rentCar.roundTrip}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDurationMode(DurationMode.DAILY_RATE);
                      }}
                      className={`flex-1 py-2 text-sm font-black rounded-xl transition-all cursor-pointer border-none text-center ${
                        durationMode === DurationMode.DAILY_RATE
                          ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-white bg-transparent"
                      }`}
                    >
                      {t.rentCar.dailyRate}
                    </button>
                  </div>

                  {/* Date & Time selection */}
                  {durationMode === DurationMode.DAILY_RATE ? (
                    <div className="space-y-4">
                      <RentalDateRangePicker
                        value={dateRange}
                        onChange={setDateRange}
                        minimumDays={1}
                        isInvalid={isDateRangeInvalid}
                        errorMessage={errors.date}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <TimePicker
                          value={editTimeValue}
                          onChange={(v) => {
                            setEditTimeValue(v);
                            setEditTime(timeValueToString(v));
                          }}
                          label={t.rentCar.customDepartureTime}
                          labelClassName="text-sm font-bold uppercase tracking-wider text-foreground/60 block"
                          popoverTitle="Chọn giờ xuất phát"
                          language={language}
                          triggerClassName="bg-white dark:bg-[var(--bg-surface)]"
                          isRequired
                        />
                      </div>
                    </div>
                  ) : isRoundTrip ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-sm font-bold uppercase tracking-wider">
                            {t.rentCar.startDate || "Ngày đi"}
                          </Label>
                          <DatePicker
                            className="w-full"
                            value={dateValue}
                            minValue={currentDate}
                            onChange={(val) => {
                              setDateValue(val as DateValue);
                              if (!returnDateValue || (val && returnDateValue.compare(val as DateValue) < 0)) {
                                setReturnDateValue(val as DateValue);
                              }
                            }}
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
                            <DatePicker.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-border rounded-2xl p-4 shadow-xl z-50">
                              <Calendar aria-label="Pick departure date">
                                <Calendar.Header className="flex items-center justify-between mb-2">
                                  <Calendar.YearPickerTrigger className="text-sm font-bold flex items-center gap-1 cursor-pointer">
                                    <Calendar.YearPickerTriggerHeading />
                                    <Calendar.YearPickerTriggerIndicator />
                                  </Calendar.YearPickerTrigger>
                                  <div className="flex gap-1">
                                    <Calendar.NavButton slot="previous" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer" />
                                    <Calendar.NavButton slot="next" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer" />
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
                          {isDateInvalid && <p className="text-sm text-red-500 font-medium">{errors.date}</p>}
                        </div>

                        <div className="space-y-1">
                          <Label className="text-sm font-bold uppercase tracking-wider">
                            {t.rentCar.endDate || "Ngày về"}
                          </Label>
                          <DatePicker
                            className="w-full"
                            value={returnDateValue || dateValue}
                            minValue={dateValue || currentDate}
                            onChange={(val) => setReturnDateValue(val as DateValue)}
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
                            <DatePicker.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-border rounded-2xl p-4 shadow-xl z-50">
                              <Calendar aria-label="Pick return date">
                                <Calendar.Header className="flex items-center justify-between mb-2">
                                  <Calendar.YearPickerTrigger className="text-sm font-bold flex items-center gap-1 cursor-pointer">
                                    <Calendar.YearPickerTriggerHeading />
                                    <Calendar.YearPickerTriggerIndicator />
                                  </Calendar.YearPickerTrigger>
                                  <div className="flex gap-1">
                                    <Calendar.NavButton slot="previous" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer" />
                                    <Calendar.NavButton slot="next" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer" />
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
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <TimePicker
                          value={editTimeValue}
                          onChange={(v) => {
                            setEditTimeValue(v);
                            setEditTime(timeValueToString(v));
                          }}
                          label="Giờ đi"
                          labelClassName="text-sm font-bold uppercase tracking-wider text-foreground/60 block"
                          popoverTitle="Chọn giờ xuất phát chiều đi"
                          language={language}
                          triggerClassName="bg-white dark:bg-[var(--bg-surface)]"
                          isRequired
                        />
                        <div className="space-y-1">
                          <TimePicker
                            value={editReturnTimeValue}
                            onChange={(v) => {
                              setEditReturnTimeValue(v);
                              setEditReturnTime(timeValueToString(v));
                              if (errors.returnTime) setErrors((prev) => ({ ...prev, returnTime: "" }));
                            }}
                            label="Giờ về"
                            labelClassName="text-sm font-bold uppercase tracking-wider text-foreground/60 block"
                            popoverTitle="Chọn giờ xuất phát chiều về"
                            language={language}
                            triggerClassName="bg-white dark:bg-[var(--bg-surface)]"
                            isRequired
                          />
                          {errors.returnTime && (
                            <p className="text-sm text-red-500 font-medium">{errors.returnTime}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-sm font-bold uppercase tracking-wider">
                          {t.rentCar.date}
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
                          <DatePicker.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-border rounded-2xl p-4 shadow-xl z-50">
                            <Calendar aria-label="Pick date">
                              <Calendar.Header className="flex items-center justify-between mb-2">
                                <Calendar.YearPickerTrigger className="text-sm font-bold flex items-center gap-1 cursor-pointer">
                                  <Calendar.YearPickerTriggerHeading />
                                  <Calendar.YearPickerTriggerIndicator />
                                </Calendar.YearPickerTrigger>
                                <div className="flex gap-1">
                                  <Calendar.NavButton slot="previous" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer" />
                                  <Calendar.NavButton slot="next" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer" />
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
                        {isDateInvalid && <p className="text-sm text-red-500 font-medium">{errors.date}</p>}
                      </div>

                      <TimePicker
                        value={editTimeValue}
                        onChange={(v) => {
                          setEditTimeValue(v);
                          setEditTime(timeValueToString(v));
                        }}
                        label={t.rentCar.time}
                        labelClassName="text-sm font-bold uppercase tracking-wider text-foreground/60 block"
                        popoverTitle="Chọn giờ xuất phát"
                        language={language}
                        triggerClassName="bg-white dark:bg-[var(--bg-surface)]"
                        isRequired
                      />
                    </div>
                  )}
                </div>

                {/* Card 3: Pickup Address */}
                <div className="bg-white dark:bg-[var(--bg-surface)] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <MapPin size={18} className="text-accent" />
                    <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      {t.rentCar.pickupAddress}
                    </h2>
                  </div>

                  <div>
                    <TextField isRequired isInvalid={Boolean(errors.pickupAddress)} className="w-full">
                      <Label isRequired className="text-sm font-bold uppercase tracking-wider pl-1">
                        {t.rentCar.pickupAddress}
                      </Label>
                      <Input
                        type="text"
                        placeholder={t.rentCar.pickupAddressPlaceholder}
                        value={editPickupAddress}
                        onChange={(e) => {
                          setEditPickupAddress(e.target.value);
                          if (errors.pickupAddress) setErrors((prev) => ({ ...prev, pickupAddress: "" }));
                        }}
                        className="text-sm font-semibold bg-slate-50 dark:bg-[var(--bg-card)]"
                      />
                      {errors.pickupAddress && <FieldError className="text-sm text-red-500 mt-1 pl-1 font-medium">{errors.pickupAddress}</FieldError>}
                    </TextField>
                  </div>
                </div>

                {/* Card 4: Vehicle Category Selection (Private only) */}
                {allCategories.length > 0 && (
                  <div className="bg-white dark:bg-[var(--bg-surface)] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Car size={18} className="text-accent" />
                        <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                          {t.rentCar.vehicleType}
                        </h2>
                      </div>
                      <span className="text-sm text-slate-400 font-semibold">
                        {allCategories.length} {t.rentCar.representativeVehicles}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {allCategories.map((c) => {
                        const isSelected = selectedCategoryId === c.category.id;
                        const catPrice = calculateCategoryPrice(c);
                        const tr = c.category.translations?.find((t) => t.locale === language);
                        const name = tr?.name || c.category.code;

                        return (
                          <div
                            key={c.category.id}
                            onClick={() => setSelectedCategoryId(c.category.id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${isSelected
                              ? "border-accent bg-accent/5 ring-2 ring-accent/10 shadow-xs"
                              : "border-border hover:border-accent/40 bg-white dark:bg-[var(--bg-card)]"
                              }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                                  <Car size={18} />
                                </div>
                                <div>
                                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase leading-tight">
                                    {name}
                                  </h3>
                                  <span className="text-sm text-slate-400 font-semibold">
                                    {c.category.minSeat === c.category.maxSeat
                                      ? `${c.category.minSeat} ${t.common.seats}`
                                      : `${c.category.minSeat}-${c.category.maxSeat} ${t.common.seats}`}
                                  </span>
                                </div>
                              </div>
                              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-accent bg-accent text-accent-foreground" : "border-slate-300"}`}>
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-accent-foreground" />}
                              </span>
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex items-baseline justify-between">
                              <span className="text-sm text-slate-400 font-bold uppercase">
                                {durationMode === DurationMode.DAILY_RATE ? `${rentalDays} ${t.rentCar.dayUnit}` : (isRoundTrip ? t.rentCar.roundTrip : t.rentCar.oneWay)}
                              </span>
                              <div className="text-right">
                                <span className="text-sm sm:text-base font-black text-accent block leading-none">
                                  {formatPrice(catPrice)}
                                </span>
                                {durationMode === DurationMode.DAILY_RATE && c.dailyRate && (
                                  <span className="text-sm text-slate-400 font-medium mt-0.5 block">
                                    {formatPrice(c.dailyRate)} / {t.rentCar.dayUnit}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Card 5: Notes */}
            <div className="bg-white dark:bg-[var(--bg-surface)] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-accent" />
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  {t.rentCar.notes}
                </h2>
              </div>
              <TextArea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder={t.rentCar.notesPlaceholder}
                className="w-full h-24 p-3 bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-semibold outline-none resize-none focus:border-accent"
              />
            </div>

          </div>

          {/* Right Column: Sticky Booking Summary (col-span-4) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            {/* Customer Discount Section */}
            <CustomerDiscountSection
              scopeType={serviceType === IntercityServiceType.SHARED ? "SHARED_ROUTE" : "INTERCITY_ROUTE"}
              scopeRefId={serviceType === IntercityServiceType.SHARED ? sharedRoute?.id : route?.id}
              orderTotal={rawTotalPrice}
              onDiscountChange={setAppliedDiscount}
            />

            <div className="bg-white dark:bg-[var(--bg-surface)] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
                  {t.selfDrive.bookingSummary}
                </h3>
                <Chip size="sm" color="accent" variant="soft" className="text-sm font-bold px-3 py-1">
                  {serviceType === IntercityServiceType.SHARED ? t.rentCar.sharedService : t.rentCar.privateService}
                </Chip>
              </div>

              <div className="space-y-3 text-sm">
                {/* Route */}
                <div className="flex justify-between items-start">
                  <span className="text-slate-400 font-bold uppercase text-sm">{t.rentCar.route}</span>
                  <span className="font-black text-slate-900 dark:text-white text-right max-w-[65%] truncate">
                    {serviceType === IntercityServiceType.SHARED
                      ? (sharedRoute?.name || "---")
                      : (route ? `${route.originCity} ⇌ ${route.destinationCity}` : "---")}
                  </span>
                </div>

                {/* Service / Vehicle Category */}
                {serviceType === IntercityServiceType.SHARED ? (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase text-sm">{t.rentCar.vehicleType}</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 text-right">
                      {sharedRoute?.vehicleName || "Limousine VIP"} ({pax} {t.common.seats})
                    </span>
                  </div>
                ) : selectedCategory ? (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase text-sm">{t.rentCar.vehicleType}</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 text-right">
                      {selectedCategory.category.code} ({selectedCategory.category.minSeat}-{selectedCategory.category.maxSeat} {t.common.seats})
                    </span>
                  </div>
                ) : null}

                {/* Trip Type / Duration */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase text-sm">{t.rentCar.tripType}</span>
                  <span className="font-extrabold text-accent">
                    {serviceType === IntercityServiceType.SHARED
                      ? (isSharedRoundTrip ? t.rentCar.roundTrip : t.rentCar.oneWay)
                      : (durationMode === DurationMode.DAILY_RATE
                          ? `${t.rentCar.dailyRate} (${rentalDays} ${t.rentCar.dayUnit})`
                          : (isRoundTrip ? t.rentCar.roundTrip : t.rentCar.oneWay))}
                  </span>
                </div>

                {serviceType === IntercityServiceType.SHARED ? (
                  <>
                    {/* Outbound */}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold uppercase text-sm">{t.rentCar.outboundTrip}</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        {outboundTripDate} ({outboundSchedule?.departureTime ? outboundSchedule.departureTime.slice(0, 5) : ""})
                      </span>
                    </div>

                    {/* Return if any */}
                    {isSharedRoundTrip && returnDirection && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold uppercase text-sm">{t.rentCar.returnTrip}</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          {returnTripDate} ({returnSchedule?.departureTime ? returnSchedule.departureTime.slice(0, 5) : ""})
                        </span>
                      </div>
                    )}

                    {/* Pickup */}
                    <div className="flex justify-between items-start text-sm">
                      <span className="text-slate-400 font-bold uppercase text-sm shrink-0">{t.rentCar.pickupPoint}</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium text-right max-w-[60%] truncate">
                        {outboundPickupType === PickupType.OFFICE ? getOfficeText(outboundPickupOfficeId) : (editOutboundPickupAddress || "---")}
                      </span>
                    </div>

                    {/* Dropoff */}
                    <div className="flex justify-between items-start text-sm">
                      <span className="text-slate-400 font-bold uppercase text-sm shrink-0">{t.rentCar.dropoffPoint}</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium text-right max-w-[60%] truncate">
                        {outboundDropoffType === PickupType.OFFICE ? getOfficeText(outboundDropoffOfficeId) : (editOutboundDropoffAddress || "---")}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Departure Date & Time */}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold uppercase text-sm">{t.rentCar.departure}</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        {durationMode === DurationMode.DAILY_RATE && dateRange?.start
                          ? formatToDisplayDate(dateRange.start)
                          : (dateValue ? `${dateValue.day}/${dateValue.month}/${dateValue.year}` : "---")}{" "}
                        ({editTime})
                      </span>
                    </div>

                    {/* Return Date (if DAILY_RATE) */}
                    {durationMode === DurationMode.DAILY_RATE && dateRange?.end && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold uppercase text-sm">{t.rentCar.endDate}</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          {formatToDisplayDate(dateRange.end)}
                        </span>
                      </div>
                    )}

                    {/* Return Date (if in-day round trip) */}
                    {durationMode === DurationMode.IN_DAY && isRoundTrip && returnDateValue && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold uppercase text-sm">{t.rentCar.returnSchedule}</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          {returnDateValue.day}/{returnDateValue.month}/{returnDateValue.year}
                          {editReturnTime && ` (${editReturnTime})`}
                        </span>
                      </div>
                    )}

                    {/* Addresses */}
                    {editPickupAddress && (
                      <div className="flex justify-between items-start text-sm">
                        <span className="text-slate-400 font-bold uppercase text-sm shrink-0">{t.rentCar.pickupAddress}</span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium text-right max-w-[60%] truncate">
                          {editPickupAddress}
                        </span>
                      </div>
                    )}
                    {editDropoffAddress && (
                      <div className="flex justify-between items-start text-sm">
                        <span className="text-slate-400 font-bold uppercase text-sm shrink-0">{t.rentCar.dropoffAddress}</span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium text-right max-w-[60%] truncate">
                          {editDropoffAddress}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2 text-sm">
                {durationMode === DurationMode.DAILY_RATE && selectedCategory?.dailyRate ? (
                  <div className="flex justify-between items-center text-sm font-bold text-slate-400 uppercase">
                    <span>{t.rentCar.pricePerDay}</span>
                    <span className="text-slate-800 dark:text-slate-200 font-extrabold">
                      {formatPrice(selectedCategory.dailyRate)} × {rentalDays} {t.rentCar.dayUnit}
                    </span>
                  </div>
                ) : null}

                {/* Subtotal & Discount if applied */}
                {appliedDiscount && (
                  <>
                    <div className="flex justify-between items-center text-sm font-bold text-slate-400 uppercase">
                      <span>{t.booking.totalPrice || "Tạm tính"}</span>
                      <span className="text-slate-800 dark:text-slate-200 font-extrabold">
                        {formatPrice(rawTotalPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                      <span>{t.discounts.tabDiscounts} ({appliedDiscount.code})</span>
                      <span className="font-extrabold">
                        - {formatPrice(appliedDiscount.amount)}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase">
                    {t.common.totalPrice}
                  </span>
                  <span className="text-2xl font-black text-accent">
                    {formatPrice(finalTotalPrice)}
                  </span>
                </div>

                {/* Deposit Info Box — only when the selected price carries a deposit policy */}
                {depositCalc && (
                  <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 space-y-1.5 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <ShieldCheck size={16} className="text-amber-600 shrink-0" />
                        {depositCalc.depositType === DepositType.FIXED
                          ? `${t.discounts.depositRequired} (${t.discounts.depositFixed})`
                          : `${t.discounts.depositRequired} (${depositCalc.depositRate}%)`}
                      </span>
                      <span className="text-sm sm:text-base font-black text-amber-700 dark:text-amber-400">
                        {formatPrice(depositCalc.depositAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-1.5 border-t border-amber-200/50 dark:border-amber-900/30 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      <span>{t.discounts.remainingPayment}:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {formatPrice(depositCalc.remainingAmount)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit CTA Button */}
              <Button
                type="submit"
                isDisabled={submitting || !canBook}
                className="w-full h-12 rounded-2xl font-black text-sm bg-accent text-accent-foreground hover:bg-accent-hover shadow-md gap-2 border-none cursor-pointer flex items-center justify-center"
              >
                <CheckCircle size={18} />
                <span>{t.common.bookNow}</span>
              </Button>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-sm text-slate-400 font-medium">
                <ShieldCheck size={16} className="text-accent" />
                <span>{t.selfDrive.guarantee}</span>
              </div>
            </div>
          </div>
        </form>
      </main>

      {/* Confirmation Modal */}
      <BookingConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmBooking}
        totalAmount={finalTotalPrice}
        depositAmount={depositCalc?.depositAmount}
        depositRate={depositCalc?.depositRate}
        depositType={depositCalc?.depositType as any}
        remainingAmount={depositCalc?.remainingAmount ?? 0}
        submitting={submitting}
        serviceType={serviceType === IntercityServiceType.SHARED ? t.rentCar.sharedService : t.rentCar.privateService}
        summaryItems={
          serviceType === IntercityServiceType.SHARED
            ? [
                { label: t.rentCar.route, value: sharedRoute?.name || "" },
                { label: t.rentCar.serviceType, value: t.rentCar.sharedService },
                { label: t.rentCar.vehicleType, value: sharedRoute?.vehicleName || "Limousine VIP" },
                {
                  label: t.rentCar.tripType,
                  value: isSharedRoundTrip ? t.rentCar.roundTrip : t.rentCar.oneWay,
                },
                {
                  label: t.rentCar.outboundTrip,
                  value: `${outboundTripDate} (${outboundSchedule?.departureTime ? outboundSchedule.departureTime.slice(0, 5) : ""})`,
                },
                ...(isSharedRoundTrip && returnDirection
                  ? [{
                      label: t.rentCar.returnTrip,
                      value: `${returnTripDate} (${returnSchedule?.departureTime ? returnSchedule.departureTime.slice(0, 5) : ""})`,
                    }]
                  : []),
                {
                  label: t.rentCar.pickupPoint,
                  value: outboundPickupType === PickupType.OFFICE ? getOfficeText(outboundPickupOfficeId) : editOutboundPickupAddress,
                },
                {
                  label: t.rentCar.dropoffPoint,
                  value: outboundDropoffType === PickupType.OFFICE ? getOfficeText(outboundDropoffOfficeId) : editOutboundDropoffAddress,
                },
                { label: t.rentCar.fullName, value: editName },
                { label: t.rentCar.phone, value: editPhone },
                { label: t.rentCar.paxCount, value: `${pax} ${t.common.seats}` },
                ...(appliedDiscount
                  ? [{ label: `${t.discounts.tabDiscounts} (${appliedDiscount.code})`, value: `-${formatPrice(appliedDiscount.amount)}` }]
                  : []),
                { label: t.common.totalPrice, value: `${formatPrice(finalTotalPrice)}` },
                ...(depositCalc
                  ? [
                      { label: t.discounts.depositRequired, value: `${formatPrice(depositCalc.depositAmount)}` },
                      { label: t.discounts.remainingPayment, value: `${formatPrice(depositCalc.remainingAmount)}` },
                    ]
                  : []),
              ]
            : [
                { label: t.rentCar.route, value: route ? `${route.originCity} ⇌ ${route.destinationCity}` : "" },
                {
                  label: t.rentCar.rentalPeriod,
                  value: durationMode === DurationMode.DAILY_RATE
                    ? `${t.rentCar.dailyRate} (${rentalDays} ${t.rentCar.dayUnit})`
                    : (isRoundTrip ? t.rentCar.roundTrip : t.rentCar.oneWay),
                },
                ...(serviceType === IntercityServiceType.PRIVATE && selectedCategory
                  ? [{ label: t.rentCar.vehicleType, value: selectedCategory.category.code }]
                  : []),
                {
                  label: t.rentCar.date,
                  value: durationMode === DurationMode.DAILY_RATE && dateRange?.start
                    ? `${formatToDisplayDate(dateRange.start)} → ${formatToDisplayDate(dateRange.end)}`
                    : (dateValue ? `${dateValue.day}/${dateValue.month}/${dateValue.year}` : ""),
                },
                { label: t.rentCar.time, value: editTime },
                { label: t.rentCar.pickupAddress, value: editPickupAddress },
                { label: t.rentCar.fullName, value: editName },
                { label: t.rentCar.phone, value: editPhone },
                ...(appliedDiscount
                  ? [{ label: `${t.discounts.tabDiscounts} (${appliedDiscount.code})`, value: `-${formatPrice(appliedDiscount.amount)}` }]
                  : []),
                { label: t.common.totalPrice, value: `${formatPrice(finalTotalPrice)}` },
                ...(depositCalc
                  ? [
                      { label: t.discounts.depositRequired, value: `${formatPrice(depositCalc.depositAmount)}` },
                      { label: t.discounts.remainingPayment, value: `${formatPrice(depositCalc.remainingAmount)}` },
                    ]
                  : []),
              ]
        }
      />

      {/* Error Overlay */}
      {errorMessage && (
        <ErrorOverlay message={errorMessage} onClose={() => setErrorMessage("")} />
      )}
    </div>
  );
}
