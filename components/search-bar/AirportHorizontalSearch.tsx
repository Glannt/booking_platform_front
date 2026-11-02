"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  MapPin,
  Calendar as CalendarIcon,
  Users,
  Search,
  ArrowRightLeft,
  Check,
  Clock
} from "lucide-react";
import { useI18n } from "@/context/LanguageContext";
import { SearchSegment } from "./SearchSegment";
import { Calendar } from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { today, getLocalTimeZone } from "@internationalized/date";
import { getActiveAirports, AirportDto } from "@/lib/api/fleet";

interface AirportHorizontalSearchProps {
  className?: string;
  isCard?: boolean;
}

export function AirportHorizontalSearch({
  className = "",
  isCard = true,
}: AirportHorizontalSearchProps) {
  const router = useRouter();
  const { language, t } = useI18n();

  // Core filter states
  const [direction, setDirection] = useState<"to-nhatrang" | "to-airport">("to-nhatrang");
  const [tripType, setTripType] = useState<"one-way" | "return">("one-way");
  const [searchByFlight, setSearchByFlight] = useState<boolean>(false);

  // Locations
  const [airports, setAirports] = useState<AirportDto[]>([]);
  const [selectedAirport, setSelectedAirport] = useState<AirportDto | null>(null);
  const [hotelAddress, setHotelAddress] = useState<string>("Nha Trang");
  const [flightNumber, setFlightNumber] = useState<string>("");

  // Date & Time
  const now = today(getLocalTimeZone());
  const [dateValue, setDateValue] = useState<DateValue>(now);
  const [timeHour, setTimeHour] = useState<string>("08");
  const [timeMinute, setTimeMinute] = useState<string>("00");
  const [passengers, setPassengers] = useState<number>(2);

  // Active Dropdowns
  const [activeDropdown, setActiveDropdown] = useState<"from" | "to" | "datetime" | "passengers" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Airports
  useEffect(() => {
    getActiveAirports()
      .then((res) => {
        const list = res.data || [];
        setAirports(list);
        if (list.length > 0) {
          // Default to Cam Ranh (CXR) if available
          const cxr = list.find((a) => a.code === "CXR") || list[0];
          setSelectedAirport(cxr);
        }
      })
      .catch(() => {});
  }, []);

  const handleSwapDirection = () => {
    setDirection((prev) => (prev === "to-nhatrang" ? "to-airport" : "to-nhatrang"));
  };

  const getAirportDisplayName = (airport: AirportDto | null) => {
    if (!airport) return t.airportTransfer?.selectAirport || "Chọn sân bay";
    const tr = airport.translations?.find((tr) => tr.locale === language);
    return tr?.name || airport.name;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    params.set("direction", direction);
    params.set("tripType", tripType);
    if (selectedAirport) params.set("airportId", String(selectedAirport.id));
    if (hotelAddress.trim()) params.set("address", hotelAddress.trim());
    if (dateValue) params.set("date", dateValue.toString());
    params.set("time", `${timeHour}:${timeMinute}`);
    params.set("passengers", String(passengers));
    if (searchByFlight && flightNumber.trim()) {
      params.set("flightNumber", flightNumber.trim().toUpperCase());
    }

    setActiveDropdown(null);
    router.push(`/${language}/airport-transfer?${params.toString()}`);
  };

  return (
    <div
      ref={containerRef}
      className={`w-full ${
        isCard
          ? "bg-white dark:bg-[var(--bg-surface)] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-border"
          : ""
      } flex flex-col gap-3.5 ${className}`}
    >
      {/* Top Options Bar (Direction & Mode Toggles) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        {/* Direction Switcher */}
        <div className="inline-flex items-center bg-black/5 dark:bg-[var(--bg-card)] p-1 rounded-2xl border border-border">
          <button
            type="button"
            onClick={() => setDirection("to-nhatrang")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer border-none ${
              direction === "to-nhatrang"
                ? "bg-white dark:bg-[var(--bg-elevated)] text-accent shadow-xs"
                : "text-foreground/70 hover:text-foreground"
            }`}
          >
            <PlaneLanding size={13} />
            <span>{t.homePage?.toNhaTrang || "Đón sân bay"}</span>
          </button>
          <button
            type="button"
            onClick={() => setDirection("to-airport")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer border-none ${
              direction === "to-airport"
                ? "bg-white dark:bg-[var(--bg-elevated)] text-accent shadow-xs"
                : "text-foreground/70 hover:text-foreground"
            }`}
          >
            <PlaneTakeoff size={13} />
            <span>{t.homePage?.toAirport || "Tiễn sân bay"}</span>
          </button>
        </div>

        {/* Trip Type & Search Mode */}
        <div className="flex items-center gap-2">
          {/* One-way vs Return */}
          <div className="inline-flex items-center bg-black/5 dark:bg-[var(--bg-card)] p-1 rounded-2xl border border-border">
            <button
              type="button"
              onClick={() => setTripType("one-way")}
              className={`px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer border-none ${
                tripType === "one-way"
                  ? "bg-white dark:bg-[var(--bg-elevated)] text-foreground shadow-xs"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              {t.homePage?.oneWay || "Một chiều"}
            </button>
            <button
              type="button"
              onClick={() => setTripType("return")}
              className={`px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer border-none ${
                tripType === "return"
                  ? "bg-white dark:bg-[var(--bg-elevated)] text-foreground shadow-xs"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              {t.homePage?.returnTrip || "Khứ hồi"}
            </button>
          </div>

          {/* Sub-toggle: By Flight Number */}
          <button
            type="button"
            onClick={() => setSearchByFlight(!searchByFlight)}
            className={`px-3 py-1.5 rounded-2xl font-bold transition-all border cursor-pointer ${
              searchByFlight
                ? "bg-accent/10 dark:bg-accent/20 border-accent text-accent font-extrabold"
                : "bg-white dark:bg-[var(--bg-card)] border-border text-foreground/70 hover:border-foreground/30"
            }`}
          >
            {t.myBookings?.flightNumber || "Số hiệu chuyến bay"}
          </button>
        </div>
      </div>

      {/* Main Horizontal Search Bar Container */}
      <form
        onSubmit={handleSearch}
        className="relative w-full bg-black/5 dark:bg-[var(--bg-card)] rounded-2xl sm:rounded-3xl p-1.5 sm:p-2 border border-border shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-1.5 sm:gap-2"
      >
        {/* Segment 1: From */}
        <div className="relative flex-1 min-w-0">
          {direction === "to-nhatrang" ? (
            <SearchSegment
              icon={<Plane size={18} />}
              label={t.myBookings?.pickup || "Điểm đón (Sân bay)"}
              value={getAirportDisplayName(selectedAirport)}
              hasDropdown
              isActive={activeDropdown === "from"}
              onClick={() => setActiveDropdown(activeDropdown === "from" ? null : "from")}
            />
          ) : (
            <SearchSegment
              icon={<MapPin size={18} />}
              label={t.myBookings?.pickup || "Điểm đón (Khách sạn / Địa chỉ)"}
              value={hotelAddress}
              placeholder="Nhập tên khách sạn, địa chỉ đón..."
              onClear={() => setHotelAddress("")}
            >
              <input
                type="text"
                value={hotelAddress}
                onChange={(e) => setHotelAddress(e.target.value)}
                placeholder="Nhập khách sạn, địa chỉ đón..."
                className="w-full bg-transparent text-xs sm:text-sm font-bold text-foreground placeholder:text-foreground/40 outline-none border-none p-0"
              />
            </SearchSegment>
          )}

          {/* Airport Dropdown Popover */}
          {activeDropdown === "from" && direction === "to-nhatrang" && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-[var(--bg-card)] border border-border rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/60 px-3 py-1.5">
                {t.homePage?.airportTransfer || "Danh sách sân bay"}
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {airports.map((a) => {
                  const isSelected = selectedAirport?.id === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setSelectedAirport(a);
                        setActiveDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer border-none ${
                        isSelected
                          ? "bg-accent/10 dark:bg-accent/20 text-accent font-bold"
                          : "hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] text-foreground"
                      }`}
                    >
                      <div className="flex flex-col truncate">
                        <span className="truncate">{getAirportDisplayName(a)}</span>
                        {a.location && (
                          <span className="text-[10px] text-foreground/50 font-normal">{a.location}</span>
                        )}
                      </div>
                      {isSelected && <Check size={14} className="text-accent shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Swap button between From and To */}
        <button
          type="button"
          aria-label="Đổi hướng"
          onClick={handleSwapDirection}
          className="hidden md:flex p-2 rounded-full text-foreground/50 hover:text-accent hover:bg-black/5 dark:hover:bg-[var(--bg-card)] transition-colors shrink-0 border-none cursor-pointer"
        >
          <ArrowRightLeft size={14} />
        </button>

        {/* Segment 2: To */}
        <div className="relative flex-1 min-w-0 border-t md:border-t-0 md:border-l border-border">
          {direction === "to-nhatrang" ? (
            <SearchSegment
              icon={<MapPin size={18} />}
              label={t.myBookings?.dropoff || "Điểm đến (Khách sạn / Địa chỉ)"}
              value={hotelAddress}
              placeholder="Nhập tên khách sạn, địa chỉ đến..."
              onClear={() => setHotelAddress("")}
            >
              <input
                type="text"
                value={hotelAddress}
                onChange={(e) => setHotelAddress(e.target.value)}
                placeholder="Nhập khách sạn, địa chỉ..."
                className="w-full bg-transparent text-xs sm:text-sm font-bold text-foreground placeholder:text-foreground/40 outline-none border-none p-0"
              />
            </SearchSegment>
          ) : (
            <SearchSegment
              icon={<Plane size={18} />}
              label={t.myBookings?.dropoff || "Điểm đến (Sân bay)"}
              value={getAirportDisplayName(selectedAirport)}
              hasDropdown
              isActive={activeDropdown === "to"}
              onClick={() => setActiveDropdown(activeDropdown === "to" ? null : "to")}
            />
          )}

          {/* Airport Dropdown Popover for To */}
          {activeDropdown === "to" && direction === "to-airport" && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-[var(--bg-card)] border border-border rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/60 px-3 py-1.5">
                {t.homePage?.airportTransfer || "Danh sách sân bay"}
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {airports.map((a) => {
                  const isSelected = selectedAirport?.id === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setSelectedAirport(a);
                        setActiveDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer border-none ${
                        isSelected
                          ? "bg-accent/10 dark:bg-accent/20 text-accent font-bold"
                          : "hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] text-foreground"
                      }`}
                    >
                      <div className="flex flex-col truncate">
                        <span className="truncate">{getAirportDisplayName(a)}</span>
                        {a.location && (
                          <span className="text-[10px] text-foreground/50 font-normal">{a.location}</span>
                        )}
                      </div>
                      {isSelected && <Check size={14} className="text-accent shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Segment 3: Date & Time */}
        <div className="relative flex-1 min-w-0 border-t md:border-t-0 md:border-l border-border">
          <SearchSegment
            icon={<CalendarIcon size={18} />}
            label={t.homePage?.dateLabel || "Ngày & Giờ đi"}
            value={`${dateValue.toString()} · ${timeHour}:${timeMinute}`}
            hasDropdown
            isActive={activeDropdown === "datetime"}
            onClick={() => setActiveDropdown(activeDropdown === "datetime" ? null : "datetime")}
          />

          {/* Date & Time Popover */}
          {activeDropdown === "datetime" && (
            <div className="absolute top-full left-0 md:left-auto md:right-0 mt-2 bg-white dark:bg-[var(--bg-surface)] border border-border rounded-3xl p-4 shadow-2xl z-50 w-80 sm:w-96 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs font-black uppercase text-foreground">
                  {t.homePage?.dateLabel || "Chọn ngày & Giờ"}
                </span>
                <span className="text-xs font-bold text-accent">
                  {dateValue.toString()} · {timeHour}:{timeMinute}
                </span>
              </div>

              {/* Calendar */}
              <Calendar
                aria-label="Pick travel date"
                value={dateValue as any}
                onChange={(val) => {
                  if (val) setDateValue(val as DateValue);
                }}
                minValue={now as any}
              >
                <Calendar.Header className="flex items-center justify-between mb-2">
                  <Calendar.YearPickerTrigger className="text-xs font-bold flex items-center gap-1 cursor-pointer">
                    <Calendar.YearPickerTriggerHeading />
                    <Calendar.YearPickerTriggerIndicator />
                  </Calendar.YearPickerTrigger>
                  <div className="flex gap-1">
                    <Calendar.NavButton slot="previous" className="p-1 rounded hover:bg-black/5 dark:hover:bg-[var(--bg-card)] cursor-pointer" />
                    <Calendar.NavButton slot="next" className="p-1 rounded hover:bg-black/5 dark:hover:bg-[var(--bg-card)] cursor-pointer" />
                  </div>
                </Calendar.Header>
                <Calendar.Grid className="w-full">
                  <Calendar.GridHeader className="text-[10px] font-bold text-foreground/50">
                    {(day) => <Calendar.HeaderCell className="w-8 h-8 text-center">{day}</Calendar.HeaderCell>}
                  </Calendar.GridHeader>
                  <Calendar.GridBody>
                    {(date) => (
                      <Calendar.Cell
                        date={date}
                        className="w-8 h-8 text-xs font-semibold text-center cursor-pointer rounded-lg hover:bg-accent/10 hover:text-accent aria-selected:bg-accent aria-selected:text-accent-foreground"
                      />
                    )}
                  </Calendar.GridBody>
                </Calendar.Grid>
              </Calendar>

              {/* Time Selector */}
              <div className="flex items-center justify-between bg-black/5 dark:bg-[var(--bg-card)] p-2 rounded-2xl border border-border">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Clock size={15} className="text-accent" />
                  <span>{t.homePage?.time || "Giờ khởi hành"}:</span>
                </div>
                <div className="flex items-center gap-1">
                  <select
                    value={timeHour}
                    onChange={(e) => setTimeHour(e.target.value)}
                    className="bg-white dark:bg-[var(--bg-surface)] border border-border text-foreground rounded-lg px-2 py-1 text-xs font-bold outline-none cursor-pointer"
                  >
                    {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span className="font-bold text-foreground">:</span>
                  <select
                    value={timeMinute}
                    onChange={(e) => setTimeMinute(e.target.value)}
                    className="bg-white dark:bg-[var(--bg-surface)] border border-border text-foreground rounded-lg px-2 py-1 text-xs font-bold outline-none cursor-pointer"
                  >
                    {["00", "15", "30", "45"].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveDropdown(null)}
                className="w-full py-2 bg-accent hover:bg-accent-hover text-accent-foreground font-black text-xs rounded-xl transition-colors cursor-pointer border-none"
              >
                Xác nhận ngày & giờ
              </button>
            </div>
          )}
        </div>

        {/* Segment 4: Passengers */}
        <div className="relative flex-none md:w-36 border-t md:border-t-0 md:border-l border-border">
          <SearchSegment
            icon={<Users size={18} />}
            label={t.homePage?.passengers || "Hành khách"}
            value={`${passengers} ${t.homePage?.passengers ? "" : "khách"}`}
            hasDropdown
            isActive={activeDropdown === "passengers"}
            onClick={() => setActiveDropdown(activeDropdown === "passengers" ? null : "passengers")}
          />

          {/* Passengers Popover */}
          {activeDropdown === "passengers" && (
            <div className="absolute top-full right-0 mt-2 bg-white dark:bg-[var(--bg-card)] border border-border rounded-2xl p-3 shadow-2xl z-50 w-52 animate-in fade-in slide-in-from-top-2">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/60 mb-2">
                {t.homePage?.passengers || "Số hành khách"}
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  disabled={passengers <= 1}
                  onClick={() => setPassengers((p) => Math.max(1, p - 1))}
                  className="w-8 h-8 rounded-xl bg-black/5 dark:bg-[var(--bg-elevated)] hover:bg-black/10 dark:hover:bg-[var(--bg-surface)] text-foreground disabled:opacity-40 font-bold text-sm cursor-pointer border-none transition-colors"
                >
                  -
                </button>
                <span className="text-sm font-black text-foreground">
                  {passengers}
                </span>
                <button
                  type="button"
                  disabled={passengers >= 16}
                  onClick={() => setPassengers((p) => Math.min(16, p + 1))}
                  className="w-8 h-8 rounded-xl bg-black/5 dark:bg-[var(--bg-elevated)] hover:bg-black/10 dark:hover:bg-[var(--bg-surface)] text-foreground disabled:opacity-40 font-bold text-sm cursor-pointer border-none transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Flight Number (if enabled) */}
        {searchByFlight && (
          <div className="relative flex-none md:w-40 border-t md:border-t-0 md:border-l border-border">
            <SearchSegment
              icon={<Plane size={18} />}
              label={t.myBookings?.flightNumber || "Mã chuyến bay"}
              value={flightNumber}
              placeholder="VD: VN123"
              onClear={() => setFlightNumber("")}
            >
              <input
                type="text"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                placeholder="VD: VN123"
                className="w-full bg-transparent text-xs sm:text-sm font-bold text-foreground placeholder:text-foreground/40 uppercase outline-none border-none p-0"
              />
            </SearchSegment>
          </div>
        )}

        {/* Action Button: Search */}
        <div className="shrink-0 p-1">
          <button
            type="submit"
            className="w-full md:w-auto h-12 md:h-13 px-6 sm:px-8 bg-accent hover:bg-accent-hover text-accent-foreground font-black text-sm rounded-xl sm:rounded-2xl shadow-md transition-all cursor-pointer border-none flex items-center justify-center gap-2"
          >
            <Search size={16} />
            <span>{t.homePage?.searchBtn || "Tìm kiếm"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
