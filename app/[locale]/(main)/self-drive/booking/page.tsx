"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  Label,
  ListBox,
  Button,
  Skeleton,
  Input,
  TextField,
  toast
} from "@heroui/react";
import { DateValue } from "@internationalized/date";
import { getLocalTimeZone, today } from "@internationalized/date";
import {
  Car,
  MapPin,
  CalendarDays,
  User,
  Phone,
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle
} from "lucide-react";

import { TimePicker, type TimeValue } from "@/components/time-picker";
import { useI18n } from "@/context/LanguageContext";
import { useAuthStore } from "@/lib/store/authStore";
import { AutofillButton } from "@/components/AutofillButton";
import { getActiveRentals, createBooking, getRentalPricesByRental, type RentalPriceDto } from "@/lib/api/rental";
import { getVehicleCategories, type VehicleCategoryDto } from "@/lib/api/fleet";
import BookingConfirmationModal from "@/components/BookingConfirmationModal";

interface Vehicle {
  id: string;
  rentalId: number;
  vehicleCategoryId: number;
  name: string;
  desc: string;
  pricePerDay: number;
  deposit: number;
  minimumDays: number;
  capacity: string;
}

export default function SelfDriveBookingPage() {
  const { language, t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const vi = language === "vi";
  const user = useAuthStore((s) => s.user);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [selectedVehicleKey, setSelectedVehicleKey] = useState<string | undefined>();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [dateValue, setDateValue] = useState<DateValue | null>(null);
  const [timeValue, setTimeValue] = useState<TimeValue>({ hour: 8, minute: 0, period: "AM" });
  const [rentalDays, setRentalDays] = useState<number>(1);
  const [pickupLocation, setPickupLocation] = useState("");
  const [notes, setNotes] = useState("");

  const [price, setPrice] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showContactMenu, setShowContactMenu] = useState(false);

  const currentDate = today(getLocalTimeZone());
  const isDateInvalid = dateValue != null && dateValue.compare(currentDate) < 0;

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleKey) || vehicles[0];

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [rentalsRes, categoriesRes] = await Promise.all([
          getActiveRentals(),
          getVehicleCategories({ active: true })
        ]);
        if (!active) return;

        const rentals = rentalsRes?.data || [];
        const categories = categoriesRes?.data?.content || [];
        const catMap = new Map<number, VehicleCategoryDto>();
        categories.forEach(c => catMap.set(c.id, c));

        const priceResults = await Promise.all(
          rentals.filter(r => !r.driverRequired).map(r =>
            getRentalPricesByRental(r.id).then(res => ({
              rentalId: r.id,
              prices: (res?.data || []) as RentalPriceDto[]
            })).catch(() => ({ rentalId: r.id, prices: [] as RentalPriceDto[] }))
          )
        );
        const priceMap = new Map<number, RentalPriceDto[]>();
        priceResults.forEach(p => priceMap.set(p.rentalId, p.prices));

        const mapped: Vehicle[] = rentals
          .filter(r => !r.driverRequired)
          .map(r => {
            const cat = catMap.get(r.vehicleCategoryId);
            const trans = cat?.translations?.find(tr => tr.locale === language) || cat?.translations?.[0];
            const name = trans?.name || (vi ? "Phân khúc xe" : "Vehicle Segment");
            const rentalPrices = priceMap.get(r.id) || [];
            const activePrice = rentalPrices.find(p => p.active && p.vehicleCategoryId === r.vehicleCategoryId);
            const dailyRate = activePrice ? Number(activePrice.amount) : 0;
            const capacity = cat ? `${cat.minSeat}-${cat.maxSeat}` : "5";

            return {
              id: `${r.id}-${r.vehicleCategoryId}`,
              rentalId: r.id,
              vehicleCategoryId: r.vehicleCategoryId,
              name,
              desc: trans?.description || "",
              pricePerDay: dailyRate,
              deposit: r.deposit || 0,
              minimumDays: r.minimumDays || 1,
              capacity
            };
          });

        if (!active) return;
        setVehicles(mapped);

        const vehicleIdParam = searchParams.get("vehicleId");
        const match = vehicleIdParam && mapped.find(v => v.id === vehicleIdParam);
        setSelectedVehicleKey(match ? match.id : mapped[0]?.id);
      } catch (err) {
        console.error("Failed to load vehicles:", err);
      } finally {
        setVehiclesLoading(false);
      }
    })();
    return () => { active = false; };
  }, [language, vi, searchParams]);

  useEffect(() => {
    if (!selectedVehicle || !selectedVehicle.pricePerDay) { setPrice(0); return; }
    setIsCalculating(true);
    const timer = setTimeout(() => {
      setPrice(selectedVehicle.pricePerDay * rentalDays);
      setIsCalculating(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedVehicle, rentalDays]);

  useEffect(() => {
    if (user) {
      if (user.fullname && !customerName) setCustomerName(user.fullname);
      if (user.email && !customerEmail) setCustomerEmail(user.email);
      if (user.phone && !customerPhone) setCustomerPhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDateInvalid || !dateValue || isSubmitting || !customerName.trim() || !customerPhone.trim() || !selectedVehicle) return;
    setShowConfirmModal(true);
  };

  const handleConfirmBooking = async () => {
    if (isDateInvalid || !dateValue || isSubmitting || !customerName.trim() || !customerPhone.trim() || !selectedVehicle) return;

    setIsSubmitting(true);
    try {
      const startDate = `${dateValue.year}-${String(dateValue.month).padStart(2, "0")}-${String(dateValue.day).padStart(2, "0")}`;
      const startTime = `${String(timeValue.hour).padStart(2, "0")}:${String(timeValue.minute).padStart(2, "0")}`;

      const dynamicDetails = JSON.stringify({
        vehicleCategoryId: selectedVehicle.vehicleCategoryId,
        rentalId: selectedVehicle.rentalId,
        startDate,
        startTime,
        rentalDays,
        basePrice: selectedVehicle.pricePerDay,
        totalPrice: price,
        deposit: selectedVehicle.deposit,
        pickupLocation,
        vehicleName: selectedVehicle.name
      });

      const res = await createBooking({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || `${customerPhone.trim()}@traveler.com`,
        customerPhone: customerPhone.trim(),
        customerNotes: notes.trim() || (vi ? `Thuê xe tự lái - ${selectedVehicle.name}` : `Self-drive rental - ${selectedVehicle.name}`),
        items: [{
          serviceId: 103,
          quantity: rentalDays,
          unitPrice: selectedVehicle.pricePerDay,
          dynamicDetails,
          pickupLocation
        }]
      });

      if (res?.data?.bookingCode) {
        setBookingSuccess(res.data.bookingCode);
        toast.success(vi ? `Đặt xe thành công! Mã đặt: ${res.data.bookingCode}` : `Booking successful! Code: ${res.data.bookingCode}`);
      }
    } catch (err) {
      console.error("Booking failed:", err);
      toast.danger(vi ? "Đặt xe thất bại. Vui lòng thử lại." : "Booking failed. Please try again.");
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 font-sans">


      {/* Hero */}
      <section className="relative w-full min-h-[340px] flex items-center pt-28 pb-14 px-6 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-[1px]" />
        <div className="relative z-10 max-w-7xl w-full mx-auto space-y-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 bg-white/10 dark:bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white hover:bg-white/20 transition-colors cursor-pointer border border-white/20"
          >
            <ArrowLeft size={13} />
            {vi ? "Quay lại" : "Back"}
          </button>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            {vi ? "Đặt xe tự lái Nha Trang" : "Self-Drive Car Booking"}
          </h1>
          <p className="text-sm text-slate-200 font-medium max-w-xl">
            {vi ? "Chọn xe, điền thông tin và nhận xe ngay trong ngày." : "Choose your vehicle, fill in details, and pick up the car today."}
          </p>
        </div>
      </section>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left: Form */}
          <div className="lg:col-span-8 space-y-6">

            {bookingSuccess ? (
              <div className="bg-white dark:bg-black rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 text-center space-y-5 animate-fade-in-up">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 space-y-3">
                  <CheckCircle size={32} className="text-green-600 dark:text-green-400 mx-auto" />
                  <h3 className="text-base font-extrabold text-green-800 dark:text-green-200">
                    {vi ? "Đặt xe thành công!" : "Booking Successful!"}
                  </h3>
                  <div className="bg-white dark:bg-black/40 rounded-xl px-5 py-3 border border-green-100 dark:border-green-800/40 inline-block">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                      {vi ? "Mã đặt chỗ" : "Booking Code"}
                    </p>
                    <p className="text-xl font-black font-mono text-slate-800 dark:text-white tracking-wider">
                      {bookingSuccess}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {vi ? "Chúng tôi sẽ liên hệ bạn trong thời gian sớm nhất để xác nhận." : "We will contact you as soon as possible to confirm."}
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => { setBookingSuccess(null); }} variant="outline" className="text-xs font-bold cursor-pointer">
                    {vi ? "Đặt thêm xe" : "Book Another"}
                  </Button>
                  <Button onClick={() => router.push(`/${language}/self-drive`)} className="text-xs font-bold cursor-pointer bg-accent text-white border-none">
                    {vi ? "Xem danh sách xe" : "View Fleet"}
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white dark:bg-black rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">

                <div className="space-y-1 pb-4 border-b border-slate-100 dark:border-slate-850">
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider text-accent">
                    ⚡ {vi ? "Đặt xe tự lái" : "Self-Drive Booking"}
                  </span>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    {vi ? "Thông tin đặt xe" : "Booking Details"}
                  </h2>
                </div>

                {/* Vehicle Select */}
                <div className="space-y-2">
                  {vehiclesLoading ? (
                    <Skeleton className="h-14 w-full rounded-xl" />
                  ) : (
                    <Select
                      className="w-full"
                      placeholder={vi ? "Chọn dòng xe" : "Select vehicle"}
                      selectedKey={selectedVehicleKey}
                      onSelectionChange={(key) => { if (key) setSelectedVehicleKey(String(key)); }}
                    >
                      <Label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-slate-500 mb-1.5 pl-1">
                        {vi ? "Dòng xe mong muốn" : "Desired Vehicle"}
                      </Label>
                      <Select.Trigger className="h-10 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl px-3">
                        <Select.Value className="text-xs font-semibold" />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xl">
                        <ListBox>
                          {vehicles.map((v) => (
                            <ListBox.Item id={v.id} key={v.id} textValue={v.name} className="text-xs font-semibold px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg cursor-pointer">
                              <span className="flex items-center gap-2">
                                <Car size={14} className="text-slate-400" />
                                {v.name}
                                {v.pricePerDay > 0 && (
                                  <span className="text-slate-400 font-bold">
                                    ({v.pricePerDay.toLocaleString("vi-VN")}đ/{t.selfDrive.perTrip})
                                  </span>
                                )}
                              </span>
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  )}
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col w-full">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">
                      {t.common.date} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={currentDate.toString()}
                      value={dateValue ? `${dateValue.year}-${String(dateValue.month).padStart(2, "0")}-${String(dateValue.day).padStart(2, "0")}` : ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        const [y, m, d] = val.split("-").map(Number);
                        import("@internationalized/date").then(({ CalendarDate }) => {
                          setDateValue(new CalendarDate(y, m, d));
                        });
                      }}
                      className="h-10 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs font-semibold outline-none focus:border-accent transition-colors"
                    />
                  </div>

                  <TimePicker
                    label={t.common.time}
                    labelClassName="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1"
                    value={timeValue}
                    onChange={setTimeValue}
                    popoverTitle={vi ? "Chọn giờ nhận xe" : "Select Time"}
                    language={language}
                  />
                </div>

                {/* Rental Days */}
                <div className="flex flex-col w-full">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">
                    {vi ? "Số ngày thuê" : "Rental Duration"} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center h-10 border border-slate-200 dark:border-slate-800 rounded-xl px-3 bg-white dark:bg-black focus-within:border-accent/50 transition-colors">
                    <CalendarDays size={16} className="text-slate-400 mr-2 shrink-0" />
                    <input
                      type="number"
                      required
                      min={selectedVehicle?.minimumDays || 1}
                      max={90}
                      value={rentalDays}
                      onChange={(e) => setRentalDays(Math.max(selectedVehicle?.minimumDays || 1, parseInt(e.target.value) || 1))}
                      className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
                    />
                    <span className="text-xs font-extrabold text-slate-400 shrink-0 ml-1">
                      {t.selfDrive.perTrip}
                    </span>
                  </div>
                </div>

                {/* Delivery Location */}
                <div className="flex flex-col w-full">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white mb-1.5 pl-1">
                    {vi ? "Điểm giao/nhận xe" : "Delivery Location"} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center h-10 border border-slate-200 dark:border-slate-800 rounded-xl px-3 bg-white dark:bg-black focus-within:border-accent/50 transition-colors">
                    <MapPin size={16} className="text-slate-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      required
                      placeholder={vi ? "VD: Khách sạn Mường Thanh, Sân bay..." : "e.g. Muong Thanh Hotel, Airport..."}
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white pl-1">
                      {vi ? "Thông tin liên hệ" : "Contact Information"}
                    </label>
                    <AutofillButton
                      onFill={(d) => { setCustomerName(d.fullname); setCustomerPhone(d.phone); setCustomerEmail(d.email); }}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <TextField isRequired className="w-full">
                      <Label className="text-[10px] font-extrabold uppercase tracking-wider">{t.common.name}</Label>
                      <Input
                        type="text"
                        placeholder={vi ? "Nguyễn Văn A" : "John Doe"}
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="text-xs font-semibold"
                      />
                    </TextField>
                    <TextField className="w-full">
                      <Label className="text-[10px] font-extrabold uppercase tracking-wider">Email</Label>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="text-xs font-semibold"
                      />
                    </TextField>
                    <TextField isRequired className="w-full">
                      <Label className="text-[10px] font-extrabold uppercase tracking-wider">{t.common.phone}</Label>
                      <Input
                        type="tel"
                        placeholder={vi ? "0901 234 567" : "+84 901 234 567"}
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="text-xs font-semibold"
                      />
                    </TextField>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white pl-1">
                    {t.rentCar.notes}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={vi ? "VD: Cần ghế trẻ em, giao xe sớm..." : "e.g. Child seat, early delivery..."}
                    className="w-full h-16 p-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-black text-xs font-semibold outline-none resize-none focus:border-accent transition-colors"
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  isDisabled={isDateInvalid || !dateValue || isSubmitting || !customerName.trim() || !customerPhone.trim()}
                  className="w-full h-12 rounded-2xl font-black text-sm bg-accent text-white hover:bg-accent-hover shadow-md gap-2 border-none cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2"><Loader2 size={15} className="animate-spin" />{vi ? "Đang xử lý..." : "Processing..."}</span>
                  ) : (
                    <span className="flex items-center gap-2"><CheckCircle size={15} />{vi ? "Đặt Xe Ngay" : "Book Now"}</span>
                  )}
                </Button>

              </form>
            )}
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
            <div className="bg-white dark:bg-black rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                {vi ? "Tóm tắt đặt xe" : "Booking Summary"}
              </h3>

              {vehiclesLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-32 w-full rounded-2xl" />
                  <Skeleton className="h-4 w-3/4 rounded-lg" />
                  <Skeleton className="h-4 w-1/2 rounded-lg" />
                </div>
              ) : selectedVehicle ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      <span>{vi ? "Dòng xe:" : "Vehicle:"}</span>
                      <span className="text-slate-800 dark:text-slate-200 font-extrabold text-right max-w-[60%] truncate">{selectedVehicle.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      <span>{vi ? "Sức chứa:" : "Capacity:"}</span>
                      <span className="text-slate-800 dark:text-slate-200 font-extrabold">{selectedVehicle.capacity} {vi ? "chỗ" : "seats"}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-850 pt-3 space-y-2">
                    {selectedVehicle.pricePerDay > 0 && (
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        <span>{vi ? "Đơn giá/ngày:" : "Daily rate:"}</span>
                        <span className="text-slate-800 dark:text-slate-200 font-extrabold">{selectedVehicle.pricePerDay.toLocaleString("vi-VN")}đ</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      <span>{vi ? "Thời gian thuê:" : "Duration:"}</span>
                      <span className="text-slate-800 dark:text-slate-200 font-extrabold">{rentalDays} {t.selfDrive.perTrip}</span>
                    </div>
                    {selectedVehicle.deposit > 0 && (
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        <span>{vi ? "Đặt cọc:" : "Deposit:"}</span>
                        <span className="text-slate-800 dark:text-slate-200 font-extrabold">{selectedVehicle.deposit.toLocaleString("vi-VN")}đ</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-850 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-black">{vi ? "TỔNG TẠM TÍNH:" : "EST. TOTAL:"}</span>
                      {isCalculating ? (
                        <Skeleton className="w-24 h-5 rounded-lg bg-slate-200 dark:bg-slate-800" />
                      ) : (
                        <span className="text-base font-black text-blue-700 dark:text-blue-400">{price.toLocaleString("vi-VN")}đ</span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">
                  {vi ? "Chưa chọn xe" : "No vehicle selected"}
                </p>
              )}

              <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-medium">
                🔒 {vi ? "Xe mới, sạch sẽ - Giao xe đúng hẹn" : "Modern clean car - Prompt delivery"}
              </p>
            </div>
          </div>

        </div>
      </main>

      <BookingConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmBooking}
        serviceType={vi ? "Thuê xe tự lái" : "Self-Drive Rental"}
        summaryItems={[
          { label: vi ? "Dòng xe" : "Vehicle", value: selectedVehicle?.name || "" },
          { label: vi ? "Ngày nhận xe" : "Pickup date", value: dateValue ? `${dateValue.year}-${String(dateValue.month).padStart(2, "0")}-${String(dateValue.day).padStart(2, "0")}` : "" },
          { label: vi ? "Giờ nhận xe" : "Pickup time", value: `${String(timeValue.hour).padStart(2, "0")}:${String(timeValue.minute).padStart(2, "0")}` },
          { label: vi ? "Số ngày thuê" : "Rental days", value: `${rentalDays} ${vi ? "ngày" : "days"}` },
          { label: vi ? "Điểm giao xe" : "Pickup location", value: pickupLocation || "-" },
          { label: vi ? "Họ tên" : "Name", value: customerName },
          { label: vi ? "Điện thoại" : "Phone", value: customerPhone },
          { label: vi ? "Email" : "Email", value: customerEmail || "-" },
          { label: vi ? "Ghi chú" : "Notes", value: notes || "-" },
        ]}
        totalAmount={price}
        totalLabel={vi ? "Tổng tiền tạm tính" : "Estimated total"}
        submitting={isSubmitting}
      />

      {/* Floating contact */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {showContactMenu && (
          <div className="bg-white dark:bg-slate-850 border border-slate-250 dark:border-slate-700 rounded-2xl shadow-2xl p-2.5 w-44 flex flex-col gap-2 animate-fade-in-up">
            <a href="tel:0764971971" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-accent/10 hover:text-accent transition-colors no-underline">
              <Phone size={14} className="text-accent" />
              <span>{`${t.common.callNow} 0764 971 971`}</span>
            </a>
            <a href="https://zalo.me/0764971971" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-accent/10 hover:text-accent transition-colors no-underline border-t border-slate-100 dark:border-slate-800">
              <span className="text-accent">💬</span>
              <span>Zalo Tư vấn</span>
            </a>
          </div>
        )}
        <button
          onClick={() => setShowContactMenu(!showContactMenu)}
          className={`p-4 rounded-full border shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer flex items-center justify-center border-none ${showContactMenu ? "bg-accent text-white" : "bg-white dark:bg-black text-accent dark:text-white"}`}
          aria-label="Contact Support"
        >
          <span className="text-lg">🎧</span>
        </button>
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="p-4 rounded-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-accent dark:text-white shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer animate-bounce-subtle flex items-center justify-center"
            aria-label="Back to Top"
          >
            <ArrowLeft size={22} className="rotate-90" />
          </button>
        )}
      </div>
    </div>
  );
}
