"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Language, translations, TranslationDictionary } from "@/config/translations";

export interface LanguageItem {
  code: Language;
  name: string;
  flagIcon: string;
  isDefault: boolean;
}

const defaultLanguages: LanguageItem[] = [
  { code: "vi", name: "Tiếng Việt", flagIcon: "🇻🇳", isDefault: true },
  { code: "en", name: "English", flagIcon: "🇬🇧", isDefault: false },
  { code: "ko", name: "한국어", flagIcon: "🇰🇷", isDefault: false },
  { code: "ru", name: "Русский", flagIcon: "🇷🇺", isDefault: false },
];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationDictionary;
  supportedLanguages: LanguageItem[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname() || "";

  const getLangFromPath = (path: string): Language => {
    const segments = path.split("/");
    const firstSegment = segments[1] as Language;
    if (["vi", "en", "ko", "ru"].includes(firstSegment)) {
      return firstSegment;
    }
    return "vi";
  };

  const initialLang = getLangFromPath(pathname);
  const [language, setLanguageState] = useState<Language>(initialLang);

  // Sync state when URL pathname changes & read preferences on mount
  useEffect(() => {
    const lang = getLangFromPath(pathname);
    
    // Check if the current route has a locale prefix
    const segments = pathname.split("/");
    const hasLocalePrefix = ["vi", "en", "ko", "ru"].includes(segments[1]);
    
    if (hasLocalePrefix) {
      setLanguageState(lang);
    } else {
      // Non-prefixed path, safe to read cookie on client
      const match = document.cookie.match(/NEXT_LOCALE=(\w+)/);
      if (match && ["vi", "en", "ko", "ru"].includes(match[1])) {
        setLanguageState(match[1] as Language);
      } else {
        setLanguageState("vi");
      }
    }
  }, [pathname]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app_lang", lang);
    localStorage.setItem("app_lang_selected", "true");
    document.cookie = `app_lang=${lang}; path=/; max-age=31536000; samesite=lax`;
    document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000; samesite=lax`;
    document.cookie = `app_lang_selected=true; path=/; max-age=31536000; samesite=lax`;

    // Update URL to switch locale
    const segments = pathname.split("/");
    let newPath = "";

    if (segments.length > 1 && ["vi", "en", "ko", "ru"].includes(segments[1])) {
      // Replace existing locale prefix
      segments[1] = lang;
      newPath = segments.join("/");
    } else {
      const firstSegment = segments[1];
      if (["admin", "dashboard", "staff"].includes(firstSegment)) {
        // Admin/dashboard paths: just reload (no locale prefix)
        newPath = pathname;
      } else {
        newPath = `/${lang}${pathname === "/" ? "" : pathname}`;
      }
    }

    if (typeof window !== "undefined") {
      window.location.href = newPath;
    }
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, supportedLanguages: defaultLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useI18n must be used within a LanguageProvider");
  }
  return context;
};
