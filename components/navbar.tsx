"use client";
import React, { useState, useEffect, useRef } from "react";
import { Dropdown, Label, Button, Avatar, toast } from "@heroui/react";
import { ChevronDown, ChevronRight, Globe, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import NextLink from "next/link";

import { ThemeSwitch } from "@/components/theme-switch";

import { useI18n } from "@/context/LanguageContext";
import { Language } from "@/config/translations";
import { useAuthStore } from "@/lib/store/authStore";
import { apiFetch } from "@/lib/api/client";

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
];

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isRentCarSubOpen, setIsRentCarSubOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(true);

  const servicesRef = useRef<HTMLLIElement>(null);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rentCarTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleServicesMouseEnter = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    setIsServicesOpen(true);
  };

  const handleServicesMouseLeave = () => {
    leaveTimerRef.current = setTimeout(() => {
      setIsServicesOpen(false);
      setIsRentCarSubOpen(false);
    }, 180);
  };

  const handleRentCarMouseEnter = () => {
    if (rentCarTimerRef.current) clearTimeout(rentCarTimerRef.current);
    setIsRentCarSubOpen(true);
  };

  const handleRentCarMouseLeave = () => {
    rentCarTimerRef.current = setTimeout(() => {
      setIsRentCarSubOpen(false);
    }, 180);
  };

  const router = useRouter();
  const { language, setLanguage, t } = useI18n();
  const pathname = usePathname();
  const { user, isAuthenticated, clearAuth, refreshToken } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (servicesRef.current && !servicesRef.current.contains(event.target as Node)) {
        setIsServicesOpen(false);
        setIsRentCarSubOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
      if (rentCarTimerRef.current) clearTimeout(rentCarTimerRef.current);
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await apiFetch("/api/v1/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      clearAuth();
      toast.success(t.auth.logoutSuccess || "Logged out successfully!");
      
      const isProtectedPage =
        pathname?.startsWith("/portal") ||
        pathname?.startsWith("/admin") ||
        pathname?.startsWith("/staff") ||
        pathname?.includes("/dashboard");

      if (isProtectedPage) {
        if (pathname?.startsWith("/portal") || pathname?.startsWith("/admin")) {
          router.push("/portal/login");
        } else {
          router.push(`/${language}`);
        }
      } else {
        router.refresh();
      }

      setIsMenuOpen(false);
      setIsLoggingOut(false);
    }
  };

  const prefixUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    if (url.startsWith("#")) return url;
    const segments = url.split("/");
    if (segments.length > 1 && ["vi", "en", "ko", "ru"].includes(segments[1])) return url;
    if (segments.length > 1 && ["admin", "dashboard", "staff"].includes(segments[1])) return url;
    return `/${language}${url === "/" ? "" : url}`;
  };

  const getLanguageLabel = (lang: Language) => {
    const found = LANGUAGES.find(l => l.code === lang);
    return found ? `${found.flag} ${found.code.toUpperCase()}` : lang.toUpperCase();
  };

  const navItems = [
    { label: t.nav.home, href: prefixUrl("/") },
    {
      label: t.nav.services,
      isDropdown: true,
      items: [
        { label: t.nav.airportTransfer, href: prefixUrl("/airport-transfer") },
        { label: t.nav.rentCar, href: prefixUrl("/intercity") },
        { label: t.nav.selfDrive, href: prefixUrl("/self-drive") },
        { label: t.nav.tour, href: prefixUrl("/tours") },
      ],
    },
    { label: t.nav.promotions || "Khuyến mãi", href: prefixUrl("/promotions") },
    { label: t.nav.about, href: prefixUrl("/about") },
  ];

  const languageSelector = (
    <Dropdown>
      <Dropdown.Trigger aria-label="Select language" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-separator/85 bg-default-55/10 backdrop-blur-sm text-xs font-semibold cursor-pointer outline-none">
        <Globe size={14} className="opacity-70 flex-shrink-0" />
        <span className="text-xs">{getLanguageLabel(language)}</span>
        <ChevronDown size={12} className="opacity-60 flex-shrink-0" />
      </Dropdown.Trigger>
      <Dropdown.Popover className="min-w-[150px] rounded-md">
        <Dropdown.Menu
          aria-label="Language options"
          onAction={(key) => setLanguage(key as Language)}
        >
          {LANGUAGES.map((lang) => (
            <Dropdown.Item key={lang.code} id={lang.code} textValue={lang.label}>
              <div className="flex items-center gap-2">
                <span className="text-base">{lang.flag}</span>
                <Label className="text-sm">{lang.label}</Label>
              </div>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );

  return (
    <nav className="sticky top-0 left-0 right-0 z-40 w-full border-b transition-all duration-300 bg-white/95 dark:bg-[var(--bg-surface)]/95 backdrop-blur-md border-slate-200/80 dark:border-slate-800 text-foreground shadow-xs">
      <header className="mx-auto flex h-16 max-w-[1536px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Left branding and Desktop nav */}
        <div className="flex items-center gap-6">
          <NextLink className="flex items-center gap-2" href={prefixUrl("/")}>
            <img
              src="https://minhkhoatravel.vn/wp-content/uploads/2025/05/logo_header_150x150.png"
              alt="Minh Khoa Travel"
              className="w-9 h-9 object-contain rounded-md"
            />
            <p className="font-extrabold text-base tracking-tight leading-tight text-foreground">
              Minh Khoa Travel
            </p>
          </NextLink>

          {/* Desktop Navigation */}
          <ul className="hidden lg:flex items-center gap-5 ml-4">
            <li>
              <NextLink
                className="text-sm font-semibold transition-colors no-underline text-foreground-600 hover:text-accent"
                href={prefixUrl("/")}
              >
                {t.nav.home}
              </NextLink>
            </li>

            {/* Services Dropdown with Submenu */}
            <li
              ref={servicesRef}
              className="relative"
              onMouseEnter={handleServicesMouseEnter}
              onMouseLeave={handleServicesMouseLeave}
            >
              <button
                type="button"
                onClick={() => setIsServicesOpen((prev) => !prev)}
                className="flex items-center gap-1.5 text-sm font-semibold transition-colors cursor-pointer outline-none bg-transparent border-none py-2 text-foreground-600 hover:text-accent"
              >
                <span>{t.nav.services}</span>
                <ChevronDown size={14} className={`opacity-70 transition-transform duration-200 ${isServicesOpen ? "rotate-180" : ""}`} />
              </button>

              {isServicesOpen && (
                <div
                  className="absolute top-full left-0 mt-1 min-w-[210px] bg-white dark:bg-[var(--bg-card)] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-zinc-700 shadow-xl rounded-md p-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150 before:absolute before:-top-2 before:left-0 before:right-0 before:h-2 before:bg-transparent"
                  onMouseEnter={handleServicesMouseEnter}
                  onMouseLeave={handleServicesMouseLeave}
                >
                  {/* 1. Đón tiễn sân bay */}
                  <NextLink
                    href={prefixUrl("/airport-transfer")}
                    onClick={() => {
                      setIsServicesOpen(false);
                      setIsRentCarSubOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] hover:text-accent dark:hover:text-accent rounded-md transition-colors no-underline"
                  >
                    <span>{t.nav.airportTransfer}</span>
                  </NextLink>

                  {/* 2. Thuê xe with Flyout Submenu to the right */}
                  <div
                    className="relative"
                    onMouseEnter={handleRentCarMouseEnter}
                    onMouseLeave={handleRentCarMouseLeave}
                  >
                    <div
                      onClick={() => setIsRentCarSubOpen((prev) => !prev)}
                      className="flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] hover:text-accent dark:hover:text-accent rounded-md transition-colors cursor-pointer"
                    >
                      <span>{t.nav.rentCarMenu}</span>
                      <ChevronRight size={14} className="opacity-60" />
                    </div>

                    {isRentCarSubOpen && (
                      <div
                        className="absolute left-full top-0 ml-2.5 min-w-[200px] bg-white dark:bg-[var(--bg-card)] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-zinc-700 shadow-xl rounded-md p-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150 before:absolute before:-left-3.5 before:top-0 before:bottom-0 before:w-3.5 before:bg-transparent"
                        onMouseEnter={handleRentCarMouseEnter}
                        onMouseLeave={handleRentCarMouseLeave}
                      >
                        <NextLink
                          href={prefixUrl("/intercity")}
                          onClick={() => {
                            setIsServicesOpen(false);
                            setIsRentCarSubOpen(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] hover:text-accent dark:hover:text-accent rounded-md transition-colors no-underline"
                        >
                          <span>{t.nav.rentCar}</span>
                        </NextLink>
                        <NextLink
                          href={prefixUrl("/self-drive")}
                          onClick={() => {
                            setIsServicesOpen(false);
                            setIsRentCarSubOpen(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] hover:text-accent dark:hover:text-accent rounded-md transition-colors no-underline"
                        >
                          <span>{t.nav.selfDrive}</span>
                        </NextLink>
                      </div>
                    )}
                  </div>

                  {/* 3. Tour du lịch */}
                  <NextLink
                    href={prefixUrl("/tours")}
                    onClick={() => {
                      setIsServicesOpen(false);
                      setIsRentCarSubOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] hover:text-accent dark:hover:text-accent rounded-md transition-colors no-underline"
                  >
                    <span>{t.nav.tour}</span>
                  </NextLink>
                </div>
              )}
            </li>

            <li>
              <NextLink
                className="text-sm font-semibold transition-colors no-underline text-foreground-600 hover:text-accent"
                href={prefixUrl("/about")}
              >
                {t.nav.about}
              </NextLink>
            </li>
          </ul>
        </div>

        {/* Right side items (Desktop) */}
        <div className="hidden lg:flex items-center gap-3">
          {languageSelector}
          <div className="w-px h-6 bg-divider mx-1" />
          <ThemeSwitch className="text-foreground" />

          {isAuthenticated && user ? (
            <Dropdown>
              <Dropdown.Trigger aria-label="User profile menu" className="cursor-pointer outline-none">
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-default-100 transition-colors">
                  <Avatar
                    size="sm"
                    className="w-7 h-7 text-xs font-bold bg-primary text-primary-foreground flex items-center justify-center rounded-md"
                  >
                    {(user.fullname || user.email || "?").charAt(0).toUpperCase()}
                  </Avatar>
                  <span className="text-xs font-semibold max-w-[100px] truncate text-foreground">
                    {user.fullname || user.email}
                  </span>
                  <ChevronDown size={12} className="opacity-60 text-foreground" />
                </div>
              </Dropdown.Trigger>
              <Dropdown.Popover className="min-w-[200px] rounded-md">
                <Dropdown.Menu aria-label="User actions" onAction={(key) => { if (key === "logout") handleLogout(); else if (key === "profile") router.push(`/${language}/dashboard/profile`); else router.push(key as string); }}>
                  <Dropdown.Item id="profile" key="profile" textValue={user.email}>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground text-sm">{user.fullname}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md w-max mt-1 font-bold">
                        {user.role}
                      </span>
                    </div>
                  </Dropdown.Item>
                  {(user.role === "ADMIN" || user.role === "MODERATOR" || user.role === "STAFF") ? (
                    <Dropdown.Item id="/portal" key="/portal" textValue="Portal">
                      <Label>Minh Khoa Portal</Label>
                    </Dropdown.Item>
                  ) : (
                    <>
                      <Dropdown.Item id={`/${language}/dashboard/my-bookings`} key={`/${language}/dashboard/my-bookings`} textValue="Booking History">
                        <Label>{t.nav?.bookingHistory || "Booking History"}</Label>
                      </Dropdown.Item>
                      <Dropdown.Item id={`/${language}/dashboard/discounts`} key={`/${language}/dashboard/discounts`} textValue="My Vouchers">
                        <Label>{t.nav?.myVouchers || "Mã giảm giá & Voucher"}</Label>
                      </Dropdown.Item>
                    </>
                  )}
                  <Dropdown.Item
                    id="logout"
                    key="logout"
                    className="text-danger cursor-pointer"
                    textValue="Logout"
                    onClick={handleLogout}
                  >
                    <div className="flex items-center gap-2">
                      <LogOut size={14} />
                      <Label className="text-danger">{t.auth.logout}</Label>
                    </div>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          ) : (
            <div className="flex items-center gap-2">
              <NextLink
                href={`/${language}/login`}
                className="text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-default-100 transition-colors no-underline text-foreground"
              >
                {t.auth.login}
              </NextLink>
              <NextLink
                href={`/${language}/register`}
                className="text-xs font-semibold bg-primary text-primary-foreground px-3.5 py-1.5 rounded-md shadow-sm hover:opacity-95 transition-all no-underline"
              >
                {t.auth.register}
              </NextLink>
            </div>
          )}
        </div>

        {/* Right side items (Mobile) */}
        <div className="flex lg:hidden items-center gap-2">
          {languageSelector}
          <ThemeSwitch className="text-foreground" />
          <button
            aria-expanded={isMenuOpen}
            aria-label="Toggle menu"
            className="p-2 rounded-md transition-colors hover:bg-default-100 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Drawer menu */}
      {isMenuOpen && (
        <div className="border-t border-separator bg-background/95 backdrop-blur-md lg:hidden animate-fade-in text-foreground">
          <ul className="flex flex-col gap-1 px-4 py-4">
            {navItems.map((item) => {
              if (item.isDropdown) {
                return (
                  <li key={item.label} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
                      className="w-full flex items-center justify-between py-2.5 px-3 rounded-md text-base text-foreground hover:text-primary hover:bg-default-50 no-underline font-bold transition-all bg-transparent border-none cursor-pointer text-left"
                    >
                      <span>{item.label}</span>
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 opacity-60 ${mobileDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {mobileDropdownOpen && (
                      <ul className="pl-3 space-y-1">
                        {item.items?.map((subItem: any) => (
                          <li key={subItem.href}>
                            <NextLink
                              className="flex items-center gap-2.5 py-2 px-3 rounded-md text-base text-foreground-700 dark:text-foreground-300 hover:text-primary hover:bg-default-50 no-underline font-semibold transition-all"
                              href={subItem.href}
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-primary/70" />
                              <span>{subItem.label}</span>
                            </NextLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              }
              return (
                <li key={item.label}>
                  <NextLink
                    className="block py-2.5 px-3 rounded-md text-base text-foreground hover:text-primary hover:bg-default-50 no-underline font-bold transition-all"
                    href={item.href || "#"}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </NextLink>
                </li>
              );
            })}

            <div className="w-full h-px bg-divider my-2 mx-3" />

            {isAuthenticated && user ? (
              <>
                <li className="px-3 py-2 flex flex-col gap-0.5">
                  <span className="font-bold text-foreground text-sm">{user.fullname}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md w-max mt-1 font-bold">
                    {user.role}
                  </span>
                </li>
                {(user.role === "ADMIN" || user.role === "MODERATOR" || user.role === "STAFF") && (
                  <li>
                    <NextLink
                      className="block py-2.5 px-3 rounded-md text-base text-foreground hover:bg-default-50 no-underline font-semibold"
                      href="/portal"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Minh Khoa Portal
                    </NextLink>
                  </li>
                )}
                {user.role === "CUSTOMER" && (
                  <>
                    <li>
                      <NextLink
                        className="block py-2.5 px-3 rounded-md text-base text-foreground hover:bg-default-50 no-underline font-semibold"
                        href={`/${language}/dashboard/my-bookings`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {t.nav?.bookingHistory || "Booking History"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink
                        className="block py-2.5 px-3 rounded-md text-base text-foreground hover:bg-default-50 no-underline font-semibold"
                        href={`/${language}/dashboard/discounts`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {t.nav?.myVouchers || "Mã giảm giá & Voucher"}
                      </NextLink>
                    </li>
                  </>
                )}
                <li>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full text-left py-2.5 px-3 rounded-md text-base text-danger hover:bg-danger/10 font-semibold flex items-center gap-2 border-none bg-transparent cursor-pointer"
                  >
                    <LogOut size={16} />
                    {t.auth.logout}
                  </button>
                </li>
              </>
            ) : (
              <div className="flex flex-col gap-2 px-3 pt-2">
                <NextLink
                  href={`/${language}/login`}
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-md border border-default-200 text-foreground font-semibold no-underline text-sm hover:bg-default-50 transition-colors"
                >
                  {t.auth.login}
                </NextLink>
                <NextLink
                  href={`/${language}/register`}
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-md bg-primary text-primary-foreground font-semibold no-underline text-sm hover:opacity-95 transition-all"
                >
                  {t.auth.register}
                </NextLink>
              </div>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
};
