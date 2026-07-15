import { NextRequest, NextResponse } from "next/server";

const SUPPORTED_LOCALES = ["vi", "en", "ko", "ru"];
const DEFAULT_LOCALE = "vi";
const COOKIE_NAME = "NEXT_LOCALE";

function getLocaleFromAcceptLanguage(header: string | null): string {
  if (!header) return DEFAULT_LOCALE;
  const preferred = header.split(",").map(part => {
    const [lang, q] = part.trim().split(";q=");
    return { lang: lang.trim().split("-")[0].toLowerCase(), q: q ? parseFloat(q) : 1.0 };
  });
  preferred.sort((a, b) => b.q - a.q);
  for (const { lang } of preferred) {
    if (SUPPORTED_LOCALES.includes(lang)) return lang;
  }
  return DEFAULT_LOCALE;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip internal Next.js assets, API routes, and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Skip admin, dashboard, staff paths — they don't use locale prefix
  const firstSegment = pathname.split("/")[1];
  if (["admin", "dashboard", "staff"].includes(firstSegment)) {
    return NextResponse.next();
  }

  // If visiting root and language has not been selected yet, let them see the choice page
  const hasSelectedLang = request.cookies.get("app_lang_selected")?.value === "true";
  if (pathname === "/" && !hasSelectedLang) {
    return NextResponse.next();
  }

  // Check if URL already has a locale prefix
  const hasLocalePrefix = SUPPORTED_LOCALES.includes(firstSegment);

  if (hasLocalePrefix) {
    // URL has locale → set/update cookie and continue
    const response = NextResponse.next();
    response.cookies.set(COOKIE_NAME, firstSegment, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });
    return response;
  }

  // No locale prefix → redirect to locale-prefixed path
  // Priority: cookie > Accept-Language > default
  const cookieLocale = request.cookies.get(COOKIE_NAME)?.value;
  let locale = DEFAULT_LOCALE;

  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
    locale = cookieLocale;
  } else {
    locale = getLocaleFromAcceptLanguage(request.headers.get("accept-language"));
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  const response = NextResponse.redirect(url);
  response.cookies.set(COOKIE_NAME, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and API
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
