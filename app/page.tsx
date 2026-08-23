"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/context/LanguageContext";
import { Language } from "@/config/translations";
import { Globe, ArrowRight, Heart, Sparkles, ShieldCheck, Clock, MapPin } from "lucide-react";
import { ThemeSwitch } from "@/components/theme-switch";
import clsx from "clsx";

const LANGUAGES: { code: Language; label: string; flag: string; native: string; desc: string }[] = [
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳", native: "Tiếng Việt", desc: "Trải nghiệm tiếng Việt trọn vẹn" },
  { code: "en", label: "English", flag: "🇬🇧", native: "English", desc: "Full English localized experience" },
  { code: "ko", label: "한국어", flag: "🇰🇷", native: "Korean", desc: "한국어 맞춤형 서비스 제공" },
  { code: "ru", label: "Русский", flag: "🇷🇺", native: "Russian", desc: "Русская локализация и переводы" },
];

export default function RootPage() {
  const { setLanguage } = useI18n();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [hoveredLang, setHoveredLang] = useState<string | null>(null);

  useEffect(() => {
    // Check if language was already selected
    const selected = localStorage.getItem("app_lang_selected") === "true";
    if (selected) {
      const preferred = (localStorage.getItem("app_lang") || "vi") as Language;
      router.replace(`/${preferred}`);
      return;
    }

    // Try auto-detect location via browser geolocation
    if (navigator.geolocation) {
      setIsDetecting(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            if (res.ok) {
              const data = await res.json();
              const countryCode = data.address?.country_code;
              if (countryCode) {
                let detectedLang: Language = "en";
                if (countryCode === "vn") {
                  detectedLang = "vi";
                } else if (countryCode === "kr" || countryCode === "kp") {
                  detectedLang = "ko";
                } else if (countryCode === "ru" || countryCode === "by" || countryCode === "kz") {
                  detectedLang = "ru";
                }
                setLanguage(detectedLang);
                return;
              }
            }
            // Fallback to manual selection if API call fails
            setIsDetecting(false);
            setMounted(true);
          } catch (error) {
            console.error("Error reverse geocoding location:", error);
            setIsDetecting(false);
            setMounted(true);
          }
        },
        (error) => {
          console.warn("Geolocation permission denied or error occurred:", error);
          setIsDetecting(false);
          setMounted(true);
        },
        { timeout: 4000 }
      );
    } else {
      setMounted(true);
    }
  }, [setLanguage, router]);

  if (isDetecting || !mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Globe className="text-accent animate-spin" size={40} />
          <span className="text-slate-500 dark:text-slate-400 text-sm font-bold">
            {isDetecting ? "Detecting your location..." : "Loading travel portal..."}
          </span>
        </div>
      </div>
    );
  }

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden bg-background text-foreground font-sans px-4 select-none transition-colors duration-200">
      {/* Dynamic Theme Gradient Orbs */}
      <div className="pointer-events-none absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-accent/10 dark:bg-accent/15 blur-[130px] animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="pointer-events-none absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-accent/10 dark:bg-accent/15 blur-[130px] animate-pulse" style={{ animationDuration: '10s' }}></div>

      {/* Top Bar with Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeSwitch className="flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 bg-white dark:bg-[var(--bg-surface)] text-slate-700 dark:text-slate-200 shadow-md hover:border-accent/50 transition-all cursor-pointer" />
      </div>

      {/* Main Glassmorphic Card */}
      <div className="relative z-10 w-full max-w-4xl bg-white dark:bg-[var(--bg-surface)] backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 md:p-12 shadow-2xl flex flex-col md:flex-row gap-8 lg:gap-12 items-center">
        
        {/* Left Side: Brand Introduction */}
        <div className="w-full md:w-5/12 text-center md:text-left space-y-6 flex flex-col justify-center">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <img
              src="https://minhkhoatravel.vn/wp-content/uploads/2025/05/logo_header_150x150.png"
              alt="Minh Khoa Travel Logo"
              className="w-12 h-12 rounded-xl object-contain shadow-sm border border-slate-100 dark:border-slate-800"
            />
            <div className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/30 px-3 py-1 rounded-full text-xs font-black text-accent tracking-wide">
              <Sparkles size={13} />
              <span>MINH KHOA TRAVEL</span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none text-slate-900 dark:text-white">
              Nha Trang Travel & Booking
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-sm mx-auto md:mx-0">
              Chào mừng bạn đến với cổng thông tin du lịch và đặt xe Nha Trang. Vui lòng chọn ngôn ngữ để tiếp tục hành trình.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 hidden md:block">
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-500" /> Uy tín 100%</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
              <span className="flex items-center gap-1"><Clock size={14} className="text-amber-500" /> Hỗ trợ 24/7</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
              <span className="flex items-center gap-1"><MapPin size={14} className="text-blue-500" /> Nha Trang</span>
            </div>
          </div>
        </div>

        {/* Vertical Divider for desktop */}
        <div className="hidden md:block w-px h-72 bg-gradient-to-b from-transparent via-slate-200 dark:via-slate-800 to-transparent"></div>

        {/* Right Side: Language Cards Grid */}
        <div className="w-full md:w-7/12 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {LANGUAGES.map((lang) => {
            const isHovered = hoveredLang === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelectLanguage(lang.code)}
                onMouseEnter={() => setHoveredLang(lang.code)}
                onMouseLeave={() => setHoveredLang(null)}
                className={clsx(
                  "group relative flex items-center gap-4 p-5 rounded-2xl text-left border transition-all duration-200 cursor-pointer outline-none",
                  isHovered 
                    ? "border-accent bg-accent/10 dark:bg-accent/15 shadow-md translate-y-[-2px]" 
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[var(--bg-card)] hover:border-accent/60"
                )}
              >
                {/* Flag Icon */}
                <div className="w-12 h-12 bg-white dark:bg-[var(--bg-elevated)] rounded-xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-200 border border-slate-100 dark:border-slate-700 shrink-0">
                  {lang.flag}
                </div>

                {/* Info */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-accent transition-colors duration-200">
                      {lang.label}
                    </span>
                    <ArrowRight 
                      size={14} 
                      className={clsx(
                        "text-accent transition-all duration-200",
                        isHovered ? "opacity-100 translate-x-1" : "opacity-0 translate-x-0"
                      )} 
                    />
                  </div>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    {lang.native}
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-1">
                    {lang.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer copyright */}
      <div className="mt-8 text-center space-y-1 z-10">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
          Minh Khoa Travel Co., Ltd © 2026
        </p>
        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium flex items-center justify-center gap-1">
          Made with <Heart size={10} className="text-rose-500 animate-pulse" /> for travelers worldwide
        </p>
      </div>
    </div>
  );
}
