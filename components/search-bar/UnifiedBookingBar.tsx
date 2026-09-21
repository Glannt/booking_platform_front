"use client";

import React, { useState } from "react";
import { Plane, Car } from "lucide-react";
import { useI18n } from "@/context/LanguageContext";
import { AirportHorizontalSearch } from "./AirportHorizontalSearch";
import { RentalHorizontalSearch } from "./RentalHorizontalSearch";

export type BookingServiceTab = "airport" | "rental";

interface UnifiedBookingBarProps {
  initialTab?: BookingServiceTab;
  className?: string;
  hideTabs?: boolean;
}

export function UnifiedBookingBar({
  initialTab = "airport",
  className = "",
  hideTabs = false,
}: UnifiedBookingBarProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<BookingServiceTab>(initialTab);

  return (
    <div className={`w-full max-w-5xl mx-auto flex flex-col ${className}`}>
      {/* Service Tabs (Image 2 & 3 style) */}
      {!hideTabs && (
        <div className="w-full flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 overflow-x-auto scrollbar-hide z-10 -mb-px">
          <button
            type="button"
            onClick={() => setActiveTab("airport")}
            className={`
              flex items-center gap-2 px-4 sm:px-5 py-3 rounded-t-2xl text-xs sm:text-sm font-black transition-all cursor-pointer border-none shrink-0
              ${
                activeTab === "airport"
                  ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-sm"
                  : "bg-black/45 dark:bg-black/60 hover:bg-black/60 text-white/90 backdrop-blur-md"
              }
            `}
          >
            <Plane size={15} />
            <span>{t.homePage?.airportTransfer || "Đưa đón sân bay"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rental")}
            className={`
              flex items-center gap-2 px-4 sm:px-5 py-3 rounded-t-2xl text-xs sm:text-sm font-black transition-all cursor-pointer border-none shrink-0
              ${
                activeTab === "rental"
                  ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-sm"
                  : "bg-black/45 dark:bg-black/60 hover:bg-black/60 text-white/90 backdrop-blur-md"
              }
            `}
          >
            <Car size={15} />
            <span>{t.homePage?.carRental || "Thuê xe & Liên tỉnh"}</span>
          </button>
        </div>
      )}

      {/* Main Tab Content Card */}
      <div className="w-full bg-white dark:bg-[var(--bg-surface)] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-border">
        {activeTab === "airport" && <AirportHorizontalSearch isCard={false} />}
        {activeTab === "rental" && <RentalHorizontalSearch isCard={false} showModeSwitch={true} />}
      </div>
    </div>
  );
}
