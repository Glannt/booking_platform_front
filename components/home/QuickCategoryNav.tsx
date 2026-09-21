"use client";

import React from "react";
import Link from "next/link";
import { useI18n } from "@/context/LanguageContext";
import { Compass, Plane, Bus, CarFront, LayoutGrid } from "lucide-react";

interface QuickCategoryNavProps {
  onOpenAllCategories: () => void;
}

export function QuickCategoryNav({ onOpenAllCategories }: QuickCategoryNavProps) {
  const { language, t } = useI18n();

  const items = [
    {
      id: "tours",
      title: t.homePage.quickNavTour,
      href: `/${language}/tours`,
      icon: Compass,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10 dark:bg-amber-500/15",
    },
    {
      id: "airport",
      title: t.homePage.quickNavAirport,
      href: `/${language}/airport-transfer`,
      icon: Plane,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10 dark:bg-blue-500/15",
    },
    {
      id: "intercity",
      title: t.homePage.quickNavIntercity,
      href: `/${language}/intercity`,
      icon: Bus,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10 dark:bg-purple-500/15",
    },
    {
      id: "self-drive",
      title: t.homePage.quickNavSelfDrive,
      href: `/${language}/self-drive`,
      icon: CarFront,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10 dark:bg-emerald-500/15",
    },
  ];

  return (
    <section aria-label="Quick Categories" className="w-full max-w-5xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className="group flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-accent/40 dark:hover:border-accent/40 transition-all duration-300 hover:-translate-y-0.5 no-underline text-center"
            >
              <div
                className={`w-12 h-12 rounded-xl ${item.bgColor} ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0`}
              >
                <Icon size={24} />
              </div>
              <span className="mt-2.5 text-xs sm:text-sm font-bold text-foreground group-hover:text-accent transition-colors line-clamp-1">
                {item.title}
              </span>
            </Link>
          );
        })}

        {/* All categories button triggering Drawer */}
        <button
          type="button"
          onClick={onOpenAllCategories}
          className="group col-span-2 sm:col-span-1 flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-accent/40 dark:hover:border-accent/40 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer text-center"
        >
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 dark:bg-orange-500/15 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
            <LayoutGrid size={24} />
          </div>
          <span className="mt-2.5 text-xs sm:text-sm font-bold text-foreground group-hover:text-accent transition-colors line-clamp-1">
            {t.homePage.quickNavAll}
          </span>
        </button>
      </div>
    </section>
  );
}
