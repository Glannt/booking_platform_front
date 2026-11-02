"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  Users,
  Briefcase,
  Fuel,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Button } from "@heroui/react";
import { useI18n } from "@/context/LanguageContext";
import { formatPriceSync } from "@/lib/format";

export interface SelfDriveVehicleItem {
  id: string;
  rentalId: number;
  vehicleCategoryId: number;
  categorySlug?: string;
  nameVi: string;
  nameEn: string;
  descVi: string;
  descEn: string;
  pricePerDay: number;
  deposit: number;
  minimumDays: number;
  featuresVi: string[];
  featuresEn: string[];
  capacity: string;
  luggage: string;
  transmission?: string;
  fuelType?: string;
  imgUrl: string;
  resolvedImages?: { id: number; url: string }[];
}

interface SelfDriveVehicleCardProps {
  vehicle: SelfDriveVehicleItem;
}

export function SelfDriveVehicleCard({ vehicle }: SelfDriveVehicleCardProps) {
  const router = useRouter();
  const { language, t } = useI18n();

  const vehicleName = language === "vi" ? vehicle.nameVi : vehicle.nameEn || vehicle.nameVi;
  const vehicleDesc = language === "vi" ? vehicle.descVi : vehicle.descEn || vehicle.descVi;
  const features = language === "vi" ? vehicle.featuresVi : vehicle.featuresEn || vehicle.featuresVi;
  const slug = vehicle.categorySlug || "xe-tu-lai";

  const handleGoToDetail = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    router.push(`/${language}/self-drive/${slug}?id=${vehicle.vehicleCategoryId}`);
  };

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(
      `/${language}/self-drive/${slug}/confirm?id=${vehicle.vehicleCategoryId}&vehicleId=${vehicle.id}`
    );
  };

  return (
    <div
      onClick={() => handleGoToDetail()}
      className="group relative flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden border border-border bg-white dark:bg-[var(--bg-card)] hover:border-accent/60 hover:shadow-xl transition-all duration-300 cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative h-44 sm:h-48 overflow-hidden bg-black/5 dark:bg-[var(--bg-surface)] flex items-center justify-center">
        {vehicle.imgUrl ? (
          <img
            src={vehicle.imgUrl}
            alt={vehicleName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-foreground/40">
            <Car size={32} className="opacity-40" />
            <span className="text-[10px] font-semibold">{t.selfDrive.noPhotos || "Chưa có ảnh"}</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
          <span className="bg-black/60 dark:bg-black/70 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
            <Car size={11} className="text-accent" />
            <span>{vehicle.capacity} {t.selfDrive.seats || "chỗ"}</span>
          </span>

          <span className="bg-accent text-accent-foreground text-[10px] font-black px-2.5 py-1 rounded-full shadow-xs">
            {formatPriceSync(vehicle.pricePerDay, language)}/ngày
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-1.5">
          {/* Subtitle / Category Name */}
          <div className="flex items-center gap-1 text-[11px] text-foreground/60 truncate font-medium">
            <Sparkles size={11} className="text-accent shrink-0" />
            <span className="truncate">{vehicle.capacity} {t.selfDrive.seats || "chỗ"} • {vehicle.transmission || "Tự động"}</span>
          </div>

          {/* Vehicle Name */}
          <h3 className="font-bold text-sm sm:text-[15px] text-foreground leading-snug line-clamp-1 group-hover:text-accent transition-colors">
            {vehicleName}
          </h3>

          {/* Description */}
          {vehicleDesc && (
            <p className="text-[11px] text-foreground/70 font-medium line-clamp-2 leading-relaxed">
              {vehicleDesc}
            </p>
          )}

          {/* Specs Row */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-foreground/70 font-semibold">
            <span className="flex items-center gap-1 bg-black/5 dark:bg-[var(--bg-elevated)] px-2 py-0.5 rounded-md">
              <Users size={11} className="text-foreground/50" />
              {vehicle.capacity} {t.selfDrive.seats || "chỗ"}
            </span>
            <span className="flex items-center gap-1 bg-black/5 dark:bg-[var(--bg-elevated)] px-2 py-0.5 rounded-md">
              <Briefcase size={11} className="text-foreground/50" />
              {vehicle.luggage}
            </span>
            <span className="flex items-center gap-1 bg-black/5 dark:bg-[var(--bg-elevated)] px-2 py-0.5 rounded-md">
              <Fuel size={11} className="text-foreground/50" />
              {vehicle.fuelType || "Xăng"}
            </span>
          </div>

          {/* Service Commitment Tags */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/5 dark:bg-[var(--bg-elevated)] text-foreground/70">
              Giao tận nơi
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/5 dark:bg-[var(--bg-elevated)] text-foreground/70">
              Miễn phí hủy
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/5 dark:bg-[var(--bg-elevated)] text-foreground/70">
              Thủ tục 15p
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-border flex items-center gap-2">
          <button
            type="button"
            onClick={handleBookNow}
            className="flex-1 h-8 px-3 bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-xs rounded-xl shadow-xs cursor-pointer border-none flex items-center justify-center gap-1 transition-colors"
          >
            <span>{t.selfDrive.bookNow || "Đặt ngay"}</span>
          </button>

          <button
            type="button"
            onClick={handleGoToDetail}
            className="h-8 px-3 bg-black/5 dark:bg-[var(--bg-elevated)] hover:bg-black/10 dark:hover:bg-[var(--bg-surface)] text-foreground font-bold text-xs rounded-xl cursor-pointer border border-border flex items-center justify-center gap-1 transition-colors whitespace-nowrap"
          >
            <span>{t.selfDrive.details || "Chi tiết"}</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
export default SelfDriveVehicleCard;
