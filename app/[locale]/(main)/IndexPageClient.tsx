"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { DateValue } from "@internationalized/date";
import {
  Calendar as CalendarIcon,
  ChevronUp,
  Minus,
  Plus,
  Phone,
  MessageCircle,
  Plane,
  Compass,
  MapPin,
} from "lucide-react";
import { useFilter, useOverlayState } from "@heroui/react";
import { useI18n } from "@/context/LanguageContext";
import { getVehicleCategories, VehicleCategoryDto, getActiveAirports, getActiveAirportRoutes, getAirportTransferPricesByRoute, type AirportDto } from "@/lib/api/fleet";
import { getActiveIntercityRoutes, type IntercityRouteDto } from "@/lib/api/intercity";
import { getSharedRoutes, type SharedRouteDto } from "@/lib/api/sharedRoute";
import { getTours, type TourDto } from "@/lib/api/tours";
import { searchLocations, type LocationSearchResult } from "@/lib/api/locations";
import { getActiveSections, sortSectionsForDisplay, dedupeSingletonSections, type SectionDto } from "@/lib/api/sections";
import { SectionRenderer } from "@/components/sections/SectionRenderer";
import { TimePicker, type TimeValue } from "@/components/time-picker";
import { FormattedDescription } from "@/components/FormattedDescription";
import { getCanonicalSlug } from "@/lib/slug-helpers";
import { UnifiedBookingBar } from "@/components/search-bar";
import {
  QuickCategoryNav,
  AllCategoriesDrawer,
  HomeDestinationSection,
  HomeToursSection,
  HomeSelfDriveSection,
  HomeIntercitySection,
  HomeAirportTransferSection,
} from "@/components/home";
import type { HomeInitialData } from "@/lib/api/home-preloader";
import type { SelfDriveVehicleItem } from "@/components/self-drive/SelfDriveVehicleCard";
import {
  buildAirportSystemCards,
  computeMinPricesByCategory,
  type AirportPackageCard,
} from "@/lib/airport-packages";
import { backendUrl } from "@/lib/api/client";

export default function IndexPage({
  initialData,
  feedbacks,
}: {
  initialData?: HomeInitialData;
  feedbacks?: any[];
}) {
  const { language, t, contacts } = useI18n();
  const allCategoriesState = useOverlayState();
  const router = useRouter();

  // Core Data preloaded from server or state
  const [sections, setSections] = useState<SectionDto[]>(initialData?.sections || []);
  const [tours, setTours] = useState<TourDto[]>(initialData?.tours || []);
  const [intercityRoutes, setIntercityRoutes] = useState<IntercityRouteDto[]>(initialData?.intercityRoutes || []);
  const [sharedRoutes, setSharedRoutes] = useState<SharedRouteDto[]>(initialData?.sharedRoutes || []);
  const [vehicles, setVehicles] = useState<SelfDriveVehicleItem[]>(initialData?.vehicles || []);
  const [airports, setAirports] = useState<AirportDto[]>(initialData?.airports || []);
  const [airportTransfers, setAirportTransfers] = useState<AirportPackageCard[]>(
    initialData?.airportTransfers || []
  );

  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState<DateValue | null>(null);
  const [time, setTime] = useState<TimeValue>({ hour: 8, minute: 0, period: "AM" });
  const [tripType, setTripType] = useState<"one-way" | "return">("one-way");
  const [passengers, setPassengers] = useState(1);
  const [luggage, setLuggage] = useState(0);

  // Active booking service tab
  const [activeServiceTab, setActiveServiceTab] = useState<"airport" | "rental" | "tour">("airport");

  // Car Rental Form state
  const [rentalType, setRentalType] = useState<"self" | "driver">("self");
  const [rentalTripType, setRentalTripType] = useState<"one-way" | "return">("one-way");
  const [rentalPickup, setRentalPickup] = useState("");
  const [rentalPickupSuggestions, setRentalPickupSuggestions] = useState<LocationSearchResult[]>([]);
  const [showRentalPickupSug, setShowRentalPickupSug] = useState(false);
  const [rentalDropoff, setRentalDropoff] = useState("");
  const [rentalDropoffSuggestions, setRentalDropoffSuggestions] = useState<LocationSearchResult[]>([]);
  const [showRentalDropoffSug, setShowRentalDropoffSug] = useState(false);
  const [rentalDate, setRentalDate] = useState<DateValue | null>(null);
  const [rentalGuests, setRentalGuests] = useState(1);
  const [rentalSeats, setRentalSeats] = useState<any>("4-seater");
  const [vehicleCategories, setVehicleCategories] = useState<VehicleCategoryDto[]>([]);
  const [selectedIntercityRouteId, setSelectedIntercityRouteId] = useState<number | null>(null);

  // Tours Form state
  const [tourKeyword, setTourKeyword] = useState("");
  const [tourPickup, setTourPickup] = useState("");
  const [tourPickupSuggestions, setTourPickupSuggestions] = useState<LocationSearchResult[]>([]);
  const [showTourPickupSug, setShowTourPickupSug] = useState(false);
  const [tourSearchQuery, setTourSearchQuery] = useState("");
  const [selectedTour, setSelectedTour] = useState<TourDto | null>(null);
  const [tourDate, setTourDate] = useState<DateValue | null>(null);
  const [tourGuests, setTourGuests] = useState(1);
  const [tourKeywordSuggestions, setTourKeywordSuggestions] = useState<TourDto[]>([]);
  const [showTourSug, setShowTourSug] = useState(false);
  const tourSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Airport Transfer — direction + address autocomplete
  const [selectedAirport, setSelectedAirport] = useState<AirportDto | null>(null);
  const [direction, setDirection] = useState<"to-nhatrang" | "to-airport">("to-nhatrang");
  const [pickupAddr, setPickupAddr] = useState("");
  const [dropoffAddr, setDropoffAddr] = useState("");
  const [pickupSuggestions, setPickupSuggestions] = useState<LocationSearchResult[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<LocationSearchResult[]>([]);
  const [showPickupSug, setShowPickupSug] = useState(false);
  const [showDropoffSug, setShowDropoffSug] = useState(false);

  // Hero banner is a fixed page header (always first).
  const heroSections = sections.filter((s) => s.sectionType === "HERO_BANNER");

  const systemCatalogSections = sections.filter((s) => s.sectionType === "SYSTEM_CATALOG");

  // All non-hero sections render in global orderIndex order (SYSTEM_CATALOG wins
  // ties). Singleton types are de-duplicated: seeds + template init can add
  // duplicate rows, which would render the same section twice.
  const orderedSections = useMemo(
    () =>
      sortSectionsForDisplay(
        dedupeSingletonSections(sections.filter((s) => s.sectionType !== "HERO_BANNER"))
      ),
    [sections]
  );

  // Extract destinations from SYSTEM_CATALOG section if present
  const destinationsData = useMemo(() => {
    const destSec = sections.find(
      (s) => s.sectionType === "SYSTEM_CATALOG" && s.contentData?.includes('"destinations"')
    );
    if (!destSec?.contentData) return [];
    try {
      const parsed = JSON.parse(destSec.contentData);
      if (Array.isArray(parsed.destinations)) {
        return parsed.destinations;
      }
    } catch {}
    return [];
  }, [sections]);

  // Initialize defaults if not already present
  useEffect(() => {
    if (airports.length > 0 && !selectedAirport) {
      const cxr = airports.find((a) => a.code === "CXR");
      setSelectedAirport(cxr || airports[0]);
    }
  }, [airports, selectedAirport]);

  // ponytail: chỉ chạy khi initialData vắng (defensive); build cards từ API như server preloader
  const loadClientAirportTransfers = async () => {
    const [catRes, apRes] = await Promise.all([
      getVehicleCategories({ active: true }, { skipTranslationFilter: true }),
      getActiveAirports(),
    ]);
    const cats = catRes?.data?.content || [];
    const aps = apRes?.data || [];
    if (cats.length === 0 || aps.length === 0) return;
    const defAp = aps.find((a) => a.code === "CXR") || aps[0];
    if (!defAp?.id) return;
    const routesRes = await getActiveAirportRoutes(defAp.id);
    const routes = routesRes?.data || [];
    const routePrices = await Promise.all(
      routes.map((r) => getAirportTransferPricesByRoute(r.id!).then((pr) => pr?.data || []))
    );
    setAirportTransfers(
      buildAirportSystemCards({
        categories: cats,
        minPrices: computeMinPricesByCategory(routePrices),
        resolveImageUrl: (url?: string) =>
          url ? (url.startsWith("http") ? url : `${backendUrl}${url}`) : "",
      })
    );
  };

  // If initialData was not provided, fallback to client fetch
  useEffect(() => {
    if (!initialData) {
      getVehicleCategories()
        .then((res) => {
          if (res?.data?.content) {
            setVehicleCategories(res.data.content);
            const defaultCat = res.data.content.find((c) => c.default);
            if (defaultCat) setRentalSeats(defaultCat.code);
          }
        })
        .catch(() => {});

      getTours({ size: 10 })
        .then((res) => {
          if (res?.data?.content) setTours(res.data.content);
        })
        .catch(() => {});

      getActiveIntercityRoutes()
        .then((res) => {
          if (res?.data) {
            const data = res.data as IntercityRouteDto[];
            setIntercityRoutes(data);
            if (data.length > 0) setSelectedIntercityRouteId(data[0].id);
          }
        })
        .catch(() => {});

      getSharedRoutes()
        .then((routes) => {
          if (Array.isArray(routes)) setSharedRoutes(routes);
        })
        .catch(() => {});

      getActiveAirports()
        .then((res) => {
          if (res?.data) {
            setAirports(res.data);
            const cxr = res.data.find((a) => a.code === "CXR");
            setSelectedAirport(cxr || res.data[0] || null);
          }
        })
        .catch(() => {});

      // ponytail: hiếm khi chạy (chỉ khi initialData vắng); chấp nhận fetch lại categories+airports
      loadClientAirportTransfers().catch(() => {});

      getActiveSections("/", language)
        .then((secList) => setSections(secList))
        .catch(() => {});
    }
  }, [initialData, language]);

  const activeHeroSection = heroSections[0] || null;
  const heroImages = (activeHeroSection?.imageUrls || []).filter(Boolean);
  const isMultiImage = heroImages.length > 1;
  const [currentHeroImage, setCurrentHeroImage] = useState(0);

  useEffect(() => {
    if (!isMultiImage) return;
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isMultiImage, heroImages.length]);

  const heroTitle = activeHeroSection
    ? activeHeroSection.translations?.find((tr) => tr.locale === language)?.title || t.homePage.heroTitle
    : t.homePage.heroTitle;
  const heroSubtitle = activeHeroSection
    ? activeHeroSection.translations?.find((tr) => tr.locale === language)?.description || t.homePage.heroSubtitle
    : t.homePage.heroSubtitle;

  return (
    <div className="relative flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative w-full min-h-[380px] md:min-h-[420px] flex flex-col justify-between items-center pt-12 md:pt-16 pb-0 overflow-visible">
        {/* Background Images */}
        {isMultiImage ? (
          <div className="absolute inset-0 overflow-hidden">
            {heroImages.map((url, idx) => (
              <div
                key={url + idx}
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out"
                style={{
                  backgroundImage: `url('${url}')`,
                  opacity: idx === currentHeroImage ? 1 : 0,
                }}
              />
            ))}
            <div className="absolute inset-0 bg-black/65 dark:bg-black/75 backdrop-blur-[1px]" />

            {/* Carousel dots */}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {heroImages.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentHeroImage(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all cursor-pointer border-none p-0 ${
                    idx === currentHeroImage ? "w-6 bg-white shadow-md" : "w-2 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div
            className="absolute inset-0 overflow-hidden bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: heroImages.length === 1 ? `url('${heroImages[0]}')` : undefined,
            }}
          >
            <div className="absolute inset-0 bg-black/65 dark:bg-black/75 backdrop-blur-[1px]" />
          </div>
        )}

        {/* Hero Content Stack */}
        <div className="relative z-10 w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 flex flex-col items-center justify-center text-center gap-4 my-auto pt-4 pb-12">
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-md">
              {heroTitle.split(". ").map((part: string, idx: number, arr: string[]) => (
                <span key={part} className="block">
                  {part}
                  {idx < arr.length - 1 ? "." : ""}
                </span>
              ))}
            </h1>
            <FormattedDescription
              description={heroSubtitle}
              className="text-base sm:text-lg text-white/90 drop-shadow-sm font-semibold max-w-2xl mx-auto"
            />
          </div>
        </div>

        {/* Horizontal Quick Booking Bar */}
        <div className="w-full relative z-30 max-w-5xl mx-auto -mb-20 sm:-mb-24 px-2 sm:px-4">
          <UnifiedBookingBar />
        </div>
      </section>

      {/* Quick Category Navigation Strip under Hero */}
      <div className="pt-24 sm:pt-28 md:pt-32 pb-4">
        <QuickCategoryNav onOpenAllCategories={() => allCategoriesState.open()} />
      </div>

      {/* All non-hero sections render in global orderIndex order */}
      {systemCatalogSections.length > 0 ? (
        <SectionRenderer
          sections={orderedSections}
          locale={language}
          systemData={{
            tours,
            vehicles,
            routes: intercityRoutes,
            sharedRoutes,
            airportTransfers,
          }}
        />
      ) : (
        /* Default Rich Layout when Admin has not initialized SYSTEM_CATALOG sections */
        <>
          <HomeDestinationSection destinations={destinationsData} />
          <HomeToursSection tours={tours} />
          <HomeSelfDriveSection vehicles={vehicles} />
          <HomeIntercitySection routes={intercityRoutes} sharedRoutes={sharedRoutes} />
          <HomeAirportTransferSection packages={airportTransfers} />
          <SectionRenderer
            sections={orderedSections}
            locale={language}
            systemData={{
              tours,
              vehicles,
              routes: intercityRoutes,
              sharedRoutes,
              airportTransfers,
            }}
          />
        </>
      )}

      {/* All Categories Drawer */}
      <AllCategoriesDrawer state={allCategoriesState} />
    </div>
  );
}
