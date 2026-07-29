"use client";

import React, { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Home, Plane } from "lucide-react";
import { Button } from "@heroui/react";
import { useI18n } from "@/context/LanguageContext";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function AirportTransferSuccessPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = use(params);
  const { language, t } = useI18n();

  const bookingCode = searchParams.get("bookingCode") || "BK-SUCCESS";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 flex flex-col font-sans justify-center items-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-xl space-y-6 animate-fade-in-up">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={44} className="stroke-[2.5]" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl md:text-2xl font-black text-slate-950 dark:text-white uppercase tracking-tight">
            {t.airportTransfer.confirmSuccessTitle}
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 font-semibold leading-relaxed">
            {t.airportTransfer.successMessage}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-black border border-slate-100 dark:border-slate-850 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider block">
            {t.airportTransfer.successBookingCode}
          </span>
          <span className="text-lg font-black text-accent tracking-widest">
            {bookingCode}
          </span>
        </div>

        <p className="text-[11px] text-slate-400 leading-normal font-medium">
          {t.airportTransfer.successNote}
        </p>

        <div className="flex flex-col items-center gap-2.5 pt-2">
          <Button
            onClick={() => router.push(`/${language}/airport-transfer`)}
            className="w-full h-11 bg-accent hover:bg-accent-hover text-white font-black text-xs uppercase tracking-wider rounded-2xl border-none cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            <Plane size={13} />
            {t.airportTransfer.bookAnother}
          </Button>

          <Button
            onClick={() => router.push(`/${language}`)}
            className="inline-flex w-auto px-4 h-9 bg-slate-100 dark:bg-[var(--bg-card)] hover:bg-slate-200 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-250 font-extrabold text-[11px] uppercase tracking-wider rounded-2xl border-none cursor-pointer items-center justify-center gap-1.5"
          >
            <Home size={10} />
            {t.airportTransfer.backToHome}
          </Button>
        </div>
      </div>
    </div>
  );
}
