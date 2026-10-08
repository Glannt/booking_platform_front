"use client";

import React from "react";
import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalCloseTrigger,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
} from "@heroui/react";
import { User, Mail, Phone, Package, FileText } from "lucide-react";
import { BookingDto, BookingItemDto, DepositType } from "@/lib/api/bookings";
import { useI18n } from "@/context/LanguageContext";
import clsx from "clsx";

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingDto | null;
}

type ServiceKind = "tour" | "self-drive" | "intercity" | "airport" | "general";

const formatPrice = (price: number | null | undefined) => {
  const n = Number(price ?? 0);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const parseDynamicDetails = (detailsStr?: string): Record<string, any> => {
  if (!detailsStr) return {};
  try {
    const trimmed = detailsStr.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const parsed = JSON.parse(trimmed);
      return parsed && typeof parsed === "object" ? parsed : {};
    }
  } catch {
    // not JSON (legacy text details) — fall through
  }
  return {};
};

/** How the server tagged this item — maps to the per-service detail view. */
const detectServiceKind = (item: BookingItemDto): ServiceKind => {
  const data = parseDynamicDetails(item.dynamicDetails);

  if (item.intercityBookingDetailId != null) return "intercity";
  if (item.selfDriveBookingDetailId != null) return "self-drive";
  if (data.serviceType === "PRIVATE" || data.serviceType === "SHARED") return "intercity";
  if (data.tourId != null || data.tourPackageId != null || data.adultCount != null || data.pricingType) return "tour";
  if (data.outboundDirection || data.actualKm != null || data.luggageWeight != null || data.outboundFlightNumber) return "airport";

  const name = `${item.serviceName?.vi || ""} ${item.serviceName?.en || ""}`.toLowerCase();
  if (name.includes("sân bay") || name.includes("airport")) return "airport";
  if (name.includes("đi tỉnh") || name.includes("intercity")) return "intercity";
  if (name.includes("tự lái") || name.includes("self-drive") || name.includes("self drive")) return "self-drive";
  if (name.includes("tour")) return "tour";
  return "general";
};

function InfoField({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string | number | null;
}) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-center gap-2.5">
      {icon && <span className="text-foreground/40 shrink-0">{icon}</span>}
      <div className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-foreground/50">{label}</span>
        <span className="block text-sm font-semibold text-foreground break-words">{value}</span>
      </div>
    </div>
  );
}

function GridField({
  label,
  value,
  className,
}: {
  label: string;
  value?: string | number | null;
  className?: string;
}) {
  if (value == null || value === "") return null;
  return (
    <div className={clsx("bg-[var(--bg-muted)] dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-1", className)}>
      <span className="block text-[10px] font-bold uppercase tracking-wider text-foreground/50">{label}</span>
      <span className="block text-sm font-bold text-foreground break-words">{value}</span>
    </div>
  );
}

function SectionTitle({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground/50 flex items-center gap-1.5 mb-3">
      {icon}
      {children}
    </p>
  );
}

function TourDetail({ data, mb, tb }: { data: Record<string, any>; mb: any; tb: any }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {data.packageName && (
        <div className="col-span-2">
          <InfoField icon={<Package size={14} />} label={mb.tourPackage} value={data.packageName} />
        </div>
      )}
      <GridField label={mb.guestsCount} value={data.guestCount != null ? Number(data.guestCount) : undefined} />
      <GridField label={mb.adults} value={data.adultCount != null ? Number(data.adultCount) : undefined} />
      <GridField label={mb.children} value={data.childCount != null ? Number(data.childCount) : undefined} />
      <GridField label={mb.infants} value={data.infantCount != null ? Number(data.infantCount) : undefined} />
      <GridField label={mb.pickupTime} value={formatDate(data.startTime)} />
      <GridField label={mb.pickup} value={data.pickupLocation ?? data.meetingPoint} />
      {data.note && <GridField label={tb.customerNotes} value={data.note} className="col-span-2" />}
    </div>
  );
}

function SelfDriveDetail({ data, mb, tb, t }: { data: Record<string, any>; mb: any; tb: any; t: any }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <GridField
        label={mb.rentalPeriod}
        value={data.rentalDays != null ? `${data.rentalDays} ${t.common?.days || "ngày"}` : undefined}
      />
      <GridField label={mb.departure} value={formatDate(data.startDate)} />
      <GridField label={mb.return} value={formatDate(data.endDate)} />
      <GridField label={mb.pickup} value={data.pickupLocation} />
      <GridField label={mb.dropoff} value={data.dropoffLocation} />
      {data.note && <GridField label={tb.customerNotes} value={data.note} className="col-span-2" />}
    </div>
  );
}

function IntercityDetail({ data, mb, tb, t }: { data: Record<string, any>; mb: any; tb: any; t: any }) {
  const dep = [data.departureDate, data.departureTime].filter(Boolean).join(" ") || null;
  const ret = [data.returnDate, data.returnTime].filter(Boolean).join(" ") || null;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {data.serviceType && (
          <Chip size="sm" color={data.serviceType === "SHARED" ? "success" : "accent"} variant="soft" className="font-bold text-[10px]">
            {data.serviceType === "SHARED" ? (t.rentCar?.sharedService || "Vé xe ghép") : (t.rentCar?.privateService || "Xe riêng")}
          </Chip>
        )}
        {data.tripType && (
          <Chip size="sm" color="accent" variant="soft" className="font-bold text-[10px]">
            {data.tripType === "ONE_WAY" ? (t.rentCar?.oneWay || "1 Chiều") : data.tripType === "ROUND_TRIP" ? (t.rentCar?.roundTrip || "Khứ hồi") : data.tripType}
          </Chip>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <GridField label={mb.route} value={data.routeName || undefined} />
        <GridField label={mb.guestsCount} value={data.passengerCount != null ? Number(data.passengerCount) : undefined} />
        <GridField label={mb.departure} value={dep || undefined} />
        <GridField label={mb.return} value={ret || undefined} />
        <GridField label={mb.pickup} value={data.pickupAddress} />
        <GridField label={mb.dropoff} value={data.dropoffAddress} />
        {data.note && <GridField label={tb.customerNotes} value={data.note} className="col-span-2" />}
      </div>
    </div>
  );
}

function AirportDetail({ data, mb, tb, t }: { data: Record<string, any>; mb: any; tb: any; t: any }) {
  const outboundTime = formatDate(data.outboundPickupTime || data.outboundDate);
  const returnTime = formatDate(data.returnPickupTime || data.returnDate);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {data.tripType && (
          <Chip size="sm" color="accent" variant="soft" className="font-bold text-[10px]">
            {data.tripType === "ONE_WAY" ? (t.rentCar?.oneWay || "1 Chiều") : data.tripType === "ROUND_TRIP" ? (t.rentCar?.roundTrip || "Khứ hồi") : data.tripType}
          </Chip>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <GridField label={mb.departure} value={outboundTime} />
        <GridField label={mb.flightNumber} value={data.outboundFlightNumber} />
        <GridField label={mb.pickup} value={data.outboundPickupAddress} />
        <GridField label={mb.dropoff} value={data.outboundDropoffAddress} />
        <GridField label={mb.return} value={returnTime} />
        <GridField label={mb.flightNumber} value={data.returnFlightNumber} />
        {data.returnPickupAddress && <GridField label={mb.pickup} value={data.returnPickupAddress} />}
        {data.returnDropoffAddress && <GridField label={mb.dropoff} value={data.returnDropoffAddress} />}
        <GridField label={mb.guestsCount} value={data.passengerCount != null ? Number(data.passengerCount) : undefined} />
        <GridField label={mb.baggage} value={data.luggageWeight != null ? `${data.luggageWeight} kg` : undefined} />
        {data.note && <GridField label={tb.customerNotes} value={data.note} className="col-span-2" />}
      </div>
    </div>
  );
}

function ServiceDetailRow({
  kind,
  item,
  mb,
  tb,
  t,
  language,
}: {
  kind: ServiceKind;
  item: BookingItemDto;
  mb: any;
  tb: any;
  t: any;
  language: string;
}) {
  const data = parseDynamicDetails(item.dynamicDetails);
  const serviceName =
    (item.serviceName && (item.serviceName[language] || item.serviceName.vi || item.serviceName.en)) || undefined;
  const optionName =
    item.serviceOptionName &&
    (item.serviceOptionName[language] || item.serviceOptionName.vi || item.serviceOptionName.en);

  const typeLabels: Record<ServiceKind, string> = {
    tour: mb.tour,
    "self-drive": mb.selfDrive,
    intercity: mb.interProvincial,
    airport: mb.airportTransfer,
    general: mb.bookingType,
  };

  const pricing = formatPrice(item.totalPrice);
  const unit = formatPrice(item.unitPrice);

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-[var(--bg-card)]">
      <div className="px-4 py-3 bg-[var(--bg-muted)] dark:bg-[var(--bg-surface)] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Chip size="sm" color="accent" variant="soft" className="font-bold text-[10px] shrink-0">
            {typeLabels[kind]}
          </Chip>
          {serviceName && <span className="text-sm font-bold text-foreground truncate">{serviceName}</span>}
        </div>
        {pricing && <span className="text-sm font-black text-foreground shrink-0">{pricing}</span>}
      </div>

      <div className="p-4 space-y-3">
        {optionName && <InfoField icon={<FileText size={14} />} label={tb.serviceSpecs} value={optionName} />}

        {kind === "tour" && <TourDetail data={data} mb={mb} tb={tb} />}
        {kind === "self-drive" && <SelfDriveDetail data={data} mb={mb} tb={tb} t={t} />}
        {kind === "intercity" && <IntercityDetail data={data} mb={mb} tb={tb} t={t} />}
        {kind === "airport" && <AirportDetail data={data} mb={mb} tb={tb} t={t} />}

        {/* Generic fallback — only when the item has no per-type detail to avoid duplication */}
        {kind === "general" && (
          <>
            {(item.startDate || item.endDate) && (
              <div className="grid grid-cols-2 gap-3">
                <GridField label={tb.pickupTime} value={formatDate(item.startDate)} />
                <GridField label={tb.dropoffLocation} value={formatDate(item.endDate)} />
              </div>
            )}

            {(item.pickupLocation || item.dropoffLocation) && (
              <div className="grid grid-cols-2 gap-3">
                <GridField label={mb.pickup} value={item.pickupLocation} />
                <GridField label={mb.dropoff} value={item.dropoffLocation} />
              </div>
            )}

            {item.flightNumber && <GridField label={mb.flightNumber} value={item.flightNumber} />}
          </>
        )}

        {unit && pricing && Number(item.quantity) > 1 && (
          <p className="text-xs font-medium text-foreground/60">
            {item.quantity} × {unit}
          </p>
        )}
      </div>
    </div>
  );
}

export default function BookingDetailModal({ isOpen, onClose, booking }: BookingDetailModalProps) {
  const { t, language } = useI18n();
  const mb = t.myBookings;
  const tb = t.adminBookings;

  if (!booking) return null;

  const total = booking.totalAmount ?? 0;
  const deposit = booking.depositAmount ?? 0;
  const received = booking.receivedAmount ?? 0;
  const remaining = booking.remainingAmount ?? Math.max(0, total - (booking.paidAmount ?? deposit + received));
  const showFinancial = total > 0 || received > 0 || remaining > 0;

  const statusLabel =
    booking.bookingStatus === "cancellation_requested"
      ? mb.reqCancelledStatus
      : (t.status as any)?.[booking.bookingStatus] || booking.bookingStatus;

  const statusBadge = (() => {
    switch (booking.bookingStatus) {
      case "confirmed": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      case "completed": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";
      case "cancelled": return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20";
      case "cancellation_requested": return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20";
      case "pending":
      default: return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
    }
  })();

  const paymentLabel = (() => {
    switch (booking.paymentStatus) {
      case "PAID": return tb.paid;
      case "DEPOSITED": case "PARTIAL": return tb.deposited;
      case "REFUNDED": return tb.refunded;
      default: return tb.unpaid;
    }
  })();

  const paymentBadge = (() => {
    switch (booking.paymentStatus) {
      case "PAID": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      case "DEPOSITED": case "PARTIAL": return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
      case "REFUNDED": return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20";
      default: return "bg-[var(--bg-muted)] dark:bg-[var(--bg-card)] text-foreground/50 border border-border/50";
    }
  })();

  const firstKind = booking.items?.length ? detectServiceKind(booking.items[0]) : "general";
  const typeLabels: Record<ServiceKind, string> = {
    tour: mb.tour,
    "self-drive": mb.selfDrive,
    intercity: mb.interProvincial,
    airport: mb.airportTransfer,
    general: mb.bookingType,
  };
  const typeLabel = typeLabels[firstKind];

  const depositTypeLabel =
    booking.depositType === DepositType.RATE && booking.depositRate != null
      ? `${booking.depositRate}%`
      : booking.depositType || undefined;

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="dashboard-booking-detail-title">
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Chip size="sm" color="accent" variant="soft" className="font-bold text-[10px]">{typeLabel}</Chip>
                  <span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-bold capitalize", statusBadge)}>{statusLabel}</span>
                  <span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-bold", paymentBadge)}>{paymentLabel}</span>
                </div>
                <h3 id="dashboard-booking-detail-title" className="text-lg font-extrabold text-foreground mt-2">
                  {booking.bookingCode}
                </h3>
                <p className="text-xs font-medium text-foreground/60 mt-0.5">
                  {mb.bookingDate}: {formatDate(booking.createdAt)}
                </p>
              </div>
            </ModalHeader>

            <ModalBody className="p-6 space-y-5 overflow-y-auto">
              {/* Financial summary */}
              {showFinancial && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-[var(--bg-muted)] dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800">
                    <span className="block text-[11px] font-bold text-foreground/60 uppercase tracking-wider">{tb.totalAmount}</span>
                    <span className="block text-base font-black text-foreground mt-1">{formatPrice(total) ?? "0₫"}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">{tb.depositAmount}</span>
                      {depositTypeLabel && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 font-bold uppercase">{depositTypeLabel}</span>
                      )}
                    </div>
                    <span className="block text-base font-black text-amber-600 dark:text-amber-400 mt-1">{formatPrice(deposit) ?? "0₫"}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                    <span className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{tb.receivedAmount}</span>
                    <span className="block text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatPrice(received) ?? "0₫"}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
                    <span className="block text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">{tb.remainingAmount}</span>
                    <span className={clsx("block text-base font-black mt-1", remaining > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground/50")}>
                      {formatPrice(remaining) ?? "0₫"}
                    </span>
                  </div>
                </div>
              )}

              {/* Customer + contact info */}
              <div>
                <SectionTitle icon={<User size={12} />}>{t.booking?.step3 || "Thông tin khách hàng"}</SectionTitle>
                <div className="bg-[var(--bg-muted)] dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                  <InfoField icon={<User size={15} />} label={mb.customerName} value={booking.customerName} />
                  {booking.customerEmail && <InfoField icon={<Mail size={15} />} label={t.booking?.email || "Email"} value={booking.customerEmail} />}
                  {booking.customerPhone && <InfoField icon={<Phone size={15} />} label={t.booking?.phone || "Phone"} value={booking.customerPhone} />}
                  {(booking.zaloId || booking.kakaoTalkId || booking.whatsapp) && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {booking.zaloId && <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[11px] font-bold">Zalo: {booking.zaloId}</span>}
                      {booking.kakaoTalkId && <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[11px] font-bold">KakaoTalk: {booking.kakaoTalkId}</span>}
                      {booking.whatsapp && <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">WhatsApp: {booking.whatsapp}</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Service details — one card per booked line, rendered per service type */}
              {booking.items?.length ? (
                <div className="space-y-4">
                  <SectionTitle icon={<FileText size={12} />}>{tb.bookingDetails || "Chi tiết dịch vụ"}</SectionTitle>
                  {booking.items.map((item, idx) => (
                    <ServiceDetailRow
                      key={item.id ?? idx}
                      kind={detectServiceKind(item)}
                      item={item}
                      mb={mb}
                      tb={tb}
                      t={t}
                      language={language}
                    />
                  ))}
                </div>
              ) : null}

              {/* Customer notes */}
              {booking.customerNotes && (
                <div>
                  <SectionTitle icon={<FileText size={12} />}>{tb.customerNotes || "Ghi chú"}</SectionTitle>
                  <p className="text-sm font-medium text-foreground/80 bg-[var(--bg-muted)] dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 whitespace-pre-wrap">
                    {booking.customerNotes}
                  </p>
                </div>
              )}
            </ModalBody>

            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
              <Button
                variant="outline"
                onPress={onClose}
                className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                {mb.close}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}