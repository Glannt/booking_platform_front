"use client";
import React from "react";
import {
  Calendar,
  Layers,
  MenuSquare,
  TrendingUp,
  DollarSign,
  Activity,
  ArrowUpRight,
  UserCheck,
  Settings,
} from "lucide-react";
import { Button } from "@heroui/react";

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Bookings */}
        <div className="rounded-2xl p-6 border border-slate-100 dark:border-slate-800 bg-card shadow-xs transition-colors flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Tổng đơn đặt
            </span>
            <p className="text-2xl font-black text-foreground">1,248</p>
            <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
              <TrendingUp size={12} />
              +12% tháng này
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-accent flex items-center justify-center">
            <Calendar size={22} />
          </div>
        </div>

        {/* Card 2: Revenue */}
        <div className="rounded-2xl p-6 border border-slate-100 dark:border-slate-800 bg-card shadow-xs transition-colors flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Doanh thu tháng
            </span>
            <p className="text-2xl font-black text-foreground">845M VND</p>
            <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
              <TrendingUp size={12} />
              +8.5% tháng này
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <DollarSign size={22} />
          </div>
        </div>

        {/* Card 3: Managed Pages */}
        <div className="rounded-2xl p-6 border border-slate-100 dark:border-slate-800 bg-card shadow-xs transition-colors flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Trang Landing
            </span>
            <p className="text-2xl font-black text-foreground">6 Trang</p>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Đã xuất bản
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Layers size={22} />
          </div>
        </div>

        {/* Card 4: Active Operators */}
        <div className="rounded-2xl p-6 border border-slate-100 dark:border-slate-800 bg-card shadow-xs transition-colors flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Nhân sự trực
            </span>
            <p className="text-2xl font-black text-foreground">8 Nhân viên</p>
            <span className="text-xs text-blue-500 font-bold">
              4 điều phối viên xe
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <UserCheck size={22} />
          </div>
        </div>
      </div>

      {/* Shortcuts & Logs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Shortcuts */}
        <div className="rounded-2xl p-6 border border-slate-100 dark:border-slate-800 bg-card space-y-4 shadow-xs">
          <h3 className="text-lg font-extrabold text-foreground tracking-tight">
            Lối tắt quản trị
          </h3>
          <div className="flex flex-col gap-2.5">
            <Button
              className="w-full justify-between font-bold text-sm bg-default-100 hover:bg-default-200 text-foreground h-11 px-4 rounded-xl border-none cursor-pointer"
              onClick={() => window.location.href = "/admin/pages"}
            >
              <span className="flex items-center gap-2">
                <Layers size={16} className="text-amber-500" />
                Quản lý Landing Pages
              </span>
              <ArrowUpRight size={16} className="opacity-60" />
            </Button>
            <Button
              className="w-full justify-between font-bold text-sm bg-default-100 hover:bg-default-200 text-foreground h-11 px-4 rounded-xl border-none cursor-pointer"
              onClick={() => window.location.href = "/admin/menus"}
            >
              <span className="flex items-center gap-2">
                <MenuSquare size={16} className="text-indigo-500" />
                Quản lý Menu điều hướng
              </span>
              <ArrowUpRight size={16} className="opacity-60" />
            </Button>
            <Button
              className="w-full justify-between font-bold text-sm bg-default-100 hover:bg-default-200 text-foreground h-11 px-4 rounded-xl border-none cursor-pointer"
              onClick={() => window.location.href = "/admin/settings"}
            >
              <span className="flex items-center gap-2">
                <Settings size={16} className="text-slate-500" />
                Cấu hình tài khoản & Phân quyền
              </span>
              <ArrowUpRight size={16} className="opacity-60" />
            </Button>
          </div>
        </div>

        {/* System Logs */}
        <div className="lg:col-span-2 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 bg-card space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-foreground tracking-tight">
              Hoạt động hệ thống gần đây
            </h3>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>

          <div className="divide-y divide-divider text-sm space-y-3.5">
            <div className="flex items-center justify-between pt-3.5 first:pt-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-accent flex items-center justify-center">
                  <Activity size={14} />
                </div>
                <div>
                  <p className="font-bold text-foreground">Cập nhật Landing Page Home</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Alex Sterling • Sửa HERO Section (tiếng Việt)</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-400">10 mins ago</span>
            </div>

            <div className="flex items-center justify-between pt-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <MenuSquare size={14} />
                </div>
                <div>
                  <p className="font-bold text-foreground">Điều chỉnh cấu trúc MAIN_NAV</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Alex Sterling • Thêm mục "Airport Transfer"</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-400">45 mins ago</span>
            </div>

            <div className="flex items-center justify-between pt-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Calendar size={14} />
                </div>
                <div>
                  <p className="font-bold text-foreground">Đơn đặt CXR ➔ Nha Trang mới</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Hệ thống • Khách hàng Minh Khoa vừa đặt xe</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-400">1 hour ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
