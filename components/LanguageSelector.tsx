"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Language } from "@/config/translations";

const LANGUAGES: { code: Language; label: string; flag: string; desc: string }[] = [
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳", desc: "Vietnamese" },
  { code: "en", label: "English", flag: "🇬🇧", desc: "English" },
  { code: "ko", label: "한국어", flag: "🇰🇷", desc: "Korean" },
  { code: "ru", label: "Русский", flag: "🇷🇺", desc: "Russian" },
];

export function LanguageSelector() {
  const [show, setShow] = useState(false);
  const pathname = usePathname() || "";

  useEffect(() => {
    // Only show on public pages, not admin/dashboard/staff
    const firstSegment = pathname.split("/")[1];
    if (["admin", "dashboard", "staff"].includes(firstSegment)) return;

    // Check if app_lang_selected cookie or local storage is set
    const hasSelectedCookie = document.cookie.split(";").some(c => c.trim().startsWith("app_lang_selected="));
    const hasSelectedLocalStorage = typeof window !== "undefined" && localStorage.getItem("app_lang_selected") === "true";

    if (!hasSelectedCookie && !hasSelectedLocalStorage) {
      setShow(true);
    }
  }, [pathname]);

  const selectLanguage = (lang: Language) => {
    // Set cookie + localStorage
    document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000; samesite=lax`;
    document.cookie = `app_lang=${lang}; path=/; max-age=31536000; samesite=lax`;
    document.cookie = `app_lang_selected=true; path=/; max-age=31536000; samesite=lax`;
    localStorage.setItem("app_lang", lang);
    localStorage.setItem("app_lang_selected", "true");
    setShow(false);

    // Navigate to locale-prefixed homepage
    window.location.href = `/${lang}`;
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-black rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-[92%] p-8 space-y-6 animate-scale-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Chọn ngôn ngữ / Select Language
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Vui lòng chọn ngôn ngữ hiển thị / Please select your preferred language
          </p>
        </div>

        {/* Language Options */}
        <div className="grid grid-cols-2 gap-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => selectLanguage(lang.code)}
              className="group flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-200 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
            >
              {/* <span className="text-3xl group-hover:scale-110 transition-transform duration-200">{lang.flag}</span> */}
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">{lang.label}</span>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{lang.desc}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 font-medium">
          Minh Khoa Travel — Nha Trang, Vietnam
        </p>
      </div>
    </div>
  );
}
