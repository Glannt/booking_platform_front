"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Label,
  Chip,
  Spinner,
} from "@heroui/react";
import {
  Route as RouteIcon,
  Edit3,
  MapPin,
  Plus,
  Eye,
  Pencil,
  Trash2,
  DollarSign,
  ShieldCheck,
} from "lucide-react";
import dynamic from "next/dynamic";
import {
  type AirportRouteDto,
  type AirportDto,
  type AirportTransferPrice,
  type VehicleCategoryDto,
  getAirportTransferPricesByRoute,
  deleteAirportTransfer,
} from "@/lib/api/fleet";
import { StatusChip } from "@/components/StatusChip";
import { ActivePromotionBadge, ActivePromotionSection } from "@/components/admin/discount";
import { AirportTransferDetailModal } from "./AirportTransferDetailModal";
import { AirportTransferCreateUpdateModal } from "./AirportTransferCreateUpdateModal";

const RouteMap = dynamic(() => import("@/components/route-map"), { ssr: false });

interface AirportRouteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: AirportRouteDto | null;
  airports: AirportDto[];
  categories?: VehicleCategoryDto[];
  routes?: AirportRouteDto[];
  onEdit: () => void;
  onPriceChanged?: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
}

export function AirportRouteDetailModal({
  isOpen,
  onClose,
  route,
  airports,
  categories = [],
  routes = [],
  onEdit,
  onPriceChanged,
  showToast,
}: AirportRouteDetailModalProps) {
  const [routePrices, setRoutePrices] = useState<AirportTransferPrice[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);

  // Child transfer modal states
  const [transferDetailOpen, setTransferDetailOpen] = useState(false);
  const [transferFormOpen, setTransferFormOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<AirportTransferPrice | null>(null);

  const loadRoutePrices = useCallback(async (routeId: number) => {
    setLoadingPrices(true);
    try {
      const res = await getAirportTransferPricesByRoute(routeId);
      if (res?.data) {
        setRoutePrices(res.data);
      }
    } catch {
      setRoutePrices([]);
    } finally {
      setLoadingPrices(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && route?.id) {
      loadRoutePrices(route.id);
    } else {
      setRoutePrices([]);
    }
  }, [isOpen, route?.id, loadRoutePrices]);

  if (!route) return null;

  const selectedAirport = airports.find((a) => a.id === route.airportId);
  const depositType = route.depositType || undefined;
  const depositRate = route.depositRate != null ? Number(route.depositRate) : undefined;
  const depositAmount = route.depositAmount != null ? String(route.depositAmount) : "";

  const handleDeletePrice = async (priceId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa cấu hình giá này?")) return;
    try {
      await deleteAirportTransfer(priceId);
      showToast("Xóa cấu hình giá thành công!", "success");
      if (route.id) loadRoutePrices(route.id);
      if (onPriceChanged) onPriceChanged();
    } catch {
      showToast("Xóa cấu hình giá thất bại!", "error");
    }
  };

  const renderPricesSection = () => (
    <div className="border-t border-separator pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-accent" />
          <Label className="text-xs font-bold uppercase tracking-wider text-foreground">
            Bảng giá các loại xe ({routePrices.length})
          </Label>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="rounded-xl font-bold text-xs h-8 px-3 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 cursor-pointer"
          onPress={() => {
            setSelectedTransfer(null);
            setTransferFormOpen(true);
          }}
        >
          <Plus size={14} className="mr-1" />
          Thêm giá xe
        </Button>
      </div>

      {loadingPrices ? (
        <div className="flex items-center justify-center p-6 text-foreground/60 text-xs gap-2">
          <Spinner size="sm" />
          <span>Đang tải bảng giá xe...</span>
        </div>
      ) : routePrices.length === 0 ? (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator text-center text-xs text-foreground/50">
          Chưa có bảng giá nào cho tuyến này. Hãy thêm giá cho từng loại xe.
        </div>
      ) : (
        <div className="space-y-2">
          {routePrices.map((p) => {
            const cat = categories.find((c) => c.id === p.vehicleCategoryId);
            const trans = cat?.translations?.find((t) => t.locale === "vi") || cat?.translations?.[0];
            const catName = trans?.name || cat?.code || `Loại xe #${p.vehicleCategoryId}`;
            const maxZoneKm = (p.baseKm ?? 0) + (p.zoneBufferKm ?? 2);

            return (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator hover:border-accent/40 transition-colors gap-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center font-bold text-xs shrink-0">
                    {cat?.maxSeat || 4}c
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-foreground">{catName}</span>
                      <StatusChip status={String(p.active)} type="active" />
                      <ActivePromotionBadge scopeType="AIRPORT_TRANSFER" scopeRefId={route.id} compact />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-foreground/60 mt-0.5">
                      <span>
                        Giá: <strong className="text-amber-500 font-bold">{p.baseAmount?.toLocaleString("vi-VN")} {p.currency}</strong> ({p.baseKm} km)
                      </span>
                      <span>
                        Zone: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">+{p.zoneBufferKm ?? 2} km</strong> (đến {maxZoneKm.toFixed(1)} km)
                      </span>
                      <span>
                        {p.fixedOvercharge
                          ? `Phụ trội: ${p.feeOverchargeFixed?.toLocaleString("vi-VN")}₫`
                          : `Thêm: ${p.perKmAmount?.toLocaleString("vi-VN")}₫/km`}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        Cọc:{" "}
                        {p.depositType ? (
                          <strong className="text-amber-600 dark:text-amber-400 font-semibold">
                            {p.depositType === "PERCENT" ? `${p.depositRate}%` : `${p.depositAmount?.toLocaleString("vi-VN")} ₫`} (riêng)
                          </strong>
                        ) : depositType ? (
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">
                            {depositType === "PERCENT"
                              ? `${depositRate}%`
                              : `${depositAmount ? Number(depositAmount).toLocaleString("vi-VN") : 0} ₫`} (tuyến)
                          </span>
                        ) : (
                          <span className="text-foreground/40">—</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1 shrink-0">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    aria-label="Xem chi tiết giá"
                    className="cursor-pointer text-foreground/60 hover:text-foreground"
                    onPress={() => {
                      setSelectedTransfer(p);
                      setTransferDetailOpen(true);
                    }}
                  >
                    <Eye size={15} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="secondary"
                    aria-label="Chỉnh sửa giá"
                    className="cursor-pointer text-foreground/60 hover:text-foreground"
                    onPress={() => {
                      setSelectedTransfer(p);
                      setTransferFormOpen(true);
                    }}
                  >
                    <Pencil size={15} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="danger"
                    aria-label="Xóa giá"
                    className="cursor-pointer"
                    onPress={() => handleDeletePrice(p.id!)}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
          <ModalContainer>
            <ModalDialog className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-border-secondary shadow-2xl overflow-hidden w-full max-w-3xl flex flex-col max-h-[90vh]">
              <ModalCloseTrigger />
              <ModalHeader className="px-6 py-4 border-b border-separator flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-accent/10 text-accent">
                    <RouteIcon size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg text-foreground">
                      Chi Tiết Tuyến Đường Sân Bay
                    </h3>
                    <p className="text-xs text-foreground/60">
                      Mã #{route.id} • {route.code} • {route.name || "Chưa đặt tên"}
                    </p>
                  </div>
                </div>
                <div className="pr-6">
                  <Chip
                    size="sm"
                    variant="soft"
                    className={
                      route.active
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]"
                        : "bg-default-100 text-foreground/50 font-bold text-[10px]"
                    }
                  >
                    {route.active ? "Hoạt động" : "Ngừng hoạt động"}
                  </Chip>
                </div>
              </ModalHeader>

              <ModalBody className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Mã Tuyến Đường</Label>
                    <p className="mt-1 text-sm font-bold text-foreground">{route.code}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Sân Bay</Label>
                    <p className="mt-1 text-sm font-bold text-foreground">
                      {selectedAirport ? `${selectedAirport.name} (${selectedAirport.code})` : "—"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Khoảng cách</Label>
                    <p className="mt-1 text-sm font-bold text-foreground">
                      {route.distanceKm != null ? `${route.distanceKm} km` : "—"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Tên hiển thị</Label>
                    <p className="mt-1 text-sm font-bold text-foreground">{route.name || "—"}</p>
                  </div>
                </div>

                {/* Default Route Deposit Policy Card — hidden while the route has no deposit configured */}
                {depositType && (
                  <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <ShieldCheck size={15} className="text-amber-600 shrink-0" />
                        Chính Sách Đặt Cọc Mặc Định Tuyến
                      </span>
                      <span className="text-xs font-black text-amber-700 dark:text-amber-400">
                        {depositType === "FIXED"
                          ? depositAmount
                            ? `${Number(depositAmount).toLocaleString("vi-VN")} VND (Cố định)`
                            : "Cố định"
                          : `${depositRate}% (Theo phần trăm)`}
                      </span>
                    </div>
                    <p className="text-[11px] text-foreground/60">
                      {depositType === "FIXED"
                        ? "Áp dụng thu trước số tiền cọc cố định này cho tất cả bảng giá xe chưa cấu hình riêng trên tuyến."
                        : `Mọi bảng giá xe trên tuyến này sẽ mặc định yêu cầu đặt cọc ${depositRate}% tổng tiền chuyến đi nếu không cấu hình riêng.`}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-separator pt-4">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Điểm đi (Origin)</Label>
                    <p className="mt-1 text-sm font-bold text-foreground">{route.originName || "—"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Điểm đến (Destination)</Label>
                    <p className="mt-1 text-sm font-bold text-foreground">{route.destinationName || "—"}</p>
                  </div>
                </div>

                {route.originLat && route.originLng && route.destinationLat && route.destinationLng && (
                  <div className="border-t border-separator pt-4">
                    <Label className="block text-xs font-bold mb-2 uppercase tracking-wider text-foreground">
                      Bản đồ lộ trình
                    </Label>
                    <RouteMap
                      originLat={route.originLat}
                      originLng={route.originLng}
                      originLabel={route.originName || selectedAirport?.name || "Điểm đi"}
                      destinationLat={route.destinationLat}
                      destinationLng={route.destinationLng}
                      destinationLabel={route.destinationName || "Điểm đến"}
                    />
                  </div>
                )}

                {/* Active Promotions on this Airport Route */}
                {route.id && (
                  <ActivePromotionSection
                    scopeType="AIRPORT_TRANSFER"
                    scopeRefId={route.id}
                    showEmpty
                    className="my-3"
                  />
                )}

                {/* Integrated Price List Section with View, Edit, Add, Delete */}
                {renderPricesSection()}
              </ModalBody>

              <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
                <Button
                  variant="outline"
                  className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-foreground/80 transition-colors cursor-pointer"
                  onClick={onClose}
                >
                  Đóng
                </Button>
                <Button
                  type="button"
                  className="rounded-xl font-bold text-xs h-10 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/50 shadow-xs cursor-pointer transition-colors"
                  onPress={onEdit}
                >
                  <Edit3 size={15} className="mr-1.5" />
                  Chỉnh sửa tuyến
                </Button>
              </ModalFooter>
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </Modal>

      {/* Child Modal: View price detail */}
      <AirportTransferDetailModal
        isOpen={transferDetailOpen}
        onClose={() => {
          setTransferDetailOpen(false);
          setSelectedTransfer(null);
        }}
        transfer={selectedTransfer}
        routes={routes.length > 0 ? routes : [route]}
        categories={categories}
        onEdit={() => {
          setTransferDetailOpen(false);
          setTransferFormOpen(true);
        }}
        defaultRouteDeposit={{
          depositType,
          depositRate,
          depositAmount: depositAmount ? Number(depositAmount) : undefined,
        }}
      />

      {/* Child Modal: Create / Edit price */}
      <AirportTransferCreateUpdateModal
        isOpen={transferFormOpen}
        onClose={() => {
          setTransferFormOpen(false);
          setSelectedTransfer(null);
        }}
        transfer={selectedTransfer}
        routes={routes.length > 0 ? routes : [route]}
        categories={categories}
        onSaveSuccess={() => {
          if (route.id) loadRoutePrices(route.id);
          if (onPriceChanged) onPriceChanged();
        }}
        showToast={showToast}
        defaultRouteDeposit={{
          depositType,
          depositRate,
          depositAmount: depositAmount ? Number(depositAmount) : undefined,
        }}
      />
    </>
  );
}

export default AirportRouteDetailModal;
