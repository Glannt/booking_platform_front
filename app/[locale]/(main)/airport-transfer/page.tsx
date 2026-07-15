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
import { getActiveSections, type SectionDto } from "@/lib/api/sections";

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
}

export default function AirportTransferPage() {
  const { language, t } = useI18n();
  const vi = language === "vi";

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
  const [heroSection, setHeroSection] = useState<SectionDto | null>(null);

  // Confirm modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

  useEffect(() => {
    getActiveSections("/airport-transfer", language).then(sections => {
      const hero = sections.find(s => s.sectionType === "HERO_BANNER");
      if (hero) setHeroSection(hero);
    }).catch(() => { });
  }, [language]);

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

  // Helper: get airport display name by locale
  const getAirportName = (airport: AirportDto) => {
    const tr = airport.translations?.find(t => t.locale === language) || airport.translations?.[0];
    return tr?.name || airport.name || airport.code;
  };

  // Computed airport display name with code
  const airportDisplayName = selectedAirport
    ? `${getAirportName(selectedAirport)} (${selectedAirport.code})`
    : (vi ? "Sân bay Cam Ranh (CXR)" : "Cam Ranh Airport (CXR)");
  const airportNameShort = selectedAirport
    ? getAirportName(selectedAirport)
    : (vi ? "Sân bay Cam Ranh" : "Cam Ranh Airport");

  // Build vehicle list from API data
  const getVehiclesList = (): VehicleOption[] => {
    if (vehicleCategories.length === 0) return [];
    return vehicleCategories.map(cat => {
      const tr = cat.translations?.find(t => t.locale === language) || cat.translations?.[0];
      const catName = tr?.name || cat.code;
      const catDesc = tr?.description || "";
      const minSeat = cat.minSeat || cat.maxSeat || 4;
      const maxSeat = cat.maxSeat || 4;
      const capacityText = vi ? `${maxSeat} khách` : `${maxSeat} passengers`;
      const luggageText = vi ? `${cat.maxLuggage || 2} vali` : `${cat.maxLuggage || 2} bags`;
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
        featuresVi: vi ? ["Xe sạch sẽ", "Điều hòa"] : ["Clean vehicle", "Air Conditioning"],
        featuresEn: ["Clean vehicle", "Air Conditioning"],
        priceOneWay: tripType === "one-way" ? apiPrice : Math.round(apiPrice / 1.85),
        priceReturn: apiPrice,
        categoryId: cat.id,
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
    let outboundDirection = "FROM_AIRPORT"; // default: airport → city
    let returnDirection = "TO_AIRPORT";    // default: city → airport

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

    // Legacy pickup/dropoff for generic booking fields
    const pickupLoc = tripType === "return"
      ? `${outboundPickup} ➔ ${outboundDropoff}`
      : outboundPickup;
    const dropoffLoc = tripType === "return"
      ? `${returnPickup} ➔ ${returnDropoff}`
      : outboundDropoff;

    // Build dates
    const timeText = `${String(timeValue.hour).padStart(2, "0")}:${String(timeValue.minute).padStart(2, "0")} ${timeValue.period}`;
    const dateText = dateValue ? dateValue.toString() : "";
    const startDateFormatted = dateText ? `${dateText}T${String(timeValue.hour).padStart(2, "0")}:${String(timeValue.minute).padStart(2, "0")}:00` : undefined;

    let endDateFormatted: string | undefined = undefined;
    if (tripType === "return" && returnDateValue) {
      endDateFormatted = `${returnDateValue.toString()}T${String(returnTimeValue.hour).padStart(2, "0")}:${String(returnTimeValue.minute).padStart(2, "0")}:00`;
    }

    // Structured airport details for backend
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

      // Trigger redirect to Zalo matching search page behavior
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

      window.open(`https://zalo.me/0764971971?text=${encodeURIComponent(message)}`, "_blank");
    } catch (err) {
      console.error("Booking API error:", err);
      // Fallback redirect directly to Zalo anyway so booking requests are never lost!
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
      window.open(`https://zalo.me/0764971971?text=${encodeURIComponent(message)}`, "_blank");
      setBookingSuccess(true);
    } finally {
      setSubmitting(false);
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
        {/* Background Image with overlay */}
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
              {/* Trip Type (One way / Return) */}
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

              {/* Direction selector - ONLY shown if One-Way */}
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

            {/* Airport Selector - Only show autocomplete if multiple airports */}
            {airports.length > 1 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white pl-1">
                  {vi ? "Sân bay" : "Airport"}
                </label>
                <Autocomplete
                  className="w-full"
                  placeholder={vi ? "Chọn sân bay..." : "Select airport..."}
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
                          <HeroSearchField.Input placeholder={vi ? "Tìm sân bay..." : "Search airports..."} />
                          <HeroSearchField.ClearButton />
                        </HeroSearchField.Group>
                      </HeroSearchField>
                      <ListBox className="max-h-[200px] overflow-y-auto" renderEmptyState={() => <EmptyState>{vi ? "Không tìm thấy" : "No results"}</EmptyState>}>
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
                {/* Address Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {direction === "to-nhatrang" ? (
                    <>
                      {/* Pickup: Airport */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3">
                        <MapPin className="text-blue-600 dark:text-blue-400 mt-1 shrink-0" size={18} />
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                            {t.airportTransfer.pickup}
                          </p>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">
                            {airportNameShort}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
                            {t.airportTransfer.driverMeetDesc}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3 w-full">
                        <MapPin className="text-green-600 dark:text-green-400 mt-1 shrink-0" size={18} />
                        <div className="w-full flex-1">
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                            {t.airportTransfer.dropoff}
                          </p>
                          <div className="relative w-full">
                            <div className="mt-1.5 flex items-center border border-slate-200 dark:border-slate-800 rounded-xl px-3 h-10 bg-white dark:bg-black focus-within:border-blue-500/50 transition-colors w-full">
                              <input
                                type="text"
                                placeholder={t.airportTransfer.addressPlaceholder}
                                value={nhaTrangAddress}
                                onChange={(e) => {
                                  handleNhaTrangAddressChange(e.target.value);
                                  setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                              />
                            </div>
                            {showSuggestions && suggestions.length > 0 && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />
                                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                  {suggestions.map((item, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() => {
                                        handleNhaTrangAddressChange(item.address || item.name);
                                        setShowSuggestions(false);
                                      }}
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
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-snug">
                            {t.airportTransfer.accommodationTypes}
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
                            {t.airportTransfer.pickupLocationNT}
                          </p>
                          <div className="relative w-full">
                            <div className="mt-1.5 flex items-center border border-slate-200 dark:border-slate-800 rounded-xl px-3 h-10 bg-white dark:bg-black focus-within:border-blue-500/50 transition-colors w-full">
                              <input
                                type="text"
                                placeholder={t.airportTransfer.addressPlaceholder}
                                value={nhaTrangAddress}
                                onChange={(e) => {
                                  handleNhaTrangAddressChange(e.target.value);
                                  setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                              />
                            </div>
                            {showSuggestions && suggestions.length > 0 && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />
                                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                  {suggestions.map((item, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() => {
                                        handleNhaTrangAddressChange(item.address || item.name);
                                        setShowSuggestions(false);
                                      }}
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
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-snug">
                            {t.airportTransfer.accommodationTypes}
                          </p>
                        </div>
                      </div>

                      {/* Dropoff: Airport */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3">
                        <MapPin className="text-blue-600 dark:text-blue-400 mt-1 shrink-0" size={18} />
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                            {t.airportTransfer.dropoffLocation}
                          </p>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">
                            {airportNameShort}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
                            {t.airportTransfer.driverDropoffDesc}
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
                        {t.airportTransfer.date}
                      </Label>
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

                  {/* Time Selection */}
                  <TimePicker
                    value={timeValue}
                    onChange={setTimeValue}
                    label={t.airportTransfer.time}
                    labelClassName="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1"
                    popoverTitle={t.airportTransfer.selectPickupTime}
                    language={language}
                  />

                  {/* Flight Code */}
                  <div className="flex flex-col w-full">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">
                      {t.airportTransfer.flightNumber}
                    </label>
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
                      {t.airportTransfer.outboundLeg}
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
                              {`${t.airportTransfer.outbound} ${t.airportTransfer.pickup}`}
                            </p>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">
                              {airportNameShort}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
                              {t.airportTransfer.driverMeetDesc}
                            </p>
                          </div>
                        </div>

                        {/* Dropoff: Nha Trang Address */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3 w-full">
                          <MapPin className="text-green-600 dark:text-green-400 mt-1 shrink-0" size={18} />
                          <div className="w-full flex-1">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                              {`${t.airportTransfer.outbound} ${t.airportTransfer.dropoff}`}
                            </p>
                            <div className="relative w-full">
                              <div className="mt-1.5 flex items-center border border-slate-200 dark:border-slate-800 rounded-xl px-3 h-10 bg-white dark:bg-black focus-within:border-blue-500/50 transition-colors w-full">
                                <input
                                  type="text"
                                  placeholder={t.airportTransfer.addressPlaceholder}
                                  value={nhaTrangAddress}
                                  onChange={(e) => {
                                    handleNhaTrangAddressChange(e.target.value);
                                    setShowSuggestions(true);
                                  }}
                                  onFocus={() => setShowSuggestions(true)}
                                  className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                                />
                              </div>
                              {showSuggestions && suggestions.length > 0 && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />
                                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                    {suggestions.map((item, idx) => (
                                      <div
                                        key={idx}
                                        onClick={() => {
                                          handleNhaTrangAddressChange(item.address || item.name);
                                          setShowSuggestions(false);
                                        }}
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
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-snug">
                              {t.airportTransfer.accommodationTypes}
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
                              {`${t.airportTransfer.outbound} ${t.airportTransfer.pickup}`}
                            </p>
                            <div className="relative w-full">
                              <div className="mt-1.5 flex items-center border border-slate-200 dark:border-slate-800 rounded-xl px-3 h-10 bg-white dark:bg-black focus-within:border-blue-500/50 transition-colors w-full">
                                <input
                                  type="text"
                                  placeholder={t.airportTransfer.addressPlaceholder}
                                  value={nhaTrangAddress}
                                  onChange={(e) => {
                                    handleNhaTrangAddressChange(e.target.value);
                                    setShowSuggestions(true);
                                  }}
                                  onFocus={() => setShowSuggestions(true)}
                                  className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                                />
                              </div>
                              {showSuggestions && suggestions.length > 0 && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />
                                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                    {suggestions.map((item, idx) => (
                                      <div
                                        key={idx}
                                        onClick={() => {
                                          handleNhaTrangAddressChange(item.address || item.name);
                                          setShowSuggestions(false);
                                        }}
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
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-snug">
                              {t.airportTransfer.accommodationTypes}
                            </p>
                          </div>
                        </div>

                        {/* Dropoff: Airport */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3">
                          <MapPin className="text-blue-600 dark:text-blue-400 mt-1 shrink-0" size={18} />
                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                              {`${t.airportTransfer.outbound} ${t.airportTransfer.dropoff}`}
                            </p>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">
                              {airportNameShort}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
                              {t.airportTransfer.driverDropoffDesc}
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
                          {t.airportTransfer.date}
                        </Label>
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

                    {/* Time Picker */}
                    <TimePicker
                      value={timeValue}
                      onChange={setTimeValue}
                      label={`${t.airportTransfer.outbound} ${t.airportTransfer.time}`}
                      labelClassName="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1"
                      popoverTitle={t.airportTransfer.selectPickupTime}
                      language={language}
                    />

                    {/* Flight Code */}
                    <div className="flex flex-col w-full">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">
                        {`${t.airportTransfer.outbound} ${t.airportTransfer.flightNumber}`}
                      </label>
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
                    </div>
                  </div>
                </div>

                {/* Return Trip Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 py-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      {t.airportTransfer.returnLeg}
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
                              {`${t.airportTransfer.returnTrip} ${t.airportTransfer.pickup}`}
                            </p>
                            <div className="relative w-full">
                              <div className="mt-1.5 flex items-center border border-slate-200 dark:border-slate-800 rounded-xl px-3 h-10 bg-white dark:bg-black focus-within:border-blue-500/50 transition-colors w-full">
                                <input
                                  type="text"
                                  placeholder={vi ? "Nhập địa chỉ đón nếu khác chiều đi..." : "Enter return address if different..."}
                                  value={nhaTrangReturnAddress}
                                  onChange={(e) => {
                                    handleNhaTrangReturnAddressChange(e.target.value);
                                    setShowReturnSuggestions(true);
                                  }}
                                  onFocus={() => setShowReturnSuggestions(true)}
                                  className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                                />
                              </div>
                              {showReturnSuggestions && returnSuggestions.length > 0 && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setShowReturnSuggestions(false)} />
                                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                    {returnSuggestions.map((item, idx) => (
                                      <div
                                        key={idx}
                                        onClick={() => {
                                          handleNhaTrangReturnAddressChange(item.address || item.name);
                                          setShowReturnSuggestions(false);
                                        }}
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
                              {`${t.airportTransfer.returnTrip} ${t.airportTransfer.dropoff}`}
                            </p>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">
                              {airportNameShort}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
                              {t.airportTransfer.driverDropoffDesc}
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
                              {`${t.airportTransfer.returnTrip} ${t.airportTransfer.pickup}`}
                            </p>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">
                              {airportNameShort}
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
                              {`${t.airportTransfer.returnTrip} ${t.airportTransfer.dropoff}`}
                            </p>
                            <div className="relative w-full">
                              <div className="mt-1.5 flex items-center border border-slate-200 dark:border-slate-800 rounded-xl px-3 h-10 bg-white dark:bg-black focus-within:border-blue-500/50 transition-colors w-full">
                                <input
                                  type="text"
                                  placeholder={vi ? "Nhập địa chỉ trả nếu khác chiều đi..." : "Enter return address if different..."}
                                  value={nhaTrangReturnAddress}
                                  onChange={(e) => {
                                    handleNhaTrangReturnAddressChange(e.target.value);
                                    setShowReturnSuggestions(true);
                                  }}
                                  onFocus={() => setShowReturnSuggestions(true)}
                                  className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                                />
                              </div>
                              {showReturnSuggestions && returnSuggestions.length > 0 && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setShowReturnSuggestions(false)} />
                                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                    {returnSuggestions.map((item, idx) => (
                                      <div
                                        key={idx}
                                        onClick={() => {
                                          handleNhaTrangReturnAddressChange(item.address || item.name);
                                          setShowReturnSuggestions(false);
                                        }}
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
                          {t.airportTransfer.returnDate}
                        </Label>
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

                    {/* Time Picker */}
                    <TimePicker
                      value={returnTimeValue}
                      onChange={setReturnTimeValue}
                      label={`${t.airportTransfer.returnTrip} ${t.airportTransfer.time}`}
                      labelClassName="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1"
                      popoverTitle={t.airportTransfer.selectPickupTime}
                      language={language}
                    />

                    {/* Flight Code */}
                    <div className="flex flex-col w-full">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">
                        {t.airportTransfer.returnFlightNumber}
                      </label>
                      <div className="flex items-center h-10 border border-slate-200 dark:border-slate-800 rounded-xl px-3 bg-white dark:bg-black hover:border-blue-500/50 transition-colors">
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
            <div className="flex flex-wrap gap-7 pt-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-slate-600 dark:text-slate-300">
                ⏱ {estimatedDuration ? (vi ? `Dự kiến: ~${estimatedDuration} phút` : `Est: ~${estimatedDuration} mins`) : (vi ? "Di chuyển ~45 phút" : "45 min duration")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-slate-600 dark:text-slate-300">
                {estimatedDistance ? (vi ? `Khoảng cách: ~${estimatedDistance} km` : `Distance: ~${estimatedDistance} km`) : (vi ? "Khoảng cách ~35 km" : "35 km distance")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-slate-600 dark:text-slate-300">
                {vi ? "Giá cố định trọn gói" : "Fixed & Transparent Price"}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-slate-600 dark:text-slate-300">
                {vi ? "Đón tận ga/Khách sạn" : "Meet & Greet Included"}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-slate-600 dark:text-slate-300">
                {vi ? "Miễn phí hủy/đổi lịch" : "Free Cancellation"}
              </span>
            </div>
          </div>

          {/* Interactive Routing Map */}
          <RoutingMap
            nhaTrangAddress={nhaTrangAddress}
            direction={tripType === "one-way" ? direction : (outboundStartsFrom === "airport" ? "to-nhatrang" : "to-airport")}
            onRouteCalculated={(duration, distance) => {
              setEstimatedDuration(duration);
              setEstimatedDistance(distance);
            }}
          />

          {/* Vehicle Selection List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="bg-accent w-2.5 h-5 rounded-full inline-block" />
                {t.airportTransfer.vehicle}
              </h3>
              {!vehiclesLoaded && (
                <Button
                  onClick={handleSearchVehicles}
                  isDisabled={vehiclesLoading}
                  className="bg-[#C9A227] hover:bg-[#B8911F] text-white rounded-xl text-xs font-black px-5 h-9 border-none shadow-sm flex items-center gap-2"
                >
                  {vehiclesLoading ? <Car className="animate-spin" size={16} /> : <Search size={16} />}
                  {t.airportTransfer.searchVehicles}
                </Button>
              )}
            </div>

            {vehiclesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex flex-col md:flex-row items-stretch bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                    <div className="w-full md:w-44 shrink-0">
                      <Skeleton className="h-[120px] md:h-full w-full rounded-none" />
                    </div>
                    <div className="flex-1 p-5 flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-40 rounded-lg" />
                          <Skeleton className="h-4 w-28 rounded-lg" />
                        </div>
                        <Skeleton className="h-3 w-full rounded-lg" />
                        <Skeleton className="h-3 w-3/5 rounded-lg" />
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex gap-3">
                          <Skeleton className="h-3 w-16 rounded-lg" />
                          <Skeleton className="h-3 w-20 rounded-lg" />
                        </div>
                        <Skeleton className="h-7 w-24 rounded-xl" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !vehiclesLoaded ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <Car className="text-slate-300 dark:text-slate-600" size={40} />
                <p className="text-xs font-bold text-slate-500">{vi ? "Nhấn \"Tìm kiếm xe\" để xem danh sách phương tiện" : "Click \"Search Vehicles\" to view available options"}</p>
              </div>
            ) : activeVehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Car className="text-slate-300" size={40} />
                <p className="text-xs font-bold text-slate-500">{t.common.noResults}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeVehicles.map((vehicle) => {
                  const vehiclePrice = tripType === "one-way" ? vehicle.priceOneWay : vehicle.priceReturn;
                  const isSelected = selectedVehicleId === vehicle.id;

                  return (
                    <div
                      key={vehicle.id}
                      onClick={() => setSelectedVehicleId(vehicle.id)}
                      className={`group relative flex flex-col md:flex-row items-stretch bg-white dark:bg-black border rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 ${isSelected
                        ? "border-accent border-3 shadow-md bg-blue-50/10 dark:bg-blue-950/15"
                        : "border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                        }`}
                    >
                      {/* Empty image placeholder container, as requested by user to be styled but blank */}
                      <div className="w-full md:w-44 bg-slate-100 dark:bg-black flex items-center justify-center relative min-h-[120px] md:min-h-0 shrink-0">
                        <div className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-600 p-4 text-center">
                          <User size={24} className="opacity-40" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {vi ? "Ảnh xe" : "Car Photo"}
                          </span>
                        </div>
                        {/* Badge for popular options */}
                        {(vehicle.id === "4-seater" || vehicle.id === "carnival") && (
                          <span className="absolute top-2.5 left-2.5 bg-accent text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider shadow-sm">
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
                            <span className="text-xs font-extrabold text-accent">
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
                            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${isSelected
                              ? "bg-accent text-white shadow-sm"
                              : "bg-slate-100 dark:bg-slate-800 hover:bg-accent/10 hover:text-accent text-slate-600 dark:text-slate-300"
                              }`}
                          >
                            {isSelected ? t.airportTransfer.selected : t.airportTransfer.choose}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Trip Summary */}
        <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
          <div className="bg-white dark:bg-black rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-5">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider pb-3 border-b border-slate-100 dark:border-slate-800">
              {t.airportTransfer.confirmTitle}
            </h3>

            {/* Summary Details */}
            <div className="space-y-3.5">
              {tripType === "one-way" ? (
                <>
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold shrink-0">
                      {`${t.airportTransfer.route}:`}
                    </span>
                    <span className="text-xs font-black text-right text-slate-800 dark:text-slate-200">
                      {direction === "to-nhatrang"
                        ? `${airportNameShort} ➔ ${nhaTrangAddress || (vi ? "Nha Trang" : "Nha Trang")}`
                        : `${nhaTrangAddress || (vi ? "Nha Trang" : "Nha Trang")} ➔ ${airportNameShort}`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                      {`${t.airportTransfer.tripType}:`}
                    </span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {t.airportTransfer.oneWay}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                      {`${t.airportTransfer.date}:`}
                    </span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {dateValue ? dateValue.toString() : (vi ? "Chưa chọn" : "Not Selected")}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                      {`${t.airportTransfer.time}:`}
                    </span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {`${String(timeValue.hour).padStart(2, "0")}:${String(timeValue.minute).padStart(2, "0")} ${timeValue.period}`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                      {`${t.airportTransfer.flightNumber}:`}
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
                      {`${t.airportTransfer.route}:`}
                    </span>
                    <span className="text-xs font-black text-right text-slate-800 dark:text-slate-200">
                      {outboundStartsFrom === "airport"
                        ? (vi ? `Khứ hồi (Sân bay ⇄ ${nhaTrangAddress || "Nha Trang"})` : `Round Trip (Airport ⇄ ${nhaTrangAddress || "Nha Trang"})`)
                        : (vi ? `Khứ hồi (${nhaTrangAddress || "Nha Trang"} ⇄ Sân bay)` : `Round Trip (${nhaTrangAddress || "Nha Trang"} ⇄ Airport)`)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                      {`${t.airportTransfer.tripType}:`}
                    </span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {t.airportTransfer.roundTrip}
                    </span>
                  </div>

                  {/* Outbound leg details */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-1.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {`▼ ${t.airportTransfer.outboundLeg}:`}
                    </div>
                    <div className="flex justify-between items-center pl-2">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                        {`${t.airportTransfer.date}:`}
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {dateValue ? dateValue.toString() : (vi ? "Chưa chọn" : "Not Selected")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pl-2">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                        {`${t.airportTransfer.time}:`}
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {`${String(timeValue.hour).padStart(2, "0")}:${String(timeValue.minute).padStart(2, "0")} ${timeValue.period}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pl-2">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                        {`${t.airportTransfer.outbound} ${t.airportTransfer.flightNumber}:`}
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {flightNumber || (vi ? "Không có" : "None")}
                      </span>
                    </div>
                  </div>

                  {/* Return leg details */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-1.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-green-600 dark:text-green-400">
                      {`▼ ${t.airportTransfer.returnLeg}:`}
                    </div>
                    <div className="flex justify-between items-center pl-2">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                        {`${t.airportTransfer.returnDate}:`}
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {returnDateValue ? returnDateValue.toString() : (vi ? "Chưa chọn" : "Not Selected")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pl-2">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                        {`${t.airportTransfer.returnTrip} ${t.airportTransfer.time}:`}
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {`${String(returnTimeValue.hour).padStart(2, "0")}:${String(returnTimeValue.minute).padStart(2, "0")} ${returnTimeValue.period}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pl-2">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                        {`${t.airportTransfer.returnFlightNumber}:`}
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
                  {selectedVehicle ? (vi ? selectedVehicle.nameVi : selectedVehicle.nameEn) : (vi ? "Chưa chọn" : "Not selected")}
                </span>
              </div>

              {/* Total Price with Skeleton */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <span className="text-xs text-slate-700 dark:text-slate-300 font-black">
                  {t.airportTransfer.total}:
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
            {!showCheckoutForm && !bookingSuccess && (
              <button
                type="button"
                onClick={handleBooking}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-xs font-black hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95 border-none"
              >
                <MessageCircle size={15} />
                <span>{t.airportTransfer.continueBooking}</span>
              </button>
            )}

            {/* Checkout Form */}
            {showCheckoutForm && !bookingSuccess && (
              <form id="checkout-form-container" onSubmit={handleFormSubmit} className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <TextField isRequired name="fullName" className="w-full">
                  <Label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    {t.airportTransfer.fullNameLabel}
                  </Label>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={vi ? "Nhập họ và tên..." : "Enter full name..."}
                    className="w-full p-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
                  />
                </TextField>

                <TextField isRequired name="phone" className="w-full">
                  <Label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    {t.airportTransfer.phoneLabel}
                  </Label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={vi ? "Nhập số điện thoại..." : "Enter phone number..."}
                    className="w-full p-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
                  />
                </TextField>

                <TextField name="email" className="w-full">
                  <Label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    {t.airportTransfer.emailLabel}
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={vi ? "Nhập email (không bắt buộc)..." : "Enter email (optional)..."}
                    className="w-full p-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
                  />
                </TextField>

                {/* Contact channel selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    {t.airportTransfer.socialContact}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setContactChannel("zalo")}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all ${contactChannel === "zalo"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-slate-50 dark:bg-black text-slate-600 dark:text-slate-450 border-slate-200 dark:border-slate-800"
                        }`}
                    >
                      Zalo
                    </button>
                    <button
                      type="button"
                      onClick={() => setContactChannel("kakaotalk")}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all ${contactChannel === "kakaotalk"
                        ? "bg-yellow-500 text-slate-900 border-yellow-500 shadow-sm"
                        : "bg-slate-50 dark:bg-black text-slate-600 dark:text-slate-450 border-slate-200 dark:border-slate-800"
                        }`}
                    >
                      KakaoTalk
                    </button>
                  </div>
                </div>

                <TextField isRequired name="contactId" className="w-full">
                  <Label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    {t.airportTransfer.contactId}
                  </Label>
                  <Input
                    type="text"
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value)}
                    placeholder={vi ? "Nhập ID Zalo hoặc KakaoTalk..." : "Enter Zalo or KakaoTalk ID..."}
                    className="w-full p-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
                  />
                </TextField>

                {/* Flight code check button */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    {t.airportTransfer.flightTracking}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={flightNumber}
                      onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                      placeholder={vi ? "VD: VN123, VJ301..." : "E.g., VN123, VJ301..."}
                      className="flex-1 p-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
                    />
                    <Button
                      type="button"
                      onClick={() => handleCheckFlight(true)}
                      isDisabled={checkingFlight || !flightNumber}
                      className="px-4 bg-accent text-white rounded-xl text-xs font-black border-none cursor-pointer h-10 shrink-0"
                    >
                      {checkingFlight ? t.airportTransfer.checking : t.airportTransfer.trackFlight}
                    </Button>
                  </div>
                  {flightData && (
                    <div className="p-3 bg-blue-50/50 dark:bg-black/60 border border-blue-100 dark:border-slate-800 rounded-xl text-[10px] text-left space-y-1 mt-1 font-semibold">
                      {flightData.error ? (
                        <span className="text-red-500 font-bold">{t.airportTransfer.flightNotFound}</span>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-350">
                          <div><strong>{t.airportTransfer.airline}:</strong> {flightData.airlineName}</div>
                          <div><strong>{t.airportTransfer.flightStatus}:</strong> <span className="text-emerald-600 dark:text-emerald-500 font-bold">{flightData.status}</span></div>
                          <div><strong>{t.airportTransfer.flightRoute}:</strong> {flightData.departureAirport} ➔ CXR</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    {t.airportTransfer.notesLabel}
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t.airportTransfer.notesPlaceholder}
                    className="w-full p-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  isDisabled={submitting}
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black text-xs hover:from-blue-700 hover:to-indigo-700 shadow-md border-none cursor-pointer"
                >
                  {submitting ? t.airportTransfer.submitting : t.airportTransfer.confirmBooking}
                </Button>
              </form>
            )}

            {/* Booking success screen */}
            {bookingSuccess && (
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {t.airportTransfer.successTitle}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {t.airportTransfer.bookingCode} <strong className="text-blue-500">{createdCode}</strong>
                  </p>
                </div>
                <Button
                  onClick={() => {
                    const activeAddress = nhaTrangAddress || "Trung tâm Nha Trang";
                    const activeReturnAddress = nhaTrangReturnAddress || activeAddress;
                    let pickupLoc = direction === "to-nhatrang" ? airportDisplayName : activeAddress;
                    let dropoffLoc = direction === "to-nhatrang" ? activeAddress : airportDisplayName;
                    const timeText = `${String(timeValue.hour).padStart(2, "0")}:${String(timeValue.minute).padStart(2, "0")} ${timeValue.period}`;
                    const dateText = dateValue ? dateValue.toString() : "";
                    const vehicleName = vi ? selectedVehicle?.nameVi : selectedVehicle?.nameEn;
                    const message = `[Minh Khoa Travel - Đơn Đặt Xe Sân Bay]\n` +
                      `- Mã đặt xe: ${createdCode}\n` +
                      `- Họ và tên: ${fullName}\n` +
                      `- Số điện thoại: ${phone}\n` +
                      `- Kênh liên hệ: ${contactChannel.toUpperCase()} (${contactId})\n` +
                      `- Dòng xe: ${vehicleName}\n` +
                      `- Lộ trình: ${pickupLoc} ➔ ${dropoffLoc}\n` +
                      `- Ngày giờ: ${dateText} lúc ${timeText}\n` +
                      `- Tổng tiền: ${formatPrice(unitPrice)}`;
                    window.open(`https://zalo.me/0764971971?text=${encodeURIComponent(message)}`, "_blank");
                  }}
                  className="w-full h-10 bg-green-600 text-white rounded-xl font-black text-xs hover:bg-green-700 border-none cursor-pointer"
                >
                  {t.airportTransfer.contactZalo}
                </Button>
                <Button
                  onClick={() => {
                    setBookingSuccess(false);
                    setShowCheckoutForm(false);
                    setFullName("");
                    setPhone("");
                    setEmail("");
                    setContactId("");
                    setNotes("");
                  }}
                  className="w-full py-1.5 bg-transparent text-slate-400 hover:text-slate-600 text-[11px] font-semibold border-none cursor-pointer"
                >
                  {t.airportTransfer.bookAnother}
                </Button>
              </div>
            )}

            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-medium">
              {vi ? "Cam kết giá trọn gói - Không phí ẩn" : "Guaranteed fixed price - No hidden fees"}
            </p>
          </div>
        </div>

      </main>

      {/* Accordion & Service Commitments Section */}
      <section className="bg-slate-100/60 dark:bg-black border-t border-slate-200/50 dark:border-slate-900 py-12 px-6">
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
                  {vi ? "Phụ thu khung giờ đêm" : "Night Service Surcharge"}
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
              <div className="bg-white dark:bg-black p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm space-y-3.5">
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
                <div className="p-3 bg-blue-50/30 dark:bg-black border border-blue-500/10 rounded-xl">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    {vi ? "Nhiều khách quen miệng gọi sân bay Nha Trang nhưng tên chính thức là Sân bay Cam Ranh (cách trung tâm Nha Trang ~35km). Quý khách vui lòng đặt xe trước 1 ngày để chúng tôi sắp xếp chu đáo nhất." : "Nha Trang Airport is formally Cam Ranh Airport (CXR), located about 35km from central Nha Trang. Please book at least 1 day in advance for the best arrangement."}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Box: FAQ Collapsible Accordions */}
            <div className="lg:col-span-6 space-y-3 bg-white dark:bg-black p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
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
        </div>
      </section>

      {/* Confirm Booking Modal */}
      <Modal isOpen={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <ModalBackdrop className="bg-black/50 backdrop-blur-sm">
          <ModalContainer>
            <ModalDialog className="bg-white dark:bg-black rounded-3xl p-0 max-w-lg w-full shadow-2xl">
              <ModalHeader className="px-6 pt-6 pb-0">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {t.airportTransfer.confirmTitle}
                </h3>
              </ModalHeader>
              <ModalBody className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                {selectedVehicle && (
                  <>
                    {/* Trip type badge */}
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-[#C9A227]/10 text-[#C9A227]">
                        {tripType === "return"
                          ? t.airportTransfer.roundTrip
                          : t.airportTransfer.oneWay}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">
                        {vi ? selectedVehicle.nameVi : selectedVehicle.nameEn}
                      </span>
                    </div>

                    {/* Outbound leg */}
                    <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-[#C9A227] uppercase tracking-wider">
                          {tripType === "return"
                            ? t.airportTransfer.outboundLeg
                            : t.airportTransfer.route}
                        </span>
                      </div>
                      <p className="text-xs font-black text-slate-800 dark:text-white leading-relaxed">
                        {(() => {
                          const addr = nhaTrangAddress || (vi ? "Trung tâm Nha Trang" : "Nha Trang Center");
                          if (tripType === "one-way") {
                            return direction === "to-nhatrang"
                              ? `${airportDisplayName} ➔ ${addr}`
                              : `${addr} ➔ ${airportDisplayName}`;
                          }
                          return outboundStartsFrom === "airport"
                            ? `${airportDisplayName} ➔ ${addr}`
                            : `${addr} ➔ ${airportDisplayName}`;
                        })()}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        <span>{dateValue?.toString() || ""} {`${String(timeValue.hour).padStart(2, "0")}:${String(timeValue.minute).padStart(2, "0")} ${timeValue.period}`}</span>
                        {flightNumber && (
                          <span className="text-[#C9A227]">
                            ✈ {flightNumber}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-bold">
                        <div>
                          <span className="text-slate-400">{t.airportTransfer.pickup} </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {(() => {
                              const addr = nhaTrangAddress || (vi ? "Trung tâm Nha Trang" : "Nha Trang Center");
                              if (tripType === "one-way") {
                                return direction === "to-nhatrang" ? airportDisplayName : addr;
                              }
                              return outboundStartsFrom === "airport" ? airportDisplayName : addr;
                            })()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">{t.airportTransfer.dropoff} </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {(() => {
                              const addr = nhaTrangAddress || (vi ? "Trung tâm Nha Trang" : "Nha Trang Center");
                              if (tripType === "one-way") {
                                return direction === "to-nhatrang" ? addr : airportDisplayName;
                              }
                              return outboundStartsFrom === "airport" ? addr : airportDisplayName;
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Return leg — only for round-trip */}
                    {tripType === "return" && (
                      <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            {t.airportTransfer.returnLeg}
                          </span>
                        </div>
                        <p className="text-xs font-black text-slate-800 dark:text-white leading-relaxed">
                          {(() => {
                            const addr = nhaTrangReturnAddress || nhaTrangAddress || (vi ? "Trung tâm Nha Trang" : "Nha Trang Center");
                            if (outboundStartsFrom === "airport") {
                              return `${addr} ➔ ${airportDisplayName}`;
                            }
                            return `${airportDisplayName} ➔ ${addr}`;
                          })()}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          <span>{returnDateValue?.toString() || ""} {`${String(returnTimeValue.hour).padStart(2, "0")}:${String(returnTimeValue.minute).padStart(2, "0")} ${returnTimeValue.period}`}</span>
                          {returnFlightNumber && (
                            <span className="text-blue-600 dark:text-blue-400">
                              ✈ {returnFlightNumber}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-bold">
                          <div>
                            <span className="text-slate-400">{t.airportTransfer.pickup} </span>
                            <span className="text-slate-700 dark:text-slate-300">
                              {(() => {
                                const addr = nhaTrangReturnAddress || nhaTrangAddress || (vi ? "Trung tâm Nha Trang" : "Nha Trang Center");
                                return outboundStartsFrom === "airport" ? addr : airportDisplayName;
                              })()}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">{t.airportTransfer.dropoff} </span>
                            <span className="text-slate-700 dark:text-slate-300">
                              {outboundStartsFrom === "airport" ? airportDisplayName : (nhaTrangReturnAddress || nhaTrangAddress || (vi ? "Trung tâm Nha Trang" : "Nha Trang Center"))}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Price breakdown */}
                    <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                      {tripType === "return" && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500">{t.airportTransfer.outbound}</span>
                            <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">{formatPrice(outboundPrice)}</span>
                          </div>
                          {returnPrice > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-500">{t.airportTransfer.roundTripSurcharge}</span>
                              <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">+{formatPrice(returnPrice)}</span>
                            </div>
                          )}
                        </>
                      )}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-black text-slate-700 dark:text-slate-300">{t.airportTransfer.total}</span>
                        <span className="text-base font-black text-[#C9A227]">{formatPrice(unitPrice)}</span>
                      </div>
                    </div>
                  </>
                )}
              </ModalBody>
              <ModalFooter className="px-6 pb-6 pt-0 flex gap-3">
                <Button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 h-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black border-none cursor-pointer"
                >
                  {t.common.goBack}
                </Button>
                <Button
                  onClick={handleConfirmBooking}
                  className="flex-1 h-10 bg-[#C9A227] hover:bg-[#B8911F] text-white rounded-xl text-xs font-black border-none cursor-pointer shadow-sm"
                >
                  {t.airportTransfer.bookNow}
                </Button>
              </ModalFooter>
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </Modal>

    </div>
  );
}
