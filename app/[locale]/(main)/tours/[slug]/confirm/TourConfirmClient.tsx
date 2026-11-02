"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, User, Phone, Mail, Calendar as IconCalendar, Users, MessageSquare, ClipboardList, Shield, MapPin, Ship, Compass, Sparkles } from "lucide-react";
import { Button, Label, Input, TextField, Skeleton, Select, ListBox, FieldError, DatePicker, DateField, Calendar, SearchField } from "@heroui/react";
import { getLocalTimeZone, today, parseDate } from "@internationalized/date";
import type { DateValue } from "@internationalized/date";
import { TimePicker, TimeValue } from "@/components/time-picker";

import { getTourById, getTourByIdOrSlug, TourDto, TourPackageDto, getPackagePrice } from "@/lib/api/tours";
import { getVehicles, VehicleDto } from "@/lib/api/fleet";
import { createTourBooking } from "@/lib/api/tours/bookings";
import { searchLocations, type LocationSearchResult } from "@/lib/api/locations";
import { useI18n } from "@/context/LanguageContext";
import { formatPriceSync as _formatPrice } from "@/lib/format";
import { calculateDeposit } from "@/lib/pricing/deposit";
import { resolveLocalizedName, resolveLocalizedSlug, resolveTranslation } from "@/lib/i18n-helpers";
import { AutofillButton } from "@/components/AutofillButton";
import BookingConfirmModal from "@/components/tours/BookingConfirmModal";
import SuccessOverlay from "@/components/SuccessOverlay";
import ErrorOverlay from "@/components/ErrorOverlay";
import type { SectionDto } from "@/lib/api/sections";
import { CustomerDiscountSection, type AppliedDiscountInfo } from "@/components/common/CustomerDiscountSection";
import { Reveal } from "@/components/Reveal";

interface TourConfirmClientProps {
    tourIdentifier: string | number;
    sections: SectionDto[];
}

export default function TourConfirmClient({ tourIdentifier, sections }: TourConfirmClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const packageIdParam = searchParams.get("packageId") ? Number(searchParams.get("packageId")) : null;
    const vehicleIdParam = searchParams.get("vehicleId") ? Number(searchParams.get("vehicleId")) : null;
    const initialAdults = Math.max(1, parseInt(searchParams.get("adults") || "2", 10) || 1);
    const initialChildren = Math.max(0, parseInt(searchParams.get("children") || "0", 10) || 0);
    const initialInfants = Math.max(0, parseInt(searchParams.get("infants") || "0", 10) || 0);

    const { language, t } = useI18n();

    // Data states
    const [tour, setTour] = useState<TourDto | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<TourPackageDto | null>(null);
    const [vehicle, setVehicle] = useState<VehicleDto | null>(null);
    const [loading, setLoading] = useState(true);

    // Form states
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [zaloId, setZaloId] = useState("");
    const [kakaoTalkId, setKakaoTalkId] = useState("");
    const [notes, setNotes] = useState("");
    const [adultCount, setAdultCount] = useState<number>(initialAdults);
    const [childCount, setChildCount] = useState<number>(initialChildren);
    const [infantCount, setInfantCount] = useState<number>(initialInfants);
    const [dateValue, setDateValue] = useState<DateValue | null>(today(getLocalTimeZone()));
    const [startTimeVal, setStartTimeVal] = useState<TimeValue>({ hour: 8, minute: 0, period: "AM" });
    const [meetingPoint, setMeetingPoint] = useState(searchParams.get("pickup") || searchParams.get("meetingPoint") || "");
    const [idempotencyKey, setIdempotencyKey] = useState("");

    // Autocomplete & Map States
    const [suggestions, setSuggestions] = useState<LocationSearchResult[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [searchingLocation, setSearchingLocation] = useState(false);
    const [selectedLocationName, setSelectedLocationName] = useState("");
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Submission states
    const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscountInfo | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successBookingCode, setSuccessBookingCode] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

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
                const res = await searchLocations(meetingPoint, language, 5);
                const results = res?.data || [];
                setSuggestions(results);
                setShowSuggestions(results.length > 0);
            } catch (err) {
                console.error("Suggestions search error:", err);
            } finally {
                setSearchingLocation(false);
            }
        }, 600);

        return () => clearTimeout(delayDebounceFn);
    }, [meetingPoint, selectedLocationName, language]);

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

    const handleSelectSuggestion = (suggestion: LocationSearchResult) => {
        setMeetingPoint(suggestion.name);
        setSelectedLocationName(suggestion.name);
        setSelectedCoords({ lat: suggestion.latitude, lng: suggestion.longitude });
        setSuggestions([]);
        setShowSuggestions(false);
    };

    // Load tour data
    useEffect(() => {
        if (!tourIdentifier) return;
        let active = true;
        (async () => {
            try {
                const tourIdParam = searchParams.get("tourId") || searchParams.get("id");
                const tourRes = (tourIdParam && !isNaN(Number(tourIdParam)))
                    ? await getTourById(Number(tourIdParam))
                    : await getTourByIdOrSlug(tourIdentifier);
                if (!active) return;

                if (tourRes?.data) {
                    const tourData = tourRes.data;
                    setTour(tourData);

                    // Resolve package
                    if (tourData.packages && tourData.packages.length > 0) {
                        const matchedPkg = packageIdParam
                            ? tourData.packages.find((p) => p.id === packageIdParam)
                            : tourData.packages[0];
                        if (matchedPkg) setSelectedPackage(matchedPkg);
                    }
                }

                // If legacy vehicleIdParam present, fetch vehicles for fallback
                if (vehicleIdParam) {
                    try {
                        const fleetRes = await getVehicles();
                        if (active && fleetRes?.data?.content) {
                            const allVehicles = fleetRes.data.content.filter((v) => v.active);
                            const matchedVehicle = allVehicles.find((v) => v.id === vehicleIdParam) || allVehicles[0];
                            if (matchedVehicle) setVehicle(matchedVehicle);
                        }
                    } catch (e) {
                        console.warn("Could not load vehicle:", e);
                    }
                }
            } catch (err) {
                console.error("Error loading tour confirm data:", err);
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, [tourIdentifier, packageIdParam, vehicleIdParam]);

    const getLocalizedName = (srv: TourDto) => {
        return resolveLocalizedName(srv.translations, language, "Tour");
    };

    const getLocalizedPackageName = (pkg: TourPackageDto) => {
        const translation = resolveTranslation(pkg.translations, language);
        return translation?.name || pkg.code || t.tours.tourPackage;
    };

    const totalGuests = adultCount + childCount + infantCount;

    const calculatePrice = () => {
        if (selectedPackage) {
            if (selectedPackage.isContactOnly) return 0;
            const adultRate = getPackagePrice(selectedPackage, "ADULT");
            const childRate = getPackagePrice(selectedPackage, "CHILD");
            const infantRate = getPackagePrice(selectedPackage, "INFANT");
            return (adultRate * adultCount) + (childRate * childCount) + (infantRate * infantCount);
        }
        return 0;
    };

    const rawTotalPrice = calculatePrice();
    const finalTotalPrice = Math.max(0, rawTotalPrice - (appliedDiscount?.amount || 0));

    // Deposit belongs to the selected package now, and there is no default: a package nobody
    // configured a deposit for quotes 0đ and the row stays hidden, exactly what the server charges.
    const depositCalc = useMemo(() => {
        return calculateDeposit({
            totalAmount: finalTotalPrice,
            depositType: selectedPackage?.depositType,
            depositRate: selectedPackage?.depositRate ?? undefined,
            depositAmount: selectedPackage?.depositAmount ?? undefined,
        });
    }, [finalTotalPrice, selectedPackage]);

    const formatPrice = (value: number) => {
        if (value <= 0) return t.tours.contactOnly;
        return _formatPrice(value, language);
    };

    const handleConfirmBooking = async () => {
        if (!tour || submitting) return;

        setSubmitting(true);
        try {
            const dateStr = dateValue
                ? `${dateValue.year}-${String(dateValue.month).padStart(2, "0")}-${String(dateValue.day).padStart(2, "0")}`
                : "";
            const timeStr = `${String(startTimeVal.hour).padStart(2, "0")}:${String(startTimeVal.minute).padStart(2, "0")}`;

            const pkgName = selectedPackage ? getLocalizedPackageName(selectedPackage) : undefined;

            const res = await createTourBooking({
                customerName: fullName,
                customerEmail: email,
                customerPhone: phone,
                customerNotes: notes.trim() || undefined,
                zaloId: zaloId || undefined,
                kakaoTalkId: kakaoTalkId || undefined,
                contactChannel: zaloId ? "zalo" : kakaoTalkId ? "kakaotalk" : undefined,
                contactId: zaloId || kakaoTalkId || undefined,
                tourId: tour.id,
                tourPackageId: selectedPackage?.id,
                packageName: pkgName,
                pricingType: selectedPackage?.pricingType,
                guestCount: totalGuests,
                adultCount,
                childCount,
                infantCount,
                vehicleCategoryId: vehicle?.type?.id || undefined,
                pickupLocation: meetingPoint,
                description: pkgName ? `Tour Package: ${pkgName}` : `Tour Booking`,
                startTime: `${dateStr}T${timeStr}:00`,
                totalPrice: finalTotalPrice,
                depositType: depositCalc.depositType,
                depositRate: depositCalc.depositRate,
                depositAmount: depositCalc.depositAmount,
                discountCode: appliedDiscount?.code,
                discountAmount: appliedDiscount?.amount,
            });
            console.log("Booking API response:", res);
            const code = res?.data?.bookingCode || res?.data?.id;
            setSuccessBookingCode(code ? String(code) : "");
            setShowSuccessModal(true);
            setShowConfirmModal(false);
        } catch (err) {
            console.error("Booking failed:", err);
            setErrorMessage(err instanceof Error ? err.message : t.errors.bookingFailed);
            setShowConfirmModal(false);
        } finally {
            setSubmitting(false);
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

    if (!tour) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col items-center justify-center gap-4">
                <p className="text-sm font-bold text-slate-500">{t.tours.notFound}</p>
                <Button
                    onClick={() => router.push(`/${language}/tours`)}
                    className="bg-accent hover:bg-accent-hover text-accent-foreground text-sm font-bold px-5 py-2.5 rounded-xl border-none cursor-pointer shadow-sm transition-colors"
                >
                    {t.common.goBack}
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 font-sans">
            {/* Header */}
            <Reveal variant="fade" className="bg-slate-50 dark:bg-[var(--bg-surface)] border-b border-slate-100 dark:border-slate-800">
                <div className="max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] transition-colors cursor-pointer border-none bg-transparent"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">
                            {t.tours.confirmBooking}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {t.common.reviewBeforeConfirm}
                        </p>
                    </div>
                </div>
            </Reveal>

            <Reveal variant="up" className="max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                {/* Tour & Package Summary */}
                <div className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-slate-100 dark:border-slate-800 p-5 sm:p-6 space-y-4">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Compass size={15} className="text-accent" />
                        <span>{t.tours.tourInfo}</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-slate-400 font-medium block">{t.tours.tourLabel}:</span>
                            <span className="font-bold text-slate-900 dark:text-white text-base">{getLocalizedName(tour)}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 font-medium block">{t.tours.packages}:</span>
                            <span className="font-bold text-accent text-base">
                                {selectedPackage ? getLocalizedPackageName(selectedPackage) : t.tours.tourPackage}
                            </span>
                        </div>
                    </div>

                    {/* Passenger breakdown row */}
                    {selectedPackage && !selectedPackage.isContactOnly && (
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 text-sm">
                            <span className="text-slate-500 dark:text-slate-400">
                                {t.tours.adults}: <strong className="text-slate-900 dark:text-white">{adultCount}</strong> ({formatPrice(getPackagePrice(selectedPackage, "ADULT"))})
                            </span>
                            {childCount > 0 && (
                                <span className="text-slate-500 dark:text-slate-400">
                                    {t.tours.children}: <strong className="text-slate-900 dark:text-white">{childCount}</strong> ({formatPrice(getPackagePrice(selectedPackage, "CHILD"))})
                                </span>
                            )}
                            {infantCount > 0 && (
                                <span className="text-slate-500 dark:text-slate-400">
                                    {t.tours.infants}: <strong className="text-slate-900 dark:text-white">{infantCount}</strong> ({getPackagePrice(selectedPackage, "INFANT") > 0 ? formatPrice(getPackagePrice(selectedPackage, "INFANT")) : t.tours.free})
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Contact Info */}
                <div className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-slate-100 dark:border-slate-800 p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {t.tours.customerInfo}
                        </h3>
                        <AutofillButton
                            onFill={(d) => { setFullName(d.fullname); setPhone(d.phone); setEmail(d.email); setZaloId(d.zaloId ?? ""); setKakaoTalkId(d.kakaoTalkId ?? ""); }}
                            label={t.common.autoFill}
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <TextField isRequired>
                            <Label className="text-sm font-bold uppercase tracking-wider">{t.common.name}</Label>
                            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t.tours.namePlaceholder} className="text-sm sm:text-base font-semibold border-1 border-separator" />
                        </TextField>
                        <TextField isRequired>
                            <Label className="text-sm font-bold uppercase tracking-wider">{t.common.phone}</Label>
                            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0901 234 567" className="text-sm sm:text-base font-semibold border-1 border-separator" />
                        </TextField>
                        <TextField isRequired>
                            <Label className="text-sm font-bold uppercase tracking-wider">Email</Label>
                            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className="text-sm sm:text-base font-semibold border-1 border-separator" />
                        </TextField>
                        <TextField>
                            <Label className="text-sm font-bold uppercase tracking-wider">{t.tours.zaloId}</Label>
                            <Input value={zaloId} onChange={(e) => setZaloId(e.target.value)} placeholder="Zalo ID" className="text-sm sm:text-base font-semibold border-1 border-separator" />
                        </TextField>
                        <TextField>
                            <Label className="text-sm font-bold uppercase tracking-wider">{t.tours.kakaoTalkId}</Label>
                            <Input value={kakaoTalkId} onChange={(e) => setKakaoTalkId(e.target.value)} placeholder="KakaoTalk ID" className="text-sm sm:text-base font-semibold border-1 border-separator" />
                        </TextField>
                    </div>
                </div>

                {/* Booking Details */}
                <div className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-slate-100 dark:border-slate-800 p-5 sm:p-6 space-y-4">
                    <h3 className="text-base font-extrabold uppercase tracking-wider">
                        {t.tours.bookingDetails}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label isRequired className="text-sm font-bold uppercase tracking-wider">{t.tours.departureDate}</Label>
                            <DatePicker
                                className="w-full"
                                value={dateValue}
                                onChange={(val) => {
                                    if (val) {
                                        setDateValue(val as DateValue);
                                    }
                                }}
                            >
                                <DateField.Group fullWidth className="h-11 bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 flex items-center justify-between">
                                    <DateField.Input className="text-sm sm:text-base font-semibold bg-transparent border-none outline-none">
                                        {(segment) => <DateField.Segment segment={segment} />}
                                    </DateField.Input>
                                    <DateField.Suffix>
                                        <DatePicker.Trigger className="cursor-pointer">
                                            <DatePicker.TriggerIndicator />
                                        </DatePicker.Trigger>
                                    </DateField.Suffix>
                                </DateField.Group>
                                <DatePicker.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-50">
                                    <Calendar aria-label="Travel date">
                                        <Calendar.Header className="flex items-center justify-between mb-2">
                                            <Calendar.YearPickerTrigger className="text-sm font-bold flex items-center gap-1 cursor-pointer">
                                                <Calendar.YearPickerTriggerHeading />
                                                <Calendar.YearPickerTriggerIndicator />
                                            </Calendar.YearPickerTrigger>
                                            <div className="flex gap-1">
                                                <Calendar.NavButton slot="previous" className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer" />
                                                <Calendar.NavButton slot="next" className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer" />
                                            </div>
                                        </Calendar.Header>
                                        <Calendar.Grid className="w-full">
                                            <Calendar.GridHeader className="text-slate-400 text-sm font-bold">
                                                {(day) => <Calendar.HeaderCell className="w-9 h-9 text-center">{day}</Calendar.HeaderCell>}
                                            </Calendar.GridHeader>
                                            <Calendar.GridBody>
                                                {(date) => (
                                                    <Calendar.Cell
                                                        date={date}
                                                        className="w-9 h-9 text-sm font-semibold text-center cursor-pointer rounded-lg hover:bg-accent/10 hover:text-accent aria-selected:bg-accent aria-selected:text-accent-foreground"
                                                    />
                                                )}
                                            </Calendar.GridBody>
                                        </Calendar.Grid>
                                        <Calendar.YearPickerGrid className="w-full mt-2 border-t pt-2">
                                            <Calendar.YearPickerGridBody>
                                                {({ year }) => (
                                                    <Calendar.YearPickerCell
                                                        year={year}
                                                        className="text-sm font-semibold px-2.5 py-1 cursor-pointer hover:bg-slate-100 rounded"
                                                    />
                                                )}
                                            </Calendar.YearPickerGridBody>
                                        </Calendar.YearPickerGrid>
                                    </Calendar>
                                </DatePicker.Popover>
                            </DatePicker>
                        </div>
                        <TimePicker
                            isRequired
                            label={t.tours.startTime}
                            labelClassName="text-sm font-bold uppercase tracking-wider mb-1.5"
                            value={startTimeVal}
                            onChange={setStartTimeVal}
                            language={language}
                            triggerClassName="h-11 bg-transparent shadow-sm"
                        />
                        <div className="flex flex-col gap-1.5">
                            <Label isRequired className="text-sm font-bold uppercase tracking-wider">{t.tours.guests}</Label>
                            <div className="flex items-center h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-card)] text-sm font-bold text-slate-800 dark:text-white justify-between">
                                <span>{totalGuests} {t.common.guests}</span>
                                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                    {adultCount} {t.tours.adults}{childCount > 0 ? `, ${childCount} ${t.tours.children}` : ""}{infantCount > 0 ? `, ${infantCount} ${t.tours.infants}` : ""}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5 relative" ref={suggestionsRef}>
                            <Label isRequired className="text-sm font-bold uppercase tracking-wider">{t.tours.meetingPoint}</Label>
                            <SearchField
                                value={meetingPoint}
                                onChange={(val) => { setMeetingPoint(val); setSelectedLocationName(""); }}
                            >
                                <SearchField.Group className="border-1 border-separator h-11">
                                    <SearchField.SearchIcon />
                                    <SearchField.Input placeholder={t.tours.pickupPlaceholder} className="text-sm sm:text-base font-semibold" />
                                    <SearchField.ClearButton onClick={() => { setSuggestions([]); setShowSuggestions(false); setSelectedCoords(null); }} />
                                </SearchField.Group>
                            </SearchField>
                            {showSuggestions && suggestions.length > 0 && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />
                                    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                        {suggestions.map((s) => (
                                            <div
                                                key={s.id}
                                                onClick={() => handleSelectSuggestion(s)}
                                                className="p-3 hover:bg-accent/5 dark:hover:bg-[var(--bg-card)] cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2"
                                            >
                                                <MapPin size={14} className="text-accent shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="font-bold truncate">{s.name}</p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{s.address}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-sm font-bold uppercase tracking-wider">{t.rentCar.notes}</Label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t.airportTransfer.notesPlaceholder}
                            className="w-full h-20 p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[var(--bg-card)] text-sm sm:text-base font-medium outline-none resize-none"
                        />
                    </div>
                </div>

                {/* Customer Discount Section */}
                <CustomerDiscountSection
                    scopeType="TOUR"
                    scopeRefId={tour?.id}
                    orderTotal={rawTotalPrice}
                    onDiscountChange={setAppliedDiscount}
                />

                {/* Price Summary & Deposit Breakdown */}
                <div className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-slate-100 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-sm">
                    <div className="space-y-2 text-sm border-b border-separator pb-3">
                        <div className="flex justify-between items-center text-slate-500">
                            <span>Tạm tính</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                {formatPrice(rawTotalPrice)}
                            </span>
                        </div>

                        {appliedDiscount && (
                            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-medium">
                                <span>Giảm giá ({appliedDiscount.code})</span>
                                <span className="font-bold">
                                    - {formatPrice(appliedDiscount.amount)}
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-dashed border-separator">
                            <span className="font-bold text-slate-700 dark:text-slate-200 text-base">
                                {t.common.total}
                            </span>
                            <span className="text-xl sm:text-2xl font-black text-accent">
                                {formatPrice(finalTotalPrice)}
                            </span>
                        </div>
                    </div>

                    {/* Dynamic Deposit Info Card — hidden when the package has no deposit */}
                    {depositCalc.depositAmount > 0 && (
                        <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                                    <Shield size={16} className="text-amber-600" />
                                    {t.discounts.depositRequired}
                                </span>
                                <span className="text-base font-black text-amber-700 dark:text-amber-400">
                                    {formatPrice(depositCalc.depositAmount)}
                                </span>
                            </div>

                            <div className="text-sm text-amber-700 dark:text-amber-400/90 leading-tight">
                                <span>
                                    {t.discounts.depositPolicyNote.replace("{rate}", String(depositCalc.depositRate ?? 0))}
                                </span>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-amber-200/50 dark:border-amber-900/30 text-sm font-semibold text-slate-600 dark:text-slate-300">
                                <span>{t.discounts.remainingPayment}:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {formatPrice(depositCalc.remainingAmount)}
                                </span>
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={() => setShowConfirmModal(true)}
                        isDisabled={!fullName || !phone || !email || submitting}
                        className="w-full h-12 rounded-2xl font-black text-base bg-accent text-accent-foreground hover:bg-accent-hover shadow-md gap-2 border-none cursor-pointer"
                    >
                        {t.common.continueBtn}
                    </Button>
                </div>
            </Reveal>

            <BookingConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmBooking}
                selectedTour={tour}
                selectedPackage={selectedPackage}
                selectedVehicle={vehicle}
                fullName={fullName}
                phone={phone}
                email={email}
                date={dateValue ? `${dateValue.year}-${String(dateValue.month).padStart(2, "0")}-${String(dateValue.day).padStart(2, "0")}` : ""}
                guestCount={totalGuests}
                adultCount={adultCount}
                childCount={childCount}
                infantCount={infantCount}
                totalAmount={finalTotalPrice}
                depositAmount={depositCalc.depositAmount > 0 ? depositCalc.depositAmount : undefined}
                depositRate={depositCalc.depositRate}
                depositType={depositCalc.depositType}
                remainingAmount={depositCalc.remainingAmount}
                submitting={submitting}
            />

            {/* Success Modal */}
            {showSuccessModal && (
                <SuccessOverlay
                    bookingCode={successBookingCode}
                    onComplete={() => {
                        if (successBookingCode) {
                            router.push(`/${language}/tours/success?bookingCode=${successBookingCode}`);
                        } else {
                            router.push(`/${language}/tours`);
                        }
                    }}
                    title={t.tours.confirmSuccessTitle}
                    subtitle={t.tours.redirecting}
                />
            )}

            {errorMessage && <ErrorOverlay message={errorMessage} onClose={() => setErrorMessage("")} />}
        </div>
    );
}
