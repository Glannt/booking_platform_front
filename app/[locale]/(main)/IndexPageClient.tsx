"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { DateValue } from "@internationalized/date";
import { getLocalTimeZone, today } from "@internationalized/date";
import {
  Calendar as CalendarIcon,
  ShieldCheck,
  UserCheck,
  Car,
  Headset,
  ChevronUp,
  Minus,
  Plus,
  Phone,
  MessageCircle,
  Plane,
  Compass,
  MapPin,
  RefreshCw
} from "lucide-react";
import { Button, Separator, Select, Label, ListBox, SearchField, DatePicker, DateField, Calendar, FieldError, Autocomplete, EmptyState, useFilter } from "@heroui/react";
import { useI18n } from "@/context/LanguageContext";
import { getPublicServices, ServiceDto } from "@/lib/api/services";
import { getVehicleCategories, VehicleCategoryDto, getActiveAirports, getActiveAirportRoutes, getAirportTransferPricesByRouteAndServiceType, type AirportDto } from "@/lib/api/fleet";
import { getTours, type TourDto } from "@/lib/api/tours";
import { searchLocations, type LocationSearchResult } from "@/lib/api/locations";
import { getActiveSections, type SectionDto } from "@/lib/api/sections";
import { SectionRenderer } from "@/components/sections/SectionRenderer";

export default function IndexPage({ feedbacks }: { feedbacks?: any[] }) {
  const { language, t } = useI18n();
  const vi = language === "vi";
  const { contains } = useFilter({ sensitivity: "base" });

  const router = useRouter();

  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [tripType, setTripType] = useState<"one-way" | "return">("one-way");
  const [passengers, setPassengers] = useState(1);
  const [luggage, setLuggage] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showContactMenu, setShowContactMenu] = useState(false);

  // Active booking service tab
  const [activeServiceTab, setActiveServiceTab] = useState<"airport" | "rental" | "tour">("airport");

  // Car Rental Form state
  const [rentalType, setRentalType] = useState<"self" | "driver">("self");
  const [rentalPickup, setRentalPickup] = useState("");
  const [rentalDate, setRentalDate] = useState<DateValue | null>(null);
  const [rentalDays, setRentalDays] = useState(1);
  const [rentalSeats, setRentalSeats] = useState<any>("4-seater");
  const [vehicleCategories, setVehicleCategories] = useState<VehicleCategoryDto[]>([]);

  // Tours Form state
  const [tourKeyword, setTourKeyword] = useState("");
  const [tourPickup, setTourPickup] = useState("");
  const [tourSearchQuery, setTourSearchQuery] = useState("");
  const [selectedTour, setSelectedTour] = useState<TourDto | null>(null);
  const [tourDate, setTourDate] = useState<DateValue | null>(null);
  const [tourGuests, setTourGuests] = useState(1);
  const [tourKeywordSuggestions, setTourKeywordSuggestions] = useState<TourDto[]>([]);
  const [showTourSug, setShowTourSug] = useState(false);
  const tourSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Airport Transfer — direction + address autocomplete
  const [airports, setAirports] = useState<AirportDto[]>([]);
  const [selectedAirport, setSelectedAirport] = useState<AirportDto | null>(null);
  const [direction, setDirection] = useState<"to-nhatrang" | "to-airport">("to-nhatrang");
  const [pickupAddr, setPickupAddr] = useState("");
  const [dropoffAddr, setDropoffAddr] = useState("");
  const [pickupSuggestions, setPickupSuggestions] = useState<LocationSearchResult[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<LocationSearchResult[]>([]);
  const [showPickupSug, setShowPickupSug] = useState(false);
  const [showDropoffSug, setShowDropoffSug] = useState(false);

  // Airport Transfer — vehicle loading
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [transferPrices, setTransferPrices] = useState<any[]>([]);
  const [airportVehicleCategories, setAirportVehicleCategories] = useState<VehicleCategoryDto[]>([]);
  const [vehiclesLoaded, setVehiclesLoaded] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // Sections from backend
  const [heroSections, setHeroSections] = useState<SectionDto[]>([]);
  const [featureSections, setFeatureSections] = useState<SectionDto[]>([]);
  const [ctaSections, setCtaSections] = useState<SectionDto[]>([]);
  const [otherSections, setOtherSections] = useState<SectionDto[]>([]);

  // Load vehicle categories and tours
  useEffect(() => {
    getVehicleCategories()
      .then(res => {
        if (res && res.data && res.data.content) {
          const list = res.data.content;
          setVehicleCategories(list);
          const defaultCat = list.find(c => c.default);
          if (defaultCat) {
            setRentalSeats(defaultCat.code);
          }
        }
      })
      .catch(err => console.error("Error fetching vehicle categories:", err));

    getTours({ size: 10 })
      .then(res => {
        if (res?.data?.content) {
          setTourKeywordSuggestions(res.data.content);
        }
      })
      .catch(err => console.error("Error fetching initial tours:", err));
  }, []);

  // Load airports for direction selector
  useEffect(() => {
    getActiveAirports()
      .then(res => {
        if (res?.data) {
          setAirports(res.data);
          const cxr = res.data.find(a => a.code === "CXR");
          setSelectedAirport(cxr || res.data[0] || null);
        }
      })
      .catch(err => console.error("Error loading airports:", err));

    // Load sections from backend
    getActiveSections("/", language).then(sections => {
      setHeroSections(sections.filter(s => s.sectionType === "HERO_BANNER"));
      setFeatureSections(sections.filter(s => s.sectionType === "FEATURES"));
      setCtaSections(sections.filter(s => s.sectionType === "CTA" || s.sectionType === "PROMO" || s.sectionType === "BANNER"));
      setOtherSections(sections.filter(s => s.sectionType === "SLIDE_CARD" || s.sectionType === "SLIDE_REVIEW" || s.sectionType === "INSPIRATION"));
    }).catch(() => { });
  }, [language]);

  // Load routes when airport changes
  useEffect(() => {
    if (!selectedAirport?.id) return;
    getActiveAirportRoutes(selectedAirport.id)
      .then(res => {
        if (res?.data && res.data.length > 0) {
          setSelectedRoute(res.data[0]);
        }
      })
      .catch(() => {});
  }, [selectedAirport?.id]);

  // Load transfer prices when route + tripType changes
  useEffect(() => {
    if (!selectedRoute?.id) return;
    const serviceType = tripType === "return" ? "ROUND_TRIP" : "ONE_WAY";
    getAirportTransferPricesByRouteAndServiceType(selectedRoute.id, serviceType)
      .then(res => {
        if (res?.data) setTransferPrices(res.data);
      })
      .catch(() => {});
  }, [selectedRoute?.id, tripType]);

  // Auto-load vehicle categories when all fields are filled
  const isAirportFormComplete = Boolean(
    date && time && passengers > 0 &&
    ((direction === "to-nhatrang" && dropoffAddr.length > 0) ||
     (direction === "to-airport" && pickupAddr.length > 0))
  );

  useEffect(() => {
    if (!isAirportFormComplete || vehiclesLoaded || vehiclesLoading) return;
    setVehiclesLoading(true);
    getVehicleCategories({ active: true })
      .then(res => {
        if (res?.data?.content) {
          setAirportVehicleCategories(res.data.content);
          setVehiclesLoaded(true);
        }
      })
      .catch(() => {})
      .finally(() => setVehiclesLoading(false));
  }, [isAirportFormComplete, vehiclesLoaded, vehiclesLoading]);

  const getAirportName = (airport: AirportDto) => {
    const tr = airport.translations?.find(t => t.locale === language) || airport.translations?.[0];
    return tr?.name || airport.name || airport.code;
  };

  const airportNameShort = selectedAirport ? getAirportName(selectedAirport) : t.homePage.airportName;

  const fmtPrice = (amount: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);

  const airportVehicles = airportVehicleCategories.map(cat => {
    const tr = cat.translations?.find(t => t.locale === language) || cat.translations?.[0];
    const catName = tr?.name || cat.code;
    const maxSeat = cat.maxSeat || 4;
    const luggage = cat.maxLuggage || 2;
    const priceEntry = transferPrices.find(p => p.vehicleCategoryId === cat.id);
    const apiPrice = priceEntry ? Number(priceEntry.amount) : 0;
    const price = tripType === "one-way" ? apiPrice : Math.round(apiPrice / 1.85);
    return { id: cat.code, catId: cat.id, name: catName, seats: maxSeat, luggage, price };
  });

  const handleAddressSearch = async (
    query: string,
    setSuggestions: (s: LocationSearchResult[]) => void
  ) => {
    if (query.length < 2) { setSuggestions([]); return; }
    try {
      const res = await searchLocations(query, language, 5);
      setSuggestions(res?.data || []);
    } catch { setSuggestions([]); }
  };

  const handleTourKeywordSearch = async (query: string) => {
    if (tourSearchTimerRef.current) clearTimeout(tourSearchTimerRef.current);
    const timer = setTimeout(async () => {
      try {
        const res = await getTours({ search: query || undefined, size: 6 });
        setTourKeywordSuggestions(res?.data?.content || []);
      } catch { setTourKeywordSuggestions([]); }
    }, 400);
    tourSearchTimerRef.current = timer;
  };

  const getTourName = (tour: TourDto) => {
    const tr = tour.translations?.find(t => t.locale === language) || tour.translations?.[0];
    return tr?.name || "Tour";
  };

  useEffect(() => {
    handleTourKeywordSearch(tourSearchQuery);
  }, [tourSearchQuery]);

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

  const activeLang = language;

  const heroTitle = heroSections.length > 0
    ? heroSections[0].translations?.find(tr => tr.locale === language)?.title || t.homePage.heroTitle
    : t.homePage.heroTitle;
  const heroSubtitle = heroSections.length > 0
    ? heroSections[0].translations?.find(tr => tr.locale === language)?.description || t.homePage.heroSubtitle
    : t.homePage.heroSubtitle;
  const heroBgImage = heroSections.length > 0 && heroSections[0].imageUrls?.[0]
    ? heroSections[0].imageUrls[0]
    : '';

  const faqTitle = t.homePage.faqTitle;

  const handleAirportSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const pickupVal = direction === "to-nhatrang" ? airportNameShort : pickupAddr;
    const destVal = direction === "to-airport" ? airportNameShort : dropoffAddr;
    router.push(`/${language}/airport-transfer/search?pickup=${encodeURIComponent(pickupVal)}&destination=${encodeURIComponent(destVal)}&date=${date}&time=${time}&tripType=${tripType}&passengers=${passengers}&luggage=${luggage}&direction=${direction === "to-nhatrang" ? "FROM_AIRPORT" : "TO_AIRPORT"}`);
  };

  const handleRentalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const dateStr = rentalDate ? rentalDate.toString() : "";
    if (rentalType === "self") {
      router.push(`/${language}/self-drive?date=${dateStr}&days=${rentalDays}&pickup=${encodeURIComponent(rentalPickup)}&seats=${rentalSeats}`);
    } else {
      router.push(`/${language}/rent-car?date=${dateStr}&pickup=${encodeURIComponent(rentalPickup)}&seats=${rentalSeats}`);
    }
  };

  const handleTourSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTour) return;
    const dateStr = tourDate ? tourDate.toString() : "";
    router.push(`/${language}/tours/${selectedTour.id}/confirm?tourId=${selectedTour.id}&date=${dateStr}&guests=${tourGuests}&pickup=${encodeURIComponent(tourPickup)}`);
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* Hero Section */}
      <section className="relative w-full min-h-[680px] lg:h-[740px] flex items-center justify-center pt-20 pb-12">
        {/* Background Image with overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${heroBgImage}')`
          }}
        >
          <div className="absolute inset-0 bg-black/55 dark:bg-black/65 backdrop-blur-[2px]" />
        </div>

        {/* Hero Content Grid */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center h-full">
          {/* Left: Branding & Message */}
          <div className="lg:col-span-7 text-left space-y-6 max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white tracking-tight leading-none drop-shadow-md">
              {heroTitle.split('. ').map((part: string, idx: number, arr: string[]) => (
                <span key={part} className="block">
                  {part}{idx < arr.length - 1 ? "." : ""}
                </span>
              ))}
            </h1>
            <p className="text-lg sm:text-xl text-slate-200 drop-shadow-sm font-semibold max-w-xl leading-relaxed">
              {heroSubtitle}
            </p>
          </div>

          {/* Right: Floating Search Form Card with Service Tabs */}
          <div className="lg:col-span-5 flex flex-col justify-center lg:justify-end items-center lg:items-end w-full gap-4">
            {/* Horizontal Service Tab Bar */}
            <div className="flex pb-1 gap-2.5 border-b border-white/20 w-full max-w-md">
              <button
                type="button"
                onClick={() => setActiveServiceTab("airport")}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-full transition-all shrink-0 cursor-pointer border-none ${activeServiceTab === "airport"
                  ? "bg-white text-blue-900 shadow-md font-extrabold"
                  : "bg-transparent text-white hover:bg-white/10"
                  }`}
              >
                <Plane size={13} />
                <span>{t.homePage.airportTransfer}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveServiceTab("rental")}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-full transition-all shrink-0 cursor-pointer border-none ${activeServiceTab === "rental"
                  ? "bg-white text-blue-900 shadow-md font-extrabold"
                  : "bg-transparent text-white hover:bg-white/10"
                  }`}
              >
                <Car size={13} />
                <span>{t.homePage.carRental}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveServiceTab("tour")}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-full transition-all shrink-0 cursor-pointer border-none ${activeServiceTab === "tour"
                  ? "bg-white text-blue-900 shadow-md font-extrabold"
                  : "bg-transparent text-white hover:bg-white/10"
                  }`}
              >
                <Compass size={13} />
                <span>{t.homePage.tours}</span>
              </button>
            </div>

            {/* Form Card */}
            <div className="w-full max-w-md bg-white dark:bg-black rounded-3xl p-5 shadow-2xl border border-slate-100 dark:border-slate-800/80 flex flex-col gap-4">

              {/* Tab 1: Airport Transfer */}
              {activeServiceTab === "airport" && (
                <>
                  <h2 className="w-full bg-white dark:bg-black text-black dark:text-white flex justify-center items-center font-extrabold text-base">
                    {t.homePage.airportTransfer}
                  </h2>
                  <Separator className="bg-slate-200 dark:bg-slate-800" />

                  {/* Trip Type Selector */}
                  <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full flex gap-1">
                    <button
                      type="button"
                      onClick={() => setTripType("one-way")}
                      className={`flex-1 py-2 text-xs font-extrabold rounded-full transition-all cursor-pointer border-none ${tripType === "one-way"
                        ? "bg-white dark:bg-slate-700 text-accent dark:text-white shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                    >
                      {t.homePage.oneWay}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTripType("return")}
                      className={`flex-1 py-2 text-xs font-extrabold rounded-full transition-all cursor-pointer border-none ${tripType === "return"
                        ? "bg-white dark:bg-slate-700 text-accent dark:text-white shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                    >
                      {t.homePage.returnTrip}
                    </button>
                  </div>

                  <form onSubmit={handleAirportSearch} className="flex flex-col gap-4">
                    {/* Direction Selector — compact */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg gap-0.5">
                      <button
                        type="button"
                        onClick={() => { setDirection("to-nhatrang"); setDropoffAddr(""); }}
                        className={`flex-1 py-1.5 px-1.5 rounded-md text-[10px] font-black transition-all cursor-pointer border-none ${direction === "to-nhatrang"
                          ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          }`}
                      >
                        {t.homePage.toNhaTrang}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setDirection("to-airport"); setPickupAddr(""); }}
                        className={`flex-1 py-1.5 px-1.5 rounded-md text-[10px] font-black transition-all cursor-pointer border-none ${direction === "to-airport"
                          ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          }`}
                      >
                        {t.homePage.toAirport}
                      </button>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-200 dark:divide-slate-800 bg-slate-50/50 dark:bg-black/20 relative">
                      <div className="absolute left-7 top-[34px] h-[48px] w-px border-l border-dashed border-slate-300 dark:border-slate-600 hidden sm:block z-0 pointer-events-none" />

                      {/* Pickup */}
                      <div className="flex items-center gap-3 px-4 py-3 relative z-10">
                        <div className="w-6 h-6 rounded-full border-2 border-accent flex items-center justify-center bg-white dark:bg-black shrink-0">
                          <div className="w-2 h-2 rounded-full bg-accent" />
                        </div>
                        <div className="w-full text-left relative">
                          <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {t.homePage.pickupLocation}
                          </label>
                          {direction === "to-nhatrang" ? (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Plane size={12} className="text-blue-500 shrink-0" />
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{airportNameShort}</span>
                            </div>
                          ) : (
                            <>
                              <input
                                type="text"
                                value={pickupAddr}
                                onChange={(e) => {
                                  setPickupAddr(e.target.value);
                                  setShowPickupSug(true);
                                  handleAddressSearch(e.target.value, setPickupSuggestions);
                                }}
                                onFocus={() => setShowPickupSug(true)}
                                placeholder={t.homePage.pickupPlaceholder}
                                className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 mt-0.5"
                                required
                              />
                              {showPickupSug && pickupSuggestions.length > 0 && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setShowPickupSug(false)} />
                                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                    {pickupSuggestions.map((item, idx) => (
                                      <div
                                        key={idx}
                                        onClick={() => { setPickupAddr(item.address || item.name); setShowPickupSug(false); }}
                                        className="p-2.5 hover:bg-blue-50/50 dark:hover:bg-slate-850 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2"
                                      >
                                        <MapPin size={12} className="text-blue-500 shrink-0" />
                                        <div className="min-w-0">
                                          <span className="block truncate font-semibold">{item.name}</span>
                                          <span className="block truncate text-[10px] text-slate-400">{item.address}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Destination */}
                      <div className="flex items-center gap-3 px-4 py-3 relative z-10">
                        <div className="w-6 h-6 rounded-full border-2 border-emerald-500 flex items-center justify-center bg-white dark:bg-black shrink-0">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                        <div className="w-full text-left relative">
                          <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {t.homePage.destination}
                          </label>
                          {direction === "to-airport" ? (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Plane size={12} className="text-blue-500 shrink-0" />
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{airportNameShort}</span>
                            </div>
                          ) : (
                            <>
                              <input
                                type="text"
                                value={dropoffAddr}
                                onChange={(e) => {
                                  setDropoffAddr(e.target.value);
                                  setShowDropoffSug(true);
                                  handleAddressSearch(e.target.value, setDropoffSuggestions);
                                }}
                                onFocus={() => setShowDropoffSug(true)}
                                placeholder={t.homePage.destPlaceholder}
                                className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 mt-0.5"
                                required
                              />
                              {showDropoffSug && dropoffSuggestions.length > 0 && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setShowDropoffSug(false)} />
                                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                    {dropoffSuggestions.map((item, idx) => (
                                      <div
                                        key={idx}
                                        onClick={() => { setDropoffAddr(item.address || item.name); setShowDropoffSug(false); }}
                                        className="p-2.5 hover:bg-blue-50/50 dark:hover:bg-slate-850 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2"
                                      >
                                        <MapPin size={12} className="text-emerald-500 shrink-0" />
                                        <div className="min-w-0">
                                          <span className="block truncate font-semibold">{item.name}</span>
                                          <span className="block truncate text-[10px] text-slate-400">{item.address}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="flex items-center gap-3 px-4 py-3">
                        <CalendarIcon className="text-amber-500 shrink-0" size={20} />
                        <div className="w-full text-left grid grid-cols-12 gap-2">
                          <div className="col-span-7">
                            <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                              {t.homePage.dateLabel}
                            </label>
                            <input
                              type="date"
                              value={date}
                              onChange={(e) => setDate(e.target.value)}
                              className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none mt-0.5 [color-scheme:light] dark:[color-scheme:dark]"
                              required
                            />
                          </div>
                          <div className="col-span-5 border-l border-slate-200 dark:border-slate-800 pl-2 flex flex-col justify-center">
                            <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                              {t.homePage.time}
                            </label>
                            <input
                              type="time"
                              value={time}
                              onChange={(e) => setTime(e.target.value)}
                              className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none mt-0.5 [color-scheme:light] dark:[color-scheme:dark]"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Passengers counter */}
                      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col gap-1 text-left bg-slate-50/50 dark:bg-black/20">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          {t.homePage.passengers}
                        </span>
                        <div className="flex items-center justify-between mt-1">
                          <button
                            type="button"
                            onClick={() => setPassengers(Math.max(1, passengers - 1))}
                            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold transition-all cursor-pointer"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            {passengers}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPassengers(passengers + 1)}
                            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold transition-all cursor-pointer"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Luggage counter */}
                      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col gap-1 text-left bg-slate-50/50 dark:bg-black/20">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          {t.homePage.luggage}
                        </span>
                        <div className="flex items-center justify-between mt-1">
                          <button
                            type="button"
                            onClick={() => setLuggage(Math.max(0, luggage - 1))}
                            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold transition-all cursor-pointer"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            {luggage}
                          </span>
                          <button
                            type="button"
                            onClick={() => setLuggage(luggage + 1)}
                            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold transition-all cursor-pointer"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Categories — auto-loaded when form is complete */}
                    {isAirportFormComplete && (
                      <div className="space-y-2">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Chọn dòng xe
                        </span>
                        {vehiclesLoading && !vehiclesLoaded && (
                          <div className="flex items-center justify-center py-4">
                            <RefreshCw className="animate-spin text-accent" size={20} />
                            <span className="ml-2 text-xs font-bold text-slate-500">Đang tải xe...</span>
                          </div>
                        )}
                        {vehiclesLoaded && airportVehicles.length > 0 && (
                          <div className="grid grid-cols-1 gap-2">
                            {airportVehicles.map(v => {
                              const isSelected = selectedVehicleId === v.id;
                              return (
                                <div
                                  key={v.id}
                                  onClick={() => setSelectedVehicleId(v.id)}
                                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center ${isSelected ? "border-accent bg-accent/5" : "border-slate-200 dark:border-slate-800 hover:border-slate-300"}`}
                                >
                                  <div>
                                    <span className="text-xs font-black text-slate-800 dark:text-white">{v.name}</span>
                                    <p className="text-[10px] text-slate-400">{v.seats} khách · {v.luggage} hành lý</p>
                                  </div>
                                  <span className="text-sm font-black text-accent">{v.price > 0 ? fmtPrice(v.price) : "—"}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      type="submit"
                      isDisabled={!selectedVehicleId}
                      className="w-full h-12 rounded-2xl font-black text-sm bg-accent text-white hover:bg-accent-hover shadow-md gap-2 border-none cursor-pointer mt-1"
                    >
                      {t.homePage.searchBtn}
                    </Button>
                  </form>
                </>
              )}

              {/* Tab 2: Car Rental */}
              {activeServiceTab === "rental" && (
                <>
                  <h2 className="w-full bg-white dark:bg-black text-black dark:text-white flex justify-center items-center font-extrabold text-base">
                    {t.homePage.rentalSection}
                  </h2>
                  <Separator className="bg-slate-200 dark:bg-slate-800" />

                  {/* Rental Type Selector */}
                  <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full flex gap-1">
                    <button
                      type="button"
                      onClick={() => setRentalType("self")}
                      className={`flex-1 py-2 text-xs font-extrabold rounded-full transition-all cursor-pointer border-none ${rentalType === "self"
                        ? "bg-white dark:bg-slate-700 text-accent dark:text-white shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                    >
                      {t.homePage.selfDrive}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRentalType("driver")}
                      className={`flex-1 py-2 text-xs font-extrabold rounded-full transition-all cursor-pointer border-none ${rentalType === "driver"
                        ? "bg-white dark:bg-slate-700 text-accent dark:text-white shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                    >
                      {t.homePage.withDriver}
                    </button>
                  </div>

                  <form onSubmit={handleRentalSearch} className="flex flex-col gap-4">
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800 bg-slate-50/50 dark:bg-black/20 relative">

                      {/* Pickup location / Destination */}
                      <div className="flex items-center gap-3 px-4 py-3 relative z-10">
                        <MapPin className="text-accent shrink-0" size={20} />
                        <div className="w-full text-left">
                          <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {t.homePage.pickupLocation}
                          </label>
                          <input
                            type="text"
                            value={rentalPickup}
                            onChange={(e) => setRentalPickup(e.target.value)}
                            placeholder={t.homePage.rentalPickupPlaceholder}
                            className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 mt-0.5"
                            required
                          />
                        </div>
                      </div>

                      {/* Date & Days */}
                      <div className="flex items-center gap-3 px-4 py-3">
                        <CalendarIcon className="text-amber-500 shrink-0" size={20} />
                        <div className="w-full text-left grid grid-cols-12 gap-2">
                          <div className="col-span-7">
                            <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                              {t.homePage.startDate}
                            </label>
                            <DatePicker
                              value={rentalDate}
                              onChange={setRentalDate}
                              minValue={today(getLocalTimeZone())}
                              className="w-full border-none shadow-none"
                              aria-label="Departure Date"
                            >
                              <DateField.Group variant="secondary" className="bg-transparent border-none flex items-center justify-between p-0 h-auto w-full">
                                <DateField.Input className="text-xs font-semibold bg-transparent border-none outline-none p-0 focus:ring-0 text-slate-800 dark:text-slate-100 w-full flex-grow">
                                  {(segment) => <DateField.Segment segment={segment} />}
                                </DateField.Input>
                                <DateField.Suffix className="ml-auto">
                                  <DatePicker.Trigger className="cursor-pointer bg-transparent border-none p-0 min-w-0 h-auto">
                                    <DatePicker.TriggerIndicator className="text-slate-400 dark:text-slate-500" />
                                  </DatePicker.Trigger>
                                </DateField.Suffix>
                              </DateField.Group>
                              <DatePicker.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-50">
                                <Calendar aria-label="Departure date">
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
                                </Calendar>
                              </DatePicker.Popover>
                            </DatePicker>
                          </div>
                          <div className="col-span-5 border-l border-slate-200 dark:border-slate-800 pl-2 flex flex-col justify-center">
                            <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                              {t.homePage.rentalDays}
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={rentalDays}
                              onChange={(e) => setRentalDays(parseInt(e.target.value) || 1)}
                              className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none mt-0.5"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Seats selector */}
                    <div className="flex flex-col gap-1 text-left w-full">
                      <Label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-1 mb-1">
                        {t.homePage.requiredVehicle}
                      </Label>
                      <Select
                        className="w-full"
                        fullWidth
                        placeholder={t.homePage.selectVehicleClass}
                        selectedKey={rentalSeats}
                        onSelectionChange={(key) => {
                          if (key) setRentalSeats(key as any);
                        }}
                      >
                        <Select.Trigger className="h-11 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 flex justify-between items-center text-xs font-semibold text-slate-800 dark:text-slate-100 w-full outline-none">
                          <Select.Value className="text-xs font-semibold text-slate-800 dark:text-slate-100" />
                          <Select.Indicator className="text-slate-400" />
                        </Select.Trigger>
                        <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-xl w-[var(--trigger-width)] z-50">
                          <ListBox>
                            {vehicleCategories.length > 0 ? (
                              vehicleCategories.map((c) => {
                                const trans = c.translations?.find(t => t.locale === language)
                                  || c.translations?.[0];
                                return (
                                  <ListBox.Item
                                    id={c.code}
                                    key={c.code}
                                    textValue={trans?.name || c.code}
                                    className="text-xs font-semibold px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-800 dark:text-slate-200 flex items-center justify-between"
                                  >
                                    <span>{trans?.name || c.code}</span>
                                    <ListBox.ItemIndicator />
                                  </ListBox.Item>
                                );
                              })
                            ) : (
                              // Fallback to static options if categories API fails or is empty
                              <>
                                <ListBox.Item id="4-seater" textValue={t.homePage.vehicle4SeatsName} className="text-xs font-semibold px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-800 dark:text-slate-200 flex items-center justify-between">
                                  <span>{t.homePage.vehicle4Seats}</span>
                                  <ListBox.ItemIndicator />
                                </ListBox.Item>
                                <ListBox.Item id="7-seater" textValue={t.homePage.vehicle7SeatsName} className="text-xs font-semibold px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-800 dark:text-slate-200 flex items-center justify-between">
                                  <span>{t.homePage.vehicle7Seats}</span>
                                  <ListBox.ItemIndicator />
                                </ListBox.Item>
                                <ListBox.Item id="16-seater" textValue={t.homePage.vehicle16SeatsName} className="text-xs font-semibold px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-800 dark:text-slate-200 flex items-center justify-between">
                                  <span>{t.homePage.vehicle16Seats}</span>
                                  <ListBox.ItemIndicator />
                                </ListBox.Item>
                              </>
                            )}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 rounded-2xl font-black text-sm bg-accent text-white hover:bg-accent-hover shadow-md gap-2 border-none cursor-pointer mt-1"
                    >
                      {t.homePage.searchVehicles}
                    </Button>
                  </form>
                </>
              )}

              {/* Tab 3: Tours */}
              {activeServiceTab === "tour" && (
                <>
                  <h2 className="w-full bg-white dark:bg-black text-black dark:text-white flex justify-center items-center font-extrabold text-base">
                    {t.homePage.tourSection}
                  </h2>
                  <Separator className="bg-slate-200 dark:bg-slate-800" />

                  <form onSubmit={handleTourSearch} className="flex flex-col gap-4">
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800 bg-slate-50/50 dark:bg-black/20 relative">

                      {/* Tour pickup input */}
                      <div className="flex items-center gap-3 px-4 py-3 relative z-10">
                        <MapPin className="text-accent shrink-0" size={20} />
                        <div className="w-full text-left">
                          <Label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
                            {t.homePage.pickupLocation}
                          </Label>
                          <input
                            type="text"
                            value={tourPickup}
                            onChange={(e) => setTourPickup(e.target.value)}
                            placeholder={t.homePage.rentalPickupPlaceholder}
                            className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 mt-0.5"
                            required
                          />
                        </div>
                      </div>

                      {/* Tour search autocomplete input */}
                      <div className="flex items-center gap-3 px-4 py-3 relative z-10">
                        <Compass className="text-accent shrink-0" size={20} />
                        <div className="w-full text-left relative">
                          <Autocomplete
                            className="w-full border-none shadow-none"
                            placeholder={t.homePage.tourPlaceholder}
                            selectionMode="single"
                            value={selectedTour?.id ? String(selectedTour.id) : ""}
                            onChange={(key) => {
                              const tour = tourKeywordSuggestions.find(t => String(t.id) === String(key));
                              if (tour) {
                                setSelectedTour(tour);
                                setTourKeyword(getTourName(tour));
                              } else {
                                setSelectedTour(null);
                                setTourKeyword("");
                              }
                            }}
                          >
                            <Label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
                              {t.homePage.searchTours}
                            </Label>
                            <Autocomplete.Trigger>
                              <div className="flex items-center w-full justify-between mt-0.5 cursor-pointer bg-transparent border-none p-0 h-auto">
                                <Autocomplete.Value className="text-xs font-semibold text-slate-800 dark:text-slate-100 bg-transparent truncate" />
                                <div className="flex items-center gap-1.5 ml-auto">
                                  <Autocomplete.ClearButton className="text-slate-400 dark:text-slate-500 hover:text-slate-600" />
                                  <Autocomplete.Indicator className="text-slate-400 dark:text-slate-500" />
                                </div>
                              </div>
                            </Autocomplete.Trigger>
                            <Autocomplete.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-50">
                              <Autocomplete.Filter filter={contains}>
                                <SearchField autoFocus name="search" variant="secondary" value={tourSearchQuery} onChange={setTourSearchQuery}>
                                  <SearchField.Group className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl px-3 h-10 bg-slate-50 dark:bg-black w-full mb-3">
                                    <SearchField.SearchIcon className="text-slate-400 dark:text-slate-500 mr-2 shrink-0" />
                                    <SearchField.Input placeholder={t.homePage.tourPlaceholder} className="text-xs font-semibold bg-transparent border-none outline-none focus:ring-0 text-slate-800 dark:text-slate-100 w-full" />
                                    <SearchField.ClearButton className="text-slate-400 dark:text-slate-500 hover:text-slate-600 ml-auto" />
                                  </SearchField.Group>
                                </SearchField>
                                <ListBox
                                  className="max-h-[200px] overflow-y-auto"
                                  renderEmptyState={() => <EmptyState className="p-4 text-center text-xs text-slate-400">{t.common.noResults}</EmptyState>}
                                >
                                  {tourKeywordSuggestions.map((item) => (
                                    <ListBox.Item
                                      key={String(item.id)}
                                      id={String(item.id)}
                                      textValue={getTourName(item)}
                                      className="p-2.5 hover:bg-amber-50/50 dark:hover:bg-slate-800 cursor-pointer rounded-lg transition-colors flex items-center gap-2"
                                    >
                                      <div className="flex items-center gap-2 w-full">
                                        <Compass size={12} className="text-accent shrink-0" />
                                        <div className="min-w-0 flex-grow text-left">
                                          <span className="block truncate font-semibold text-xs text-slate-700 dark:text-slate-350">{getTourName(item)}</span>
                                          <span className="block truncate text-[10px] text-slate-400">{item.durationDays}D{item.durationNights}N</span>
                                        </div>
                                        <ListBox.ItemIndicator className="ml-auto" />
                                      </div>
                                    </ListBox.Item>
                                  ))}
                                </ListBox>
                              </Autocomplete.Filter>
                            </Autocomplete.Popover>
                          </Autocomplete>
                        </div>
                      </div>

                      {/* Date picker */}
                      <div className="flex items-center gap-3 px-4 py-3">
                        <CalendarIcon className="text-amber-500 shrink-0" size={20} />
                        <div className="w-full text-left">
                          <Label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
                            {t.homePage.tourDate}
                          </Label>
                          <DatePicker
                            value={tourDate}
                            onChange={setTourDate}
                            minValue={today(getLocalTimeZone())}
                            className="w-full border-none shadow-none"
                            aria-label="Date Picker"
                          >
                            <DateField.Group variant="secondary" className="bg-transparent border-none flex items-center justify-between p-0 h-auto w-full">
                              <DateField.Input className="text-xs font-semibold bg-transparent border-none outline-none p-0 focus:ring-0 text-slate-800 dark:text-slate-100 w-full flex-grow">
                                {(segment) => <DateField.Segment segment={segment} />}
                              </DateField.Input>
                              <DateField.Suffix className="ml-auto">
                                <DatePicker.Trigger className="cursor-pointer bg-transparent border-none p-0 min-w-0 h-auto">
                                  <DatePicker.TriggerIndicator className="text-slate-400 dark:text-slate-500" />
                                </DatePicker.Trigger>
                              </DateField.Suffix>
                            </DateField.Group>
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
                      </div>
                    </div>

                    {/* Guests counter */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col gap-1 text-left bg-slate-50/50 dark:bg-black/20">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {t.homePage.numberOfGuests}
                      </span>
                      <div className="flex items-center justify-between mt-1">
                        <button
                          type="button"
                          onClick={() => setTourGuests(Math.max(1, tourGuests - 1))}
                          className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold transition-all cursor-pointer"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {tourGuests}
                        </span>
                        <button
                          type="button"
                          onClick={() => setTourGuests(tourGuests + 1)}
                          className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold transition-all cursor-pointer"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      isDisabled={!selectedTour}
                      className="w-full h-12 rounded-2xl font-black text-sm bg-accent text-white hover:bg-accent-hover shadow-md gap-2 border-none cursor-pointer mt-1"
                    >
                      {t.homePage.bookNow}
                    </Button>
                  </form>
                </>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* Features Row */}
      <section className="w-full py-16 bg-slate-50/50 dark:bg-black/20 border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature 1 */}
          <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white dark:hover:bg-slate-900/50 transition-all duration-300">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{t.homePage.feature1Title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">{t.homePage.feature1Desc}</p>
            </div>
          </div>
          {/* Feature 2 */}
          <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white dark:hover:bg-slate-900/50 transition-all duration-300">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
              <UserCheck size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{t.homePage.feature2Title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">{t.homePage.feature2Desc}</p>
            </div>
          </div>
          {/* Feature 3 */}
          <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white dark:hover:bg-slate-900/50 transition-all duration-300">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0">
              <Car size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{t.homePage.feature3Title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">{t.homePage.feature3Desc}</p>
            </div>
          </div>
          {/* Feature 4 */}
          <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white dark:hover:bg-slate-900/50 transition-all duration-300">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-2xl shrink-0">
              <Headset size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{t.homePage.feature4Title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">{t.homePage.feature4Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Sections from Backend (CTA, Promo, Banner) */}
      {ctaSections.length > 0 && (
        <div className="max-w-7xl mx-auto px-6">
          <SectionRenderer sections={ctaSections} locale={language} />
        </div>
      )}

      {/* Dynamic Sections: SLIDE_CARD, SLIDE_REVIEW, INSPIRATION */}
      {otherSections.length > 0 && (
        <SectionRenderer sections={otherSections} locale={language} />
      )}

      {/* CTA Section */}
      <section className="w-full bg-accent py-16 text-white text-center">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">{t.homePage.ctaTitle}</h2>
          <p className="text-slate-100 text-sm md:text-base max-w-2xl mx-auto font-medium">
            {t.homePage.ctaSubtitle}
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-white hover:bg-slate-100 text-accent font-black px-8 h-12 md:h-14 rounded-full shadow-lg text-sm border-none cursor-pointer"
          >
            {t.homePage.ctaBtn}
          </Button>
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
          className={`p-4 rounded-full border shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer flex items-center justify-center ${showContactMenu
            ? "bg-accent border-accent text-white"
            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-accent dark:text-white"
            }`}
          aria-label="Contact Support"
        >
          <Headset size={22} />
        </button>

        {/* Back to Top Button in bottom-right corner below Contact Support */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="p-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-accent dark:text-white shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer animate-bounce-subtle flex items-center justify-center"
            aria-label="Back to Top"
          >
            <ChevronUp size={22} />
          </button>
        )}
      </div>
    </div>
  );
}
