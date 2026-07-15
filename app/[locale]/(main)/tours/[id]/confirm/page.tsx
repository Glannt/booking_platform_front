"use client";

import React, { use, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, User, Phone, Mail, Calendar as IconCalendar, Users, MessageSquare, ClipboardList, Shield } from "lucide-react";
import { Button, DateField, DatePicker, Label, Calendar, Input, TextField, InputGroup, Description, Skeleton, Select, ListBox } from "@heroui/react";
import { getLocalTimeZone, today } from "@internationalized/date";
import type { DateValue } from "@internationalized/date";
import { TimePicker, TimeValue } from "@/components/time-picker";

import { getTourById, TourDto } from "@/lib/api/tours";
import { getVehicles, VehicleDto } from "@/lib/api/fleet";
import { createBooking } from "@/lib/api/bookings";
import { useI18n } from "@/context/LanguageContext";
import { formatPrice as _formatPrice } from "@/lib/format";
import BookingConfirmModal from "@/components/tours/BookingConfirmModal";
import dynamic from "next/dynamic";

const PickupMap = dynamic(
    () => import("@/components/pickup-map").then((mod) => mod.PickupMap),
    { ssr: false }
);

const resolveMediaUrl = (filePath: string): string => {
    return filePath.startsWith("http") ? filePath : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${filePath}`;
};

interface PageProps {
    params: Promise<{ id: string; locale: string }>;
}

export default function TourConfirmPage({ params }: PageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const resolvedParams = use(params);
    const id = Number(resolvedParams.id);
    const vehicleIdParam = Number(searchParams.get("vehicleId") || "1");
    const { language, t } = useI18n();
    const isVi = language === "vi";

    // Data states
    const [tour, setTour] = useState<TourDto | null>(null);
    const [vehicle, setVehicle] = useState<VehicleDto | null>(null);
    const [loading, setLoading] = useState(true);

    // Form states
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [contactChannel, setContactChannel] = useState<"zalo" | "kakaotalk">("zalo");
    const [contactId, setContactId] = useState("");
    const [notes, setNotes] = useState("");
    const [guestCount, setGuestCount] = useState<number>(1);
    const [dateValue, setDateValue] = useState<DateValue | null>(today(getLocalTimeZone()));
    const [startTimeVal, setStartTimeVal] = useState<TimeValue>({ hour: 8, minute: 0, period: "AM" });
    const [meetingPoint, setMeetingPoint] = useState("");
    const [idempotencyKey, setIdempotencyKey] = useState("");

    // Autocomplete & Map States
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [searchingLocation, setSearchingLocation] = useState(false);
    const [selectedLocationName, setSelectedLocationName] = useState("");
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Suggestions search effect
    useEffect(() => {
        if (!meetingPoint.trim() || meetingPoint === selectedLocationName) {
            setSuggestions([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setSearchingLocation(true);
            try {
                const query = `${meetingPoint}, Nha Trang, Khanh Hoa, Vietnam`;
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`
                );
                const data = await res.json();

                const formatted = data.map((item: any) => {
                    let name = item.display_name;
                    const parts = name.split(", ");
                    if (parts.length > 4) {
                        name = parts.slice(0, 4).join(", ");
                    }
                    return {
                        id: item.place_id,
                        name: name,
                        fullName: item.display_name,
                        lat: parseFloat(item.lat),
                        lon: parseFloat(item.lon),
                    };
                });

                setSuggestions(formatted);
                setShowSuggestions(formatted.length > 0);
            } catch (err) {
                console.error("Suggestions search error:", err);
            } finally {
                setSearchingLocation(false);
            }
        }, 600); // 600ms debounce

        return () => clearTimeout(delayDebounceFn);
    }, [meetingPoint, selectedLocationName]);

    // Click outside suggestions dropdown listener
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSelectSuggestion = (suggestion: any) => {
        setMeetingPoint(suggestion.name);
        setSelectedLocationName(suggestion.name);
        setSelectedCoords({ lat: suggestion.lat, lng: suggestion.lon });
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const handleMeetingPointChange = (val: string) => {
        setMeetingPoint(val);
        if (!val.trim()) {
            setSelectedCoords(null);
            setSelectedLocationName("");
        }
    };

    useEffect(() => {
        setIdempotencyKey(crypto.randomUUID());
    }, []);

    // Modal and submission state
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

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
                }

                if (fleetRes?.data?.content && fleetRes.data.content.length > 0) {
                    const found = fleetRes.data.content.find(v => v.id === vehicleIdParam) || fleetRes.data.content[0];
                    setVehicle(found);
                }
            } catch (err) {
                console.error("Error loading confirm data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, vehicleIdParam]);

    const getLocalizedName = () => {
        if (!tour) return "";
        const translation = tour.translations?.find(tr => tr.locale === language) || tour.translations?.[0];
        return translation ? translation.name : "Nha Trang Tour";
    };

    const getLocalizedVehicleName = () => {
        if (!vehicle) return "";
        const cat = vehicle.type;
        if (!cat) return `${vehicle.brand} ${vehicle.model}`;
        const translation = cat.translations?.find(tr => tr.locale === language) || cat.translations?.[0];
        return translation ? `${translation.name} (${vehicle.brand} ${vehicle.model})` : `${vehicle.brand} ${vehicle.model}`;
    };

    const calculateCombinedPrice = () => {
        if (!vehicle || !tour || !vehicle.type) return 0;
        const foundPrice = tour.prices?.find((p) => p.vehicleCategoryId === vehicle.type.id && p.active);
        if (foundPrice) {
            return foundPrice.amount;
        }
        // Fallback if price not seeded
        return 600000;
    };

    const unitPrice = calculateCombinedPrice();
    const totalAmount = unitPrice;

    const formatPrice = (value: number) => _formatPrice(value, language);

    const timeValueTo24hString = (val: TimeValue) => {
        let hr = val.hour;
        if (val.period === "PM" && hr < 12) hr += 12;
        if (val.period === "AM" && hr === 12) hr = 0;
        return `${String(hr).padStart(2, "0")}:${String(val.minute).padStart(2, "0")}`;
    };

    const startTime24h = timeValueTo24hString(startTimeVal);
    const dateString = dateValue ? dateValue.toString() : "";

    const handleOpenConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName || !phone || !email || !dateString || guestCount <= 0 || !meetingPoint.trim()) {
            alert(isVi ? "Vui lòng nhập đầy đủ thông tin bắt buộc!" : "Please fill out all required fields!");
            return;
        }
        if (vehicle && vehicle.type && guestCount > vehicle.type.maxSeat) {
            alert(
                isVi
                    ? `Số lượng khách (${guestCount}) vượt quá số chỗ ngồi tối đa của xe (${vehicle.type.maxSeat} chỗ)!`
                    : `The number of guests (${guestCount}) exceeds the vehicle's maximum seat capacity (${vehicle.type.maxSeat} seats)!`
            );
            return;
        }
        setConfirmModalOpen(true);
    };

    const handleConfirmBooking = async () => {
        if (!tour || !vehicle) return;

        if (vehicle.type && guestCount > vehicle.type.maxSeat) {
            alert(
                isVi
                    ? `Số lượng khách (${guestCount}) vượt quá số chỗ ngồi tối đa của xe (${vehicle.type.maxSeat} chỗ)!`
                    : `The number of guests (${guestCount}) exceeds the vehicle's maximum seat capacity (${vehicle.type.maxSeat} seats)!`
            );
            return;
        }

        setSubmitting(true);

        const payload = {
            customerName: fullName,
            customerEmail: email,
            customerPhone: phone,
            totalAmount: totalAmount,
            contactChannel: contactChannel,
            contactId: contactId,
            idempotencyKey: idempotencyKey,
            customerNotes: notes,
            items: [
                {
                    serviceId: tour.id,
                    serviceOptionId: vehicle.type?.id || 0,
                    quantity: guestCount,
                    unitPrice: unitPrice,
                    startDate: dateString ? `${dateString}T${startTime24h}:00` : undefined,
                    pickupLocation: meetingPoint.trim(),
                    dynamicDetails: `Tour Booking with ${vehicle.brand} ${vehicle.model} (${vehicle.type?.code || ""})`
                }
            ]
        };

        try {
            const res = await createBooking(payload);
            let bookingCode = "BK-SUCCESS";
            if (res?.data) {
                bookingCode = res.data.bookingCode || "BK-SUCCESS";
            } else {
                bookingCode = "BK-" + Math.floor(100000 + Math.random() * 900000);
            }
            router.push(`/${language}/tours/success?bookingCode=${bookingCode}`);
        } catch (err) {
            console.error("Booking API error:", err);
            alert(isVi ? "Có lỗi xảy ra trong quá trình đặt tour. Vui lòng thử lại!" : "An error occurred during booking. Please try again!");
        } finally {
            setSubmitting(false);
            setConfirmModalOpen(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 flex flex-col font-sans">
                {/* Banner skeleton */}
                <div className="relative w-full pt-28 pb-12 px-6 bg-slate-900 overflow-hidden">
                    <div className="max-w-7xl mx-auto w-full relative z-10 space-y-3">
                        <Skeleton className="h-8 w-48 rounded-full bg-white/20" />
                        <Skeleton className="h-10 w-72 rounded-lg bg-white/20" />
                    </div>
                </div>

                <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left: form skeleton */}
                    <div className="lg:col-span-7 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-5">
                        <Skeleton className="h-3 w-56 rounded-lg" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Skeleton className="h-2.5 w-20 rounded-lg" />
                                <Skeleton className="h-11 w-full rounded-xl" />
                            </div>
                            <div className="space-y-1.5">
                                <Skeleton className="h-2.5 w-24 rounded-lg" />
                                <Skeleton className="h-11 w-full rounded-xl" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Skeleton className="h-2.5 w-28 rounded-lg" />
                                <Skeleton className="h-11 w-full rounded-xl" />
                            </div>
                            <div className="space-y-1.5">
                                <Skeleton className="h-2.5 w-28 rounded-lg" />
                                <Skeleton className="h-11 w-full rounded-xl" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Skeleton className="h-2.5 w-24 rounded-lg" />
                                <Skeleton className="h-11 w-full rounded-xl" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Skeleton className="h-2.5 w-36 rounded-lg" />
                            <Skeleton className="h-11 w-full rounded-xl" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Skeleton className="h-2.5 w-32 rounded-lg" />
                                <Skeleton className="h-11 w-full rounded-xl" />
                            </div>
                            <div className="space-y-1.5">
                                <Skeleton className="h-2.5 w-24 rounded-lg" />
                                <Skeleton className="h-11 w-full rounded-xl" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Skeleton className="h-2.5 w-28 rounded-lg" />
                            <Skeleton className="h-11 w-full rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                            <Skeleton className="h-2.5 w-40 rounded-lg" />
                            <Skeleton className="h-20 w-full rounded-xl" />
                        </div>
                        <Skeleton className="h-12 w-full rounded-2xl" />
                    </div>

                    {/* Right: invoice skeleton */}
                    <div className="lg:col-span-5 bg-slate-100 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-5">
                        <Skeleton className="h-4 w-48 rounded-lg" />
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <Skeleton className="h-2 w-20 rounded-lg" />
                                <Skeleton className="h-3 w-full rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <Skeleton className="h-2 w-24 rounded-lg" />
                                <Skeleton className="h-3 w-4/5 rounded-lg" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Skeleton className="h-2 w-12 rounded-lg" />
                                    <Skeleton className="h-3 w-full rounded-lg" />
                                </div>
                                <div className="space-y-1">
                                    <Skeleton className="h-2 w-16 rounded-lg" />
                                    <Skeleton className="h-3 w-full rounded-lg" />
                                </div>
                            </div>
                            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
                                <div className="flex justify-between">
                                    <Skeleton className="h-3 w-28 rounded-lg" />
                                    <Skeleton className="h-3 w-20 rounded-lg" />
                                </div>
                                <div className="flex justify-between">
                                    <Skeleton className="h-3 w-20 rounded-lg" />
                                    <Skeleton className="h-3 w-16 rounded-lg" />
                                </div>
                                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between items-end">
                                    <div className="space-y-1">
                                        <Skeleton className="h-2.5 w-32 rounded-lg" />
                                        <Skeleton className="h-2 w-28 rounded-lg" />
                                    </div>
                                    <Skeleton className="h-6 w-28 rounded-lg" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 flex flex-col font-sans">
            {/* Banner */}
            <section className="relative w-full pt-28 pb-12 px-6 bg-slate-900 overflow-hidden">
                {tour?.thumbnail && (
                    <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url('${resolveMediaUrl(tour.thumbnail.filePath)}')` }} />
                )}
                <div className="max-w-7xl mx-auto w-full relative z-10 text-white flex flex-col gap-3">
                    <Button
                        onClick={() => router.push(`/${language}/tours/${id}`)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 border-none rounded-full w-fit px-4 py-2 cursor-pointer"
                    >
                        <ArrowLeft size={12} />
                        <span>{t.tours.goBack}</span>
                    </Button>
                    <h1 className="text-xl md:text-3xl font-black uppercase">
                        {t.tours.customerInfo}
                    </h1>
                </div>
            </section>

            {/* Main Form Area */}
            <main className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Contact Input Form */}
                <form onSubmit={handleOpenConfirm} className="lg:col-span-7 bg-white dark:bg-black border border-slate-250 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-5">
                    <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
                        {t.tours.customerInfo}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Full Name */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                                {isVi ? "Họ và tên *" : "Full Name *"}
                            </label>
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-black px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                                <User size={15} className="text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder={isVi ? "Nhập họ và tên..." : "Enter full name..."}
                                    className="bg-transparent text-xs font-semibold outline-none w-full border-none p-0 text-slate-700 dark:text-slate-200"
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                                {isVi ? "Số điện thoại *" : "Phone Number *"}
                            </label>
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-black px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                                <Phone size={15} className="text-slate-400" />
                                <input
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder={isVi ? "Số liên lạc..." : "Contact number..."}
                                    className="bg-transparent text-xs font-semibold outline-none w-full border-none p-0 text-slate-700 dark:text-slate-200"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Email */}
                        <div className="space-y-1.5">
                            <TextField isRequired className="space-y-1.5" name="email">
                                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                                    {isVi ? "Địa chỉ Email" : "Email Address"}
                                </Label>

                                <InputGroup className="bg-slate-50 dark:bg-black rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2.5">
                                    <InputGroup.Prefix>
                                        <Mail className="size-4 text-slate-400" />
                                    </InputGroup.Prefix>

                                    <InputGroup.Input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@example.com"
                                        className="bg-transparent text-xs font-semibold outline-none w-full border-none p-0 text-slate-700 dark:text-slate-200"
                                    />
                                </InputGroup>

                                <Description>
                                    {isVi
                                        ? "Chúng tôi sẽ không chia sẻ email của bạn với bất kỳ ai."
                                        : "We'll never share this with anyone else"}
                                </Description>
                            </TextField>

                        </div>

                        {/* Date */}
                        <div className="space-y-1.5">
                            <DatePicker
                                aria-label={isVi ? "Ngày khởi hành" : "Departure Date"}
                                value={dateValue}
                                onChange={setDateValue}
                                className="w-full"
                            >
                                <Label className="text-[0.625rem] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">{`${t.tours.date} *`}</Label>
                                <DateField.Group fullWidth className={`bg-slate-50 dark:bg-black rounded-xl border border-slate-200 dark:border-slate-800`}>
                                    <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
                                    <DateField.Suffix>
                                        <DatePicker.Trigger>
                                            <DatePicker.TriggerIndicator />
                                        </DatePicker.Trigger>
                                    </DateField.Suffix>
                                    <DatePicker.Popover>
                                        <Calendar aria-label="Event date">
                                            <Calendar.Header>
                                                <Calendar.YearPickerTrigger>
                                                    <Calendar.YearPickerTriggerHeading />
                                                    <Calendar.YearPickerTriggerIndicator />
                                                </Calendar.YearPickerTrigger>
                                                <Calendar.NavButton slot="previous" />
                                                <Calendar.NavButton slot="next" />
                                            </Calendar.Header>
                                            <Calendar.Grid>
                                                <Calendar.GridHeader>
                                                    {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                                                </Calendar.GridHeader>
                                                <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
                                            </Calendar.Grid>
                                            <Calendar.YearPickerGrid>
                                                <Calendar.YearPickerGridBody>
                                                    {({ year }) => <Calendar.YearPickerCell year={year} />}
                                                </Calendar.YearPickerGridBody>
                                            </Calendar.YearPickerGrid>
                                        </Calendar>
                                    </DatePicker.Popover>
                                </DateField.Group>
                            </DatePicker>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Start Time */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                                {`${t.common.time} *`}
                            </label>
                            <TimePicker
                                value={startTimeVal}
                                onChange={setStartTimeVal}
                                language={language}
                                triggerClassName="flex items-center gap-2 h-11 w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 bg-slate-50 dark:bg-black text-left cursor-pointer hover:border-accent/50 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Meeting Point */}
                    <div ref={suggestionsRef} className="space-y-1.5 relative">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                            {isVi ? "Điểm đón / Điểm hẹn *" : "Meeting Point / Pick up *"}
                        </label>
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-black px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus-within:border-blue-500/50 transition-colors">
                            <input
                                type="text"
                                required
                                value={meetingPoint}
                                onChange={(e) => handleMeetingPointChange(e.target.value)}
                                onFocus={() => {
                                    if (suggestions.length > 0) setShowSuggestions(true);
                                }}
                                placeholder={isVi ? "Nhập địa điểm đón cụ thể (Tên Khách sạn, địa chỉ...)" : "Enter specific pick up location (Hotel name, address...)"}
                                className="bg-transparent text-xs font-semibold outline-none w-full border-none p-0 text-slate-700 dark:text-slate-200"
                            />
                            {searchingLocation && (
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                            )}
                        </div>

                        {/* Suggestions Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 max-h-56 overflow-y-auto">
                                {suggestions.map((suggestion) => (
                                    <button
                                        key={suggestion.id}
                                        type="button"
                                        onClick={() => handleSelectSuggestion(suggestion)}
                                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-850 last:border-none font-semibold block transition-colors cursor-pointer"
                                    >
                                        📍 {suggestion.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Selected Location Map View */}
                        {selectedCoords && (
                            <div className="mt-2.5">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                                    {isVi ? "Xem vị trí điểm đón trên bản đồ:" : "Pickup position map view:"}
                                </span>
                                <PickupMap
                                    lat={selectedCoords.lat}
                                    lng={selectedCoords.lng}
                                    label={meetingPoint}
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Contact Social */}
                        <div className="space-y-1.5 flex flex-col justify-end">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 mb-1">
                                {t.tours.contactChannel}
                            </label>
                            <Select
                                className="w-full"
                                selectedKey={contactChannel}
                                onSelectionChange={(key) => setContactChannel(key as any)}
                            >
                                <Select.Trigger className="w-full bg-slate-50 dark:bg-black px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-850 dark:text-slate-200 outline-none flex items-center justify-between cursor-pointer h-[38px]">
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
                        </div>

                        {/* Social ID */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                                {isVi ? "Số điện thoại / ID MXH" : "Social ID"}
                            </label>
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-black px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                                <MessageSquare size={15} className="text-slate-400" />
                                <input
                                    type="text"
                                    value={contactId}
                                    onChange={(e) => setContactId(e.target.value)}
                                    placeholder={isVi ? "Zalo/KakaoTalk ID..." : "Zalo/KakaoTalk ID..."}
                                    className="bg-transparent text-xs font-semibold outline-none w-full border-none p-0 text-slate-700 dark:text-slate-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Guest Count */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                            {`${t.tours.numberOfGuests} *`}
                        </label>
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-black px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                            <Users size={15} className="text-slate-400" />
                            <input
                                type="number"
                                required
                                min={1}
                                value={guestCount}
                                onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value)))}
                                className="bg-transparent text-xs font-semibold outline-none w-full border-none p-0 text-slate-700 dark:text-slate-200"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                            {t.tours.notes}
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={isVi ? "Lưu ý đón tiễn, ăn uống, em bé..." : "Hotel transfer instructions, dietary notes..."}
                            rows={3}
                            className="w-full bg-slate-50 dark:bg-black px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none resize-none"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 bg-orange-500 hover:bg-orange-650 text-white font-black text-xs uppercase tracking-wider rounded-2xl border-none cursor-pointer shadow-sm mt-3"
                    >
                        {`${t.tours.continue} →`}
                    </Button>
                </form>

                {/* Right Column: Checkout Invoice */}
                <div className="lg:col-span-5 bg-slate-100 dark:bg-black border border-slate-250 dark:border-slate-800 rounded-3xl p-6 space-y-5">
                    <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-850 pb-2">
                        <ClipboardList size={16} className="text-accent" />
                        {t.tours.confirmBooking}
                    </h3>

                    <div className="space-y-4 text-xs font-semibold">
                        {tour && (
                            <div>
                                <span className="block text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">
                                    {t.tours.tourName}
                                </span>
                                <span className="text-slate-800 dark:text-slate-100 leading-tight block">
                                    {getLocalizedName()}
                                </span>
                            </div>
                        )}

                        {vehicle && (
                            <div>
                                <span className="block text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">
                                    {isVi ? "Dòng xe phục vụ" : "Vehicle Class"}
                                </span>
                                <span className="text-slate-800 dark:text-slate-100 block">
                                    {getLocalizedVehicleName()} ({vehicle.type ? (vehicle.type.minSeat === vehicle.type.maxSeat ? vehicle.type.minSeat : `${vehicle.type.minSeat}-${vehicle.type.maxSeat}`) : "4"} {isVi ? "chỗ" : "seats"})
                                </span>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="block text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">
                                    {t.tours.date}
                                </span>
                                <span className="text-slate-800 dark:text-slate-100 block">
                                    {dateString || (isVi ? "Chưa chọn" : "Not selected")}
                                </span>
                            </div>
                            <div>
                                <span className="block text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">
                                    {t.tours.numberOfGuests}
                                </span>
                                <span className="text-slate-800 dark:text-slate-100 block">
                                    {guestCount} {t.tours.perPerson}
                                </span>
                            </div>
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-400">{isVi ? "Đơn giá (Tour + Xe)" : "Package Price"}</span>
                                <span className="text-slate-800 dark:text-slate-100">{formatPrice(unitPrice)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">{isVi ? "Số lượng khách" : "Guests"}</span>
                                <span className="text-slate-800 dark:text-slate-100">{guestCount} {isVi ? "khách" : "guests"}</span>
                            </div>

                            <div className="border-t border-slate-200 dark:border-slate-850 pt-3 flex justify-between items-end">
                                <div>
                                    <span className="text-[9px] text-accent uppercase tracking-wider font-extrabold block">
                                        {t.tours.totalEstimate}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block font-normal mt-0.5">
                                        {isVi ? "Đã bao gồm tài xế & xăng xe" : "Includes private driver & gas"}
                                    </span>
                                </div>
                                <span className="text-lg font-black text-amber-500">
                                    {formatPrice(totalAmount)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-black border border-blue-100 dark:border-slate-850 rounded-2xl p-3.5 flex items-start gap-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-normal">
                        <Shield size={15} className="text-accent shrink-0 mt-0.5" />
                        <span>
                            {isVi
                                ? "Thanh toán an toàn, linh hoạt sau chuyến đi. Minh Khoa Travel cam kết chất lượng dịch vụ chuyên nghiệp nhất."
                                : "No deposits needed. Pay in cash directly to your driver upon tour completion."}
                        </span>
                    </div>
                </div>
            </main>

            {/* Confirmation Modal */}
            <BookingConfirmModal
                isOpen={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={handleConfirmBooking}
                selectedTour={tour}
                selectedVehicle={vehicle}
                fullName={fullName}
                phone={phone}
                email={email}
                date={dateString}
                guestCount={guestCount}
                totalAmount={totalAmount}
                submitting={submitting}
            />
        </div>
    );
}
