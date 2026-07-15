import { useAuthStore } from "../store/authStore";

// Backend URL for client-side (browser) requests
export const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:8080";

// Backend URL for server-side (SSR) requests — can use internal Docker network
const serverBackendUrl = process.env.BACKEND_API || process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:8080";

export interface ApiResponse<T> {
  status?: string;
  message?: string;
  data: T;
}

export interface ApiOptions extends RequestInit {
  skipTranslationFilter?: boolean;
}

// ============================================================
// Token refresh mutex — prevents concurrent refresh attempts
// ============================================================

let refreshPromise: Promise<boolean> | null = null;

function doRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) return false;

      const res = await fetch(`${backendUrl}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        // Refresh token expired or invalid — must clear auth
        useAuthStore.getState().clearAuth();
        return false;
      }

      const result = await res.json();
      const { accessToken, refreshToken: newRefreshToken, user } = result.data;

      useAuthStore.getState().setAuth(user, accessToken, newRefreshToken);
      return true;
    } catch {
      // Network error — don't clear auth, just fail the refresh
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ============================================================
// Kịch bản B: Client Component (Browser) — reads from cookie/URL
// ============================================================

export function getSelectedLanguage(): string {
  if (typeof window !== "undefined") {
    // 1. Check cookie
    const cookieMatch = document.cookie.match(/NEXT_LOCALE=(\w+)/);
    if (cookieMatch && ["vi", "en", "ko", "ru"].includes(cookieMatch[1])) {
      return cookieMatch[1];
    }
    // 2. Check localStorage
    const stored = localStorage.getItem("app_lang");
    if (stored && ["vi", "en", "ko", "ru"].includes(stored)) {
      return stored;
    }
    // 3. Check URL path
    const segments = window.location.pathname.split("/");
    if (segments.length > 1 && ["vi", "en", "ko", "ru"].includes(segments[1])) {
      return segments[1];
    }
  }
  return "vi";
}

export function getAcceptLanguageHeader(lang: string): string {
  switch (lang) {
    case "en":
      return "en-US,en;q=0.9";
    case "ko":
      return "ko-KR,ko;q=0.9";
    case "ru":
      return "ru-RU,ru;q=0.9";
    case "vi":
    default:
      return "vi-VN,vi;q=0.9";
  }
}

function filterTranslations(data: any, targetLocale: string): any {
  if (!data || typeof data !== "object") {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => filterTranslations(item, targetLocale));
  }
  
  const result: any = {};
  for (const key of Object.keys(data)) {
    const value = data[key];
    if (key === "translations" && Array.isArray(value)) {
      result[key] = value.filter((t: any) => t && t.locale === targetLocale);
    } else {
      result[key] = filterTranslations(value, targetLocale);
    }
  }
  return result;
}

/**
 * Client-side API fetch — automatically reads language from cookie/URL
 * Used in "use client" components
 *
 * Refresh flow:
 *   1. 401 on any non-auth request → attempt token refresh
 *   2. Refresh OK → update tokens in store, retry original request
 *   3. Refresh FAIL (401/403) → clearAuth() → auth-guard redirects
 *   4. Refresh FAIL (network) → throw, don't clear auth
 */
export async function apiFetch<T>(path: string, options?: ApiOptions): Promise<T> {
  const url = `${backendUrl}${path}`;
  
  const headers = new Headers(options?.headers);
  if (!headers.has("Content-Type") && !(options?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const currentLang = getSelectedLanguage();
  if (!headers.has("Accept-Language")) {
    headers.set("Accept-Language", getAcceptLanguageHeader(currentLang));
  }

  // Idempotency key for write operations
  const method = (options?.method || "GET").toUpperCase();
  if (["POST", "PUT", "DELETE"].includes(method)) {
    if (!headers.has("X-Idempotency-Key")) {
      headers.set("X-Idempotency-Key", crypto.randomUUID());
    }
  }

  let response = await fetch(url, { ...options, headers });

  // --- Token refresh on 401 ---
  if (response.status === 401 && !path.includes("/auth/login") && !path.includes("/auth/refresh")) {
    const refreshed = await doRefreshToken();

    if (refreshed) {
      // Retry with the new access token
      const newAccessToken = useAuthStore.getState().accessToken;
      headers.set("Authorization", `Bearer ${newAccessToken}`);
      response = await fetch(url, { ...options, headers });
    }
    // If not refreshed → clearAuth already called inside doRefreshToken
    // → auth-guard will redirect to the correct login page
  }

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      // Ignored
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  try {
    let result = await response.json();
    
    let shouldFilter = true;
    if (options?.skipTranslationFilter) {
      shouldFilter = false;
    }
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      if (pathname.includes("/admin") || pathname.includes("/staff")) {
        shouldFilter = false;
      }
    }

    if (shouldFilter) {
      result = filterTranslations(result, currentLang);
    }
    
    return result as T;
  } catch (e) {
    return {} as T;
  }
}

// ============================================================
// Kịch bản A: Server Component (SSR) — locale passed explicitly
// ============================================================

export interface ServerApiOptions extends RequestInit {
  skipTranslationFilter?: boolean;
}

/**
 * Server-side API fetch — locale must be passed explicitly (from route params or cookies)
 * Used in Server Components, route handlers, and generateMetadata
 * 
 * @param path - API path (e.g. "/api/v1/services")
 * @param locale - Language code ("vi", "en", "ko", "ru")
 * @param options - Standard fetch options
 */
export async function serverApiFetch<T>(
  path: string,
  locale: string = "vi",
  options?: ServerApiOptions
): Promise<T> {
  const url = `${serverBackendUrl}${path}`;
  
  const headers = new Headers(options?.headers);
  if (!headers.has("Content-Type") && !(options?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("Accept-Language")) {
    headers.set("Accept-Language", getAcceptLanguageHeader(locale));
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      // Ignored
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  try {
    let result = await response.json();
    
    if (!options?.skipTranslationFilter) {
      result = filterTranslations(result, locale);
    }
    
    return result as T;
  } catch (e) {
    return {} as T;
  }
}
