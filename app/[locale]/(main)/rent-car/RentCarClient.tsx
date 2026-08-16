"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  Label,
  ListBox,
  Description,
  DatePicker,
  DateField,
  Calendar,
  FieldError,
  Button,
  Skeleton,
  Input,
  TextField,
  toast,
  TextArea,
  Typography
} from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { getLocalTimeZone, today, parseDate } from "@internationalized/date";
import {
  Car,
  MapPin,
  ShieldCheck,
  Home as HomeIcon,
  Clock as ClockIcon,
  ChevronUp,
  Phone,
  MessageCircle,
  ArrowRight,
  Headset,
  CheckCircle
} from "lucide-react";

import { TimePicker, type TimeValue } from "@/components/time-picker";
import { useI18n } from "@/context/LanguageContext";
import { getActiveIntercityRoutes, getActiveDepartureTimes, type IntercityRouteDto, type IntercityDepartureTimeDto } from "@/lib/api/rental";
import { formatPriceSync as _formatPrice } from "@/lib/format";
import { calcIntercityPrice } from "@/lib/pricing";
import { backendUrl } from "@/lib/api/client";
import { HeroBanner } from "@/components/sections/HeroBanner";
import { BookingProcessSection } from "@/components/sections/BookingProcessSection";
import { FaqSection, type FaqCategory } from "@/components/FaqSection";
import type { SectionDto } from "@/lib/api/sections";

interface RentCarClientProps {
  sections: SectionDto[];
}

export default function RentCarClient({ sections }: RentCarClientProps) {
  const { language, t, contacts } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();

  const heroSection = sections.find(s => s.sectionType === "HERO_BANNER") || null;
  const processSection = sections.find(s => s.sectionType === "BOOKING_PROCESS") || null;

  const prefixUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const segments = url.split("/");
    if (segments.length > 1 && ["vi", "en", "ko", "ru"].includes(segments[1])) return url;
    return `/${language}${url === "/" ? "" : url}`;
  };

  const [tripType, setTripType] = useState<"one-way" | "return">("one-way");
  const [dateValue, setDateValue] = useState<DateValue | null>(null);
  const [timeValue, setTimeValue] = useState<TimeValue>({ hour: 8, minute: 0, period: "AM" });
  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");

  useEffect(() => {
    const tripTypeParam = searchParams.get("tripType");
    if (tripTypeParam === "return" || tripTypeParam === "one-way") {
      setTripType(tripTypeParam);
    }
    const dateParam = searchParams.get("date");
    if (dateParam) {
      try {
        setDateValue(parseDate(dateParam));
      } catch {}
    }
    const routeIdParam = searchParams.get("routeId");
    if (routeIdParam) {
      setSelectedRouteId(Number(routeIdParam));
    }
    const pickupParam = searchParams.get("pickup") || searchParams.get("pickupAddress");
    if (pickupParam) setPickupAddress(pickupParam);
    const dropoffParam = searchParams.get("dropoff") || searchParams.get("dropoffAddress");
    if (dropoffParam) setDropoffAddress(dropoffParam);
  }, [searchParams]);

  const [routes, setRoutes] = useState<IntercityRouteDto[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [departureTimes, setDepartureTimes] = useState<IntercityDepartureTimeDto[]>([]);
  const [selectedDepartureTime, setSelectedDepartureTime] = useState<string>("");

  const [fieldErrors, setFieldErrors] = useState<{
    route?: string;
    date?: string;
    time?: string;
    pickupAddress?: string;
    dropoffAddress?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  }>({});

  const currentDate = today(getLocalTimeZone());
  const isDateInvalid = dateValue != null && dateValue.compare(currentDate) < 0;

  const formatPrice = useCallback((value: number) => _formatPrice(value, language), [language]);

  const getRouteName = useCallback((route: IntercityRouteDto) => {
    const tr = route.translations?.find((t) => t.locale === language);
    if (tr?.name) return tr.name;
    return `${route.originCity} ⇌ ${route.destinationCity}`;
  }, [language]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getActiveIntercityRoutes();
        if (!active) return;
        const data = (res?.data ?? []) as IntercityRouteDto[];
        setRoutes(data);
        if (data.length > 0 && selectedRouteId === null) {
          setSelectedRouteId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load intercity routes:", err);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (selectedRouteId === null) {
        setDepartureTimes([]);
        setSelectedDepartureTime("");
        return;
      }
      try {
        const route = routes.find((r) => r.id === selectedRouteId);
        if (!route?.hasDepartureTimes) {
          setDepartureTimes([]);
          setSelectedDepartureTime("");
          return;
        }
        const res = await getActiveDepartureTimes(selectedRouteId);
        if (!active) return;
        const data = (res?.data ?? []) as IntercityDepartureTimeDto[];
        setDepartureTimes(data);
        if (data.length > 0) {
          setSelectedDepartureTime(data[0].departureTime);
        }
      } catch (err) {
        console.error("Failed to load departure times:", err);
        setDepartureTimes([]);
        setSelectedDepartureTime("");
      }
    })();
    return () => { active = false; };
  }, [selectedRouteId, routes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: typeof fieldErrors = {};

    const route = routes.find((r) => r.id === selectedRouteId);
    if (!route) {
      errors.route = t.rentCar.selectRouteError || t.errors.routeRequired;
    }

    if (!dateValue || isDateInvalid) {
      errors.date = t.rentCar.dateError || t.errors.dateRequired;
    }

    const useFixedTime = route?.hasDepartureTimes && selectedDepartureTime;
    if (route?.hasDepartureTimes && !selectedDepartureTime) {
      errors.time = t.errors.timeRequired;
    }

    if (!pickupAddress.trim()) {
      errors.pickupAddress = t.errors.pickupAddressRequired;
    }

    if (!dropoffAddress.trim()) {
      errors.dropoffAddress = t.errors.dropoffAddressRequired;
    }

    if (!customerName.trim()) {
      errors.customerName = t.errors.nameRequired;
    }

    if (!customerEmail.trim()) {
      errors.customerEmail = t.errors.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      errors.customerEmail = t.errors.invalidEmail;
    }

    if (!customerPhone.trim()) {
      errors.customerPhone = t.errors.phoneRequired;
    } else if (!/^[0-9+ \-\(\)]{8,15}$/.test(customerPhone.trim())) {
      errors.customerPhone = t.errors.phoneInvalid;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = Object.values(errors)[0];
      if (firstError) toast.danger(firstError);
      return;
    }

    setFieldErrors({});

    const departureDate = `${dateValue!.year}-${String(dateValue!.month).padStart(2, "0")}-${String(dateValue!.day).padStart(2, "0")}`;
    const departureTime = useFixedTime
      ? selectedDepartureTime
      : `${String(timeValue.hour).padStart(2, "0")}:${String(timeValue.minute).padStart(2, "0")}`;

    const params = new URLSearchParams({
      routeId: String(route!.id),
      tripType,
      departureDate,
      departureTime,
      departureTimeType: useFixedTime ? "fixed" : "custom",
    });
    if (customerName.trim()) params.set("customerName", customerName.trim());
    if (customerEmail.trim()) params.set("customerEmail", customerEmail.trim());
    if (customerPhone.trim()) params.set("customerPhone", customerPhone.trim());
    if (pickupAddress.trim()) params.set("pickupAddress", pickupAddress.trim());
    if (dropoffAddress.trim()) params.set("dropoffAddress", dropoffAddress.trim());
    if (notes.trim()) params.set("notes", notes.trim());

    router.push(prefixUrl(`/rent-car/confirm?${params.toString()}`));
  };

  const selectedRouteObj = routes.find((r) => r.id === selectedRouteId);

  return (
    <div className="relative flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* Hero Section */}
      <HeroBanner sections={sections} locale={language} className="rounded-none min-h-[640px]">
        <div className="w-full bg-white dark:bg-[var(--bg-surface)] p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col gap-6">
          <div className="flex bg-slate-100 dark:bg-zinc-800 p-1 rounded-full w-full border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setTripType("one-way")}
              className={`flex-1 py-2 text-xs sm:text-sm font-extrabold rounded-full transition-all cursor-pointer ${tripType === "one-way"
                ? "bg-white dark:bg-[var(--bg-card)] text-accent dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
            >
              {t.rentCar.oneWay}
            </button>
            <button
              type="button"
              onClick={() => setTripType("return")}
              className={`flex-1 py-2 text-xs sm:text-sm font-extrabold rounded-full transition-all cursor-pointer ${tripType === "return"
                ? "bg-white dark:bg-[var(--bg-card)] text-accent dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
            >
              {t.rentCar.roundTrip}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div className="flex flex-col w-full">
                <Select
                  isRequired
                  isInvalid={!!fieldErrors.route}
                  className="w-full h-full"
                  placeholder={t.rentCar.selectRoute}
                  selectedKey={selectedRouteId != null ? String(selectedRouteId) : undefined}
                  onSelectionChange={(key) => {
                    if (key) {
                      setSelectedRouteId(Number(key));
                      if (fieldErrors.route) setFieldErrors((prev) => ({ ...prev, route: undefined }));
                    }
                  }}
                >
                  <Label isRequired className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider mb-1.5 pl-1">
                    {t.rentCar.route}
                  </Label>
                  <Select.Trigger className="h-10 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 w-full">
                    <Select.Value className="text-xs sm:text-sm font-semibold truncate text-left w-full block pr-4" />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xl">
                    <ListBox>
                      {routes.map((r) => (
                        <ListBox.Item id={String(r.id)} key={r.id} textValue={getRouteName(r)} className="text-xs font-semibold px-3 py-2 hover:bg-slate-50 dark:hover:bg-[var(--bg-card)] rounded-lg cursor-pointer">
                          {getRouteName(r)}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                  {fieldErrors.route ? (
                    <FieldError className="text-[10px] sm:text-[11px] text-red-500 mt-1 pl-1">
                      {fieldErrors.route}
                    </FieldError>
                  ) : (
                    <Description className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-1">
                      {selectedRouteObj?.distanceKm
                        ? `${selectedRouteObj.distanceKm} km ~ ${selectedRouteObj.estimatedHours || ""}h`
                        : t.rentCar.departure}
                    </Description>
                  )}
                </Select>
              </div>

              <div className="flex flex-col w-full">
                <DatePicker
                  isRequired
                  className="w-full"
                  isInvalid={isDateInvalid || !!fieldErrors.date}
                  minValue={currentDate}
                  name="date"
                  value={dateValue}
                  onChange={(val) => {
                    setDateValue(val);
                    if (fieldErrors.date) setFieldErrors((prev) => ({ ...prev, date: undefined }));
                  }}
                >
                  <Label isRequired className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider mb-1.5 pl-1">
                    {t.rentCar.date}
                  </Label>
                  <DateField.Group fullWidth className="h-10 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex items-center justify-between">
                    <DateField.Input className="text-xs font-semibold bg-transparent border-none outline-none">
                      {(segment) => <DateField.Segment segment={segment} />}
                    </DateField.Input>
                    <DateField.Suffix>
                      <DatePicker.Trigger className="cursor-pointer">
                        <DatePicker.TriggerIndicator />
                      </DatePicker.Trigger>
                    </DateField.Suffix>
                  </DateField.Group>
                  <FieldError className="text-[10px] sm:text-[11px] text-red-500 mt-1 pl-1">
                    {fieldErrors.date || t.rentCar.dateError}
                  </FieldError>
                  <DatePicker.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-50">
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
              </div>

              {routes.find((r) => r.id === selectedRouteId)?.hasDepartureTimes && departureTimes.length > 0 ? (
                <div className="flex flex-col w-full">
                  <Select
                    isRequired
                    isInvalid={!!fieldErrors.time}
                    className="w-full"
                    placeholder={t.rentCar.selectTime}
                    selectedKey={selectedDepartureTime || undefined}
                    onSelectionChange={(key) => {
                      if (key) {
                        setSelectedDepartureTime(String(key));
                        if (fieldErrors.time) setFieldErrors((prev) => ({ ...prev, time: undefined }));
                      }
                    }}
                  >
                    <Label isRequired className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider mb-1.5 pl-1">
                      {t.rentCar.time}
                    </Label>
                    <Select.Trigger className="h-10 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3">
                      <Select.Value className="text-xs sm:text-sm font-semibold" />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xl">
                      <ListBox>
                        {departureTimes.map((dt) => (
                          <ListBox.Item key={dt.departureTime} id={dt.departureTime} textValue={dt.departureTime} className="text-xs font-semibold px-3 py-2 hover:bg-slate-50 dark:hover:bg-[var(--bg-card)] rounded-lg cursor-pointer">
                            {dt.departureTime}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                    {fieldErrors.time && (
                      <FieldError className="text-[10px] sm:text-[11px] text-red-500 mt-1 pl-1">
                        {fieldErrors.time}
                      </FieldError>
                    )}
                  </Select>
                </div>
              ) : (
                <div className="flex flex-col w-full">
                  <TimePicker
                    labelClassName="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider mb-1.5 pl-1 block text-slate-800 dark:text-slate-100"
                    value={timeValue}
                    onChange={setTimeValue}
                    label={t.rentCar.time}
                    language={language}
                    popoverTitle="Chọn giờ xuất phát"
                    triggerClassName="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3"
                    isRequired
                  />
                </div>
              )}

            </div>

            {/* Pickup & Dropoff Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <TextField isRequired isInvalid={!!fieldErrors.pickupAddress} className="w-full">
                <Label isRequired className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider pl-1">
                  {t.rentCar.pickupAddress}
                </Label>
                <Input
                  type="text"
                  placeholder={t.rentCar.pickupAddressPlaceholder}
                  value={pickupAddress}
                  onChange={(e) => {
                    setPickupAddress(e.target.value);
                    if (fieldErrors.pickupAddress) setFieldErrors((prev) => ({ ...prev, pickupAddress: undefined }));
                  }}
                  className="text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-zinc-900"
                />
                {fieldErrors.pickupAddress && (
                  <FieldError className="text-[10px] sm:text-[11px] text-red-500 mt-1 pl-1">
                    {fieldErrors.pickupAddress}
                  </FieldError>
                )}
              </TextField>
              <TextField isRequired isInvalid={!!fieldErrors.dropoffAddress} className="w-full">
                <Label isRequired className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider pl-1">
                  {t.rentCar.dropoffAddress}
                </Label>
                <Input
                  type="text"
                  placeholder={t.rentCar.dropoffAddressPlaceholder}
                  value={dropoffAddress}
                  onChange={(e) => {
                    setDropoffAddress(e.target.value);
                    if (fieldErrors.dropoffAddress) setFieldErrors((prev) => ({ ...prev, dropoffAddress: undefined }));
                  }}
                  className="text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-zinc-900"
                />
                {fieldErrors.dropoffAddress && (
                  <FieldError className="text-[10px] sm:text-[11px] text-red-500 mt-1 pl-1">
                    {fieldErrors.dropoffAddress}
                  </FieldError>
                )}
              </TextField>
            </div>

            <div className="space-y-3">
              <Typography.Heading level={5} className="font-extrabold text-slate-900 dark:text-white pl-1">
                {t.rentCar.contactInfo}
              </Typography.Heading>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <TextField isRequired isInvalid={!!fieldErrors.customerName} className="w-full">
                  <Label isRequired className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider pl-1">
                    {t.rentCar.fullName}
                  </Label>
                  <Input
                    type="text"
                    placeholder={t.common.name}
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (fieldErrors.customerName) setFieldErrors((prev) => ({ ...prev, customerName: undefined }));
                    }}
                    className="text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-zinc-900"
                  />
                  {fieldErrors.customerName && (
                    <FieldError className="text-[10px] sm:text-[11px] text-red-500 mt-1 pl-1">
                      {fieldErrors.customerName}
                    </FieldError>
                  )}
                </TextField>
                <TextField isRequired isInvalid={!!fieldErrors.customerEmail} className="w-full">
                  <Label isRequired className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider pl-1">
                    Email
                  </Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={customerEmail}
                    onChange={(e) => {
                      setCustomerEmail(e.target.value);
                      if (fieldErrors.customerEmail) setFieldErrors((prev) => ({ ...prev, customerEmail: undefined }));
                    }}
                    className="text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-zinc-900"
                  />
                  {fieldErrors.customerEmail && (
                    <FieldError className="text-[10px] sm:text-[11px] text-red-500 mt-1 pl-1">
                      {fieldErrors.customerEmail}
                    </FieldError>
                  )}
                </TextField>
                <TextField isRequired isInvalid={!!fieldErrors.customerPhone} className="w-full">
                  <Label isRequired className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider pl-1">
                    {t.rentCar.phone}
                  </Label>
                  <Input
                    type="tel"
                    placeholder="0901 234 567"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      if (fieldErrors.customerPhone) setFieldErrors((prev) => ({ ...prev, customerPhone: undefined }));
                    }}
                    className="text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-zinc-900"
                  />
                  {fieldErrors.customerPhone && (
                    <FieldError className="text-[10px] sm:text-[11px] text-red-500 mt-1 pl-1">
                      {fieldErrors.customerPhone}
                    </FieldError>
                  )}
                </TextField>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 pl-1">
                {`${t.rentCar.notes}`}
              </label>
              <TextArea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.rentCar.notesPlaceholder}
                className="w-full h-16 p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-semibold outline-none resize-none focus:border-accent transition-colors"
              />
            </div>

            <Button
              type="submit"
              isDisabled={isDateInvalid || !dateValue}
              className="w-full h-11 sm:h-12 rounded-2xl font-black text-sm sm:text-base bg-accent text-white hover:bg-accent-hover shadow-md gap-2 border-none cursor-pointer"
            >
              <span>{t.common.bookNow}</span>
              <ArrowRight size={16} />
            </Button>

          </form>
        </div>
      </HeroBanner>

      {/* Routes Listing */}
      {routes.length > 0 && (
        <section className="w-full py-16 bg-white dark:bg-black border-t border-slate-100 dark:border-slate-900">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100">
                {t.rentCar.intercityRoutes}
              </h2>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">
                {t.rentCar.intercityRoutesDesc}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {routes.map((route) => {
                const routeName = getRouteName(route);
                const thumbUrl = route.thumbnailUrl
                  ? (route.thumbnailUrl.startsWith("http") ? route.thumbnailUrl : `${backendUrl}${route.thumbnailUrl}`)
                  : "";
                return (
                  <div
                    key={route.id}
                    className="group relative bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden hover:border-accent hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col md:flex-row"
                    onClick={() => router.push(prefixUrl(`/rent-car/${route.id}`))}
                  >
                    {/* Thumbnail */}
                    <div className="relative h-40 md:h-auto md:w-36 shrink-0 overflow-hidden">
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={routeName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-accent/10 flex items-center justify-center">
                          <MapPin size={24} className="text-accent/40" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                      <div className="space-y-2">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight truncate">
                          {routeName}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold truncate">
                          {route.originCity} → {route.destinationCity}
                        </p>

                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold text-slate-400">
                          {route.distanceKm && <span>{route.distanceKm} km</span>}
                          {route.estimatedHours && <span>~{route.estimatedHours}h</span>}
                          {route.hasDepartureTimes && route.departureTimes?.length > 0 && (
                            <span>{route.departureTimes.length} {t.rentCar.tripsPerDay}</span>
                          )}
                        </div>

                        {route.prices && route.prices.length > 0 && (
                          <p className="text-xs font-black text-accent">
                            {t.rentCar.priceFrom}{" "}
                            {formatPrice(Math.min(...route.prices.filter(p => p.active).map(p => calcIntercityPrice(route.distanceKm, p.perKmAmount, false))))}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-white px-2 py-0.5 rounded-full transition-colors group-hover:bg-accent">
                          {t.rentCar.viewDetails}
                        </span>
                        {/* <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full group-hover:bg-accent group-hover:text-white transition-colors">
                          {t.rentCar.viewRepresentativeVehicles}
                        </span> */}
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center pt-6">
              <Button
                onClick={() => router.push(prefixUrl("/rent-car/routes"))}
                className="px-6 py-2.5 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-black hover:bg-slate-50 dark:hover:bg-[var(--bg-surface)] shadow-sm cursor-pointer gap-2"
              >
                {t.rentCar.viewAllRoutes}
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Benefits Section */}
      <section className="w-full py-20 bg-slate-50/50 dark:bg-black/10 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100">
              {t.rentCar.benefitsTitle}
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              {heroSection?.translations?.find(tr => tr.locale === language)?.description
                || t.rentCar.heroDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-black/20 dark:border-white/10 p-6 rounded-3xl border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] flex flex-col gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-accent"><MapPin size={20} /></div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-200">{t.rentCar.benefit1Title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{t.rentCar.benefitDesc1}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-black/20 dark:border-white/10 p-6 rounded-3xl border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] flex flex-col gap-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600"><Car size={20} /></div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-200">{t.rentCar.benefit2Title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{t.rentCar.benefitDesc2}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-black/20 dark:border-white/10 p-6 rounded-3xl border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] flex flex-col gap-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600"><ShieldCheck size={20} /></div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-slate-855 dark:text-slate-200">{t.rentCar.benefit3Title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{t.rentCar.benefitDesc3}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-black/20 dark:border-white/10 p-6 rounded-3xl border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] flex flex-col gap-4">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600"><HomeIcon size={20} /></div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-200">{t.rentCar.benefit4Title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{t.rentCar.benefitDesc4}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-black/20 dark:border-white/10 p-6 rounded-3xl border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] sm:col-span-2 flex flex-col gap-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600"><ClockIcon size={20} /></div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-200">{t.rentCar.benefit5Title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{t.rentCar.benefitDesc5}</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl overflow-hidden shadow-sm relative h-full min-h-[300px] flex flex-col justify-end p-6">
              <img
                src="/dcar-2.jpg"
                alt="Luxury limousine Dcar"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
              <div className="space-y-2 relative z-10">
                <h4 className="text-white font-extrabold text-sm">{t.rentCar.luxuryTitle}</h4>
                <p className="text-slate-200 text-[10px] leading-relaxed">{t.rentCar.luxuryDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Process Section */}
      {processSection && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <BookingProcessSection section={processSection} locale={language} />
        </section>
      )}

      {/* FAQ Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 sm:pb-16">
        <FaqSection
          title={t.rentCar.faqTitle}
          description={t.rentCar.faqDesc}
          categories={[
            {
              title: t.rentCar.faqBooking,
              items: [
                { title: t.rentCar.faqBookingHow, content: t.rentCar.faqBookingHowAnswer },
                { title: t.rentCar.faqBookingCancel, content: t.rentCar.faqBookingCancelAnswer }
              ]
            },
            {
              title: t.rentCar.faqPayment,
              items: [{ title: t.rentCar.faqPaymentHow, content: t.rentCar.faqPaymentHowAnswer }]
            },
            {
              title: t.rentCar.faqDeparture,
              items: [{ title: t.rentCar.faqDepartureWhen, content: t.rentCar.faqDepartureWhenAnswer }]
            }
          ]}
        />
      </section>


    </div>
  );
}
