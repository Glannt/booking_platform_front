"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  Car,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Mail,
  MessageSquare,
} from "lucide-react";
import { Button, Skeleton, Card, Input, TextArea, Select, ListBox, ScrollShadow, DatePicker, DateField, Calendar, FieldError, Autocomplete, Label, SearchField, EmptyState, useFilter } from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { parseDate } from "@internationalized/date";

import { useI18n } from "@/context/LanguageContext";
import { getActiveIntercityRoutes, type IntercityRouteDto } from "@/lib/api/rental";
import { getVehicleCategories, getRentableVehiclesByCategory, type VehicleCategoryDto, type VehicleDto } from "@/lib/api/fleet";
import { createRentCarBooking } from "@/lib/api/rent-car/bookings";
import { formatPriceSync as _formatPrice } from "@/lib/format";
import { calcIntercityPrice } from "@/lib/pricing";
import { backendUrl } from "@/lib/api/client";
import { AutofillButton } from "@/components/AutofillButton";
import BookingConfirmationModal from "@/components/BookingConfirmationModal";
import SuccessOverlay from "@/components/SuccessOverlay";
import ErrorOverlay from "@/components/ErrorOverlay";
import { TimePicker, type TimeValue } from "@/components/time-picker";

interface CategoryWithVehicles {
  category: VehicleCategoryDto;
  vehicles: VehicleDto[];
  price: number;
}

export default function RentCarConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useI18n();
  const { contains } = useFilter({ sensitivity: "base" });

  const prefixUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const segments = url.split("/");
    if (segments.length > 1 && ["vi", "en", "ko", "ru"].includes(segments[1])) return url;
    return `/${language}${url === "/" ? "" : url}`;
  };

  const routeId = Number(searchParams.get("routeId") || "0");
  const tripType = searchParams.get("tripType") || "one-way";
  const departureDate = searchParams.get("departureDate") || searchParams.get("date") || "";
  const departureTime = searchParams.get("departureTime") || searchParams.get("time") || "";
  const customerName = searchParams.get("customerName") || "";
  const customerEmail = searchParams.get("customerEmail") || "";
  const customerPhone = searchParams.get("customerPhone") || "";
  const notes = searchParams.get("notes") || "";
  const initialPickupAddress = searchParams.get("pickupAddress") || searchParams.get("pickup") || "";
  const initialDropoffAddress = searchParams.get("dropoffAddress") || searchParams.get("dropoff") || "";

  const [route, setRoute] = useState<IntercityRouteDto | null>(null);
  const [allRoutes, setAllRoutes] = useState<IntercityRouteDto[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryWithVehicles[]>([]);
  const [displayCount, setDisplayCount] = useState(3);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [createdCode, setCreatedCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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

  const [editName, setEditName] = useState(customerName);
  const [editPhone, setEditPhone] = useState(customerPhone);
  const [editEmail, setEditEmail] = useState(customerEmail);
  const [editNotes, setEditNotes] = useState(notes);
  const [editZaloId, setEditZaloId] = useState("");
  const [editKakaoTalkId, setEditKakaoTalkId] = useState("");
  const [editTripType, setEditTripType] = useState(tripType);
  const [editDate, setEditDate] = useState(departureDate);
  const defaultTimeValue = timeStringToValue(departureTime);
  const [editTime, setEditTime] = useState(departureTime || timeValueToString(defaultTimeValue));
  const [editTimeValue, setEditTimeValue] = useState<TimeValue>(defaultTimeValue);
  const [editRouteId, setEditRouteId] = useState(routeId);
  const [editPickupAddress, setEditPickupAddress] = useState(initialPickupAddress);
  const [editDropoffAddress, setEditDropoffAddress] = useState(initialDropoffAddress);
  const [departureTimes, setDepartureTimes] = useState<{ departureTime: string; orderIndex: number }[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearError = (field: string) => setErrors(prev => {
    if (!prev[field]) return prev;
    const next = { ...prev };
    delete next[field];
    return next;
  });

  const formatPrice = useCallback((value: number) => _formatPrice(value, language), [language]);

  const getRouteName = useCallback((r: IntercityRouteDto) => {
    const tr = r.translations?.find((t) => t.locale === language);
    if (tr?.name) return tr.name;
    return `${r.originCity} ⇌ ${r.destinationCity}`;
  }, [language]);

  useEffect(() => {
    if (!routeId) {
      router.push(prefixUrl("/rent-car"));
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
        setAllRoutes(routes);

        const foundRoute = routes.find((r) => r.id === routeId);
        if (foundRoute) {
          setRoute(foundRoute);
          if (foundRoute.hasDepartureTimes && foundRoute.departureTimes?.length) {
            setDepartureTimes(foundRoute.departureTimes.sort((a, b) => a.orderIndex - b.orderIndex));
          }
        }
      } catch (err) {
        console.error("Failed to load confirm data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [routeId, language]);

  useEffect(() => {
    if (!route) return;

    const loadCategories = async () => {
      try {
        const catsRes = await getVehicleCategories({ active: true, page: 0, size: 100 });
        const allCats = (catsRes?.data?.content ?? []) as VehicleCategoryDto[];
        const routePrices = route.prices ?? [];

        const catsWithVehicles: CategoryWithVehicles[] = [];
        for (const cat of allCats) {
          const priceEntry = routePrices.find(
            (p) => p.vehicleCategoryId === cat.id && p.active
          );
          if (!priceEntry) continue;

          try {
            const vehiclesRes = await getRentableVehiclesByCategory(cat.id);
            const vehicles = (vehiclesRes?.data ?? []) as VehicleDto[];
            if (vehicles.length === 0) continue;

            const price = calcIntercityPrice(route.distanceKm, priceEntry.perKmAmount, editTripType === "return");
            catsWithVehicles.push({ category: cat, vehicles, price });
          } catch {
            continue;
          }
        }

        setAllCategories(catsWithVehicles);
        setDisplayCount(3);
        const seatsParam = searchParams.get("seats");
        let preselectedId = null;
        if (seatsParam && catsWithVehicles.length > 0) {
          const matched = catsWithVehicles.find(c => c.category.code === seatsParam);
          if (matched) preselectedId = matched.category.id;
        }
        if (!preselectedId && catsWithVehicles.length > 0) {
          preselectedId = catsWithVehicles[0].category.id;
        }
        setSelectedCategoryId(preselectedId);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };

    loadCategories();
  }, [route, editTripType]);

  useEffect(() => {
    const foundRoute = allRoutes.find((r) => r.id === editRouteId);
    if (foundRoute && foundRoute.id !== route?.id) {
      setRoute(foundRoute);
      if (foundRoute.hasDepartureTimes && foundRoute.departureTimes?.length) {
        setDepartureTimes(foundRoute.departureTimes.sort((a, b) => a.orderIndex - b.orderIndex));
      } else {
        setDepartureTimes([]);
      }
      setEditTime("");
    }
  }, [editRouteId, allRoutes]);

  const categories = allCategories.slice(0, displayCount);
  const hasMore = displayCount < allCategories.length;

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayCount((prev) => prev + 3);
      setLoadingMore(false);
    }, 400);
  }, [loadingMore, hasMore]);

  const selectedCategory = allCategories.find((c) => c.category.id === selectedCategoryId);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!editRouteId || editRouteId === 0) newErrors.route = t.errors.routeRequired;
    if (!editTripType) newErrors.tripType = t.errors.tripTypeRequired;
    if (!editDate) newErrors.date = t.errors.dateRequired;
    if (!editTime) newErrors.time = t.errors.timeRequired;
    if (!editName?.trim()) newErrors.name = t.errors.nameRequired;
    if (!editPhone?.trim()) newErrors.phone = t.errors.phoneRequired;
    if (!editEmail?.trim()) newErrors.email = t.errors.emailRequired;
    if (!editPickupAddress?.trim()) newErrors.pickupAddress = t.errors.pickupAddressRequired;
    if (!editDropoffAddress?.trim()) newErrors.dropoffAddress = t.errors.dropoffAddressRequired;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [editRouteId, editTripType, editDate, editTime, editName, editPhone, editEmail, editPickupAddress, editDropoffAddress, t.errors]);

  const isFormValid = !!(
    editRouteId && editRouteId > 0 &&
    editTripType &&
    editDate &&
    editTime &&
    editName?.trim() &&
    editPhone?.trim() &&
    editEmail?.trim() &&
    editPickupAddress?.trim() &&
    editDropoffAddress?.trim() &&
    route &&
    selectedCategory
  );

  const handleSubmit = async () => {
    if (!route || !selectedCategory || submitting) return;
    if (!validate()) return;
    setShowConfirmModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!route || !selectedCategory || submitting) return;
    if (!validate()) { setShowConfirmModal(false); return; }

    setSubmitting(true);

    try {
      const res = await createRentCarBooking({
        customerName: editName || "Guest",
        customerEmail: editEmail || `${editPhone || "guest"}@traveler.com`,
        customerPhone: editPhone || "",
        customerNotes: `[Zalo: ${editZaloId}] [KakaoTalk: ${editKakaoTalkId}] ${editNotes || ""}`,
        routeId: route.id,
        zaloId: editZaloId || undefined,
        kakaoTalkId: editKakaoTalkId || undefined,
        contactChannel: editZaloId ? "zalo" : editKakaoTalkId ? "kakaotalk" : undefined,
        contactId: editZaloId || editKakaoTalkId || undefined,
        vehicleCategoryId: selectedCategory.category.id,
        tripType: editTripType,
        departureDate: editDate,
        departureTime: editTime,
        pickupAddress: editPickupAddress,
        dropoffAddress: editDropoffAddress,
        basePrice: selectedCategory.price,
        totalPrice: selectedCategory.price,
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
    const onSuccessComplete = () => {
      router.push(`/${language}/rent-car/success?bookingCode=${createdCode}`);
    };
    return <SuccessOverlay bookingCode={createdCode} onComplete={onSuccessComplete} title={t.rentCar.confirmSuccessTitle} subtitle={t.rentCar.redirecting} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Scenic Route Panoramic Banner */}
      <div className="relative w-full h-[200px] sm:h-[260px] overflow-hidden">
        {/* Background panorama image */}
        <img
          src={
            route?.thumbnailUrl
              ? (route.thumbnailUrl.startsWith("http")
                ? route.thumbnailUrl
                : `${backendUrl}${route.thumbnailUrl}`)
              : "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&h=685&q=80"
          }
          alt={route ? getRouteName(route) : "Scenic Route"}
          className="w-full h-full object-cover scale-105"
        />
        {/* Black gradient overlay (45-60% opacity) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/30" />

        {/* Content overlaid on banner */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 max-w-4xl mx-auto w-full">
          {/* Back button with semi-transparent blur backdrop */}
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute top-4 left-4 p-2 rounded-xl bg-black/35 backdrop-blur-md border border-white/10 text-white hover:bg-black/50 transition-all cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Route Title with Backdrop Blur Plate */}
          <div className="inline-block self-start rounded-2xl bg-black/40 backdrop-blur-[3px] border border-white/10 px-5 py-3.5 mt-auto">
            <span className="text-[10px] font-extrabold tracking-widest text-accent uppercase block mb-1">
              {t.rentCar.requestedRoute}
            </span>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-wide uppercase leading-none drop-shadow-md flex items-center gap-3">
              {route ? (
                <>
                  <span>{route.originCity}</span>
                  <span className="text-accent">⇄</span>
                  <span>{route.destinationCity}</span>
                </>
              ) : (
                "--- ⇄ ---"
              )}
            </h1>
            <p className="text-[11px] font-bold text-white/70 mt-1.5 flex items-center gap-1.5">
              <span>{t.rentCar.reviewAndSelect}</span>
              {route?.distanceKm && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  <span>{route.distanceKm} km</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Booking Summary - Editable */}
        <div className="bg-white dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 sm:p-6 space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t.rentCar.tripInformation}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Route - Autocomplete */}
            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-accent mt-0.5 shrink-0" />
              <div className="flex-1">
                <Autocomplete
                  className="w-full"
                  placeholder={t.rentCar.selectRoute}
                  selectionMode="single"
                  value={route ? String(route.id) : null}
                  onChange={(key) => { if (key) { setEditRouteId(Number(key)); clearError("route"); } }}
                >
                  <Label className="font-bold" isRequired>{t.rentCar.route}</Label>
                  <Autocomplete.Trigger className="dark:shadow-accent dark:shadow-xs w-full h-10 px-3 rounded-xl border-1 border-slate-300 dark:border-slate-700 shadow-sm text-sm font-bold flex items-center justify-between cursor-pointer">
                    <Autocomplete.Value />
                    <Autocomplete.Indicator />
                  </Autocomplete.Trigger>
                  <Autocomplete.Popover>
                    <Autocomplete.Filter filter={contains}>
                      <SearchField autoFocus name="search" variant="secondary">
                        <SearchField.Group>
                          <SearchField.SearchIcon />
                          <SearchField.Input placeholder={t.rentCar.searchPlaceholder} />
                          <SearchField.ClearButton />
                        </SearchField.Group>
                      </SearchField>
                      <ListBox
                        className="max-h-[200px] overflow-y-auto"
                        renderEmptyState={() => <EmptyState>{t.common.noResults}</EmptyState>}
                      >
                        {allRoutes.map((r) => (
                          <ListBox.Item key={String(r.id)} id={String(r.id)} textValue={getRouteName(r)}>
                            <div className="flex items-center gap-2 py-0.5">
                              <MapPin size={14} className="text-accent shrink-0" />
                              <span className="text-xs font-bold">{getRouteName(r)}</span>
                            </div>
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Autocomplete.Filter>
                  </Autocomplete.Popover>
                </Autocomplete>
                {errors.route && <FieldError>{errors.route}</FieldError>}
              </div>
            </div>

            {/* Trip Type - editable */}
            <div className="flex items-start gap-3">
              <Car size={16} className="text-accent mt-0.5 shrink-0" />
              <div className="flex-1">
                <Label className="font-bold" isRequired>{t.rentCar.tripType}</Label>
                <Select
                  isRequired
                  selectedKey={editTripType}
                  onSelectionChange={(key) => { if (key) { setEditTripType(key as string); clearError("tripType"); } }}
                  fullWidth
                >
                  <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold flex items-center justify-between cursor-pointer h-[40px] dark:shadow-accent dark:shadow-xs">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover className="border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-50">
                    <ListBox>
                      <ListBox.Item key="one-way" id="one-way" textValue={t.rentCar.oneWay} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)]">
                        {t.rentCar.oneWay}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item key="round-trip" id="round-trip" textValue={t.rentCar.roundTrip} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)]">
                        {t.rentCar.roundTrip}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
                {errors.tripType && <FieldError>{errors.tripType}</FieldError>}
              </div>
            </div>

            {/* Date - DatePicker */}
            <div className="flex items-start gap-3">
              <CalendarIcon size={16} className="text-accent mt-0.5 shrink-0" />
              <div className="flex-1">
                <DatePicker
                  className="w-full"
                  value={editDate ? parseDate(editDate) : undefined}
                  onChange={(val) => {
                    if (val) {
                      const d = val as DateValue;
                      const y = d.year;
                      const m = String(d.month).padStart(2, "0");
                      const day = String(d.day).padStart(2, "0");
                      setEditDate(`${y}-${m}-${day}`);
                      clearError("date");
                    }
                  }}
                >
                  <Label className="font-bold" isRequired>{t.rentCar.date}</Label>
                  <DateField.Group fullWidth className="dark:shadow-accent dark:shadow-xs h-10 border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex items-center justify-between">
                    <DateField.Input className="text-xs font-semibold bg-transparent border-none outline-none">
                      {(segment) => <DateField.Segment segment={segment} />}
                    </DateField.Input>
                    <DateField.Suffix>
                      <DatePicker.Trigger className="cursor-pointer">
                        <DatePicker.TriggerIndicator />
                      </DatePicker.Trigger>
                    </DateField.Suffix>
                  </DateField.Group>
                  <DatePicker.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-50">
                    <Calendar aria-label="Travel date">
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
                        <Calendar.GridHeader className="text-slate-400 text-[10px] font-bold">
                          {(day) => <Calendar.HeaderCell className="w-8 h-8 text-center">{day}</Calendar.HeaderCell>}
                        </Calendar.GridHeader>
                        <Calendar.GridBody>
                          {(date) => (
                            <Calendar.Cell
                              date={date}
                              className="w-8 h-8 text-xs font-semibold text-center cursor-pointer rounded-lg hover:bg-accent/10 hover:text-accent aria-selected:bg-accent aria-selected:text-white"
                            />
                          )}
                        </Calendar.GridBody>
                      </Calendar.Grid>
                      <Calendar.YearPickerGrid className="w-full mt-2 border-t pt-2">
                        <Calendar.YearPickerGridBody>
                          {({ year }) => (
                            <Calendar.YearPickerCell
                              year={year}
                              className="text-xs font-semibold px-2 py-1 cursor-pointer hover:bg-slate-100 rounded"
                            />
                          )}
                        </Calendar.YearPickerGridBody>
                      </Calendar.YearPickerGrid>
                    </Calendar>
                  </DatePicker.Popover>
                </DatePicker>
                {errors.date && <FieldError>{errors.date}</FieldError>}
              </div>
            </div>

            {/* Time - departure times or picker */}
            <div className="flex items-start gap-3">
              <Clock size={16} className="text-accent mt-0.5 shrink-0" />
              <div className="flex-1">
                {route?.hasDepartureTimes && departureTimes.length > 0 ? (
                  <Select
                    selectedKey={editTime || undefined}
                    onSelectionChange={(key) => { if (key) { setEditTime(String(key)); clearError("time"); } }}
                  >
                    <Label className="font-bold" isRequired>{t.rentCar.time}</Label>
                    <Select.Trigger className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold flex items-center justify-between cursor-pointer">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-50">
                      <ListBox>
                        {departureTimes.map((dt) => (
                          <ListBox.Item key={dt.departureTime} id={dt.departureTime} textValue={dt.departureTime} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)]">
                            {dt.departureTime}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                ) : (
                  <TimePicker
                    value={editTimeValue}
                    onChange={(v) => {
                      setEditTimeValue(v);
                      setEditTime(timeValueToString(v));
                      clearError("time");
                    }}
                    label={t.rentCar.time}
                    language={language}
                    popoverTitle="Chọn giờ xuất phát"
                    isRequired
                    labelClassName="dark:text-white dark:text-sm text-sm font-bold mb-1 mt-0.5"
                    triggerClassName="dark:shadow-accent dark:shadow-xs bg-white dark:bg-zinc-900"
                  />
                )}
                {errors.time && <FieldError>{errors.time}</FieldError>}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Info - Editable */}
        <div className="bg-white dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 sm:p-6 space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t.rentCar.contactInfo}
          </h3>
          <AutofillButton
            onFill={(d) => { setEditName(d.fullname); setEditPhone(d.phone); setEditEmail(d.email); setEditZaloId(d.zaloId ?? ""); setEditKakaoTalkId(d.kakaoTalkId ?? ""); }}
            label={t.common.autoFill}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="flex items-start gap-3">
              <User size={16} className="text-accent mt-0.5 shrink-0" />
              <div className="flex-1">
                <Label className="font-bold mb-1" isRequired>{t.common.name}</Label>
                <Input
                  value={editName}
                  onChange={(e) => { setEditName(e.target.value); clearError("name"); }}
                  placeholder={t.rentCar.namePlaceholder}
                  className="w-full"
                />
                {errors.name && <FieldError>{errors.name}</FieldError>}
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3">
              <Phone size={16} className="text-accent mt-0.5 shrink-0" />
              <div className="flex-1">
                <Label className="font-bold mb-1" isRequired>{t.common.phone}</Label>
                <Input
                  value={editPhone}
                  onChange={(e) => { setEditPhone(e.target.value); clearError("phone"); }}
                  placeholder={t.rentCar.phonePlaceholder}
                  className="w-full"
                />
                {errors.phone && <FieldError>{errors.phone}</FieldError>}
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3">
              <Mail size={16} className="text-accent mt-0.5 shrink-0" />
              <div className="flex-1">
                <Label className="font-bold mb-1" isRequired>Email</Label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => { setEditEmail(e.target.value); clearError("email"); }}
                  placeholder={t.rentCar.emailPlaceholder}
                  className="w-full"
                />
                {errors.email && <FieldError>{errors.email}</FieldError>}
              </div>
            </div>
          </div>

          {/* Zalo ID & KakaoTalk ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <MessageSquare size={16} className="text-accent mt-0.5 shrink-0" />
              <div className="flex-1">
                <Label className="font-bold mb-1">{t.rentCar.zaloId}</Label>
                <Input
                  value={editZaloId}
                  onChange={(e) => setEditZaloId(e.target.value)}
                  placeholder="Zalo ID"
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageSquare size={16} className="text-accent mt-0.5 shrink-0" />
              <div className="flex-1">
                <Label className="font-bold mb-1">{t.rentCar.kakaoTalkId}</Label>
                <Input
                  value={editKakaoTalkId}
                  onChange={(e) => setEditKakaoTalkId(e.target.value)}
                  placeholder="KakaoTalk ID"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Pickup Address */}
          <div className="flex items-start gap-3">
            <MapPin size={16} className="text-accent mt-0.5 shrink-0" />
            <div className="flex-1">
              <Label className="font-bold mb-1" isRequired>{t.rentCar.pickupAddress}</Label>
              <Input
                value={editPickupAddress}
                onChange={(e) => { setEditPickupAddress(e.target.value); clearError("pickupAddress"); }}
                placeholder={t.rentCar.pickupAddressPlaceholder}
                className="w-full"
              />
              {errors.pickupAddress && <FieldError>{errors.pickupAddress}</FieldError>}
            </div>
          </div>

          {/* Dropoff Address */}
          <div className="flex items-start gap-3">
            <MapPin size={16} className="text-accent mt-0.5 shrink-0" />
            <div className="flex-1">
              <Label className="font-bold mb-1" isRequired>{t.rentCar.dropoffAddress}</Label>
              <Input
                value={editDropoffAddress}
                onChange={(e) => { setEditDropoffAddress(e.target.value); clearError("dropoffAddress"); }}
                placeholder={t.rentCar.dropoffAddressPlaceholder}
                className="w-full"
              />
              {errors.dropoffAddress && <FieldError>{errors.dropoffAddress}</FieldError>}
            </div>
          </div>

          {/* Notes */}
          <div className="flex items-start gap-3">
            <MessageSquare size={16} className="text-accent mt-0.5 shrink-0" />
            <div className="flex-1">
              <Label className="font-bold mb-1">{t.rentCar.notes}</Label>
              <TextArea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder={t.rentCar.notesPlaceholder}
                className="w-full"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Vehicle Category Selection */}
        <div className="space-y-4">
          <Label className="font-bold text-lg" isRequired>
            {t.rentCar.vehicleType}
          </Label>
          {allCategories.length === 0 ? (
            <div className="bg-white dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 text-center mt-3">
              <Car size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                {t.rentCar.noVehiclesForRoute}
              </p>
            </div>
          ) : (
            <ScrollShadow
              className="max-h-[600px] mt-3"
              onScrollEnd={loadMore}
            >
              <div className="flex flex-col gap-3">
                {categories.map((item) => {
                  const isSelected = selectedCategoryId === item.category.id;
                  const catName = item.category.translations?.find((tr) => tr.locale === language)?.name || item.category.code;
                  const catDesc = item.category.translations?.find((tr) => tr.locale === language)?.description || "";
                  const vehicleNames = item.vehicles.slice(0, 3).map((v) => `${v.brand} ${v.model}`);
                  const thumbnailUrl = item.category.thumbnailUrl || "";

                  return (
                    <button
                      key={item.category.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(item.category.id)}
                      className={`card card--default w-full text-left transition-all cursor-pointer ${isSelected
                        ? "!border-2 !border-accent shadow-md"
                        : "hover:shadow-sm"
                        }`}
                    >
                      <div className="card__body flex flex-col sm:flex-row items-stretch gap-0">
                        {/* Thumbnail */}
                        <div className="relative w-full aspect-[16/9] sm:aspect-auto sm:h-auto sm:w-[140px] sm:min-h-[120px] shrink-0 overflow-hidden rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none">
                          {thumbnailUrl ? (
                            <img
                              alt={catName}
                              className="pointer-events-none absolute inset-0 h-full w-full object-cover select-none"
                              loading="lazy"
                              src={thumbnailUrl}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-[var(--bg-card)]">
                              <Car size={32} className="text-slate-300 dark:text-slate-600" />
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                              <CheckCircle size={14} className="text-white" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex flex-1 flex-col gap-2 p-4 sm:pl-5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className={`text-sm font-bold ${isSelected ? "text-accent" : "text-slate-800 dark:text-slate-100"}`}>
                                {catName}
                              </h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {item.category.minSeat}-{item.category.maxSeat} {t.common.seats}
                                {item.category.minLuggage > 0 && ` · ${item.category.minLuggage}-${item.category.maxLuggage} ${item.category.unitLuggage || "kg"}`}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-base font-black text-accent">
                                {formatPrice(item.price)}
                              </span>
                            </div>
                          </div>

                          {catDesc && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                              {catDesc}
                            </p>
                          )}

                          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {t.rentCar.vehicleExamples} {vehicleNames.join(", ")}
                            {item.vehicles.length > 3 && ` +${item.vehicles.length - 3}`}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {loadingMore && (
                  <div className="flex justify-center py-4">
                    <Skeleton className="w-full h-24 rounded-2xl" />
                  </div>
                )}
              </div>
            </ScrollShadow>
          )}

          {hasMore && !loadingMore && allCategories.length > 0 && (
            <div className="text-center">
              <span className="text-[10px] text-slate-400">
                {`${t.rentCar.showing} ${categories.length}/${allCategories.length}`}
              </span>
            </div>
          )}
        </div>

        {/* Submit */}
        {allCategories.length > 0 && (
          <div className="flex flex-col gap-3 pt-4">
            <div className="flex items-center justify-between bg-white dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
              <span className="text-sm font-bold text-slate-500">{t.common.total}</span>
              <span className="text-xl font-black text-accent">
                {selectedCategory ? formatPrice(selectedCategory.price) : "-"}
              </span>
            </div>
            <Button
              onClick={handleSubmit}
              isDisabled={!isFormValid || submitting}
              className="w-full h-12 rounded-2xl font-black text-sm sm:text-base bg-accent text-white hover:bg-accent-hover shadow-md gap-2 border-none cursor-pointer"
            >
              {submitting
                ? t.airportTransfer.submitting
                : t.airportTransfer.confirmBooking}
            </Button>
          </div>
        )}
      </div>

      {errorMessage && <ErrorOverlay message={errorMessage} onClose={() => setErrorMessage("")} />}

      <BookingConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmBooking}
        serviceType={t.rentCar.intercityRental}
        summaryItems={[
          { label: t.rentCar.route, value: route ? getRouteName(route) : "" },
          { label: t.rentCar.tripType, value: editTripType === "one-way" ? t.rentCar.oneWay : t.rentCar.roundTrip },
          { label: t.rentCar.date, value: editDate },
          { label: t.rentCar.time, value: editTime || "-" },
          { label: t.rentCar.vehicleTypes, value: selectedCategory?.category.translations?.find((tr) => tr.locale === language)?.name || selectedCategory?.category.code || "" },
          { label: t.common.notes, value: editNotes || "-" },
        ]}
        contactInfo={{
          fullName: editName || "Guest",
          phone: editPhone || "-",
          email: editEmail || "-",
        }}
        totalAmount={selectedCategory?.price || 0}
        totalLabel={t.common.totalPrice}
        submitting={submitting}
      />
    </div>
  );
}
