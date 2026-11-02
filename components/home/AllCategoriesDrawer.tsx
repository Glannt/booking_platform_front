"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Drawer, Button } from "@heroui/react";
import type { UseOverlayStateReturn } from "@heroui/react";
import { useI18n } from "@/context/LanguageContext";
import {
  X,
  LayoutGrid,
  List,
  ChevronRight,
  Compass,
  Waves,
  Landmark,
  Sparkles,
  PlaneLanding,
  PlaneTakeoff,
  ArrowLeftRight,
  Mountain,
  MapPin,
  Navigation,
  Sun,
  Car,
  ShieldCheck,
  FileText,
} from "lucide-react";

interface AllCategoriesDrawerProps {
  state: UseOverlayStateReturn;
}

export function AllCategoriesDrawer({ state }: AllCategoriesDrawerProps) {
  const router = useRouter();
  const { language, t } = useI18n();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const groups = [
    {
      id: "tours",
      title: t.homePage.allCategoriesTourGroup,
      mainHref: `/${language}/tours`,
      items: [
        {
          id: "tour-day",
          label: t.homePage.allCategoriesTourDay,
          href: `/${language}/tours`,
          icon: Compass,
          color: "text-amber-500",
          bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
        },
        {
          id: "tour-island",
          label: t.homePage.allCategoriesTourIsland,
          href: `/${language}/tours`,
          icon: Waves,
          color: "text-cyan-500",
          bgColor: "bg-cyan-500/10 dark:bg-cyan-500/20",
        },
        {
          id: "tour-culture",
          label: t.homePage.allCategoriesTourCulture,
          href: `/${language}/tours`,
          icon: Landmark,
          color: "text-orange-500",
          bgColor: "bg-orange-500/10 dark:bg-orange-500/20",
        },
        {
          id: "tour-all",
          label: t.homePage.allCategoriesTourAll,
          href: `/${language}/tours`,
          icon: Sparkles,
          color: "text-amber-600 dark:text-amber-400",
          bgColor: "bg-amber-500/15 dark:bg-amber-500/25",
        },
      ],
    },
    {
      id: "airport",
      title: t.homePage.allCategoriesAirportGroup,
      mainHref: `/${language}/airport-transfer`,
      items: [
        {
          id: "airport-to-nt",
          label: t.homePage.allCategoriesAirportToNhaTrang,
          href: `/${language}/airport-transfer?direction=FROM_AIRPORT`,
          icon: PlaneLanding,
          color: "text-blue-500",
          bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
        },
        {
          id: "airport-to-cr",
          label: t.homePage.allCategoriesAirportToCamRanh,
          href: `/${language}/airport-transfer?direction=TO_AIRPORT`,
          icon: PlaneTakeoff,
          color: "text-sky-500",
          bgColor: "bg-sky-500/10 dark:bg-sky-500/20",
        },
        {
          id: "airport-roundtrip",
          label: t.homePage.allCategoriesAirportRoundTrip,
          href: `/${language}/airport-transfer?tripType=return`,
          icon: ArrowLeftRight,
          color: "text-indigo-500",
          bgColor: "bg-indigo-500/10 dark:bg-indigo-500/20",
        },
      ],
    },
    {
      id: "intercity",
      title: t.homePage.allCategoriesIntercityGroup,
      mainHref: `/${language}/intercity`,
      items: [
        {
          id: "intercity-dalat",
          label: t.homePage.allCategoriesIntercityDaLat,
          href: `/${language}/intercity`,
          icon: Mountain,
          color: "text-purple-500",
          bgColor: "bg-purple-500/10 dark:bg-purple-500/20",
        },
        {
          id: "intercity-camranh",
          label: t.homePage.allCategoriesIntercityCamRanh,
          href: `/${language}/intercity`,
          icon: MapPin,
          color: "text-violet-500",
          bgColor: "bg-violet-500/10 dark:bg-violet-500/20",
        },
        {
          id: "intercity-quynhon",
          label: t.homePage.allCategoriesIntercityQuyNhon,
          href: `/${language}/intercity`,
          icon: Navigation,
          color: "text-fuchsia-500",
          bgColor: "bg-fuchsia-500/10 dark:bg-fuchsia-500/20",
        },
        {
          id: "intercity-phanthiet",
          label: t.homePage.allCategoriesIntercityPhanThiet,
          href: `/${language}/intercity`,
          icon: Sun,
          color: "text-pink-500",
          bgColor: "bg-pink-500/10 dark:bg-pink-500/20",
        },
      ],
    },
    {
      id: "self-drive",
      title: t.homePage.allCategoriesSelfDriveGroup,
      mainHref: `/${language}/self-drive`,
      items: [
        {
          id: "self-drive-4",
          label: t.homePage.allCategoriesSelfDrive4Seats,
          href: `/${language}/self-drive?seats=4-seater`,
          icon: Car,
          color: "text-emerald-500",
          bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
        },
        {
          id: "self-drive-7",
          label: t.homePage.allCategoriesSelfDrive7Seats,
          href: `/${language}/self-drive?seats=7-seater`,
          icon: ShieldCheck,
          color: "text-teal-500",
          bgColor: "bg-teal-500/10 dark:bg-teal-500/20",
        },
        {
          id: "self-drive-procedure",
          label: t.homePage.allCategoriesSelfDriveProcedure,
          href: `/${language}/self-drive`,
          icon: FileText,
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-500/10 dark:bg-green-500/20",
        },
      ],
    },
  ];

  const handleNavigate = (url: string) => {
    state.close();
    router.push(url);
  };

  return (
    <Drawer state={state}>
      <Drawer.Backdrop variant="blur" className="bg-black/60 backdrop-blur-sm z-50">
        <Drawer.Content
          placement="bottom"
          className="w-full max-w-4xl mx-auto rounded-t-3xl sm:rounded-t-[32px] bg-white dark:bg-[var(--bg-surface)] border-t border-slate-200/80 dark:border-slate-800 shadow-2xl p-0 overflow-hidden"
        >
          <Drawer.Dialog className="outline-none max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="px-5 sm:px-7 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
              <Button
                isIconOnly
                size="sm"
                variant="tertiary"
                aria-label="Close"
                onPress={() => state.close()}
                className="rounded-full cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] text-foreground/80"
              >
                <X size={20} />
              </Button>

              <h2 className="text-base sm:text-lg font-black text-foreground">
                {t.homePage.allCategoriesTitle}
              </h2>

              {/* Grid / List View switch */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-[var(--bg-card)] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer border-none ${
                    viewMode === "grid"
                      ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                      : "text-foreground/50 hover:text-foreground"
                  }`}
                  aria-label="Grid view"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer border-none ${
                    viewMode === "list"
                      ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                      : "text-foreground/50 hover:text-foreground"
                  }`}
                  aria-label="List view"
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <Drawer.Body className="p-4 sm:p-6 overflow-y-auto space-y-6">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="bg-slate-50/70 dark:bg-[var(--bg-card)] border border-slate-100 dark:border-slate-800/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5"
                >
                  {/* Group Header */}
                  <button
                    type="button"
                    onClick={() => handleNavigate(group.mainHref)}
                    className="flex items-center gap-1.5 text-sm sm:text-base font-extrabold text-foreground hover:text-accent transition-colors mb-3.5 cursor-pointer border-none bg-transparent p-0"
                  >
                    <span>{group.title}</span>
                    <ChevronRight size={18} className="text-foreground/50" />
                  </button>

                  {/* Group Content: Grid or List */}
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleNavigate(item.href)}
                            className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-[var(--bg-surface)] border border-slate-200/60 dark:border-slate-800/60 hover:border-accent/40 dark:hover:border-accent/40 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer text-center"
                          >
                            <div
                              className={`w-11 h-11 rounded-xl ${item.bgColor} ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shrink-0`}
                            >
                              <Icon size={22} />
                            </div>
                            <span className="mt-2 text-xs font-semibold text-foreground/90 group-hover:text-accent transition-colors line-clamp-2">
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-xl bg-white dark:bg-[var(--bg-surface)] border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleNavigate(item.href)}
                            className="w-full flex items-center justify-between p-3 sm:px-4 hover:bg-slate-50/80 dark:hover:bg-[var(--bg-card)] transition-colors cursor-pointer border-none bg-transparent text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-lg ${item.bgColor} ${item.color} flex items-center justify-center shrink-0`}
                              >
                                <Icon size={18} />
                              </div>
                              <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                                {item.label}
                              </span>
                            </div>
                            <ChevronRight size={16} className="text-foreground/40 shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
