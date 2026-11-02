"use client";

import React, { useMemo, useState } from "react";
import { Label, Button, toast } from "@heroui/react";
import { Star, Image, Tag, MessageSquare, Sparkles, ZoomIn, X, ExternalLink, Copy, Languages } from "lucide-react";
import { SvgIconRenderer } from "@/components/common/SvgIconRenderer";

interface ContentDataViewerProps {
  contentData: string;
  sectionType: string;
}

const VIEWER_LOCALES = [
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳 VI" },
  { code: "en", label: "English", flag: "🇬🇧 EN" },
  { code: "ko", label: "한국어", flag: "🇰🇷 KO" },
  { code: "ru", label: "Русский", flag: "🇷🇺 RU" },
] as const;

type ViewerLocale = (typeof VIEWER_LOCALES)[number]["code"];

function getLocalized(val: unknown, locale: string = "vi"): string {
  if (typeof val === "string") return val;
  if (typeof val === "object" && val !== null && !Array.isArray(val)) {
    const obj = val as Record<string, string>;
    return (
      obj[locale] ||
      obj["vi"] ||
      obj["en"] ||
      obj["ko"] ||
      obj["ru"] ||
      Object.values(obj)[0] ||
      ""
    );
  }
  return String(val || "");
}

function KeyValuePairView({ k, v, locale }: { k: string; v: unknown; locale: string }) {
  if (typeof v === "string") {
    const trimmed = v.trim();

    // ponytail: inline SVG values (e.g. badge.icon / feature icons) render as
    // real icons; plain color strings get a swatch chip beside the value.
    if (trimmed.toLowerCase().includes("<svg")) {
      return (
        <div className="flex items-start gap-2 py-1.5">
          <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider min-w-[85px] shrink-0 pt-0.5">{k}</span>
          <div className="flex items-center gap-2">
            <SvgIconRenderer svgString={trimmed} className="w-9 h-9" />
            <span className="text-sm text-foreground/80 font-medium break-words">{trimmed.length > 80 ? trimmed.slice(0, 80) + "…" : trimmed}</span>
          </div>
        </div>
      );
    }

    const isColor = /^(#([0-9a-fA-F]{3,8})|rgba?\([\d\s,./%]+\)|hsla?\([\d\s,./%]+\))$/.test(trimmed);
    if (isColor) {
      return (
        <div className="flex items-center gap-2 py-1.5">
          <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider min-w-[85px] shrink-0 pt-0.5">{k}</span>
          <span className="w-5 h-5 rounded-full border border-divider shrink-0" style={{ backgroundColor: trimmed }} />
          <span className="text-sm text-foreground/80 font-medium break-words">{trimmed}</span>
        </div>
      );
    }

    return (
      <div className="flex items-start gap-2 py-1.5">
        <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider min-w-[85px] shrink-0 pt-0.5">{k}</span>
        <span className="text-sm text-foreground/80 font-medium break-words">{v}</span>
      </div>
    );
  }
  if (typeof v === "boolean") {
    return (
      <div className="flex items-start gap-2 py-1.5">
        <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider min-w-[85px] shrink-0 pt-0.5">{k}</span>
        <span className={`text-sm font-bold ${v ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>{v ? "Có" : "Không"}</span>
      </div>
    );
  }
  if (Array.isArray(v)) {
    return (
      <div className="py-1.5">
        <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider block mb-1">
          {k} ({v.length})
        </span>
        <div className="pl-3 border-l-2 border-divider space-y-1.5">
          {v.map((item, idx) => (
            <div key={idx} className="p-2 rounded-lg bg-default-50 dark:bg-[var(--bg-muted)] border border-divider">
              {typeof item === "object" && item !== null && !Array.isArray(item) ? (
                Object.entries(item).map(([sk, sv]) => (
                  <KeyValuePairView key={sk} k={sk} v={sv} locale={locale} />
                ))
              ) : (
                <KeyValuePairView k={`#${idx + 1}`} v={item} locale={locale} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (typeof v === "object" && v !== null) {
    const obj = v as Record<string, unknown>;
    const keys = Object.keys(obj);
    const isMultilingual = keys.some((subK) => ["vi", "en", "ko", "ru"].includes(subK));

    if (isMultilingual) {
      const locText = getLocalized(v, locale);
      return (
        <div className="flex items-start gap-2 py-1.5">
          <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider min-w-[85px] shrink-0 pt-0.5">{k}</span>
          <div className="flex-1 flex items-center gap-2">
            <span className="text-sm text-foreground/90 font-medium break-words">
              {locText || <span className="text-foreground/40 italic">Chưa có bản dịch ({locale.toUpperCase()})</span>}
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-default-100 dark:bg-[var(--bg-elevated)] text-foreground/60 uppercase">
              {locale}
            </span>
          </div>
        </div>
      );
    }

    const entries = Object.entries(obj);
    return (
      <div className="py-1.5">
        <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider block mb-1">{k}</span>
        <div className="pl-3 border-l-2 border-divider space-y-0.5">
          {entries.map(([subKey, subVal]) => (
            <KeyValuePairView key={subKey} k={subKey} v={subVal} locale={locale} />
          ))}
        </div>
      </div>
    );
  }
  return null;
}

function SlideCardViewer({ data, locale }: { data: Record<string, unknown>; locale: string }) {
  const cards = Array.isArray(data.cards) ? (data.cards as Array<Record<string, unknown>>) : [];
  const badgeTitle = data.badgeTitle;

  return (
    <div className="space-y-3">
      {badgeTitle != null && (
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-accent" />
          <span className="text-sm font-bold text-accent">{getLocalized(badgeTitle, locale)}</span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-2">
        {cards.map((card, idx) => (
          <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg bg-default-50 dark:bg-[var(--bg-muted)] border border-divider">
            {typeof card.imageUrl === "string" && card.imageUrl && (
              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-divider">
                <img src={card.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-sm font-bold text-foreground truncate">{getLocalized(card.title, locale)}</p>
              <p className="text-xs text-foreground/60 line-clamp-1">{getLocalized(card.description, locale)}</p>
              <div className="flex items-center gap-2">
                {card.badge != null && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">
                    <Tag size={9} />
                    {getLocalized(card.badge, locale)}
                  </span>
                )}
                {card.price != null && (
                  <span className="text-xs font-black text-foreground/80">{getLocalized(card.price, locale)}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideReviewViewer({ data, locale }: { data: Record<string, unknown>; locale: string }) {
  const reviews = Array.isArray(data.reviews) ? (data.reviews as Array<Record<string, unknown>>) : [];
  const summary = data.ratingSummary;

  return (
    <div className="space-y-3">
      {summary != null && (
        <div className="flex items-center gap-1.5">
          <div className="flex text-amber-500 gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={10} fill="currentColor" />
            ))}
          </div>
          <span className="text-xs font-bold text-foreground/60">{String(summary)}</span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-2">
        {reviews.map((review, idx) => (
          <div key={idx} className="p-2.5 rounded-lg bg-default-50 dark:bg-[var(--bg-muted)] border border-divider">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex text-amber-500 gap-0.5">
                {Array.from({ length: typeof review.rating === "number" ? review.rating : 5 }).map((_, i) => (
                  <Star key={i} size={10} fill="currentColor" />
                ))}
              </div>
              <span className="text-xs font-bold text-foreground/80">{String(review.author || "")}</span>
              {typeof review.route === "string" && review.route && (
                <span className="text-[10px] text-foreground/50">{review.route}</span>
              )}
            </div>
            <p className="text-xs font-bold text-foreground">{getLocalized(review.title, locale)}</p>
            <p className="text-xs text-foreground/60 line-clamp-2">&ldquo;{getLocalized(review.description, locale)}&rdquo;</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InspirationViewer({ data, locale }: { data: Record<string, unknown>; locale: string }) {
  const items = Array.isArray(data.items) ? (data.items as Array<Record<string, unknown>>) : [];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-default-50 dark:bg-[var(--bg-muted)] border border-divider">
            {typeof item.imageUrl === "string" && item.imageUrl && (
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-divider">
                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{getLocalized(item.label || item.title, locale)}</p>
              {typeof item.linkUrl === "string" && item.linkUrl && (
                <p className="text-[10px] text-primary font-mono truncate">{item.linkUrl}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {data.showInstagram === true && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/10 border border-accent/20">
          <span className="text-xs font-bold text-accent">Instagram: {String(data.instagramHandle || "@minhkhoatravel_vn")}</span>
        </div>
      )}
    </div>
  );
}

function HeroBannerViewer({ data, locale }: { data: Record<string, unknown>; locale: string }) {
  const badges = Array.isArray(data.badges) ? (data.badges as Array<Record<string, unknown>>) : [];
  if (badges.length === 0) return <GenericViewer data={data} locale={locale} />;

  // ponytail: badge icons are raw SVG (`icon`) or image URL (`iconUrl`). Legacy
  // DB values like "Car"/"CheckCircle" are icon names we cannot resolve — show
  // no icon in that case instead of a fake lucide star.
  const renderBadgeIcon = (badge: Record<string, unknown>) => {
    if (typeof badge.icon === "string" && badge.icon.trim().toLowerCase().includes("<svg")) {
      return (
        <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-divider bg-white dark:bg-[var(--bg-surface)] flex items-center justify-center [&>svg]:w-6 [&>svg]:h-6 [&>svg]:text-current">
          <SvgIconRenderer svgString={badge.icon} />
        </div>
      );
    }
    if (typeof badge.iconUrl === "string" && badge.iconUrl) {
      return (
        <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-divider bg-white dark:bg-[var(--bg-surface)]">
          <img src={badge.iconUrl} alt="" className="w-full h-full object-cover" />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {badges.map((badge, idx) => (
        <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-default-50 dark:bg-[var(--bg-muted)] border border-divider">
          {renderBadgeIcon(badge)}
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-sm font-bold text-foreground leading-snug">
              {getLocalized(badge.text, locale)}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {typeof badge.textColor === "string" && badge.textColor && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-foreground/60">
                  <span className="w-5 h-5 rounded-full border border-divider" style={{ backgroundColor: badge.textColor }} />
                  {badge.textColor}
                </span>
              )}
              {typeof badge.bgColor === "string" && badge.bgColor && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-foreground/60">
                  <span className="w-5 h-5 rounded-full border border-divider" style={{ backgroundColor: badge.bgColor }} />
                  {badge.bgColor}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function GenericViewer({ data, locale }: { data: Record<string, unknown>; locale: string }) {
  const entries = Object.entries(data);
  return (
    <div className="space-y-0.5">
      {entries.map(([key, val]) => (
        <KeyValuePairView key={key} k={key} v={val} locale={locale} />
      ))}
    </div>
  );
}

function DestinationsViewer({ data }: { data: Record<string, unknown> }) {
  const [zoomedImg, setZoomedImg] = useState<{ url: string; title?: string } | null>(null);
  const destinations = Array.isArray(data.destinations) ? (data.destinations as Array<Record<string, any>>) : [];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1 border-b border-divider">
        <span className="text-sm font-bold text-foreground">Danh sách điểm đến ({destinations.length})</span>
        <span className="text-[11px] font-mono text-foreground/60 px-2 py-0.5 rounded-full bg-default-100">systemSource: destinations</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {destinations.map((dest, idx) => (
          <div key={idx} className="flex items-center gap-2.5 p-2 rounded-xl bg-default-50 dark:bg-[var(--bg-muted)] border border-divider">
            {typeof dest.imageUrl === "string" && dest.imageUrl && (
              <div className="relative group w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-divider bg-default-100">
                <img src={dest.imageUrl} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                <button
                  type="button"
                  onClick={() => setZoomedImg({ url: dest.imageUrl, title: dest.name || `Điểm đến #${idx + 1}` })}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer border-none"
                  title="Phóng to ảnh"
                >
                  <ZoomIn size={16} />
                </button>
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center justify-between gap-1">
                <p className="text-sm font-bold text-foreground truncate">{String(dest.name || "")}</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${dest.active !== false ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-default-200 text-foreground/50"}`}>
                  {dest.active !== false ? "Bật" : "Tắt"}
                </span>
              </div>
              {Boolean(dest.activityCountText) && (
                <p className="text-xs text-foreground/60 truncate">{String(dest.activityCountText)}</p>
              )}
              <p className="text-xs font-mono text-primary truncate">{String(dest.href || "")}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Zoom Lightbox z-[99999] */}
      {zoomedImg && (
        <div
          className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setZoomedImg(null)}
        >
          <div
            className="relative max-w-4xl max-h-[92vh] bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800 bg-neutral-950/80 text-white shrink-0">
              <div className="flex items-center gap-2 truncate max-w-md">
                <ZoomIn size={16} className="text-accent shrink-0" />
                <span id="viewer-zoomed-title" className="text-sm font-bold text-white truncate">
                  {zoomedImg?.title || "Xem ảnh phóng to"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {zoomedImg?.url && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(zoomedImg.url);
                      toast.success("Đã sao chép URL ảnh!");
                    }}
                    className="h-8 w-8 text-neutral-300 hover:text-white hover:bg-white/10 rounded-full"
                    aria-label="Sao chép URL"
                  >
                    <Copy size={14} />
                  </Button>
                )}
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  onClick={() => setZoomedImg(null)}
                  className="h-8 w-8 text-neutral-300 hover:text-white hover:bg-white/10 rounded-full cursor-pointer"
                  aria-label="Đóng"
                >
                  <X size={18} />
                </Button>
              </div>
            </div>
            <div className="flex-1 min-h-0 flex items-center justify-center p-4 bg-black/90 overflow-hidden">
              {zoomedImg?.url && (
                <img
                  src={zoomedImg.url}
                  alt={zoomedImg.title || "Zoomed"}
                  className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-2xl select-none"
                />
              )}
            </div>
            {zoomedImg?.url && (
              <div className="px-5 py-2.5 bg-neutral-950/90 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 shrink-0">
                <span className="truncate max-w-xl font-mono text-[11px] select-all">
                  {zoomedImg.url}
                </span>
                <a
                  href={zoomedImg.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline flex items-center gap-1 font-semibold text-[11px] shrink-0 ml-2"
                >
                  Mở tab mới
                  <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AirportPackagesViewer({ data }: { data: Record<string, unknown> }) {
  const packages = Array.isArray(data.packages)
    ? (data.packages as Array<Record<string, any>>)
    : [];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between pb-1 border-b border-divider">
        <span className="text-sm font-bold text-foreground">
          Gói xe đưa đón ({packages.length})
        </span>
        <span className="text-[11px] font-mono text-foreground/60 px-2 py-0.5 rounded-full bg-default-100">
          systemSource: airport-transfer
        </span>
      </div>
      <p className="text-xs text-foreground/60">
        Giá trên Trang chủ lấy tự động = giá thấp nhất 1 chiều từ bảng giá sân bay mặc định theo loại xe liên kết.
      </p>
      {packages.length === 0 ? (
        <p className="text-sm text-foreground/50 italic">
          Chưa cấu hình gói nào → Trang chủ tự sinh card từ các dòng xe có bảng giá.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {packages.map((pkg, idx) => {
            const name = getLocalized(pkg.name, "vi") || `Gói xe #${idx + 1}`;
            return (
              <div
                key={pkg.id || idx}
                className="flex items-center gap-2.5 p-2 rounded-xl bg-default-50 dark:bg-[var(--bg-muted)] border border-divider"
              >
                {typeof pkg.imageUrl === "string" && pkg.imageUrl && (
                  <img
                    src={pkg.imageUrl}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover shrink-0 border border-divider bg-default-100"
                  />
                )}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-sm font-bold text-foreground truncate">{name}</p>
                    <span
                      className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                        pkg.active !== false
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-default-200 text-foreground/50"
                      }`}
                    >
                      {pkg.active !== false ? "Bật" : "Tắt"}
                    </span>
                  </div>
                  {pkg.tag && typeof pkg.tag === "object" && (
                    <p className="text-xs text-accent truncate">
                      {getLocalized(pkg.tag, "vi")}
                    </p>
                  )}
                  <p className="text-xs font-mono text-foreground/60 truncate">
                    {pkg.vehicleCategoryId != null
                      ? `categoryId: ${pkg.vehicleCategoryId}`
                      : "Chưa liên kết loại xe"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ContentDataViewer({ contentData, sectionType }: ContentDataViewerProps) {
  const [activeLocale, setActiveLocale] = useState<ViewerLocale>("vi");

  const data = useMemo(() => {
    if (!contentData) return null;
    try {
      const parsed = JSON.parse(contentData);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch { }
    return null;
  }, [contentData]);

  if (!data) {
    return (
      <pre className="p-3 bg-default-50 dark:bg-[var(--bg-muted)] rounded-lg text-sm font-mono overflow-x-auto max-h-40 text-foreground/60">
        {contentData || "—"}
      </pre>
    );
  }

  const renderContent = () => {
    switch (sectionType) {
      case "HERO_BANNER":
        return <HeroBannerViewer data={data} locale={activeLocale} />;
      case "SLIDE_CARD":
        return <SlideCardViewer data={data} locale={activeLocale} />;
      case "SLIDE_REVIEW":
        return <SlideReviewViewer data={data} locale={activeLocale} />;
      case "INSPIRATION":
        return <InspirationViewer data={data} locale={activeLocale} />;
      case "SYSTEM_CATALOG":
        if (Array.isArray(data.destinations)) {
          return <DestinationsViewer data={data} />;
        }
        if (Array.isArray(data.packages)) {
          return <AirportPackagesViewer data={data} />;
        }
        return <GenericViewer data={data} locale={activeLocale} />;
      default:
        return <GenericViewer data={data} locale={activeLocale} />;
    }
  };

  return (
    <div className="space-y-3">
      {/* 4-Language Tab Switcher */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-divider">
        <div className="flex items-center gap-1.5 text-foreground/70">
          <Languages size={16} className="text-accent" />
          <span className="text-sm font-bold uppercase tracking-wider">
            Xem thử theo ngôn ngữ:
          </span>
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-default-100 dark:bg-[var(--bg-card)] border border-divider">
          {VIEWER_LOCALES.map(({ code, flag }) => (
            <button
              key={code}
              type="button"
              onClick={() => setActiveLocale(code)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeLocale === code
                  ? "bg-accent text-accent-foreground shadow-xs"
                  : "text-foreground/70 hover:text-foreground hover:bg-default-200/50"
              }`}
            >
              <span>{flag}</span>
            </button>
          ))}
        </div>
      </div>

      {renderContent()}
    </div>
  );
}
