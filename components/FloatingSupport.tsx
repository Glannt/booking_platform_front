"use client";

import { useState, useEffect } from "react";
import { Phone, MessageCircle, ChevronUp, Headset } from "lucide-react";
import { useI18n } from "@/context/LanguageContext";

export function FloatingSupport() {
  const { t, contacts } = useI18n();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showContactMenu, setShowContactMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  if (!contacts) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Contact Menu Popup */}
      {showContactMenu && (
        <div className="bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 w-40 flex flex-col gap-1.5 animate-fade-in-up">
          <a
            href={`tel:${contacts.phone}`}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-accent/10 hover:text-accent transition-colors no-underline"
          >
            <Phone size={14} className="text-accent" />
            <span>{t.common.callNow}</span>
          </a>
          <a
            href={contacts.zalo.startsWith("http") ? contacts.zalo : `https://zalo.me/${contacts.zalo}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-accent/10 hover:text-accent transition-colors no-underline border-t border-slate-100 dark:border-slate-700/50"
          >
            <MessageCircle size={14} className="text-accent" />
            <span>Zalo</span>
          </a>
          {contacts.kakaotalk && (
            <a
              href={contacts.kakaotalk.startsWith("http") ? contacts.kakaotalk : `https://pf.kakao.com/${contacts.kakaotalk}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-accent/10 hover:text-accent transition-colors no-underline border-t border-slate-100 dark:border-slate-700/50"
            >
              <span className="text-accent">💛</span>
              <span>KakaoTalk</span>
            </a>
          )}
          {contacts.whatsapp && (
            <a
              href={contacts.whatsapp.startsWith("http") ? contacts.whatsapp : `https://wa.me/${contacts.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-accent/10 hover:text-accent transition-colors no-underline border-t border-slate-100 dark:border-slate-700/50"
            >
              <span className="text-accent">💚</span>
              <span>WhatsApp</span>
            </a>
          )}
        </div>
      )}

      <button
        onClick={() => setShowContactMenu(!showContactMenu)}
        className={`p-4 rounded-full border shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer flex items-center justify-center ${showContactMenu
          ? "bg-accent border-accent text-white"
          : "bg-white dark:bg-[var(--bg-card)] border-slate-200 dark:border-slate-700 text-accent dark:text-white"
          }`}
        aria-label="Contact Support"
      >
        <Headset size={22} />
      </button>

      {/* Back to Top Button in bottom-right corner below Contact Support */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="p-4 rounded-full bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] text-accent dark:text-white shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer animate-bounce-subtle flex items-center justify-center"
          aria-label="Back to Top"
        >
          <ChevronUp size={22} />
        </button>
      )}
    </div>
  );
}
