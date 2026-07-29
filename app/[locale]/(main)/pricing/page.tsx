"use client";

import { useI18n } from "@/context/LanguageContext";
import { title } from "@/components/primitives";

export default function PricingPage() {
  const { t } = useI18n();

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 text-center">
      <h1 className={title()}>{t.pricing.title}</h1>
      <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
        {t.pricing.subtitle}
      </p>
      <div className="mt-12 p-8 rounded-2xl bg-slate-50 dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800">
        <p className="text-slate-500 dark:text-slate-400">
          {t.pricing.comingSoon}
        </p>
      </div>
    </div>
  );
}
