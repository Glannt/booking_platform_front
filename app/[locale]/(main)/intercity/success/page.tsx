"use client";

import React, { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Home, History, Car } from "lucide-react";
import { Button } from "@heroui/react";
import { useI18n } from "@/context/LanguageContext";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function RentCarSuccessPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = use(params);
  const { language, t } = useI18n();

  const bookingCode = searchParams.get("bookingCode") || "BK-SUCCESS";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[var(--bg-page)] text-foreground flex flex-col font-sans justify-center items-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-xl space-y-6 animate-fade-in-up">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={44} className="stroke-[2.5]" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">
            {t.rentCar.confirmSuccessTitle}
          </h1>
          <p className="text-xs font-semibold leading-relaxed text-muted-foreground">
            {t.rentCar.successMessage}
          </p>
        </div>

        {/* Booking Code Card */}
        <div className="bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider block text-muted-foreground">
            {t.rentCar.successBookingCode}
          </span>
          <span className="text-lg font-black text-accent tracking-widest">
            {bookingCode}
          </span>
        </div>

        {/* Secondary Info */}
        <p className="text-xs leading-normal font-medium text-muted-foreground">
          {t.rentCar.successNote}
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 pt-2 w-full">
          <Button
            onClick={() => router.push(`/${language}/intercity`)}
            className="w-full h-11 bg-accent hover:bg-accent-hover text-accent-foreground font-black text-xs uppercase tracking-wider rounded-2xl border-none cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
          >
            <Car size={14} />
            {t.rentCar.bookAnother}
          </Button>

          <div className="grid grid-cols-2 gap-20 w-full">
            <Button
              onClick={() => router.push(`/${language}/dashboard/my-bookings`)}
              className="h-11 bg-slate-100 dark:bg-[var(--bg-card)] hover:bg-slate-200 dark:hover:bg-[var(--bg-elevated)] text-foreground font-black text-xs uppercase tracking-wider rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
            >
              <History size={13} />
              {t.nav.bookingHistory}
            </Button>

            <Button
              onClick={() => router.push(`/${language}`)}
              className="h-11 bg-slate-100 dark:bg-[var(--bg-card)] hover:bg-slate-200 dark:hover:bg-[var(--bg-elevated)] text-foreground font-black text-xs uppercase tracking-wider rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
            >
              <Home size={13} />
              {t.rentCar.backToHome}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
