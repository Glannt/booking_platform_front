"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  DatePicker,
  DateField,
  Calendar,
  Skeleton,
  Label,
  FieldError,
  Button,
  Autocomplete,
  EmptyState,
  ListBox,
  SearchField as HeroSearchField,
  NumberField
} from "@heroui/react";
import { trackFlight } from "@/lib/api/bookings";
import { searchLocations, LocationSearchResult } from "@/lib/api/locations";
import {
  getVehicleCategories,
  getVehicles,
  VehicleCategoryDto,
  VehicleDto,
  getActiveAirports,
  getActiveAirportRoutes,
  getAirportTransferPricesByRoute,
  AirportDto,
  AirportRouteDto,
  AirportTransferPrice,
} from "@/lib/api/fleet";
import { getPublicModuleSurchargeRules, SurchargeRuleDto } from "@/lib/api/surcharge";
import type { DateValue } from "@internationalized/date";
import { getLocalTimeZone, today, parseDate } from "@internationalized/date";
import {
  Plane,
  MapPin,
  Phone,
  Sparkles,
  CheckCircle,
  Car,
  Briefcase,
  Scale,
  Users,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

import dynamic from "next/dynamic";
const RoutingMap = dynamic(
  () => import("@/components/routing-map").then((mod) => mod.RoutingMap),
  { ssr: false }
);
import { TimePicker, type TimeValue } from "@/components/time-picker";
import { useI18n } from "@/context/LanguageContext";
import { formatPriceSync as _formatPrice } from "@/lib/format";
import { calcAirportPrice } from "@/lib/pricing";
import { calculateDeposit, DepositType, DEFAULT_MODULE_DEPOSIT_RATES } from "@/lib/pricing/deposit";
import { saveBookingDraft, loadBookingDraft, type BookingDraft } from "@/lib/airport-transfer-draft";
import type { SectionDto } from "@/lib/api/sections";
import { FormattedDescription } from "@/components/FormattedDescription";

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
  schemaText?: string;
  minSeat?: number;
  maxSeat?: number;
  minLuggage?: number;
  maxLuggage?: number;
  unitLuggage?: string;
  luggageWeight?: number;
}

interface AirportTransferClientProps {
  sections: SectionDto[];
  initialAirports?: AirportDto[];
}

export default function AirportTransferClient({ sections, initialAirports = [] }: AirportTransferClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useI18n();
  const vi = language === "vi";

  // Format currency (defined at top to avoid ReferenceError in getVehiclesList)
  const formatPrice = (p: number) => _formatPrice(p, language);

  // Helper: get airport display name by locale
  const getAirportName = (airport: AirportDto) => {
    const tr = airport.translations?.find(t => t.locale === language) || airport.translations?.[0];
    return tr?.name || airport.name || airport.code;
  };

  const renderAirportSelector = (label: string, desc?: string) => (
    <div className="p-4 bg-slate-50 dark:bg-[var(--bg-card)]/60 rounded-2xl border border-slate-100 dark:border-zinc-300 flex items-start gap-3 w-full">
      <Plane className="text-accent mt-1 shrink-0" size={18} />
      <div className="w-full flex-1">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
        <div className="relative w-full">
          <HeroSearchField
            isRequired
            name="airport-select"
            value={airportSearchText}
            onChange={(val) => {
              setAirportSearchText(val);
              setShowAirportSuggestions(true);
            }}
          >
            <HeroSearchField.Group className="mt-1.5 flex items-center border border-accent dark:border-accent rounded-xl px-3 h-10 focus-within:border-accent-hover transition-colors w-full shadow-xs shadow-accent-soft-foreground bg-white dark:bg-zinc-950">
              <HeroSearchField.Input
                placeholder={t.airportTransfer.selectAirport}
                className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                onFocus={() => setShowAirportSuggestions(true)}
              />
              <HeroSearchField.ClearButton
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 ml-auto"
                onPress={() => {
                  setAirportSearchText("");
                  setSelectedAirport(null);
                }}
              />
            </HeroSearchField.Group>
          </HeroSearchField>
          {showAirportSuggestions && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowAirportSuggestions(false)} />
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAirports.length > 0 ? (
                  filteredAirports.map((airport) => (
                    <div
                      key={airport.id}
                      onClick={() => {
                        setSelectedAirport(airport);
                        setAirportSearchText(`${getAirportName(airport)} (${airport.code})`);
                        setShowAirportSuggestions(false);
                      }}
                      className="p-3 hover:bg-blue-50/50 dark:hover:bg-[var(--bg-card)] cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      <div className="flex flex-col min-w-0">
                        <span>{getAirportName(airport)} ({airport.code})</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-xs text-slate-400 dark:text-slate-500">
                    {t.common.noResults}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        {desc && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-snug">{desc}</p>
        )}
      </div>
    </div>
  );

  const heroSection = sections.find(s => s.sectionType === "HERO_BANNER") || null;

  // Airport & Route data from API
  const defaultInitialAirport = useMemo(() => {
    if (!initialAirports || initialAirports.length === 0) return null;
    return initialAirports.find(a => a.isDefault) || initialAirports.find(a => a.code === "CXR") || initialAirports[0] || null;
  }, [initialAirports]);

  const [airports, setAirports] = useState<AirportDto[]>(initialAirports);
  const [selectedAirport, setSelectedAirport] = useState<AirportDto | null>(defaultInitialAirport);
  const [airportSearchText, setAirportSearchText] = useState(() => {
    if (defaultInitialAirport) {
      return `${getAirportName(defaultInitialAirport)} (${defaultInitialAirport.code})`;
    }
    return "";
  });
  const [showAirportSuggestions, setShowAirportSuggestions] = useState(false);

  useEffect(() => {
    if (selectedAirport) {
      setAirportSearchText(`${getAirportName(selectedAirport)} (${selectedAirport.code})`);
    } else {
      setAirportSearchText("");
    }
  }, [selectedAirport, language]);

  const filteredAirports = useMemo(() => {
    if (!airportSearchText) return airports;
    const query = airportSearchText.toLowerCase();
    return airports.filter(a => {
      const name = getAirportName(a).toLowerCase();
      const code = a.code.toLowerCase();
      return name.includes(query) || code.includes(query);
    });
  }, [airports, airportSearchText, language]);
  const [routes, setRoutes] = useState<AirportRouteDto[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<AirportRouteDto | null>(null);
  const [transferPrices, setTransferPrices] = useState<AirportTransferPrice[]>([]);
  const [airportsLoading, setAirportsLoading] = useState(initialAirports.length === 0);
  const [routesLoading, setRoutesLoading] = useState(false);

  // Route toggle
  const [direction, setDirection] = useState<"to-nhatrang" | "to-airport">("to-nhatrang");
  const [tripType, setTripType] = useState<"one-way" | "return">("one-way");
  const [outboundStartsFrom, setOutboundStartsFrom] = useState<"airport" | "nhatrang">("airport");

  const [nhaTrangAddress, setNhaTrangAddress] = useState("");
  const [nhaTrangReturnAddress, setNhaTrangReturnAddress] = useState("");
  const [isReturnAddressCustom, setIsReturnAddressCustom] = useState(false);
  const [searchPickLat, setSearchPickLat] = useState<number | null>(null);
  const [searchPickLng, setSearchPickLng] = useState<number | null>(null);

  const [dateValue, setDateValue] = useState<DateValue | null>(null);
  const [timeValue, setTimeValue] = useState<TimeValue>({ hour: 12, minute: 0, period: "PM" });
  const [flightNumber, setFlightNumber] = useState("");

  const [returnDateValue, setReturnDateValue] = useState<DateValue | null>(null);
  const [returnTimeValue, setReturnTimeValue] = useState<TimeValue>({ hour: 12, minute: 0, period: "PM" });
  const [returnFlightNumber, setReturnFlightNumber] = useState("");

  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [baggageCount, setBaggageCount] = useState<number>(0);
  const [luggageWeight, setLuggageWeight] = useState<number>(0);

  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null);

  const [allSurcharges, setAllSurcharges] = useState<SurchargeRuleDto[]>([]);
  const [showRouteBadges, setShowRouteBadges] = useState(true);
  const [isCustomAddress, setIsCustomAddress] = useState(true);

  // Vehicle data from API
  const [vehicleCategories, setVehicleCategories] = useState<VehicleCategoryDto[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [vehiclesLoaded, setVehiclesLoaded] = useState(false);

  // Checkout states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [zaloId, setZaloId] = useState("");
  const [kakaoTalkId, setKakaoTalkId] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [notes, setNotes] = useState("");
  const [checkingFlight, setCheckingFlight] = useState(false);
  const [flightData, setFlightData] = useState<any>(null);
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

  // Fetch active airports on mount if not already preloaded
  useEffect(() => {
    if (initialAirports.length > 0) return;
    getActiveAirports()
      .then(res => {
        if (res && res.data) {
          setAirports(res.data);
          // Default to the one marked as isDefault, fallback to CXR, then first one
          const defaultAirport = res.data.find(a => a.isDefault) || res.data.find(a => a.code === "CXR") || res.data[0];
          if (defaultAirport) {
            setSelectedAirport(defaultAirport);
          }
        }
      })
      .catch(err => console.error("Error loading airports:", err))
      .finally(() => setAirportsLoading(false));
  }, []);

  // Fetch all surcharges for AIRPORT_TRANSFER on mount
  useEffect(() => {
    getPublicModuleSurchargeRules("AIRPORT_TRANSFER")
      .then(res => {
        if (res && res.data) {
          setAllSurcharges(res.data);
        }
      })
      .catch(err => console.error("Error loading surcharges list:", err));
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

  // Fetch transfer prices when route changes
  useEffect(() => {
    if (!selectedRoute?.id) return;
    getAirportTransferPricesByRoute(selectedRoute.id)
      .then(res => {
        if (res && res.data) {
          setTransferPrices(res.data);
        }
      })
      .catch(err => console.error("Error loading transfer prices:", err));
  }, [selectedRoute?.id]);

  // Helper to evaluate if a rule matches the current context
  const evaluateRule = (
    rule: SurchargeRuleDto,
    context: { dateStr: string; timeStr: string; routeId?: number }
  ): boolean => {
    if (!rule.active) return false;
    if (rule.effectiveFrom && context.dateStr < rule.effectiveFrom) return false;
    if (rule.effectiveTo && context.dateStr > rule.effectiveTo) return false;

    const cond = rule.condition as any;
    if (!cond || !cond.type) return true;

    const evalCond = (c: any): boolean => {
      if (!c || !c.type) return true;
      switch (c.type) {
        case "time_range": {
          const { from, to } = c;
          if (!from || !to || !context.timeStr) return false;
          if (from <= to) {
            return context.timeStr >= from && context.timeStr <= to;
          } else {
            return context.timeStr >= from || context.timeStr <= to;
          }
        }
        case "date_range":
        case "seasonal": {
          const { from, to } = c;
          if (!from || !to || !context.dateStr) return false;
          if (from.length === 5 && to.length === 5) {
            const mmdd = context.dateStr.slice(5);
            if (from <= to) {
              return mmdd >= from && mmdd <= to;
            } else {
              return mmdd >= from || mmdd <= to;
            }
          }
          return context.dateStr >= from && context.dateStr <= to;
        }
        case "day_of_week": {
          const dateObj = new Date(context.dateStr);
          const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
          const dayName = dayNames[dateObj.getDay()];
          return (c.days || []).includes(dayName);
        }
        case "route": {
          if (!context.routeId) return false;
          return (c.ids || []).includes(context.routeId);
        }
        case "and": {
          return (c.conditions || []).every((sub: any) => evalCond(sub));
        }
        case "or": {
          return (c.conditions || []).some((sub: any) => evalCond(sub));
        }
        default:
          return true;
      }
    };

    return evalCond(cond);
  };

  const appliedSurcharges = useMemo(() => {
    if (!dateValue || allSurcharges.length === 0) return [];
    const dateStr = dateValue.toString();
    let hr = timeValue.hour;
    if (timeValue.period === "PM" && hr < 12) hr += 12;
    if (timeValue.period === "AM" && hr === 12) hr = 0;
    const timeStr = `${String(hr).padStart(2, "0")}:${String(timeValue.minute).padStart(2, "0")}`;

    return allSurcharges.filter((rule) =>
      evaluateRule(rule, {
        dateStr,
        timeStr,
        routeId: selectedRoute?.id,
      })
    );
  }, [allSurcharges, dateValue, timeValue, selectedRoute?.id]);

  const formatSurchargeRuleDescription = (rule: SurchargeRuleDto) => {
    const cond = rule.condition as any;
    const valText = rule.calculationType === "PERCENT" ? `${rule.value}%` : formatPrice(rule.value);
    if (cond?.type === "time_range" && cond.from && cond.to) {
      return `${rule.name} (khung giờ từ ${cond.from} đến ${cond.to}): +${valText}`;
    }
    if ((cond?.type === "date_range" || cond?.type === "seasonal") && cond.from && cond.to) {
      return `${rule.name} (giai đoạn từ ${cond.from} đến ${cond.to}): +${valText}`;
    }
    if (cond?.type === "day_of_week" && cond.days?.length) {
      return `${rule.name} (các ngày ${cond.days.join(", ")}): +${valText}`;
    }
    return `${rule.name}: +${valText}`;
  };

  const handleRouteBadgeClick = (route: AirportRouteDto) => {
    setSelectedRoute(route);
    const r = route as any;
    const translation = r.translations?.find((t: any) => t.locale === language) || r.translations?.[0];
    const defaultAddress = translation?.name
      || r.name
      || (r.originName && r.destinationName ? `${r.originName} ⇌ ${r.destinationName}` : null)
      || r.airportName
      || `${r.originCity || ""} → ${r.destinationCity || ""}`.replace(/ → $/, "").replace(/^ → /, "")
      || r.code;

    // We want to extract the Nha Trang (non-airport) address to set into the custom input field.
    // In the route, one side is the airport and the other is the city address.
    const isOriginAirport = r.originName?.toLowerCase().includes("sân bay")
      || r.originName?.toLowerCase().includes("airport")
      || r.code?.toLowerCase().startsWith("cxr");

    const savedAddress = isOriginAirport ? r.destinationName : r.originName;

    // Extract destination name if it contains ⇌ or other arrows (fallback)
    const cleanAddress = savedAddress || (() => {
      if (!defaultAddress) return "";
      const parts = defaultAddress.split(/[⇌➔→\->]/).map((p: string) => p.trim());
      if (parts.length > 1) {
        const nonAirport = parts.find((p: string) => !p.toLowerCase().includes("sân bay") && !p.toLowerCase().includes("airport"));
        return nonAirport || parts[1];
      }
      return defaultAddress;
    })();

    setNhaTrangAddress(cleanAddress);
    setSearchPickLat(null);
    setSearchPickLng(null);
    setIsCustomAddress(false);
  };

  const formatSurchargeTime = (timeStr?: string) => {
    if (!timeStr) return "";
    const parts = timeStr.split(":");
    return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : timeStr;
  };

  const isFormComplete = Boolean(
    dateValue && nhaTrangAddress.length > 0 &&
    (tripType === "one-way" || (tripType === "return" && returnDateValue))
  );

  // Pre-load vehicles on mount
  useEffect(() => {
    handleSearchVehicles();
  }, []);

  // Pre-fill form from searchParams when airports are loaded
  useEffect(() => {
    const dir = searchParams.get("direction");
    const pickup = searchParams.get("pickup");
    const destination = searchParams.get("destination");
    const dateStr = searchParams.get("date");
    const timeStr = searchParams.get("time");
    const trip = searchParams.get("tripType");

    if (!dir && !pickup && !dateStr) return;
    if (airports.length === 0 || airportsLoading) return;

    if (dir === "FROM_AIRPORT") {
      setDirection("to-nhatrang");
    } else if (dir === "TO_AIRPORT") {
      setDirection("to-airport");
    }

    const isFromAirport = dir === "FROM_AIRPORT";
    const airportName = isFromAirport ? pickup : destination;
    const nhaTrangAddr = isFromAirport ? destination : pickup;

    if (nhaTrangAddr) {
      setNhaTrangAddress(nhaTrangAddr);
    }

    if (airportName) {
      const match = airports.find(a => {
        const name = a.translations?.find(t => t.locale === language)?.name || a.name;
        return name?.toLowerCase().includes(airportName.toLowerCase()) || a.code.toLowerCase() === airportName.toLowerCase();
      });
      if (match) setSelectedAirport(match);
    }

    if (dateStr) {
      try { setDateValue(parseDate(dateStr)); } catch { }
    }

    if (timeStr) {
      const parts = timeStr.split(":");
      if (parts.length === 2) {
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (!isNaN(h) && !isNaN(m)) {
          setTimeValue({
            hour: h % 12 || 12,
            minute: m,
            period: h >= 12 ? "PM" : "AM",
          });
        }
      }
    }

    if (trip === "return") setTripType("return");

    const flight = searchParams.get("flightNumber");
    if (flight) setFlightNumber(flight);

    const pass = searchParams.get("passengers");
    if (pass) {
      const pNum = parseInt(pass, 10);
      if (!isNaN(pNum) && pNum > 0) setPassengerCount(pNum);
    }

    const returnDateStr = searchParams.get("returnDate");
    if (returnDateStr) {
      try { setReturnDateValue(parseDate(returnDateStr)); } catch { }
    }
  }, [searchParams, airports, airportsLoading, language]);

  // Restore booking form from checkout draft (back-navigation preservation)
  useEffect(() => {
    const draft = loadBookingDraft();
    if (!draft) return;
    const b = draft.booking;
    setSelectedAirport(b.selectedAirport);
    setSelectedRoute(b.selectedRoute);
    setDirection(b.direction);
    setTripType(b.tripType);
    setOutboundStartsFrom(b.outboundStartsFrom);
    setNhaTrangAddress(b.nhaTrangAddress);
    setNhaTrangReturnAddress(b.nhaTrangReturnAddress);
    setIsReturnAddressCustom(b.isReturnAddressCustom);
    setIsCustomAddress(b.isCustomAddress);
    setSearchPickLat(b.searchPickLat);
    setSearchPickLng(b.searchPickLng);
    setDateValue(b.dateValue ? parseDate(b.dateValue) : null);
    setTimeValue(b.timeValue);
    setFlightNumber(b.flightNumber);
    setReturnDateValue(b.returnDateValue ? parseDate(b.returnDateValue) : null);
    setReturnTimeValue(b.returnTimeValue);
    setReturnFlightNumber(b.returnFlightNumber);
    setSelectedVehicleId(b.selectedVehicleId);
    setEstimatedDistance(b.estimatedDistance);
    setEstimatedDuration(b.estimatedDuration);
    if (b.passengerCount !== undefined) setPassengerCount(b.passengerCount);
    if (b.baggageCount !== undefined) setBaggageCount(b.baggageCount);
    if (b.luggageWeight !== undefined) setLuggageWeight(b.luggageWeight);
    setFullName(draft.contact.fullName);
    setPhone(draft.contact.phone);
    setEmail(draft.contact.email);
    setZaloId(draft.contact.zaloId);
    setKakaoTalkId(draft.contact.kakaoTalkId);
    setWhatsapp(draft.contact.whatsapp);
    setNotes(draft.contact.notes);
  }, []);


  // Computed airport display name with code
  const airportDisplayName = selectedAirport
    ? `${getAirportName(selectedAirport)} (${selectedAirport.code})`
    : "";
  const airportNameShort = selectedAirport
    ? getAirportName(selectedAirport)
    : "";

  // Haversine distance in kilometers between two GPS coordinates
  const getGeoDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Check if destination is within fixed route zone (e.g. within 1.2km radius or 1.2km distance tolerance)
  const isWithinFixedRouteZone = useMemo(() => {
    // If user explicitly clicked the fixed route badge
    if (!isCustomAddress) return true;

    // If destination coordinates are known, check distance to selectedRoute destination or any route destination
    if (searchPickLat != null && searchPickLng != null) {
      if (selectedRoute?.destinationLat != null && selectedRoute?.destinationLng != null) {
        const dist = getGeoDistanceKm(searchPickLat, searchPickLng, selectedRoute.destinationLat, selectedRoute.destinationLng);
        if (dist <= 1.2) return true; // within 1.2km radius
      }

      for (const r of routes) {
        if (r.destinationLat != null && r.destinationLng != null) {
          const dist = getGeoDistanceKm(searchPickLat, searchPickLng, r.destinationLat, r.destinationLng);
          if (dist <= 1.2) return true;
        }
      }
    }

    // If estimated distance from map is within 1.2 km of route's base distance
    if (selectedRoute && estimatedDistance != null) {
      const baseKm = (selectedRoute as any).baseKm || selectedRoute.distanceKm;
      if (baseKm != null && Math.abs(estimatedDistance - baseKm) <= 1.2) {
        return true;
      }
    }

    // If address text matches route landmark (e.g., "Trần Phú") and distance is within reasonable base limit
    if (selectedRoute && nhaTrangAddress) {
      const addrLower = nhaTrangAddress.toLowerCase();
      const r = selectedRoute as any;
      const rName = (r.translations?.[0]?.name || "").toLowerCase();
      if (rName.includes("trần phú") && addrLower.includes("trần phú")) {
        const baseKm = (selectedRoute as any).baseKm || selectedRoute.distanceKm || 35;
        if (estimatedDistance == null || estimatedDistance <= baseKm + 1.5) {
          return true;
        }
      }
    }

    return false;
  }, [isCustomAddress, selectedRoute, routes, searchPickLat, searchPickLng, estimatedDistance, nhaTrangAddress]);

  // Build vehicle list from API data
  const getVehiclesList = (): VehicleOption[] => {
    if (vehicleCategories.length === 0) return [];
    return vehicleCategories.map(cat => {
      const tr = cat.translations?.find(t => t.locale === language) || cat.translations?.[0];
      const catName = tr?.name || cat.code;
      const catDesc = tr?.description || "";
      const minSeat = cat.minSeat || cat.maxSeat || 4;
      const maxSeat = cat.maxSeat || 4;
      const capacityText = `${minSeat}-${maxSeat} ${t.common.seats}`;
      const luggageText = cat.minLuggage > 0
        ? `${cat.minLuggage}-${cat.maxLuggage} ${cat.unitLuggage || "kiện"} (Tối đa ${(cat.maxLuggage || 2) * 20} kg)`
        : `${cat.maxLuggage || 2} ${t.common.baggage} (Tối đa ${(cat.maxLuggage || 2) * 20} kg)`;

      // Get prices from API transfer prices (km-based)
      const priceEntry = transferPrices.find(p => p.vehicleCategoryId === cat.id);
      // Fixed routes (badge or within 1km fixed route zone) use base price only — no per-km overcharge
      const pricingKm = isWithinFixedRouteZone ? undefined : (estimatedDistance ?? undefined);
      const { oneWay, roundTrip } = calcAirportPrice(priceEntry, pricingKm);

      let schemaText = "";

      if (priceEntry) {
        const baseAmtText = formatPrice(priceEntry.baseAmount);
        if (priceEntry.fixedOvercharge) {
          const fixedFeeText = formatPrice(priceEntry.feeOverchargeFixed ?? 100000);
          schemaText = t.airportTransfer.priceSchemaInfoFixed
            .replace("{baseAmount}", baseAmtText)
            .replace("{baseKm}", String(priceEntry.baseKm))
            .replace("{fixedFee}", fixedFeeText);
        } else {
          const perKmText = formatPrice(priceEntry.perKmAmount);
          schemaText = t.airportTransfer.priceSchemaInfoKm
            .replace("{baseAmount}", baseAmtText)
            .replace("{baseKm}", String(priceEntry.baseKm))
            .replace("{perKmAmount}", perKmText);
        }

        if (isWithinFixedRouteZone) {
          schemaText += ` · ${t.airportTransfer.fixedRoutePriceNote}`;
        }
      }

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
        priceOneWay: oneWay,
        priceReturn: roundTrip,
        categoryId: cat.id,
        thumbnailUrl: cat.thumbnailUrl,
        schemaText,
        minSeat,
        maxSeat,
        minLuggage: cat.minLuggage || 1,
        maxLuggage: cat.maxLuggage || 2,
        unitLuggage: cat.unitLuggage || "kiện",
        luggageWeight: undefined
      };
    });
  };

  const activeVehicles = getVehiclesList().sort((a, b) => {
    const pa = tripType === "one-way" ? a.priceOneWay : a.priceReturn;
    const pb = tripType === "one-way" ? b.priceOneWay : b.priceReturn;
    if (pa === 0 && pb === 0) return 0;
    if (pa === 0) return 1;
    if (pb === 0) return -1;
    return pa - pb;
  });

  const getVehicleSurcharge = (v: VehicleOption) => {
    const priceEntry = transferPrices.find(p => p.vehicleCategoryId === v.categoryId);
    const basePrice = priceEntry ? (tripType === "one-way" ? priceEntry.baseAmount : priceEntry.baseAmount * 2) : 0;
    let runningTotal = basePrice;
    let totalSurcharge = 0;
    for (const s of appliedSurcharges) {
      const base = s.calculationBase === "RUNNING_TOTAL" ? runningTotal : basePrice;
      let amt = 0;
      if (s.calculationType === "PERCENT") {
        amt = Math.round(base * (Number(s.value) / 100));
      } else {
        amt = Number(s.value);
      }
      runningTotal += amt;
      totalSurcharge += amt;
    }
    return totalSurcharge;
  };

  const getVehicleSurchargeNames = () => {
    if (appliedSurcharges.length === 0) return "";
    return appliedSurcharges.map(s => s.name).join(" + ");
  };

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

  // Manual typing: unknown address, clear picked coordinates, geocode via map
  const handleNhaTrangAddressChange = (val: string) => {
    setNhaTrangAddress(val);
    if (!isReturnAddressCustom) {
      setNhaTrangReturnAddress(val);
    }
    setSearchPickLat(null);
    setSearchPickLng(null);
    setIsCustomAddress(true);
  };

  // Suggestion pick: use the picked coordinates directly (bypass geocoding)
  const handleNhaTrangSuggestionPick = (item: LocationSearchResult) => {
    const addr = item.address || item.name;
    setNhaTrangAddress(addr);
    if (!isReturnAddressCustom) {
      setNhaTrangReturnAddress(addr);
    }
    setSearchPickLat(item.latitude);
    setSearchPickLng(item.longitude);
    setIsCustomAddress(true);
    setShowRouteBadges(false);
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
      const flight = await trackFlight(flightNum);
      setFlightData(flight);
    } catch (e) {
      setFlightData({ error: true });
    } finally {
      setCheckingFlight(false);
    }
  };

  const handleRouteCalculated = useCallback((durationMin: number, distanceKm: number) => {
    setEstimatedDuration(durationMin);
    setEstimatedDistance(distanceKm);
  }, []);

  const selectedVehicle = isFormComplete
    ? (activeVehicles.find((v) => v.id === selectedVehicleId) || activeVehicles[0] || null)
    : (selectedVehicleId ? (activeVehicles.find((v) => v.id === selectedVehicleId) || null) : null);
  const outboundPrice = selectedVehicle?.priceOneWay || 0;
  const unitPrice = selectedVehicle
    ? (tripType === "one-way" ? (selectedVehicle.priceOneWay || 0) : (selectedVehicle.priceReturn || 0))
    : 0;

  const surchargeAmount = useMemo(() => {
    if (!selectedVehicle) return 0;
    return getVehicleSurcharge(selectedVehicle);
  }, [appliedSurcharges, selectedVehicle, transferPrices, tripType]);

  const finalPrice = unitPrice + surchargeAmount;

  const selectedTransferPrice = useMemo(() => {
    if (!selectedVehicle) return null;
    return transferPrices.find((p) => p.vehicleCategoryId === selectedVehicle.categoryId) || null;
  }, [selectedVehicle, transferPrices]);

  const depositCalc = useMemo(() => {
    if (!isFormComplete || !selectedVehicle || finalPrice <= 0) return null;

    // Prioritize vehicle custom deposit, then route default deposit, then default 20%
    const depType = selectedTransferPrice?.depositType || selectedRoute?.depositType || DepositType.PERCENT;
    const depRate = selectedTransferPrice?.depositType
      ? selectedTransferPrice.depositRate
      : (selectedRoute?.depositRate ?? DEFAULT_MODULE_DEPOSIT_RATES.AIRPORT);
    const depAmount = selectedTransferPrice?.depositType
      ? selectedTransferPrice.depositAmount
      : selectedRoute?.depositAmount;

    return calculateDeposit({
      totalAmount: finalPrice,
      depositType: depType,
      depositRate: depRate ?? undefined,
      depositAmount: depAmount ?? undefined,
      defaultRate: DEFAULT_MODULE_DEPOSIT_RATES.AIRPORT,
    });
  }, [finalPrice, isFormComplete, selectedVehicle, selectedTransferPrice, selectedRoute]);

  const finalPriceDisplay = useMemo(() => {
    if (!isFormComplete || !selectedVehicle) return "—";
    return formatPrice(finalPrice);
  }, [finalPrice, isFormComplete, selectedVehicle, language]);

  const buildBookingDraft = (): BookingDraft | null => {
    if (!selectedVehicle) return null;

    const bookingKm = estimatedDistance ?? selectedRoute?.distanceKm ?? undefined;

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

    const dateText = dateValue ? dateValue.toString() : "";
    let outboundHr = timeValue.hour;
    if (timeValue.period === "PM" && outboundHr < 12) outboundHr += 12;
    if (timeValue.period === "AM" && outboundHr === 12) outboundHr = 0;
    const startDateFormatted = dateText ? `${dateText}T${String(outboundHr).padStart(2, "0")}:${String(timeValue.minute).padStart(2, "0")}:00` : "";

    let endDateFormatted: string | undefined = undefined;
    if (tripType === "return" && returnDateValue) {
      let returnHr = returnTimeValue.hour;
      if (returnTimeValue.period === "PM" && returnHr < 12) returnHr += 12;
      if (returnTimeValue.period === "AM" && returnHr === 12) returnHr = 0;
      endDateFormatted = `${returnDateValue.toString()}T${String(returnHr).padStart(2, "0")}:${String(returnTimeValue.minute).padStart(2, "0")}:00`;
    }

    const payload = {
      vehicleCategoryId: selectedVehicle.categoryId || 0,
      routeId: selectedRoute?.id || undefined,
      actualKm: bookingKm,
      tripType: tripType === "return" ? "ROUND_TRIP" : "ONE_WAY",
      outboundDirection,
      outboundDate: dateText || "",
      outboundPickupTime: startDateFormatted,
      outboundFlightNumber: flightNumber || undefined,
      outboundPickupAddress: outboundPickup,
      outboundDropoffAddress: outboundDropoff,
      returnDirection: tripType === "return" ? returnDirection : undefined,
      returnDate: tripType === "return" && returnDateValue ? returnDateValue.toString() : undefined,
      returnPickupTime: endDateFormatted || undefined,
      returnFlightNumber: tripType === "return" ? (returnFlightNumber || undefined) : undefined,
      returnPickupAddress: tripType === "return" ? returnPickup : undefined,
      returnDropoffAddress: tripType === "return" ? returnDropoff : undefined,
      basePrice: outboundPrice,
      totalPrice: finalPrice,
      passengerCount,
      luggageWeight,
      depositType: depositCalc?.depositType,
      depositRate: depositCalc?.depositRate,
      depositAmount: depositCalc?.depositAmount,
    };

    const summaryItems = [
      { label: t.rentCar.tripType, value: tripType === "one-way" ? t.airportTransfer.oneWay : t.airportTransfer.roundTrip },
      { label: t.airportTransfer.airport, value: airportDisplayName },
      { label: t.airportTransfer.vehicle, value: selectedVehicle ? (language === "vi" ? selectedVehicle.nameVi : selectedVehicle.nameEn) : "" },
      ...(dateValue ? [{ label: t.airportTransfer.dateTime, value: `${dateValue.toString()} ${timeValue.hour}:${String(timeValue.minute).padStart(2, "0")} ${timeValue.period}` }] : []),
      ...(tripType === "return" && returnDateValue ? [{ label: t.airportTransfer.returnDate, value: `${returnDateValue.toString()} ${returnTimeValue.hour}:${String(returnTimeValue.minute).padStart(2, "0")} ${returnTimeValue.period}` }] : []),
      ...(nhaTrangAddress ? [{ label: t.airportTransfer.address, value: nhaTrangAddress }] : []),
      ...(depositCalc ? [
        { 
          label: t.discounts?.depositRequired || "Tiền đặt cọc", 
          value: depositCalc.depositType === DepositType.FIXED 
            ? `${formatPrice(depositCalc.depositAmount)} (Cố định)`
            : `${formatPrice(depositCalc.depositAmount)} (${depositCalc.depositRate}%)`
        },
        { label: t.discounts?.remainingPayment || "Thanh toán còn lại", value: formatPrice(depositCalc.remainingAmount) },
      ] : []),
    ];

    return {
      booking: {
        selectedAirport: selectedAirport || null,
        selectedRoute: selectedRoute || null,
        direction,
        tripType,
        outboundStartsFrom,
        nhaTrangAddress,
        nhaTrangReturnAddress,
        isReturnAddressCustom,
        isCustomAddress,
        searchPickLat,
        searchPickLng,
        dateValue: dateValue ? dateValue.toString() : null,
        timeValue,
        flightNumber,
        returnDateValue: returnDateValue ? returnDateValue.toString() : null,
        returnTimeValue,
        returnFlightNumber,
        selectedVehicleId,
        estimatedDistance,
        estimatedDuration,
        passengerCount,
        baggageCount,
        luggageWeight,
      },
      summaryItems,
      totalAmount: finalPrice,
      payload,
      contact: { fullName, phone, email, zaloId, kakaoTalkId, whatsapp, notes },
    };
  };

  const handleBooking = () => {
    const activeVehiclesList = getVehiclesList();
    const activeVehicle = activeVehiclesList.find((v) => v.id === selectedVehicleId) || activeVehiclesList[0];
    if (activeVehicle) {
      const maxSeat = activeVehicle.maxSeat ?? 4;
      const maxLuggageKg = (activeVehicle.maxLuggage ?? 2) * 20;
      if (passengerCount > maxSeat || luggageWeight > maxLuggageKg) {
        alert(t.airportTransfer.capacityWarning);
        return;
      }
    }

    const draft = buildBookingDraft();
    if (!draft) return;
    saveBookingDraft(draft);
    router.push(`/${language}/airport-transfer/checkout`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 flex flex-col font-sans">

      {/* Hero Banner Area */}
      <section className="relative w-full min-h-[320px] md:min-h-[360px] flex flex-col justify-center items-center pt-12 md:pt-16 pb-8 md:pb-12 px-4 sm:px-6 lg:px-8 xl:px-10">
        <div
          className="absolute inset-0 overflow-hidden bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: heroSection?.imageUrls?.[0]
              ? `url('${heroSection.imageUrls[0]}')`
              : `url('')`
          }}
        >
          <div className="absolute inset-0 bg-black/65 dark:bg-black/75 backdrop-blur-[1px]" />
        </div>

        <div className="max-w-[1536px] mx-auto w-full flex flex-col items-center justify-center text-center gap-4 relative z-10 text-white my-auto pt-4 pb-4">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 dark:bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
              <Sparkles size={12} className="text-accent animate-spin-slow" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-100">
                {heroSection?.translations?.find(tr => tr.locale === language)?.subtitle || t.airportTransfer.subtitle}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight drop-shadow-md">
              {heroSection?.translations?.find(tr => tr.locale === language)?.title || t.airportTransfer.title}
            </h1>
            <FormattedDescription
              description={heroSection?.translations?.find(tr => tr.locale === language)?.description || t.airportTransfer.heroDesc}
              className="mt-2 text-sm md:text-base text-slate-200 max-w-2xl mx-auto font-medium"
            />
            <div className="flex items-center justify-center pt-1">
              <a
                href="tel:0764971971"
                className="inline-flex items-center gap-2.5 bg-accent hover:bg-accent-hover text-accent-foreground px-5 py-2.5 rounded-full text-xs font-black transition-all shadow-md hover:scale-105 active:scale-95 no-underline border-none"
              >
                <Phone size={14} />
                <span>Hotline: 0764 971 971</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-8 sm:pt-12 pb-12 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Column: Form & Car Choices */}
        <div className="lg:col-span-8 space-y-6">

          {/* Fixed Route Badges */}
          {routes.length > 0 && (
            <div className="bg-white dark:bg-[var(--bg-card)] rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t.airportTransfer.popularRoutes}
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowRouteBadges(!showRouteBadges)}
                  className="text-xs font-bold text-accent hover:text-accent-hover"
                >
                  {showRouteBadges ? t.airportTransfer.hideRoutes : t.airportTransfer.showRoutes}
                </Button>
              </div>
              {showRouteBadges && (
                <div className="flex flex-wrap gap-2">
                  {routes.map((route) => {
                    const isSelected = selectedRoute?.id === route.id;
                    const r = route as any;
                    const translation = r.translations?.find((t: any) => t.locale === language) || r.translations?.[0];
                    const routeName = translation?.name
                      || r.name
                      || (r.originName && r.destinationName ? `${r.originName} ⇌ ${r.destinationName}` : null)
                      || r.airportName
                      || `${r.originCity || ""} → ${r.destinationCity || ""}`.replace(/ → $/, "").replace(/^ → /, "")
                      || r.code;
                    const distance = r.distanceKm ? `~${r.distanceKm}km` : "";

                    return (
                      <button
                        key={route.id}
                        onClick={() => handleRouteBadgeClick(route)}
                        className={`
                          flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold
                          transition-all cursor-pointer whitespace-nowrap
                          ${isSelected
                            ? "border-accent bg-accent/10 text-accent dark:bg-accent/20"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] text-slate-700 dark:text-slate-300 hover:border-accent/50 hover:bg-accent/5"
                          }
                        `}
                      >
                        <MapPin size={12} className={isSelected ? "text-accent" : "text-slate-450"} />
                        <span className="max-w-[120px] truncate">{routeName}</span>
                        {distance && <span className="text-[10px] text-slate-400 dark:text-slate-500">{distance}</span>}
                        {isSelected && <CheckCircle size={12} className="text-accent" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white dark:bg-[var(--bg-card)] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-5">
            {/* Direction & Trip Type Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex bg-slate-100 dark:bg-[var(--bg-elevated)]/80 p-1.5 rounded-2xl gap-1 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTripType("one-way")}
                  className={`py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${tripType === "one-way"
                    ? "bg-white dark:bg-black text-accent shadow-sm"
                    : " hover:text-slate-800 dark:hover:text-slate-200 hover:bg-zinc-200"
                    }`}
                >
                  {t.airportTransfer.oneWay}
                </button>
                <button
                  type="button"
                  onClick={() => setTripType("return")}
                  className={`py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${tripType === "return"
                    ? "bg-white dark:bg-black text-accent shadow-sm"
                    : "hover:text-slate-800 dark:hover:text-slate-200 hover:bg-zinc-200"
                    }`}
                >
                  {t.airportTransfer.roundTrip}
                </button>
              </div>

              {tripType === "one-way" ? (
                <div className="flex bg-slate-100 dark:bg-[var(--bg-elevated)]/80 p-1.5 rounded-2xl gap-1 flex-1 max-w-md">
                  <button
                    type="button"
                    onClick={() => setDirection("to-nhatrang")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${direction === "to-nhatrang"
                      ? "bg-white dark:bg-black text-accent shadow-sm"
                      : "hover:text-slate-800 dark:hover:text-slate-200 hover:bg-zinc-200"
                      }`}
                  >
                    {t.airportTransfer.toNhaTrang}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection("to-airport")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${direction === "to-airport"
                      ? "bg-white dark:bg-black text-accent shadow-sm"
                      : "hover:text-slate-800 dark:hover:text-slate-200 hover:bg-zinc-200"
                      }`}
                  >
                    {t.airportTransfer.toAirport}
                  </button>
                </div>
              ) : (
                <div className="flex bg-slate-100 dark:bg-[var(--bg-elevated)]/80 p-1.5 rounded-2xl gap-1 flex-1 max-w-md items-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 shrink-0">
                    {`${t.airportTransfer.outbound}:`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOutboundStartsFrom("airport")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${outboundStartsFrom === "airport"
                      ? "bg-white dark:bg-black text-accent shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                  >
                    {t.airportTransfer.toNhaTrang}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutboundStartsFrom("nhatrang")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${outboundStartsFrom === "nhatrang"
                      ? "bg-white dark:bg-black text-accent shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                  >
                    {t.airportTransfer.toAirport}
                  </button>
                </div>
              )}
            </div>



            {/* ONE-WAY TRIP FORM */}
            {tripType === "one-way" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {direction === "to-nhatrang" ? (
                    <>
                      {renderAirportSelector(t.airportTransfer.pickup, t.airportTransfer.driverMeetDesc)}
                      <div className="p-4 bg-slate-50 dark:bg-[var(--bg-card)]/60 rounded-2xl border border-slate-100 dark:border-zinc-300 flex items-start gap-3 w-full">
                        <MapPin className="text-green-600 dark:text-green-400 mt-1 shrink-0" size={18} />
                        <div className="w-full flex-1">
                          <p className="text-[10px] font-extrabold uppercase tracking-widest">{t.airportTransfer.dropoff}</p>
                          <div className="relative w-full">
                            <HeroSearchField
                              isRequired
                              isInvalid={formTouched && nhaTrangAddress.length === 0}
                              name="dropoff-address"
                              value={nhaTrangAddress}
                              onChange={(val) => { handleNhaTrangAddressChange(val); setShowSuggestions(true); }}
                            >
                              <HeroSearchField.Group className="mt-1.5 flex items-center border border-accent dark:border-accent rounded-xl px-3 h-10 focus-within:border-accent-hover transition-colors w-full shadow-xs shadow-accent-soft-foreground">
                                <HeroSearchField.SearchIcon className="text-slate-400 dark:text-slate-500 mr-2 shrink-0" />
                                <HeroSearchField.Input
                                  placeholder={t.airportTransfer.addressPlaceholder}
                                  className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                                />
                                <HeroSearchField.ClearButton className="text-slate-400 dark:text-slate-500 hover:text-slate-600 ml-auto cursor-default" />
                              </HeroSearchField.Group>
                              {formTouched && nhaTrangAddress.length === 0 && (
                                <FieldError className="text-[9px] text-red-500 mt-1 pl-1">Vui lòng nhập địa điểm</FieldError>
                              )}
                            </HeroSearchField>
                            {showSuggestions && suggestions.length > 0 && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />
                                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                  {suggestions.map((item, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() => { handleNhaTrangSuggestionPick(item); setShowSuggestions(false); }}
                                      className="p-3 hover:bg-blue-50/50 dark:hover:bg-[var(--bg-card)] cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-350 transition-colors flex items-center gap-2"
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
                      <div className="p-4 bg-slate-50 dark:bg-[var(--bg-card)]/60 rounded-2xl border border-slate-100 dark:border-zinc-300 flex items-start gap-3 w-full">
                        <MapPin className="text-green-600 dark:text-green-400 mt-1 shrink-0" size={18} />
                        <div className="w-full flex-1">
                          <p className="text-[10px] font-extrabold uppercase tracking-widest">{t.airportTransfer.pickupLocationNT}</p>
                          <div className="relative w-full">
                            <HeroSearchField
                              isRequired
                              isInvalid={formTouched && nhaTrangAddress.length === 0}
                              name="pickup-address"
                              value={nhaTrangAddress}
                              onChange={(val) => { handleNhaTrangAddressChange(val); setShowSuggestions(true); }}
                            >
                              <HeroSearchField.Group className="mt-1.5 flex items-center border border-slate-200 dark:border-slate-800 rounded-xl px-3 h-10  focus-within:border-blue-500/50 transition-colors w-full">
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
                                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                  {suggestions.map((item, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() => { handleNhaTrangSuggestionPick(item); setShowSuggestions(false); }}
                                      className="p-3 hover:bg-blue-50/50 dark:hover:bg-[var(--bg-card)] cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-355 transition-colors flex items-center gap-2"
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
                      {renderAirportSelector(t.airportTransfer.dropoffLocation, t.airportTransfer.driverDropoffDesc)}
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
                      <DateField.Group className="h-10  border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex items-center justify-between">
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
                      <DatePicker.Popover className=" border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-50">
                        <Calendar aria-label="Travel date">
                          <Calendar.Header className="flex items-center justify-between mb-2">
                            <Calendar.YearPickerTrigger className="text-xs font-bold flex items-center gap-1 cursor-pointer">
                              <Calendar.YearPickerTriggerHeading />
                              <Calendar.YearPickerTriggerIndicator />
                            </Calendar.YearPickerTrigger>
                            <div className="flex gap-1">
                              <Calendar.NavButton slot="previous" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer" />
                              <Calendar.NavButton slot="next" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer" />
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
                    triggerClassName="bg-white dark:bg-zinc-900"
                    isRequired
                  />

                  <div className="flex flex-col w-full">
                    <Label className="text-[11px] font-extrabold uppercase tracking-wider mb-1.5">{t.airportTransfer.flightNumber}</Label>
                    <HeroSearchField>
                      <HeroSearchField.Group className="flex items-center h-10 border border-slate-200 dark:border-slate-800 rounded-xl px-3 hover:border-accent transition-colors">
                        <Plane size={16} className="mr-2 shrink-0" />
                        <HeroSearchField.Input
                          placeholder="VN123, QH456..."
                          value={flightNumber}
                          onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                          className="w-full text-xs font-semibold outline-none bg-transparent"
                        />
                        <HeroSearchField.ClearButton />
                      </HeroSearchField.Group>
                    </HeroSearchField>
                    {!flightNumber && (
                      <span className="text-[9px] mt-1 pl-1">Tùy chọn</span>
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
                    <div className="flex-1 h-[1px] bg-slate-100 dark:bg-[var(--bg-elevated)]/80" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {outboundStartsFrom === "airport" ? (
                      <>
                        {renderAirportSelector(`${t.airportTransfer.outbound} ${t.airportTransfer.pickup}`, t.airportTransfer.driverMeetDesc)}
                        <div className="p-4 bg-slate-50 dark:bg-[var(--bg-card)]/60 rounded-2xl border border-slate-100 dark:border-zinc-300 flex items-start gap-3 w-full">
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
                                <HeroSearchField.Group className="mt-1.5 flex items-center border border-slate-200 dark:border-slate-800 rounded-xl px-3 h-10  focus-within:border-accent transition-colors w-full">
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
                                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                    {suggestions.map((item, idx) => (
                                      <div key={idx} onClick={() => { handleNhaTrangSuggestionPick(item); setShowSuggestions(false); }} className="p-3 hover:bg-blue-50/50 dark:hover:bg-[var(--bg-card)] cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-350 transition-colors flex items-center gap-2">
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
                        <div className="p-4 bg-slate-50 dark:bg-[var(--bg-card)]/60 rounded-2xl border border-slate-100 dark:border-zinc-300 flex items-start gap-3 w-full">
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
                                <HeroSearchField.Group className="mt-1.5 flex items-center border border-slate-200 dark:border-slate-800 rounded-xl px-3 h-10  focus-within:border-accent transition-colors w-full">
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
                        {renderAirportSelector(`${t.airportTransfer.outbound} ${t.airportTransfer.dropoffLocation}`, t.airportTransfer.driverDropoffDesc)}
                      </>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    <div className="flex flex-col w-full">
                      <DatePicker value={dateValue} onChange={setDateValue} minValue={today(getLocalTimeZone())} className="w-full" isRequired aria-label="Outbound Date">
                        <Label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">{t.airportTransfer.date}</Label>
                        <DateField.Group className="h-10  border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex items-center justify-between">
                          <DateField.Input className="text-xs font-semibold bg-transparent border-none outline-none">
                            {(segment) => <DateField.Segment segment={segment} />}
                          </DateField.Input>
                          <DateField.Suffix>
                            <DatePicker.Trigger className="cursor-pointer"><DatePicker.TriggerIndicator /></DatePicker.Trigger>
                          </DateField.Suffix>
                        </DateField.Group>
                        <FieldError className="text-[9px] text-red-500 mt-1 pl-1" />
                        <DatePicker.Popover className=" border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-50">
                          <Calendar aria-label="Outbound date">
                            <Calendar.Header className="flex items-center justify-between mb-2">
                              <Calendar.YearPickerTrigger className="text-xs font-bold flex items-center gap-1 cursor-pointer"><Calendar.YearPickerTriggerHeading /><Calendar.YearPickerTriggerIndicator /></Calendar.YearPickerTrigger>
                              <div className="flex gap-1">
                                <Calendar.NavButton slot="previous" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer" />
                                <Calendar.NavButton slot="next" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer" />
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
                    <TimePicker
                      value={timeValue}
                      onChange={setTimeValue}
                      label={t.airportTransfer.time}
                      labelClassName="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1"
                      language={language}
                      triggerClassName="bg-white dark:bg-zinc-900"
                      isRequired />
                    <div className="flex flex-col w-full">
                      <Label className="text-[11px] font-extrabold uppercase tracking-wider mb-1.5">{t.airportTransfer.flightNumber}</Label>
                      <HeroSearchField>
                        <HeroSearchField.Group className="flex items-center h-10 border border-slate-200 dark:border-slate-800 rounded-xl px-3 hover:border-blue-500/50 transition-colors">
                          <Plane size={16} className="mr-2 shrink-0" />
                          <HeroSearchField.Input
                            placeholder="VN123, QH456..."
                            value={flightNumber}
                            onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                            className="w-full text-xs font-semibold outline-none bg-transparent"
                          />
                          <HeroSearchField.ClearButton />
                        </HeroSearchField.Group>
                      </HeroSearchField>
                      {!flightNumber && (
                        <span className="text-[9px] mt-1 pl-1">Tùy chọn</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 py-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">{t.airportTransfer.returnLeg}</span>
                    <div className="flex-1 h-[1px] bg-slate-100 dark:bg-[var(--bg-elevated)]/80" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {outboundStartsFrom === "airport" ? (
                      <>
                        <div className="p-4 bg-slate-50 dark:bg-[var(--bg-card)]/60 rounded-2xl border border-slate-100 dark:border-zinc-300 flex items-start gap-3">
                          <MapPin className="text-green-600 dark:text-green-400 mt-1 shrink-0" size={18} />
                          <div className="w-full flex-1">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">{`${t.airportTransfer.returnLeg} ${t.airportTransfer.pickup}`}</p>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">{nhaTrangReturnAddress || nhaTrangAddress || "Trung tâm Nha Trang"}</p>
                          </div>
                        </div>
                        {renderAirportSelector(`${t.airportTransfer.returnLeg} ${t.airportTransfer.dropoff}`, t.airportTransfer.driverDropoffDesc)}
                      </>
                    ) : (
                      <>
                        {renderAirportSelector(`${t.airportTransfer.returnLeg} ${t.airportTransfer.pickup}`, t.airportTransfer.driverMeetDesc)}
                        <div className="p-4 bg-slate-50 dark:bg-[var(--bg-card)]/60 rounded-2xl border border-slate-100 dark:border-zinc-300 flex items-start gap-3">
                          <MapPin className="text-green-600 dark:text-green-400 mt-1 shrink-0" size={18} />
                          <div className="w-full flex-1">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">{`${t.airportTransfer.returnLeg} ${t.airportTransfer.dropoff}`}</p>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">{nhaTrangReturnAddress || nhaTrangAddress || "Trung tâm Nha Trang"}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    <div className="flex flex-col w-full">
                      <DatePicker value={returnDateValue} onChange={setReturnDateValue} minValue={today(getLocalTimeZone())} className="w-full" isRequired aria-label="Return Date">
                        <Label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">{t.airportTransfer.returnDate}</Label>
                        <DateField.Group className="h-10  border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex items-center justify-between">
                          <DateField.Input className="text-xs font-semibold bg-transparent border-none outline-none">
                            {(segment) => <DateField.Segment segment={segment} />}
                          </DateField.Input>
                          <DateField.Suffix>
                            <DatePicker.Trigger className="cursor-pointer"><DatePicker.TriggerIndicator /></DatePicker.Trigger>
                          </DateField.Suffix>
                        </DateField.Group>
                        <FieldError className="text-[9px] text-red-500 mt-1 pl-1" />
                        <DatePicker.Popover className=" border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-50">
                          <Calendar aria-label="Return date">
                            <Calendar.Header className="flex items-center justify-between mb-2">
                              <Calendar.YearPickerTrigger className="text-xs font-bold flex items-center gap-1 cursor-pointer"><Calendar.YearPickerTriggerHeading /><Calendar.YearPickerTriggerIndicator /></Calendar.YearPickerTrigger>
                              <div className="flex gap-1">
                                <Calendar.NavButton slot="previous" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer" />
                                <Calendar.NavButton slot="next" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer" />
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
                    <TimePicker
                      value={returnTimeValue}
                      onChange={setReturnTimeValue}
                      label={t.airportTransfer.returnTime}
                      labelClassName="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1"
                      language={language}
                      triggerClassName="bg-white dark:bg-zinc-900"
                      isRequired />
                    <div className="flex flex-col w-full">
                      <Label className="text-[11px] font-extrabold uppercase tracking-wider mb-1.5">{t.airportTransfer.flightNumber}</Label>
                      <HeroSearchField>
                        <HeroSearchField.Group className="flex items-center h-10 border border-slate-200 dark:border-slate-800 rounded-xl px-3 hover:border-accent transition-colors">
                          <Plane size={16} className="mr-2 shrink-0" />
                          <HeroSearchField.Input
                            placeholder="VN456..."
                            value={returnFlightNumber}
                            onChange={(e) => setReturnFlightNumber(e.target.value.toUpperCase())}
                            className="w-full text-xs font-semibold outline-none bg-transparent"
                          />
                          <HeroSearchField.ClearButton />
                        </HeroSearchField.Group>
                      </HeroSearchField>
                      {!returnFlightNumber && (
                        <span className="text-[9px] mt-1 pl-1">Tùy chọn</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Passengers & Luggage Form Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-zinc-300">
              {/* Số hành khách */}
              <NumberField
                isRequired
                className="w-full"
                value={passengerCount}
                onChange={(val) => { if (val !== null && !isNaN(val)) setPassengerCount(val); }}
                minValue={1}
                maxValue={selectedVehicle?.maxSeat ?? 16}
                isInvalid={selectedVehicle ? passengerCount > (selectedVehicle.maxSeat ?? 4) : false}
                name="passengers"
              >
                <Label isRequired className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1 block">
                  {t.airportTransfer.passengers}
                </Label>
                <NumberField.Group className="flex items-center w-full h-10 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden focus-within:border-accent hover:border-accent transition-all">
                  <Users size={16} className="text-slate-400 dark:text-slate-500 ml-3 shrink-0" />
                  <NumberField.Input
                    className="flex-1 bg-transparent px-3 text-xs font-semibold outline-none border-none h-full w-full text-slate-800 dark:text-slate-100"
                  />
                  <div className="flex h-full flex-col border-l border-slate-200 dark:border-slate-800">
                    <NumberField.IncrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 hover:text-accent-foreground hover:bg-accent/10 cursor-pointer bg-transparent">
                      <svg aria-hidden="true" height="8" viewBox="0 0 16 16" width="8" xmlns="http://www.w3.org/2000/svg" className="text-slate-400 dark:text-slate-500">
                        <path clipRule="evenodd" d="M13.03 10.53a.75.75 0 0 1-1.06 0L8 6.56l-3.97 3.97a.75.75 0 1 1-1.06-1.06l4.5-4.5a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06" fill="currentColor" fillRule="evenodd" />
                      </svg>
                    </NumberField.IncrementButton>
                    <NumberField.DecrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 hover:text-accent-foreground hover:bg-accent/10 cursor-pointer bg-transparent border-t border-slate-200 dark:border-slate-800">
                      <svg aria-hidden="true" height="8" viewBox="0 0 16 16" width="8" xmlns="http://www.w3.org/2000/svg" className="text-slate-400 dark:text-slate-500">
                        <path clipRule="evenodd" d="M3.97 5.47a.75.75 0 0 1 1.06 0L8 9.44l3.97-3.97a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 0-1.06" fill="currentColor" fillRule="evenodd" />
                      </svg>
                    </NumberField.DecrementButton>
                  </div>
                </NumberField.Group>
                <FieldError className="text-[9px] text-red-500 mt-1 pl-1 block">{t.airportTransfer.capacityWarning}</FieldError>
              </NumberField>

              {/* Số kiện hành lý */}
              <NumberField
                className="w-full"
                value={baggageCount}
                onChange={(val) => { if (val !== null && !isNaN(val)) setBaggageCount(val); }}
                minValue={0}
                maxValue={selectedVehicle?.maxLuggage ?? 20}
                isInvalid={selectedVehicle ? baggageCount > (selectedVehicle.maxLuggage ?? 2) : false}
                name="baggageCount"
              >
                <Label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1 block">
                  {t.airportTransfer.baggageCount}
                </Label>
                <NumberField.Group className="flex items-center w-full h-10 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden focus-within:border-accent hover:border-accent transition-all">
                  <Briefcase size={16} className="text-slate-400 dark:text-slate-500 ml-3 shrink-0" />
                  <NumberField.Input
                    className="flex-1 bg-transparent px-3 text-xs font-semibold outline-none border-none h-full w-full text-slate-800 dark:text-slate-100"
                  />
                  <div className="flex h-full flex-col border-l border-slate-200 dark:border-slate-800">
                    <NumberField.IncrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 hover:text-accent-foreground hover:bg-accent/10 cursor-pointer bg-transparent">
                      <svg aria-hidden="true" height="8" viewBox="0 0 16 16" width="8" xmlns="http://www.w3.org/2000/svg" className="text-slate-400 dark:text-slate-500">
                        <path clipRule="evenodd" d="M13.03 10.53a.75.75 0 0 1-1.06 0L8 6.56l-3.97 3.97a.75.75 0 1 1-1.06-1.06l4.5-4.5a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06" fill="currentColor" fillRule="evenodd" />
                      </svg>
                    </NumberField.IncrementButton>
                    <NumberField.DecrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 hover:text-accent-foreground hover:bg-accent/10 cursor-pointer bg-transparent border-t border-slate-200 dark:border-slate-800">
                      <svg aria-hidden="true" height="8" viewBox="0 0 16 16" width="8" xmlns="http://www.w3.org/2000/svg" className="text-slate-400 dark:text-slate-500">
                        <path clipRule="evenodd" d="M3.97 5.47a.75.75 0 0 1 1.06 0L8 9.44l3.97-3.97a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 0-1.06" fill="currentColor" fillRule="evenodd" />
                      </svg>
                    </NumberField.DecrementButton>
                  </div>
                </NumberField.Group>
                <FieldError className="text-[9px] text-red-500 mt-1 pl-1 block">{t.airportTransfer.capacityWarning}</FieldError>
              </NumberField>

              {/* Số kg hành lý */}
              <NumberField
                className="w-full"
                value={luggageWeight}
                onChange={(val) => { if (val !== null && !isNaN(val)) setLuggageWeight(val); }}
                minValue={0}
                maxValue={selectedVehicle?.luggageWeight ?? ((selectedVehicle?.maxLuggage ?? 2) * 20)}
                isInvalid={selectedVehicle ? luggageWeight > (selectedVehicle.luggageWeight ?? ((selectedVehicle.maxLuggage ?? 2) * 20)) : false}
                name="luggageWeight"
              >
                <Label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1 block">
                  {t.airportTransfer.baggageWeight}
                </Label>
                <NumberField.Group className="flex items-center w-full h-10 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden focus-within:border-accent hover:border-accent transition-all">
                  <Scale size={16} className="text-slate-400 dark:text-slate-500 ml-3 shrink-0" />
                  <NumberField.Input
                    className="flex-1 bg-transparent px-3 text-xs font-semibold outline-none border-none h-full w-full text-slate-800 dark:text-slate-100"
                  />
                  <div className="flex h-full flex-col border-l border-slate-200 dark:border-slate-800">
                    <NumberField.IncrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 hover:text-accent-foreground hover:bg-accent/10 cursor-pointer bg-transparent">
                      <svg aria-hidden="true" height="8" viewBox="0 0 16 16" width="8" xmlns="http://www.w3.org/2000/svg" className="text-slate-400 dark:text-slate-500">
                        <path clipRule="evenodd" d="M13.03 10.53a.75.75 0 0 1-1.06 0L8 6.56l-3.97 3.97a.75.75 0 1 1-1.06-1.06l4.5-4.5a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06" fill="currentColor" fillRule="evenodd" />
                      </svg>
                    </NumberField.IncrementButton>
                    <NumberField.DecrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 hover:text-accent-foreground hover:bg-accent/10 cursor-pointer bg-transparent border-t border-slate-200 dark:border-slate-800">
                      <svg aria-hidden="true" height="8" viewBox="0 0 16 16" width="8" xmlns="http://www.w3.org/2000/svg" className="text-slate-400 dark:text-slate-500">
                        <path clipRule="evenodd" d="M3.97 5.47a.75.75 0 0 1 1.06 0L8 9.44l3.97-3.97a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 0-1.06" fill="currentColor" fillRule="evenodd" />
                      </svg>
                    </NumberField.DecrementButton>
                  </div>
                </NumberField.Group>
                <FieldError className="text-[9px] text-red-500 mt-1 pl-1 block">{t.airportTransfer.capacityWarning}</FieldError>
              </NumberField>
            </div>

            {/* Applied surcharges banner when matched */}
            {appliedSurcharges.length > 0 && (
              <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl text-xs font-semibold text-amber-900 dark:text-amber-300">
                <p className="font-extrabold uppercase mb-1.5 text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  {t.airportTransfer.surchargeApplied || "Phụ thu áp dụng cho chuyến đi của bạn:"}
                </p>
                <ul className="list-disc pl-5 space-y-1 font-medium">
                  {appliedSurcharges.map((s, idx) => (
                    <li key={s.id || idx}>
                      {formatSurchargeRuleDescription(s)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Vehicle Selection */}
          <div className="bg-white dark:bg-[var(--bg-card)] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-5">
            <h3 className="text-sm font-extrabold uppercase tracking-wider">{t.airportTransfer.selectVehicle}</h3>
            {!isFormComplete ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">{t.airportTransfer.pleaseFillInfo}</p>
            ) : vehiclesLoading || (isCustomAddress && estimatedDistance == null) ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 space-y-3">
                    <Skeleton className="w-full h-36 rounded-xl" />
                    <div className="flex justify-between items-center gap-3 pt-1">
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-4 w-2/3 rounded" />
                        <Skeleton className="h-3 w-1/2 rounded" />
                      </div>
                      <Skeleton className="h-5 w-20 rounded shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 max-h-[650px] overflow-y-auto pr-1.5">
                {activeVehicles.map((v) => {
                  const isSelected = selectedVehicleId === v.id || (!selectedVehicleId && v.id === activeVehicles[0]?.id);
                  const price = tripType === "one-way" ? v.priceOneWay : v.priceReturn;

                  const priceDisplay = isCustomAddress
                    ? t.airportTransfer.estimatedPrice.replace("{price}", formatPrice(price))
                    : formatPrice(price);

                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVehicleId(v.id)}
                      className={`rounded-2xl border-2 transition-all transition-300 cursor-pointer flex flex-col sm:flex-row overflow-hidden  ${isSelected ? "border-accent bg-blue-50/50 dark:bg-black/20 shadow-md dark:shadow-accent-foreground/20 dark:backdrop-blur-md shadow-accent-foreground/20 backdrop-blur-md" : "border-slate-200 dark:border-zinc-300 hover:border-slate-350 hover:shadow-xs"}`}
                    >
                      {/* Image on left */}
                      <div className="relative w-full sm:w-40 h-40 sm:h-auto shrink-0 bg-slate-100 dark:bg-[var(--bg-card)] flex items-center justify-center border-b sm:border-b-0 sm:border-r border-slate-200/50 dark:border-slate-800/60 overflow-hidden">
                        {v.thumbnailUrl ? (
                          <img
                            src={v.thumbnailUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <Car size={32} className="text-slate-400 dark:text-slate-650" />
                        )}
                      </div>

                      {/* Content on right */}
                      <div className="flex-grow p-4 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <h4 className="text-sm font-black text-slate-850 dark:text-white truncate">{language === "vi" ? v.nameVi : v.nameEn}</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">{v.capacity} · {v.luggage}</p>
                            </div>
                            <div className="flex flex-col items-end text-right shrink-0">
                              <span className="text-sm font-black text-accent">{priceDisplay}</span>
                              {getVehicleSurcharge(v) > 0 && (
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] font-extrabold text-red-500 mt-0.5">
                                    +{formatPrice(getVehicleSurcharge(v))} {t.airportTransfer.surchargeShort}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-bold leading-none mt-0.5 max-w-[120px] truncate">
                                    ({getVehicleSurchargeNames()})
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Capacity warning validation message */}
                          {(passengerCount > (v.maxSeat ?? 4) || luggageWeight > ((v.maxLuggage ?? 2) * 20)) && (
                            <div className="mt-3 flex items-start gap-1.5 p-2 bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/40 rounded-xl text-[10px] font-semibold text-red-800 dark:text-red-300">
                              <AlertTriangle size={12} className="text-red-500 shrink-0 mt-0.5" />
                              <span>{t.airportTransfer.capacityWarning}</span>
                            </div>
                          )}
                        </div>

                        {v.schemaText && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-300 text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-semibold">
                            {v.schemaText}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Summary & Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-[var(--bg-card)] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider">{t.airportTransfer.summary}</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between"><span className="font-extrabold">{t.rentCar.tripType}</span><span className="font-bold">{tripType === "one-way" ? t.airportTransfer.oneWay : t.airportTransfer.roundTrip}</span></div>
              <div className="flex justify-between"><span className="font-extrabold">{t.airportTransfer.airport}</span><span className="font-bold">{airportNameShort}</span></div>
              <div className="flex justify-between"><span className="font-extrabold">{t.airportTransfer.date}</span><span className="font-bold">{dateValue ? dateValue.toString() : "—"}</span></div>
              <div className="flex justify-between"><span className="font-extrabold">{t.airportTransfer.vehicle}</span><span className="font-bold">{selectedVehicle ? (language === "vi" ? selectedVehicle.nameVi : selectedVehicle.nameEn) : "—"}</span></div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
              {isFormComplete && selectedVehicle && appliedSurcharges.length > 0 && (
                <>
                  <div className="flex justify-between text-xs text-slate-500 font-semibold">
                    <span>Tạm tính (Giá gốc):</span>
                    <span>{formatPrice(unitPrice)}</span>
                  </div>
                  {appliedSurcharges.map((s, idx) => {
                    const amt = s.calculationType === "PERCENT" ? Math.round(unitPrice * (Number(s.value) / 100)) : Number(s.value);
                    return (
                      <div key={s.id || idx} className="flex justify-between text-xs text-amber-600 dark:text-amber-400 font-semibold">
                        <span>{s.name}:</span>
                        <span>+{formatPrice(amt)}</span>
                      </div>
                    );
                  })}
                </>
              )}
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-slate-500">{t.common.total}</span>
                <span className="text-xl font-black text-accent">{finalPriceDisplay}</span>
              </div>

              {depositCalc && isFormComplete && selectedVehicle && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 space-y-1.5 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <ShieldCheck size={15} className="text-amber-600 shrink-0" />
                      {t.discounts?.depositRequired || "Tiền đặt cọc"} {depositCalc.depositType === DepositType.FIXED ? "(Cố định)" : `(${depositCalc.depositRate}%)`}
                    </span>
                    <span className="text-sm font-black text-amber-700 dark:text-amber-400">
                      {formatPrice(depositCalc.depositAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-amber-200/50 dark:border-amber-900/30 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span>{t.discounts?.remainingPayment || "Thanh toán còn lại"}:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatPrice(depositCalc.remainingAmount)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleBooking}
              isDisabled={!isFormComplete || !selectedVehicle || (isCustomAddress && estimatedDistance == null)}
              className="w-full h-12 rounded-2xl font-black text-sm bg-accent text-accent-foreground hover:bg-accent-hover shadow-2xs gap-2 border-none cursor-pointer"
            >
              {t.airportTransfer.bookNow}
            </Button>
          </div>

          {nhaTrangAddress && (
            <RoutingMap
              nhaTrangAddress={nhaTrangAddress}
              direction={tripType === "return"
                ? (outboundStartsFrom === "airport" ? "to-nhatrang" : "to-airport")
                : direction}
              originLat={!isCustomAddress || (searchPickLat != null && searchPickLng != null)
                ? (selectedRoute?.originLat ?? selectedAirport?.latitude ?? null)
                : null}
              originLng={!isCustomAddress || (searchPickLat != null && searchPickLng != null)
                ? (selectedRoute?.originLng ?? selectedAirport?.longitude ?? null)
                : null}
              destinationLat={!isCustomAddress || (searchPickLat != null && searchPickLng != null)
                ? (searchPickLat ?? selectedRoute?.destinationLat ?? null)
                : null}
              destinationLng={!isCustomAddress || (searchPickLat != null && searchPickLng != null)
                ? (searchPickLng ?? selectedRoute?.destinationLng ?? null)
                : null}
              airportLabel={airportDisplayName}
              onRouteCalculated={handleRouteCalculated}
            />
          )}
        </div>
      </main>
    </div>
  );
}
