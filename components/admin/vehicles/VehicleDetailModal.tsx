"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalCloseTrigger,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { Edit3, Layers, Sparkles, Car, Fuel, Calendar, Briefcase, Hash } from "lucide-react";

import {
  VehicleDto,
  VehicleCategoryDto,
} from "@/lib/api/fleet";
import MultiImageUpload from "@/components/MultiImageUpload";
import VehicleCreateUpdateModal from "./VehicleCreateUpdateModal";

export interface VehicleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleDto | null;
  categories: VehicleCategoryDto[];
  language?: string;
  backendUrl?: string;
  onSaveSuccess: (updatedVehicle?: VehicleDto) => void | Promise<void>;
  showToast: (msg: string, type: "success" | "error") => void;
  defaultEditMode?: boolean;
  onEdit?: (vehicle: VehicleDto) => void;
}

export default function VehicleDetailModal({
  isOpen,
  onClose,
  vehicle,
  categories,
  language = "vi",
  backendUrl,
  onSaveSuccess,
  showToast,
  defaultEditMode = false,
  onEdit,
}: VehicleDetailModalProps) {
  const [isEditMode, setIsEditMode] = useState<boolean>(defaultEditMode);

  useEffect(() => {
    setIsEditMode(Boolean(defaultEditMode));
  }, [defaultEditMode, isOpen]);

  // If in edit mode, render VehicleCreateUpdateModal
  if (isEditMode && vehicle) {
    return (
      <VehicleCreateUpdateModal
        isOpen={isOpen}
        onClose={() => {
          setIsEditMode(false);
          onClose();
        }}
        editingVehicle={vehicle}
        categories={categories}
        language={language}
        backendUrl={backendUrl}
        onSaveSuccess={(v) => {
          setIsEditMode(false);
          onSaveSuccess(v);
        }}
        showToast={showToast}
      />
    );
  }

  if (!vehicle) return null;

  const categoryName =
    categories.find((c) => c.id === vehicle.type?.id)?.translations?.find((t) => t.locale === language)?.name ||
    vehicle.type?.translations?.find((t) => t.locale === language)?.name ||
    vehicle.type?.code ||
    "—";

  const fuelLabel =
    vehicle.fuelType === "petrol"
      ? ("Xăng (Petrol)"): vehicle.fuelType === "diesel"
      ? ("Dầu Diesel"): vehicle.fuelType === "electric"
      ? ("Điện (Electric)"): vehicle.fuelType || "—";

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      aria-labelledby="vehicle-detail-title"
    >
      <ModalBackdrop className="bg-slate-950/40 backdrop-blur-sm">
        <ModalContainer size="full">
          <ModalDialog className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-border shadow-2xl overflow-hidden w-full max-w-5xl lg:max-w-6xl flex flex-col max-h-[90vh]">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent/10 text-accent">
                  <Car size={22} />
                </div>
                <div>
                  <h2 id="vehicle-detail-title" className="text-lg font-extrabold">
                    {vehicle.brand} {vehicle.model}
                  </h2>
                  <p className="text-xs font-medium">
                    {"Chi tiết thông số kỹ thuật, hình ảnh, thuộc tính và tiện nghi xe"}
                  </p>
                </div>
              </div>
            </ModalHeader>

            <ModalBody className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Specifications Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Car size={15} className="text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider block">
                      {"Hãng & Dòng xe"}
                    </span>
                  </div>
                  <span className="text-base font-bold block">
                    {vehicle.brand} {vehicle.model}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Hash size={15} className="text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider block">
                      {"Biển số xe"}
                    </span>
                  </div>
                  <span className="text-base font-bold font-mono text-primary block">
                    {vehicle.licensePlate || "—"}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Layers size={15} className="text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider block">
                      {"Danh mục xe"}
                    </span>
                  </div>
                  <span className="text-base font-bold block">
                    {categoryName}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Calendar size={15} className="text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider block">
                      {"Năm sản xuất"}
                    </span>
                  </div>
                  <span className="text-base font-bold block">
                    {vehicle.year || "—"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Fuel size={15} className="text-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-wider block">
                      {"Nhiên liệu"}
                    </span>
                  </div>
                  <span className="text-base font-bold block">
                    {fuelLabel}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Briefcase size={15} className="text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider block">
                      {"Sức chứa hành lý"}
                    </span>
                  </div>
                  <span className="text-base font-bold block">
                    {vehicle.luggage} {vehicle.luggageUnit || "vali"}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card">
                  <span className="text-xs font-bold uppercase tracking-wider block mb-1.5">
                    {"Trạng thái hoạt động"}
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                      vehicle.active
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                    }`}
                  >
                    {vehicle.active
                      ? ("Đang hoạt động"): ("Ngừng hoạt động")}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card">
                  <span className="text-xs font-bold uppercase tracking-wider block mb-1.5">
                    {"Cho thuê tự lái"}
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                      vehicle.canRent
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {vehicle.canRent
                      ? ("Cho phép tự lái"): ("Chỉ kèm tài xế")}
                  </span>
                </div>
              </div>

              {/* Equipped Add-ons */}
              {vehicle.addOns && vehicle.addOns.length > 0 && (
                <div className="p-5 rounded-2xl border border-border bg-card space-y-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <Layers size={18} />
                    </div>
                    <div>
                      <span className="text-sm font-black uppercase tracking-wider block">
                        {"Thuộc tính & Phụ kiện kèm xe (Add-ons)"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {vehicle.addOns.map((ao) => {
                      const tr = ao.translations?.find((t) => t.locale === language) || ao.translations?.[0];
                      return (
                        <span
                          key={ao.id}
                          className="px-3.5 py-1.5 rounded-xl text-sm font-semibold bg-primary/10 text-primary border border-primary/20 shadow-2xs"
                        >
                          {tr?.name || ao.value || ao.code}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Equipped Amenities */}
              {vehicle.amenities && vehicle.amenities.length > 0 && (
                <div className="p-5 rounded-2xl border border-border bg-card space-y-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <span className="text-sm font-black uppercase tracking-wider block">
                        {"Tiện nghi trang bị (Amenities)"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {vehicle.amenities.map((am) => {
                      const tr = am.translations?.find((t) => t.locale === language) || am.translations?.[0];
                      return (
                        <span
                          key={am.id}
                          className="px-3.5 py-1.5 rounded-xl text-sm font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs"
                        >
                          {tr?.name || am.code}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Vehicle Images */}
              <div className="p-5 rounded-2xl border border-border bg-card shadow-xs">
                <MultiImageUpload
                  imageIds={vehicle.imageIds || []}
                  thumbnailId={vehicle.thumbnailId ?? undefined}
                  readOnly
                  label={"Hình ảnh Xe"}
                />
              </div>
            </ModalBody>

            <ModalFooter className="px-6 py-4 border-t border-border bg-muted/10 flex items-center justify-end gap-2.5 shrink-0">
              <Button
                variant="outline"
                onClick={onClose}
                className="rounded-xl font-bold text-xs h-10 px-4 border border-border bg-white dark:bg-[var(--bg-card)] hover:bg-muted text-foreground transition-colors cursor-pointer"
              >
                {"Đóng"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  if (onEdit) {
                    onEdit(vehicle);
                  } else {
                    setIsEditMode(true);
                  }
                }}
                className="rounded-xl font-bold text-xs h-10 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/50 shadow-xs cursor-pointer transition-colors"
              >
                <Edit3 size={15} className="mr-1.5" />
                {"Chỉnh sửa xe"}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
