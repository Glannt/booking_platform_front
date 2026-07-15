"use client";
import React, { useState } from "react";
import { useI18n } from "@/context/LanguageContext";
import {
  Car,
  Clock,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Users,
} from "lucide-react";
import { Button } from "@heroui/react";
import clsx from "clsx";

interface DispatchTrip {
  id: string;
  route: string;
  time: string;
  customerName: string;
  phone: string;
  passengers: number;
  carType: string;
  driver: string;
  status: "dispatched" | "pending" | "completed";
}

const mockTrips: DispatchTrip[] = [
  {
    id: "TRIP-1024",
    route: "Cam Ranh Airport ➔ Da Lat City",
    time: "Today, 14:30",
    customerName: "Nguyen Minh Khoa",
    phone: "0901234567",
    passengers: 4,
    carType: "SUV 7-Seats (Premium)",
    driver: "Nguyen Van Hung",
    status: "dispatched",
  },
  {
    id: "TRIP-1025",
    route: "Nha Trang City ➔ Cam Ranh Airport",
    time: "Today, 16:00",
    customerName: "Mr. Kim Woo Jin",
    phone: "+82 10-1234-5678",
    passengers: 2,
    carType: "Sedan 4-Seats (Luxury)",
    driver: "TBD",
    status: "pending",
  },
  {
    id: "TRIP-1026",
    route: "Cam Ranh Airport ➔ Nha Trang City",
    time: "Today, 17:15",
    customerName: "Mrs. Elena Rostova",
    phone: "+7 910-123-4567",
    passengers: 6,
    carType: "Minivan 16-Seats",
    driver: "Pham Quoc Bao",
    status: "dispatched",
  },
  {
    id: "TRIP-1020",
    route: "Da Lat City ➔ Cam Ranh Airport",
    time: "Today, 08:30",
    customerName: "Tran Thanh Do",
    phone: "0987654321",
    passengers: 3,
    carType: "SUV 7-Seats",
    driver: "Le Hoang Nam",
    status: "completed",
  },
];

export default function StaffOverviewPage() {
  const { language } = useI18n();
  const [trips, setTrips] = useState<DispatchTrip[]>(mockTrips);

  const assignDriver = (tripId: string) => {
    setTrips((prev) =>
      prev.map((t) =>
        t.id === tripId
          ? { ...t, driver: "Nguyen Thanh Son", status: "dispatched" }
          : t
      )
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Dispatch Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Today's Dispatches */}
        <div className="rounded-2xl p-6 border border-slate-100 dark:border-slate-800 bg-card shadow-xs transition-colors flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {language === "vi" ? "Chuyến đi hôm nay" : "Today's Trips"}
            </span>
            <p className="text-2xl font-black text-foreground">14</p>
            <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
              <TrendingUp size={12} />
              +4 {language === "vi" ? "so với hôm qua" : "vs yesterday"}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-primary flex items-center justify-center">
            <Car size={22} />
          </div>
        </div>

        {/* Card 2: Vehicles In Operation */}
        <div className="rounded-2xl p-6 border border-slate-100 dark:border-slate-800 bg-card shadow-xs transition-colors flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {language === "vi" ? "Đội xe lăn bánh" : "Active Vehicles"}
            </span>
            <p className="text-2xl font-black text-foreground">26 / 30</p>
            <span className="text-xs text-slate-450 dark:text-slate-500 font-bold">
              {language === "vi" ? "4 xe đang bảo trì" : "4 in maintenance"}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 flex items-center justify-center">
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* Card 3: Standby Drivers */}
        <div className="rounded-2xl p-6 border border-slate-100 dark:border-slate-800 bg-card shadow-xs transition-colors flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {language === "vi" ? "Tài xế sẵn sàng" : "Standby Drivers"}
            </span>
            <p className="text-2xl font-black text-foreground">8</p>
            <span className="text-xs text-emerald-500 font-semibold">
              {language === "vi" ? "Đủ đáp ứng ca trực" : "Sufficient for shift"}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center">
            <UserCheck size={22} />
          </div>
        </div>

        {/* Card 4: Unallocated Bookings */}
        <div className="rounded-2xl p-6 border border-slate-100 dark:border-slate-800 bg-card shadow-xs transition-colors flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {language === "vi" ? "Chưa điều tài xế" : "Needs Driver"}
            </span>
            <p className="text-2xl font-black text-foreground">
              {trips.filter((t) => t.driver === "TBD").length}
            </p>
            <span className="text-xs text-rose-500 font-bold flex items-center gap-1">
              <AlertCircle size={12} />
              {language === "vi" ? "Yêu cầu khẩn cấp" : "Immediate dispatch req"}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center">
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* Dispatch Board Queue */}
      <div className="bg-content1 rounded-2xl border border-divider p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-foreground tracking-tight">
              {language === "vi" ? "Bảng điều phối hành trình chuyến" : "Live Trip Dispatching Board"}
            </h3>
            <p className="text-xs text-slate-450 dark:text-slate-500">
              {language === "vi"
                ? "Giám sát thông tin đón tiễn sân bay và gán tài xế trực tiếp."
                : "Monitor airport pick-up/drop-off services and allocate standby drivers."}
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-extrabold text-[10px] uppercase flex items-center gap-1 animate-pulse">
            Live Queue
          </span>
        </div>

        <div className="space-y-3.5 pt-2">
          {trips.map((trip) => {
            const isTBD = trip.driver === "TBD";
            return (
              <div
                key={trip.id}
                className={clsx(
                  "p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all",
                  trip.status === "completed"
                    ? "bg-slate-50/50 dark:bg-black/30 border-slate-100 dark:border-slate-800 opacity-70"
                    : isTBD
                      ? "bg-rose-500/5 border-rose-500/20 ring-1 ring-rose-500/10"
                      : "bg-white dark:bg-black border-divider"
                )}
              >
                {/* Trip Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">{trip.id}</span>
                    <span
                      className={clsx(
                        "text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md",
                        trip.status === "completed"
                          ? "bg-slate-100 text-slate-500"
                          : trip.status === "dispatched"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-450"
                      )}
                    >
                      {trip.status === "completed"
                        ? (language === "vi" ? "Đã hoàn thành" : "Completed")
                        : trip.status === "dispatched"
                          ? (language === "vi" ? "Đã điều xe" : "Dispatched")
                          : (language === "vi" ? "Chờ điều phối" : "Pending Alloc")}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                    <MapPin size={14} className="text-primary flex-shrink-0" />
                    <span>{trip.route}</span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-slate-450 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {trip.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {trip.customerName} • {trip.passengers} pax
                    </span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {trip.carType}
                    </span>
                  </div>
                </div>

                {/* Dispatch Button / Assigned Driver */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block">Tài xế nhận chuyến</span>
                    <span
                      className={clsx(
                        "text-xs font-bold",
                        isTBD ? "text-rose-500 font-black animate-pulse" : "text-foreground"
                      )}
                    >
                      {trip.driver}
                    </span>
                  </div>

                  {isTBD && (
                    <Button
                      size="sm"
                      className="bg-primary text-white font-bold rounded-xl cursor-pointer"
                      onClick={() => assignDriver(trip.id)}
                    >
                      {language === "vi" ? "Điều tài xế" : "Assign Driver"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
