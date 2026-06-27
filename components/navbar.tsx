"use client";
import React, { useState, useEffect } from "react";
import { Dropdown, Label } from "@heroui/react";
import { ChevronDown, Globe, Car, BookOpen, Info, Home as HomeIcon, Plane } from "lucide-react";
import { usePathname } from "next/navigation";
import NextLink from "next/link";

import { ThemeSwitch } from "@/components/theme-switch";

import { useI18n } from "@/context/LanguageContext";
import { Language } from "@/config/translations";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { language, setLanguage, t } = useI18n();
  const pathname = usePathname();
  const vi = language === "vi";

  const isTransparentRoute =
    pathname === "/" ||
    pathname === "/rent-car" ||
    pathname === "/self-drive" ||
    pathname === "/airport-transfer";
  const showTransparent = isTransparentRoute && !isScrolled;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getLanguageLabel = (lang: Language) => {
    switch (lang) {
      case "vi":
        return "🇻🇳 VI";
      case "en":
        return "🇬🇧 EN";
      case "ko":
        return "🇰🇷 KO";
      case "ru":
        return "🇷🇺 RU";
    }
  };

  const navItems = [
    { label: t.nav.home, href: "/", icon: <HomeIcon size={16} /> },
    {
      label: vi ? "Thuê xe" : "Car Rental",
      isDropdown: true,
      icon: <Car size={16} />,
      items: [
        { label: t.nav.rentCar, href: "/rent-car" },
        { label: t.nav.selfDrive, href: "/self-drive" },
      ],
    },
    { label: t.nav.airportTransfer, href: "/airport-transfer", icon: <Plane size={16} /> },
    {
      label: t.nav.tour,
      isDropdown: true,
      items: [
        { label: t.nav.cityTour, href: "/tours/city" },
        { label: t.nav.provinceTour, href: "/tours/province" },
      ],
    },
    { label: t.nav.docs, href: "/docs", icon: <BookOpen size={16} /> },
    { label: t.nav.about, href: "/about", icon: <Info size={16} /> },
  ];

  const languageSelector = (
    <Dropdown>
      <Dropdown.Trigger className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-separator/85 bg-default-55/10 backdrop-blur-sm text-xs font-semibold cursor-pointer outline-none">
        <Globe size={14} className="opacity-70 flex-shrink-0" />
        <span className="text-xs">{getLanguageLabel(language)}</span>
        <ChevronDown size={12} className="opacity-60 flex-shrink-0" />
      </Dropdown.Trigger>
      <Dropdown.Popover className="min-w-[150px]">
        <Dropdown.Menu
          aria-label="Language options"
          onAction={(key) => setLanguage(key as Language)}
        >
          <Dropdown.Item id="vi" textValue="Tiếng Việt">
            <div className="flex items-center gap-2">
              <span className="text-base">🇻🇳</span>
              <Label className="text-sm">Tiếng Việt</Label>
            </div>
          </Dropdown.Item>
          <Dropdown.Item id="en" textValue="English">
            <div className="flex items-center gap-2">
              <span className="text-base">🇬🇧</span>
              <Label className="text-sm">English</Label>
            </div>
          </Dropdown.Item>
          <Dropdown.Item id="ko" textValue="한국어">
            <div className="flex items-center gap-2">
              <span className="text-base">🇰🇷</span>
              <Label className="text-sm">한국어</Label>
            </div>
          </Dropdown.Item>
          <Dropdown.Item id="ru" textValue="Русский">
            <div className="flex items-center gap-2">
              <span className="text-base">🇷🇺</span>
              <Label className="text-sm">Русский</Label>
            </div>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );

  return (
    <nav className={`${
      isTransparentRoute ? "fixed" : "sticky"
    } top-0 left-0 right-0 z-40 w-full border-b transition-all duration-300 ${
      showTransparent 
        ? "bg-transparent border-transparent text-white" 
        : "bg-background/70 backdrop-blur-lg border-separator text-foreground shadow-sm"
    }`}>
      <header className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-6">
        {/* Left branding and Desktop nav */}
        <div className="flex items-center gap-6">
          <NextLink className="flex items-center gap-2" href="/">
            <img
              src="https://minhkhoatravel.vn/wp-content/uploads/2025/05/logo_header_150x150.png"
              alt="Minh Khoa Travel"
              className="w-9 h-9 object-contain rounded-lg"
            />
            <p className={`font-extrabold text-base tracking-tight transition-all duration-300 leading-tight ${
              showTransparent
                ? "text-white"
                : "text-foreground"
            }`}>
              Minh Khoa Travel
            </p>
          </NextLink>

          {/* Desktop Navigation */}
          <ul className="hidden lg:flex items-center gap-5 ml-4">
            {navItems.map((item) => {
              if (item.isDropdown) {
                return (
                  <li key={item.label}>
                    <Dropdown>
                      <Dropdown.Trigger
                        className={`flex items-center gap-1.5 text-sm font-semibold transition-colors cursor-pointer outline-none ${
                          showTransparent 
                            ? "text-white/95 hover:text-white" 
                            : "text-foreground-600 hover:text-[#0b66e4]"
                        }`}
                      >
                        {item.icon}
                        {item.label}
                        <ChevronDown size={14} className="opacity-70" />
                      </Dropdown.Trigger>
                      <Dropdown.Popover className="min-w-[200px]">
                        <Dropdown.Menu aria-label="Tour options">
                          {item.items?.map((subItem) => (
                            <Dropdown.Item key={subItem.href} id={subItem.href} textValue={subItem.label}>
                              <NextLink
                                className="block w-full text-foreground text-sm no-underline"
                                href={subItem.href}
                              >
                                <Label>{subItem.label}</Label>
                              </NextLink>
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown.Popover>
                    </Dropdown>
                  </li>
                );
              }
              return (
                <li key={item.label}>
                  <NextLink
                    className={`text-sm font-semibold transition-colors no-underline ${
                      showTransparent 
                        ? "text-white/95 hover:text-white" 
                        : "text-foreground-600 hover:text-[#0b66e4]"
                    }`}
                    href={item.href || "#"}
                  >
                    {item.label}
                  </NextLink>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right side items (Desktop: theme, language, etc.) */}
        <div className="hidden sm:flex items-center gap-3">
          {languageSelector}
          <div className="w-px h-6 bg-divider mx-1" />
          <ThemeSwitch className={showTransparent ? "text-white" : "text-foreground"} />
        </div>

        {/* Right side items (Mobile layout: lang, theme, hamburger) */}
        <div className="flex sm:hidden items-center gap-2">
          {/* Render Language selector directly on Mobile header for premium UX visibility */}
          {languageSelector}
          <ThemeSwitch className={showTransparent ? "text-white" : "text-foreground"} />
          <button
            aria-expanded={isMenuOpen}
            aria-label="Toggle menu"
            className={`p-2 rounded-xl transition-colors ${
              showTransparent 
                ? "hover:bg-white/10 text-white" 
                : "hover:bg-default-100 text-foreground"
            }`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              ) : (
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Drawer menu */}
      {isMenuOpen && (
        <div className="border-t border-separator bg-background/95 backdrop-blur-md sm:hidden animate-fade-in">
          <ul className="flex flex-col gap-1 px-4 py-4">
            {navItems.map((item) => {
              if (item.isDropdown) {
                return (
                  <React.Fragment key={item.label}>
                    <li className="font-semibold text-foreground-400 text-xs px-3 pt-3 pb-1 uppercase tracking-wider">
                      {item.label}
                    </li>
                    {item.items?.map((subItem) => (
                      <li key={subItem.href} className="pl-6">
                        <NextLink
                          className="block py-2 text-sm text-foreground hover:text-primary no-underline font-medium"
                          href={subItem.href}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {subItem.label}
                        </NextLink>
                      </li>
                    ))}
                  </React.Fragment>
                );
              }
              return (
                <li key={item.label}>
                  <NextLink
                    className="block py-2.5 px-3 rounded-xl text-base text-foreground-600 hover:text-primary hover:bg-default-50 no-underline font-semibold transition-all"
                    href={item.href || "#"}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </NextLink>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </nav>
  );
};
