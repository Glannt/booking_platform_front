"use client";
import { useState, useEffect } from "react";
import {
  Label,
  DatePicker,
  DateField,
  Calendar,
  Skeleton
} from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { getLocalTimeZone, today } from "@internationalized/date";
import {
  Car,
  MapPin,
  ShieldCheck,
  ChevronUp,
  Phone,
  MessageCircle,
  Sparkles,
  Headset,
  User,
  CalendarDays,
  FileText,
  UserCheck,
  DollarSign
} from "lucide-react";

import { TimePicker, type TimeValue } from "@/components/time-picker";
import { useI18n } from "@/context/LanguageContext";

interface Vehicle {
  id: string;
  nameVi: string;
  nameEn: string;
  modelsVi: string;
  modelsEn: string;
  pricePerDay: number;
  featuresVi: string[];
  featuresEn: string[];
  capacity: string;
  luggage: string;
  descVi: string;
  descEn: string;
  imgUrl: string;
}

const VEHICLES: Vehicle[] = [
  {
    id: "5-seater-b",
    nameVi: "Xe 5 chỗ – Phân khúc B",
    nameEn: "5-Seater – B-Segment",
    modelsVi: "Honda City, Vios, Accent, Mazda 2",
    modelsEn: "Honda City, Vios, Accent, Mazda 2",
    pricePerDay: 700000,
    featuresVi: ["Tiết kiệm xăng", "Dễ lái", "Đời mới sạch sẽ"],
    featuresEn: ["Fuel efficient", "Easy to drive", "Clean new model"],
    capacity: "4-5",
    luggage: "2 valy lớn / 2 large suitcases",
    descVi: "Phù hợp di chuyển gia đình nhỏ, công tác trong phố hoặc các chặng ngắn.",
    descEn: "Perfect for small families, city business trips, or short commutes.",
    imgUrl: "https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=800"
  },
  {
    id: "5-seater-c",
    nameVi: "Xe 5 chỗ – Phân khúc C",
    nameEn: "5-Seater – C-Segment",
    modelsVi: "Mazda 3, Kia Cerato, Elantra",
    modelsEn: "Mazda 3, Kia Cerato, Elantra",
    pricePerDay: 800000,
    featuresVi: ["Không gian rộng rãi", "Kiểu dáng sang trọng"],
    featuresEn: ["Spacious cabin", "Elegant design"],
    capacity: "4-5",
    luggage: "3 valy vừa / 3 medium suitcases",
    descVi: "Rộng rãi hơn, lái êm ái thích hợp cho các hành trình dài ngày.",
    descEn: "More spacious and comfortable, ideal for multi-day road trips.",
    imgUrl: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=800"
  },
  {
    id: "7-seater-mpv",
    nameVi: "Xe 7 chỗ – Dòng MPV",
    nameEn: "7-Seater – MPV Class",
    modelsVi: "Xpander, Veloz, Carens",
    modelsEn: "Xpander, Veloz, Carens",
    pricePerDay: 800000,
    featuresVi: ["Phù hợp gia đình", "Tiết kiệm nhiên liệu"],
    featuresEn: ["Great for families", "Highly fuel efficient"],
    capacity: "7 chỗ / 7 seats",
    luggage: "3-4 valy / 3-4 suitcases",
    descVi: "Dòng xe đa dụng quốc dân, linh hoạt gập ghế chở nhiều hành lý.",
    descEn: "The standard multi-purpose vehicle, flexible seating for extra luggage.",
    imgUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=800"
  },
  {
    id: "7-seater-suv",
    nameVi: "Xe 7 chỗ – Dòng SUV",
    nameEn: "7-Seater – SUV Class",
    modelsVi: "Fortuner, Pajero Sport, MU-X",
    modelsEn: "Fortuner, Pajero Sport, MU-X",
    pricePerDay: 1200000,
    featuresVi: ["Gầm cao máy khỏe", "Chinh phục mọi địa hình"],
    featuresEn: ["High ground clearance", "Powerful engine"],
    capacity: "7 chỗ / 7 seats",
    luggage: "4-5 valy / 4-5 suitcases",
    descVi: "Động cơ mạnh mẽ, khoang xe rộng rãi, sẵn sàng cho mọi cung đường đèo dốc.",
    descEn: "Strong performance, spacious cabin, ready for mountainous terrains.",
    imgUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800"
  },
  {
    id: "7-seater-vip",
    nameVi: "Xe 7 chỗ – Cao cấp (Carnival)",
    nameEn: "7-Seater – Luxury (Carnival)",
    modelsVi: "Kia Carnival",
    modelsEn: "Kia Carnival",
    pricePerDay: 1600000,
    featuresVi: ["Tiện nghi cao cấp", "Ghế thương gia rộng rãi"],
    featuresEn: ["Premium amenities", "Spacious captain seats"],
    capacity: "7 chỗ / 7 seats",
    luggage: "5-6 valy / 5-6 suitcases",
    descVi: "Đẳng cấp xe gia đình & doanh nhân. Ghế thương gia chỉnh điện, cửa lùa êm ái.",
    descEn: "First-class family & business transport. Electric captain seats, quiet ride.",
    imgUrl: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=800"
  }
];

export default function SelfDrivePage() {
  const { language } = useI18n();
  const vi = language === "vi";

  // Form states
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateValue, setDateValue] = useState<DateValue | null>(null);
  const [timeValue, setTimeValue] = useState<TimeValue>({ hour: 8, minute: 0, period: "AM" });
  const [rentalDays, setRentalDays] = useState<number>(1);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("5-seater-b");
  const [pickupLocation, setPickupLocation] = useState("");

  const [isCalculating, setIsCalculating] = useState(false);
  const [price, setPrice] = useState(700000);

  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showContactMenu, setShowContactMenu] = useState(false);

  const currentDate = today(getLocalTimeZone());
  const isDateInvalid = dateValue != null && dateValue.compare(currentDate) < 0;

  // Selected vehicle details
  const selectedVehicle = VEHICLES.find((v) => v.id === selectedVehicleId) || VEHICLES[0];

  // Scroll logic
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

  // Pricing calculator simulation
  useEffect(() => {
    setIsCalculating(true);
    const timer = setTimeout(() => {
      const dailyPrice = selectedVehicle.pricePerDay;
      setPrice(dailyPrice * rentalDays);
      setIsCalculating(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedVehicleId, rentalDays]);

  // Submit to Zalo
  const handleZaloSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!fullName || !phoneNumber || !dateValue || !pickupLocation) {
      alert(vi ? "Vui lòng điền đầy đủ các thông tin bắt buộc!" : "Please fill in all required fields!");
      return;
    }

    const pickupDateText = dateValue.toString();
    const pickupTimeText = `${String(timeValue.hour).padStart(2, "0")}:${String(timeValue.minute).padStart(2, "0")} ${timeValue.period}`;
    const vehicleText = vi ? selectedVehicle.nameVi : selectedVehicle.nameEn;
    const formattedPrice = price.toLocaleString("vi-VN") + " VNĐ";

    const message = `[Minh Khoa Travel - Yêu Cầu Thuê Xe Tự Lái Nha Trang]\n` +
      `- Họ và tên: ${fullName}\n` +
      `- Số điện thoại: ${phoneNumber}\n` +
      `- Ngày nhận xe: ${pickupDateText}\n` +
      `- Giờ nhận xe: ${pickupTimeText}\n` +
      `- Số ngày thuê: ${rentalDays} ngày\n` +
      `- Dòng xe mong muốn: ${vehicleText} (${selectedVehicle.modelsVi})\n` +
      `- Địa điểm nhận xe: ${pickupLocation}\n` +
      `- Tổng tiền tạm tính: ${formattedPrice}`;

    window.open(`https://zalo.me/0764971971?text=${encodeURIComponent(message)}`, "_blank");
  };

  // Quick call/request trigger
  const handleCall = () => {
    window.open("tel:0764971971");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans">
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
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* Hero Banner Section */}
      <section className="relative w-full min-h-[340px] flex items-center pt-28 pb-14 px-6 overflow-hidden">
        {/* Background image & overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920')`
          }}
        >
          <div className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-[1.5px]" />
        </div>

        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10 text-white">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 dark:bg-slate-900/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
              <Sparkles size={13} className="text-[#0b66e4] dark:text-blue-400" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-100">
                {vi ? "Dịch vụ uy tín tại Nha Trang" : "Top Car Rental Service in Nha Trang"}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              {vi ? "Thuê Xe Tự Lái Nha Trang – Giao Xe Tận Nơi" : "Nha Trang Self-Drive Car Rental - Doorstep Delivery"}
            </h1>
            <p className="text-sm md:text-base text-slate-200 leading-relaxed font-semibold max-w-2xl">
              {vi
                ? "Minh Khoa Travel chuyên cung cấp dịch vụ thuê xe tự lái Nha Trang. Xe đời mới – Thủ tục nhanh – Hợp đồng rõ ràng – Hỗ trợ 24/7. Hỗ trợ giao/nhận xe tại trung tâm, khách sạn, bến xe/nhà ga, hoặc sân bay Cam Ranh (phụ phí nhỏ nếu xa trung tâm)."
                : "Minh Khoa Travel specializes in self-drive rentals in Nha Trang. Modern cars – Quick procedure – Transparent contract – 24/7 support. Pickup/delivery support at Central, Hotels, Stations, or Cam Ranh Airport (small extra fee if far)."}
            </p>

            {/* Quick Price Badges */}
            <div className="flex flex-wrap gap-3 pt-2">
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/15 backdrop-blur-sm shadow-sm">
                <Car size={15} className="text-blue-400" />
                <span className="text-xs font-black">
                  {vi ? "Xe 5 chỗ chỉ từ 700k/ngày" : "5-Seater: from 700k/day"}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/15 backdrop-blur-sm shadow-sm">
                <Car size={15} className="text-green-400" />
                <span className="text-xs font-black">
                  {vi ? "Xe 7 chỗ chỉ từ 800k/ngày" : "7-Seater: from 800k/day"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleCall}
            className="flex items-center gap-2.5 bg-[#0b66e4] hover:bg-blue-700 text-white px-6 py-3.5 rounded-full text-xs font-black transition-all shadow-lg hover:scale-105 active:scale-95 no-underline shrink-0 border-none cursor-pointer"
          >
            <Phone size={16} />
            <span>{vi ? "Gọi 0764.971.971" : "Call 0764.971.971"}</span>
          </button>
        </div>
      </section>

      {/* Main Layout Area */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Catalog & Details */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Quick intro text box */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/80 leading-relaxed font-semibold text-xs md:text-sm text-slate-600 dark:text-slate-355">
            <p>
              {vi
                ? "Dịch vụ thuê xe tự lái Nha Trang của Minh Khoa Travel được nhiều khách hàng tin tưởng bởi xe đời mới, hợp đồng minh bạch và hỗ trợ 24/7. Chúng tôi giao xe tận nơi tại trung tâm thành phố, khách sạn hoặc sân bay Cam Ranh, giúp bạn chủ động trong lịch trình và tiết kiệm chi phí di chuyển."
                : "Minh Khoa Travel self-drive rental services in Nha Trang are trusted by clients due to clean modern fleets, transparent rental contracts, and 24/7 customer support. We support delivery directly to hotels, central city points, or Cam Ranh Airport, giving you full command of your itinerary."}
            </p>
          </div>

          {/* Catalog & Car list */}
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="bg-[#0b66e4] w-2.5 h-5 rounded-full inline-block" />
              {vi ? "Hình ảnh tiêu biểu & Phân khúc xe tự lái" : "Self-Drive Fleet & Catalog Categories"}
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider pl-1">
              {vi ? "Xe 5–7 chỗ tự lái, đời mới – sạch – tiết kiệm nhiên liệu." : "Modern 5 to 7 Seater fleets – Clean, comfortable & fuel efficient."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {VEHICLES.map((vehicle) => {
                const isSelected = selectedVehicleId === vehicle.id;
                return (
                  <div
                    key={vehicle.id}
                    onClick={() => setSelectedVehicleId(vehicle.id)}
                    className={`flex flex-col rounded-3xl overflow-hidden border cursor-pointer transition-all duration-300 bg-white dark:bg-slate-900 ${
                      isSelected
                        ? "border-[#0b66e4] border-2 shadow-md ring-2 ring-[#0b66e4]/10"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                    }`}
                  >
                    <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-950">
                      <img
                        src={vehicle.imgUrl}
                        alt={vi ? vehicle.nameVi : vehicle.nameEn}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-extrabold px-3 py-1 rounded-full tracking-wider">
                        {vehicle.pricePerDay.toLocaleString("vi-VN")}đ / {vi ? "ngày" : "day"}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {vi ? vehicle.nameVi : vehicle.nameEn}
                          </h4>
                          <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {vehicle.capacity} {vi ? "chỗ" : "seats"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#0b66e4] dark:text-blue-400 font-extrabold">
                          {vi ? "Dòng tiêu biểu:" : "Models:"} {vi ? vehicle.modelsVi : vehicle.modelsEn}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                          {vi ? vehicle.descVi : vehicle.descEn}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/60">
                        {(vi ? vehicle.featuresVi : vehicle.featuresEn).map((f, i) => (
                          <span
                            key={i}
                            className="text-[9px] font-extrabold uppercase bg-slate-100 dark:bg-slate-850 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300"
                          >
                            ✓ {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing Table Section */}
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="bg-[#0b66e4] w-2.5 h-5 rounded-full inline-block" />
              {vi ? "Bảng giá thuê xe tự lái Nha Trang" : "Self-Drive Rental Pricing List"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {vi
                ? "Giá theo ngày, đã bao gồm số km (200km/ngày) - tiêu chuẩn trong nội tỉnh. Phát sinh: phụ thu giao/nhận xa, phụ phí lễ/Tết, hoặc chạy đường dài. Vui lòng liên hệ để xác nhận."
                : "Daily rate, includes km allowance (200km/day) within the province limits. Additional: long range, holiday surcharge or distant delivery fees apply. Contact us to verify."}
            </p>

            <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800/80 font-black text-slate-900 dark:text-white text-[11px] uppercase tracking-wider">
                      <th className="p-4">{vi ? "Phân khúc" : "Segment"}</th>
                      <th className="p-4">{vi ? "Dòng xe tiêu biểu" : "Representative Models"}</th>
                      <th className="p-4 text-right">{vi ? "Giá (VNĐ/ngày)" : "Daily Rate"}</th>
                      <th className="p-4">{vi ? "Ghi chú" : "Notes"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                    {VEHICLES.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/55 dark:hover:bg-slate-850/40 transition-colors">
                        <td className="p-4 font-bold text-slate-900 dark:text-slate-200">
                          {vi ? v.nameVi : v.nameEn}
                        </td>
                        <td className="p-4">
                          {vi ? v.modelsVi : v.modelsEn}
                        </td>
                        <td className="p-4 text-right font-extrabold text-[#0b66e4] dark:text-blue-400">
                          {v.pricePerDay.toLocaleString("vi-VN")}đ
                        </td>
                        <td className="p-4 text-slate-500 dark:text-slate-400">
                          {vi ? v.featuresVi[0] : v.featuresEn[0]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-blue-50/40 dark:bg-slate-900/30 border border-blue-500/10 rounded-2xl flex items-start gap-2.5">
              <span className="text-[#0b66e4] shrink-0 text-sm">💡</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                {vi ? (
                  <>
                    Có dịch vụ xe đưa đón sân bay Cam Ranh. Nếu lịch trình có chặng sân bay, tham khảo thêm tại{" "}
                    <a href="/airport-transfer" className="text-[#0b66e4] dark:text-blue-400 underline font-extrabold">
                      trang xe sân bay
                    </a>.
                  </>
                ) : (
                  <>
                    Airport transfer to Cam Ranh is also available. If your travel includes airport pickups, visit our{" "}
                    <a href="/airport-transfer" className="text-[#0b66e4] dark:text-blue-400 underline font-extrabold">
                      Airport Transfer Page
                    </a>.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Procedure steps */}
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="bg-[#0b66e4] w-2.5 h-5 rounded-full inline-block" />
              {vi ? "Quy trình & Giấy tờ thuê xe tự lái" : "Procedure & Document Requirements"}
            </h2>
            
            <div className="grid grid-cols-1 gap-4">
              {[
                {
                  step: 1,
                  titleVi: "1) Liên hệ & kiểm tra xe trống",
                  titleEn: "1) Contact & Availability Check",
                  descVi: "Nhắn Zalo hoặc gọi Hotline để kiểm tra loại xe – ngày nhận xe – số ngày thuê – điểm giao/nhận.",
                  descEn: "Chat via Zalo or call Hotline to check availability - select date - rental period - pickup delivery point.",
                  icon: <Phone className="text-blue-600" size={16} />
                },
                {
                  step: 2,
                  titleVi: "2) Gửi giấy tờ",
                  titleEn: "2) Submit Documents",
                  descVi: "CCCD + bằng lái B1/B2 (bản chụp). Trường hợp cần thiết có thể yêu cầu đặt cọc.",
                  descEn: "National ID + Driver license B1/B2 photos. A reservation security deposit might be requested.",
                  icon: <FileText className="text-amber-600" size={16} />
                },
                {
                  step: 3,
                  titleVi: "3) Đặt cọc giữ xe",
                  titleEn: "3) Guarantee Deposit",
                  descVi: "Từ 500.000đ (tùy xe & thời điểm). Xác nhận hợp đồng/phiếu thuê.",
                  descEn: "From 500,000 VND (depending on model and season). Contract validation.",
                  icon: <DollarSign className="text-green-600" size={16} />
                },
                {
                  step: 4,
                  titleVi: "4) Giao/nhận xe & thanh toán",
                  titleEn: "4) Car Delivery & Payment",
                  descVi: "Kiểm tra tình trạng xe – ký biên bản bàn giao – thanh toán phần còn lại.",
                  descEn: "Inspect vehicle physical state – sign delivery form – settle remaining balance.",
                  icon: <UserCheck className="text-indigo-600" size={16} />
                },
                {
                  step: 5,
                  titleVi: "5) Hỗ trợ trong thời gian thuê",
                  titleEn: "5) Rental Period Roadside Support",
                  descVi: "Hỗ trợ kỹ thuật/cứu hộ 24/7 trong phạm vi Nha Trang. Trả xe đúng hẹn để tránh phụ phí.",
                  descEn: "Technical assistance / roadside rescue support 24/7 in Nha Trang. Return on-time to avoid penalties.",
                  icon: <ShieldCheck className="text-emerald-600" size={16} />
                }
              ].map((stepItem, idx) => (
                <div key={idx} className="flex gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-950 flex items-center justify-center shrink-0">
                    {stepItem.icon}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {vi ? stepItem.titleVi : stepItem.titleEn}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                      {vi ? stepItem.descVi : stepItem.descEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call to action panel */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-base md:text-lg font-black">
                {vi ? "Đặt xe tự lái Nha Trang ngay hôm nay!" : "Book Your Self-Drive Car Today!"}
              </h3>
              <p className="text-xs text-blue-100 font-semibold max-w-xl leading-relaxed">
                {vi
                  ? "Nếu bạn đang tìm thuê xe tự lái ở Nha Trang với giá hợp lý, hãy liên hệ ngay Minh Khoa Travel để được tư vấn chi tiết. Chúng tôi có sẵn các dòng xe 4–7 chỗ tiết kiệm nhiên liệu."
                  : "Contact us now for details. Fuel-efficient 4-7 seater models available for tourism, work, or long-range trips."}
              </p>
            </div>

            <div className="flex gap-3 shrink-0">
              <button
                onClick={handleCall}
                className="flex items-center gap-1.5 bg-white text-blue-700 hover:bg-slate-100 px-4 py-2.5 rounded-xl text-xs font-black shadow-sm transition-all border-none cursor-pointer"
              >
                <Phone size={14} />
                <span>{vi ? "Gọi 0764971971" : "Call"}</span>
              </button>
              <button
                onClick={() => handleZaloSubmit()}
                className="flex items-center gap-1.5 bg-amber-500 text-white hover:bg-amber-600 px-4 py-2.5 rounded-xl text-xs font-black shadow-sm transition-all border-none cursor-pointer"
              >
                <MessageCircle size={14} />
                <span>{vi ? "Zalo tư vấn" : "Zalo Consultation"}</span>
              </button>
            </div>
          </div>

          {/* FAQ Accordions */}
          <div className="space-y-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
              {vi ? "Câu hỏi thường gặp (FAQ) – Thuê xe tự lái" : "Frequently Asked Questions"}
            </h3>

            {[
              {
                qVi: "Giá đã bao gồm xăng/dầu và phí cầu đường chưa?",
                qEn: "Is fuel and toll fees included in the rate?",
                aVi: "Chưa bao gồm. Giá thuê xe tự lái chỉ bao gồm tiền thuê xác xe theo ngày. Hành khách tự chịu chi phí xăng dầu thực tế sử dụng và vé cầu đường trong suốt chặng đi.",
                aEn: "No, the rate covers car usage per day only. Customers pay for fuel used during the rental period and any tollway fares."
              },
              {
                qVi: "Giao/nhận xe ở sân bay Cam Ranh có được không?",
                qEn: "Can I receive/return the car at Cam Ranh Airport?",
                aVi: "Được, Minh Khoa Travel hỗ trợ giao nhận xe tận nơi ở sân bay Cam Ranh. Có phụ thu một khoản phí nhỏ hỗ trợ tài xế đưa xe di chuyển từ trung tâm ra sân bay (~35km).",
                aEn: "Yes, delivery/return at Cam Ranh airport is supported. A small delivery surcharge applies due to distance (~35km)."
              },
              {
                qVi: "Muốn đổi sang dịch vụ có tài xế được không?",
                qEn: "Can I upgrade to a driver/chauffeur service?",
                aVi: "Hoàn toàn được. Nếu đang đi giữa chừng hoặc cần đổi lịch sang thuê xe kèm tài xế đi tỉnh, vui lòng liên hệ tư vấn viên để chúng tôi bổ sung tài xế hỗ trợ ngay.",
                aEn: "Absolutely. If you change your plan or prefer a chauffeur provincial transfer, contact us to assign an expert driver immediately."
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

        {/* Right column: Sticky Form & Calculator */}
        <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-5">
            <div className="space-y-1 pb-3 border-b border-slate-100 dark:border-slate-850">
              <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider text-[#0b66e4] dark:text-blue-400">
                ⚡ {vi ? "Đặt nhanh – Giá tốt nhất" : "Quick Request"}
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                {vi ? "Đặt xe tự lái Nha Trang" : "Book Self-Drive Car"}
              </h3>
            </div>

            <form onSubmit={handleZaloSubmit} className="flex flex-col gap-4">
              
              {/* Customer Name */}
              <div className="flex flex-col w-full">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">
                  {vi ? "Tên quý khách" : "Your Name"} <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center h-10 border border-slate-200 dark:border-slate-800 rounded-xl px-3 bg-white dark:bg-slate-900 focus-within:border-blue-500/50 transition-colors">
                  <User size={16} className="text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder={vi ? "VD: Nguyễn Văn A" : "e.g. John Doe"}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="flex flex-col w-full">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">
                  {vi ? "Số điện thoại" : "Phone Number"} <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center h-10 border border-slate-200 dark:border-slate-800 rounded-xl px-3 bg-white dark:bg-slate-900 focus-within:border-blue-500/50 transition-colors">
                  <Phone size={16} className="text-slate-400 mr-2 shrink-0" />
                  <input
                    type="tel"
                    required
                    placeholder={vi ? "VD: 0905123456" : "e.g. 0905123456"}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Date & Time Picker */}
              <div className="grid grid-cols-2 gap-3">
                {/* Pickup Date using HeroUI DatePicker */}
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
                    <Label className="text-[10px] font-extrabold uppercase tracking-wider text-black dark:text-slate-500 mb-1 pl-1">
                      {vi ? "Ngày nhận" : "Date"}
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
                      </Calendar>
                    </DatePicker.Popover>
                  </DatePicker>
                </div>

                {/* Time Picker */}
                <TimePicker
                  value={timeValue}
                  onChange={setTimeValue}
                  label={vi ? "Giờ nhận" : "Time"}
                  labelClassName="text-[10px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1 pl-1"
                  popoverTitle={vi ? "Chọn giờ nhận" : "Select Time"}
                  language={language}
                />
              </div>

              {/* Number of Rental Days & Selected Car Selection dropdown */}
              <div className="flex flex-col w-full">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">
                  {vi ? "Số ngày thuê" : "Rental Duration"} <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center h-10 border border-slate-200 dark:border-slate-800 rounded-xl px-3 bg-white dark:bg-slate-900 focus-within:border-blue-500/50 transition-colors">
                  <CalendarDays size={16} className="text-slate-400 mr-2 shrink-0" />
                  <input
                    type="number"
                    required
                    min={1}
                    max={90}
                    value={rentalDays}
                    onChange={(e) => setRentalDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
                  />
                  <span className="text-xs font-extrabold text-slate-450 shrink-0 ml-1">
                    {vi ? "ngày" : "days"}
                  </span>
                </div>
              </div>

              {/* Selected vehicle class */}
              <div className="flex flex-col w-full">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">
                  {vi ? "Dòng xe mong muốn" : "Desired Vehicle Class"} <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center h-10 border border-slate-200 dark:border-slate-800 rounded-xl px-3 bg-white dark:bg-slate-900 focus-within:border-blue-500/50 transition-colors">
                  <Car size={16} className="text-slate-400 mr-2 shrink-0" />
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none border-none cursor-pointer p-0"
                  >
                    {VEHICLES.map((v) => (
                      <option key={v.id} value={v.id} className="dark:bg-slate-900 dark:text-white text-slate-800">
                        {vi ? v.nameVi : v.nameEn} ({v.pricePerDay.toLocaleString("vi-VN")}đ/{vi ? "ngày" : "day"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Delivery / Pickup address */}
              <div className="flex flex-col w-full">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">
                  {vi ? "Điểm giao/nhận xe" : "Delivery Location"} <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center h-10 border border-slate-200 dark:border-slate-800 rounded-xl px-3 bg-white dark:bg-slate-900 focus-within:border-blue-500/50 transition-colors">
                  <MapPin size={16} className="text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder={vi ? "VD: Khách sạn Mường Thanh, Sân bay..." : "e.g. Muong Thanh Hotel, Airport..."}
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Pricing Calculator Summary Display */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/60 mt-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-455 uppercase tracking-wide">
                  <span>{vi ? "Đơn giá ngày:" : "Daily rate:"}</span>
                  <span className="text-slate-800 dark:text-slate-200 font-extrabold">
                    {selectedVehicle.pricePerDay.toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-455 uppercase tracking-wide mt-1">
                  <span>{vi ? "Thời gian thuê:" : "Rental period:"}</span>
                  <span className="text-slate-800 dark:text-slate-200 font-extrabold">
                    {rentalDays} {vi ? "ngày" : "days"}
                  </span>
                </div>
                <div className="border-t border-slate-200/50 dark:border-slate-700/50 my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-700 dark:text-slate-355 font-black">
                    {vi ? "TỔNG TẠM TÍNH:" : "EST. TOTAL:"}
                  </span>
                  <div className="h-7 flex items-center justify-end min-w-[90px]">
                    {isCalculating ? (
                      <Skeleton className="w-20 h-5 rounded-lg bg-slate-200 dark:bg-slate-800" />
                    ) : (
                      <span className="text-base font-black text-blue-700 dark:text-blue-400">
                        {price.toLocaleString("vi-VN")}đ
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit triggers Zalo */}
              <button
                type="submit"
                disabled={isDateInvalid || !dateValue}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-xs font-black hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-95 border-none"
              >
                <MessageCircle size={15} />
                <span>{vi ? "Gửi Yêu Cầu Qua Zalo" : "Request via Zalo"}</span>
              </button>

            </form>

            <p className="text-[10px] text-center text-slate-450 dark:text-slate-500 font-medium">
              🔒 {vi ? "Xe mới, sạch sẽ - Giao xe đúng hẹn" : "Modern clean car - Prompt delivery"}
            </p>
          </div>
        </div>
      </main>

      {/* Floating contact supports */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {showContactMenu && (
          <div className="bg-white dark:bg-slate-850 border border-slate-250 dark:border-slate-700 rounded-2xl shadow-2xl p-2.5 w-44 flex flex-col gap-2 animate-fade-in-up">
            <a
              href="tel:0764971971"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-[#0b66e4]/10 hover:text-[#0b66e4] transition-colors no-underline"
            >
              <Phone size={14} className="text-[#0b66e4]" />
              <span>{vi ? "Gọi 0764 971 971" : "Call Hotline"}</span>
            </a>
            <a
              href="https://zalo.me/0764971971"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-[#0b66e4]/10 hover:text-[#0b66e4] transition-colors no-underline border-t border-slate-100 dark:border-slate-800"
            >
              <MessageCircle size={14} className="text-[#0b66e4]" />
              <span>Zalo Tư vấn</span>
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
