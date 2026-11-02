"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useI18n } from "@/context/LanguageContext";
import { getMyBookings, requestBookingCancellation, type BookingDto } from "@/lib/api/bookings";

export interface Booking {
  ref: string;
  route: string;
  date: string;
  status: "confirmed" | "completed" | "pending" | "cancelled" | "cancellation_requested";
  type: string;
  customerName: string;
  guests: number;
  carName: string;
  carImage: string;
  carClass: string;
  carSeats: number;
  baggageWeight: number;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  createdTime: string;
  flightNumber?: string;
  estDepartureTime?: string;
  landingTime?: string;
}

interface DashboardContextProps {
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  selectedBooking: Booking | null;
  setSelectedBooking: (booking: Booking | null) => void;
  bookingsDto: BookingDto[];
  selectedBookingDto: BookingDto | null;
  openBookingDetail: (booking: Booking) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  isModalClosing: boolean;
  closeModal: () => void;
  handleCancelBooking: (ref: string) => void;
  handleRequestCancelBooking: (ref: string) => void;
  refreshBookings: () => Promise<void>;
  toastMessage: string | null;
  setToastMessage: (msg: string | null) => void;
  activeRole: "customer" | "admin";
  setActiveRole: (role: "customer" | "admin") => void;
  loading: boolean;
}

const DashboardContext = createContext<DashboardContextProps | undefined>(undefined);

function mapBookingDtoToBooking(dto: BookingDto): Booking {
  const firstItem = dto.items?.[0];
  const dynamicDetails = firstItem?.dynamicDetails ? parseDynamicDetails(firstItem.dynamicDetails) : {};

  const serviceName = firstItem?.serviceName?.vi || firstItem?.serviceName?.en || "";
  let bookingType = "Service";
  if (serviceName.toLowerCase().includes("airport") || serviceName.toLowerCase().includes("sân bay")) {
    bookingType = "Airport Transfer";
  } else if (serviceName.toLowerCase().includes("intercity") || serviceName.toLowerCase().includes("đi tỉnh")) {
    bookingType = "Inter-provincial Rent";
  } else if (serviceName.toLowerCase().includes("self") || serviceName.toLowerCase().includes("tự lái")) {
    bookingType = "Self-drive";
  } else if (serviceName.toLowerCase().includes("tour")) {
    bookingType = "Tour";
  }

  const pickupLocation = firstItem?.pickupLocation || dynamicDetails.outboundPickupAddress || "";
  const dropoffLocation = firstItem?.dropoffLocation || dynamicDetails.outboundDropoffAddress || "";
  const route = pickupLocation && dropoffLocation ? `${pickupLocation} ➔ ${dropoffLocation}` : serviceName;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  const status = dto.bookingStatus as Booking["status"];

  return {
    ref: `#${dto.bookingCode}`,
    route,
    date: formatDate(dto.createdAt),
    status,
    type: bookingType,
    customerName: dto.customerName,
    guests: firstItem?.quantity || 0,
    // No fallback values here: empty/0 means "no data" and the UI hides the field.
    carName: dynamicDetails.vehicleCategoryName || "",
    carImage: "",
    carClass: dynamicDetails.vehicleCategoryName || "",
    carSeats: Number(dynamicDetails.maxSeat) || 0,
    baggageWeight: Number(dynamicDetails.baggageWeight) || 0,
    pickupLocation,
    dropoffLocation,
    pickupTime: firstItem?.startDate ? formatDateTime(firstItem.startDate) : "",
    createdTime: dto.createdAt,
    flightNumber: firstItem?.flightNumber || dynamicDetails.outboundFlightNumber,
    estDepartureTime: dynamicDetails.outboundPickupTime ? formatDateTime(dynamicDetails.outboundPickupTime) : undefined,
    landingTime: dynamicDetails.landingTime ? formatDateTime(dynamicDetails.landingTime) : undefined,
  };
}

function parseDynamicDetails(json: string): Record<string, any> {
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useI18n();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsDto, setBookingsDto] = useState<BookingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedBookingDto, setSelectedBookingDto] = useState<BookingDto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshBookings = useCallback(async () => {
    try {
      const dtos = await getMyBookings();
      setBookingsDto(dtos);
      setBookings(dtos.map(mapBookingDtoToBooking));
    } catch {
      // API not available — keep current list
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBookings();
  }, [refreshBookings]);

  const closeModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsModalClosing(false);
    }, 180);
  };

  const openBookingDetail = (booking: Booking) => {
    const dto = bookingsDto.find((b) => b.bookingCode === booking.ref.replace(/^#/, "")) ?? null;
    setSelectedBooking(booking);
    setSelectedBookingDto(dto);
    setIsModalOpen(true);
  };

  const handleCancelBooking = (ref: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.ref === ref ? { ...b, status: "cancelled" as const } : b))
    );
    setSelectedBooking((prev) => prev && prev.ref === ref ? { ...prev, status: "cancelled" as const } : prev);
    const msg = language === "vi" ? "Đã hủy trực tiếp đơn đặt!" : "Booking cancelled directly!";
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRequestCancelBooking = async (ref: string) => {
    const code = ref.replace(/^#/, "");
    const dto = bookingsDto.find((b) => b.bookingCode === code);
    if (!dto?.id) {
      const notFound = language === "vi" ? "Không tìm thấy đơn đặt để yêu cầu hủy!" : "Booking not found for cancellation request!";
      setToastMessage(notFound);
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    try {
      await requestBookingCancellation(dto.id);
      const dtos = await getMyBookings();
      setBookingsDto(dtos);
      setBookings(dtos.map(mapBookingDtoToBooking));
      setSelectedBooking((prev) => prev && prev.ref === ref ? { ...prev, status: "cancellation_requested" as const } : prev);
      const msg = language === "vi" ? "Đã gửi yêu cầu hủy đơn đặt!" : "Cancellation request submitted!";
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      const msg = language === "vi" ? "Gửi yêu cầu hủy thất bại. Vui lòng thử lại!" : "Failed to submit cancellation request. Please try again!";
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const [activeRole, setActiveRole] = useState<"customer" | "admin">("customer");

  return (
    <DashboardContext.Provider
      value={{
        bookings,
        setBookings,
        selectedBooking,
        setSelectedBooking,
        bookingsDto,
        selectedBookingDto,
        openBookingDetail,
        isModalOpen,
        setIsModalOpen,
        isModalClosing,
        closeModal,
        handleCancelBooking,
        handleRequestCancelBooking,
        refreshBookings,
        toastMessage,
        setToastMessage,
        activeRole,
        setActiveRole,
        loading,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};
