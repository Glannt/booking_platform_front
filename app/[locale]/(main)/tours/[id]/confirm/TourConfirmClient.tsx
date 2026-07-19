"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, User, Phone, Mail, Calendar as IconCalendar, Users, MessageSquare, ClipboardList, Shield } from "lucide-react";
import { Button, Label, Input, TextField, Skeleton, Select, ListBox } from "@heroui/react";
import { getLocalTimeZone, today } from "@internationalized/date";
import type { DateValue } from "@internationalized/date";
import { TimePicker, TimeValue } from "@/components/time-picker";

import { getTourById, TourDto } from "@/lib/api/tours";
import { getVehicles, VehicleDto } from "@/lib/api/fleet";
import { createBooking } from "@/lib/api/bookings";
import { useI18n } from "@/context/LanguageContext";
import { formatPrice as _formatPrice } from "@/lib/format";
import { AutofillButton } from "@/components/AutofillButton";
import BookingConfirmModal from "@/components/tours/BookingConfirmModal";
import dynamic from "next/dynamic";
import type { SectionDto } from "@/lib/api/sections";

const PickupMap = dynamic(
    () => import("@/components/pickup-map").then((mod) => mod.PickupMap),
    { ssr: false }
);

const resolveMediaUrl = (filePath: string): string => {
    return filePath.startsWith("http") ? filePath : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${filePath}`;
};

interface TourConfirmClientProps {
    sections: SectionDto[];
}

export default function TourConfirmClient({ sections }: TourConfirmClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = Number(searchParams.get("tourId") || "0");
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
    const [meetingPoint, setMeetingPoint] = useState(searchParams.get("pickup") || searchParams.get("meetingPoint") || "");
    const [idempotencyKey, setIdempotencyKey] = useState("");

    // Autocomplete & Map States
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [searchingLocation, setSearchingLocation] = useState(false);
    const [selectedLocationName, setSelectedLocationName] = useState("");
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Submission states
    const [submitting, setSubmitting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        setIdempotencyKey(crypto.randomUUID());
    }, []);

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
        }, 600);

        return () => clearTimeout(delayDebounceFn);
    }, [meetingPoint, selectedLocationName]);

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

    // Load tour and vehicle data
    useEffect(() => {
        if (!id) return;
        let active = true;
        (async () => {
            try {
                const [tourRes, fleetRes] = await Promise.all([
                    getTourById(id),
                    getVehicles()
                ]);
                if (!active) return;

                if (tourRes?.data) setTour(tourRes.data);

                const allVehicles = fleetRes?.data?.content?.filter(v => v.active) || [];
                const matchedVehicle = allVehicles.find(v => v.id === vehicleIdParam) || allVehicles[0];
                if (matchedVehicle) setVehicle(matchedVehicle);
            } catch (err) {
                console.error("Error loading tour confirm data:", err);
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, [id, vehicleIdParam]);

    const getLocalizedName = (srv: TourDto) => {
        const translation = srv.translations?.find((tr) => tr.locale === language) || srv.translations?.[0];
        return translation ? translation.name : "Nha Trang Tour";
    };

    const getLocalizedVehicleName = (v: VehicleDto) => {
        const cat = v.type;
        if (!cat) return `${v.brand} ${v.model}`;
        const translation = cat.translations?.find((tr) => tr.locale === language) || cat.translations?.[0];
        return translation ? `${translation.name} (${v.brand} ${v.model})` : `${v.brand} ${v.model}`;
    };

    const calculatePrice = () => {
        if (!tour || !vehicle?.type) return 0;
        const foundPrice = tour.prices?.find(p => p.vehicleCategoryId === vehicle.type?.id && p.active);
        if (foundPrice) return foundPrice.amount * guestCount;
        return 1200000 * guestCount;
    };

    const totalPrice = calculatePrice();
    const formatPrice = (value: number) => _formatPrice(value, language);

    const handleConfirmBooking = async () => {
        if (!tour || !vehicle || submitting) return;

        setSubmitting(true);
        try {
            const dateStr = dateValue
                ? `${dateValue.year}-${String(dateValue.month).padStart(2, "0")}-${String(dateValue.day).padStart(2, "0")}`
                : "";
            const timeStr = `${String(startTimeVal.hour).padStart(2, "0")}:${String(startTimeVal.minute).padStart(2, "0")}`;

            const payload = {
                customerName: fullName,
                customerEmail: email,
                customerPhone: phone,
                totalAmount: totalPrice,
                contactChannel,
                contactId,
                idempotencyKey,
                customerNotes: notes,
                items: [{
                    serviceId: tour.id,
                    serviceOptionId: vehicle.type?.id || 0,
                    quantity: guestCount,
                    unitPrice: totalPrice / guestCount,
                    startDate: `${dateStr}T${timeStr}:00`,
                    pickupLocation: meetingPoint,
                    dynamicDetails: `Tour Booking with ${vehicle.brand} ${vehicle.model} (${vehicle.type?.code})`
                }]
            };

            const res = await createBooking(payload);
            if (res?.data?.bookingCode) {
                router.push(`/${language}/tours/success?bookingCode=${res.data.bookingCode}`);
            }
        } catch (err) {
            console.error("Booking failed:", err);
        } finally {
            setSubmitting(false);
            setShowConfirmModal(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Skeleton className="w-48 h-8 rounded-lg" />
                    <Skeleton className="w-64 h-4 rounded-lg" />
                </div>
            </div>
        );
    }

    if (!tour || !vehicle) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col items-center justify-center gap-4">
                <p className="text-sm font-bold text-slate-500">{t.tours.notFound}</p>
                <Button onClick={() => router.push(`/${language}/tours`)} className="bg-accent text-white text-xs font-bold px-4 py-2 rounded-xl">
                    {t.common.goBack}
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 font-sans">
            {/* Header */}
            <div className="bg-slate-50 dark:bg-black/20 border-b border-slate-100 dark:border-slate-800">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">
                            {t.tours.confirmBooking}
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t.common.reviewBeforeConfirm}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
                {/* Tour Summary */}
                <div className="bg-white dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 sm:p-6 space-y-4">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {t.tours.tourInfo}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div><span className="text-slate-400">{t.tours.tourLabel}:</span> <span className="font-bold">{getLocalizedName(tour)}</span></div>
                        <div><span className="text-slate-400">{t.tours.vehicleLabel}:</span> <span className="font-bold">{getLocalizedVehicleName(vehicle)}</span></div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="bg-white dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {t.tours.customerInfo}
                        </h3>
                        <AutofillButton
                            onFill={(d) => { setFullName(d.fullname); setPhone(d.phone); setEmail(d.email); }}
                            label={t.common.autoFill}
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <TextField isRequired>
                            <Label className="text-[10px] font-bold uppercase tracking-wider">{t.common.name}</Label>
                            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={isVi ? "Nguyễn Văn A" : "John Doe"} />
                        </TextField>
                        <TextField isRequired>
                            <Label className="text-[10px] font-bold uppercase tracking-wider">{t.common.phone}</Label>
                            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0901 234 567" />
                        </TextField>
                        <TextField isRequired>
                            <Label className="text-[10px] font-bold uppercase tracking-wider">Email</Label>
                            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
                        </TextField>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-wider">{t.tours.contactChannel}</Label>
                            <Select selectedKey={contactChannel} onSelectionChange={(key) => { if (key) setContactChannel(key as any); }}>
                                <Select.Trigger className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black text-xs font-bold">
                                    <Select.Value />
                                    <Select.Indicator />
                                </Select.Trigger>
                                <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-50">
                                    <ListBox>
                                        <ListBox.Item key="zalo" id="zalo" textValue="Zalo">Zalo<ListBox.ItemIndicator /></ListBox.Item>
                                        <ListBox.Item key="kakaotalk" id="kakaotalk" textValue="KakaoTalk">KakaoTalk<ListBox.ItemIndicator /></ListBox.Item>
                                    </ListBox>
                                </Select.Popover>
                            </Select>
                        </div>
                        <TextField>
                            <Label className="text-[10px] font-bold uppercase tracking-wider">{t.tours.contactId}</Label>
                            <Input value={contactId} onChange={(e) => setContactId(e.target.value)} placeholder={contactChannel === "zalo" ? "Zalo ID" : "KakaoTalk ID"} />
                        </TextField>
                    </div>
                </div>

                {/* Booking Details */}
                <div className="bg-white dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 sm:p-6 space-y-4">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {t.tours.bookingDetails}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-wider">{t.tours.departureDate}</Label>
                            <input
                                type="date"
                                value={dateValue ? `${dateValue.year}-${String(dateValue.month).padStart(2, "0")}-${String(dateValue.day).padStart(2, "0")}` : ""}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (!val) return;
                                    const [y, m, d] = val.split("-").map(Number);
                                    import("@internationalized/date").then(({ CalendarDate }) => {
                                        setDateValue(new CalendarDate(y, m, d));
                                    });
                                }}
                                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black text-xs font-semibold outline-none"
                            />
                        </div>
                        <TimePicker
                            label={t.tours.startTime}
                            labelClassName="text-[10px] font-bold uppercase tracking-wider"
                            value={startTimeVal}
                            onChange={setStartTimeVal}
                            language={language}
                        />
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-wider">{t.tours.guests}</Label>
                            <Input type="number" min={1} max={tour.maxGuest || 30} value={guestCount} onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))} />
                        </div>
                        <div className="flex flex-col gap-1.5 relative" ref={suggestionsRef}>
                            <Label className="text-[10px] font-bold uppercase tracking-wider">{t.tours.meetingPoint}</Label>
                            <Input
                                value={meetingPoint}
                                onChange={(e) => { setMeetingPoint(e.target.value); setSelectedLocationName(""); }}
                                placeholder={t.tours.pickupPlaceholder}
                            />
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                    {suggestions.map((s) => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => handleSelectSuggestion(s)}
                                            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                                        >
                                            {s.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider">{t.rentCar.notes}</Label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t.airportTransfer.notesPlaceholder}
                            className="w-full h-16 p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-black text-xs font-semibold outline-none resize-none"
                        />
                    </div>
                </div>

                {/* Price Summary */}
                <div className="bg-white dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 sm:p-6 space-y-4">
                    <div className="flex justify-between items-end">
                        <span className="text-sm font-bold text-slate-500">{t.common.total}</span>
                        <span className="text-xl font-black text-accent">{formatPrice(totalPrice)}</span>
                    </div>
                    <Button
                        onClick={() => setShowConfirmModal(true)}
                        isDisabled={!fullName || !phone || !email || !contactId || submitting}
                        className="w-full h-12 rounded-2xl font-black text-sm bg-accent text-white hover:bg-accent-hover shadow-md gap-2 border-none cursor-pointer"
                    >
                        {t.common.continueBtn}
                    </Button>
                </div>
            </div>

            <BookingConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmBooking}
                selectedTour={tour}
                selectedVehicle={vehicle}
                fullName={fullName}
                phone={phone}
                email={email}
                date={dateValue ? `${dateValue.year}-${String(dateValue.month).padStart(2, "0")}-${String(dateValue.day).padStart(2, "0")}` : ""}
                guestCount={guestCount}
                totalAmount={totalPrice}
                submitting={submitting}
            />
        </div>
    );
}
