"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Skeleton
} from "@heroui/react";
import {
  Car,
  ShieldCheck,
  ChevronUp,
  Phone,
  MessageCircle,
  Sparkles,
  Headset,
  FileText,
  UserCheck,
  DollarSign,
  CheckCircle
} from "lucide-react";

import { useI18n } from "@/context/LanguageContext";
import { getPublicServices } from "@/lib/api/services";
import { getMediaDetails } from "@/lib/api/media";
import { backendUrl } from "@/lib/api/client";
import { getActiveSections, type SectionDto } from "@/lib/api/sections";
import { getActiveRentals, getRentalPricesByRental, type RentalPriceDto } from "@/lib/api/rental";
import { getVehicleCategories, type VehicleCategoryDto } from "@/lib/api/fleet";

interface Vehicle {
  id: string;
  rentalId: number;
  vehicleCategoryId: number;
  nameVi: string;
  nameEn: string;
  descVi: string;
  descEn: string;
  pricePerDay: number;
  deposit: number;
  minimumDays: number;
  featuresVi: string[];
  featuresEn: string[];
  capacity: string;
  luggage: string;
  imgUrl: string;
  resolvedImages?: { id: number; url: string }[];
}

export default function SelfDrivePage() {
  const { language, t } = useI18n();
  const router = useRouter();
  const vi = language === "vi";

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");

  const [vehiclesLoading, setVehiclesLoading] = useState(true);

  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showContactMenu, setShowContactMenu] = useState(false);
  const [heroSection, setHeroSection] = useState<SectionDto | null>(null);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  useEffect(() => {
    getActiveSections("/self-drive", language).then(sections => {
      const hero = sections.find(s => s.sectionType === "HERO_BANNER");
      if (hero) setHeroSection(hero);
    }).catch(() => { });
  }, [language]);

  useEffect(() => {
    let active = true;
    async function loadVehicles() {
      try {
        const [rentalsRes, categoriesRes] = await Promise.all([
          getActiveRentals(),
          getVehicleCategories({ active: true })
        ]);

        if (!active) return;

        const rentals = rentalsRes?.data || [];
        const categories = categoriesRes?.data?.content || [];

        const catMap = new Map<number, VehicleCategoryDto>();
        categories.forEach(c => catMap.set(c.id, c));

        // Fetch rental prices for all self-drive rentals
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

        const vehiclesFromApi: Vehicle[] = rentals
          .filter(r => !r.driverRequired)
          .map(r => {
            const cat = catMap.get(r.vehicleCategoryId);
            const trans = cat?.translations?.find(tr => tr.locale === language) || cat?.translations?.[0];
            const name = trans?.name || (vi ? "Phân khúc xe" : "Vehicle Segment");
            const desc = trans?.description || "";

            let capacity = "5";
            let luggageVal = "2-3";
            if (cat) {
              capacity = `${cat.minSeat}-${cat.maxSeat}`;
              luggageVal = `${cat.minLuggage}-${cat.maxLuggage}`;
            }

            let features = desc.split(/[,\n;•✓]/).map(f => f.trim()).filter(f => f.length > 2);
            if (features.length === 0) {
              features = vi
                ? ["Gầm cao máy khỏe", "Rộng rãi thoải mái", "Phù hợp gia đình"]
                : ["High ground clearance", "Spacious & comfortable", "Great for families"];
            }

            const rentalPrices = priceMap.get(r.id) || [];
            const activePrice = rentalPrices.find(p => p.active && p.vehicleCategoryId === r.vehicleCategoryId);
            const dailyRate = activePrice ? Number(activePrice.amount) : 0;

            return {
              id: `${r.id}-${r.vehicleCategoryId}`,
              rentalId: r.id,
              vehicleCategoryId: r.vehicleCategoryId,
              nameVi: name,
              nameEn: name,
              descVi: desc,
              descEn: desc,
              pricePerDay: dailyRate,
              deposit: r.deposit || 0,
              minimumDays: r.minimumDays || 1,
              featuresVi: features,
              featuresEn: features,
              capacity,
              luggage: vi ? `Tối đa ${luggageVal}kg` : `Max: ${luggageVal}kg`,
              imgUrl: cat?.thumbnailUrl || "",
            };
          });

        if (vehiclesFromApi.length > 0) {
          if (active) {
            setVehicles(vehiclesFromApi);
            setSelectedVehicleId(vehiclesFromApi[0].id);
          }
        } else {
          // Fallback: load from services API
          const serviceRes = await getPublicServices(3);
          if (!active) return;
          if (serviceRes?.data) {
            const vehicleService = serviceRes.data.find(s => s.applyVehiclePricing === true);
            if (vehicleService?.options?.length) {
              const mapped = await Promise.all(
                vehicleService.options.map(async (opt) => {
                  const trans = opt.translations?.[0];
                  const name = trans?.name || opt.vehicleBrand || (vi ? "Dòng xe" : "Vehicle");
                  const desc = trans?.description || "";

                  let imgUrl = "";
                  if (opt.thumbnailId) {
                    try {
                      const media = await getMediaDetails(opt.thumbnailId);
                      if (media?.filePath) {
                        imgUrl = media.filePath.startsWith("http")
                          ? media.filePath
                          : `${backendUrl}${media.filePath}`;
                      }
                    } catch (e) {
                      console.error("Failed to load vehicle image:", e);
                    }
                  }

                  let features = desc.split(/[,\n;•✓]/).map(f => f.trim()).filter(f => f.length > 2);
                  if (features.length === 0) {
                    features = vi
                      ? ["Tiết kiệm xăng", "Dễ lái", "Sạch sẽ đời mới"]
                      : ["Fuel efficient", "Easy to drive", "Clean & modern"];
                  }

                  return {
                    id: opt.id?.toString() || Math.random().toString(),
                    rentalId: 0,
                    vehicleCategoryId: 0,
                    nameVi: name,
                    nameEn: name,
                    descVi: desc,
                    descEn: desc,
                    pricePerDay: opt.price,
                    deposit: 500000,
                    minimumDays: 1,
                    featuresVi: features,
                    featuresEn: features,
                    capacity: opt.seatCapacity?.toString() || "5",
                    luggage: vi ? `Tối đa ${opt.maxLuggage || 40}kg` : `Max: ${opt.maxLuggage || 40}kg`,
                    imgUrl
                  };
                })
              );
              if (active) {
                setVehicles(mapped);
                setSelectedVehicleId(mapped[0].id);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to load vehicles:", err);
      } finally {
        setVehiclesLoading(false);
      }
    }

    loadVehicles();
    return () => { active = false; };
  }, [language, vi]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleCall = () => window.open("tel:0764971971");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 flex flex-col font-sans">
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
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: heroSection?.imageUrls?.[0]
              ? `url('${heroSection.imageUrls[0]}')`
              : `url('')`
          }}
        >
          <div className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-[1.5px]" />
        </div>

        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10 text-white">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 dark:bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
              <Sparkles size={13} className="text-accent" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-100">
                {heroSection?.translations?.find(tr => tr.locale === language)?.subtitle || t.selfDrive.subtitle}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              {heroSection?.translations?.find(tr => tr.locale === language)?.title || t.selfDrive.title}
            </h1>
            <p className="text-sm md:text-base text-slate-200 leading-relaxed font-semibold max-w-2xl">
              {heroSection?.translations?.find(tr => tr.locale === language)?.description
                || (vi
                  ? "Minh Khoa Travel chuyên cung cấp dịch vụ thuê xe tự lái Nha Trang. Xe đời mới – Thủ tục nhanh – Hợp đồng rõ ràng – Hỗ trợ 24/7. Hỗ trợ giao/nhận xe tại trung tâm, khách sạn, bến xe/nhà ga, hoặc sân bay Cam Ranh (phụ phí nhỏ nếu xa trung tâm)."
                  : "Minh Khoa Travel specializes in self-drive rentals in Nha Trang. Modern cars – Quick procedure – Transparent contract – 24/7 support. Pickup/delivery support at Central, Hotels, Stations, or Cam Ranh Airport (small extra fee if far).")}
            </p>

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
            className="flex items-center gap-2.5 bg-accent hover:bg-accent-hover text-white px-6 py-3.5 rounded-full text-xs font-black transition-all shadow-lg hover:scale-105 active:scale-95 no-underline shrink-0 border-none cursor-pointer"
          >
            <Phone size={16} />
            <span>{`${t.common.callNow} 0764.971.971`}</span>
          </button>
        </div>
      </section>

      {/* Main Layout Area */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Catalog & Details */}
        <div className="lg:col-span-8 space-y-8">

          <div className="bg-white dark:bg-black rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/80 leading-relaxed font-semibold text-xs md:text-sm text-slate-600 dark:text-slate-355">
            <p>
              {vi
                ? "Dịch vụ thuê xe tự lái Nha Trang của Minh Khoa Travel được nhiều khách hàng tin tưởng bởi xe đời mới, hợp đồng minh bạch và hỗ trợ 24/7. Chúng tôi giao xe tận nơi tại trung tâm thành phố, khách sạn hoặc sân bay Cam Ranh, giúp bạn chủ động trong lịch trình và tiết kiệm chi phí di chuyển."
                : "Minh Khoa Travel self-drive rental services in Nha Trang are trusted by clients due to clean modern fleets, transparent rental contracts, and 24/7 customer support. We support delivery directly to hotels, central city points, or Cam Ranh Airport, giving you full command of your itinerary."}
            </p>
          </div>

          {/* Catalog & Car list */}
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="bg-accent w-2.5 h-5 rounded-full inline-block" />
              {t.selfDrive.vehicleList}
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider pl-1">
              {vi ? "Xe 5–7 chỗ tự lái, đời mới – sạch – tiết kiệm nhiên liệu." : "Modern 5 to 7 Seater fleets – Clean, comfortable & fuel efficient."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehiclesLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex flex-col rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-black">
                    <Skeleton className="h-44 w-full rounded-none" />
                    <div className="p-5 space-y-3">
                      <div className="flex justify-between items-start">
                        <Skeleton className="h-4 w-36 rounded-lg" />
                        <Skeleton className="h-5 w-14 rounded" />
                      </div>
                      <Skeleton className="h-3 w-48 rounded-lg" />
                      <Skeleton className="h-3 w-full rounded-lg" />
                      <div className="flex flex-wrap gap-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                        <Skeleton className="h-5 w-16 rounded-lg" />
                        <Skeleton className="h-5 w-20 rounded-lg" />
                        <Skeleton className="h-5 w-14 rounded-lg" />
                      </div>
                    </div>
                  </div>
                ))
              ) : vehicles.map((vehicle) => {
                const isSelected = selectedVehicleId === vehicle.id;
                return (
                  <div
                    key={vehicle.id}
                    onClick={() => setSelectedVehicleId(vehicle.id)}
                    className={`flex flex-col rounded-3xl overflow-hidden border cursor-pointer transition-all duration-300 bg-white dark:bg-black ${isSelected
                        ? "border-accent border-2 shadow-md ring-2 ring-accent/10"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                      }`}
                  >
                    <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-black">
                      <img
                        src={vehicle.imgUrl}
                        alt={vi ? vehicle.nameVi : vehicle.nameEn}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-extrabold px-3 py-1 rounded-full tracking-wider">
                        {vehicle.pricePerDay.toLocaleString("vi-VN")}đ / {t.selfDrive.perTrip}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {vi ? vehicle.nameVi : vehicle.nameEn}
                          </h4>
                          <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {vehicle.capacity} {t.selfDrive.capacity}
                          </span>
                        </div>
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
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/${language}/self-drive/booking?vehicleId=${vehicle.id}`);
                        }}
                        className="w-full mt-2 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer border-none"
                      >
                        {vi ? "Đặt ngay" : "Book Now"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing Table Section */}
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="bg-accent w-2.5 h-5 rounded-full inline-block" />
              {t.selfDrive.priceOneWay}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {vi
                ? "Giá theo ngày, đã bao gồm số km (200km/ngày) - tiêu chuẩn trong nội tỉnh. Phát sinh: phụ thu giao/nhận xa, phụ phí lễ/Tết, hoặc chạy đường dài. Vui lòng liên hệ để xác nhận."
                : "Daily rate, includes km allowance (200km/day) within the province limits. Additional: long range, holiday surcharge or distant delivery fees apply. Contact us to verify."}
            </p>

            <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-black shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 dark:bg-black/60 border-b border-slate-200 dark:border-slate-800/80 font-black text-slate-900 dark:text-white text-[11px] uppercase tracking-wider">
                      <th className="p-4">{vi ? "Phân khúc" : "Segment"}</th>
                      <th className="p-4 text-right">{vi ? "Giá (VNĐ/ngày)" : "Daily Rate"}</th>
                      <th className="p-4 text-right">{vi ? "Đặt cọc" : "Deposit"}</th>
                      <th className="p-4 text-right">{vi ? "Tối thiểu" : "Min. Days"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                    {vehicles.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/55 dark:hover:bg-slate-850/40 transition-colors">
                        <td className="p-4 font-bold text-slate-900 dark:text-slate-200">
                          {vi ? v.nameVi : v.nameEn}
                        </td>
                        <td className="p-4 text-right font-extrabold text-accent">
                          {v.pricePerDay.toLocaleString("vi-VN")}đ
                        </td>
                        <td className="p-4 text-right">
                          {v.deposit.toLocaleString("vi-VN")}đ
                        </td>
                        <td className="p-4 text-right">
                          {v.minimumDays} {vi ? "ngày" : "days"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-blue-50/40 dark:bg-black/30 border border-blue-500/10 rounded-2xl flex items-start gap-2.5">
              <span className="text-accent shrink-0 text-sm">💡</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                {vi ? (
                  <>
                    Có dịch vụ xe đưa đón sân bay Cam Ranh. Nếu lịch trình có chặng sân bay, tham khảo thêm tại{" "}
                    <a href="/airport-transfer" className="text-accent underline font-extrabold">
                      trang xe sân bay
                    </a>.
                  </>
                ) : (
                  <>
                    Airport transfer to Cam Ranh is also available. If your travel includes airport pickups, visit our{" "}
                    <a href="/airport-transfer" className="text-accent underline font-extrabold">
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
              <span className="bg-accent w-2.5 h-5 rounded-full inline-block" />
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
                <div key={idx} className="flex gap-4 p-4 bg-white dark:bg-black border border-slate-200/50 dark:border-slate-800/80 rounded-2xl shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-black flex items-center justify-center shrink-0">
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
                {t.selfDrive.bookNow}
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
                <span>{`${t.common.callNow} 0764971971`}</span>
              </button>
              <button
                onClick={() => window.open("https://zalo.me/0764971971", "_blank")}
                className="flex items-center gap-1.5 bg-amber-500 text-white hover:bg-amber-600 px-4 py-2.5 rounded-xl text-xs font-black shadow-sm transition-all border-none cursor-pointer"
              >
                <MessageCircle size={14} />
                <span>{vi ? "Zalo tư vấn" : "Zalo Consultation"}</span>
              </button>
            </div>
          </div>

          {/* FAQ Accordions */}
          <div className="space-y-4 bg-white dark:bg-black p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
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
                    className="w-full flex items-center justify-between text-left py-2 hover:text-accent transition-colors cursor-pointer border-none bg-transparent"
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

        {/* Right column: Sticky Summary */}
        <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
          <div className="bg-white dark:bg-black rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-5">
            <div className="space-y-1 pb-3 border-b border-slate-100 dark:border-slate-850">
              <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider text-accent">
                ⚡ {vi ? "Đặt nhanh – Giá tốt nhất" : "Quick Request"}
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                {vi ? "Đặt xe tự lái Nha Trang" : "Book Self-Drive Car"}
              </h3>
            </div>

            {selectedVehicle && (
              <div className="space-y-3">
                <div className="relative h-40 rounded-2xl overflow-hidden">
                  <img
                    src={selectedVehicle.imgUrl}
                    alt={vi ? selectedVehicle.nameVi : selectedVehicle.nameEn}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white text-xs font-black">{vi ? selectedVehicle.nameVi : selectedVehicle.nameEn}</p>
                    {selectedVehicle.pricePerDay > 0 && (
                      <p className="text-white/80 text-[11px] font-bold mt-0.5">
                        {selectedVehicle.pricePerDay.toLocaleString("vi-VN")}đ/{t.selfDrive.perTrip}
                      </p>
                    )}
                  </div>
                </div>

                {selectedVehicle.deposit > 0 && (
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{vi ? "Đặt cọc:" : "Deposit:"}</span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">{selectedVehicle.deposit.toLocaleString("vi-VN")}đ</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => router.push(`/${language}/self-drive/booking?vehicleId=${selectedVehicle.id}`)}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-xs font-black hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-95 border-none"
                >
                  <CheckCircle size={15} />
                  <span>{vi ? "Đặt Xe Ngay" : "Book Now"}</span>
                </button>
              </div>
            )}

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
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-accent/10 hover:text-accent transition-colors no-underline"
            >
              <Phone size={14} className="text-accent" />
              <span>{`${t.common.callNow} 0764 971 971`}</span>
            </a>
            <a
              href="https://zalo.me/0764971971"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-accent/10 hover:text-accent transition-colors no-underline border-t border-slate-100 dark:border-slate-800"
            >
              <MessageCircle size={14} className="text-accent" />
              <span>Zalo Tư vấn</span>
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

