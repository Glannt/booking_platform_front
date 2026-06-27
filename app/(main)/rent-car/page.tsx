"use client";
import { useState, useEffect } from "react";
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
  Skeleton
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
  Headset
} from "lucide-react";

import { TimePicker, type TimeValue } from "@/components/time-picker";
import { useI18n } from "@/context/LanguageContext";

const routesData = [
  { id: "nt-dl", nameVi: "Nha Trang ⇌ Đà Lạt", nameEn: "Nha Trang ⇌ Da Lat" },
  { id: "nt-mn", nameVi: "Nha Trang ⇌ Mũi Né", nameEn: "Nha Trang ⇌ Mui Ne" },
  { id: "nt-pr", nameVi: "Nha Trang ⇌ Phan Rang", nameEn: "Nha Trang ⇌ Phan Rang" },
  { id: "nt-bmt", nameVi: "Nha Trang ⇌ Buôn Ma Thuột", nameEn: "Nha Trang ⇌ Buon Ma Thuot" }
];

const mockPricingData: Record<string, Record<string, Record<string, number>>> = {
  "nt-dl": {
    "one-way": { "4-seater": 1200000, "7-seater": 1800000, "16-seater": 2500000 },
    "return": { "4-seater": 1800000, "7-seater": 2600000, "16-seater": 3500000 }
  },
  "nt-mn": {
    "one-way": { "4-seater": 1400000, "7-seater": 2000000, "16-seater": 2700000 },
    "return": { "4-seater": 2200000, "7-seater": 3000000, "16-seater": 3800000 }
  },
  "nt-pr": {
    "one-way": { "4-seater": 900000, "7-seater": 1500000, "16-seater": 2200000 },
    "return": { "4-seater": 1600000, "7-seater": 2300000, "16-seater": 3000000 }
  },
  "nt-bmt": {
    "one-way": { "4-seater": 1600000, "7-seater": 2200000, "16-seater": 2800000 },
    "return": { "4-seater": 2600000, "7-seater": 3400000, "16-seater": 4200000 }
  }
};

export default function RentCarPage() {
  const { language } = useI18n();
  const router = useRouter();

  const [tripType, setTripType] = useState<"one-way" | "return">("one-way");
  const [selectedRoute, setSelectedRoute] = useState<string>("nt-dl");
  const [dateValue, setDateValue] = useState<DateValue | null>(null);
  const [timeValue, setTimeValue] = useState<TimeValue>({ hour: 8, minute: 0, period: "AM" });
  const [selectedSeats, setSelectedSeats] = useState<"4-seater" | "7-seater" | "16-seater">("4-seater");
  const [notes, setNotes] = useState("");

  const [price, setPrice] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showContactMenu, setShowContactMenu] = useState(false);

  const currentDate = today(getLocalTimeZone());
  const isDateInvalid = dateValue != null && dateValue.compare(currentDate) < 0;

  // Scroll details
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Simulated API call structure to calculate prices asynchronously
  useEffect(() => {
    let active = true;
    const calculatePrice = async () => {
      setIsCalculating(true);
      // Simulated API request latency
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (!active) return;

      const calculated = mockPricingData[selectedRoute]?.[tripType]?.[selectedSeats] || 0;
      setPrice(calculated);
      setIsCalculating(false);
    };

    calculatePrice();

    return () => {
      active = false;
    };
  }, [selectedRoute, tripType, selectedSeats]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDateInvalid || !dateValue) return;

    // Redirect to dashboard with request details
    router.push("/dashboard");
  };

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
            backgroundImage: `url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920')`
          }}
        >
          <div className="absolute inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-[1px]" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-7xl w-full mx-auto px-6 flex flex-col lg:flex-row items-center gap-12 justify-between">
          {/* Hero Left Info */}
          <div className="max-w-xl text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 dark:bg-slate-900/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
              <Sparkles size={14} className="text-[#0b66e4] dark:text-blue-400" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-100">
                Minh Khoa Travel
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              {language === "vi" ? "Thuê Xe Có Tài Xế Đi Tỉnh" : "Provincial Transfers"}
            </h1>
            <p className="text-sm md:text-base text-slate-200 leading-relaxed font-medium">
              {language === "vi"
                ? "Xe riêng 4–45 chỗ – Đưa đón tận nơi – Giá tốt – Tài xế chuyên tuyến"
                : "Comfortable, reliable, and scenic private routes across regions."}
            </p>
          </div>

          {/* Booking Card Right */}
          <div className="w-full max-w-xl bg-white/30 dark:bg-slate-900/20 dark:backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col gap-6">

            {/* Trip Type Selector */}
            <div className="flex bg-slate-300 dark:bg-slate-950/40 p-1 rounded-full w-full">
              <button
                type="button"
                onClick={() => setTripType("one-way")}
                className={`flex-1 py-2 text-xs font-extrabold rounded-full transition-all cursor-pointer ${tripType === "one-way"
                  ? "bg-white dark:bg-slate-800 text-[#0b66e4] dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
              >
                {language === "vi" ? "1 Chiều" : "1-Way"}
              </button>
              <button
                type="button"
                onClick={() => setTripType("return")}
                className={`flex-1 py-2 text-xs font-extrabold rounded-full transition-all cursor-pointer ${tripType === "return"
                  ? "bg-white dark:bg-slate-800 text-[#0b66e4] dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
              >
                {language === "vi" ? "Khứ hồi" : "Round-trip"}
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
                    selectedKey={selectedRoute}
                    onSelectionChange={(key) => {
                      if (key) setSelectedRoute(key as string);
                    }}
                  >
                    <Label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-slate-500 mb-1.5 pl-1">
                      {language === "vi" ? "Tuyến đường" : "Select Route"}
                    </Label>
                    <Select.Trigger className="h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3">
                      <Select.Value className="text-xs font-semibold" />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xl">
                      <ListBox>
                        {routesData.map((r) => (
                          <ListBox.Item id={r.id} key={r.id} textValue={language === "vi" ? r.nameVi : r.nameEn} className="text-xs font-semibold px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg cursor-pointer">
                            {language === "vi" ? r.nameVi : r.nameEn}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                    <Description className="text-[9px] text-black dark:text-slate-300 mt-1 pl-1">
                      {language === "vi" ? "Điểm xuất phát Nha Trang" : "Departure Nha Trang"}
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
                    <Label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-slate-500 mb-1.5 pl-1">
                      {language === "vi" ? "Ngày đi" : "Date"}
                    </Label>
                    <DateField.Group fullWidth className="h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex items-center justify-between">
                      <DateField.Input className="text-xs font-semibold bg-transparent border-none outline-none">
                        {(segment) => <DateField.Segment segment={segment} />}
                      </DateField.Input>
                      <DateField.Suffix>
                        <DatePicker.Trigger className="cursor-pointer">
                          <DatePicker.TriggerIndicator />
                        </DatePicker.Trigger>
                      </DateField.Suffix>
                    </DateField.Group>
                    <FieldError className="text-[9px] text-red-500 mt-1 pl-1">
                      {language === "vi" ? "Ngày đi phải từ hôm nay" : "Date must be today or in future."}
                    </FieldError>
                    <DatePicker.Popover className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-50">
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
                                className="w-8 h-8 text-xs font-semibold text-center cursor-pointer rounded-lg hover:bg-[#0b66e4]/10 hover:text-[#0b66e4] aria-selected:bg-[#0b66e4] aria-selected:text-white"
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
                  labelClassName="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1"
                  value={timeValue}
                  onChange={setTimeValue}
                  label={language === "vi" ? "Giờ đi" : "Time"}
                  language={language}
                  popoverTitle="Chọn giờ xuất phát"
                />

              </div>

              {/* Seating Capacity Selector cards */}
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-slate-500 pl-1">
                  {language === "vi" ? "Chọn dòng xe" : "Seating Capacity"}
                </label>
                <div className="grid grid-cols-3 gap-3">

                  {/* 4 Seater */}
                  <button
                    type="button"
                    onClick={() => setSelectedSeats("4-seater")}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-3 text-center transition-all cursor-pointer hover:scale-[1.02] ${selectedSeats === "4-seater"
                      ? "border-[#0b66e4] bg-[#0b66e4]/5"
                      : "border-slate-200 dark:border-slate-800 bg-transparent text-black dark:text-white hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                  >
                    <Car size={20} className="mb-2" />
                    <span className="block text-xs font-extrabold">4-Seater</span>
                    <span className="block text-[9px] opacity-75 mt-0.5">Sedan (Vios, Accent)</span>
                  </button>

                  {/* 7 Seater */}
                  <button
                    type="button"
                    onClick={() => setSelectedSeats("7-seater")}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-3 text-center transition-all cursor-pointer hover:scale-[1.02] ${selectedSeats === "7-seater"
                      ? "border-[#0b66e4] bg-[#0b66e4]/5"
                      : "border-slate-200 dark:border-slate-800 bg-transparent text-black dark:text-white hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                  >
                    <Car size={20} className="mb-2" />
                    <span className="block text-xs font-extrabold">7-Seater</span>
                    <span className="block text-[9px] opacity-75 mt-0.5">SUV (Xpander, Innova)</span>
                  </button>

                  {/* 16 Seater */}
                  <button
                    type="button"
                    onClick={() => setSelectedSeats("16-seater")}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-3 text-center transition-all cursor-pointer hover:scale-[1.02] ${selectedSeats === "16-seater"
                      ? "border-[#0b66e4] bg-[#0b66e4]/5"
                      : "border-slate-200 dark:border-slate-800 bg-transparent text-black dark:text-white hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                  >
                    <Car size={20} className="mb-2" />
                    <span className="block text-xs font-extrabold">16-Seater</span>
                    <span className="block text-[9px] opacity-75 mt-0.5">Minibus (Transit, Solati)</span>
                  </button>

                </div>
              </div>

              {/* Additional notes & Live price row */}
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white pl-1">
                  {language === "vi" ? "Ghi chú thêm (Không bắt buộc)" : "Additional Notes (Optional)"}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={language === "vi" ? "VD: Cần ghế trẻ em, đón dọc đường..." : "E.g., child seat, early departure..."}
                  className="w-full h-16 p-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 text-xs font-semibold outline-none resize-none focus:border-[#0b66e4] transition-colors"
                />
              </div>

              {/* Price estimation display */}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 mt-1">
                <div>
                  <span className="block text-[10px] font-extrabold text-black dark:text-white uppercase tracking-wider">
                    {language === "vi" ? "Giá tạm tính" : "Estimated Price"}
                  </span>
                  <span className="block text-[9px] text-black dark:text-white">
                    {language === "vi" ? "*Đã bao gồm cầu đường, tài xế" : "*Includes tolls, driver fees"}
                  </span>
                </div>
                {/* Fixed-height container prevents layout shift between skeleton and price */}
                <div className="h-9 flex items-center justify-end">
                  {isCalculating ? (
                    <div className="flex flex-col items-end gap-1 shadow-panel bg-transparent">
                      <Skeleton className="h-7 w-32 rounded-xl" />
                    </div>
                  ) : (
                    <span className="text-black dark:text-white font-extrabold text-2xl">
                      {price.toLocaleString("vi-VN")}đ
                    </span>
                  )}
                </div>
              </div>

              {/* Submit CTA */}
              <Button
                type="submit"
                isDisabled={isDateInvalid || !dateValue}
                className="w-full h-12 rounded-2xl font-black text-sm bg-[#0b66e4] text-white hover:bg-blue-700 shadow-md gap-2 border-none cursor-pointer"
              >
                <span>{language === "vi" ? "Gửi yêu cầu đặt xe" : "Request Transfer"}</span>
                <ArrowRight size={16} />
              </Button>

            </form>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="w-full py-20 bg-slate-50/50 dark:bg-slate-900/10 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100">
              {language === "vi" ? "Lợi ích khi đi tỉnh cùng Minh Khoa Travel" : "Why Choose Minh Khoa Travel?"}
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
              <div className="bg-white dark:bg-slate-900/20 dark:border-white/10 p-6 rounded-3xl border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] flex flex-col gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#0b66e4]">
                  <MapPin size={20} />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-200">
                    {language === "vi" ? "Tài xế chuyên tuyến" : "Expert Route Drivers"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {language === "vi"
                      ? "Tài xế chạy chuyên tuyến, am hiểu địa phương và đường xá, đảm bảo chuyến đi an toàn và suôn sẻ."
                      : "Experienced drivers well-versed in local highways, ensuring a safe, direct journey."}
                  </p>
                </div>
              </div>

              {/* Benefit 2 */}
              <div className="bg-white dark:bg-slate-900/20 dark:border-white/10 p-6 rounded-3xl border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] flex flex-col gap-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                  <Car size={20} />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-200">
                    {language === "vi" ? "Xe rộng, thoải mái" : "Spacious Vehicles"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {language === "vi"
                      ? "Đội xe chất lượng cao, không gian rộng rãi. Luôn sẵn sàng nước suối và khăn lạnh phục vụ quý khách."
                      : "Premium, clean passenger fleet. Cold water and refreshments provided for every passenger."}
                  </p>
                </div>
              </div>

              {/* Benefit 3 */}
              <div className="bg-white dark:bg-slate-900/20 dark:border-white/10 p-6 rounded-3xl border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] flex flex-col gap-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                  <ShieldCheck size={20} />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-slate-855 dark:text-slate-200">
                    {language === "vi" ? "Hỗ trợ kỹ thuật 24/7" : "24/7 Roadside Support"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {language === "vi"
                      ? "Luôn có đội ngũ hỗ trợ kỹ thuật theo dõi. Cam kết thay xe ngay lập tức nếu gặp bất kỳ sự cố nào trên đường."
                      : "Proactive technical support. Immediate replacement vehicle guarantee in case of any roadside issue."}
                  </p>
                </div>
              </div>

              {/* Benefit 4 */}
              <div className="bg-white dark:bg-slate-900/20 dark:border-white/10 p-6 rounded-3xl border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] flex flex-col gap-4">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                  <HomeIcon size={20} />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-200">
                    {language === "vi" ? "Giao nhận tận nơi" : "Door-to-Door Service"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {language === "vi"
                      ? "Linh hoạt đón trả khách tận nơi tại nhà riêng, sân bay, khách sạn hay các khu resort theo yêu cầu."
                      : "Flexible pick-up and drop-off directly at residences, hotels, airports or resorts."}
                  </p>
                </div>
              </div>

              {/* Benefit 5 */}
              <div className="bg-white dark:bg-slate-900/20 dark:border-white/10 p-6 rounded-3xl border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] sm:col-span-2 flex flex-col gap-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600">
                  <ClockIcon size={20} />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-200">
                    {language === "vi" ? "Linh hoạt thời gian" : "Flexible Scheduling"}
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
            <div className="rounded-3xl overflow-hidden shadow-sm relative group h-full min-h-[300px]">
              <img
                src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=600"
                alt="Luxury limousine passenger cabin"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-end p-6 space-y-2">
                <h4 className="text-white font-extrabold text-sm">
                  {language === "vi" ? "Đội Xe Limousine Sang Trọng" : "Luxury Limousine Fleet"}
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
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-[#0b66e4]/10 hover:text-[#0b66e4] transition-colors no-underline"
            >
              <Phone size={14} className="text-[#0b66e4]" />
              <span>{language === "vi" ? "Gọi ngay" : language === "en" ? "Call Now" : language === "ko" ? "지금 전화" : "Позвонить"}</span>
            </a>
            <a
              href="https://zalo.me/0901234567"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-[#0b66e4]/10 hover:text-[#0b66e4] transition-colors no-underline border-t border-slate-100 dark:border-slate-700/50"
            >
              <MessageCircle size={14} className="text-[#0b66e4]" />
              <span>Zalo</span>
            </a>
          </div>
        )}
        <button
          onClick={() => setShowContactMenu(!showContactMenu)}
          className={`p-4 rounded-full border shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer flex items-center justify-center border-none ${showContactMenu
            ? "bg-[#0b66e4] text-white"
            : "bg-white dark:bg-slate-900 text-[#0b66e4] dark:text-white"
            }`}
          aria-label="Contact Support"
        >
          <Headset size={22} />
        </button>

        {/* Back to Top Button in bottom-right corner below Contact Support */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="p-4 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#0b66e4] dark:text-white shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer animate-bounce-subtle flex items-center justify-center"
            aria-label="Back to Top"
          >
            <ChevronUp size={22} />
          </button>
        )}
      </div>
    </div>
  );
}
