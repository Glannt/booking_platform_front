"use client";
import React, { createContext, useContext, useState } from "react";
import { useI18n } from "@/context/LanguageContext";

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
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  isModalClosing: boolean;
  closeModal: () => void;
  handleCancelBooking: (ref: string) => void;
  handleRequestCancelBooking: (ref: string) => void;
  toastMessage: string | null;
  setToastMessage: (msg: string | null) => void;
}

const DashboardContext = createContext<DashboardContextProps | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useI18n();
  const [bookings, setBookings] = useState<Booking[]>([
    {
      ref: "#MK-82910",
      route: "Cam Ranh ➔ Da Lat",
      date: "Oct 24, 2024",
      status: "confirmed",
      type: "Airport Transfer",
      customerName: "Minh Khoa",
      guests: 4,
      carName: "Ford Everest Premium",
      carImage: "/premium_suv_ford_everest.png",
      carClass: "Premium SUV",
      carSeats: 7,
      baggageWeight: 60,
      pickupLocation: "Sân bay Cam Ranh (CXR)",
      dropoffLocation: "Nha Trang Center, 20 Trần Phú",
      pickupTime: "2026-10-24 08:30",
      createdTime: "2026-06-22T10:00:00",
      flightNumber: "VJ-382",
      estDepartureTime: "2026-10-24 06:15",
      landingTime: "2026-10-24 08:00",
    },
    {
      ref: "#MK-77219",
      route: "Hanoi ➔ Sapa",
      date: "Sep 15, 2024",
      status: "completed",
      type: "Inter-provincial Rent",
      customerName: "Minh Khoa",
      guests: 6,
      carName: "Toyota Fortuner",
      carImage: "/premium_suv_ford_everest.png",
      carClass: "SUV",
      carSeats: 7,
      baggageWeight: 45,
      pickupLocation: "Hà Nội",
      dropoffLocation: "Sa Pa, Lào Cai",
      pickupTime: "2026-09-15 07:00",
      createdTime: "2026-06-20T09:00:00",
    },
    {
      ref: "#MK-90123",
      route: "Da Nang ➔ Hoi An",
      date: "Nov 02, 2024",
      status: "pending",
      type: "Inter-provincial Rent",
      customerName: "Minh Khoa",
      guests: 2,
      carName: "Kia Carnival",
      carImage: "/premium_suv_ford_everest.png",
      carClass: "Premium MPV",
      carSeats: 7,
      baggageWeight: 30,
      pickupLocation: "Đà Nẵng Airport",
      dropoffLocation: "Hội An Ancient Town",
      pickupTime: "2026-11-02 14:00",
      createdTime: new Date(new Date().getTime() - 30 * 60 * 1000).toISOString(),
    },
    {
      ref: "#MK-11029",
      route: "Cam Ranh ➔ Nha Trang",
      date: "Jul 05, 2024",
      status: "confirmed",
      type: "Airport Transfer",
      customerName: "Minh Khoa",
      guests: 3,
      carName: "Hyundai SantaFe",
      carImage: "/premium_suv_ford_everest.png",
      carClass: "SUV",
      carSeats: 7,
      baggageWeight: 40,
      pickupLocation: "Sân bay Cam Ranh (CXR)",
      dropoffLocation: "Nha Trang Center",
      pickupTime: "2026-07-05 10:30",
      createdTime: "2026-06-22T15:00:00",
      flightNumber: "VN-1560",
      estDepartureTime: "2026-07-05 12:45",
      landingTime: "2026-07-05 14:30",
    },
    {
      ref: "#MK-55481",
      route: "Nha Trang ➔ Da Lat",
      date: "Aug 12, 2024",
      status: "cancelled",
      type: "Inter-provincial Rent",
      customerName: "Minh Khoa",
      guests: 5,
      carName: "Ford Everest Premium",
      carImage: "/premium_suv_ford_everest.png",
      carClass: "Premium SUV",
      carSeats: 7,
      baggageWeight: 50,
      pickupLocation: "Nha Trang",
      dropoffLocation: "Đà Lạt, Lâm Đồng",
      pickupTime: "2026-08-12 08:00",
      createdTime: "2026-06-10T11:00:00",
    },
    {
      ref: "#MK-33290",
      route: "Cam Ranh ➔ Nha Trang",
      date: "Dec 25, 2024",
      status: "pending",
      type: "Airport Transfer",
      customerName: "Minh Khoa",
      guests: 2,
      carName: "Toyota Vios",
      carImage: "/premium_suv_ford_everest.png",
      carClass: "Sedan",
      carSeats: 4,
      baggageWeight: 20,
      pickupLocation: "Sân bay Cam Ranh (CXR)",
      dropoffLocation: "Vinpearl Nha Trang",
      pickupTime: "2026-12-25 18:00",
      createdTime: new Date(new Date().getTime() - 10 * 60 * 1000).toISOString(),
      flightNumber: "QH-1412",
      estDepartureTime: "2026-12-25 15:30",
      landingTime: "2026-12-25 17:15",
    },
    {
      ref: "#MK-12458",
      route: "HCM ➔ Vung Tau",
      date: "Sep 30, 2024",
      status: "confirmed",
      type: "Inter-provincial Rent",
      customerName: "Minh Khoa",
      guests: 7,
      carName: "Mitsubishi Xpander",
      carImage: "/premium_suv_ford_everest.png",
      carClass: "MPV",
      carSeats: 7,
      baggageWeight: 55,
      pickupLocation: "Hồ Chí Minh",
      dropoffLocation: "Vũng Tàu",
      pickupTime: "2026-09-30 06:00",
      createdTime: "2026-06-15T08:00:00",
    }
  ]);

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const closeModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsModalClosing(false);
    }, 180);
  };

  const handleCancelBooking = (ref: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.ref === ref ? { ...b, status: "cancelled" as const } : b))
    );
    // If the currently selected booking is cancelled, update its modal reference state as well
    setSelectedBooking((prev) => prev && prev.ref === ref ? { ...prev, status: "cancelled" as const } : prev);
    const msg = language === "vi" ? "Đã hủy trực tiếp đơn đặt!" : "Booking cancelled directly!";
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRequestCancelBooking = (ref: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.ref === ref ? { ...b, status: "cancellation_requested" as const } : b))
    );
    setSelectedBooking((prev) => prev && prev.ref === ref ? { ...prev, status: "cancellation_requested" as const } : prev);
    const msg = language === "vi" ? "Đã gửi yêu cầu hủy đơn đặt!" : "Cancellation request submitted!";
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <DashboardContext.Provider
      value={{
        bookings,
        setBookings,
        selectedBooking,
        setSelectedBooking,
        isModalOpen,
        setIsModalOpen,
        isModalClosing,
        closeModal,
        handleCancelBooking,
        handleRequestCancelBooking,
        toastMessage,
        setToastMessage,
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
