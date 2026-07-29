"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Language, translations, TranslationDictionary } from "@/config/translations";
import { getContactSettings } from "@/lib/api/setting";

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
  contacts: {
    phone: string;
    zalo: string;
    kakaotalk: string;
    whatsapp: string;
  };
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname() || "";

  const [contacts, setContacts] = useState({
    phone: "0764971971",
    zalo: "https://zalo.me/0764971971",
    kakaotalk: "",
    whatsapp: "",
  });

  useEffect(() => {
    getContactSettings()
      .then((res) => {
        if (res?.data) {
          setContacts({
            phone: res.data.phone || "0764971971",
            zalo: res.data.zalo || "https://zalo.me/0764971971",
            kakaotalk: res.data.kakaotalk || "",
            whatsapp: res.data.whatsapp || "",
          });
        }
      })
      .catch((err) => console.error("Failed to load contact settings:", err));
  }, []);

  const getLangFromPath = (path: string): Language => {
    const segments = path.split("/");
    const firstSegment = segments[1] as Language;
    if (["admin", "staff"].includes(firstSegment)) {
      return "vi";
    }
    if (["vi", "en", "ko", "ru"].includes(firstSegment)) {
      return firstSegment;
    }
    return "vi";
  };

  const initialLang = getLangFromPath(pathname);
  const [language, setLanguageState] = useState<Language>(initialLang);

  // Sync state when URL pathname changes & read preferences on mount
  useEffect(() => {
    const segments = pathname.split("/");
    const firstSegment = segments[1];
    
    if (["admin", "staff"].includes(firstSegment)) {
      setLanguageState("vi");
      return;
    }

    const lang = getLangFromPath(pathname);
    const hasLocalePrefix = ["vi", "en", "ko", "ru"].includes(firstSegment);
    
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
    const search = window.location.search;
    const segments = pathname.split("/");
    let newPath = "";

    if (segments.length > 1 && ["vi", "en", "ko", "ru"].includes(segments[1])) {
      // Replace existing locale prefix
      segments[1] = lang;
      newPath = segments.join("/") + search;
    } else {
      const firstSegment = segments[1];
      if (["admin", "dashboard", "staff"].includes(firstSegment)) {
        // Admin/dashboard paths: just reload (no locale prefix)
        newPath = pathname + search;
      } else {
        newPath = `/${lang}${pathname === "/" ? "" : pathname}` + search;
      }
    }

    if (typeof window !== "undefined") {
      window.location.href = newPath;
    }
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, supportedLanguages: defaultLanguages, contacts }}>
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
