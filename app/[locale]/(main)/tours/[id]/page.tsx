"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Star, Shield, Ship, Utensils, Award, User, Briefcase, CheckCircle, Compass } from "lucide-react";
import { Button, Skeleton } from "@heroui/react";

import { getTourById, TourDto } from "@/lib/api/tours";
import { getVehicles, VehicleDto } from "@/lib/api/fleet";
import { getMediaDetails } from "@/lib/api/media";
import { useI18n } from "@/context/LanguageContext";
import { formatPrice as _formatPrice } from "@/lib/format";
import { ImageGallery } from "@/components/ImageGallery";

const ENABLE_MOCK_FALLBACK = true;

// const MOCK_VEHICLES: VehicleDto[] = [
//   {
//     id: 1,
//     brand: "Toyota",
//     model: "Vios",
//     year: 2022,
//     fuelType: "gasoline",
//     active: true,
//     luggage: 2,
//     luggageUnit: "bag",
//     type: {
//       id: 1,
//       code: "4-seater",
//       seat: "4-5",
//       luggage: 2,
//       active: true,
//       translations: [
//         { locale: "vi", name: "Dòng Xe 4 Chỗ (Sedan)", slug: "sedan-4-cho", description: "Toyota Vios, Hyundai Accent hoặc tương đương" },
//         { locale: "en", name: "4-Seater Sedan", slug: "4-seater-sedan", description: "Toyota Vios, Hyundai Accent or equivalent" }
//       ],
//       default: true
//     }
//   },
//   {
//     id: 2,
//     brand: "Toyota",
//     model: "Fortuner",
//     year: 2022,
//     fuelType: "gasoline",
//     active: true,
//     luggage: 4,
//     luggageUnit: "bag",
//     type: {
//       id: 2,
//       code: "7-seater",
//       seat: "7",
//       luggage: 4,
//       active: true,
//       translations: [
//         { locale: "vi", name: "Dòng Xe 7 Chỗ (SUV)", slug: "suv-7-cho", description: "Toyota Fortuner, Mitsubishi Xpander hoặc tương đương" },
//         { locale: "en", name: "7-Seater SUV", slug: "7-seater-suv", description: "Toyota Fortuner, Mitsubishi Xpander or equivalent" }
//       ],
//       default: false
//     }
//   },
//   {
//     id: 3,
//     brand: "Ford",
//     model: "Transit",
//     year: 2022,
//     fuelType: "diesel",
//     active: true,
//     luggage: 8,
//     luggageUnit: "bag",
//     type: {
//       id: 3,
//       code: "16-seater",
//       seat: "16",
//       luggage: 8,
//       active: true,
//       translations: [
//         { locale: "vi", name: "Dòng Xe 16 Chỗ (Van)", slug: "van-16-cho", description: "Ford Transit, Hyundai Solati hoặc tương đương" },
//         { locale: "en", name: "16-Seater Van", slug: "16-seater-van", description: "Ford Transit, Hyundai Solati or equivalent" }
//       ],
//       default: false
//     }
//   }
// ];

// const MOCK_TOUR_DETAIL: TourDto = {
//   id: 1,
//   tourCategoryId: 1,
//   durationDays: 1,
//   durationNights: 0,
//   minGuest: 2,
//   maxGuest: 30,
//   active: true,
//   thumbnailId: 1,
//   imageIds: [1, 2, 3],
//   isDefault: true,
//   translations: [
//     {
//       locale: "vi",
//       name: "Tour 3 Đảo Nha Trang VIP (Cano Cao Tốc)",
//       description: "Trải nghiệm cano cao tốc tham quan Bãi Tranh, Làng Chài và Vịnh San Hô với bữa trưa hải sản vô cùng hấp dẫn.",
//       content: "Nha Trang nổi tiếng với những hòn đảo hoang sơ tuyệt đẹp. Tour 3 đảo bằng cano cao tốc mang đến cho bạn trải nghiệm khám phá kỳ thú tại: Vịnh San Hô (lặn ngắm san hô bằng ống thở), Làng Chài (thưởng thức bè hải sản tươi sống) và Bãi Tranh (tắm biển nghỉ dưỡng, tham gia thể thao nước)."
//     },
//     {
//       locale: "en",
//       name: "VIP Nha Trang 3 Islands Tour (Speedboat)",
//       description: "Experience high-speed canoe sightseeing Bãi Tranh, Làng Chài, and Coral Bay with a delicious seafood lunch.",
//       content: "Nha Trang is famous for its gorgeous wild islands. The 3-island speedboat tour offers you an outstanding exploration experience at: Coral Bay (snorkeling), Fishermen Village (fresh floating seafood lunch), and Bãi Tranh beach resort."
//     }
//   ],
//   options: [
//     { id: 1, iconUrl: "ship", colorText: "#0ea5e9", colorIcon: "#0ea5e9", translations: [{ locale: "vi", content: "Cano cao tốc" }, { locale: "en", content: "Speedboat" }] },
//     { id: 2, iconUrl: "utensils", colorText: "#f97316", colorIcon: "#f97316", translations: [{ locale: "vi", content: "Ăn trưa hải sản" }, { locale: "en", content: "Seafood lunch" }] },
//     { id: 3, iconUrl: "shield", colorText: "#22c55e", colorIcon: "#22c55e", translations: [{ locale: "vi", content: "Bảo hiểm trọn gói" }, { locale: "en", content: "Insurance included" }] }
//   ],
//   days: [
//     {
//       id: 1,
//       dayNumber: 1,
//       translations: [
//         { locale: "vi", name: "Hành trình khám phá 3 đảo VIP Nha Trang", description: "Lịch trình trọn gói tham quan nghỉ dưỡng và vui chơi" },
//         { locale: "en", name: "VIP 3 Islands Exploration Itinerary", description: "Full day package with snorkeling, food, and beaches" }
//       ],
//       activities: [
//         {
//           id: 1,
//           startTime: "08:00",
//           endTime: "08:45",
//           location: "Khách sạn hoặc Cảng Nha Trang",
//           translations: [
//             { locale: "vi", name: "Đón khách và di chuyển ra bến cảng", description: "Xe riêng đón quý khách tại khách sạn trung tâm Nha Trang di chuyển xuống Cảng Nha Trang để làm thủ tục lên cano cao tốc." },
//             { locale: "en", name: "Hotel pickup and harbor transfer", description: "Private vehicle fetches you from your hotel and transfers to Nha Trang harbor to board the VIP speedboat." }
//           ]
//         },
//         {
//           id: 2,
//           startTime: "09:00",
//           endTime: "11:30",
//           location: "Vịnh San Hô / Hòn Mun",
//           translations: [
//             { locale: "vi", name: "Tắm biển và lặn ngắm san hô", description: "Tự do bơi lội, lặn ống thở (snorkeling) ngắm các rạn san hô nhiều màu sắc và hệ sinh thái cá biển nhiệt đới vô cùng đa dạng." },
//             { locale: "en", name: "Swimming and snorkeling corals", description: "Free swimming and snorkeling to explore colorful natural coral reefs and diverse marine ecosystems." }
//           ]
//         },
//         {
//           id: 3,
//           startTime: "12:00",
//           endTime: "13:30",
//           location: "Làng Chài Nha Trang",
//           translations: [
//             { locale: "vi", name: "Thưởng thức bữa trưa hải sản", description: "Ăn trưa trên bè nổi với thực đơn phong phú gồm hải sản tươi ngon, cá hấp nướng, canh chua biển... Bạn cũng có thể mua thêm hải sản tươi sống tại lồng bè." },
//             { locale: "en", name: "Enjoy fresh seafood lunch", description: "Dine on a floating raft with a rich menu of grilled local seafood, fish soup, and rice. Fresh catch can be purchased optionally." }
//           ]
//         },
//         {
//           id: 4,
//           startTime: "13:45",
//           endTime: "15:30",
//           location: "Khu du lịch Bãi Tranh",
//           translations: [
//             { locale: "vi", name: "Nghỉ dưỡng & thể thao dưới nước", description: "Thư giãn trên ghế tắm nắng ven biển, chụp ảnh check-in sống ảo cực đẹp hoặc tham gia các trò chơi cảm giác mạnh như dù bay, mô tô nước, phao chuối (chi phí tự túc)." },
//             { locale: "en", name: "Beach relaxation and water sports", description: "Relax on loungers, take photos of the scenery, or optionally try jet skiing, parasailing, or banana boats." }
//           ]
//         },
//         {
//           id: 5,
//           startTime: "15:45",
//           endTime: "16:00",
//           location: "Cảng & Khách sạn",
//           translations: [
//             { locale: "vi", name: "Cano đưa về cảng và xe tiễn về khách sạn", description: "Cano cao tốc đưa quý khách về lại Cảng Nha Trang. Xe riêng chờ sẵn đưa quý khách về khách sạn an toàn, kết thúc chuyến đi." },
//             { locale: "en", name: "Speedboat return and hotel drop-off", description: "Canoe sails back to Nha Trang harbor where our private driver transfers you safely back to your hotel." }
//           ]
//         }
//       ]
//     }
//   ],
//   prices: [
//     { id: 1, vehicleCategoryId: 1, currency: "VND", amount: 600000, active: true },
//     { id: 2, vehicleCategoryId: 2, currency: "VND", amount: 900000, active: true },
//     { id: 3, vehicleCategoryId: 3, currency: "VND", amount: 1500000, active: true }
//   ]
// };

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default function TourDetailPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = Number(resolvedParams.id);
  const { language, t } = useI18n();

  const [tour, setTour] = useState<TourDto | null>(null);
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleDto | null>(null);
  const [vehicleImages, setVehicleImages] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tourRes, fleetRes] = await Promise.all([
          getTourById(id),
          getVehicles()
        ]);

        if (tourRes?.data) {
          setTour(tourRes.data);
          // } else if (ENABLE_MOCK_FALLBACK) {
          //   // Find matching mock
          //   const mock = id === 2 ? {
          //     ...MOCK_TOUR_DETAIL,
          //     id: 2,
          //     tourCategoryId: 2,
          //     translations: [
          //       { locale: "vi", name: "Tour Khám Phá Thành Phố Nha Trang Danh Thắng", description: "Tham quan Tháp Bà Ponagar, Chùa Long Sơn, Nhà Thờ Núi...", content: "Nội dung tour thành phố..." },
          //       { locale: "en", name: "Nha Trang Cultural City Sightseeing Tour", description: "Visit Ponagar Temple, Long Son Pagoda, Stone Church...", content: "City tour details..." }
          //     ],
          //     prices: [
          //       { id: 1, vehicleCategoryId: 1, currency: "VND", amount: 450000, active: true },
          //       { id: 2, vehicleCategoryId: 2, currency: "VND", amount: 700000, active: true },
          //       { id: 3, vehicleCategoryId: 3, currency: "VND", amount: 1200000, active: true }
          //     ]
          //   } : MOCK_TOUR_DETAIL;
          // setTour(mock);
        }

        let list: VehicleDto[] = [];
        if (fleetRes?.data?.content && fleetRes.data.content.length > 0) {
          list = fleetRes.data.content.filter(v => v.active);
        } else if (ENABLE_MOCK_FALLBACK) {
          list = [];
        }

        setVehicles(list);
        const defaultV = list.find(v => v.type?.default) || list[0];
        setSelectedVehicle(defaultV);

        // Fetch media URLs for vehicle thumbnails if they have thumbnailId
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const imagesMap: Record<number, string> = {};
        await Promise.all(
          list.map(async (v) => {
            if (v.thumbnailId) {
              try {
                const media = await getMediaDetails(v.thumbnailId);
                if (media && media.filePath) {
                  imagesMap[v.id] = media.filePath.startsWith("http")
                    ? media.filePath
                    : `${backendUrl}${media.filePath}`;
                }
              } catch (err) {
                console.error("Error fetching media for vehicle", v.id, err);
              }
            }
          })
        );
        setVehicleImages(imagesMap);

      } catch (err) {
        console.error("Error loading tour detail:", err);
        // if (ENABLE_MOCK_FALLBACK) {
        //   setTour(MOCK_TOUR_DETAIL);
        //   setVehicles([]);
        //   setSelectedVehicle(null);
        // }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const resolveMediaUrl = (filePath: string): string => {
    return filePath.startsWith("http") ? filePath : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${filePath}`;
  };

  const getLocalizedName = () => {
    if (!tour) return "";
    const translation = tour.translations?.find(tr => tr.locale === language) || tour.translations?.[0];
    return translation ? translation.name : "Nha Trang Tour";
  };

  const getLocalizedContent = () => {
    if (!tour) return "";
    const translation = tour.translations?.find(tr => tr.locale === language) || tour.translations?.[0];
    return translation ? translation.content : "";
  };

  const getLocalizedVehicleName = (v: VehicleDto) => {
    const cat = v.type;
    if (!cat) return `${v.brand} ${v.model}`;
    const translation = cat.translations?.find((tr) => tr.locale === language) || cat.translations?.[0];
    return translation ? `${translation.name} (${v.brand} ${v.model})` : `${v.brand} ${v.model}`;
  };

  const calculateCombinedPrice = (v: VehicleDto) => {
    if (tour == null || v.type == null) {
      console.log("tour", tour);
      console.log("v", v);
      console.log("Đang bị null gì đó");
      return 0;
    }
    const foundPrice = tour?.prices?.find((p) => p.vehicleCategoryId === v.type?.id && p.active);

    if (foundPrice) {
      console.log("v nè", v);

      return foundPrice.amount;
    }
    // Fallback if price is not seeded/found
    const basePrice = 1200000;
    const code = v.type.code || "";
    if (code.includes("16")) {
      return basePrice + 1500000;
    } else if (code.includes("7")) {
      return basePrice + 800000;
    } else {
      return basePrice + 400000;
    }
  };

  const formatPrice = (value: number) => _formatPrice(value, language);

  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case "ship": return <Ship size={13} />;
      case "utensils": return <Utensils size={13} />;
      case "shield": return <Shield size={13} />;
      case "award": return <Award size={13} />;
      default: return <Compass size={13} />;
    }
  };

  const handleProceedBooking = () => {
    if (!selectedVehicle) return;
    router.push(`/${language}/tours/${id}/confirm?vehicleId=${selectedVehicle.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 flex flex-col font-sans">
        {/* Hero skeleton */}
        <div className="relative w-full h-[320px] md:h-[400px] bg-slate-900 overflow-hidden">
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
          <div className="max-w-7xl mx-auto w-full px-6 pb-8 relative z-10 space-y-4 pt-48">
            <Skeleton className="h-8 w-48 rounded-lg bg-white/20" />
            <Skeleton className="h-10 w-3/5 rounded-lg bg-white/20" />
            <Skeleton className="h-4 w-1/3 rounded-lg bg-white/20" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left column skeleton */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-black p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <Skeleton className="h-4 w-48 rounded-lg" />
              <Skeleton className="h-3 w-full rounded-lg" />
              <Skeleton className="h-3 w-full rounded-lg" />
              <Skeleton className="h-3 w-4/5 rounded-lg" />
              <div className="flex gap-2.5 pt-3">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-28 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
            </div>
            <div className="bg-white dark:bg-black p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <Skeleton className="h-4 w-48 rounded-lg" />
              <div className="space-y-5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex gap-4">
                    <Skeleton className="h-3 w-3 rounded-full shrink-0 mt-1" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-3 w-32 rounded-lg" />
                      <Skeleton className="h-3 w-full rounded-lg" />
                      <Skeleton className="h-3 w-4/5 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column skeleton */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
            <div className="bg-white dark:bg-black p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="space-y-1">
                <Skeleton className="h-4 w-56 rounded-lg" />
                <Skeleton className="h-3 w-4/5 rounded-lg" />
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <Skeleton className="w-16 h-12 rounded-xl" />
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-32 rounded-lg" />
                        <Skeleton className="h-2.5 w-24 rounded-lg" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-20 rounded-lg" />
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <Skeleton className="h-2.5 w-28 rounded-lg" />
                    <Skeleton className="h-2.5 w-36 rounded-lg" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-lg" />
                </div>
                <Skeleton className="h-11 w-full rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col items-center justify-center gap-4">
        <p className="text-sm font-bold text-slate-500">{t.common.noResults}</p>
        <Button onClick={() => router.push(`/${language}/tours`)} className="bg-accent text-white text-xs font-bold px-4 py-2 rounded-xl">
          {t.tours.goBack}
        </Button>
      </div>
    );
  }

  const duration = tour.durationDays > 0
    ? `${tour.durationDays} ${t.tours.days}`
    : `${tour.durationNights} ${t.tours.days}`;

  // Image visual catalog - use images from API response
  const tourImageList = (tour?.images || []).map(img => ({
    id: img.id,
    url: resolveMediaUrl(img.filePath),
  }));
  const heroImg: string = tourImageList.length > 0
    ? tourImageList[0].url
    : tour?.thumbnail
      ? resolveMediaUrl(tour.thumbnail.filePath)
      : "";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      {/* Banner */}
      <section className="relative w-full h-[320px] md:h-[400px] bg-slate-900 overflow-hidden flex items-end">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${heroImg}')` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

        <div className="max-w-7xl mx-auto w-full px-6 pb-8 relative z-10 text-white space-y-4">
          <Button
            onClick={() => router.push(`/${language}/tours`)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-200 hover:text-white bg-black/40 hover:bg-black/60 border-none rounded-full px-4 py-2 cursor-pointer mb-2"
          >
            <ArrowLeft size={13} />
            <span>{t.tours.goBack}</span>
          </Button>

          <div className="space-y-1">
            <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight">
              {getLocalizedName()}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 font-semibold">
              <span className="flex items-center gap-1"><Clock size={13} className="text-accent" /> {duration}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><MapPin size={13} className="text-amber-500" /> {language === "vi" ? "Đón trả theo yêu cầu" : "Pick up on demand"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Image Gallery */}
      {tourImageList.length > 0 && (
        <section className="max-w-7xl mx-auto w-full px-4 md:px-6 -mt-4 relative z-10">
          <ImageGallery images={tourImageList} thumbnailId={tour.thumbnailId} className="rounded-2xl overflow-hidden shadow-lg" />
        </section>
      )}

      {/* Detail Layout */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Details & Itinerary */}
        <div className="lg:col-span-7 space-y-6">
          {/* Overview */}
          <div className="bg-white dark:bg-black p-6 rounded-3xl border border-slate-250 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2">
              {t.tours.overview}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              {getLocalizedContent() || (language === "vi" ? "Thông tin giới thiệu chi tiết hành trình Nha Trang đang được cập nhật." : "Detailed description for the Nha Trang itinerary is being updated.")}
            </p>

            {/* Options highlights */}
            <div className="flex flex-wrap gap-2.5 pt-3">
              {tour.options?.map((opt) => {
                const trans = opt.translations?.find(tr => tr.locale === language) || opt.translations?.[0];
                return (
                  <div
                    key={opt.id}
                    style={{ color: opt.colorText || "#3b82f6", backgroundColor: `${opt.colorText || "#3b82f6"}10` }}
                    className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                  >
                    {renderIcon(opt.iconUrl)}
                    <span>{trans ? trans.content : ""}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Itinerary Accordion / List */}
          <div className="bg-white dark:bg-black p-6 rounded-3xl border border-slate-250 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2">
              {t.tours.itinerary}
            </h2>

            {tour.days && tour.days.length > 0 ? (
              <div className="space-y-6">
                {tour.days.map((day) => {
                  const dayTrans = day.translations?.find(tr => tr.locale === language) || day.translations?.[0];
                  return (
                    <div key={day.id} className="space-y-4">
                      <div className="flex items-center gap-2 bg-accent/5 dark:bg-black px-4 py-2 rounded-2xl">
                        <span className="bg-accent text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0">
                          {day.dayNumber}
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white">
                            {dayTrans ? dayTrans.name : `${t.tours.days} ${day.dayNumber}`}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-semibold">{dayTrans?.description}</span>
                        </div>
                      </div>

                      {/* Activities */}
                      <div className="relative border-l border-dashed border-slate-200 dark:border-slate-800 pl-6 ml-3.5 space-y-5">
                        {day.activities?.map((act, index) => {
                          const actTrans = act.translations?.find(tr => tr.locale === language) || act.translations?.[0];
                          return (
                            <div key={act.id} className="relative space-y-1">
                              {/* Connector dot */}
                              <div className="absolute -left-[30px] top-1 bg-white dark:bg-black w-3 h-3 rounded-full border-2 border-accent flex items-center justify-center" />

                              <div className="flex flex-wrap items-center gap-2 text-[10px] font-black text-accent uppercase tracking-wider">
                                <span className="bg-blue-50 dark:bg-slate-800 px-2 py-0.5 rounded-full">{act.startTime} - {act.endTime}</span>
                                <span className="text-slate-400 font-normal">|</span>
                                <span className="text-slate-500 flex items-center gap-0.5"><MapPin size={10} /> {act.location}</span>
                              </div>
                              <h5 className="text-xs font-extrabold text-slate-900 dark:text-white mt-1">
                                {actTrans ? actTrans.name : ""}
                              </h5>
                              <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                                {actTrans ? actTrans.description : ""}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs font-bold">
                {language === "vi" ? "Lịch trình tự do hoặc đang cập nhật." : "Itinerary is self-guided or pending updates."}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Vehicle Selection & CTA Sidebar */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
          <div className="bg-white dark:bg-black p-6 rounded-3xl border border-slate-250 dark:border-slate-800 shadow-sm space-y-5">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider">
                {language === "vi" ? "1. Chọn Dòng Xe Đồng Hành" : "1. Choose Your Vehicle Class"}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                {language === "vi" ? "Giá tour thay đổi tùy thuộc vào dòng xe riêng bạn chọn phục vụ." : "Tour package rate depends on the private vehicle class selected."}
              </p>
            </div>

            <div className="space-y-3">
              {vehicles.map((v) => {
                const isSelected = selectedVehicle?.id === v.id;
                const price = calculateCombinedPrice(v);
                const name = getLocalizedVehicleName(v);

                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVehicle(v)}
                    className={`cursor-pointer rounded-2xl border p-3 transition-all duration-300 flex items-center justify-between ${isSelected
                      ? "border-accent bg-accent/5 ring-2 ring-accent/10 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-white dark:bg-black"
                      }`}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Vehicle Image */}
                      <div className="w-16 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800 relative bg-slate-100 dark:bg-black">
                        <img
                          src={vehicleImages[v.id] || v.thumbnailUrl || ""}
                          alt={name}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-accent/15 flex items-center justify-center">
                            <div className="bg-accent text-white rounded-full p-0.5 shadow-sm">
                              <CheckCircle size={11} className="stroke-[2.5]" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-0.5 text-left">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white block leading-tight">
                          {name}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span>{v.type ? (v.type.minSeat === v.type.maxSeat ? v.type.minSeat : `${v.type.minSeat}-${v.type.maxSeat}`) : "4"} {language === "vi" ? "chỗ" : "seats"}</span>
                          <span>•</span>
                          <span>{v.luggage} {v.luggageUnit || (language === "vi" ? "hành lý" : "bags")}</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-black text-accent shrink-0 pl-2">
                      {formatPrice(price)}
                    </span>
                  </div>
                );
              })}
            </div>

            {selectedVehicle && (
              <div className="border-t border-slate-100 dark:border-slate-850 pt-4 space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                      {t.tours.totalEstimate}
                    </span>
                    <span className="text-[10px] text-accent font-bold block mt-0.5">
                      {language === "vi" ? "Trọn gói Tour + Xe riêng" : "Tour + Private driver package"}
                    </span>
                  </div>
                  <span className="text-lg font-black text-amber-500">
                    {formatPrice(calculateCombinedPrice(selectedVehicle))}
                  </span>
                </div>

                <Button
                  onClick={handleProceedBooking}
                  className="w-full h-11 bg-orange-500 hover:bg-orange-650 text-white font-black text-xs uppercase tracking-wider rounded-2xl border-none cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                >
                  {`${t.tours.continue} →`}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
