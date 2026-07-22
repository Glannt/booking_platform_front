"use client";
import { useState, useEffect, useMemo } from "react";
import {
  DatePicker,
  DateField,
  Calendar,
  Skeleton,
  Label,
  FieldError,
  Button,
  Input,
  TextField,
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Autocomplete,
  EmptyState,
  ListBox,
  SearchField as HeroSearchField
} from "@heroui/react";
import { createBooking, trackFlight } from "@/lib/api/bookings";
import { searchLocations, LocationSearchResult } from "@/lib/api/locations";
import {
  getVehicleCategories,
  getVehicles,
  VehicleCategoryDto,
  VehicleDto,
  getActiveAirports,
  getActiveAirportRoutes,
  getAirportTransferPricesByRouteAndServiceType,
  AirportDto,
  AirportRouteDto,
  AirportTransferPrice
} from "@/lib/api/fleet";
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
  CheckCircle,
  Search,
  Car
} from "lucide-react";

import dynamic from "next/dynamic";
const RoutingMap = dynamic(
  () => import("@/components/routing-map").then((mod) => mod.RoutingMap),
  { ssr: false }
);
import { TimePicker, type TimeValue } from "@/components/time-picker";
import { useI18n } from "@/context/LanguageContext";
import { formatPrice as _formatPrice } from "@/lib/format";
import { AutofillButton } from "@/components/AutofillButton";
import BookingConfirmationModal from "@/components/BookingConfirmationModal";
import type { SectionDto } from "@/lib/api/sections";

// Build vehicle list from API data (VehicleCategory + Vehicle)
interface VehicleOption {
  id: string;
  nameVi: string;
  nameEn: string;
  descVi: string;
  descEn: string;
  capacity: string;
  luggage: string;
  featuresVi: string[];
  featuresEn: string[];
  priceOneWay: number;
  priceReturn: number;
  categoryId?: number;
  thumbnailUrl?: string;
}

interface AirportTransferClientProps {
  sections: SectionDto[];
}

export default function AirportTransferClient({ sections }: AirportTransferClientProps) {
  const { language, t, contacts } = useI18n();
  const vi = language === "vi";
  const zaloPhone = contacts.zalo.includes("zalo.me/")
    ? contacts.zalo.split("zalo.me/")[1].split("?")[0]
    : contacts.zalo;
  const zaloUrl = `https://zalo.me/${zaloPhone}`;

  const heroSection = sections.find(s => s.sectionType === "HERO_BANNER") || null;

  // Airport & Route data from API
  const [airports, setAirports] = useState<AirportDto[]>([]);
  const [selectedAirport, setSelectedAirport] = useState<AirportDto | null>(null);
  const [routes, setRoutes] = useState<AirportRouteDto[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<AirportRouteDto | null>(null);
  const [transferPrices, setTransferPrices] = useState<AirportTransferPrice[]>([]);
  const [airportsLoading, setAirportsLoading] = useState(true);
  const [routesLoading, setRoutesLoading] = useState(false);

  // Route toggle
  const [direction, setDirection] = useState<"to-nhatrang" | "to-airport">("to-nhatrang");
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

  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);

  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null);

  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Vehicle data from API
  const [vehicleCategories, setVehicleCategories] = useState<VehicleCategoryDto[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [vehiclesLoaded, setVehiclesLoaded] = useState(false);

  // Checkout states
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactChannel, setContactChannel] = useState<"zalo" | "kakaotalk">("zalo");
  const [contactId, setContactId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [createdCode, setCreatedCode] = useState("");
  const [checkingFlight, setCheckingFlight] = useState(false);
  const [flightData, setFlightData] = useState<any>(null);

  // Confirm modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formTouched, setFormTouched] = useState(false);

  // Autocomplete suggestions
  const [suggestions, setSuggestions] = useState<LocationSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [returnSuggestions, setReturnSuggestions] = useState<LocationSearchResult[]>([]);
  const [showReturnSuggestions, setShowReturnSuggestions] = useState(false);

  // Search vehicles from API
  const handleSearchVehicles = async () => {
    setVehiclesLoading(true);
    try {
      const [catRes, vehicleRes] = await Promise.allSettled([
        getVehicleCategories({ active: true }),
        getVehicles({}),
      ]);
      if (catRes.status === "fulfilled" && catRes.value.data?.content) {
        setVehicleCategories(catRes.value.data.content);
      }
      if (vehicleRes.status === "fulfilled" && vehicleRes.value.data?.content) {
        setVehicles(vehicleRes.value.data.content);
      }
      setVehiclesLoaded(true);
    } catch (err) {
      console.error("Error loading vehicles:", err);
    } finally {
      setVehiclesLoading(false);
    }
  };

  // Fetch active airports on mount
  useEffect(() => {
    getActiveAirports()
      .then(res => {
        if (res && res.data) {
          setAirports(res.data);
          // Default to CXR (Cam Ranh)
          const cxr = res.data.find(a => a.code === "CXR");
          if (cxr) {
            setSelectedAirport(cxr);
          } else if (res.data.length > 0) {
            setSelectedAirport(res.data[0]);
          }
        }
      })
      .catch(err => console.error("Error loading airports:", err))
      .finally(() => setAirportsLoading(false));
  }, []);

  // Fetch routes when airport changes
  useEffect(() => {
    if (!selectedAirport?.id) return;
    setRoutesLoading(true);
    setSelectedRoute(null);
    setTransferPrices([]);
    getActiveAirportRoutes(selectedAirport.id)
      .then(res => {
        if (res && res.data) {
          setRoutes(res.data);
          // Auto-select first route
          if (res.data.length > 0) {
            setSelectedRoute(res.data[0]);
          }
        }
      })
      .catch(err => console.error("Error loading routes:", err))
      .finally(() => setRoutesLoading(false));
  }, [selectedAirport?.id]);

  // Fetch transfer prices when route + tripType changes
  useEffect(() => {
    if (!selectedRoute?.id) return;
    const serviceType = tripType === "return" ? "ROUND_TRIP" : "ONE_WAY";
    getAirportTransferPricesByRouteAndServiceType(selectedRoute.id, serviceType)
      .then(res => {
        if (res && res.data) {
          setTransferPrices(res.data);
        }
      })
      .catch(err => console.error("Error loading transfer prices:", err));
  }, [selectedRoute?.id, tripType]);

  const isFormComplete = Boolean(
    dateValue && nhaTrangAddress.length > 0 &&
    (tripType === "one-way" || (tripType === "return" && returnDateValue))
  );

  // Auto-load vehicle categories when form is complete
  useEffect(() => {
    if (!isFormComplete || vehiclesLoaded || vehiclesLoading) return;
    handleSearchVehicles();
  }, [isFormComplete, vehiclesLoaded, vehiclesLoading]);

  // Helper: get airport display name by locale
  const getAirportName = (airport: AirportDto) => {
    const tr = airport.translations?.find(t => t.locale === language) || airport.translations?.[0];
    return tr?.name || airport.name || airport.code;
  };

  // Computed airport display name with code
  const airportDisplayName = selectedAirport
    ? `${getAirportName(selectedAirport)} (${selectedAirport.code})`
    : t.airportTransfer.camRanhAirport;
  const airportNameShort = selectedAirport
    ? getAirportName(selectedAirport)
    : t.airportTransfer.camRanhAirport;

  // Build vehicle list from API data
  const getVehiclesList = (): VehicleOption[] => {
    if (vehicleCategories.length === 0) return [];
    return vehicleCategories.map(cat => {
      const tr = cat.translations?.find(t => t.locale === language) || cat.translations?.[0];
      const catName = tr?.name || cat.code;
      const catDesc = tr?.description || "";
      const minSeat = cat.minSeat || cat.maxSeat || 4;
      const maxSeat = cat.maxSeat || 4;
      const capacityText = `${maxSeat} ${t.common.passengers}`;
      const luggageText = `${cat.maxLuggage || 2} ${t.common.baggage}`;
      // Get prices from API transfer prices
      const priceEntry = transferPrices.find(p => p.vehicleCategoryId === cat.id);
      const apiPrice = priceEntry ? Number(priceEntry.amount) : 0;
      return {
        id: cat.code,
        nameVi: catName,
        nameEn: catName,
        descVi: catDesc,
        descEn: catDesc,
        capacity: capacityText,
        luggage: luggageText,
        featuresVi: [t.airportTransfer.cleanVehicle, t.airportTransfer.airConditioning],
        featuresEn: ["Clean vehicle", "Air Conditioning"],
        priceOneWay: tripType === "one-way" ? apiPrice : Math.round(apiPrice / 1.85),
        priceReturn: apiPrice,
        categoryId: cat.id,
        thumbnailUrl: cat.thumbnailUrl,
      };
    });
  };

  const activeVehicles = getVehiclesList();

  // Location search effect for Outbound Address
  useEffect(() => {
    if (!nhaTrangAddress || nhaTrangAddress.length < 2) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await searchLocations(nhaTrangAddress, language, 5);
        setSuggestions(res?.data || []);
      } catch (err) {
        console.error("Error searching location:", err);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [nhaTrangAddress, language]);

  // Location search effect for Return Address
  useEffect(() => {
    if (!nhaTrangReturnAddress || nhaTrangReturnAddress.length < 2) {
      setReturnSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await searchLocations(nhaTrangReturnAddress, language, 5);
        setReturnSuggestions(res?.data || []);
      } catch (err) {
        console.error("Error searching return location:", err);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [nhaTrangReturnAddress, language]);

  // Sync outbound and return addresses
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

  useEffect(() => {
    setIsCalculating(true);
    const timer = setTimeout(() => setIsCalculating(false), 300);
    return () => clearTimeout(timer);
  }, [direction, outboundStartsFrom, tripType, selectedVehicleId, vehicleCategories]);

  const handleCheckFlight = async (isOutbound: boolean) => {
    const flightNum = isOutbound ? flightNumber : returnFlightNumber;
    if (!flightNum.trim()) return;

    setCheckingFlight(true);
    setFlightData(null);
    try {
      const res = await trackFlight(flightNum);
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

  const selectedVehicle = activeVehicles.find((v) => v.id === selectedVehicleId) || activeVehicles[0];
  const outboundPrice = selectedVehicle?.priceOneWay || 0;
  const returnPrice = tripType === "return" ? (selectedVehicle?.priceReturn || 0) - (selectedVehicle?.priceOneWay || 0) : 0;
  const unitPrice = tripType === "one-way" ? (selectedVehicle?.priceOneWay || 0) : (selectedVehicle?.priceReturn || 0);

  // Format currency
  const formatPrice = (p: number) => _formatPrice(p, language);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    setSubmitting(true);

    // Use API-driven vehicle category ID
    const serviceId = selectedVehicle?.categoryId || 101;
    const serviceOptionId = selectedVehicle?.categoryId || 11;

    const activeAddress = nhaTrangAddress || "Trung tâm Nha Trang";
    const activeReturnAddress = nhaTrangReturnAddress || activeAddress;

    // Build locations
    let outboundPickup = "";
    let outboundDropoff = "";
    let returnPickup = "";
    let returnDropoff = "";
    let outboundDirection = "FROM_AIRPORT";
    let returnDirection = "TO_AIRPORT";

    if (tripType === "one-way") {
      if (direction === "to-nhatrang") {
        outboundPickup = airportDisplayName;
        outboundDropoff = activeAddress;
        outboundDirection = "FROM_AIRPORT";
      } else {
        outboundPickup = activeAddress;
        outboundDropoff = airportDisplayName;
        outboundDirection = "TO_AIRPORT";
      }
    } else {
      if (outboundStartsFrom === "airport") {
        outboundPickup = airportDisplayName;
        outboundDropoff = activeAddress;
        outboundDirection = "FROM_AIRPORT";
        returnPickup = activeReturnAddress;
        returnDropoff = airportDisplayName;
        returnDirection = "TO_AIRPORT";
      } else {
        outboundPickup = activeAddress;
        outboundDropoff = airportDisplayName;
        outboundDirection = "TO_AIRPORT";
        returnPickup = airportDisplayName;
        returnDropoff = activeReturnAddress;
        returnDirection = "FROM_AIRPORT";
      }
    }

    const pickupLoc = tripType === "return"
      ? `${outboundPickup} ➔ ${outboundDropoff}`
      : outboundPickup;
    const dropoffLoc = tripType === "return"
      ? `${returnPickup} ➔ ${returnDropoff}`
      : outboundDropoff;

    const timeText = `${String(timeValue.hour).padStart(2, "0")}:${String(timeValue.minute).padStart(2, "0")} ${timeValue.period}`;
    const dateText = dateValue ? dateValue.toString() : "";
    const startDateFormatted = dateText ? `${dateText}T${String(timeValue.hour).padStart(2, "0")}:${String(timeValue.minute).padStart(2, "0")}:00` : undefined;

    let endDateFormatted: string | undefined = undefined;
    if (tripType === "return" && returnDateValue) {
      endDateFormatted = `${returnDateValue.toString()}T${String(returnTimeValue.hour).padStart(2, "0")}:${String(returnTimeValue.minute).padStart(2, "0")}:00`;
    }

    const airportDetails = {
      tripType: tripType === "return" ? "ROUND_TRIP" : "ONE_WAY",
      airportId: selectedAirport?.id || null,
      airportCode: selectedAirport?.code || "CXR",
      routeId: selectedRoute?.id || null,
      routeCode: selectedRoute?.code || null,
      outboundDirection,
      outboundDate: dateText || null,
      outboundPickupTime: startDateFormatted || null,
      outboundFlightNumber: flightNumber || null,
      outboundPickupAddress: outboundPickup,
      outboundDropoffAddress: outboundDropoff,
      returnDirection: tripType === "return" ? returnDirection : null,
      returnDate: tripType === "return" && returnDateValue ? returnDateValue.toString() : null,
      returnPickupTime: endDateFormatted || null,
      returnFlightNumber: tripType === "return" ? (returnFlightNumber || null) : null,
      returnPickupAddress: tripType === "return" ? returnPickup : null,
      returnDropoffAddress: tripType === "return" ? returnDropoff : null,
      vehicleCategoryId: selectedVehicle.categoryId || null,
      basePrice: outboundPrice,
      totalPrice: unitPrice,
      currency: "VND",
    };

    const payload = {
      customerName: fullName,
      customerEmail: email || `${phone}@traveler.com`,
      customerPhone: phone,
      totalAmount: unitPrice,
      contactChannel: contactChannel,
      contactId: contactId,
      customerNotes: `[Social: ${contactChannel.toUpperCase()} ID: ${contactId}] Notes: ${notes}`,
      items: [
        {
          serviceId: serviceId,
          serviceOptionId: serviceOptionId,
          quantity: 1,
          unitPrice: unitPrice,
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          pickupLocation: pickupLoc,
          dropoffLocation: dropoffLoc,
          flightNumber: flightNumber || undefined,
          dynamicDetails: JSON.stringify(airportDetails)
        }
      ]
    };

    try {
      const res = await createBooking(payload);
      if (res && res.data) {
        setCreatedCode(res.data.bookingCode || "BK-SUCCESS");
      }
      setBookingSuccess(true);

      const vehicleName = vi ? selectedVehicle.nameVi : selectedVehicle.nameEn;
      const vehicleDesc = vi ? selectedVehicle.descVi : selectedVehicle.descEn;
      const tripLabel = tripType === "return" ? "Khứ hồi" : "Một chiều";
      let routeLine = `${outboundPickup} ➔ ${outboundDropoff}`;
      if (tripType === "return") {
        routeLine += `\n- Chiều về: ${returnPickup} ➔ ${returnDropoff}`;
      }
      const message = `[Minh Khoa Travel - Đơn Đặt Xe Sân Bay]\n` +
        `- Mã đặt xe: ${res.data?.bookingCode || "BK-PENDING"}\n` +
        `- Họ và tên: ${fullName}\n` +
        `- Số điện thoại: ${phone}\n` +
        `- Kênh liên hệ: ${contactChannel.toUpperCase()} (${contactId})\n` +
        `- Dòng xe: ${vehicleName} (${vehicleDesc})\n` +
        `- Loại hình: ${tripLabel}\n` +
        `- Chiều đi: ${routeLine}\n` +
        `- Ngày giờ đón: ${dateText} lúc ${timeText}\n` +
        (tripType === "return" && returnDateValue
          ? `- Ngày giờ về: ${returnDateValue.toString()} lúc ${String(returnTimeValue.hour).padStart(2, "0")}:${String(returnTimeValue.minute).padStart(2, "0")} ${returnTimeValue.period}\n`
          : "") +
        (flightNumber ? `- Chuyến bay đi: ${flightNumber}\n` : "") +
        (returnFlightNumber ? `- Chuyến bay về: ${returnFlightNumber}\n` : "") +
        `- Ghi chú: ${notes}\n` +
        `- Tổng tiền tạm tính: ${formatPrice(unitPrice)}`;

      window.open(`${zaloUrl}?text=${encodeURIComponent(message)}`, "_blank");
    } catch (err) {
      console.error("Booking API error:", err);
      const vehicleName = vi ? selectedVehicle.nameVi : selectedVehicle.nameEn;
      const tripLabel = tripType === "return" ? "Khứ hồi" : "Một chiều";
      let routeLine = `${outboundPickup} ➔ ${outboundDropoff}`;
      if (tripType === "return") {
        routeLine += `\n- Chiều về: ${returnPickup} ➔ ${returnDropoff}`;
      }
      const message = `[Minh Khoa Travel - Yêu Cầu Đặt Xe Sân Bay]\n` +
        `- Họ và tên: ${fullName}\n` +
        `- Số điện thoại: ${phone}\n` +
        `- Dòng xe: ${vehicleName}\n` +
        `- Loại hình: ${tripLabel}\n` +
        `- Chiều đi: ${routeLine}\n` +
        `- Ngày giờ đón: ${dateText} lúc ${timeText}\n` +
        `- Tổng tiền tạm tính: ${formatPrice(unitPrice)}`;
      window.open(`${zaloUrl}?text=${encodeURIComponent(message)}`, "_blank");
      setBookingSuccess(true);
    } finally {
      setSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  const handleBooking = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmBooking = () => {
    setShowConfirmModal(false);
    setShowCheckoutForm(true);
    setTimeout(() => {
      const el = document.getElementById("checkout-form-container");
      el?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 flex flex-col font-sans">

      {/* Hero Banner Area */}
      <section className="relative w-full min-h-[300px] flex items-center pt-28 pb-14 px-6 overflow-hidden">
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

        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10 text-white">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 dark:bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 mb-3">
              <Sparkles size={12} className="text-accent animate-spin-slow" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-100">
                {heroSection?.translations?.find(tr => tr.locale === language)?.subtitle || t.airportTransfer.subtitle}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              {heroSection?.translations?.find(tr => tr.locale === language)?.title || t.airportTransfer.title}
            </h1>
            <p className="mt-2 text-sm md:text-base text-slate-200 max-w-3xl font-medium leading-relaxed">
              {heroSection?.translations?.find(tr => tr.locale === language)?.description || t.airportTransfer.heroDesc}
            </p>
          </div>
          <a
            href="tel:0764971971"
            className="flex items-center gap-2.5 bg-accent hover:bg-accent-hover text-white px-5 py-3 rounded-full text-sm font-black transition-all shadow-lg hover:scale-105 active:scale-95 no-underline shrink-0 border-none"
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
          <div className="bg-white dark:bg-black rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-5">
            {/* Direction & Trip Type Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl gap-1 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTripType("one-way")}
                  className={`py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${tripType === "one-way"
                    ? "bg-white dark:bg-black text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                >
                  {t.airportTransfer.oneWay}
                </button>
                <button
                  type="button"
                  onClick={() => setTripType("return")}
                  className={`py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${tripType === "return"
                    ? "bg-white dark:bg-black text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                >
                  {t.airportTransfer.roundTrip}
                </button>
              </div>

              {tripType === "one-way" ? (
                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl gap-1 flex-1 max-w-md">
                  <button
                    type="button"
                    onClick={() => setDirection("to-nhatrang")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${direction === "to-nhatrang"
                      ? "bg-white dark:bg-black text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                  >
                    {t.airportTransfer.toNhaTrang}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection("to-airport")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${direction === "to-airport"
                      ? "bg-white dark:bg-black text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                  >
                    {t.airportTransfer.toAirport}
                  </button>
                </div>
              ) : (
                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl gap-1 flex-1 max-w-md items-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 shrink-0">
                    {`${t.airportTransfer.outbound}:`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOutboundStartsFrom("airport")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${outboundStartsFrom === "airport"
                      ? "bg-white dark:bg-black text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                  >
                    {t.airportTransfer.toNhaTrang}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutboundStartsFrom("nhatrang")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${outboundStartsFrom === "nhatrang"
                      ? "bg-white dark:bg-black text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                  >
                    {t.airportTransfer.toAirport}
                  </button>
                </div>
              )}
            </div>

            {/* Airport Selector */}
            {airports.length > 1 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white pl-1">
                  {t.airportTransfer.airport}
                </label>
                <Autocomplete
                  className="w-full"
                  placeholder={t.airportTransfer.selectAirport}
                  selectionMode="single"
                  value={selectedAirport?.id ? String(selectedAirport.id) : null}
                  onChange={(key) => {
                    const airport = airports.find(a => a.id === Number(key));
                    if (airport) setSelectedAirport(airport);
                  }}
                >
                  <Autocomplete.Trigger>
                    <div className="flex items-center h-10 border border-slate-200 dark:border-slate-800 rounded-xl px-3 bg-white dark:bg-black hover:border-blue-500/50 transition-colors">
                      <Plane size={16} className="text-slate-400 dark:text-slate-500 mr-2 shrink-0" />
                      <Autocomplete.Value className="text-xs font-semibold text-slate-800 dark:text-slate-100" />
                      <Autocomplete.ClearButton className="ml-auto" />
                      <Autocomplete.Indicator />
                    </div>
                  </Autocomplete.Trigger>
                  <Autocomplete.Popover>
                    <Autocomplete.Filter filter={() => true}>
                      <HeroSearchField autoFocus name="search" variant="secondary">
                        <HeroSearchField.Group>
                          <HeroSearchField.SearchIcon />
                           <HeroSearchField.Input placeholder={t.airportTransfer.searchAirports} />
                          <HeroSearchField.ClearButton />
                        </HeroSearchField.Group>
                      </HeroSearchField>
                       <ListBox className="max-h-[200px] overflow-y-auto" renderEmptyState={() => <EmptyState>{t.common.noResults}</EmptyState>}>
                        {airports.map((airport) => (
                          <ListBox.Item key={String(airport.id)} id={String(airport.id)} textValue={getAirportName(airport)}>
                            <div className="flex items-center gap-2 py-0.5">
                              <Plane size={14} className="text-blue-500" />
                              <span className="text-xs font-bold">{getAirportName(airport)} ({airport.code})</span>
                            </div>
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Autocomplete.Filter>
                  </Autocomplete.Popover>
                </Autocomplete>
              </div>
            )}

            {/* ONE-WAY TRIP FORM */}
            {tripType === "one-way" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {direction === "to-nhatrang" ? (
                    <>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3">
                        <MapPin className="text-blue-600 dark:text-blue-400 mt-1 shrink-0" size={18} />
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">{t.airportTransfer.pickup}</p>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">{airportNameShort}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">{t.airportTransfer.driverMeetDesc}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3 w-full">
                        <MapPin className="text-green-600 dark:text-green-400 mt-1 shrink-0" size={18} />
                        <div className="w-full flex-1">
                           <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">{t.airportTransfer.dropoff}</p>
                           <div className="relative w-full">
                             <HeroSearchField
                               isRequired
                               isInvalid={formTouched && nhaTrangAddress.length === 0}
                               name="dropoff-address"
                               value={nhaTrangAddress}
                               onChange={(val) => { handleNhaTrangAddressChange(val); setShowSuggestions(true); }}
                             >
                               <HeroSearchField.Group className="mt-1.5 flex items-center border border-slate-200 dark:border-slate-800 rounded-xl px-3 h-10 bg-white dark:bg-black focus-within:border-blue-500/50 transition-colors w-full">
                                 <HeroSearchField.SearchIcon className="text-slate-400 dark:text-slate-500 mr-2 shrink-0" />
                                 <HeroSearchField.Input
                                   placeholder={t.airportTransfer.addressPlaceholder}
                                   className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                                 />
                                 <HeroSearchField.ClearButton className="text-slate-400 dark:text-slate-500 hover:text-slate-600 ml-auto" />
                               </HeroSearchField.Group>
                               {formTouched && nhaTrangAddress.length === 0 && (
                                 <FieldError className="text-[9px] text-red-500 mt-1 pl-1">Vui lòng nhập địa điểm</FieldError>
                               )}
                             </HeroSearchField>
                            {showSuggestions && suggestions.length > 0 && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />
                                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                  {suggestions.map((item, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() => { handleNhaTrangAddressChange(item.address || item.name); setShowSuggestions(false); }}
                                      className="p-3 hover:bg-blue-50/50 dark:hover:bg-slate-850 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-350 transition-colors flex items-center gap-2"
                                    >
                                      <MapPin size={14} className="text-blue-500 shrink-0" />
                                      <div className="flex flex-col min-w-0">
                                        <span className="truncate font-semibold">{item.name}</span>
                                        <span className="truncate text-[11px] text-slate-400">{item.address}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-snug">{t.airportTransfer.accommodationTypes}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3 w-full">
                        <MapPin className="text-green-600 dark:text-green-400 mt-1 shrink-0" size={18} />
                        <div className="w-full flex-1">
                           <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">{t.airportTransfer.pickupLocationNT}</p>
                           <div className="relative w-full">
                             <HeroSearchField
                               isRequired
                               isInvalid={formTouched && nhaTrangAddress.length === 0}
                               name="pickup-address"
                               value={nhaTrangAddress}
                               onChange={(val) => { handleNhaTrangAddressChange(val); setShowSuggestions(true); }}
                             >
                               <HeroSearchField.Group className="mt-1.5 flex items-center border border-slate-200 dark:border-slate-800 rounded-xl px-3 h-10 bg-white dark:bg-black focus-within:border-blue-500/50 transition-colors w-full">
                                 <HeroSearchField.SearchIcon className="text-slate-400 dark:text-slate-500 mr-2 shrink-0" />
                                 <HeroSearchField.Input
                                   placeholder={t.airportTransfer.addressPlaceholder}
                                   className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                                 />
                                 <HeroSearchField.ClearButton className="text-slate-400 dark:text-slate-500 hover:text-slate-600 ml-auto" />
                               </HeroSearchField.Group>
                               {formTouched && nhaTrangAddress.length === 0 && (
                                 <FieldError className="text-[9px] text-red-500 mt-1 pl-1">Vui lòng nhập địa điểm</FieldError>
                               )}
                             </HeroSearchField>
                            {showSuggestions && suggestions.length > 0 && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />
                                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                  {suggestions.map((item, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() => { handleNhaTrangAddressChange(item.address || item.name); setShowSuggestions(false); }}
                                      className="p-3 hover:bg-blue-50/50 dark:hover:bg-slate-850 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-355 transition-colors flex items-center gap-2"
                                    >
                                      <MapPin size={14} className="text-blue-500 shrink-0" />
                                      <div className="flex flex-col min-w-0">
                                        <span className="truncate font-semibold">{item.name}</span>
                                        <span className="truncate text-[11px] text-slate-400">{item.address}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-snug">{t.airportTransfer.accommodationTypes}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3">
                        <MapPin className="text-blue-600 dark:text-blue-400 mt-1 shrink-0" size={18} />
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">{t.airportTransfer.dropoffLocation}</p>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">{airportNameShort}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">{t.airportTransfer.driverDropoffDesc}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  <div className="flex flex-col w-full">
                    <DatePicker
                      value={dateValue}
                      onChange={setDateValue}
                      minValue={today(getLocalTimeZone())}
                      className="w-full"
                      isRequired
                      aria-label="Date Picker"
                    >
                      <Label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">{t.airportTransfer.date}</Label>
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

                  <TimePicker
                    value={timeValue}
                    onChange={setTimeValue}
                    label={t.airportTransfer.time}
                    labelClassName="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1"
                    popoverTitle={t.airportTransfer.selectPickupTime}
                    language={language}
                    isRequired
                  />

                  <div className="flex flex-col w-full">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">{t.airportTransfer.flightNumber}</label>
                    <div className="flex items-center h-10 border border-slate-200 dark:border-slate-800 rounded-xl px-3 bg-white dark:bg-black hover:border-blue-500/50 transition-colors">
                      <Plane size={16} className="text-slate-400 dark:text-slate-500 mr-2 shrink-0" />
                      <input
                        type="text"
                        placeholder="VN123, QH456..."
                        value={flightNumber}
                        onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                        className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                      />
                    </div>
                    {!flightNumber && (
                      <span className="text-[9px] text-slate-400 mt-1 pl-1">Tùy chọn</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ROUND-TRIP DUAL FORM */}
            {tripType === "return" && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 py-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">{t.airportTransfer.outboundLeg}</span>
                    <div className="flex-1 h-[1px] bg-slate-100 dark:bg-slate-800/80" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {outboundStartsFrom === "airport" ? (
                      <>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3">
                          <MapPin className="text-blue-600 dark:text-blue-400 mt-1 shrink-0" size={18} />
                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">{`${t.airportTransfer.outbound} ${t.airportTransfer.pickup}`}</p>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">{airportNameShort}</p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">{t.airportTransfer.driverMeetDesc}</p>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3 w-full">
                          <MapPin className="text-green-600 dark:text-green-400 mt-1 shrink-0" size={18} />
                          <div className="w-full flex-1">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">{`${t.airportTransfer.outbound} ${t.airportTransfer.dropoff}`}</p>
                            <div className="relative w-full">
                              <HeroSearchField
                                isRequired
                                isInvalid={formTouched && nhaTrangAddress.length === 0}
                                name="roundtrip-dropoff-address"
                                value={nhaTrangAddress}
                                onChange={(val) => { handleNhaTrangAddressChange(val); setShowSuggestions(true); }}
                              >
                                <HeroSearchField.Group className="mt-1.5 flex items-center border border-slate-200 dark:border-slate-800 rounded-xl px-3 h-10 bg-white dark:bg-black focus-within:border-blue-500/50 transition-colors w-full">
                                  <HeroSearchField.SearchIcon className="text-slate-400 dark:text-slate-500 mr-2 shrink-0" />
                                  <HeroSearchField.Input
                                    placeholder={t.airportTransfer.addressPlaceholder}
                                    className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                                  />
                                  <HeroSearchField.ClearButton className="text-slate-400 dark:text-slate-500 hover:text-slate-600 ml-auto" />
                                </HeroSearchField.Group>
                                {formTouched && nhaTrangAddress.length === 0 && (
                                  <FieldError className="text-[9px] text-red-500 mt-1 pl-1">Vui lòng nhập địa điểm</FieldError>
                                )}
                              </HeroSearchField>
                              {showSuggestions && suggestions.length > 0 && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />
                                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                    {suggestions.map((item, idx) => (
                                      <div key={idx} onClick={() => { handleNhaTrangAddressChange(item.address || item.name); setShowSuggestions(false); }} className="p-3 hover:bg-blue-50/50 dark:hover:bg-slate-850 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-350 transition-colors flex items-center gap-2">
                                        <MapPin size={14} className="text-blue-500 shrink-0" />
                                        <div className="flex flex-col min-w-0">
                                          <span className="truncate font-semibold">{item.name}</span>
                                          <span className="truncate text-[11px] text-slate-400">{item.address}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3 w-full">
                          <MapPin className="text-green-600 dark:text-green-400 mt-1 shrink-0" size={18} />
                          <div className="w-full flex-1">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">{`${t.airportTransfer.outbound} ${t.airportTransfer.pickupLocationNT}`}</p>
                            <div className="relative w-full">
                              <HeroSearchField
                                isRequired
                                isInvalid={formTouched && nhaTrangAddress.length === 0}
                                name="roundtrip-pickup-address"
                                value={nhaTrangAddress}
                                onChange={(val) => { handleNhaTrangAddressChange(val); setShowSuggestions(true); }}
                              >
                                <HeroSearchField.Group className="mt-1.5 flex items-center border border-slate-200 dark:border-slate-800 rounded-xl px-3 h-10 bg-white dark:bg-black focus-within:border-blue-500/50 transition-colors w-full">
                                  <HeroSearchField.SearchIcon className="text-slate-400 dark:text-slate-500 mr-2 shrink-0" />
                                  <HeroSearchField.Input
                                    placeholder={t.airportTransfer.addressPlaceholder}
                                    className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                                  />
                                  <HeroSearchField.ClearButton className="text-slate-400 dark:text-slate-500 hover:text-slate-600 ml-auto" />
                                </HeroSearchField.Group>
                                {formTouched && nhaTrangAddress.length === 0 && (
                                  <FieldError className="text-[9px] text-red-500 mt-1 pl-1">Vui lòng nhập địa điểm</FieldError>
                                )}
                              </HeroSearchField>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3">
                          <MapPin className="text-blue-600 dark:text-blue-400 mt-1 shrink-0" size={18} />
                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">{`${t.airportTransfer.outbound} ${t.airportTransfer.dropoffLocation}`}</p>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">{airportNameShort}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    <div className="flex flex-col w-full">
                      <DatePicker value={dateValue} onChange={setDateValue} minValue={today(getLocalTimeZone())} className="w-full" isRequired aria-label="Outbound Date">
                        <Label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">{t.airportTransfer.date}</Label>
                        <DateField.Group className="h-10 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex items-center justify-between">
                          <DateField.Input className="text-xs font-semibold bg-transparent border-none outline-none">
                            {(segment) => <DateField.Segment segment={segment} />}
                          </DateField.Input>
                          <DateField.Suffix>
                            <DatePicker.Trigger className="cursor-pointer"><DatePicker.TriggerIndicator /></DatePicker.Trigger>
                          </DateField.Suffix>
                        </DateField.Group>
                        <FieldError className="text-[9px] text-red-500 mt-1 pl-1" />
                        <DatePicker.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-50">
                          <Calendar aria-label="Outbound date">
                            <Calendar.Header className="flex items-center justify-between mb-2">
                              <Calendar.YearPickerTrigger className="text-xs font-bold flex items-center gap-1 cursor-pointer"><Calendar.YearPickerTriggerHeading /><Calendar.YearPickerTriggerIndicator /></Calendar.YearPickerTrigger>
                              <div className="flex gap-1">
                                <Calendar.NavButton slot="previous" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" />
                                <Calendar.NavButton slot="next" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" />
                              </div>
                            </Calendar.Header>
                            <Calendar.Grid className="w-full">
                              <Calendar.GridHeader className="text-slate-400 text-[10px] font-bold">{(day) => <Calendar.HeaderCell className="w-8 h-8 text-center">{day}</Calendar.HeaderCell>}</Calendar.GridHeader>
                              <Calendar.GridBody>{(date) => <Calendar.Cell date={date} className="w-8 h-8 text-xs font-semibold text-center cursor-pointer rounded-lg hover:bg-accent/10 hover:text-accent aria-selected:bg-accent aria-selected:text-white" />}</Calendar.GridBody>
                            </Calendar.Grid>
                          </Calendar>
                        </DatePicker.Popover>
                      </DatePicker>
                    </div>
                    <TimePicker value={timeValue} onChange={setTimeValue} label={t.airportTransfer.time} labelClassName="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1" language={language} isRequired />
                    <div className="flex flex-col w-full">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">{t.airportTransfer.flightNumber}</label>
                      <div className="flex items-center h-10 border border-slate-200 dark:border-slate-800 rounded-xl px-3 bg-white dark:bg-black hover:border-blue-500/50 transition-colors">
                        <Plane size={16} className="text-slate-400 dark:text-slate-500 mr-2 shrink-0" />
                        <input type="text" placeholder="VN123, QH456..." value={flightNumber} onChange={(e) => setFlightNumber(e.target.value.toUpperCase())} className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400" />
                      </div>
                      {!flightNumber && (
                        <span className="text-[9px] text-slate-400 mt-1 pl-1">Tùy chọn</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 py-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">{t.airportTransfer.returnLeg}</span>
                    <div className="flex-1 h-[1px] bg-slate-100 dark:bg-slate-800/80" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3">
                      <MapPin className="text-green-600 dark:text-green-400 mt-1 shrink-0" size={18} />
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">{`${t.airportTransfer.returnLeg} ${t.airportTransfer.pickup}`}</p>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">{nhaTrangReturnAddress || nhaTrangAddress || "Trung tâm Nha Trang"}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3">
                      <MapPin className="text-blue-600 dark:text-blue-400 mt-1 shrink-0" size={18} />
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">{`${t.airportTransfer.returnLeg} ${t.airportTransfer.dropoff}`}</p>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">{airportNameShort}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    <div className="flex flex-col w-full">
                      <DatePicker value={returnDateValue} onChange={setReturnDateValue} minValue={today(getLocalTimeZone())} className="w-full" isRequired aria-label="Return Date">
                        <Label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">{t.airportTransfer.returnDate}</Label>
                        <DateField.Group className="h-10 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex items-center justify-between">
                          <DateField.Input className="text-xs font-semibold bg-transparent border-none outline-none">
                            {(segment) => <DateField.Segment segment={segment} />}
                          </DateField.Input>
                          <DateField.Suffix>
                            <DatePicker.Trigger className="cursor-pointer"><DatePicker.TriggerIndicator /></DatePicker.Trigger>
                          </DateField.Suffix>
                        </DateField.Group>
                        <FieldError className="text-[9px] text-red-500 mt-1 pl-1" />
                        <DatePicker.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-50">
                          <Calendar aria-label="Return date">
                            <Calendar.Header className="flex items-center justify-between mb-2">
                              <Calendar.YearPickerTrigger className="text-xs font-bold flex items-center gap-1 cursor-pointer"><Calendar.YearPickerTriggerHeading /><Calendar.YearPickerTriggerIndicator /></Calendar.YearPickerTrigger>
                              <div className="flex gap-1">
                                <Calendar.NavButton slot="previous" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" />
                                <Calendar.NavButton slot="next" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" />
                              </div>
                            </Calendar.Header>
                            <Calendar.Grid className="w-full">
                              <Calendar.GridHeader className="text-slate-400 text-[10px] font-bold">{(day) => <Calendar.HeaderCell className="w-8 h-8 text-center">{day}</Calendar.HeaderCell>}</Calendar.GridHeader>
                              <Calendar.GridBody>{(date) => <Calendar.Cell date={date} className="w-8 h-8 text-xs font-semibold text-center cursor-pointer rounded-lg hover:bg-accent/10 hover:text-accent aria-selected:bg-accent aria-selected:text-white" />}</Calendar.GridBody>
                            </Calendar.Grid>
                          </Calendar>
                        </DatePicker.Popover>
                      </DatePicker>
                    </div>
                    <TimePicker value={returnTimeValue} onChange={setReturnTimeValue} label={t.airportTransfer.returnTime} labelClassName="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1" language={language} isRequired />
                    <div className="flex flex-col w-full">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">{t.airportTransfer.flightNumber}</label>
                      <div className="flex items-center h-10 border border-slate-200 dark:border-slate-800 rounded-xl px-3 bg-white dark:bg-black hover:border-blue-500/50 transition-colors">
                        <Plane size={16} className="text-slate-400 dark:text-slate-500 mr-2 shrink-0" />
                        <input type="text" placeholder="VN456..." value={returnFlightNumber} onChange={(e) => setReturnFlightNumber(e.target.value.toUpperCase())} className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400" />
                      </div>
                      {!returnFlightNumber && (
                        <span className="text-[9px] text-slate-400 mt-1 pl-1">Tùy chọn</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Vehicle Selection */}
          <div className="bg-white dark:bg-black rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-5">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.airportTransfer.selectVehicle}</h3>
            {!isFormComplete ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">{t.airportTransfer.pleaseFillInfo}</p>
            ) : vehiclesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24 rounded" />
                          <Skeleton className="h-3 w-16 rounded" />
                        </div>
                      </div>
                      <Skeleton className="h-5 w-20 rounded shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeVehicles.map((v) => {
                  const isSelected = selectedVehicleId === v.id || (!selectedVehicleId && v.id === activeVehicles[0]?.id);
                  const price = tripType === "one-way" ? v.priceOneWay : v.priceReturn;
                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVehicleId(v.id)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${isSelected ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-800 hover:border-slate-300"}`}
                    >
                      <div className="flex justify-between items-center gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-850 flex items-center justify-center border border-slate-200/50 dark:border-slate-800">
                            {v.thumbnailUrl ? (
                              <img src={v.thumbnailUrl} alt={language === "vi" ? v.nameVi : v.nameEn} className="w-full h-full object-cover" />
                            ) : (
                              <Car size={24} className="text-slate-400 dark:text-slate-650" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-slate-800 dark:text-white truncate">{language === "vi" ? v.nameVi : v.nameEn}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">{v.capacity} · {v.luggage}</p>
                          </div>
                        </div>
                        <span className="text-base font-black text-accent shrink-0">{formatPrice(price)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Booking Button */}
          <Button
            onClick={handleBooking}
            isDisabled={!selectedVehicle || !dateValue}
            className="w-full h-12 rounded-2xl font-black text-sm bg-accent text-white hover:bg-accent-hover shadow-md gap-2 border-none cursor-pointer"
          >
            {t.airportTransfer.bookNow}
          </Button>
        </div>

        {/* Right Column: Summary & Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-black rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4 sticky top-24">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.airportTransfer.summary}</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">{t.rentCar.tripType}</span><span className="font-bold">{tripType === "one-way" ? t.airportTransfer.oneWay : t.airportTransfer.roundTrip}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">{t.airportTransfer.airport}</span><span className="font-bold">{airportNameShort}</span></div>
              {dateValue && <div className="flex justify-between"><span className="text-slate-400">{t.airportTransfer.date}</span><span className="font-bold">{dateValue.toString()}</span></div>}
              {selectedVehicle && <div className="flex justify-between"><span className="text-slate-400">{t.airportTransfer.vehicle}</span><span className="font-bold">{language === "vi" ? selectedVehicle.nameVi : selectedVehicle.nameEn}</span></div>}
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-slate-500">{t.common.total}</span>
                <span className="text-xl font-black text-accent">{formatPrice(unitPrice)}</span>
              </div>
            </div>
          </div>

          {nhaTrangAddress && (
            <RoutingMap
              nhaTrangAddress={nhaTrangAddress}
              direction={tripType === "return"
                ? (outboundStartsFrom === "airport" ? "to-nhatrang" : "to-airport")
                : direction}
            />
          )}
        </div>
      </main>

      {/* BookingConfirmationModal */}
      <BookingConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmBooking}
        serviceType="AIRPORT_TRANSFER"
        summaryItems={[
          { label: t.rentCar.tripType, value: tripType === "one-way" ? t.airportTransfer.oneWay : t.airportTransfer.roundTrip },
          { label: t.airportTransfer.airport, value: airportDisplayName },
          { label: t.airportTransfer.vehicle, value: selectedVehicle ? (language === "vi" ? selectedVehicle.nameVi : selectedVehicle.nameEn) : "" },
          ...(dateValue ? [{ label: t.airportTransfer.dateTime, value: `${dateValue.toString()} ${timeValue.hour}:${String(timeValue.minute).padStart(2, "0")} ${timeValue.period}` }] : []),
          ...(tripType === "return" && returnDateValue ? [{ label: t.airportTransfer.returnDate, value: `${returnDateValue.toString()} ${returnTimeValue.hour}:${String(returnTimeValue.minute).padStart(2, "0")} ${returnTimeValue.period}` }] : []),
          ...(nhaTrangAddress ? [{ label: t.airportTransfer.address, value: nhaTrangAddress }] : []),
        ]}
        totalAmount={unitPrice}
        totalLabel={t.common.total}
        submitting={submitting}
      />

      {/* Checkout Form Modal */}
      {showCheckoutForm && !bookingSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" id="checkout-form-container">
          <div className="bg-white dark:bg-black rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-800 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.airportTransfer.contactInfo}</h3>
              <button onClick={() => setShowCheckoutForm(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">✕</button>
            </div>
            <div className="flex justify-end">
              <AutofillButton
                onFill={(d) => { setFullName(d.fullname); setPhone(d.phone); setEmail(d.email); }}
                label={t.common.autoFill}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField isRequired><Label className="text-[10px] font-bold uppercase tracking-wider">{t.airportTransfer.fullName}</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></TextField>
              <TextField isRequired><Label className="text-[10px] font-bold uppercase tracking-wider">{t.airportTransfer.phone}</Label><Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></TextField>
              <TextField><Label className="text-[10px] font-bold uppercase tracking-wider">Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></TextField>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider">{t.airportTransfer.contactChannel}</Label>
                <select value={contactChannel} onChange={(e) => setContactChannel(e.target.value as any)} className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black text-xs font-bold">
                  <option value="zalo">Zalo</option>
                  <option value="kakaotalk">KakaoTalk</option>
                </select>
              </div>
              <TextField><Label className="text-[10px] font-bold uppercase tracking-wider">{t.airportTransfer.contactId}</Label><Input value={contactId} onChange={(e) => setContactId(e.target.value)} /></TextField>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider">{t.rentCar.notes}</Label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.airportTransfer.notesPlaceholder} className="w-full h-16 p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-black text-xs font-semibold outline-none resize-none" />
            </div>
            <Button
              onClick={handleFormSubmit}
              isDisabled={!fullName || !phone || submitting}
              className="w-full h-12 rounded-2xl font-black text-sm bg-accent text-white hover:bg-accent-hover shadow-md gap-2 border-none cursor-pointer"
            >
              {t.airportTransfer.confirmBooking}
            </Button>
          </div>
        </div>
      )}

      {/* Success Screen */}
      {bookingSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-black rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800 w-full max-w-md mx-4 text-center space-y-4">
            <CheckCircle size={48} className="text-green-500 mx-auto" />
            <h3 className="text-lg font-black text-slate-800 dark:text-white">{t.airportTransfer.successTitle}</h3>
            <p className="text-xs text-slate-500">{t.airportTransfer.bookingCode} <span className="font-bold text-accent">{createdCode}</span></p>
            <Button onClick={() => setBookingSuccess(false)} className="bg-accent text-white rounded-2xl text-xs font-black border-none cursor-pointer">
              {t.common.close}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
