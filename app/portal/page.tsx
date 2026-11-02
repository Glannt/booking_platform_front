"use client";
import React, { useState, useEffect } from "react";
import {
  Calendar,
  Layers,
  Compass,
  Car,
  TrendingUp,
  DollarSign,
  Activity,
  ArrowUpRight,
  Users,
  Shield,
  Plane,
  Globe,
  Milestone,
  CalendarDays,
} from "lucide-react";
import { Button, Spinner } from "@heroui/react";
import { getBookings } from "@/lib/api/bookings";
import { getDashboardStats } from "@/lib/api/dashboard";
import { formatPriceSync, formatCompactPrice } from "@/lib/format";
import { useI18n } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/lib/store/authStore";

export default function AdminOverviewPage() {
  const { language } = useI18n();
  const router = useRouter();
  const { user: authUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    bookingsToday: 0,
    bookingsThisWeek: 0,
    bookingsThisMonth: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalVehicleCategories: 0,
    totalVehicles: 0,
    totalUsers: 0,
    totalTours: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const results = await Promise.allSettled([
          getDashboardStats(),
          getBookings(),
        ]);

        if (!active) return;

        if (results[0].status === "fulfilled" && results[0].value?.data) {
          const s = results[0].value.data;
          setStats({
            bookingsToday: s.bookingsToday || 0,
            bookingsThisWeek: s.bookingsThisWeek || 0,
            bookingsThisMonth: s.bookingsThisMonth || 0,
            totalBookings: s.totalBookings || 0,
            totalRevenue: s.totalRevenue || 0,
            totalVehicleCategories: s.totalVehicleCategories || 0,
            totalVehicles: s.totalVehicles || 0,
            totalUsers: s.totalUsers || 0,
            totalTours: s.totalTours || 0,
          });
        }

        if (results[1].status === "fulfilled" && results[1].value?.data) {
          const bookings = results[1].value.data;
          const sortedBookings = [...bookings].sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }).slice(0, 5);
          setRecentBookings(sortedBookings);
        }
      } catch (err) {
        console.error("Error loading admin dashboard stats:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "confirmed":
        return "bg-success/10 text-success border border-success/20";
      case "pending":
        return "bg-warning/10 text-warning border border-warning/20";
      case "cancelled":
        return "bg-danger/10 text-danger border border-danger/20";
      case "cancellation_requested":
        return "bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20";
      default:
        return "bg-default-300/10 text-default-600 dark:text-default-400 border border-default-300/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed": return "Đã hoàn thành";
      case "confirmed": return "Đã xác nhận";
      case "pending": return "Chờ xử lý";
      case "cancelled": return "Đã hủy";
      case "cancellation_requested": return "Chờ hủy";
      default: return status || "Không rõ";
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" color="accent" />
        <p className="text-sm font-semibold text-default-500">Đang tải dữ liệu tổng quan...</p>
      </div>
    );
  }

  const shortcuts = [
    {
      label: "Quản lý Đơn đặt",
      path: "/portal/bookings",
      icon: <Calendar size={16} className="text-primary" />,
    },
    {
      label: "Quản lý Tours",
      path: "/portal/tours",
      icon: <Compass size={16} className="text-success" />,
    },
    {
      label: "Đội xe & Xe tự lái",
      path: "/portal/vehicles",
      icon: <Car size={16} className="text-warning" />,
    },
    {
      label: "Đưa đón Sân bay",
      path: "/portal/airport-transfers",
      icon: <Plane size={16} className="text-secondary" />,
    },
    {
      label: "Đơn thuê xe tự lái",
      path: "/portal/bookings/self-drive",
      icon: <CalendarDays size={16} className="text-primary" />,
    },
    {
      label: "Tuyến xe Liên tỉnh",
      path: "/portal/intercity",
      icon: <Milestone size={16} className="text-success" />,
    },
    {
      label: "Sections & Banners",
      path: "/portal/sections",
      icon: <Layers size={16} className="text-danger" />,
    },
    {
      label: "Quản lý Users",
      path: "/portal/users",
      icon: <Users size={16} className="text-default-600" />,
    },
    ...(authUser?.role === "ADMIN"
      ? [
          {
            label: "Phân quyền hệ thống",
            path: "/portal/users?tab=roles",
            icon: <Shield size={16} className="text-success" />,
          },
        ]
      : []),
    {
      label: "Cấu hình Liên hệ",
      path: "/portal/contacts",
      icon: <Globe size={16} className="text-danger" />,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12 text-foreground">
      
      {/* SECTION 1: Core Metrics */}
      <div className="space-y-4">
        <h2 className="text-lg font-black tracking-tight text-foreground border-l-4 border-primary pl-3">
          Chỉ số tài chính & quy mô
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue Card */}
          <div className="rounded-2xl p-6 border border-divider bg-content1 shadow-xs flex items-center justify-between transition-colors">
            <div className="space-y-1 min-w-0 flex-1 pr-2">
              <span className="text-xs font-bold text-default-500 uppercase tracking-wider block">
                Doanh thu hệ thống
              </span>
              <p
                className="text-2xl font-black text-foreground truncate"
                title={formatPriceSync(stats.totalRevenue, language)}
              >
                {formatCompactPrice(stats.totalRevenue, language)}
              </p>
              <span className="text-xs text-success font-bold flex items-center gap-1">
                <TrendingUp size={12} className="shrink-0" />
                Toàn bộ thời gian
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success-100/30 dark:bg-success-950/20 text-success flex items-center justify-center shrink-0">
              <DollarSign size={22} />
            </div>
          </div>

          {/* Bookings Card */}
          <div className="rounded-2xl p-6 border border-divider bg-content1 shadow-xs flex items-center justify-between transition-colors">
            <div className="space-y-1">
              <span className="text-xs font-bold text-default-500 uppercase tracking-wider">
                Tổng đơn đặt
              </span>
              <p className="text-2xl font-black text-foreground">{stats.totalBookings}</p>
              <span className="text-xs text-primary font-bold">
                Tất cả các dịch vụ
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary-100/30 dark:bg-primary-950/20 text-primary flex items-center justify-center">
              <Calendar size={22} />
            </div>
          </div>

          {/* Users Card */}
          <div className="rounded-2xl p-6 border border-divider bg-content1 shadow-xs flex items-center justify-between transition-colors">
            <div className="space-y-1">
              <span className="text-xs font-bold text-default-500 uppercase tracking-wider">
                Người dùng đã đăng ký
              </span>
              <p className="text-2xl font-black text-foreground">{stats.totalUsers}</p>
              <span className="text-xs text-secondary font-bold">
                Tài khoản khách & quản trị
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-secondary-100/30 dark:bg-secondary-950/20 text-secondary flex items-center justify-center">
              <Users size={22} />
            </div>
          </div>

          {/* Vehicles Card */}
          <div className="rounded-2xl p-6 border border-divider bg-content1 shadow-xs flex items-center justify-between transition-colors">
            <div className="space-y-1">
              <span className="text-xs font-bold text-default-500 uppercase tracking-wider">
                Đội xe hệ thống
              </span>
              <p className="text-2xl font-black text-foreground">{stats.totalVehicles}</p>
              <span className="text-xs text-warning font-bold">
                Số lượng phương tiện
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-warning-100/30 dark:bg-warning-950/20 text-warning flex items-center justify-center">
              <Car size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Detailed Performance & Time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Bookings Today */}
        <div className="rounded-2xl p-5 border border-divider bg-content1 flex items-center gap-4 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-danger-100/30 dark:bg-danger-950/20 text-danger flex items-center justify-center shrink-0">
            <Activity size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-default-500 uppercase tracking-wider block">
              Đặt trong ngày
            </span>
            <p className="text-lg font-black text-foreground mt-0.5">{stats.bookingsToday} đơn</p>
          </div>
        </div>

        {/* Bookings This Week */}
        <div className="rounded-2xl p-5 border border-divider bg-content1 flex items-center gap-4 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-primary-100/30 dark:bg-primary-950/20 text-primary flex items-center justify-center shrink-0">
            <TrendingUp size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-default-500 uppercase tracking-wider block">
              Đặt trong tuần
            </span>
            <p className="text-lg font-black text-foreground mt-0.5">{stats.bookingsThisWeek} đơn</p>
          </div>
        </div>

        {/* Bookings This Month */}
        <div className="rounded-2xl p-5 border border-divider bg-content1 flex items-center gap-4 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-secondary-100/30 dark:bg-secondary-950/20 text-secondary flex items-center justify-center shrink-0">
            <CalendarDays size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-default-500 uppercase tracking-wider block">
              Đặt trong tháng
            </span>
            <p className="text-lg font-black text-foreground mt-0.5">{stats.bookingsThisMonth} đơn</p>
          </div>
        </div>

        {/* Vehicle Categories */}
        <div className="rounded-2xl p-5 border border-divider bg-content1 flex items-center gap-4 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-danger-100/30 dark:bg-danger-950/20 text-danger flex items-center justify-center shrink-0">
            <Layers size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-default-500 uppercase tracking-wider block">
              Tổng loại xe
            </span>
            <p className="text-lg font-black text-foreground mt-0.5">{stats.totalVehicleCategories} loại</p>
          </div>
        </div>

        {/* Active Tours */}
        <div className="rounded-2xl p-5 border border-divider bg-content1 flex items-center gap-4 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-success-100/30 dark:bg-success-950/20 text-success flex items-center justify-center shrink-0">
            <Compass size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-default-500 uppercase tracking-wider block">
              Tours du lịch
            </span>
            <p className="text-lg font-black text-foreground mt-0.5">{stats.totalTours} tuyến</p>
          </div>
        </div>
      </div>

      {/* Shortcuts & Logs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Shortcuts */}
        <div className="rounded-2xl p-6 border border-divider bg-content1 space-y-4 shadow-xs transition-colors">
          <h3 className="text-lg font-extrabold text-foreground tracking-tight">
            Lối tắt quản trị thực tế
          </h3>
          <div className="flex flex-col gap-2.5 max-h-[350px] overflow-y-auto pr-1">
            {shortcuts.map((item, idx) => (
              <Button
                key={idx}
                className="w-full justify-between font-bold text-sm bg-default hover:bg-default-200 dark:bg-default-50 dark:hover:bg-default-100 text-foreground h-11 px-4 rounded-xl border-none cursor-pointer transition-colors text-left font-sans"
                onClick={() => router.push(item.path)}
              >
                <span className="flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </span>
                <ArrowUpRight size={16} className="opacity-60" />
              </Button>
            ))}
          </div>
        </div>

        {/* Recent System Activity / Real Booking Logs */}
        <div className="lg:col-span-2 rounded-2xl p-6 border border-divider bg-content1 space-y-4 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-foreground tracking-tight">
              Đơn hàng gần đây
            </h3>
            <span className="text-xs font-bold text-success bg-success-500/10 px-2.5 py-1 rounded-full flex items-center gap-1 border border-success-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Live
            </span>
          </div>

          <div className="divide-y divide-divider text-sm space-y-3.5">
            {recentBookings.length > 0 ? (
              recentBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between pt-3.5 first:pt-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Activity size={14} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground font-sans">
                        Đơn đặt {b.bookingCode}
                      </p>
                      <p className="text-xs text-default-500 font-sans">
                        Khách hàng: {b.customerName} • {b.customerPhone} • {formatPriceSync(b.totalAmount || 0, language)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(b.bookingStatus)} font-sans`}>
                      {getStatusLabel(b.bookingStatus)}
                    </span>
                    <span className="text-[10px] font-semibold text-default-400 font-sans">
                      {new Date(b.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-default-400 font-semibold font-sans">
                Chưa có đơn hàng nào trong hệ thống.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
