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
import { createBooking } from "@/lib/api/rental";
import { formatPrice as _formatPrice } from "@/lib/format";
import { AutofillButton } from "@/components/AutofillButton";
import BookingConfirmationModal from "@/components/BookingConfirmationModal";

interface CategoryWithVehicles {
  category: VehicleCategoryDto;
  vehicles: VehicleDto[];
  price: number;
}

export default function RentCarConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useI18n();
  const vi = language === "vi";
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
  const departureDate = searchParams.get("departureDate") || "";
  const departureTime = searchParams.get("departureTime") || "";
  const customerName = searchParams.get("customerName") || "";
  const customerEmail = searchParams.get("customerEmail") || "";
  const customerPhone = searchParams.get("customerPhone") || "";
  const notes = searchParams.get("notes") || "";

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

  const [editName, setEditName] = useState(customerName);
  const [editPhone, setEditPhone] = useState(customerPhone);
  const [editEmail, setEditEmail] = useState(customerEmail);
  const [editNotes, setEditNotes] = useState(notes);
  const [editTripType, setEditTripType] = useState(tripType);
  const [editDate, setEditDate] = useState(departureDate);
  const [editTime, setEditTime] = useState(departureTime);
  const [editRouteId, setEditRouteId] = useState(routeId);
  const [departureTimes, setDepartureTimes] = useState<{ departureTime: string; orderIndex: number }[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

            const price = editTripType === "one-way" ? priceEntry.oneWayAmount : priceEntry.roundTripAmount;
            catsWithVehicles.push({ category: cat, vehicles, price });
          } catch {
            continue;
          }
        }

        setAllCategories(catsWithVehicles);
        setDisplayCount(3);
        setSelectedCategoryId(catsWithVehicles.length > 0 ? catsWithVehicles[0].category.id : null);
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

  const handleSubmit = async () => {
    if (!route || !selectedCategory || submitting) return;
    setShowConfirmModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!route || !selectedCategory || submitting) return;

    setSubmitting(true);

    const catName = selectedCategory.category.translations?.find((tr) => tr.locale === language)?.name || selectedCategory.category.code;

    const dynamicDetails = JSON.stringify({
      routeId: route.id,
      vehicleCategoryId: selectedCategory.category.id,
      tripType: editTripType,
      departureDate: editDate,
      departureTime: editTime,
      basePrice: selectedCategory.price,
      totalPrice: selectedCategory.price,
      routeName: getRouteName(route),
      vehicleCategory: catName,
    });

    try {
      const res = await createBooking({
        customerName: editName || "Guest",
        customerEmail: editEmail || `${editPhone || "guest"}@traveler.com`,
        customerPhone: editPhone || "",
        customerNotes: editNotes || undefined,
        items: [{
          serviceId: 102,
          quantity: 1,
          unitPrice: selectedCategory.price,
          dynamicDetails,
        }],
      });

      if (res?.data?.bookingCode) {
        setCreatedCode(res.data.bookingCode);
        setBookingSuccess(true);
      }
    } catch (err) {
      console.error("Booking API error:", err);
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
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-black/20 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 text-center space-y-6 animate-fade-in-up">
          <CheckCircle size={48} className="text-green-600 dark:text-green-400 mx-auto" />
          <h2 className="text-xl font-black text-slate-800 dark:text-white">
            {t.airportTransfer.successTitle}
          </h2>
          <div className="bg-slate-50 dark:bg-black/40 rounded-xl px-4 py-3 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              {t.airportTransfer.bookingCode}
            </p>
            <p className="text-2xl font-black font-mono text-slate-800 dark:text-white tracking-wider">
              {createdCode}
            </p>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {vi
              ? "Chúng tôi sẽ liên hệ với bạn qua số điện thoại trong thời gian sớm nhất."
              : "We will contact you via phone shortly."}
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => router.push(prefixUrl("/"))}
              variant="outline"
              className="flex-1 text-xs font-bold cursor-pointer"
            >
              {t.common.backToHome}
            </Button>
            <Button
              onClick={() => router.push(prefixUrl("/rent-car"))}
              className="flex-1 text-xs font-bold bg-accent text-white cursor-pointer"
            >
              {t.airportTransfer.bookAnother}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-slate-50 dark:bg-black/20 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">
              {t.airportTransfer.confirmBooking}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {vi ? "Kiểm tra thông tin và chọn xe" : "Review details and select vehicle"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Booking Summary - Editable */}
        <div className="bg-white dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 sm:p-6 space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {vi ? "Thông tin chuyến đi" : "Trip Information"}
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
                  onChange={(key) => { if (key) setEditRouteId(Number(key)); }}
                >
                  <Label>{t.rentCar.route}</Label>
                  <Autocomplete.Trigger>
                    <Autocomplete.Value />
                    <Autocomplete.ClearButton />
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
              </div>
            </div>

            {/* Trip Type - editable */}
            <div className="flex items-start gap-3">
              <Car size={16} className="text-accent mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t.rentCar.oneWay}</p>
                <Select
                  isRequired
                  selectedKey={editTripType}
                  onSelectionChange={(key) => { if (key) setEditTripType(key as string); }}
                >
                  <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold flex items-center justify-between cursor-pointer h-[40px]">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-50">
                    <ListBox>
                      <ListBox.Item key="one-way" id="one-way" textValue={t.rentCar.oneWay} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                        {t.rentCar.oneWay}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item key="round-trip" id="round-trip" textValue={t.rentCar.roundTrip} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                        {t.rentCar.roundTrip}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
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
                    }
                  }}
                >
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t.rentCar.date}</Label>
                  <DateField.Group fullWidth className="h-10 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex items-center justify-between">
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
                          <Calendar.NavButton slot="previous" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" />
                          <Calendar.NavButton slot="next" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" />
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
              </div>
            </div>

            {/* Time - departure times or input */}
            <div className="flex items-start gap-3">
              <Clock size={16} className="text-accent mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t.rentCar.time}</p>
                {route?.hasDepartureTimes && departureTimes.length > 0 ? (
                  <Select
                    selectedKey={editTime || undefined}
                    onSelectionChange={(key) => { if (key) setEditTime(String(key)); }}
                  >
                    <Select.Trigger className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold flex items-center justify-between cursor-pointer">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-50">
                      <ListBox>
                        {departureTimes.map((dt) => (
                          <ListBox.Item key={dt.departureTime} id={dt.departureTime} textValue={dt.departureTime} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                            {dt.departureTime}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                ) : (
                  <Input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full"
                  />
                )}
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
            onFill={(d) => { setEditName(d.fullname); setEditPhone(d.phone); setEditEmail(d.email); }}
            label={t.common.autoFill}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="flex items-start gap-3">
              <User size={16} className="text-accent mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t.common.name}</p>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={vi ? "Nhập họ tên" : "Enter name"}
                  className="w-full"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3">
              <Phone size={16} className="text-accent mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t.common.phone}</p>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder={vi ? "Nhập số điện thoại" : "Enter phone number"}
                  className="w-full"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3">
              <Mail size={16} className="text-accent mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Email</p>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder={vi ? "Nhập email" : "Enter email"}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="flex items-start gap-3">
            <MessageSquare size={16} className="text-accent mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t.rentCar.notes}</p>
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
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 pl-1">
            {t.rentCar.vehicleType}
          </h3>
          {allCategories.length === 0 ? (
            <div className="bg-white dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 text-center">
              <Car size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {vi ? "Không có xe nào khả dụng cho tuyến này" : "No vehicles available for this route"}
              </p>
            </div>
          ) : (
            <ScrollShadow
              className="max-h-[600px]"
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
                        ? "!border-2 !border-accent !bg-blue-50 dark:!bg-blue-950/30 shadow-md"
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
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
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
                              <span className="block text-[9px] text-slate-400 mt-0.5">
                                {tripType === "one-way" ? t.rentCar.oneWay : t.rentCar.roundTrip}
                              </span>
                            </div>
                          </div>

                          {catDesc && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                              {catDesc}
                            </p>
                          )}

                          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {vi ? "Đại diện:" : "Examples:"} {vehicleNames.join(", ")}
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
                {vi ? `Đang hiển thị ${categories.length}/${allCategories.length}` : `Showing ${categories.length}/${allCategories.length}`}
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
              isDisabled={!selectedCategory || submitting}
              className="w-full h-12 rounded-2xl font-black text-sm sm:text-base bg-accent text-white hover:bg-accent-hover shadow-md gap-2 border-none cursor-pointer"
            >
              {submitting
                ? t.airportTransfer.submitting
                : t.airportTransfer.confirmBooking}
            </Button>
          </div>
        )}
      </div>

      <BookingConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmBooking}
        serviceType={vi ? "Thuê xe liên tỉnh" : "Intercity Car Rental"}
        summaryItems={[
          { label: t.rentCar.route, value: route ? getRouteName(route) : "" },
          { label: t.rentCar.tripType, value: editTripType === "one-way" ? t.rentCar.oneWay : t.rentCar.roundTrip },
          { label: t.rentCar.date, value: editDate },
          { label: t.rentCar.time, value: editTime || "-" },
          { label: t.rentCar.vehicleTypes, value: selectedCategory?.category.translations?.find((tr) => tr.locale === language)?.name || selectedCategory?.category.code || "" },
          { label: t.common.name, value: editName || "Guest" },
          { label: t.common.phone, value: editPhone || "-" },
          { label: t.common.email, value: editEmail || "-" },
          { label: t.common.notes, value: editNotes || "-" },
        ]}
        totalAmount={selectedCategory?.price || 0}
        totalLabel={t.common.totalPrice}
        submitting={submitting}
      />
    </div>
  );
}
