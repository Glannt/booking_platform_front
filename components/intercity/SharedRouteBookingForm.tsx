"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  Label,
  ListBox,
  DatePicker,
  DateField,
  Calendar,
  Button,
  Input,
  TextField,
  TextArea,
  Typography,
} from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { getLocalTimeZone, today } from "@internationalized/date";
import {
  Bus,
  Clock,
  MapPin,
  Building2,
  Users,
  ArrowRight,
  ChevronRight,
  DollarSign,
} from "lucide-react";
import { useI18n } from "@/context/LanguageContext";
import {
  getSharedRoutes,
  getDayOfWeekFromDate,
  type SharedRouteDto,
  type SharedRouteDirectionDto,
  type SharedOfficeDto,
  type PickupType,
} from "@/lib/api/sharedRoute";

interface SharedRouteBookingFormProps {
  initialRouteId?: number;
}

export function SharedRouteBookingForm({ initialRouteId }: SharedRouteBookingFormProps) {
  const { language, t } = useI18n();
  const router = useRouter();

  const prefixUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const segments = url.split("/");
    if (segments.length > 1 && ["vi", "en", "ko", "ru"].includes(segments[1])) return url;
    return `/${language}${url === "/" ? "" : url}`;
  };

  const currentDate = today(getLocalTimeZone());

  const [routes, setRoutes] = useState<SharedRouteDto[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [tripType, setTripType] = useState<"one-way" | "return">("one-way");

  // Outbound state
  const [outboundDate, setOutboundDate] = useState<DateValue | null>(currentDate);
  const [outboundScheduleId, setOutboundScheduleId] = useState<number | null>(null);
  const [outboundPickupType, setOutboundPickupType] = useState<PickupType>("OFFICE");
  const [outboundPickupOfficeId, setOutboundPickupOfficeId] = useState<number | null>(null);
  const [outboundPickupAddress, setOutboundPickupAddress] = useState("");
  const [outboundDropoffType, setOutboundDropoffType] = useState<PickupType>("OFFICE");
  const [outboundDropoffOfficeId, setOutboundDropoffOfficeId] = useState<number | null>(null);
  const [outboundDropoffAddress, setOutboundDropoffAddress] = useState("");

  // Return state
  const [returnDate, setReturnDate] = useState<DateValue | null>(currentDate);
  const [returnScheduleId, setReturnScheduleId] = useState<number | null>(null);
  const [returnPickupType, setReturnPickupType] = useState<PickupType>("OFFICE");
  const [returnPickupOfficeId, setReturnPickupOfficeId] = useState<number | null>(null);
  const [returnPickupAddress, setReturnPickupAddress] = useState("");
  const [returnDropoffType, setReturnDropoffType] = useState<PickupType>("OFFICE");
  const [returnDropoffOfficeId, setReturnDropoffOfficeId] = useState<number | null>(null);
  const [returnDropoffAddress, setReturnDropoffAddress] = useState("");

  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    getSharedRoutes(true)
      .then((data) => {
        setRoutes(data);
        if (data.length > 0) {
          const matched = initialRouteId ? data.find((r) => r.id === initialRouteId) : null;
          const target = matched || data[0];
          setSelectedRouteId(target.id!);
        }
      })
      .catch(() => {});
  }, [initialRouteId]);

  const currentRoute = useMemo(() => {
    return routes.find((r) => r.id === selectedRouteId);
  }, [routes, selectedRouteId]);

  const outboundDir = useMemo(() => {
    return currentRoute?.directions?.find((d) => d.directionType === "OUTBOUND");
  }, [currentRoute]);

  const returnDir = useMemo(() => {
    return currentRoute?.directions?.find((d) => d.directionType === "RETURN");
  }, [currentRoute]);

  // Day of week calculation and schedule filtering
  const outboundDayOfWeek = useMemo(() => {
    if (!outboundDate) return null;
    const iso = `${outboundDate.year}-${String(outboundDate.month).padStart(2, "0")}-${String(outboundDate.day).padStart(2, "0")}`;
    return getDayOfWeekFromDate(iso);
  }, [outboundDate]);

  const availableOutboundSchedules = useMemo(() => {
    if (!outboundDir?.schedules) return [];
    const activeList = outboundDir.schedules.filter((s) => s.active !== false);
    if (!outboundDayOfWeek) return activeList;
    return activeList.filter((s) => {
      if (!s.operatingDays || s.operatingDays.length === 0) return true;
      return s.operatingDays.includes(outboundDayOfWeek);
    });
  }, [outboundDir, outboundDayOfWeek]);

  const returnDayOfWeek = useMemo(() => {
    if (!returnDate) return null;
    const iso = `${returnDate.year}-${String(returnDate.month).padStart(2, "0")}-${String(returnDate.day).padStart(2, "0")}`;
    return getDayOfWeekFromDate(iso);
  }, [returnDate]);

  const availableReturnSchedules = useMemo(() => {
    if (!returnDir?.schedules) return [];
    const activeList = returnDir.schedules.filter((s) => s.active !== false);
    if (!returnDayOfWeek) return activeList;
    return activeList.filter((s) => {
      if (!s.operatingDays || s.operatingDays.length === 0) return true;
      return s.operatingDays.includes(returnDayOfWeek);
    });
  }, [returnDir, returnDayOfWeek]);

  // Set default schedules & offices when route/direction changes
  useEffect(() => {
    if (outboundDir) {
      if (outboundDir.originOffices && outboundDir.originOffices.length > 0) {
        setOutboundPickupOfficeId(outboundDir.originOffices[0].id!);
      } else {
        setOutboundPickupType("DOOR");
      }
      if (outboundDir.destinationOffices && outboundDir.destinationOffices.length > 0) {
        setOutboundDropoffOfficeId(outboundDir.destinationOffices[0].id!);
      } else {
        setOutboundDropoffType("DOOR");
      }
    }
  }, [outboundDir]);

  useEffect(() => {
    if (availableOutboundSchedules.length > 0) {
      if (!outboundScheduleId || !availableOutboundSchedules.some((s) => s.id === outboundScheduleId)) {
        setOutboundScheduleId(availableOutboundSchedules[0].id!);
      }
    } else {
      setOutboundScheduleId(null);
    }
  }, [availableOutboundSchedules, outboundScheduleId]);

  useEffect(() => {
    if (returnDir) {
      if (returnDir.originOffices && returnDir.originOffices.length > 0) {
        setReturnPickupOfficeId(returnDir.originOffices[0].id!);
      } else {
        setReturnPickupType("DOOR");
      }
      if (returnDir.destinationOffices && returnDir.destinationOffices.length > 0) {
        setReturnDropoffOfficeId(returnDir.destinationOffices[0].id!);
      } else {
        setReturnDropoffType("DOOR");
      }
    }
  }, [returnDir]);

  useEffect(() => {
    if (availableReturnSchedules.length > 0) {
      if (!returnScheduleId || !availableReturnSchedules.some((s) => s.id === returnScheduleId)) {
        setReturnScheduleId(availableReturnSchedules[0].id!);
      }
    } else {
      setReturnScheduleId(null);
    }
  }, [availableReturnSchedules, returnScheduleId]);

  const outboundPrice = outboundDir?.price || 0;
  const returnPrice = tripType === "return" ? (returnDir?.price || 0) : 0;
  const unitPrice = outboundPrice + returnPrice;
  const totalPrice = unitPrice * passengerCount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoute || !outboundDir) {
      alert("Vui lòng chọn tuyến xe ghép.");
      return;
    }

    if (!outboundDate) {
      alert("Vui lòng chọn ngày xuất phát.");
      return;
    }

    const isoOutDate = `${outboundDate.year}-${String(outboundDate.month).padStart(2, "0")}-${String(outboundDate.day).padStart(2, "0")}`;

    const params = new URLSearchParams({
      serviceType: "SHARED",
      sharedRouteId: String(currentRoute.id),
      sharedRouteName: currentRoute.name,
      sharedTripType: tripType,
      pax: String(passengerCount),

      // Outbound
      directionId: String(outboundDir.id),
      scheduleId: String(outboundScheduleId || outboundDir.schedules?.[0]?.id || ""),
      tripDate: isoOutDate,
      pickupType: outboundPickupType,
      pickupOfficeId: outboundPickupType === "OFFICE" ? String(outboundPickupOfficeId || "") : "",
      pickupAddress: outboundPickupType === "DOOR" ? outboundPickupAddress : "",
      dropoffType: outboundDropoffType,
      dropoffOfficeId: outboundDropoffType === "OFFICE" ? String(outboundDropoffOfficeId || "") : "",
      dropoffAddress: outboundDropoffType === "DOOR" ? outboundDropoffAddress : "",
    });

    if (tripType === "return" && returnDir && returnDate) {
      const isoRetDate = `${returnDate.year}-${String(returnDate.month).padStart(2, "0")}-${String(returnDate.day).padStart(2, "0")}`;
      params.set("returnDirectionId", String(returnDir.id));
      params.set("returnScheduleId", String(returnScheduleId || returnDir.schedules?.[0]?.id || ""));
      params.set("returnTripDate", isoRetDate);
      params.set("returnPickupType", returnPickupType);
      params.set("returnPickupOfficeId", returnPickupType === "OFFICE" ? String(returnPickupOfficeId || "") : "");
      params.set("returnPickupAddress", returnPickupType === "DOOR" ? returnPickupAddress : "");
      params.set("returnDropoffType", returnDropoffType);
      params.set("returnDropoffOfficeId", returnDropoffType === "OFFICE" ? String(returnDropoffOfficeId || "") : "");
      params.set("returnDropoffAddress", returnDropoffType === "DOOR" ? returnDropoffAddress : "");
    }

    if (customerName.trim()) params.set("customerName", customerName.trim());
    if (customerEmail.trim()) params.set("customerEmail", customerEmail.trim());
    if (customerPhone.trim()) params.set("customerPhone", customerPhone.trim());
    if (notes.trim()) params.set("notes", notes.trim());

    router.push(prefixUrl(`/intercity/confirm?${params.toString()}`));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Route Selector & Trip Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div className="flex flex-col w-full">
          <Select
            isRequired
            className="w-full"
            placeholder={t.rentCar.selectRoute}
            selectedKey={selectedRouteId != null ? String(selectedRouteId) : undefined}
            onSelectionChange={(key) => {
              if (key) setSelectedRouteId(Number(key));
            }}
          >
            <Label isRequired className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider mb-1.5 pl-1">
              {t.rentCar.route}
            </Label>
            <Select.Trigger className="h-10 bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl px-3 w-full">
              <Select.Value className="text-xs sm:text-sm font-semibold truncate text-left w-full block pr-4" />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xl">
              <ListBox>
                {routes.map((r) => (
                  <ListBox.Item
                    id={String(r.id)}
                    key={r.id}
                    textValue={r.name}
                    className="text-xs font-semibold px-3 py-2 hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] rounded-lg cursor-pointer"
                  >
                    {r.name} ({r.vehicleName || "Limousine"})
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        {/* 1 Chiều / Khứ hồi */}
        <div className="flex flex-col w-full">
          <Label className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider mb-1.5 pl-1">
            {t.rentCar.tripType || "Hình thức vé"}
          </Label>
          <div className="flex bg-slate-50 dark:bg-[var(--bg-card)] p-1 rounded-xl w-full border border-slate-200/50 dark:border-slate-800 h-10">
            <button
              type="button"
              onClick={() => setTripType("one-way")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tripType === "one-way"
                  ? "bg-white dark:bg-[var(--bg-surface)] text-accent dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
              }`}
            >
              {t.rentCar.oneWay}
            </button>
            <button
              type="button"
              onClick={() => setTripType("return")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tripType === "return"
                  ? "bg-white dark:bg-[var(--bg-surface)] text-accent dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
              }`}
            >
              {t.rentCar.roundTrip}
            </button>
          </div>
        </div>
      </div>

      {/* Outbound Leg Card */}
      {outboundDir && (
        <div className="p-4 bg-slate-50/70 dark:bg-[var(--bg-card)] rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-white">
                {t.rentCar.outboundTrip}: {outboundDir.originCity} ➔ {outboundDir.destinationCity}
              </span>
            </div>
            <span className="text-xs font-extrabold text-accent">
              {Number(outboundDir.price).toLocaleString()} VND / vé
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Departure Date */}
            <DatePicker
              isRequired
              className="w-full"
              minValue={currentDate}
              value={outboundDate}
              onChange={(val) => setOutboundDate(val)}
            >
              <Label isRequired className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider mb-1.5 pl-1">
                {t.rentCar.startDate || "Ngày đi"}
              </Label>
              <DateField.Group fullWidth className="h-10 bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex items-center justify-between">
                <DateField.Input className="text-xs font-semibold bg-transparent border-none outline-none">
                  {(segment) => <DateField.Segment segment={segment} />}
                </DateField.Input>
                <DateField.Suffix>
                  <DatePicker.Trigger className="cursor-pointer">
                    <DatePicker.TriggerIndicator />
                  </DatePicker.Trigger>
                </DateField.Suffix>
              </DateField.Group>
              <DatePicker.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-50">
                <Calendar aria-label="Outbound date">
                  <Calendar.Header className="flex items-center justify-between mb-2">
                    <Calendar.YearPickerTrigger className="text-xs font-bold flex items-center gap-1 cursor-pointer">
                      <Calendar.YearPickerTriggerHeading />
                      <Calendar.YearPickerTriggerIndicator />
                    </Calendar.YearPickerTrigger>
                    <div className="flex gap-1">
                      <Calendar.NavButton slot="previous" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer" />
                      <Calendar.NavButton slot="next" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer" />
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

            {/* Departure Times Chips */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider pl-1">
                {t.rentCar.selectOutboundTime || "Giờ xuất phát chiều đi"}
              </Label>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {availableOutboundSchedules.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setOutboundScheduleId(s.id!)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      outboundScheduleId === s.id
                        ? "bg-accent text-white shadow-sm"
                        : "bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-accent"
                    }`}
                  >
                    <Clock size={13} />
                    {s.departureTime.substring(0, 5)}
                  </button>
                ))}
                {availableOutboundSchedules.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                    Không có chuyến xe chạy vào ngày này. Vui lòng chọn ngày khác.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Pickup & Dropoff Outbound */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Outbound Pickup */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {t.rentCar.pickupAddress || "Điểm đón"} ({outboundDir.originCity})
                </Label>
                <div className="flex gap-1 bg-slate-200 dark:bg-[var(--bg-elevated)] p-0.5 rounded-lg text-[10px]">
                  <button
                    type="button"
                    onClick={() => setOutboundPickupType("OFFICE")}
                    className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      outboundPickupType === "OFFICE"
                        ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Văn phòng
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutboundPickupType("DOOR")}
                    className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      outboundPickupType === "DOOR"
                        ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Tận nơi
                  </button>
                </div>
              </div>

              {outboundPickupType === "OFFICE" ? (
                <Select
                  className="w-full"
                  selectedKey={outboundPickupOfficeId != null ? String(outboundPickupOfficeId) : undefined}
                  onSelectionChange={(key) => {
                    if (key) setOutboundPickupOfficeId(Number(key));
                  }}
                >
                  <Select.Trigger className="h-10 bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl px-3 w-full">
                    <Select.Value className="text-xs font-semibold truncate text-left w-full block pr-4" />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xl">
                    <ListBox>
                      {(outboundDir.originOffices || []).map((off) => (
                        <ListBox.Item
                          key={off.id}
                          id={String(off.id)}
                          textValue={off.name}
                          className="text-xs font-semibold px-3 py-2 hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] rounded-lg cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span>{off.name}</span>
                            <span className="text-[10px] text-slate-400">{off.address}</span>
                          </div>
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              ) : (
                <Input
                  type="text"
                  placeholder="Nhập địa chỉ đón tận nơi (số nhà, đường...)"
                  value={outboundPickupAddress}
                  onChange={(e) => setOutboundPickupAddress(e.target.value)}
                  className="text-xs font-semibold bg-white dark:bg-[var(--bg-surface)]"
                />
              )}
            </div>

            {/* Outbound Dropoff */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {t.rentCar.dropoffAddress || "Điểm trả"} ({outboundDir.destinationCity})
                </Label>
                <div className="flex gap-1 bg-slate-200 dark:bg-[var(--bg-elevated)] p-0.5 rounded-lg text-[10px]">
                  <button
                    type="button"
                    onClick={() => setOutboundDropoffType("OFFICE")}
                    className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      outboundDropoffType === "OFFICE"
                        ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Văn phòng
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutboundDropoffType("DOOR")}
                    className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      outboundDropoffType === "DOOR"
                        ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Tận nơi
                  </button>
                </div>
              </div>

              {outboundDropoffType === "OFFICE" ? (
                <Select
                  className="w-full"
                  selectedKey={outboundDropoffOfficeId != null ? String(outboundDropoffOfficeId) : undefined}
                  onSelectionChange={(key) => {
                    if (key) setOutboundDropoffOfficeId(Number(key));
                  }}
                >
                  <Select.Trigger className="h-10 bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl px-3 w-full">
                    <Select.Value className="text-xs font-semibold truncate text-left w-full block pr-4" />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xl">
                    <ListBox>
                      {(outboundDir.destinationOffices || []).map((off) => (
                        <ListBox.Item
                          key={off.id}
                          id={String(off.id)}
                          textValue={off.name}
                          className="text-xs font-semibold px-3 py-2 hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] rounded-lg cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span>{off.name}</span>
                            <span className="text-[10px] text-slate-400">{off.address}</span>
                          </div>
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              ) : (
                <Input
                  type="text"
                  placeholder="Nhập địa chỉ trả tận nơi (khách sạn, số nhà...)"
                  value={outboundDropoffAddress}
                  onChange={(e) => setOutboundDropoffAddress(e.target.value)}
                  className="text-xs font-semibold bg-white dark:bg-[var(--bg-surface)]"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Return Leg Card (If Round-trip) */}
      {tripType === "return" && returnDir && (
        <div className="p-4 bg-slate-50/70 dark:bg-[var(--bg-card)] rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-white">
                {t.rentCar.returnTrip}: {returnDir.originCity} ➔ {returnDir.destinationCity}
              </span>
            </div>
            <span className="text-xs font-extrabold text-accent">
              {Number(returnDir.price).toLocaleString()} VND / vé
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Return Date */}
            <DatePicker
              isRequired
              className="w-full"
              minValue={outboundDate || currentDate}
              value={returnDate}
              onChange={(val) => setReturnDate(val)}
            >
              <Label isRequired className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider mb-1.5 pl-1">
                {t.rentCar.endDate || "Ngày về"}
              </Label>
              <DateField.Group fullWidth className="h-10 bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex items-center justify-between">
                <DateField.Input className="text-xs font-semibold bg-transparent border-none outline-none">
                  {(segment) => <DateField.Segment segment={segment} />}
                </DateField.Input>
                <DateField.Suffix>
                  <DatePicker.Trigger className="cursor-pointer">
                    <DatePicker.TriggerIndicator />
                  </DatePicker.Trigger>
                </DateField.Suffix>
              </DateField.Group>
              <DatePicker.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-50">
                <Calendar aria-label="Return date">
                  <Calendar.Header className="flex items-center justify-between mb-2">
                    <Calendar.YearPickerTrigger className="text-xs font-bold flex items-center gap-1 cursor-pointer">
                      <Calendar.YearPickerTriggerHeading />
                      <Calendar.YearPickerTriggerIndicator />
                    </Calendar.YearPickerTrigger>
                    <div className="flex gap-1">
                      <Calendar.NavButton slot="previous" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer" />
                      <Calendar.NavButton slot="next" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer" />
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

            {/* Return Times Chips */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider pl-1">
                {t.rentCar.selectReturnTime || "Giờ xuất phát chiều về"}
              </Label>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {availableReturnSchedules.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setReturnScheduleId(s.id!)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      returnScheduleId === s.id
                        ? "bg-accent text-white shadow-sm"
                        : "bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-accent"
                    }`}
                  >
                    <Clock size={13} />
                    {s.departureTime.substring(0, 5)}
                  </button>
                ))}
                {availableReturnSchedules.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                    Không có chuyến xe chiều về vào ngày này. Vui lòng chọn ngày khác.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Pickup & Dropoff Return */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Return Pickup */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {t.rentCar.pickupAddress || "Điểm đón"} ({returnDir.originCity})
                </Label>
                <div className="flex gap-1 bg-slate-200 dark:bg-[var(--bg-elevated)] p-0.5 rounded-lg text-[10px]">
                  <button
                    type="button"
                    onClick={() => setReturnPickupType("OFFICE")}
                    className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      returnPickupType === "OFFICE"
                        ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Văn phòng
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnPickupType("DOOR")}
                    className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      returnPickupType === "DOOR"
                        ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Tận nơi
                  </button>
                </div>
              </div>

              {returnPickupType === "OFFICE" ? (
                <Select
                  className="w-full"
                  selectedKey={returnPickupOfficeId != null ? String(returnPickupOfficeId) : undefined}
                  onSelectionChange={(key) => {
                    if (key) setReturnPickupOfficeId(Number(key));
                  }}
                >
                  <Select.Trigger className="h-10 bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl px-3 w-full">
                    <Select.Value className="text-xs font-semibold truncate text-left w-full block pr-4" />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xl">
                    <ListBox>
                      {(returnDir.originOffices || []).map((off) => (
                        <ListBox.Item
                          key={off.id}
                          id={String(off.id)}
                          textValue={off.name}
                          className="text-xs font-semibold px-3 py-2 hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] rounded-lg cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span>{off.name}</span>
                            <span className="text-[10px] text-slate-400">{off.address}</span>
                          </div>
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              ) : (
                <Input
                  type="text"
                  placeholder="Nhập địa chỉ đón tận nơi (khách sạn, số nhà...)"
                  value={returnPickupAddress}
                  onChange={(e) => setReturnPickupAddress(e.target.value)}
                  className="text-xs font-semibold bg-white dark:bg-[var(--bg-surface)]"
                />
              )}
            </div>

            {/* Return Dropoff */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {t.rentCar.dropoffAddress || "Điểm trả"} ({returnDir.destinationCity})
                </Label>
                <div className="flex gap-1 bg-slate-200 dark:bg-[var(--bg-elevated)] p-0.5 rounded-lg text-[10px]">
                  <button
                    type="button"
                    onClick={() => setReturnDropoffType("OFFICE")}
                    className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      returnDropoffType === "OFFICE"
                        ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Văn phòng
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnDropoffType("DOOR")}
                    className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      returnDropoffType === "DOOR"
                        ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Tận nơi
                  </button>
                </div>
              </div>

              {returnDropoffType === "OFFICE" ? (
                <Select
                  className="w-full"
                  selectedKey={returnDropoffOfficeId != null ? String(returnDropoffOfficeId) : undefined}
                  onSelectionChange={(key) => {
                    if (key) setReturnDropoffOfficeId(Number(key));
                  }}
                >
                  <Select.Trigger className="h-10 bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl px-3 w-full">
                    <Select.Value className="text-xs font-semibold truncate text-left w-full block pr-4" />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xl">
                    <ListBox>
                      {(returnDir.destinationOffices || []).map((off) => (
                        <ListBox.Item
                          key={off.id}
                          id={String(off.id)}
                          textValue={off.name}
                          className="text-xs font-semibold px-3 py-2 hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] rounded-lg cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span>{off.name}</span>
                            <span className="text-[10px] text-slate-400">{off.address}</span>
                          </div>
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              ) : (
                <Input
                  type="text"
                  placeholder="Nhập địa chỉ trả tận nơi (số nhà, đường...)"
                  value={returnDropoffAddress}
                  onChange={(e) => setReturnDropoffAddress(e.target.value)}
                  className="text-xs font-semibold bg-white dark:bg-[var(--bg-surface)]"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Passenger Count & Price Box */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {t.rentCar.paxCount || "Số lượng vé"}:
          </Label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPassengerCount((p) => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-xl border border-border bg-white dark:bg-[var(--bg-surface)] font-bold text-base hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer"
            >
              -
            </button>
            <span className="w-8 text-center font-extrabold text-base text-slate-900 dark:text-white">
              {passengerCount}
            </span>
            <button
              type="button"
              onClick={() => setPassengerCount((p) => p + 1)}
              className="w-8 h-8 rounded-xl border border-border bg-white dark:bg-[var(--bg-surface)] font-bold text-base hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-border">
          <span className="text-xs text-slate-500 font-semibold">
            {passengerCount} vé × {unitPrice.toLocaleString()} VND =
          </span>
          <span className="text-base sm:text-lg font-black text-accent">
            {totalPrice.toLocaleString()} VND
          </span>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-3">
        <Typography.Heading level={5} className="font-extrabold text-slate-900 dark:text-white pl-1">
          {t.rentCar.contactInfo}
        </Typography.Heading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <TextField isRequired className="w-full">
            <Label isRequired className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider pl-1">
              {t.rentCar.fullName}
            </Label>
            <Input
              type="text"
              placeholder={t.common.name}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-[var(--bg-card)]"
            />
          </TextField>
          <TextField className="w-full">
            <Label className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider pl-1">
              Email
            </Label>
            <Input
              type="email"
              placeholder="example@gmail.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-[var(--bg-card)]"
            />
          </TextField>
          <TextField isRequired className="w-full">
            <Label isRequired className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider pl-1">
              {t.rentCar.phone}
            </Label>
            <Input
              type="tel"
              placeholder="0901 234 567"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-[var(--bg-card)]"
            />
          </TextField>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider pl-1">
          {t.rentCar.notes}
        </label>
        <TextArea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t.rentCar.notesPlaceholder}
          className="w-full h-16 p-3 bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-semibold outline-none resize-none focus:border-accent transition-colors"
        />
      </div>

      <Button
        type="submit"
        className="w-full h-11 sm:h-12 rounded-2xl font-black text-sm sm:text-base bg-accent text-white hover:bg-accent-hover shadow-md gap-2 border-none cursor-pointer"
      >
        <span>{t.common.bookNow} ({t.rentCar.sharedService})</span>
        <ArrowRight size={16} />
      </Button>
    </form>
  );
}

export default SharedRouteBookingForm;
