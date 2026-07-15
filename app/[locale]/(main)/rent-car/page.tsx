"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  toast
} from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { getLocalTimeZone, today } from "@internationalized/date";
import {
  Car,
  MapPin,
  ShieldCheck,
  Home as HomeIcon,
  Clock as ClockIcon,
  ChevronUp,
  Phone,
  MessageCircle,
  Sparkles,
  ArrowRight,
  Headset,
  CheckCircle
} from "lucide-react";

import { TimePicker, type TimeValue } from "@/components/time-picker";
import { useI18n } from "@/context/LanguageContext";
import { getActiveIntercityRoutes, createBooking, type IntercityRouteDto } from "@/lib/api/rental";
import { getVehicleCategories, type VehicleCategoryDto } from "@/lib/api/fleet";
import { formatPrice as _formatPrice } from "@/lib/format";
import { getActiveSections, type SectionDto } from "@/lib/api/sections";

export default function RentCarPage() {
  const { language, t } = useI18n();
  const router = useRouter();
  const vi = language === "vi";

  const [tripType, setTripType] = useState<"one-way" | "return">("one-way");
  const [dateValue, setDateValue] = useState<DateValue | null>(null);
  const [timeValue, setTimeValue] = useState<TimeValue>({ hour: 8, minute: 0, period: "AM" });
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [vehicleCategories, setVehicleCategories] = useState<VehicleCategoryDto[]>([]);
  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [routes, setRoutes] = useState<IntercityRouteDto[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [price, setPrice] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [createdCode, setCreatedCode] = useState("");

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showContactMenu, setShowContactMenu] = useState(false);
  const [heroSection, setHeroSection] = useState<SectionDto | null>(null);

  const currentDate = today(getLocalTimeZone());
  const isDateInvalid = dateValue != null && dateValue.compare(currentDate) < 0;

  const formatPrice = useCallback((value: number) => _formatPrice(value, language), [language]);

  const getRouteName = useCallback((route: IntercityRouteDto) => {
    const tr = route.translations?.find((t) => t.locale === language);
    if (tr?.name) return tr.name;
    return `${route.originCity} ⇌ ${route.destinationCity}`;
  }, [language]);

  useEffect(() => {
    getActiveSections("/rent-car", language).then(sections => {
      const hero = sections.find(s => s.sectionType === "HERO_BANNER");
      if (hero) setHeroSection(hero);
    }).catch(() => { });
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
      try {
        const res = await getVehicleCategories({ active: true });
        if (!active) return;
        const data = (res?.data?.content ?? []) as VehicleCategoryDto[];
        setVehicleCategories(data);
        if (data.length > 0 && selectedCategoryId === null) {
          setSelectedCategoryId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load vehicle categories:", err);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  useEffect(() => {
    if (selectedRouteId === null || selectedCategoryId === null) return;
    setIsCalculating(true);
    const route = routes.find((r) => r.id === selectedRouteId);
    if (!route) { setPrice(0); setIsCalculating(false); return; }

    const pricing = route.prices?.find((p) => p.vehicleCategoryId === selectedCategoryId && p.active);
    if (!pricing) { setPrice(0); setIsCalculating(false); return; }

    const amount = tripType === "one-way" ? pricing.oneWayAmount : pricing.roundTripAmount;
    setPrice(amount);
    setIsCalculating(false);
  }, [selectedRouteId, tripType, selectedCategoryId, routes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDateInvalid || !dateValue || isSubmitting) return;

    const route = routes.find((r) => r.id === selectedRouteId);
    if (!route || !price || !selectedCategoryId) {
      toast.danger(vi ? "Vui lòng chọn tuyến và loại xe" : "Please select a route and vehicle type");
      return;
    }

    setIsSubmitting(true);

    const departureDate = `${dateValue.year}-${String(dateValue.month).padStart(2, "0")}-${String(dateValue.day).padStart(2, "0")}`;
    const departureTime = `${String(timeValue.hour).padStart(2, "0")}:${String(timeValue.minute).padStart(2, "0")}`;

    const selectedCat = vehicleCategories.find((c) => c.id === selectedCategoryId);
    const catName = selectedCat?.translations?.find((t) => t.locale === language)?.name || selectedCat?.code || "";

    const dynamicDetails = JSON.stringify({
      routeId: route.id,
      vehicleCategoryId: selectedCategoryId,
      tripType,
      departureDate,
      departureTime,
      basePrice: price,
      totalPrice: price,
      routeName: getRouteName(route),
      vehicleCategory: catName,
    });

    try {
      const res = await createBooking({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || `${customerPhone.trim()}@traveler.com`,
        customerPhone: customerPhone.trim(),
        customerNotes: notes.trim() || undefined,
        items: [{
          serviceId: 102,
          quantity: 1,
          unitPrice: price,
          dynamicDetails,
        }],
      });

      if (res?.data?.bookingCode) {
        setCreatedCode(res.data.bookingCode);
        setBookingSuccess(true);
        toast.success(
          vi
            ? `Đặt xe thành công! Mã đặt: ${res.data.bookingCode}`
            : `Booking successful! Code: ${res.data.bookingCode}`
        );
      }
    } catch (err) {
      console.error("Booking API error:", err);
      toast.danger(vi ? "Đặt xe thất bại. Vui lòng thử lại." : "Booking failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRouteObj = routes.find((r) => r.id === selectedRouteId);

  return (
    <div className="relative flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Self-contained CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s infinite ease-in-out;
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* Hero Section */}
      <section className="relative w-full min-h-[640px] flex items-center justify-center pt-24 pb-16 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: heroSection?.imageUrls?.[0]
              ? `url('${heroSection.imageUrls[0]}')`
              : `url('')`
          }}
        >
          <div className="absolute inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-[1px]" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-7xl w-full mx-auto px-6 flex flex-col lg:flex-row items-center gap-12 justify-between">
          {/* Hero Left Info */}
          <div className="max-w-xl text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 dark:bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
              <Sparkles size={14} className="text-accent" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-100">
                {heroSection?.translations?.find(tr => tr.locale === language)?.subtitle || "Minh Khoa Travel"}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              {heroSection?.translations?.find(tr => tr.locale === language)?.title || t.rentCar.title}
            </h1>
            <p className="text-sm md:text-base text-slate-200 leading-relaxed font-medium">
              {heroSection?.translations?.find(tr => tr.locale === language)?.description
                || (language === "vi"
                  ? "Xe riêng 4–45 chỗ – Đưa đón tận nơi – Giá tốt – Tài xế chuyên tuyến"
                  : "Comfortable, reliable, and scenic private routes across regions.")}
            </p>
          </div>

          {/* Booking Card Right */}
          <div className="w-full max-w-xl bg-white/30 dark:bg-black/20 dark:backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col gap-6">

            {/* Success Overlay */}
            {bookingSuccess && (
              <div className="space-y-4 py-2 animate-fade-in-up">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5 text-center space-y-3">
                  <CheckCircle size={28} className="text-green-600 dark:text-green-400 mx-auto" />
                  <h3 className="text-sm font-extrabold text-green-800 dark:text-green-200">
                    {vi ? "Đặt xe thành công!" : "Booking Successful!"}
                  </h3>
                  <div className="bg-white dark:bg-black/40 rounded-xl px-4 py-3 border border-green-100 dark:border-green-800/40">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                      {vi ? "Mã đặt xe" : "Booking Code"}
                    </p>
                    <p className="text-lg font-black font-mono text-slate-800 dark:text-white tracking-wider">
                      {createdCode}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {vi
                      ? "Chúng tôi sẽ liên hệ với bạn qua số điện thoại trong thời gian sớm nhất."
                      : "We will contact you via phone shortly."}
                  </p>
                </div>
                <Button
                  onClick={() => { setBookingSuccess(false); setCreatedCode(""); }}
                  className="w-full text-xs font-bold cursor-pointer"
                  variant="outline"
                >
                  {vi ? "Đặt thêm" : "Book another"}
                </Button>
              </div>
            )}

            {/* Trip Type Selector */}
            {!bookingSuccess && (
              <>
                <div className="flex bg-slate-300 dark:bg-black/40 p-1 rounded-full w-full">
                  <button
                    type="button"
                    onClick={() => setTripType("one-way")}
                    className={`flex-1 py-2 text-xs sm:text-sm font-extrabold rounded-full transition-all cursor-pointer ${tripType === "one-way"
                      ? "bg-white dark:bg-slate-800 text-accent dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                  >
                    {t.rentCar.oneWay}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTripType("return")}
                    className={`flex-1 py-2 text-xs sm:text-sm font-extrabold rounded-full transition-all cursor-pointer ${tripType === "return"
                      ? "bg-white dark:bg-slate-800 text-accent dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                  >
                    {t.rentCar.roundTrip}
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                  {/* Select Route, Date & Time Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">

                    {/* Route Selector using HeroUI Select */}
                    <div className="flex flex-col w-full">
                      <Select
                        className="w-full"
                        placeholder={language === "vi" ? "Chọn tuyến" : "Select Route"}
                        selectedKey={selectedRouteId != null ? String(selectedRouteId) : undefined}
                        onSelectionChange={(key) => {
                          if (key) setSelectedRouteId(Number(key));
                        }}
                      >
                        <Label className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-black dark:text-slate-500 mb-1.5 pl-1">
                          {t.rentCar.route}
                        </Label>
                        <Select.Trigger className="h-10 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl px-3">
                          <Select.Value className="text-xs sm:text-sm font-semibold" />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xl">
                          <ListBox>
                            {routes.map((r) => (
                              <ListBox.Item id={String(r.id)} key={r.id} textValue={getRouteName(r)} className="text-xs font-semibold px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg cursor-pointer">
                                {getRouteName(r)}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                        <Description className="text-[10px] sm:text-[11px] text-black dark:text-slate-300 mt-1 pl-1">
                          {selectedRouteObj?.distanceKm
                            ? `${selectedRouteObj.distanceKm} km ${vi ? `~ ${selectedRouteObj.estimatedHours || ""}h` : `~ ${selectedRouteObj.estimatedHours || ""}h`}`
                            : t.rentCar.departure}
                        </Description>
                      </Select>
                    </div>

                    {/* Date Picker using HeroUI DatePicker */}
                    <div className="flex flex-col w-full">
                      <DatePicker
                        isRequired
                        className="w-full"
                        isInvalid={isDateInvalid}
                        minValue={currentDate}
                        name="date"
                        value={dateValue}
                        onChange={setDateValue}
                      >
                        <Label className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-black dark:text-slate-500 mb-1.5 pl-1">
                          {t.rentCar.date}
                        </Label>
                        <DateField.Group fullWidth className="h-10 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex items-center justify-between">
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
                          {t.rentCar.dateError}
                        </FieldError>
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

                    {/* Custom Time Picker */}
                    <TimePicker
                      labelClassName="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1"
                      value={timeValue}
                      onChange={setTimeValue}
                      label={t.rentCar.time}
                      language={language}
                      popoverTitle="Chọn giờ xuất phát"
                    />

                  </div>

                  {/* Seating Capacity Selector cards */}
                  <div className="space-y-2">
                    <label className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-black dark:text-slate-500 pl-1">
                      {t.rentCar.vehicleType}
                    </label>
                    <div className="flex flex-col gap-2 sm:gap-2.5">
                      {vehicleCategories.map((cat) => {
                        const catName = cat.translations?.find((t) => t.locale === language)?.name || cat.code;
                        const catDesc = cat.translations?.find((t) => t.locale === language)?.description || "";
                        const isSelected = selectedCategoryId === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategoryId(cat.id)}
                            className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer ${isSelected
                                ? "border-accent bg-blue-50 dark:bg-blue-950/30 shadow-sm"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm"
                              }`}
                          >
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${isSelected
                                ? "bg-accent text-white"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                              }`}>
                              {cat.thumbnailUrl ? (
                                <img src={cat.thumbnailUrl} alt={catName} className="w-full h-full object-cover" />
                              ) : (
                                <>
                                  <Car size={20} className="sm:hidden" />
                                  <Car size={22} className="hidden sm:block" />
                                </>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className={`block text-sm sm:text-sm font-bold ${isSelected ? "text-accent" : "text-slate-800 dark:text-slate-100"
                                }`}>{catName}</span>
                              {catDesc && (
                                <span className="block text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{catDesc}</span>
                              )}
                            </div>
                            {isSelected && (
                              <CheckCircle size={18} className="text-accent shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-3">
                    <label className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-black dark:text-white pl-1">
                      {vi ? "Thông tin liên hệ" : "Contact Information"}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <TextField isRequired className="w-full">
                        <Label className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider">
                          {vi ? "Họ và tên" : "Full Name"}
                        </Label>
                        <Input
                          type="text"
                          placeholder={vi ? "Nguyễn Văn A" : "John Doe"}
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="text-xs sm:text-sm font-semibold"
                        />
                      </TextField>
                      <TextField isRequired className="w-full">
                        <Label className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider">
                          Email
                        </Label>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="text-xs sm:text-sm font-semibold"
                        />
                      </TextField>
                      <TextField isRequired className="w-full">
                        <Label className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider">
                          {vi ? "Số điện thoại" : "Phone Number"}
                        </Label>
                        <Input
                          type="tel"
                          placeholder={vi ? "0901 234 567" : "+84 901 234 567"}
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="text-xs sm:text-sm font-semibold"
                        />
                      </TextField>
                    </div>
                  </div>

                  {/* Additional notes & Live price row */}
                  <div className="space-y-2">
                    <label className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-black dark:text-white pl-1">
                      {`${t.rentCar.notes} (${t.common.cancel})`}
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={language === "vi" ? "VD: Cần ghế trẻ em, đón dọc đường..." : "E.g., child seat, early departure..."}
                      className="w-full h-16 p-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-black text-xs sm:text-sm font-semibold outline-none resize-none focus:border-accent transition-colors"
                    />
                  </div>


                  {/* Submit CTA */}
                  <Button
                    type="submit"
                    isDisabled={isDateInvalid || !dateValue || isSubmitting || !customerName.trim() || !customerPhone.trim()}
                    className="w-full h-11 sm:h-12 rounded-2xl font-black text-sm sm:text-base bg-accent text-white hover:bg-accent-hover shadow-md gap-2 border-none cursor-pointer"
                  >
                    <span>{isSubmitting ? (vi ? "Đang xử lý..." : "Processing...") : t.rentCar.searchBtn}</span>
                    {!isSubmitting && <ArrowRight size={16} />}
                  </Button>

                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="w-full py-20 bg-slate-50/50 dark:bg-black/10 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100">
              {t.rentCar.benefitsTitle}
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              {language === "vi"
                ? "Minh Khoa Travel cung cấp dịch vụ thuê xe có tài xế đi tỉnh xuất phát từ Nha Trang đến các điểm du lịch nổi bật. Mang lại trải nghiệm thoải mái và chủ động thời gian."
                : "Providing the ultimate convenience, comfort and reliability for your provincial travels."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">

            {/* Grid left (3 Cards) */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* Benefit 1 */}
              <div className="bg-white dark:bg-black/20 dark:border-white/10 p-6 rounded-3xl border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] flex flex-col gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-accent">
                  <MapPin size={20} />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-200">
                    {t.rentCar.benefit1Title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {language === "vi"
                      ? "Tài xế chạy chuyên tuyến, am hiểu địa phương và đường xá, đảm bảo chuyến đi an toàn và suôn sẻ."
                      : "Experienced drivers well-versed in local highways, ensuring a safe, direct journey."}
                  </p>
                </div>
              </div>

              {/* Benefit 2 */}
              <div className="bg-white dark:bg-black/20 dark:border-white/10 p-6 rounded-3xl border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] flex flex-col gap-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                  <Car size={20} />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-200">
                    {t.rentCar.benefit2Title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {language === "vi"
                      ? "Đội xe chất lượng cao, không gian rộng rãi. Luôn sẵn sàng nước suối và khăn lạnh phục vụ quý khách."
                      : "Premium, clean passenger fleet. Cold water and refreshments provided for every passenger."}
                  </p>
                </div>
              </div>

              {/* Benefit 3 */}
              <div className="bg-white dark:bg-black/20 dark:border-white/10 p-6 rounded-3xl border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] flex flex-col gap-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                  <ShieldCheck size={20} />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-slate-855 dark:text-slate-200">
                    {t.rentCar.benefit3Title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {language === "vi"
                      ? "Luôn có đội ngũ hỗ trợ kỹ thuật theo dõi. Cam kết thay xe ngay lập tức nếu gặp bất kỳ sự cố nào trên đường."
                      : "Proactive technical support. Immediate replacement vehicle guarantee in case of any roadside issue."}
                  </p>
                </div>
              </div>

              {/* Benefit 4 */}
              <div className="bg-white dark:bg-black/20 dark:border-white/10 p-6 rounded-3xl border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] flex flex-col gap-4">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                  <HomeIcon size={20} />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-200">
                    {t.rentCar.benefit4Title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {language === "vi"
                      ? "Linh hoạt đón trả khách tận nơi tại nhà riêng, sân bay, khách sạn hay các khu resort theo yêu cầu."
                      : "Flexible pick-up and drop-off directly at residences, hotels, airports or resorts."}
                  </p>
                </div>
              </div>

              {/* Benefit 5 */}
              <div className="bg-white dark:bg-black/20 dark:border-white/10 p-6 rounded-3xl border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] sm:col-span-2 flex flex-col gap-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600">
                  <ClockIcon size={20} />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-200">
                    {t.rentCar.benefit5Title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {language === "vi"
                      ? "Quý khách hoàn toàn có thể chủ động lịch trình, yêu cầu đi sớm hoặc về muộn tùy theo nhu cầu cá nhân."
                      : "Take full control of your itinerary, request custom departure or return times as needed."}
                  </p>
                </div>
              </div>

            </div>

            {/* Grid right (Image Card) */}
            <div className="rounded-3xl overflow-hidden shadow-sm relative h-full min-h-[300px] bg-slate-900 dark:bg-black/40 flex flex-col justify-end p-6">
              <div className="space-y-2">
                <h4 className="text-white font-extrabold text-sm">
                  {t.rentCar.luxuryTitle}
                </h4>
                <p className="text-slate-200 text-[10px] leading-relaxed">
                  {language === "vi"
                    ? "Tận hưởng chuyến đi tuyệt vời với các dòng xe đời mới chất lượng hàng đầu."
                    : "Travel in comfort with our high-end passenger cabin amenities."}
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Contact & Back to Top Buttons in bottom-right corner */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Contact Menu Popup */}
        {showContactMenu && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 w-40 flex flex-col gap-1.5 animate-fade-in-up">
            <a
              href="tel:0901234567"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-accent/10 hover:text-accent transition-colors no-underline"
            >
              <Phone size={14} className="text-accent" />
              <span>{t.common.callNow}</span>
            </a>
            <a
              href="https://zalo.me/0901234567"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-accent/10 hover:text-accent transition-colors no-underline border-t border-slate-100 dark:border-slate-700/50"
            >
              <MessageCircle size={14} className="text-accent" />
              <span>Zalo</span>
            </a>
          </div>
        )}
        <button
          onClick={() => setShowContactMenu(!showContactMenu)}
          className={`p-4 rounded-full border shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer flex items-center justify-center border-none ${showContactMenu
            ? "bg-accent text-white"
            : "bg-white dark:bg-black text-accent dark:text-white"
            }`}
          aria-label="Contact Support"
        >
          <Headset size={22} />
        </button>

        {/* Back to Top Button in bottom-right corner below Contact Support */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="p-4 rounded-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-accent dark:text-white shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer animate-bounce-subtle flex items-center justify-center"
            aria-label="Back to Top"
          >
            <ChevronUp size={22} />
          </button>
        )}
      </div>
    </div>
  );
}
