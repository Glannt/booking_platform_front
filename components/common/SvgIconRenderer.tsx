import React from "react";
import clsx from "clsx";
import {
  Ship,
  Car,
  Compass,
  Palmtree,
  Sun,
  Anchor,
  Camera,
  Utensils,
  Award,
  Shield,
  MapPin,
  Sparkles,
  Crown,
  Music,
  Wine,
  Wifi,
  Phone,
  CreditCard,
  Clock,
  FileText,
  BadgeCheck,
  ShieldCheck,
  Route,
  Fuel,
  Info,
  UserCheck,
  Headset,
  Handshake,
  Wallet,
} from "lucide-react";

interface SvgIconRendererProps {
  svgString?: string | null;
  className?: string;
  fallback?: React.ReactNode;
  style?: React.CSSProperties;
  size?: number;
}

const LEGACY_ICON_MAP: Record<string, React.ElementType> = {
  ship: Ship,
  car: Car,
  compass: Compass,
  palmtree: Palmtree,
  sun: Sun,
  anchor: Anchor,
  camera: Camera,
  utensils: Utensils,
  award: Award,
  shield: Shield,
  "map-pin": MapPin,
  mappin: MapPin,
  sparkles: Sparkles,
  crown: Crown,
  music: Music,
  wine: Wine,
  wifi: Wifi,
  phone: Phone,
  creditcard: CreditCard,
  "credit-card": CreditCard,
  clock: Clock,
  filetext: FileText,
  "file-text": FileText,
  badgecheck: BadgeCheck,
  "badge-check": BadgeCheck,
  shieldcheck: ShieldCheck,
  "shield-check": ShieldCheck,
  route: Route,
  fuel: Fuel,
  usercheck: UserCheck,
  "user-check": UserCheck,
  headset: Headset,
  handshake: Handshake,
  wallet: Wallet,
};

export const SvgIconRenderer: React.FC<SvgIconRendererProps> = ({
  svgString,
  className,
  fallback,
  style,
  size,
}) => {
  if (!svgString || typeof svgString !== "string" || !svgString.trim()) {
    if (fallback !== undefined) return <>{fallback}</>;
    return (
      <div style={style} className={clsx("inline-flex items-center justify-center shrink-0 text-current", className)}>
        <Compass size={size} className="w-full h-full" />
      </div>
    );
  }

  const trimmed = svgString.trim();

  // 1. Raw SVG detection
  if (trimmed.toLowerCase().includes("<svg")) {
    return (
      <div
        style={style}
        className={clsx(
          "inline-flex items-center justify-center shrink-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:shrink-0",
          className
        )}
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    );
  }

  // 2. Image URL detection
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/") ||
    /\.(png|jpe?g|webp|svg|gif)$/i.test(trimmed)
  ) {
    return (
      <div style={style} className={clsx("inline-flex items-center justify-center shrink-0 overflow-hidden", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={trimmed} alt="" className="w-full h-full object-contain" />
      </div>
    );
  }

  // 3. Legacy icon name lookup (backward compatibility for old database records)
  const normalized = trimmed.toLowerCase().replace(/[^a-z0-9-]/g, "");
  const LegacyComponent = LEGACY_ICON_MAP[normalized];
  if (LegacyComponent) {
    return (
      <div style={style} className={clsx("inline-flex items-center justify-center shrink-0 text-current", className)}>
        <LegacyComponent size={size} className="w-full h-full" />
      </div>
    );
  }

  // 4. Default fallback
  if (fallback !== undefined) return <>{fallback}</>;
  return (
    <div style={style} className={clsx("inline-flex items-center justify-center shrink-0 text-current", className)}>
      <Info size={size} className="w-full h-full" />
    </div>
  );
};
