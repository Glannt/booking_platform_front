"use client";

import React from "react";
import { Edit3, Navigation, CheckCircle, XCircle, ImageIcon, MapPin } from "lucide-react";
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
  Table,
  Typography,
  Chip
} from "@heroui/react";
import type { IntercityRouteDto, IntercityRoutePriceDto } from "@/lib/api/rental";
import type { VehicleCategoryDto } from "@/lib/api/fleet";
import { calcIntercityPrice } from "@/lib/pricing";

interface RouteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: IntercityRouteDto | null;
  prices: IntercityRoutePriceDto[];
  categories: VehicleCategoryDto[];
  onEditRoute: () => void;
}

export function RouteDetailModal({
  isOpen,
  onClose,
  route,
  prices,
  categories,
  onEditRoute,
}: RouteDetailModalProps) {
  if (!route) return null;

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:8080";
  const imageUrl = route.thumbnailUrl
    ? (route.thumbnailUrl.startsWith("http")
        ? route.thumbnailUrl
        : `${backendUrl}${route.thumbnailUrl}`)
    : null;

  const trans = route.translations?.find(t => t.locale === "vi") || route.translations?.[0];
  const routeName = trans?.name || `${route.originCity} ⇌ ${route.destinationCity}`;
  const routeDescription = trans?.description;

  const getCategoryName = (catId: number) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return `ID: ${catId}`;
    return cat.translations?.find(t => t.locale === "vi")?.name || cat.code;
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <Typography type="h3" className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-accent" />
                  {routeName}
                </Typography>
                <p className="text-xs text-slate-400 mt-1">
                  {route.originCity} ➔ {route.destinationCity}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="font-bold flex items-center gap-1.5 cursor-pointer"
                onClick={() => {
                  onClose();
                  onEditRoute();
                }}
              >
                <Edit3 className="w-3.5 h-3.5" />
                Chỉnh sửa
              </Button>
            </ModalHeader>

            <ModalBody className="p-6 space-y-6 overflow-y-auto max-h-[65vh]">
              {/* Route Image Banner */}
              <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[var(--bg-card)] shadow-inner">
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt={routeName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex items-end p-4 sm:p-5">
                      <div className="flex items-center gap-2 text-white">
                        <div className="w-7 h-7 rounded-lg bg-accent/90 flex items-center justify-center font-bold text-white shadow-sm">
                          <MapPin size={16} />
                        </div>
                        <div>
                          <span className="text-sm font-black drop-shadow-md block">
                            {route.originCity} ⇌ {route.destinationCity}
                          </span>
                          {route.distanceKm && (
                            <span className="text-xs text-slate-200 font-medium">
                              Khoảng cách: {route.distanceKm} km {route.estimatedHours ? `• ~${route.estimatedHours} giờ di chuyển` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 p-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                      <ImageIcon size={24} />
                    </div>
                    <span className="text-xs font-semibold">Chưa có hình ảnh đại diện cho tuyến đường này</span>
                    <span className="text-[11px] text-slate-400">Bạn có thể tải ảnh lên ở mục Chỉnh sửa tuyến đường</span>
                  </div>
                )}
              </div>

              {/* General Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Khoảng cách</span>
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200">
                    {route.distanceKm ? `${route.distanceKm} km` : "Chưa cập nhật"}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Thời gian dự kiến</span>
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200">
                    {route.estimatedHours ? `${route.estimatedHours} giờ` : "Chưa cập nhật"}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Khung giờ khởi hành</span>
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    {route.hasDepartureTimes ? (
                      <><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Có</>
                    ) : (
                      <><XCircle className="w-3.5 h-3.5 text-slate-400" /> Không</>
                    )}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Trạng thái</span>
                  <span className="text-sm font-black flex items-center gap-1 mt-0.5">
                    <Chip size="sm" color={route.active ? "success" : "warning"} className="text-[10px] font-bold">
                      {route.active ? "Hoạt động" : "Tạm dừng"}
                    </Chip>
                  </span>
                </div>
              </div>

              {/* Route Description (if available) */}
              {routeDescription && (
                <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Mô tả tuyến đường</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {routeDescription}
                  </p>
                </div>
              )}

              {/* Price Table Section */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                <Typography type="h4" className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Bảng giá theo dòng xe (Per-KM)
                </Typography>

                {prices.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 dark:bg-[var(--bg-card)] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-400 italic">Chưa cấu hình giá cho dòng xe nào trên tuyến này.</p>
                  </div>
                ) : (
                  <Table aria-label="Bảng giá chi tiết các loại xe" className="w-full text-xs">
                    <Table.ScrollContainer>
                      <Table.Content>
                        <Table.Header>
                          <Table.Column isRowHeader>DÒNG XE</Table.Column>
                          <Table.Column>ĐƠN GIÁ / KM</Table.Column>
                          <Table.Column>ƯỚC TÍNH 1 CHIỀU</Table.Column>
                          <Table.Column>ƯỚC TÍNH KHỨ HỒI</Table.Column>
                          <Table.Column>TRẠNG THÁI</Table.Column>
                        </Table.Header>
                        <Table.Body>
                          {prices.map((p) => (
                            <Table.Row key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-[var(--bg-elevated)]">
                              <Table.Cell className="font-bold text-slate-700 dark:text-slate-200">
                                {getCategoryName(p.vehicleCategoryId)}
                              </Table.Cell>
                              <Table.Cell className="font-extrabold text-amber-500">
                                {p.perKmAmount > 0 ? `${p.perKmAmount.toLocaleString()} ${p.currency}` : "—"}
                              </Table.Cell>
                              <Table.Cell className="font-extrabold text-amber-500">
                                {route.distanceKm ? `${calcIntercityPrice(route.distanceKm, p.perKmAmount, false).toLocaleString()} ${p.currency}` : "—"}
                              </Table.Cell>
                              <Table.Cell className="font-extrabold text-amber-500">
                                {route.distanceKm ? `${calcIntercityPrice(route.distanceKm, p.perKmAmount, true).toLocaleString()} ${p.currency}` : "—"}
                              </Table.Cell>
                              <Table.Cell>
                                <Chip size="sm" color={p.active ? "success" : "warning"} className="text-[10px] font-bold">
                                  {p.active ? "Hoạt động" : "Tạm ẩn"}
                                </Chip>
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Content>
                    </Table.ScrollContainer>
                  </Table>
                )}
              </div>
            </ModalBody>

            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end shrink-0 bg-white dark:bg-[var(--bg-surface)]">
              <Button size="sm" variant="ghost" onClick={onClose} className="rounded-xl font-bold cursor-pointer">
                Đóng
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
