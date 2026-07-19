"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  User,
  Briefcase,
  Star,
  CheckCircle,
  MessageCircle,
  Mail,
  Phone,
  ArrowLeft,
  ChevronDown,
  Sparkles,
  Award
} from "lucide-react";
import { Card, Button, Skeleton, Select, ListBox } from "@heroui/react";
import { getPublicServices, ServiceDto, ServiceOptionDto } from "@/lib/api/services";
import { createBooking } from "@/lib/api/bookings";
import { useI18n } from "@/context/LanguageContext";
import { formatPrice as _formatPrice } from "@/lib/format";
import { AutofillButton } from "@/components/AutofillButton";
import { getMediaDetails } from "@/lib/api/media";
import { backendUrl } from "@/lib/api/client";
import BookingConfirmationModal from "@/components/BookingConfirmationModal";

export default function AirportTransferSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useI18n();
  const isVi = language === "vi";

  // Search parameters from homepage
  const pickup = searchParams.get("pickup") || "";
  const destination = searchParams.get("destination") || "";
  const date = searchParams.get("date") || "";
  const time = searchParams.get("time") || "";
  const tripType = searchParams.get("tripType") || "one-way";
  const passengers = parseInt(searchParams.get("passengers") || "1");
  const luggage = parseInt(searchParams.get("luggage") || "0");

  // State
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<ServiceOptionDto | null>(null);
  const [optionImages, setOptionImages] = useState<Record<number, string>>({});

  // Filters State
  const [filterSeats, setFilterSeats] = useState<string>("all");
  const [filterLuggage, setFilterLuggage] = useState<string>("all");
  const [filterBrand, setFilterBrand] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Checkout Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactChannel, setContactChannel] = useState<"zalo" | "kakaotalk">("zalo");
  const [contactId, setContactId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [createdCode, setCreatedCode] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [flightData, setFlightData] = useState<any>(null);
  const [checkingFlight, setCheckingFlight] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const checkoutFormRef = useRef<HTMLDivElement>(null);

  const handleCheckFlight = async () => {
    if (!flightNumber.trim()) return;
    setCheckingFlight(true);
    setFlightData(null);
    try {
      const { trackFlight } = await import("@/lib/api/bookings");
      const res = await trackFlight(flightNumber);
      if (res && res.data) {
        setFlightData(res.data);
      } else {
        setFlightData({ error: true });
      }
    } catch (e) {
      setFlightData({ error: true });
    } finally {
      setCheckingFlight(false);
    }
  };

  useEffect(() => {
    getPublicServices(1)
      .then(res => {
        if (res && res.data && res.data.length > 0) {
          setServices(res.data);
        } else {
          setServices([]);
        }
      })
      .catch(err => {
        console.error("Error loading services:", err);
        setServices([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Resolve option thumbnail images
  useEffect(() => {
    if (services.length === 0) return;
    let cancelled = false;
    const resolve = async () => {
      const imageMap: Record<number, string> = {};
      await Promise.all(
        services.flatMap(srv =>
          (srv.options || []).map(async (opt) => {
            if (opt.thumbnailId) {
              try {
                const media = await getMediaDetails(opt.thumbnailId);
                if (media?.filePath) {
                  imageMap[opt.id!] = media.filePath.startsWith("http")
                    ? media.filePath
                    : `${backendUrl}${media.filePath}`;
                }
              } catch (e) {
                console.error("Failed to load option image:", e);
              }
            }
          })
        )
      );
      if (!cancelled) setOptionImages(imageMap);
    };
    resolve();
    return () => { cancelled = true; };
  }, [services]);

  const getLocalizedName = (srv: ServiceDto) => {
    const translation = srv.translations?.find((tr) => tr.locale === language) || srv.translations?.[0];
    return translation ? translation.name : "Airport Transfer Service";
  };

  const getLocalizedOptionName = (opt: ServiceOptionDto) => {
    const translation = opt.translations?.find((tr) => tr.locale === language) || opt.translations?.[0];
    return translation ? translation.name : `${opt.seatCapacity}-Seater`;
  };

  const getLocalizedOptionDesc = (opt: ServiceOptionDto) => {
    const translation = opt.translations?.find((tr) => tr.locale === language) || opt.translations?.[0];
    return translation ? translation.description : `${opt.vehicleBrand || "Standard Vehicle"}`;
  };

  const formatPrice = (value: number) => _formatPrice(value, language);

  // Compile all options across services
  const allOptions: { service: ServiceDto; option: ServiceOptionDto }[] = [];
  services.forEach(srv => {
    srv.options?.forEach(opt => {
      allOptions.push({ service: srv, option: opt });
    });
  });

  // Extract unique filter keys
  const uniqueBrands = Array.from(new Set(allOptions.map(item => item.option.vehicleBrand).filter(Boolean))) as string[];
  const uniqueSeats = Array.from(new Set(allOptions.map(item => item.option.seatCapacity).filter(Boolean))) as number[];

  // Filter & Sort Options
  let filteredOptions = allOptions.filter(item => {
    const opt = item.option;
    // Filter seats
    if (filterSeats !== "all" && opt.seatCapacity?.toString() !== filterSeats) {
      return false;
    }
    // Filter luggage
    if (filterLuggage !== "all") {
      const limit = parseInt(filterLuggage);
      if (opt.maxLuggage && opt.maxLuggage < limit) {
        return false;
      }
    }
    // Filter brand
    if (filterBrand !== "all" && opt.vehicleBrand !== filterBrand) {
      return false;
    }
    return true;
  });

  // Apply sorting
  filteredOptions.sort((a, b) => {
    const pA = a.option.price;
    const pB = b.option.price;
    return sortOrder === "asc" ? pA - pB : pB - pA;
  });

  // Select Vehicle Action
  const handleSelectVehicle = (vehicle: ServiceOptionDto) => {
    setSelectedVehicle(vehicle);
    setTimeout(() => {
      checkoutFormRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  // Form Submit Action
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    setShowConfirmModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedVehicle) return;

    setSubmitting(true);
    const parentService = services.find(s => s.options.some(o => o.id === selectedVehicle.id)) || services[0];
    const totalAmount = selectedVehicle.price;

    const payload = {
      customerName: fullName,
      customerEmail: email,
      customerPhone: phone,
      totalAmount: totalAmount,
      customerNotes: `[Social: ${contactChannel.toUpperCase()} ID: ${contactId}] Notes: ${notes}`,
      items: [
        {
          serviceId: parentService.id,
          serviceOptionId: selectedVehicle.id as number,
          quantity: 1,
          unitPrice: selectedVehicle.price,
          startDate: date ? `${date}T${time || "00:00"}:00` : undefined,
          pickupLocation: pickup || undefined,
          dropoffLocation: destination || undefined,
          flightNumber: flightNumber || undefined,
          dynamicDetails: `Trip Type: ${tripType}, Passengers: ${passengers}, Luggage: ${luggage}`
        }
      ]
    };

    try {
      const res = await createBooking(payload);
      if (res && res.data) {
        setCreatedCode(res.data.bookingCode || "BK-SUCCESS");
      }
      setBookingSuccess(true);
      
      // Redirect to Zalo
      const vehicleName = getLocalizedOptionName(selectedVehicle);
      const vehicleDesc = getLocalizedOptionDesc(selectedVehicle);
      const message = `[Minh Khoa Travel - Đơn Đặt Xe Sân Bay]\n` +
        `- Họ và tên: ${fullName}\n` +
        `- Số điện thoại: ${phone}\n` +
        `- Email: ${email}\n` +
        `- Kênh liên hệ: ${contactChannel.toUpperCase()} (${contactId})\n` +
        `- Dòng xe: ${vehicleName} (${vehicleDesc})\n` +
        `- Lộ trình: ${pickup} ➔ ${destination}\n` +
        `- Ngày giờ đón: ${date} lúc ${time}\n` +
        `- Loại hình: ${tripType === "return" ? "Khứ hồi" : "Một chiều"}\n` +
        `- Số hành khách: ${passengers} người - Hành lý: ${luggage} kiện\n` +
        `- Ghi chú: ${notes}\n` +
        `- Tổng tiền tạm tính: ${formatPrice(totalAmount)}`;

      window.open(`https://zalo.me/0764971971?text=${encodeURIComponent(message)}`, "_blank");
    } catch (err) {
      console.error("Booking API error:", err);
      // Fallback redirect directly to Zalo anyway so the booking request is never lost!
      const vehicleName = getLocalizedOptionName(selectedVehicle);
      const vehicleDesc = getLocalizedOptionDesc(selectedVehicle);
      const message = `[Minh Khoa Travel - Yêu Cầu Đặt Xe Sân Bay]\n` +
        `- Họ và tên: ${fullName}\n` +
        `- Số điện thoại: ${phone}\n` +
        `- Dòng xe: ${vehicleName} (${vehicleDesc})\n` +
        `- Lộ trình: ${pickup} ➔ ${destination}\n` +
        `- Ngày giờ đón: ${date} lúc ${time}\n` +
        `- Loại hình: ${tripType === "return" ? "Khứ hồi" : "Một chiều"}\n` +
        `- Tổng tiền tạm tính: ${formatPrice(totalAmount)}`;
      window.open(`https://zalo.me/0764971971?text=${encodeURIComponent(message)}`, "_blank");
      setBookingSuccess(true);
    } finally {
      setSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      {/* Hero Header */}
      <section className="relative w-full pt-28 pb-12 px-6 bg-slate-900 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full relative z-10 text-white flex flex-col gap-3">
          <Button
            onClick={() => router.push("/")}
            className="flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 border-none rounded-full w-fit px-4 py-2 cursor-pointer self-start"
          >
            <ArrowLeft size={12} />
            <span>{t.airportTransfer.changeSearch}</span>
          </Button>
          
          <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">
            {t.airportTransfer.searchResultsTitle}
          </h1>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs md:text-sm text-slate-200 font-semibold mt-1">
            <span className="flex items-center gap-1"><MapPin size={14} className="text-accent" /> {pickup || "Airport"} ➔ {destination || "Nha Trang"}</span>
            <span className="text-slate-500">|</span>
            <span className="flex items-center gap-1"><Calendar size={14} className="text-amber-500" /> {date} {time && `lúc ${time}`}</span>
            <span className="text-slate-500">|</span>
            <span className="flex items-center gap-1"><User size={14} className="text-emerald-500" /> {passengers} {t.common.passengers}</span>
          </div>
        </div>
      </section>

      {/* Main content: filters + vehicle grid */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 flex-1 flex flex-col gap-8">
        
        {/* Horizontal Filters Bar matching Image 2 */}
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-black p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/80">
          
          {/* Service Dropdown Indicator */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-black px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-accent">
            <Sparkles size={14} />
            <span>{t.airportTransfer.title}</span>
          </div>

          {/* Seats count filter */}
          <Select
            selectedKey={filterSeats}
            onSelectionChange={(key) => setFilterSeats(key as string)}
            className="w-40"
          >
            <Select.Trigger className="bg-slate-50 dark:bg-black px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-850 dark:text-slate-200 outline-none cursor-pointer flex items-center justify-between h-[36px] w-full">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
              <ListBox>
                <ListBox.Item id="all" textValue={t.airportTransfer.seatsAll}>
                  {t.airportTransfer.seatsAll}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {uniqueSeats.map(s => (
                  <ListBox.Item key={s} id={s.toString()} textValue={`${s} ${t.common.passengers}`}>
                    {s} {t.common.passengers}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          {/* Luggage count filter */}
          <Select
            selectedKey={filterLuggage}
            onSelectionChange={(key) => setFilterLuggage(key as string)}
            className="w-44"
          >
            <Select.Trigger className="bg-slate-50 dark:bg-black px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-850 dark:text-slate-200 outline-none cursor-pointer flex items-center justify-between h-[36px] w-full">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
              <ListBox>
                <ListBox.Item id="all" textValue={t.airportTransfer.baggageAll}>
                  {t.airportTransfer.baggageAll}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="2" textValue={`➔ ${t.airportTransfer.baggageMin} 2 ${t.common.baggage}`}>
                  ➔ {t.airportTransfer.baggageMin} 2 {t.common.baggage}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="4" textValue={`➔ ${t.airportTransfer.baggageMin} 4 ${t.common.baggage}`}>
                  ➔ {t.airportTransfer.baggageMin} 4 {t.common.baggage}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="10" textValue={`➔ ${t.airportTransfer.baggageMin} 10 ${t.common.baggage}`}>
                  ➔ {t.airportTransfer.baggageMin} 10 {t.common.baggage}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>

          {/* Brand/Supplier filter */}
          <Select
            selectedKey={filterBrand}
            onSelectionChange={(key) => setFilterBrand(key as string)}
            className="w-44"
          >
            <Select.Trigger className="bg-slate-50 dark:bg-black px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-850 dark:text-slate-200 outline-none cursor-pointer flex items-center justify-between h-[36px] w-full">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
              <ListBox>
                <ListBox.Item id="all" textValue={t.airportTransfer.supplierAll}>
                  {t.airportTransfer.supplierAll}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {uniqueBrands.map(b => (
                  <ListBox.Item key={b} id={b} textValue={b}>
                    {b}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          {/* Sắp xếp (Sorting) */}
          <Select
            selectedKey={sortOrder}
            onSelectionChange={(key) => setSortOrder(key as any)}
            className="w-44 ml-auto"
          >
            <Select.Trigger className="bg-slate-50 dark:bg-black px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-850 dark:text-slate-200 outline-none cursor-pointer flex items-center justify-between h-[36px] w-full">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
              <ListBox>
                <ListBox.Item id="asc" textValue={t.airportTransfer.sortPriceAsc}>
                  {t.airportTransfer.sortPriceAsc}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="desc" textValue={t.airportTransfer.sortPriceDesc}>
                  {t.airportTransfer.sortPriceDesc}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>

        </div>

        {/* Two-Column Layout on Desktop: Left is Vehicles, Right is Booking Sticky Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Vehicles grid */}
          <div className="lg:col-span-7 space-y-5">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-5 flex flex-row gap-5 items-center rounded-2xl">
                    <Skeleton className="w-32 h-24 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3 rounded" />
                      <Skeleton className="h-3 w-1/2 rounded" />
                      <Skeleton className="h-3 w-1/4 rounded" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-black rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-slate-300 text-5xl">🚗</span>
                <h3 className="text-base font-extrabold mt-4 text-slate-800 dark:text-white">
                  {t.airportTransfer.noVehiclesFound}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {t.airportTransfer.noVehiclesDesc}
                </p>
                <Button
                  onClick={() => {
                    setFilterSeats("all");
                    setFilterLuggage("all");
                    setFilterBrand("all");
                  }}
                  className="mt-4 px-5 py-2.5 bg-accent text-white text-xs font-bold rounded-xl border-none cursor-pointer"
                >
                  {t.airportTransfer.resetFilters}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOptions.map(({ service, option }) => {
                  const isSelected = selectedVehicle?.id === option.id;
                  const unitName = getLocalizedOptionName(option);
                  const unitDesc = getLocalizedOptionDesc(option);
                  
                  const imgUrl = optionImages[option.id!] || "";

                  return (
                    <div
                      key={option.id}
                      className={`flex flex-col sm:flex-row bg-white dark:bg-black rounded-3xl p-5 border transition-all duration-300 gap-5 items-stretch ${
                        isSelected
                          ? "border-accent ring-2 ring-accent/10 shadow-md"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                      }`}
                    >
                      {/* Left: Image & supplier logo */}
                      <div className="w-full sm:w-44 h-32 rounded-2xl overflow-hidden bg-slate-100 dark:bg-black shrink-0 relative">
                        <img
                          src={imgUrl}
                          alt={unitName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 bg-white/95 dark:bg-black/95 backdrop-blur-md px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-800 shadow-sm">
                          <span className="text-[9px] font-black text-blue-600 uppercase tracking-wider">SaveGo</span>
                        </div>
                      </div>

                      {/* Middle: Details */}
                      <div className="flex-1 flex flex-col justify-between py-0.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                              {unitName}
                            </h3>
                            <div className="inline-flex items-center gap-0.5 bg-blue-50 dark:bg-blue-950/40 text-accent px-1.5 py-0.5 rounded text-[10px] font-extrabold">
                              <Star size={9} fill="currentColor" />
                              <span>4.6/5</span>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">
                            {unitDesc}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1.5 text-xs text-slate-600 dark:text-slate-350 font-semibold">
                            <span className="flex items-center gap-1"><User size={13} className="text-slate-400" /> {option.seatCapacity || 4} {t.common.passengers}</span>
                            <span className="flex items-center gap-1"><Briefcase size={13} className="text-slate-400" /> {option.maxLuggage || 2} {t.common.baggage}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-2.5">
                          <span className="text-[10px] font-bold text-accent underline cursor-pointer hover:text-blue-700">{t.airportTransfer.vehicleDetails}</span>
                          <span className="text-[10px] text-slate-300 dark:text-slate-700">•</span>
                          <span className="text-[10px] font-bold text-slate-400 hover:underline cursor-pointer">{t.airportTransfer.cancellationPolicy}</span>
                        </div>
                      </div>

                      {/* Right: Price & CTA */}
                      <div className="flex flex-col justify-between items-end shrink-0 pl-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800/80 pt-4 sm:pt-0">
                        <div className="text-right">
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{t.airportTransfer.allInclusive}</span>
                          <span className="text-lg font-black text-amber-500">{formatPrice(option.price)}</span>
                          <span className="text-[10px] font-bold text-slate-400"> / {t.airportTransfer.priceUnit}</span>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-500 mt-2">
                          <CheckCircle size={11} fill="currentColor" className="text-white dark:text-slate-950" />
                          <span>{t.airportTransfer.tollsIncluded}</span>
                        </div>

                        <Button
                          onClick={() => handleSelectVehicle(option)}
                          className={`mt-4 w-full sm:w-28 py-2.5 rounded-xl text-xs font-black transition-all border-none cursor-pointer ${
                            isSelected
                              ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                              : "bg-orange-500 hover:bg-orange-600 text-white"
                          }`}
                        >
                          {isSelected ? `${t.airportTransfer.selected} ✓` : t.airportTransfer.choose}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Checkout details form */}
          <div ref={checkoutFormRef} className="lg:col-span-5">
            {!selectedVehicle ? (
              <div className="bg-slate-100 dark:bg-black/40 p-8 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
                <span className="text-3xl">📝</span>
                <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400">
                  {t.airportTransfer.selectVehicleHint}
                </h4>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  {t.airportTransfer.selectVehicleHintDesc}
                </p>
              </div>
            ) : bookingSuccess ? (
              <div className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-sm space-y-5 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle size={32} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-black text-xl text-slate-900 dark:text-white">
                    {t.airportTransfer.requestSubmitted}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t.airportTransfer.requestSubmittedDesc} <strong className="text-blue-500 font-extrabold">{createdCode || "BK-PENDING"}</strong>
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-black p-4 rounded-2xl text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-semibold text-left border border-blue-100 dark:border-slate-800">
                  {t.airportTransfer.requestRedirect}
                </div>
                <Button
                  onClick={() => {
                    const totalAmount = selectedVehicle.price;
                    const vehicleName = getLocalizedOptionName(selectedVehicle);
                    const vehicleDesc = getLocalizedOptionDesc(selectedVehicle);
                    const message = `[Minh Khoa Travel - Đơn Đặt Xe Sân Bay]\n` +
                      `- Mã đặt xe: ${createdCode || "BK-PENDING"}\n` +
                      `- Họ và tên: ${fullName}\n` +
                      `- Số điện thoại: ${phone}\n` +
                      `- Dòng xe: ${vehicleName}\n` +
                      `- Lộ trình: ${pickup} ➔ ${destination}\n` +
                      `- Ngày giờ: ${date} lúc ${time}\n` +
                      `- Tổng tiền: ${formatPrice(totalAmount)}`;
                    window.open(`https://zalo.me/0764971971?text=${encodeURIComponent(message)}`, "_blank");
                  }}
                  className="w-full h-12 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-accent-hover border-none cursor-pointer"
                >
                  {t.airportTransfer.contactZalo}
                </Button>
                <Button
                  onClick={() => {
                    setSelectedVehicle(null);
                    setBookingSuccess(false);
                  }}
                  className="w-full py-2 bg-transparent text-slate-400 hover:text-slate-600 text-xs font-semibold border-none cursor-pointer mt-2"
                >
                  {t.airportTransfer.bookAnother}
                </Button>
              </div>
            ) : (
              <div className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
                
                {/* Booking summary header */}
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent">{t.airportTransfer.checkoutStep}</span>
                  <h3 className="font-extrabold text-lg text-slate-950 dark:text-white leading-tight">
                    {t.airportTransfer.checkoutTitle}
                  </h3>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-black p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 mt-3">
                    <Award size={18} className="text-accent" />
                    <div className="text-left">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase leading-none">{t.airportTransfer.selectedClass}</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">{getLocalizedOptionName(selectedVehicle)} ({getLocalizedOptionDesc(selectedVehicle)})</span>
                    </div>
                  </div>
                </div>

                {/* Main Form */}
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <AutofillButton
                    onFill={(d) => { setFullName(d.fullname); setPhone(d.phone); setEmail(d.email); }}
                  />
                  {/* Full Name */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <User size={13} className="text-accent" />
                      <span>{t.airportTransfer.fullNameLabel} *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t.airportTransfer.fullNamePlaceholder}
                      className="w-full p-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
                    />
                  </div>

                  {/* Phone & Email Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Phone size={13} className="text-accent" />
                        <span>{t.airportTransfer.phoneLabel} *</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="E.g., +84 764 971 971"
                        className="w-full p-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Mail size={13} className="text-accent" />
                        <span>{t.airportTransfer.emailLabel} *</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="E.g., example@gmail.com"
                        className="w-full p-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
                      />
                    </div>
                  </div>

                  {/* Social ID (Zalo / Kakao) */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <MessageCircle size={13} className="text-accent" />
                      <span>{t.airportTransfer.socialContact} *</span>
                    </label>
                    <div className="flex gap-2">
                      <Select
                        selectedKey={contactChannel}
                        onSelectionChange={(key) => setContactChannel(key as any)}
                        className="w-32 shrink-0"
                      >
                        <Select.Trigger className="w-full p-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-850 dark:text-slate-200 outline-none cursor-pointer flex items-center justify-between h-[42px]">
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                          <ListBox>
                            <ListBox.Item id="zalo" textValue="Zalo">
                              Zalo
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                            <ListBox.Item id="kakaotalk" textValue="KakaoTalk">
                              KakaoTalk
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          </ListBox>
                        </Select.Popover>
                      </Select>
                      <input
                        type="text"
                        required
                        value={contactId}
                        onChange={(e) => setContactId(e.target.value)}
                        placeholder={contactChannel === "zalo" ? t.airportTransfer.zaloPlaceholder : "KakaoTalk ID"}
                        className="w-full p-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
                      />
                    </div>
                  </div>

                  {/* Flight Number (Mã chuyến bay) */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <span className="text-accent">✈</span>
                      <span>{t.airportTransfer.flightTracking}</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={flightNumber}
                        onChange={(e) => setFlightNumber(e.target.value)}
                        placeholder="E.g., VJ123, VN301..."
                        className="w-full p-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
                      />
                      <Button
                        type="button"
                        onClick={handleCheckFlight}
                        isDisabled={checkingFlight}
                        className="px-4 bg-accent text-white rounded-2xl text-xs font-black border-none cursor-pointer h-10 shrink-0 self-center"
                      >
                        {checkingFlight
                          ? t.airportTransfer.checking
                          : t.airportTransfer.trackFlight}
                      </Button>
                    </div>
                    {flightData && (
                      <div className="p-3 bg-blue-50/50 dark:bg-black/60 border border-blue-100 dark:border-slate-850 rounded-2xl text-[11px] text-left space-y-1 mt-1 font-semibold">
                        {flightData.error ? (
                          <span className="text-red-500 font-bold">{t.airportTransfer.flightNotFound}</span>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-350">
                            <div><strong>{t.airportTransfer.airline}:</strong> {flightData.airlineName}</div>
                            <div><strong>{t.airportTransfer.flightStatus}:</strong> <span className="text-emerald-600 dark:text-emerald-500 font-bold">{flightData.status}</span></div>
                            <div><strong>{t.airportTransfer.scheduledDeparture}:</strong> {new Date(flightData.scheduledDeparture).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                            <div><strong>{t.airportTransfer.flightRoute}:</strong> {flightData.departureAirport} ➔ CXR</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Notes / Special requests */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <MessageCircle size={13} className="text-amber-500" />
                      <span>{t.airportTransfer.notesLabel}</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t.airportTransfer.notesPlaceholder}
                      className="w-full h-20 p-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none resize-none"
                    />
                  </div>

                  {/* Pricing recap */}
                  <div className="p-4 bg-slate-50 dark:bg-black rounded-2xl border border-slate-100 dark:border-slate-850/60 mt-4 flex justify-between items-center">
                    <div className="text-left">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase leading-none">{t.airportTransfer.totalPriceLabel}</span>
                      <span className="text-xs font-bold text-accent">{t.airportTransfer.tollsTaxesIncluded}</span>
                    </div>
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {formatPrice(selectedVehicle.price)}
                    </span>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    isDisabled={submitting}
                    className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-sm transition-all border-none cursor-pointer mt-2"
                  >
                    {submitting ? t.airportTransfer.submittingRequest : t.airportTransfer.confirmBooking}
                  </Button>

                </form>
              </div>
            )}
          </div>

        </div>

      </main>

      <BookingConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmBooking}
        serviceType={isVi ? "Trung chuyển sân bay" : "Airport Transfer"}
        summaryItems={[
          { label: isVi ? "Dòng xe" : "Vehicle", value: selectedVehicle ? getLocalizedOptionName(selectedVehicle) : "" },
          { label: isVi ? "Đón tại" : "Pickup", value: pickup || "-" },
          { label: isVi ? "Đến" : "Destination", value: destination || "-" },
          { label: isVi ? "Ngày giờ" : "Date & time", value: `${date} ${time ? `lúc ${time}` : ""}` },
          { label: isVi ? "Loại chuyến" : "Trip type", value: tripType === "return" ? (isVi ? "Khứ hồi" : "Round-trip") : (isVi ? "Một chiều" : "One-way") },
          { label: isVi ? "Hành khách" : "Passengers", value: `${passengers} ${isVi ? "người" : "persons"}` },
          { label: isVi ? "Họ tên" : "Name", value: fullName },
          { label: isVi ? "Điện thoại" : "Phone", value: phone },
          { label: isVi ? "Email" : "Email", value: email },
          { label: isVi ? "Số chuyến bay" : "Flight", value: flightNumber || "-" },
          { label: isVi ? "Ghi chú" : "Notes", value: notes || "-" },
        ]}
        totalAmount={selectedVehicle?.price || 0}
        totalLabel={isVi ? "Tổng tiền" : "Total amount"}
        submitting={submitting}
      />
    </div>
  );
}
