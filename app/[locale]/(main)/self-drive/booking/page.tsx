"use client";

import { useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function LegacySelfDriveBookingRedirectPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = use(params);

  useEffect(() => {
    const categoryId = searchParams.get("categoryId") || searchParams.get("id");
    const vehicleId = searchParams.get("vehicleId");

    if (categoryId || vehicleId) {
      const q = searchParams.toString();
      // If we have categoryId, redirect to that category's confirm or detail page
      if (categoryId) {
        router.replace(`/${locale}/self-drive/${categoryId}/confirm?${q}`);
        return;
      }
    }
    router.replace(`/${locale}/self-drive`);
  }, [locale, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[var(--bg-page)]">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <Loader2 className="animate-spin text-accent" size={20} />
        <span>Đang chuyển hướng...</span>
      </div>
    </div>
  );
}
