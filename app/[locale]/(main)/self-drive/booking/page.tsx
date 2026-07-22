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
  toast
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
import { getActiveRentals, createBooking, getRentalPricesByRental, type RentalPriceDto } from "@/lib/api/rental";
import { getVehicleCategories, type VehicleCategoryDto } from "@/lib/api/fleet";
import BookingConfirmationModal from "@/components/BookingConfirmationModal";

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

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showContactMenu, setShowContactMenu] = useState(false);

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

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

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
      const startTime = `${String(timeValue.hour).padStart(2, "0")}:${String(timeValue.minute).padStart(2, "0")}`;

      const dynamicDetails = JSON.stringify({
        vehicleCategoryId: selectedVehicle.vehicleCategoryId,
        rentalId: selectedVehicle.rentalId,
        startDate,
        startTime,
        rentalDays,
        basePrice: selectedVehicle.pricePerDay,
        totalPrice: price,
        deposit: selectedVehicle.deposit,
        pickupLocation,
        vehicleName: selectedVehicle.name
      });

      const res = await createBooking({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || `${customerPhone.trim()}@traveler.com`,
        customerPhone: customerPhone.trim(),
        customerNotes: notes.trim() || (vi ? `Thuê xe tự lái - ${selectedVehicle.name}` : `Self-drive rental - ${selectedVehicle.name}`),
        items: [{
          serviceId: 103,
          quantity: rentalDays,
          unitPrice: selectedVehicle.pricePerDay,
          dynamicDetails,
          pickupLocation
        }]
      });

      if (res?.data?.bookingCode) {
        setBookingSuccess(res.data.bookingCode);
        toast.success(vi ? `Đặt xe thành công! Mã đặt: ${res.data.bookingCode}` : `Booking successful! Code: ${res.data.bookingCode}`);
      }
    } catch (err) {
      console.error("Booking failed:", err);
      toast.danger(t.selfDrive.toastFailed);
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
              <div className="bg-white dark:bg-black rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 text-center space-y-5 animate-fade-in-up">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 space-y-3">
                  <CheckCircle size={32} className="text-green-600 dark:text-green-400 mx-auto" />
                  <h3 className="text-base font-extrabold text-green-800 dark:text-green-200">
                    {t.selfDrive.bookingSuccess}
                  </h3>
                  <div className="bg-white dark:bg-black/40 rounded-xl px-5 py-3 border border-green-100 dark:border-green-800/40 inline-block">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                      {t.selfDrive.bookingCode}
                    </p>
                    <p className="text-xl font-black font-mono text-slate-800 dark:text-white tracking-wider">
                      {bookingSuccess}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t.selfDrive.bookingSuccessDesc}
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => { setBookingSuccess(null); }} variant="outline" className="text-xs font-bold cursor-pointer">
                    {t.selfDrive.bookAnother}
                  </Button>
                  <Button onClick={() => router.push(`/${language}/self-drive`)} className="text-xs font-bold cursor-pointer bg-accent text-white border-none">
                    {t.selfDrive.viewFleet}
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white dark:bg-black rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">

                <div className="space-y-1 pb-4 border-b border-slate-100 dark:border-slate-850">
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider text-accent">
                    ⚡ {t.selfDrive.serviceType}
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
                            <ListBox.Item id={v.id} key={v.id} textValue={v.name} className="text-xs font-semibold px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg cursor-pointer">
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
                  <div className="flex flex-col w-full">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">
                      {t.common.date} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={currentDate.toString()}
                      value={dateValue ? `${dateValue.year}-${String(dateValue.month).padStart(2, "0")}-${String(dateValue.day).padStart(2, "0")}` : ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        const [y, m, d] = val.split("-").map(Number);
                        import("@internationalized/date").then(({ CalendarDate }) => {
                          setDateValue(new CalendarDate(y, m, d));
                        });
                      }}
                      className="h-10 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs font-semibold outline-none focus:border-accent transition-colors"
                    />
                  </div>

                  <TimePicker
                    label={t.common.time}
                    labelClassName="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1"
                    value={timeValue}
                    onChange={setTimeValue}
                    popoverTitle={t.selfDrive.confirmTime}
                    language={language}
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
                      onFill={(d) => { setCustomerName(d.fullname); setCustomerPhone(d.phone); setCustomerEmail(d.email); }}
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
                        <Skeleton className="w-24 h-5 rounded-lg bg-slate-200 dark:bg-slate-800" />
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

      {/* Floating contact */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {showContactMenu && (
          <div className="bg-white dark:bg-slate-850 border border-slate-250 dark:border-slate-700 rounded-2xl shadow-2xl p-2.5 w-44 flex flex-col gap-2 animate-fade-in-up">
            <a href={`tel:${contacts.phone}`} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-accent/10 hover:text-accent transition-colors no-underline">
              <Phone size={14} className="text-accent" />
              <span>{`${t.common.callNow} ${contacts.phone}`}</span>
            </a>
            <a href={contacts.zalo.startsWith("http") ? contacts.zalo : `https://zalo.me/${contacts.zalo}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-accent/10 hover:text-accent transition-colors no-underline border-t border-slate-100 dark:border-slate-800">
              <span className="text-accent">💬</span>
              <span>Zalo Tư vấn</span>
            </a>
            {contacts.kakaotalk && (
              <a href={contacts.kakaotalk.startsWith("http") ? contacts.kakaotalk : `https://pf.kakao.com/${contacts.kakaotalk}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-accent/10 hover:text-accent transition-colors no-underline border-t border-slate-100 dark:border-slate-800">
                <span className="text-accent">💛</span>
                <span>KakaoTalk</span>
              </a>
            )}
            {contacts.whatsapp && (
              <a href={contacts.whatsapp.startsWith("http") ? contacts.whatsapp : `https://wa.me/${contacts.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-accent/10 hover:text-accent transition-colors no-underline border-t border-slate-100 dark:border-slate-800">
                <span className="text-accent">💚</span>
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        )}
        <button
          onClick={() => setShowContactMenu(!showContactMenu)}
          className={`p-4 rounded-full border shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer flex items-center justify-center border-none ${showContactMenu ? "bg-accent text-white" : "bg-white dark:bg-black text-accent dark:text-white"}`}
          aria-label="Contact Support"
        >
          <span className="text-lg">🎧</span>
        </button>
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="p-4 rounded-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-accent dark:text-white shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer animate-bounce-subtle flex items-center justify-center"
            aria-label="Back to Top"
          >
            <ArrowLeft size={22} className="rotate-90" />
          </button>
        )}
      </div>
    </div>
  );
}
