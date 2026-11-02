import React from "react";
import {
  Compass,
  Ship,
  Car,
  Utensils,
  Award,
  Shield,
  Anchor,
  Camera,
  Sun,
  Palmtree,
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
  Info
} from "lucide-react";

export interface TourIconItem {
  name: string;
  IconComponent: React.ElementType;
}

export const TOUR_ICONS: TourIconItem[] = [
  { name: "Ship", IconComponent: Ship },
  { name: "Car", IconComponent: Car },
  { name: "Compass", IconComponent: Compass },
  { name: "Utensils", IconComponent: Utensils },
  { name: "Award", IconComponent: Award },
  { name: "Shield", IconComponent: Shield },
  { name: "Anchor", IconComponent: Anchor },
  { name: "Camera", IconComponent: Camera },
  { name: "Sun", IconComponent: Sun },
  { name: "Palmtree", IconComponent: Palmtree },
  { name: "MapPin", IconComponent: MapPin },
  { name: "Sparkles", IconComponent: Sparkles },
  { name: "Crown", IconComponent: Crown },
  { name: "Music", IconComponent: Music },
  { name: "Wine", IconComponent: Wine },
  { name: "Wifi", IconComponent: Wifi },
  { name: "Phone", IconComponent: Phone },
  { name: "CreditCard", IconComponent: CreditCard },
  { name: "Clock", IconComponent: Clock },
  { name: "FileText", IconComponent: FileText },
  { name: "BadgeCheck", IconComponent: BadgeCheck },
  { name: "ShieldCheck", IconComponent: ShieldCheck },
  { name: "Info", IconComponent: Info },
];

export const getIconComponent = (iconName?: string): React.ElementType => {
  if (!iconName) return Info;
  const matched = TOUR_ICONS.find(i => i.name.toLowerCase() === iconName.toLowerCase());
  return matched ? matched.IconComponent : Info;
};
