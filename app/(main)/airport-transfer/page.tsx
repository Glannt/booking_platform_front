"use client";
import { useState, useEffect } from "react";
import {
  DatePicker,
  DateField,
  Calendar,
  Skeleton,
  Label,
  FieldError
} from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { getLocalTimeZone, today } from "@internationalized/date";
import {
  Plane,
  MapPin,
  Phone,
  MessageCircle,
  Sparkles,
  User,
  Briefcase,
  CheckCircle
} from "lucide-react";

import dynamic from "next/dynamic";
const RoutingMap = dynamic(
  () => import("@/components/routing-map").then((mod) => mod.RoutingMap),
  { ssr: false }
);
import { TimePicker, type TimeValue } from "@/components/time-picker";
import { useI18n } from "@/context/LanguageContext";

// Define mock data for vehicle options matching Image 2
const VEHICLES = [
  {
    id: "4-seater",
    nameVi: "Xe 4 chỗ",
    nameEn: "4-Seater Sedan",
    descVi: "Toyota Vios, Hyundai Accent hoặc tương đương",
    descEn: "Toyota Vios, Hyundai Accent or equivalent",
    capacity: "3 khách",
    luggage: "2 vali",
    featuresVi: ["Nước suối", "Điều hòa"],
    featuresEn: ["Bottled Water", "Air Conditioning"],
    priceOneWay: 350000,
    priceReturn: 650000,
  },
  {
    id: "7-seater",
    nameVi: "Xe 7 chỗ",
    nameEn: "7-Seater SUV",
    descVi: "Mitsubishi Xpander, Toyota Innova hoặc tương đương",
    descEn: "Mitsubishi Xpander, Toyota Innova or equivalent",
    capacity: "5 khách",
    luggage: "4 vali",
    featuresVi: ["Xe rộng rãi", "Sạch sẽ"],
    featuresEn: ["Spacious", "Clean"],
    priceOneWay: 450000,
    priceReturn: 850000,
  },
  {
    id: "carnival",
    nameVi: "Xe Carnival",
    nameEn: "Kia Carnival",
    descVi: "Kia Carnival đời mới sang trọng, êm ái",
    descEn: "Luxury Kia Carnival, ultra comfortable",
    capacity: "6 khách",
    luggage: "5 vali",
    featuresVi: ["Cửa điện", "Ghế thương gia", "Wi-Fi miễn phí"],
    featuresEn: ["Power Doors", "Business Seats", "Free Wi-Fi"],
    priceOneWay: 800000,
    priceReturn: 1500000,
  },
  {
    id: "limousine",
    nameVi: "Xe Limousine",
    nameEn: "DCar Limousine",
    descVi: "DCar Limousine 9 chỗ VIP chuyên đưa đón VIP",
    descEn: "VIP 9-Seater DCar Limousine for business travellers",
    capacity: "9 khách",
    luggage: "7 vali",
    featuresVi: ["Ghế massage", "Cổng sạc USB", "Hệ thống âm thanh"],
    featuresEn: ["Massage Seats", "USB Chargers", "Premium Sound"],
    priceOneWay: 900000,
    priceReturn: 1700000,
  },
  {
    id: "16-seater",
    nameVi: "Xe 16 chỗ",
    nameEn: "16-Seater Van",
    descVi: "Ford Transit, Hyundai Solati đời mới",
    descEn: "Modern Ford Transit, Hyundai Solati",
    capacity: "12 khách",
    luggage: "10 vali",
    featuresVi: ["Khoang hành lý rộng", "Ghế ngả thoải mái"],
    featuresEn: ["Large Trunk", "Reclining Seats"],
    priceOneWay: 700000,
    priceReturn: 1300000,
  },
  {
    id: "large-coach",
    nameVi: "Xe 29–45 chỗ",
    nameEn: "29–45 Seater Coach",
    descVi: "Thaco Town, Samco, Hyundai Universe phục vụ đoàn lớn",
    descEn: "Thaco Town, Samco, Hyundai Universe for large groups",
    capacity: "45 khách",
    luggage: "30 vali",
    featuresVi: ["Tài xế chuyên tour", "Hỗ trợ đoàn tận tình"],
    featuresEn: ["Tour Driver", "Dedicated Group Support"],
    priceOneWay: 1800000,
    priceReturn: 3400000,
  }
];

export default function AirportTransferPage() {
  const { language } = useI18n();
  const vi = language === "vi";

  // Route toggle: camranh-nhatrang OR nhatrang-camranh
  const [direction, setDirection] = useState<"to-nhatrang" | "to-camranh">("to-nhatrang");
  const [tripType, setTripType] = useState<"one-way" | "return">("one-way");
  const [outboundStartsFrom, setOutboundStartsFrom] = useState<"airport" | "nhatrang">("airport");
  
  const [nhaTrangAddress, setNhaTrangAddress] = useState("");
  const [nhaTrangReturnAddress, setNhaTrangReturnAddress] = useState("");
  const [isReturnAddressCustom, setIsReturnAddressCustom] = useState(false);

  const [dateValue, setDateValue] = useState<DateValue | null>(null);
  const [timeValue, setTimeValue] = useState<TimeValue>({ hour: 12, minute: 0, period: "PM" });
  const [flightNumber, setFlightNumber] = useState("");

  const [returnDateValue, setReturnDateValue] = useState<DateValue | null>(null);
  const [returnTimeValue, setReturnTimeValue] = useState<TimeValue>({ hour: 12, minute: 0, period: "PM" });
  const [returnFlightNumber, setReturnFlightNumber] = useState("");

  const [selectedVehicleId, setSelectedVehicleId] = useState("4-seater");
  const [isCalculating, setIsCalculating] = useState(false);

  // Dynamic route calculation from RoutingMap
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null);

  // FAQ collapse state
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Sync outbound and return addresses unless return address is manually customized
  const handleNhaTrangAddressChange = (val: string) => {
    setNhaTrangAddress(val);
    if (!isReturnAddressCustom) {
      setNhaTrangReturnAddress(val);
    }
  };

  const handleNhaTrangReturnAddressChange = (val: string) => {
    setNhaTrangReturnAddress(val);
    setIsReturnAddressCustom(true);
  };

  // Trigger skeleton animation when user changes selections
  useEffect(() => {
    setIsCalculating(true);
    const timer = setTimeout(() => setIsCalculating(false), 300);
    return () => clearTimeout(timer);
  }, [direction, outboundStartsFrom, tripType, selectedVehicleId]);

  // Selected vehicle details
  const selectedVehicle = VEHICLES.find((v) => v.id === selectedVehicleId) || VEHICLES[0];
  const outboundPrice = selectedVehicle.priceOneWay;
  const returnPrice = tripType === "return" ? selectedVehicle.priceReturn - selectedVehicle.priceOneWay : 0;
  const unitPrice = tripType === "one-way" ? selectedVehicle.priceOneWay : selectedVehicle.priceReturn;

  // Format currency
  const formatPrice = (p: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);
  };

  const handleBooking = () => {
    let routeText = "";
    let dateTimeText = "";

    const activeAddress = nhaTrangAddress || "Trung tâm Nha Trang";
    const activeReturnAddress = nhaTrangReturnAddress || activeAddress;

    if (tripType === "one-way") {
      const dirText = direction === "to-nhatrang"
        ? `Sân bay Cam Ranh (CXR) ➔ Nha Trang (${activeAddress})`
        : `Nha Trang (${activeAddress}) ➔ Sân bay Cam Ranh (CXR)`;
      routeText = `${dirText} (Một chiều)`;

      const timeText = `${String(timeValue.hour).padStart(2, "0")}:${String(timeValue.minute).padStart(2, "0")} ${timeValue.period}`;
      const dateText = dateValue ? dateValue.toString() : "";
      dateTimeText = `- Ngày đi: ${dateText}\n- Giờ đi: ${timeText}\n- Số hiệu chuyến bay: ${flightNumber || "Không có"}`;
    } else {
      const outboundDirText = outboundStartsFrom === "airport"
        ? `Sân bay Cam Ranh (CXR) ➔ Nha Trang (${activeAddress})`
        : `Nha Trang (${activeAddress}) ➔ Sân bay Cam Ranh (CXR)`;

      const returnDirText = outboundStartsFrom === "airport"
        ? `Nha Trang (${activeReturnAddress}) ➔ Sân bay Cam Ranh (CXR)`
        : `Sân bay Cam Ranh (CXR) ➔ Nha Trang (${activeReturnAddress})`;

      routeText = `Chiều đi: ${outboundDirText}\n- Chiều về: ${returnDirText} (Khứ hồi)`;

      const outTimeText = `${String(timeValue.hour).padStart(2, "0")}:${String(timeValue.minute).padStart(2, "0")} ${timeValue.period}`;
      const outDateText = dateValue ? dateValue.toString() : "";

      const retTimeText = `${String(returnTimeValue.hour).padStart(2, "0")}:${String(returnTimeValue.minute).padStart(2, "0")} ${returnTimeValue.period}`;
      const retDateText = returnDateValue ? returnDateValue.toString() : "";

      dateTimeText = `- Chiều đi:\n  + Ngày đi: ${outDateText}\n  + Giờ đi: ${outTimeText}\n  + Số hiệu chuyến bay: ${flightNumber || "Không có"}\n- Chiều về:\n  + Ngày về: ${retDateText}\n  + Giờ về: ${retTimeText}\n  + Số hiệu chuyến bay về: ${returnFlightNumber || "Không có"}`;
    }

    const vehicleText = vi ? selectedVehicle.nameVi : selectedVehicle.nameEn;
    const distanceText = estimatedDistance ? `~${estimatedDistance} km` : "Khoảng 35 km";
    const durationText = estimatedDuration ? `~${estimatedDuration} phút` : "Khoảng 45 phút";

    const message = `Xin chào Minh Khoa Travel, tôi muốn đặt xe đón tiễn sân bay:\n- Tuyến: ${routeText}\n- Loại xe: ${vehicleText}\n${dateTimeText}\n- Thời gian di chuyển dự kiến (mỗi chiều): ${durationText}\n- Quãng đường dự kiến (mỗi chiều): ${distanceText}\n- Tổng tiền tạm tính: ${formatPrice(unitPrice)}`;
    
    window.open(`https://zalo.me/0764971971?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans">

      {/* Hero Banner Area */}
      <section className="relative w-full min-h-[300px] flex items-center pt-28 pb-14 px-6 overflow-hidden">
        {/* Background Image with overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1920')`
          }}
        >
          <div className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-[1.5px]" />
        </div>

        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10 text-white">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 dark:bg-slate-900/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 mb-3">
              <Sparkles size={12} className="text-[#0b66e4] dark:text-blue-400 animate-spin-slow" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-100">
                {vi ? "Đón Tiễn Đưa Chu Đáo" : "Trusted Airport Transfer"}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              {vi ? "Xe Đưa Đón Sân Bay Cam Ranh ⇄ Nha Trang" : "Airport Transfer: Cam Ranh Airport ⇄ Nha Trang"}
            </h1>
            <p className="mt-2 text-sm md:text-base text-slate-200 max-w-3xl font-medium leading-relaxed">
              {vi
                ? "Dịch vụ xe riêng trọn gói, đón tiễn tận nhà. Đúng giờ – Lịch sự – Giá trọn gói minh bạch không phát sinh."
                : "Private car service, door-to-door convenience. Punctual, clean vehicles, all-inclusive transparent pricing."}
            </p>
          </div>
          <a
            href="tel:0764971971"
            className="flex items-center gap-2.5 bg-[#0b66e4] hover:bg-blue-700 text-white px-5 py-3 rounded-full text-sm font-black transition-all shadow-lg hover:scale-105 active:scale-95 no-underline shrink-0 border-none"
          >
            <Phone size={16} />
            <span>Hotline: 0764 971 971</span>
          </a>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Column: Form & Car Choices */}
        <div className="lg:col-span-8 space-y-6">

          {/* Form Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-5">
            {/* Direction & Trip Type Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              {/* Trip Type (One way / Return) */}
              <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl gap-1 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTripType("one-way")}
                  className={`py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    tripType === "one-way"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {vi ? "Một chiều" : "1-Way"}
                </button>
                <button
                  type="button"
                  onClick={() => setTripType("return")}
                  className={`py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    tripType === "return"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {vi ? "Khứ hồi" : "Round Trip"}
                </button>
              </div>

              {/* Direction selector - ONLY shown if One-Way */}
              {tripType === "one-way" ? (
                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl gap-1 flex-1 max-w-md">
                  <button
                    type="button"
                    onClick={() => setDirection("to-nhatrang")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      direction === "to-nhatrang"
                        ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {vi ? "Đón sân bay về Nha Trang" : "Airport → Nha Trang"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection("to-camranh")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      direction === "to-camranh"
                        ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {vi ? "Từ Nha Trang đi sân bay" : "Nha Trang → Airport"}
                  </button>
                </div>
              ) : (
                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl gap-1 flex-1 max-w-md items-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 shrink-0">
                    {vi ? "Chiều đi:" : "Outbound:"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOutboundStartsFrom("airport")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      outboundStartsFrom === "airport"
                        ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {vi ? "Sân bay ➔ Nha Trang" : "Airport → Nha Trang"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutboundStartsFrom("nhatrang")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      outboundStartsFrom === "nhatrang"
                        ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {vi ? "Nha Trang ➔ Sân bay" : "Nha Trang → Airport"}
                  </button>
                </div>
              )}
            </div>

            {/* ONE-WAY TRIP FORM */}
            {tripType === "one-way" && (
              <div className="space-y-4">
                {/* Address Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {direction === "to-nhatrang" ? (
                    <>
                      {/* Pickup: Airport */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3">
                        <MapPin className="text-blue-600 dark:text-blue-400 mt-1 shrink-0" size={18} />
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                            {vi ? "Điểm đón" : "Pickup Location"}
                          </p>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">
                            {vi ? "Sân bay Cam Ranh (CXR)" : "Cam Ranh Airport (CXR)"}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
                            {vi ? "Tài xế cầm biển đón khách tại ga quốc nội/quốc tế" : "Driver holds signage at arrival gate"}
                          </p>
                        </div>
                      </div>

                      {/* Dropoff: Nha Trang Address Input */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3 w-full">
                        <MapPin className="text-green-600 dark:text-green-400 mt-1 shrink-0" size={18} />
                        <div className="w-full flex-1">
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                            {vi ? "Điểm trả tại Nha Trang" : "Dropoff Location in Nha Trang"}
                          </p>
                          <div className="mt-1.5 flex items-center border border-slate-200 dark:border-slate-800 rounded-xl px-3 h-10 bg-white dark:bg-slate-900 focus-within:border-blue-500/50 transition-colors w-full">
                            <input
                              type="text"
                              placeholder={vi ? "Nhập địa chỉ, khách sạn, resort..." : "Enter hotel, resort or address..."}
                              value={nhaTrangAddress}
                              onChange={(e) => handleNhaTrangAddressChange(e.target.value)}
                              className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                            />
                          </div>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-snug">
                            {vi ? "Khách sạn, Resort, Nhà riêng hoặc Homestay" : "Hotels, Resorts, Private house or Homestays"}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Pickup: Nha Trang Address Input */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3 w-full">
                        <MapPin className="text-green-600 dark:text-green-400 mt-1 shrink-0" size={18} />
                        <div className="w-full flex-1">
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                            {vi ? "Điểm đón tại Nha Trang" : "Pickup Location in Nha Trang"}
                          </p>
                          <div className="mt-1.5 flex items-center border border-slate-200 dark:border-slate-800 rounded-xl px-3 h-10 bg-white dark:bg-slate-900 focus-within:border-blue-500/50 transition-colors w-full">
                            <input
                              type="text"
                              placeholder={vi ? "Nhập địa chỉ, khách sạn, resort..." : "Enter hotel, resort or address..."}
                              value={nhaTrangAddress}
                              onChange={(e) => handleNhaTrangAddressChange(e.target.value)}
                              className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                            />
                          </div>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-snug">
                            {vi ? "Khách sạn, Resort, Nhà riêng hoặc Homestay" : "Hotels, Resorts, Private house or Homestays"}
                          </p>
                        </div>
                      </div>

                      {/* Dropoff: Airport */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3">
                        <MapPin className="text-blue-600 dark:text-blue-400 mt-1 shrink-0" size={18} />
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                            {vi ? "Điểm trả" : "Dropoff Location"}
                          </p>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">
                            {vi ? "Sân bay Cam Ranh (CXR)" : "Cam Ranh Airport (CXR)"}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
                            {vi ? "Tài xế trả khách tại sảnh ga đi ga quốc nội/quốc tế" : "Driver drops off at departure terminal gate"}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* DateTime, Time & Flight Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  {/* Date selection using HeroUI DatePicker */}
                  <div className="flex flex-col w-full">
                    <DatePicker
                      value={dateValue}
                      onChange={setDateValue}
                      minValue={today(getLocalTimeZone())}
                      className="w-full"
                      aria-label="Date Picker"
                    >
                      <Label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">
                        {vi ? "Ngày đón" : "Date"}
                      </Label>
                      <DateField.Group className="h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex items-center justify-between">
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

                  {/* Time Selection */}
                  <TimePicker
                    value={timeValue}
                    onChange={setTimeValue}
                    label={vi ? "Giờ đón" : "Time"}
                    labelClassName="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1"
                    popoverTitle={vi ? "Chọn giờ đón khách" : "Select Pickup Time"}
                    language={language}
                  />

                  {/* Flight Code */}
                  <div className="flex flex-col w-full">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">
                      {vi ? "Mã chuyến bay (nếu có)" : "Flight Number (optional)"}
                    </label>
                    <div className="flex items-center h-10 border border-slate-200 dark:border-slate-800 rounded-xl px-3 bg-white dark:bg-slate-900 hover:border-blue-500/50 transition-colors">
                      <Plane size={16} className="text-slate-400 dark:text-slate-500 mr-2 shrink-0" />
                      <input
                        type="text"
                        placeholder="VN123, QH456..."
                        value={flightNumber}
                        onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                        className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ROUND-TRIP (KHỨ HỒI) DUAL FORM */}
            {tripType === "return" && (
              <div className="space-y-6">
                
                {/* Outbound Trip Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 py-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      {vi ? "Chiều Đi" : "Outbound Leg"}
                    </span>
                    <div className="flex-1 h-[1px] bg-slate-100 dark:bg-slate-800/80" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {outboundStartsFrom === "airport" ? (
                      <>
                        {/* Pickup: Airport */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3">
                          <MapPin className="text-blue-600 dark:text-blue-400 mt-1 shrink-0" size={18} />
                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                              {vi ? "Điểm đón chiều đi" : "Outbound Pickup"}
                            </p>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">
                              {vi ? "Sân bay Cam Ranh (CXR)" : "Cam Ranh Airport (CXR)"}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
                              {vi ? "Tài xế đón khách tại ga đến" : "Driver holds sign at arrivals gate"}
                            </p>
                          </div>
                        </div>

                        {/* Dropoff: Nha Trang Address */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3 w-full">
                          <MapPin className="text-green-600 dark:text-green-400 mt-1 shrink-0" size={18} />
                          <div className="w-full flex-1">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                              {vi ? "Điểm trả chiều đi tại Nha Trang" : "Outbound Dropoff in Nha Trang"}
                            </p>
                            <div className="mt-1.5 flex items-center border border-slate-200 dark:border-slate-800 rounded-xl px-3 h-10 bg-white dark:bg-slate-900 focus-within:border-blue-500/50 transition-colors w-full">
                              <input
                                type="text"
                                placeholder={vi ? "Nhập địa chỉ khách sạn, resort..." : "Enter hotel, resort or address..."}
                                value={nhaTrangAddress}
                                onChange={(e) => handleNhaTrangAddressChange(e.target.value)}
                                className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                              />
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-snug">
                              {vi ? "Khách sạn, Resort, Nhà riêng hoặc Homestay" : "Hotels, Resorts, Private house or Homestays"}
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Pickup: Nha Trang Address */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3 w-full">
                          <MapPin className="text-green-600 dark:text-green-400 mt-1 shrink-0" size={18} />
                          <div className="w-full flex-1">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                              {vi ? "Điểm đón chiều đi tại Nha Trang" : "Outbound Pickup in Nha Trang"}
                            </p>
                            <div className="mt-1.5 flex items-center border border-slate-200 dark:border-slate-800 rounded-xl px-3 h-10 bg-white dark:bg-slate-900 focus-within:border-blue-500/50 transition-colors w-full">
                              <input
                                type="text"
                                placeholder={vi ? "Nhập địa chỉ khách sạn, resort..." : "Enter hotel, resort or address..."}
                                value={nhaTrangAddress}
                                onChange={(e) => handleNhaTrangAddressChange(e.target.value)}
                                className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                              />
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-snug">
                              {vi ? "Khách sạn, Resort, Nhà riêng hoặc Homestay" : "Hotels, Resorts, Private house or Homestays"}
                            </p>
                          </div>
                        </div>

                        {/* Dropoff: Airport */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3">
                          <MapPin className="text-blue-600 dark:text-blue-400 mt-1 shrink-0" size={18} />
                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                              {vi ? "Điểm trả chiều đi" : "Outbound Dropoff"}
                            </p>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">
                              {vi ? "Sân bay Cam Ranh (CXR)" : "Cam Ranh Airport (CXR)"}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
                              {vi ? "Tài xế trả khách tại sảnh đi ga đi" : "Driver drops off at departure terminal gate"}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Outbound Date, Time & Flight Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    {/* Date picker */}
                    <div className="flex flex-col w-full">
                      <DatePicker
                        value={dateValue}
                        onChange={setDateValue}
                        minValue={today(getLocalTimeZone())}
                        className="w-full"
                        aria-label="Outbound Date Picker"
                      >
                        <Label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">
                          {vi ? "Ngày đi" : "Departure Date"}
                        </Label>
                        <DateField.Group className="h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex items-center justify-between">
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

                    {/* Time Picker */}
                    <TimePicker
                      value={timeValue}
                      onChange={setTimeValue}
                      label={vi ? "Giờ đón đi" : "Outbound Time"}
                      labelClassName="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1"
                      popoverTitle={vi ? "Chọn giờ đi" : "Select Outbound Time"}
                      language={language}
                    />

                    {/* Flight Code */}
                    <div className="flex flex-col w-full">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">
                        {vi ? "Mã chuyến bay đi" : "Outbound Flight (optional)"}
                      </label>
                      <div className="flex items-center h-10 border border-slate-200 dark:border-slate-800 rounded-xl px-3 bg-white dark:bg-slate-900 hover:border-blue-500/50 transition-colors">
                        <Plane size={16} className="text-slate-400 dark:text-slate-500 mr-2 shrink-0" />
                        <input
                          type="text"
                          placeholder="VN123, QH456..."
                          value={flightNumber}
                          onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                          className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Return Trip Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 py-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      {vi ? "Chiều Về" : "Return Leg"}
                    </span>
                    <div className="flex-1 h-[1px] bg-slate-100 dark:bg-slate-800/80" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {outboundStartsFrom === "airport" ? (
                      <>
                        {/* Pickup: Nha Trang Address */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3 w-full">
                          <MapPin className="text-green-600 dark:text-green-400 mt-1 shrink-0" size={18} />
                          <div className="w-full flex-1">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                              {vi ? "Điểm đón chiều về tại Nha Trang" : "Return Pickup in Nha Trang"}
                            </p>
                            <div className="mt-1.5 flex items-center border border-slate-200 dark:border-slate-800 rounded-xl px-3 h-10 bg-white dark:bg-slate-900 focus-within:border-blue-500/50 transition-colors w-full">
                              <input
                                type="text"
                                placeholder={vi ? "Nhập địa chỉ đón nếu khác chiều đi..." : "Enter return address if different..."}
                                value={nhaTrangReturnAddress}
                                onChange={(e) => handleNhaTrangReturnAddressChange(e.target.value)}
                                className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                              />
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-snug">
                              {vi ? "Mặc định giống địa chỉ chiều đi" : "Defaults to outbound address if left blank"}
                            </p>
                          </div>
                        </div>

                        {/* Dropoff: Airport */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3">
                          <MapPin className="text-blue-600 dark:text-blue-400 mt-1 shrink-0" size={18} />
                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                              {vi ? "Điểm trả chiều về" : "Return Dropoff"}
                            </p>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">
                              {vi ? "Sân bay Cam Ranh (CXR)" : "Cam Ranh Airport (CXR)"}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
                              {vi ? "Tài xế trả khách tại sảnh đi ga đi" : "Driver drops off at departure terminal gate"}
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Pickup: Airport */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3">
                          <MapPin className="text-blue-600 dark:text-blue-400 mt-1 shrink-0" size={18} />
                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                              {vi ? "Điểm đón chiều về" : "Return Pickup"}
                            </p>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">
                              {vi ? "Sân bay Cam Ranh (CXR)" : "Cam Ranh Airport (CXR)"}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
                              {vi ? "Tài xế cầm biển đón khách tại ga đến" : "Driver holds sign at arrivals gate"}
                            </p>
                          </div>
                        </div>

                        {/* Dropoff: Nha Trang Address */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3 w-full">
                          <MapPin className="text-green-600 dark:text-green-400 mt-1 shrink-0" size={18} />
                          <div className="w-full flex-1">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                              {vi ? "Điểm trả chiều về tại Nha Trang" : "Return Dropoff in Nha Trang"}
                            </p>
                            <div className="mt-1.5 flex items-center border border-slate-200 dark:border-slate-800 rounded-xl px-3 h-10 bg-white dark:bg-slate-900 focus-within:border-blue-500/50 transition-colors w-full">
                              <input
                                type="text"
                                placeholder={vi ? "Nhập địa chỉ trả nếu khác chiều đi..." : "Enter return address if different..."}
                                value={nhaTrangReturnAddress}
                                onChange={(e) => handleNhaTrangReturnAddressChange(e.target.value)}
                                className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                              />
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-snug">
                              {vi ? "Mặc định giống địa chỉ chiều đi" : "Defaults to outbound address if left blank"}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Return Date, Time & Flight Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    {/* Date picker */}
                    <div className="flex flex-col w-full">
                      <DatePicker
                        value={returnDateValue}
                        onChange={setReturnDateValue}
                        minValue={dateValue || today(getLocalTimeZone())}
                        className="w-full"
                        aria-label="Return Date Picker"
                      >
                        <Label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">
                          {vi ? "Ngày về" : "Return Date"}
                        </Label>
                        <DateField.Group className="h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex items-center justify-between">
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

                    {/* Time Picker */}
                    <TimePicker
                      value={returnTimeValue}
                      onChange={setReturnTimeValue}
                      label={vi ? "Giờ đón về" : "Return Time"}
                      labelClassName="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1"
                      popoverTitle={vi ? "Chọn giờ về" : "Select Return Time"}
                      language={language}
                    />

                    {/* Flight Code */}
                    <div className="flex flex-col w-full">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">
                        {vi ? "Mã chuyến bay về" : "Return Flight (optional)"}
                      </label>
                      <div className="flex items-center h-10 border border-slate-200 dark:border-slate-800 rounded-xl px-3 bg-white dark:bg-slate-900 hover:border-blue-500/50 transition-colors">
                        <Plane size={16} className="text-slate-400 dark:text-slate-500 mr-2 shrink-0" />
                        <input
                          type="text"
                          placeholder="VN123, QH456..."
                          value={returnFlightNumber}
                          onChange={(e) => setReturnFlightNumber(e.target.value.toUpperCase())}
                          className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Badges Info */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-slate-600 dark:text-slate-300">
                ⏱️ {estimatedDuration ? (vi ? `Dự kiến: ~${estimatedDuration} phút` : `Est: ~${estimatedDuration} mins`) : (vi ? "Di chuyển ~45 phút" : "45 min duration")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-slate-600 dark:text-slate-300">
                📏 {estimatedDistance ? (vi ? `Khoảng cách: ~${estimatedDistance} km` : `Distance: ~${estimatedDistance} km`) : (vi ? "Khoảng cách ~35 km" : "35 km distance")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-slate-600 dark:text-slate-300">
                💰 {vi ? "Giá cố định trọn gói" : "Fixed & Transparent Price"}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-slate-600 dark:text-slate-300">
                🙋‍♂️ {vi ? "Đón tận ga/Khách sạn" : "Meet & Greet Included"}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-slate-600 dark:text-slate-300">
                🔄 {vi ? "Miễn phí hủy/đổi lịch" : "Free Cancellation"}
              </span>
            </div>
          </div>

          {/* Interactive Routing Map */}
          <RoutingMap
            nhaTrangAddress={nhaTrangAddress}
            direction={tripType === "one-way" ? direction : (outboundStartsFrom === "airport" ? "to-nhatrang" : "to-camranh")}
            onRouteCalculated={(duration, distance) => {
              setEstimatedDuration(duration);
              setEstimatedDistance(distance);
            }}
          />

          {/* Vehicle Selection List */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="bg-[#0b66e4] w-2.5 h-5 rounded-full inline-block" />
              {vi ? "Chọn loại xe phục vụ" : "Select Vehicle Category"}
            </h3>

            <div className="space-y-3">
              {VEHICLES.map((vehicle) => {
                const vehiclePrice = tripType === "one-way" ? vehicle.priceOneWay : vehicle.priceReturn;
                const isSelected = selectedVehicleId === vehicle.id;

                return (
                  <div
                    key={vehicle.id}
                    onClick={() => setSelectedVehicleId(vehicle.id)}
                    className={`group relative flex flex-col md:flex-row items-stretch bg-white dark:bg-slate-900 border rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? "border-[#0b66e4] border-3 shadow-md bg-blue-50/10 dark:bg-blue-950/15"
                        : "border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                    }`}
                  >
                    {/* Empty image placeholder container, as requested by user to be styled but blank */}
                    <div className="w-full md:w-44 bg-slate-100 dark:bg-slate-900 flex items-center justify-center relative min-h-[120px] md:min-h-0 shrink-0">
                      <div className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-600 p-4 text-center">
                        <User size={24} className="opacity-40" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {vi ? "Ảnh xe" : "Car Photo"}
                        </span>
                      </div>
                      {/* Badge for popular options */}
                      {(vehicle.id === "4-seater" || vehicle.id === "carnival") && (
                        <span className="absolute top-2.5 left-2.5 bg-[#0b66e4] text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider shadow-sm">
                          {vi ? "Được chọn nhiều" : "Popular"}
                        </span>
                      )}
                    </div>

                    {/* Vehicle details */}
                    <div className="flex-1 p-5 flex flex-col justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                            {vi ? vehicle.nameVi : vehicle.nameEn}
                          </h4>
                          <span className="text-xs font-extrabold text-[#0b66e4] dark:text-blue-400">
                            {vi ? "Giá từ:" : "From:"} {formatPrice(vehiclePrice)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {vi ? vehicle.descVi : vehicle.descEn}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                        {/* Specs */}
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 font-bold">
                            <User size={13} className="text-slate-400" />
                            {vehicle.capacity}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 font-bold">
                            <Briefcase size={13} className="text-slate-400" />
                            {vehicle.luggage}
                          </span>
                        </div>

                        {/* Features Badges */}
                        <div className="flex items-center gap-1.5">
                          {(vi ? vehicle.featuresVi : vehicle.featuresEn).map((f, i) => (
                            <span
                              key={i}
                              className="text-[9px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-500 dark:text-slate-400"
                            >
                              {f}
                            </span>
                          ))}
                        </div>

                        {/* Custom Select Button */}
                        <button
                          type="button"
                          className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                            isSelected
                              ? "bg-[#0b66e4] text-white shadow-sm"
                              : "bg-slate-100 dark:bg-slate-800 hover:bg-[#0b66e4]/10 hover:text-[#0b66e4] text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {isSelected ? (vi ? "Đang chọn" : "Selected") : (vi ? "Chọn loại này" : "Select")}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Trip Summary */}
        <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-5">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider pb-3 border-b border-slate-100 dark:border-slate-800">
              {vi ? "Thông tin chuyến đi" : "Trip Summary"}
            </h3>

            {/* Summary Details */}
            <div className="space-y-3.5">
              {tripType === "one-way" ? (
                <>
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold shrink-0">
                      {vi ? "Tuyến đường:" : "Route:"}
                    </span>
                    <span className="text-xs font-black text-right text-slate-800 dark:text-slate-200">
                      {direction === "to-nhatrang"
                        ? (vi ? `Sân bay Cam Ranh ➔ ${nhaTrangAddress || "Nha Trang"}` : `Cam Ranh Airport ➔ ${nhaTrangAddress || "Nha Trang"}`)
                        : (vi ? `${nhaTrangAddress || "Nha Trang"} ➔ Sân bay Cam Ranh` : `${nhaTrangAddress || "Nha Trang"} ➔ Cam Ranh Airport`)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                      {vi ? "Loại chuyến:" : "Trip Type:"}
                    </span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {vi ? "Một chiều" : "1-Way"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                      {vi ? "Ngày đón:" : "Date:"}
                    </span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {dateValue ? dateValue.toString() : (vi ? "Chưa chọn" : "Not Selected")}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                      {vi ? "Giờ đón:" : "Time:"}
                    </span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {`${String(timeValue.hour).padStart(2, "0")}:${String(timeValue.minute).padStart(2, "0")} ${timeValue.period}`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                      {vi ? "Số hiệu bay:" : "Flight No:"}
                    </span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {flightNumber || (vi ? "Không có" : "None")}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold shrink-0">
                      {vi ? "Tuyến đường:" : "Route:"}
                    </span>
                    <span className="text-xs font-black text-right text-slate-800 dark:text-slate-200">
                      {outboundStartsFrom === "airport"
                        ? (vi ? `Khứ hồi (Sân bay ⇄ ${nhaTrangAddress || "Nha Trang"})` : `Round Trip (Airport ⇄ ${nhaTrangAddress || "Nha Trang"})`)
                        : (vi ? `Khứ hồi (${nhaTrangAddress || "Nha Trang"} ⇄ Sân bay)` : `Round Trip (${nhaTrangAddress || "Nha Trang"} ⇄ Airport)`)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                      {vi ? "Loại chuyến:" : "Trip Type:"}
                    </span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {vi ? "Khứ hồi" : "Round Trip"}
                    </span>
                  </div>

                  {/* Outbound leg details */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-1.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {vi ? "▼ CHIỀU ĐI:" : "▼ OUTBOUND:"}
                    </div>
                    <div className="flex justify-between items-center pl-2">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                        {vi ? "Ngày đón:" : "Date:"}
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {dateValue ? dateValue.toString() : (vi ? "Chưa chọn" : "Not Selected")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pl-2">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                        {vi ? "Giờ đón:" : "Time:"}
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {`${String(timeValue.hour).padStart(2, "0")}:${String(timeValue.minute).padStart(2, "0")} ${timeValue.period}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pl-2">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                        {vi ? "Số hiệu bay đi:" : "Flight No:"}
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {flightNumber || (vi ? "Không có" : "None")}
                      </span>
                    </div>
                  </div>

                  {/* Return leg details */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-1.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-green-600 dark:text-green-400">
                      {vi ? "▼ CHIỀU VỀ:" : "▼ RETURN:"}
                    </div>
                    <div className="flex justify-between items-center pl-2">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                        {vi ? "Ngày về:" : "Date:"}
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {returnDateValue ? returnDateValue.toString() : (vi ? "Chưa chọn" : "Not Selected")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pl-2">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                        {vi ? "Giờ về:" : "Time:"}
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {`${String(returnTimeValue.hour).padStart(2, "0")}:${String(returnTimeValue.minute).padStart(2, "0")} ${returnTimeValue.period}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pl-2">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                        {vi ? "Số hiệu bay về:" : "Flight No:"}
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {returnFlightNumber || (vi ? "Không có" : "None")}
                      </span>
                    </div>
                  </div>
                </>
              )}

              <div className="border-t border-slate-100 dark:border-slate-800 pt-2" />

              {estimatedDistance !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                    {vi ? "Quãng đường:" : "Distance:"}
                  </span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                    ~{estimatedDistance} km {tripType === "return" && (vi ? "(mỗi chiều)" : "(per leg)")}
                  </span>
                </div>
              )}

              {estimatedDuration !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                    {vi ? "Thời gian đi dự kiến:" : "Est. Travel Time:"}
                  </span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                    ~{estimatedDuration} {vi ? "phút" : "mins"} {tripType === "return" && (vi ? "(mỗi chiều)" : "(per leg)")}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                  {vi ? "Loại xe đã chọn:" : "Car Category:"}
                </span>
                <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                  {vi ? selectedVehicle.nameVi : selectedVehicle.nameEn}
                </span>
              </div>

              {/* Total Price with Skeleton */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <span className="text-xs text-slate-700 dark:text-slate-300 font-black">
                  {vi ? "TỔNG THANH TOÁN:" : "TOTAL FARE:"}
                </span>
                <div className="h-9 flex items-center justify-end min-w-[120px]">
                  {isCalculating ? (
                    <Skeleton className="w-24 h-6 rounded-lg bg-slate-200 dark:bg-slate-800" />
                  ) : (
                    <span className="text-lg font-black text-blue-700 dark:text-blue-400">
                      {formatPrice(unitPrice)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Booking action button */}
            <button
              type="button"
              onClick={handleBooking}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-xs font-black hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95 border-none"
            >
              <MessageCircle size={15} />
              <span>{vi ? "Xác Nhận Đặt Xe Qua Zalo" : "Confirm Booking via Zalo"}</span>
            </button>

            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-medium">
              🔒 {vi ? "Cam kết giá trọn gói - Không phí ẩn" : "Guaranteed fixed price - No hidden fees"}
            </p>
          </div>
        </div>

      </main>

      {/* Accordion & Service Commitments Section */}
      <section className="bg-slate-100/60 dark:bg-slate-950 border-t border-slate-200/50 dark:border-slate-900 py-12 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white text-center">
            {vi ? "Cam kết dịch vụ & Thông tin lưu ý" : "Service Commitments & FAQs"}
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Box: Commitments & Night Surcharge */}
            <div className="lg:col-span-6 space-y-4">
              {/* Box 1: Surcharge Notice */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2">
                <h3 className="text-xs font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-2 uppercase tracking-wider">
                  <span>⏰</span> {vi ? "Phụ thu khung giờ đêm" : "Night Service Surcharge"}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {vi
                    ? "Đón khách trong khung giờ từ 20:00 – 06:00 sáng hôm sau phụ thu thêm:"
                    : "Pickup between 20:00 – 06:00 AM next day incurs surcharge:"}
                </p>
                <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-slate-300 space-y-1 font-bold">
                  <li>{vi ? "Xe 4/7/16 chỗ: +50.000đ / chuyến" : "4 / 7 / 16 Seater: +50,000 VND / trip"}</li>
                  <li>{vi ? "Xe Carnival / Limousine / 29-45 chỗ: +100.000đ / chuyến" : "Carnival / Limousine / Large coaches: +100,000 VND / trip"}</li>
                </ul>
              </div>

              {/* Box 2: Commitments */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm space-y-3.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  {vi ? "Cam kết & Lưu ý nhanh từ Minh Khoa Travel" : "Why Choose Minh Khoa Travel?"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={15} />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {vi ? "Theo dõi chuyến bay, đón tiễn đúng giờ" : "Flight status monitoring, prompt pickup"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={15} />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {vi ? "Hủy/Đổi lịch miễn phí trước 24h" : "Free cancel/reschedule up to 24h prior"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={15} />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {vi ? "Không cần cọc với xe 4/7/16 chỗ" : "No deposit needed for 4/7/16 seater"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={15} />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {vi ? "Xe mới sạch sẽ, tài xế lịch sự" : "New clean vehicles, polite drivers"}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-blue-50/30 dark:bg-slate-950 border border-blue-500/10 rounded-xl">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    💡 {vi ? "Nhiều khách quen miệng gọi sân bay Nha Trang nhưng tên chính thức là Sân bay Cam Ranh (cách trung tâm Nha Trang ~35km). Quý khách vui lòng đặt xe trước 1 ngày để chúng tôi sắp xếp chu đáo nhất." : "Nha Trang Airport is formally Cam Ranh Airport (CXR), located about 35km from central Nha Trang. Please book at least 1 day in advance for the best arrangement."}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Box: FAQ Collapsible Accordions */}
            <div className="lg:col-span-6 space-y-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
                {vi ? "Câu hỏi thường gặp (FAQ)" : "Frequently Asked Questions"}
              </h3>

              {[
                {
                  qVi: "Xe có đón/trả tận nơi?",
                  qEn: "Is it door-to-door service?",
                  aVi: "Có, Minh Khoa Travel đón và trả tận nơi theo địa chỉ bạn đặt trước (Sân bay, khách sạn, resort, nhà riêng...).",
                  aEn: "Yes, we offer direct door-to-door transport according to your request (Airport, Hotels, Resorts, Homestays...)."
                },
                {
                  qVi: "Có cần đặt cọc trước không?",
                  qEn: "Do I need to make a deposit?",
                  aVi: "Đối với dòng xe phổ thông 4, 7 và 16 chỗ, bạn không cần phải đặt cọc trước. Các xe lớn (29-45 chỗ) hoặc dòng xe VIP Limousine/Carnival vui lòng liên hệ tư vấn viên để được hỗ trợ.",
                  aEn: "No deposit is required for 4, 7, and 16-seater standard vehicles. For larger buses or luxury models, please speak with our consultants."
                },
                {
                  qVi: "Có xuất hóa đơn VAT không?",
                  qEn: "Can you provide VAT invoices?",
                  aVi: "Có, chúng tôi hỗ trợ xuất hóa đơn VAT đầy đủ theo yêu cầu của quý doanh nghiệp và hành khách công tác.",
                  aEn: "Yes, we support and issue official VAT invoices for corporate clients or business travellers."
                },
                {
                  qVi: "Tôi có thể đổi giờ đón được không?",
                  qEn: "Can I reschedule/change pick-up time?",
                  aVi: "Có, bạn hoàn toàn có thể đổi giờ đón. Vui lòng báo trước cho điều hành xe khoảng 60 phút để chúng tôi kịp sắp xếp tài xế đón bạn thuận lợi nhất.",
                  aEn: "Yes, you can reschedule. Please inform us at least 60 minutes in advance so we can adjust the driver assignment."
                },
                {
                  qVi: "Nếu chuyến bay của tôi bị trễ thì sao?",
                  qEn: "What if my flight is delayed?",
                  aVi: "Đừng lo lắng! Tài xế của chúng tôi theo dõi lịch trình bay thực tế của bạn qua số hiệu chuyến bay bạn cung cấp và sẽ đón bạn đúng thời gian hạ cánh thực tế.",
                  aEn: "Don't worry! Our drivers monitor your flight status using the flight code provided, adjusting pickup times accordingly."
                }
              ].map((faq, index) => {
                const isOpen = activeFaq === index;

                return (
                  <div
                    key={index}
                    className="border-b border-slate-100 dark:border-slate-800/80 pb-2.5 last:border-0 last:pb-0"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveFaq(isOpen ? null : index)}
                      className="w-full flex items-center justify-between text-left py-2 hover:text-[#0b66e4] transition-colors cursor-pointer border-none bg-transparent"
                    >
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {vi ? faq.qVi : faq.qEn}
                      </span>
                      <span className="text-slate-400 dark:text-slate-600 font-bold ml-2">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                    {isOpen && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1.5 pb-1 font-semibold pl-1">
                        {vi ? faq.aVi : faq.aEn}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
