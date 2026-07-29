"use client";

import React from "react";
import {
  Phone,
  CreditCard,
  Car,
  Wallet,
  Handshake,
  Clock,
} from "lucide-react";
import { SectionDto } from "@/lib/api/sections";

const iconMap: Record<string, React.ElementType> = {
  Phone,
  CreditCard,
  Car,
  Wallet,
  Handshake,
};

interface BookingProcessStep {
  step: number;
  icon: string;
  title: { vi: string; en: string };
  description: { vi: string; en: string };
}

interface BookingProcessNote {
  title: { vi: string; en: string };
  items: { vi: string; en: string }[];
  schedules: {
    direction: { vi: string; en: string };
    times: string[];
  }[];
}

interface BookingProcessData {
  steps: BookingProcessStep[];
  notes: BookingProcessNote;
}

interface BookingProcessSectionProps {
  section: SectionDto;
  locale?: string;
}

export function BookingProcessSection({ section, locale = "vi" }: BookingProcessSectionProps) {
  const vi = locale === "vi";

  let data: BookingProcessData;
  try {
    data = JSON.parse(section.contentData || "{}");
  } catch {
    return null;
  }

  if (!data.steps?.length) return null;

  const translation = section.translations?.find((t) => t.locale === locale) || section.translations?.[0];

  return (
    <div className="w-full bg-white dark:bg-[var(--bg-page)] rounded-2xl border border-slate-200/50 dark:border-slate-800 p-5 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          {translation?.title || (vi ? "Quy trình đặt xe" : "Booking Process")}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {translation?.subtitle || (vi ? "Minh Khoa Travel — Đơn giản, nhanh chóng, minh bạch" : "Minh Khoa Travel — Simple, fast, transparent")}
        </p>
      </div>

      <div className="relative">
        {data.steps.map((step, index) => {
          const Icon = iconMap[step.icon] || Phone;
          const isLast = index === data.steps.length - 1;

          return (
            <div key={step.step} className="flex gap-4 sm:gap-5">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-accent/10 text-accent shrink-0">
                  <Icon size={20} />
                </div>
                {!isLast && (
                  <div className="w-px flex-1 bg-slate-200 dark:bg-[var(--bg-card)] my-2" />
                )}
              </div>
              <div className={`flex-1 ${isLast ? "" : "pb-6 sm:pb-8"}`}>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {vi ? step.title.vi : step.title.en}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {vi ? step.description.vi : step.description.en}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {data.notes && (
        <div className="mt-8 sm:mt-10 p-4 sm:p-5 bg-slate-50 dark:bg-[var(--bg-surface)] rounded-xl border border-slate-200/50 dark:border-slate-800">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">
            {vi ? data.notes.title.vi : data.notes.title.en}
          </h4>
          <ul className="space-y-2 mb-4">
            {data.notes.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                <span className="text-accent mt-0.5">•</span>
                {vi ? item.vi : item.en}
              </li>
            ))}
          </ul>

          {data.notes.schedules?.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              {data.notes.schedules.map((schedule, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Clock size={14} className="text-accent shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {vi ? schedule.direction.vi : schedule.direction.en}
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {schedule.times.map((time) => (
                        <span
                          key={time}
                          className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 bg-accent/10 text-accent rounded-full"
                        >
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
