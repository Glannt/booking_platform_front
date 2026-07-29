"use client";
import React, { useState, useEffect } from "react";
import { Dropdown, Label, Button, Avatar, toast } from "@heroui/react";
import { ChevronDown, Globe, LogOut } from "lucide-react";
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
  const router = useRouter();
  const { language, setLanguage, t } = useI18n();
  const pathname = usePathname();
  const { user, isAuthenticated, clearAuth, refreshToken } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
      router.push(`/${language}`);
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

  const isTransparentRoute =
    pathname === `/${language}` ||
    pathname === `/${language}/rent-car` ||
    pathname === `/${language}/self-drive` ||
    pathname === `/${language}/airport-transfer` ||
    pathname === `/${language}/tours` ||
    pathname === "/" ||
    pathname === "/rent-car" ||
    pathname === "/self-drive" ||
    pathname === "/airport-transfer" ||
    pathname === "/tours";
  const showTransparent = isTransparentRoute && !isScrolled;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getLanguageLabel = (lang: Language) => {
    const found = LANGUAGES.find(l => l.code === lang);
    return found ? `${found.flag} ${found.code.toUpperCase()}` : lang.toUpperCase();
  };

  const navItems = [
    { label: t.nav.home, href: prefixUrl("/") },
    {
      label: t.nav.rentCarMenu,
      isDropdown: true,
      items: [
        { label: t.nav.rentCar, href: prefixUrl("/rent-car") },
        { label: t.nav.selfDrive, href: prefixUrl("/self-drive") },
      ],
    },
    { label: t.nav.airportTransfer, href: prefixUrl("/airport-transfer") },
    { label: t.nav.tour, href: prefixUrl("/tours") },
    { label: t.nav.about, href: prefixUrl("/about") },
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
    <nav className={`${isTransparentRoute ? "fixed" : "sticky"
      } top-0 left-0 right-0 z-40 w-full border-b transition-all duration-300 ${showTransparent
        ? "bg-transparent border-transparent text-white"
        : "bg-background/70 backdrop-blur-lg border-separator text-foreground shadow-sm"
      }`}>
      <header className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-6">
        {/* Left branding and Desktop nav */}
        <div className="flex items-center gap-6">
          <NextLink className="flex items-center gap-2" href={prefixUrl("/")}>
            <img
              src="https://minhkhoatravel.vn/wp-content/uploads/2025/05/logo_header_150x150.png"
              alt="Minh Khoa Travel"
              className="w-9 h-9 object-contain rounded-lg"
            />
            <p className={`font-extrabold text-base tracking-tight transition-all duration-300 leading-tight ${showTransparent
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
                        aria-label={item.label}
                        className={`flex items-center gap-1.5 mt-0.5 px-0 py-0 min-h-0 h-auto text-sm font-semibold transition-colors cursor-pointer outline-none bg-transparent border-none ${showTransparent
                          ? "text-white/95 hover:text-white"
                          : "text-foreground-600 hover:text-accent"
                          }`}
                      >
                        {item.label}
                        <ChevronDown size={14} className="opacity-70" />
                      </Dropdown.Trigger>
                      <Dropdown.Popover className="min-w-[200px] backdrop-blur-xl bg-white/80 dark:bg-black/80 border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                        <Dropdown.Menu aria-label="Tour options" onAction={(key) => router.push(key as string)}>
                          {item.items?.map((subItem: any) => (
                            <Dropdown.Item key={subItem.href} id={subItem.href} textValue={subItem.label}>
                              <Label className="font-semibold">{subItem.label}</Label>
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
                    className={`text-sm font-semibold transition-colors no-underline ${showTransparent
                      ? "text-white/95 hover:text-white"
                      : "text-foreground-600 hover:text-accent"
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

        {/* Right side items (Desktop) */}
        <div className="hidden lg:flex items-center gap-3">
          {languageSelector}
          <div className="w-px h-6 bg-divider mx-1" />
          <ThemeSwitch className={showTransparent ? "text-white" : "text-foreground"} />

          {isAuthenticated && user ? (
            <Dropdown>
              <Dropdown.Trigger className="cursor-pointer outline-none">
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full hover:bg-default-100 transition-colors">
                  <Avatar
                    size="sm"
                    className="w-7 h-7 text-xs font-bold bg-primary text-primary-foreground flex items-center justify-center"
                  >
                    {(user.fullname || user.email || "?").charAt(0).toUpperCase()}
                  </Avatar>
                  <span className={`text-xs font-semibold max-w-[100px] truncate ${showTransparent ? "text-white" : "text-foreground"}`}>
                    {user.fullname || user.email}
                  </span>
                  <ChevronDown size={12} className={`opacity-60 ${showTransparent ? "text-white" : "text-foreground"}`} />
                </div>
              </Dropdown.Trigger>
              <Dropdown.Popover className="min-w-[200px]">
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
                  {(user.role === "ADMIN" || user.role === "STAFF") ? (
                    <Dropdown.Item id={user.role === "ADMIN" ? `/${language}/admin/services` : `/${language}/admin/bookings`} key={user.role === "ADMIN" ? `/${language}/admin/services` : `/${language}/admin/bookings`} textValue="Admin Dashboard">
                      <Label>{user.role === "ADMIN" ? "Admin Dashboard" : "Staff Dashboard"}</Label>
                    </Dropdown.Item>
                  ) : (
                    <>
                      <Dropdown.Item id={`/${language}/dashboard/my-bookings`} key={`/${language}/dashboard/my-bookings`} textValue="Booking History">
                        <Label>{t.nav?.bookingHistory || "Booking History"}</Label>
                      </Dropdown.Item>
                    </>
                  )}
                  <Dropdown.Item
                    key="logout"
                    className="text-danger cursor-pointer"
                    textValue="Logout"
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
                className={`text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-default-100 transition-colors no-underline ${showTransparent ? "text-white hover:bg-white/10" : "text-foreground"
                  }`}
              >
                {t.auth.login}
              </NextLink>
              <NextLink
                href={`/${language}/register`}
                className="text-xs font-semibold bg-primary text-primary-foreground px-3.5 py-1.5 rounded-full shadow-sm hover:opacity-95 transition-all no-underline"
              >
                {t.auth.register}
              </NextLink>
            </div>
          )}
        </div>


        {/* Right side items (Mobile) */}
        <div className="flex lg:hidden items-center gap-2">
          {languageSelector}
          <ThemeSwitch className={showTransparent ? "text-white" : "text-foreground"} />
          <button
            aria-expanded={isMenuOpen}
            aria-label="Toggle menu"
            className={`p-2 rounded-xl transition-colors ${showTransparent
              ? "hover:bg-white/10 text-white"
              : "hover:bg-default-100 text-foreground"
              }`}
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
                  <React.Fragment key={item.label}>
                    <li className="font-semibold text-foreground-400 text-xs px-3 pt-3 pb-1 uppercase tracking-wider">
                      {item.label}
                    </li>
                    {item.items?.map((subItem: any) => (
                      <li key={subItem.href} className="pl-6">
                        <NextLink
                          className="block w-full py-2 text-sm text-foreground hover:text-primary no-underline font-medium"
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
                {(user.role === "ADMIN" || user.role === "STAFF") && (
                  <li>
                    <NextLink
                      className="block py-2.5 px-3 rounded-xl text-base text-foreground hover:bg-default-50 no-underline font-semibold"
                      href={user.role === "ADMIN" ? `/${language}/admin/services` : `/${language}/admin/bookings`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {user.role === "ADMIN" ? "Admin Dashboard" : "Staff Dashboard"}
                    </NextLink>
                  </li>
                )}
                {user.role !== "ADMIN" && user.role !== "STAFF" && (
                  <li>
                    <NextLink
                      className="block py-2.5 px-3 rounded-xl text-base text-foreground hover:bg-default-50 no-underline font-semibold"
                      href={`/${language}/dashboard/my-bookings`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t.nav?.bookingHistory || "Booking History"}
                    </NextLink>
                  </li>
                )}
                <li>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full text-left py-2.5 px-3 rounded-xl text-base text-danger hover:bg-danger/10 font-semibold flex items-center gap-2 border-none bg-transparent cursor-pointer"
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
                  className="w-full text-center py-2.5 rounded-xl border border-default-200 text-foreground font-semibold no-underline text-sm hover:bg-default-50 transition-colors"
                >
                  {t.auth.login}
                </NextLink>
                <NextLink
                  href={`/${language}/register`}
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold no-underline text-sm hover:opacity-95 transition-all"
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
