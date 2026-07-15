"use client";

import React, { useEffect, useState } from "react";
import { useI18n } from "@/context/LanguageContext";
import { Language } from "@/config/translations";
import { Globe, ArrowRight, Heart } from "lucide-react";
import clsx from "clsx";

const LANGUAGES: { code: Language; label: string; flag: string; native: string; desc: string }[] = [
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳", native: "Tiếng Việt", desc: "Trải nghiệm tiếng Việt trọn vẹn" },
  { code: "en", label: "English", flag: "🇬🇧", native: "English", desc: "Full English localized experience" },
  { code: "ko", label: "한국어", flag: "🇰🇷", native: "Korean", desc: "한국어 맞춤형 서비스 제공" },
  { code: "ru", label: "Русский", flag: "🇷🇺", native: "Russian", desc: "Русская локализация и переводы" },
];

export default function RootPage() {
  const { setLanguage } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [hoveredLang, setHoveredLang] = useState<string | null>(null);

  useEffect(() => {
    // Check if language was already selected
    const selected = localStorage.getItem("app_lang_selected") === "true";
    if (selected) {
      const preferred = (localStorage.getItem("app_lang") || "vi") as Language;
      window.location.href = `/${preferred}`;
    } else {
      setMounted(true);
    }
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Globe className="text-primary animate-spin" size={40} />
          <span className="text-slate-400 text-sm font-bold">Loading travel portal...</span>
        </div>
      </div>
    );
  }

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden bg-slate-950 text-white font-sans px-4 select-none">
      {/* Dynamic Animated Gradient Background Rings */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse" style={{ animationDuration: '10s' }}></div>

      {/* Main Glassmorphic Container */}
      <div className="relative z-10 w-full max-w-4xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-[32px] p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row gap-8 items-center">
        
        {/* Left Side: Brand Introduction */}
        <div className="w-full md:w-5/12 text-center md:text-left space-y-6 flex flex-col justify-center">
          <div className="inline-flex items-center justify-center md:justify-start gap-2 bg-blue-500/10 border border-blue-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-blue-400 tracking-wide w-fit mx-auto md:mx-0">
            <Globe size={14} className="animate-spin-slow" />
            <span>GLOBAL TRAVEL PORTAL</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Minh Khoa Travel
            </h1>
            <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-sm mx-auto md:mx-0">
              Welcome to Nha Trang's premium transportation & sightseeing planner. Select your language to customize your journey.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800/80 hidden md:block">
            <div className="flex items-center gap-2.5 text-xs text-slate-500">
              <span>Secure Booking</span>
              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
              <span>24/7 Support</span>
              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
              <span>Local Guides</span>
            </div>
          </div>
        </div>

        {/* Vertical Divider for desktop */}
        <div className="hidden md:block w-px h-64 bg-gradient-to-b from-slate-800/20 via-slate-800 to-slate-800/20"></div>

        {/* Right Side: Language Cards Grid */}
        <div className="w-full md:w-7/12 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {LANGUAGES.map((lang) => {
            const isHovered = hoveredLang === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code)}
                onMouseEnter={() => setHoveredLang(lang.code)}
                onMouseLeave={() => setHoveredLang(null)}
                className={clsx(
                  "group relative flex items-center gap-4 p-5 rounded-2xl text-left border bg-slate-900/35 transition-all duration-300 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/50",
                  isHovered 
                    ? "border-blue-500/80 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.15)] translate-y-[-2px]" 
                    : "border-slate-800 hover:border-slate-750"
                )}
              >
                {/* Flag Icon */}
                <div className="w-12 h-12 bg-slate-800 dark:bg-slate-850 rounded-xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                  {lang.flag}
                </div>

                {/* Info */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-white group-hover:text-blue-400 transition-colors duration-300">
                      {lang.label}
                    </span>
                    <ArrowRight 
                      size={12} 
                      className={clsx(
                        "text-blue-400 transition-all duration-300",
                        isHovered ? "opacity-100 translate-x-1" : "opacity-0 translate-x-0"
                      )} 
                    />
                  </div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    {lang.native}
                  </span>
                  <span className="block text-[11px] text-slate-500 font-medium truncate mt-1">
                    {lang.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer copyright */}
      <div className="absolute bottom-6 z-10 text-center space-y-1">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          Minh Khoa Travel Co., Ltd © 2026
        </p>
        <p className="text-[9px] text-slate-650 font-medium flex items-center justify-center gap-1">
          Made with <Heart size={10} className="text-rose-500/70 animate-pulse" /> for travelers worldwide
        </p>
      </div>
    </div>
  );
}
