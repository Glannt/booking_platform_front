"use client";

import React, { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Home, History, CalendarDays } from "lucide-react";
import { Button } from "@heroui/react";
import { useI18n } from "@/context/LanguageContext";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function TourSuccessPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = use(params);
  const { language } = useI18n();
  const isVi = language === "vi";

  const bookingCode = searchParams.get("bookingCode") || "BK-SUCCESS";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 flex flex-col font-sans justify-center items-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-xl space-y-6 animate-fade-in-up">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={44} className="stroke-[2.5]" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl md:text-2xl font-black text-slate-950 dark:text-white uppercase tracking-tight">
            {isVi ? "Đặt Tour Thành Công!" : "Booking Successful!"}
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 font-semibold leading-relaxed">
            {isVi
              ? "Cảm ơn bạn đã lựa chọn Minh Khoa Travel. Yêu cầu đặt tour của bạn đã được tiếp nhận và xử lý."
              : "Thank you for choosing Minh Khoa Travel. Your sightseeing request has been successfully submitted."}
          </p>
        </div>

        {/* Booking Code Card */}
        <div className="bg-slate-50 dark:bg-black border border-slate-100 dark:border-slate-850 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider block">
            {isVi ? "Mã đơn đặt chỗ" : "Confirmation Code"}
          </span>
          <span className="text-lg font-black text-accent tracking-widest">
            {bookingCode}
          </span>
        </div>

        {/* Secondary Info */}
        <p className="text-[11px] text-slate-400 leading-normal font-medium">
          {isVi
            ? "Chúng tôi đã gửi tin nhắn xác nhận kèm thông tin hành trình đến Zalo của bạn. Vui lòng phản hồi tin nhắn để hoàn tất thủ tục."
            : "A confirmation message with itinerary details has been dispatched to Zalo. Please confirm details to finalize."}
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 pt-2">
          <Button
            onClick={() => router.push(`/${language}/tours`)}
            className="w-full h-11 bg-accent hover:bg-accent-hover text-white font-black text-xs uppercase tracking-wider rounded-2xl border-none cursor-pointer flex items-center justify-center gap-1.5"
          >
            <CalendarDays size={14} />
            {isVi ? "Tiếp Tục Đặt Tour" : "Book Another Tour"}
          </Button>

          <div className="grid grid-cols-2 gap-2.5">
            <Button
              onClick={() => router.push(`/${language}/dashboard/my-bookings`)}
              className="h-10 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-250 font-extrabold text-[11px] uppercase tracking-wider rounded-2xl border-none cursor-pointer flex items-center justify-center gap-1"
            >
              <History size={13} />
              {isVi ? "Lịch sử đặt" : "History"}
            </Button>

            <Button
              onClick={() => router.push(`/${language}`)}
              className="h-10 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-250 font-extrabold text-[11px] uppercase tracking-wider rounded-2xl border-none cursor-pointer flex items-center justify-center gap-1"
            >
              <Home size={13} />
              {isVi ? "Trang chủ" : "Home"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
