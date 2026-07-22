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
import { getActiveIntercityRoutes, getActiveDepartureTimes, type IntercityRouteDto, type IntercityDepartureTimeDto } from "@/lib/api/rental";
import { formatPrice as _formatPrice } from "@/lib/format";
import { BookingProcessSection } from "@/components/sections/BookingProcessSection";
import { FaqSection, type FaqCategory } from "@/components/FaqSection";
import type { SectionDto } from "@/lib/api/sections";

interface RentCarClientProps {
  sections: SectionDto[];
}

export default function RentCarClient({ sections }: RentCarClientProps) {
  const { language, t, contacts } = useI18n();
  const router = useRouter();
  const vi = language === "vi";

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

  const [routes, setRoutes] = useState<IntercityRouteDto[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showContactMenu, setShowContactMenu] = useState(false);
  const [departureTimes, setDepartureTimes] = useState<IntercityDepartureTimeDto[]>([]);
  const [selectedDepartureTime, setSelectedDepartureTime] = useState<string>("");

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

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDateInvalid || !dateValue) return;

    const route = routes.find((r) => r.id === selectedRouteId);
    if (!route) {
      toast.danger(t.rentCar.selectRouteError);
      return;
    }

    const departureDate = `${dateValue.year}-${String(dateValue.month).padStart(2, "0")}-${String(dateValue.day).padStart(2, "0")}`;
    const useFixedTime = route?.hasDepartureTimes && selectedDepartureTime;
    const departureTime = useFixedTime
      ? selectedDepartureTime
      : `${String(timeValue.hour).padStart(2, "0")}:${String(timeValue.minute).padStart(2, "0")}`;

    const params = new URLSearchParams({
      routeId: String(route.id),
      tripType,
      departureDate,
      departureTime,
      departureTimeType: useFixedTime ? "fixed" : "custom",
    });
    if (customerName.trim()) params.set("customerName", customerName.trim());
    if (customerEmail.trim()) params.set("customerEmail", customerEmail.trim());
    if (customerPhone.trim()) params.set("customerPhone", customerPhone.trim());
    if (notes.trim()) params.set("notes", notes.trim());

    router.push(prefixUrl(`/rent-car/confirm?${params.toString()}`));
  };

  const selectedRouteObj = routes.find((r) => r.id === selectedRouteId);

  return (
    <div className="relative flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* Hero Section */}
      <section className="relative w-full min-h-[640px] flex items-center justify-center pt-24 pb-16 overflow-hidden">
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

        <div className="relative z-10 max-w-7xl w-full mx-auto px-6 flex flex-col lg:flex-row items-center gap-12 justify-between">
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

          <div className="w-full max-w-xl bg-white/30 dark:bg-black/20 dark:backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col gap-6">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <div className="flex flex-col w-full">
                    <Select
                      className="w-full"
                      placeholder={language === "vi" ? "Chọn tuyến" : "Select Route"}
                      selectedKey={selectedRouteId != null ? String(selectedRouteId) : undefined}
                      onSelectionChange={(key) => {
                        if (key) setSelectedRouteId(Number(key));
                      }}
                    >
                      <Label isRequired className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-black dark:text-slate-500 mb-1.5 pl-1">
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

                  {routes.find((r) => r.id === selectedRouteId)?.hasDepartureTimes && departureTimes.length > 0 ? (
                    <div className="flex flex-col w-full">
                      <Select
                        className="w-full"
                        placeholder={t.rentCar.selectTime}
                        selectedKey={selectedDepartureTime || undefined}
                        onSelectionChange={(key) => {
                          if (key) setSelectedDepartureTime(String(key));
                        }}
                      >
                        <Label className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">
                          {t.rentCar.time}
                        </Label>
                        <Select.Trigger className="h-10 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl px-3">
                          <Select.Value className="text-xs sm:text-sm font-semibold" />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xl">
                          <ListBox>
                            {departureTimes.map((dt) => (
                              <ListBox.Item key={dt.departureTime} id={dt.departureTime} textValue={dt.departureTime} className="text-xs font-semibold px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg cursor-pointer">
                                {dt.departureTime}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                    </div>
                  ) : (
                    <TimePicker
                      labelClassName="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1"
                      value={timeValue}
                      onChange={setTimeValue}
                      label={t.rentCar.time}
                      language={language}
                      popoverTitle="Chọn giờ xuất phát"
                    />
                  )}

                </div>

                <div className="space-y-3">
                  <label className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-black dark:text-white pl-1">
                    {t.rentCar.contactInfo}
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <TextField isRequired className="w-full">
                      <Label className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider">
                        {t.rentCar.fullName}
                      </Label>
                      <Input
                        type="text"
                        placeholder="Nguyễn Văn A"
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
                        {t.rentCar.phone}
                      </Label>
                      <Input
                        type="tel"
                        placeholder="0901 234 567"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="text-xs sm:text-sm font-semibold"
                      />
                    </TextField>
                  </div>
                </div>

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

                <Button
                  type="submit"
                  isDisabled={isDateInvalid || !dateValue}
                  className="w-full h-11 sm:h-12 rounded-2xl font-black text-sm sm:text-base bg-accent text-white hover:bg-accent-hover shadow-md gap-2 border-none cursor-pointer"
                >
                  <span>{t.common.bookNow}</span>
                  <ArrowRight size={16} />
                </Button>

              </form>
            </>
          </div>
        </div>
      </section>

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
              {routes.map((route) => (
                <div
                  key={route.id}
                  className="group relative bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover:border-accent hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  onClick={() => router.push(prefixUrl(`/rent-car/${route.id}`))}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                        <MapPin size={16} className="text-accent" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                          {getRouteName(route)}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold">
                          {route.originCity} → {route.destinationCity}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-slate-400">
                      {route.distanceKm && (
                        <span>{route.distanceKm} km</span>
                      )}
                      {route.estimatedHours && (
                        <span>~{route.estimatedHours}h</span>
                      )}
                      {route.hasDepartureTimes && route.departureTimes?.length > 0 && (
                        <span>{route.departureTimes.length} {t.rentCar.tripsPerDay}</span>
                      )}
                    </div>

                    {route.prices && route.prices.length > 0 && (
                      <p className="text-xs font-black text-accent">
                        {t.rentCar.priceFrom}{" "}
                        {formatPrice(Math.min(...route.prices.filter(p => p.active).map(p => p.oneWayAmount)))}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-accent transition-colors">
                      {t.rentCar.viewDetails}
                    </span>
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-6">
              <Button
                onClick={() => router.push(prefixUrl("/rent-car/routes"))}
                className="px-6 py-2.5 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-black hover:bg-slate-50 dark:hover:bg-slate-900 shadow-sm cursor-pointer gap-2"
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
              {language === "vi"
                ? "Minh Khoa Travel cung cấp dịch vụ thuê xe có tài xế đi tỉnh xuất phát từ Nha Trang đến các điểm du lịch nổi bật. Mang lại trải nghiệm thoải mái và chủ động thời gian."
                : "Providing the ultimate convenience, comfort and reliability for your provincial travels."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-black/20 dark:border-white/10 p-6 rounded-3xl border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] flex flex-col gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-accent"><MapPin size={20} /></div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-200">{t.rentCar.benefit1Title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{language === "vi" ? "Tài xế chạy chuyên tuyến, am hiểu địa phương và đường xá, đảm bảo chuyến đi an toàn và suôn sẻ." : "Experienced drivers well-versed in local highways, ensuring a safe, direct journey."}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-black/20 dark:border-white/10 p-6 rounded-3xl border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] flex flex-col gap-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600"><Car size={20} /></div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-200">{t.rentCar.benefit2Title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{language === "vi" ? "Đội xe chất lượng cao, không gian rộng rãi. Luôn sẵn sàng nước suối và khăn lạnh phục vụ quý khách." : "Premium, clean passenger fleet. Cold water and refreshments provided for every passenger."}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-black/20 dark:border-white/10 p-6 rounded-3xl border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] flex flex-col gap-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600"><ShieldCheck size={20} /></div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-slate-855 dark:text-slate-200">{t.rentCar.benefit3Title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{language === "vi" ? "Luôn có đội ngũ hỗ trợ kỹ thuật theo dõi. Cam kết thay xe ngay lập tức nếu gặp bất kỳ sự cố nào trên đường." : "Proactive technical support. Immediate replacement vehicle guarantee in case of any roadside issue."}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-black/20 dark:border-white/10 p-6 rounded-3xl border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] flex flex-col gap-4">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600"><HomeIcon size={20} /></div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-200">{t.rentCar.benefit4Title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{language === "vi" ? "Linh hoạt đón trả khách tận nơi tại nhà riêng, sân bay, khách sạn hay các khu resort theo yêu cầu." : "Flexible pick-up and drop-off directly at residences, hotels, airports or resorts."}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-black/20 dark:border-white/10 p-6 rounded-3xl border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] sm:col-span-2 flex flex-col gap-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600"><ClockIcon size={20} /></div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-200">{t.rentCar.benefit5Title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{language === "vi" ? "Quý khách hoàn toàn có thể chủ động lịch trình, yêu cầu đi sớm hoặc về muộn tùy theo nhu cầu cá nhân." : "Take full control of your itinerary, request custom departure or return times as needed."}</p>
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
                <p className="text-slate-200 text-[10px] leading-relaxed">{language === "vi" ? "Tận hưởng chuyến đi tuyệt vời với các dòng xe đời mới chất lượng hàng đầu." : "Travel in comfort with our high-end passenger cabin amenities."}</p>
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
          title={vi ? "Câu hỏi thường gặp" : "Frequently Asked Questions"}
          description={vi ? "Mọi thứ bạn cần biết về dịch vụ thuê xe đi tỉnh." : "Everything you need to know about intercity car rental."}
          categories={[
            {
              title: vi ? "Đặt xe" : "Booking",
              items: [
                { title: vi ? "Làm sao để đặt xe?" : "How do I book a car?", content: vi ? "Chọn tuyến, ngày giờ, loại xe và điền thông tin liên hệ. Nhấn 'Đặt xe' để hoàn tất." : "Select route, date/time, vehicle type and fill in contact info. Click 'Book now' to complete." },
                { title: vi ? "Tôi có thể hủy đặt xe không?" : "Can I cancel my booking?", content: vi ? "Có, bạn có thể hủy miễn phí trước 24 giờ. Sau thời gian này phí hủy 20%." : "Yes, you can cancel free of charge 24 hours before. After that, 20% cancellation fee applies." }
              ]
            },
            {
              title: vi ? "Thanh toán" : "Payment",
              items: [{ title: vi ? "Thanh toán bằng cách nào?" : "How do I pay?", content: vi ? "Thanh toán tiền mặt hoặc chuyển khoản khi đến nơi. Hỗ trợ hóa đơn VAT 8%." : "Pay cash or bank transfer upon arrival. VAT 8% invoice available." }]
            },
            {
              title: vi ? "Giờ khởi hành" : "Departure Schedule",
              items: [{ title: vi ? "Giờ khởi hành cố định là giờ nào?" : "What are the fixed departure times?", content: vi ? "Nha Trang → Đà Lạt: 08:00, 11:00, 13:00, 17:00. Đà Lạt → Nha Trang: 08:00, 13:00, 16:00, 17:00." : "Nha Trang → Da Lat: 08:00, 11:00, 13:00, 17:00. Da Lat → Nha Trang: 08:00, 13:00, 16:00, 17:00." }]
            }
          ]}
        />
      </section>

      {/* Contact & Back to Top Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {showContactMenu && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 w-40 flex flex-col gap-1.5 animate-fade-in-up">
            <a href={`tel:${contacts.phone}`} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-accent/10 hover:text-accent transition-colors no-underline">
              <Phone size={14} className="text-accent" /><span>{t.common.callNow}</span>
            </a>
            <a href={contacts.zalo.startsWith("http") ? contacts.zalo : `https://zalo.me/${contacts.zalo}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-accent/10 hover:text-accent transition-colors no-underline border-t border-slate-100 dark:border-slate-700/50">
              <MessageCircle size={14} className="text-accent" /><span>Zalo</span>
            </a>
            {contacts.kakaotalk && (
              <a href={contacts.kakaotalk.startsWith("http") ? contacts.kakaotalk : `https://pf.kakao.com/${contacts.kakaotalk}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-accent/10 hover:text-accent transition-colors no-underline border-t border-slate-100 dark:border-slate-700/50">
                <span className="text-accent">💛</span><span>KakaoTalk</span>
              </a>
            )}
            {contacts.whatsapp && (
              <a href={contacts.whatsapp.startsWith("http") ? contacts.whatsapp : `https://wa.me/${contacts.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-accent/10 hover:text-accent transition-colors no-underline border-t border-slate-100 dark:border-slate-700/50">
                <span className="text-accent">💚</span><span>WhatsApp</span>
              </a>
            )}
          </div>
        )}
        <button
          onClick={() => setShowContactMenu(!showContactMenu)}
          className={`p-4 rounded-full border shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer flex items-center justify-center border-none ${showContactMenu ? "bg-accent text-white" : "bg-white dark:bg-black text-accent dark:text-white"}`}
          aria-label="Contact Support"
        >
          <Headset size={22} />
        </button>
        {showScrollTop && (
          <button onClick={scrollToTop} className="p-4 rounded-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-accent dark:text-white shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer animate-bounce-subtle flex items-center justify-center" aria-label="Back to Top">
            <ChevronUp size={22} />
          </button>
        )}
      </div>
    </div>
  );
}
