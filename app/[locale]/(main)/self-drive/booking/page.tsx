"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  Label,
  ListBox,
  Button,
  Skeleton,
  Input,
  TextField,
  DatePicker,
  DateField,
  Calendar,
  FieldError
} from "@heroui/react";
import { DateValue } from "@internationalized/date";
import { getLocalTimeZone, today, parseDate } from "@internationalized/date";
import {
  Car,
  MapPin,
  CalendarDays,
  User,
  Phone,
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle
} from "lucide-react";

import { TimePicker, type TimeValue } from "@/components/time-picker";
import { useI18n } from "@/context/LanguageContext";
import { useAuthStore } from "@/lib/store/authStore";
import { AutofillButton } from "@/components/AutofillButton";
import { getActiveRentals, getRentalPricesByRental, type RentalPriceDto } from "@/lib/api/rental";
import { createSelfDriveBooking } from "@/lib/api/self-drive/bookings";
import { getVehicleCategories, type VehicleCategoryDto } from "@/lib/api/fleet";
import BookingConfirmationModal from "@/components/BookingConfirmationModal";
import SuccessOverlay from "@/components/SuccessOverlay";
import ErrorOverlay from "@/components/ErrorOverlay";

interface Vehicle {
  id: string;
  rentalId: number;
  vehicleCategoryId: number;
  name: string;
  desc: string;
  pricePerDay: number;
  deposit: number;
  minimumDays: number;
  capacity: string;
}

export default function SelfDriveBookingPage() {
  const { language, t, contacts } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const vi = language === "vi";
  const user = useAuthStore((s) => s.user);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [selectedVehicleKey, setSelectedVehicleKey] = useState<string | undefined>();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [zaloId, setZaloId] = useState("");
  const [kakaoTalkId, setKakaoTalkId] = useState("");
  const [dateValue, setDateValue] = useState<DateValue | null>(null);
  const [timeValue, setTimeValue] = useState<TimeValue>({ hour: 8, minute: 0, period: "AM" });
  const [rentalDays, setRentalDays] = useState<number>(1);
  const [pickupLocation, setPickupLocation] = useState("");
  const [notes, setNotes] = useState("");

  const [price, setPrice] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const currentDate = today(getLocalTimeZone());
  const isDateInvalid = dateValue != null && dateValue.compare(currentDate) < 0;

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleKey) || vehicles[0];

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [rentalsRes, categoriesRes] = await Promise.all([
          getActiveRentals({ skipTranslationFilter: true }),
          getVehicleCategories({ active: true }, { skipTranslationFilter: true })
        ]);
        if (!active) return;

        const rentals = rentalsRes?.data || [];
        const categories = categoriesRes?.data?.content || [];
        const catMap = new Map<number, VehicleCategoryDto>();
        categories.forEach(c => catMap.set(c.id, c));

        const priceResults = await Promise.all(
          rentals.filter(r => !r.driverRequired).map(r =>
            getRentalPricesByRental(r.id).then(res => ({
              rentalId: r.id,
              prices: (res?.data || []) as RentalPriceDto[]
            })).catch(() => ({ rentalId: r.id, prices: [] as RentalPriceDto[] }))
          )
        );
        const priceMap = new Map<number, RentalPriceDto[]>();
        priceResults.forEach(p => priceMap.set(p.rentalId, p.prices));

        const mapped: Vehicle[] = rentals
          .filter(r => !r.driverRequired)
          .map(r => {
            const cat = catMap.get(r.vehicleCategoryId);
            const trans = cat?.translations?.find(t => t.locale === language)
              || cat?.translations?.find(t => t.locale === "en")
              || cat?.translations?.find(t => t.locale === "vi")
              || cat?.translations?.[0];
            const name = trans?.name
              || cat?.translations?.find(t => t.locale === "en")?.name
              || cat?.translations?.find(t => t.locale === "vi")?.name
              || "Phân khúc xe";
            const desc = trans?.description
              || cat?.translations?.find(t => t.locale === "en")?.description
              || cat?.translations?.find(t => t.locale === "vi")?.description
              || "";
            const rentalPrices = priceMap.get(r.id) || [];
            const activePrice = rentalPrices.find(p => p.active && p.vehicleCategoryId === r.vehicleCategoryId);
            const dailyRate = activePrice ? Number(activePrice.amount) : 0;
            const capacity = cat ? `${cat.minSeat}-${cat.maxSeat}` : "5";

            return {
              id: `${r.id}-${r.vehicleCategoryId}`,
              rentalId: r.id,
              vehicleCategoryId: r.vehicleCategoryId,
              name,
              desc,
              pricePerDay: dailyRate,
              deposit: r.deposit || 0,
              minimumDays: r.minimumDays || 1,
              capacity
            };
          });

        if (!active) return;
        setVehicles(mapped);

        const vehicleIdParam = searchParams.get("vehicleId");
        const match = vehicleIdParam && mapped.find(v => v.id === vehicleIdParam);
        setSelectedVehicleKey(match ? match.id : mapped[0]?.id);
      } catch (err) {
        console.error("Failed to load vehicles:", err);
      } finally {
        setVehiclesLoading(false);
      }
    })();
    return () => { active = false; };
  }, [language, vi, searchParams]);

  useEffect(() => {
    if (!selectedVehicle || !selectedVehicle.pricePerDay) { setPrice(0); return; }
    setIsCalculating(true);
    const timer = setTimeout(() => {
      setPrice(selectedVehicle.pricePerDay * rentalDays);
      setIsCalculating(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedVehicle, rentalDays]);

  useEffect(() => {
    if (user) {
      const nameParam = searchParams.get("customerName");
      const phoneParam = searchParams.get("customerPhone");
      if (user.fullname && !customerName && !nameParam) setCustomerName(user.fullname);
      if (user.email && !customerEmail) setCustomerEmail(user.email);
      if (user.phone && !customerPhone && !phoneParam) setCustomerPhone(user.phone);
    }
  }, [user, searchParams]);

  useEffect(() => {
    const pickupDateParam = searchParams.get("pickupDate");
    if (pickupDateParam) {
      try {
        setDateValue(parseDate(pickupDateParam));
      } catch (e) {
        console.error("Failed to parse pickupDate from URL:", e);
      }
    }

    const daysParam = searchParams.get("days");
    if (daysParam) {
      const days = parseInt(daysParam, 10);
      if (!isNaN(days) && days > 0) {
        setRentalDays(days);
      }
    }

    const nameParam = searchParams.get("customerName");
    if (nameParam) {
      setCustomerName(nameParam);
    }

    const phoneParam = searchParams.get("customerPhone");
    if (phoneParam) {
      setCustomerPhone(phoneParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDateInvalid || !dateValue || isSubmitting || !customerName.trim() || !customerPhone.trim() || !selectedVehicle) return;
    setShowConfirmModal(true);
  };

  const handleConfirmBooking = async () => {
    if (isDateInvalid || !dateValue || isSubmitting || !customerName.trim() || !customerPhone.trim() || !selectedVehicle) return;

    setIsSubmitting(true);
    try {
      const startDate = `${dateValue.year}-${String(dateValue.month).padStart(2, "0")}-${String(dateValue.day).padStart(2, "0")}`;
      const end = new Date(dateValue.year, dateValue.month - 1, dateValue.day + rentalDays);
      const endDate = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;

      const res = await createSelfDriveBooking({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || `${customerPhone.trim()}@traveler.com`,
        customerPhone: customerPhone.trim(),
        customerNotes: `[Zalo: ${zaloId}] [KakaoTalk: ${kakaoTalkId}] ${notes.trim() || (vi ? `Thuê xe tự lái - ${selectedVehicle.name}` : `Self-drive rental - ${selectedVehicle.name}`)}`,
        vehicleCategoryId: selectedVehicle.vehicleCategoryId,
        zaloId: zaloId || undefined,
        kakaoTalkId: kakaoTalkId || undefined,
        contactChannel: zaloId ? "zalo" : kakaoTalkId ? "kakaotalk" : undefined,
        contactId: zaloId || kakaoTalkId || undefined,
        startDate,
        endDate,
        rentalDays,
        pickupLocation,
        basePrice: selectedVehicle.pricePerDay,
        deposit: selectedVehicle.deposit,
        totalPrice: price,
      });

      if (res?.data?.bookingCode) {
        setBookingSuccess(res.data.bookingCode);
      } else {
        setErrorMessage(t.errors.bookingFailed);
      }
    } catch (err) {
      console.error("Booking failed:", err);
      setErrorMessage(err instanceof Error ? err.message : t.errors.bookingFailed);
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 font-sans">


      {/* Hero */}
      <section className="relative w-full min-h-[340px] flex items-center pt-28 pb-14 px-6 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-[1px]" />
        <div className="relative z-10 max-w-7xl w-full mx-auto space-y-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 bg-white/10 dark:bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white hover:bg-white/20 transition-colors cursor-pointer border border-white/20"
          >
            <ArrowLeft size={13} />
            {t.selfDrive.back}
          </button>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            {t.selfDrive.heroTitle}
          </h1>
          <p className="text-sm text-slate-200 font-medium max-w-xl">
            {t.selfDrive.heroSubtitle}
          </p>
        </div>
      </section>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left: Form */}
          <div className="lg:col-span-8 space-y-6">

            {bookingSuccess ? (
              <SuccessOverlay
                bookingCode={bookingSuccess}
                onComplete={() => { setBookingSuccess(null); router.push(`/${language}/self-drive/success?bookingCode=${bookingSuccess}`); }}
                title={t.selfDrive.confirmSuccessTitle}
                subtitle={t.selfDrive.redirecting}
              />
            ) : (
              <form onSubmit={handleSubmit} className="bg-white dark:bg-black rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">

                <div className="space-y-1 pb-4 border-b border-slate-100 dark:border-slate-850">
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider text-accent">
                    {t.selfDrive.serviceType}
                  </span>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    {t.selfDrive.bookingDetails}
                  </h2>
                </div>

                {/* Vehicle Select */}
                <div className="space-y-2">
                  {vehiclesLoading ? (
                    <Skeleton className="h-14 w-full rounded-xl" />
                  ) : (
                    <Select
                      className="w-full"
                      placeholder={t.selfDrive.selectVehiclePlaceholder}
                      selectedKey={selectedVehicleKey}
                      onSelectionChange={(key) => { if (key) setSelectedVehicleKey(String(key)); }}
                    >
                      <Label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-slate-500 mb-1.5 pl-1">
                        {t.selfDrive.desiredVehicle}
                      </Label>
                      <Select.Trigger className="h-10 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl px-3">
                        <Select.Value className="text-xs font-semibold" />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xl">
                        <ListBox>
                          {vehicles.map((v) => (
                            <ListBox.Item id={v.id} key={v.id} textValue={v.name} className="text-xs font-semibold px-3 py-2 hover:bg-slate-50 dark:hover:bg-[var(--bg-card)] rounded-lg cursor-pointer">
                              <span className="flex items-center gap-2">
                                <Car size={14} className="text-slate-400" />
                                {v.name}
                                {v.pricePerDay > 0 && (
                                  <span className="text-slate-400 font-bold">
                                    ({v.pricePerDay.toLocaleString("vi-VN")}đ/{t.selfDrive.perTrip})
                                  </span>
                                )}
                              </span>
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  )}
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DatePicker
                    className="w-full"
                    value={dateValue}
                    onChange={(v) => setDateValue(v)}
                    minValue={today(getLocalTimeZone())}
                    isRequired
                  >
                    <Label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">
                      {t.common.date}
                    </Label>
                    <DateField.Group className="h-10 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex items-center justify-between">
                      <DateField.Input className="text-xs font-semibold bg-transparent border-none outline-none">
                        {(segment) => <DateField.Segment segment={segment} />}
                      </DateField.Input>
                      <DateField.Suffix>
                        <DatePicker.Trigger className="cursor-pointer">
                          <DatePicker.TriggerIndicator />
                        </DatePicker.Trigger>
                      </DateField.Suffix>
                    </DateField.Group>
                    <FieldError className="text-[9px] text-red-500 mt-1 pl-1" />
                    <DatePicker.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-50">
                      <Calendar aria-label="Pickup date">
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
                      </Calendar>
                    </DatePicker.Popover>
                  </DatePicker>

                  <TimePicker
                    label={t.common.time}
                    labelClassName="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1"
                    value={timeValue}
                    onChange={setTimeValue}
                    popoverTitle={t.selfDrive.confirmTime}
                    language={language}
                    isRequired
                    triggerClassName="mt-0.75 bg-white dark:bg-zinc-900 border-2 h-10.5"
                  />
                </div>

                {/* Rental Days */}
                <div className="flex flex-col w-full">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">
                    {t.selfDrive.rentalDays} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center h-10 border border-slate-200 dark:border-slate-800 rounded-xl px-3 bg-white dark:bg-black focus-within:border-accent/50 transition-colors">
                    <CalendarDays size={16} className="text-slate-400 mr-2 shrink-0" />
                    <input
                      type="number"
                      required
                      min={selectedVehicle?.minimumDays || 1}
                      max={90}
                      value={rentalDays}
                      onChange={(e) => setRentalDays(Math.max(selectedVehicle?.minimumDays || 1, parseInt(e.target.value) || 1))}
                      className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
                    />
                    <span className="text-xs font-extrabold text-slate-400 shrink-0 ml-1">
                      {t.selfDrive.perTrip}
                    </span>
                  </div>
                </div>

                {/* Delivery Location */}
                <div className="flex flex-col w-full">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">
                    {t.selfDrive.pickupLocationLabel} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center h-10 border border-slate-200 dark:border-slate-800 rounded-xl px-3 bg-white dark:bg-black focus-within:border-accent/50 transition-colors">
                    <MapPin size={16} className="text-slate-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      required
                      placeholder={t.selfDrive.pickupLocationPlaceholder}
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white pl-1">
                      {t.selfDrive.contactInfo}
                    </label>
                    <AutofillButton
                      onFill={(d) => { setCustomerName(d.fullname); setCustomerPhone(d.phone); setCustomerEmail(d.email); setZaloId(d.zaloId ?? ""); setKakaoTalkId(d.kakaoTalkId ?? ""); }}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <TextField isRequired className="w-full">
                      <Label className="text-[10px] font-extrabold uppercase tracking-wider">{t.common.name}</Label>
                      <Input
                        type="text"
                        placeholder={t.selfDrive.namePlaceholder}
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="text-xs font-semibold"
                      />
                    </TextField>
                    <TextField className="w-full">
                      <Label className="text-[10px] font-extrabold uppercase tracking-wider">{t.selfDrive.email}</Label>
                      <Input
                        type="email"
                        placeholder={t.selfDrive.emailPlaceholder}
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="text-xs font-semibold"
                      />
                    </TextField>
                    <TextField isRequired className="w-full">
                      <Label className="text-[10px] font-extrabold uppercase tracking-wider">{t.common.phone}</Label>
                      <Input
                        type="tel"
                        placeholder={t.selfDrive.phonePlaceholder}
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="text-xs font-semibold"
                      />
                    </TextField>
                  </div>
                </div>

                {/* Zalo & KakaoTalk ID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <TextField className="w-full">
                    <Label className="text-[10px] font-extrabold uppercase tracking-wider">{t.selfDrive.zaloId}</Label>
                    <Input
                      type="text"
                      value={zaloId}
                      onChange={(e) => setZaloId(e.target.value)}
                      placeholder="Zalo ID"
                      className="text-xs font-semibold"
                    />
                  </TextField>
                  <TextField className="w-full">
                    <Label className="text-[10px] font-extrabold uppercase tracking-wider">{t.selfDrive.kakaoTalkId}</Label>
                    <Input
                      type="text"
                      value={kakaoTalkId}
                      onChange={(e) => setKakaoTalkId(e.target.value)}
                      placeholder="KakaoTalk ID"
                      className="text-xs font-semibold"
                    />
                  </TextField>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white pl-1">
                    {t.rentCar.notes}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t.selfDrive.notesPlaceholder}
                    className="w-full h-16 p-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-black text-xs font-semibold outline-none resize-none focus:border-accent transition-colors"
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  isDisabled={isDateInvalid || !dateValue || isSubmitting || !customerName.trim() || !customerPhone.trim()}
                  className="w-full h-12 rounded-2xl font-black text-sm bg-accent text-white hover:bg-accent-hover shadow-md gap-2 border-none cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2"><Loader2 size={15} className="animate-spin" />{t.selfDrive.processing}</span>
                  ) : (
                    <span className="flex items-center gap-2"><CheckCircle size={15} />{t.selfDrive.bookNowBtn}</span>
                  )}
                </Button>

              </form>
            )}
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
            <div className="bg-white dark:bg-black rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                {t.selfDrive.bookingSummary}
              </h3>

              {vehiclesLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-32 w-full rounded-2xl" />
                  <Skeleton className="h-4 w-3/4 rounded-lg" />
                  <Skeleton className="h-4 w-1/2 rounded-lg" />
                </div>
              ) : selectedVehicle ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      <span>{t.selfDrive.vehicleLabel}</span>
                      <span className="text-slate-800 dark:text-slate-200 font-extrabold text-right max-w-[60%] truncate">{selectedVehicle.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      <span>{t.selfDrive.capacityLabel}</span>
                      <span className="text-slate-800 dark:text-slate-200 font-extrabold">{selectedVehicle.capacity} {t.selfDrive.seatsCount}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-850 pt-3 space-y-2">
                    {selectedVehicle.pricePerDay > 0 && (
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        <span>{t.selfDrive.dailyRateLabel}</span>
                        <span className="text-slate-800 dark:text-slate-200 font-extrabold">{selectedVehicle.pricePerDay.toLocaleString("vi-VN")}đ</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      <span>{t.selfDrive.durationLabel}</span>
                      <span className="text-slate-800 dark:text-slate-200 font-extrabold">{rentalDays} {t.selfDrive.perTrip}</span>
                    </div>
                    {selectedVehicle.deposit > 0 && (
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        <span>{t.selfDrive.depositLabel}</span>
                        <span className="text-slate-800 dark:text-slate-200 font-extrabold">{selectedVehicle.deposit.toLocaleString("vi-VN")}đ</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-850 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-black">{t.selfDrive.estTotalLabel}</span>
                      {isCalculating ? (
                        <Skeleton className="w-24 h-5 rounded-lg bg-slate-200 dark:bg-[var(--bg-card)]" />
                      ) : (
                        <span className="text-base font-black text-blue-700 dark:text-blue-400">{price.toLocaleString("vi-VN")}đ</span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">
                  {t.selfDrive.noVehicleSelected}
                </p>
              )}

              <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-medium">
                {t.selfDrive.guarantee}
              </p>
            </div>
          </div>

        </div>
      </main>

      {errorMessage && <ErrorOverlay message={errorMessage} onClose={() => setErrorMessage("")} />}

      <BookingConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmBooking}
        serviceType={t.selfDrive.serviceType}
        summaryItems={[
          { label: t.selfDrive.confirmName, value: selectedVehicle?.name || "" },
          { label: t.selfDrive.confirmDate, value: dateValue ? `${dateValue.year}-${String(dateValue.month).padStart(2, "0")}-${String(dateValue.day).padStart(2, "0")}` : "" },
          { label: t.selfDrive.confirmTime, value: `${String(timeValue.hour).padStart(2, "0")}:${String(timeValue.minute).padStart(2, "0")}` },
          { label: t.selfDrive.duration, value: `${rentalDays} ${vi ? "ngày" : "days"}` },
          { label: t.selfDrive.pickupLocationLabel, value: pickupLocation || "-" },
          { label: t.common.name, value: customerName },
          { label: t.common.phone, value: customerPhone },
          { label: t.selfDrive.email, value: customerEmail || "-" },
          { label: t.selfDrive.confirmNotes, value: notes || "-" },
        ]}
        totalAmount={price}
        totalLabel={t.selfDrive.estimatedTotal}
        submitting={isSubmitting}
      />


    </div>
  );
}
