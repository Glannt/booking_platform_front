"use client";

import React, { useState, useEffect } from "react";
import { Edit3, MapPin, Navigation, Clock, CheckCircle, XCircle } from "lucide-react";
import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  Button,
  Table,
  Typography,
  Chip
} from "@heroui/react";
import type { IntercityRouteDto, IntercityRoutePriceDto, IntercitySeasonalSurchargeDto } from "@/lib/api/rental";
import { getSurchargesByRoute } from "@/lib/api/rental";
import type { VehicleCategoryDto } from "@/lib/api/fleet";

interface RouteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: IntercityRouteDto | null;
  prices: IntercityRoutePriceDto[];
  surcharges: IntercitySeasonalSurchargeDto[];
  categories: VehicleCategoryDto[];
  onEditRoute: () => void;
}

export function RouteDetailModal({
  isOpen,
  onClose,
  route,
  prices,
  surcharges,
  categories,
  onEditRoute,
}: RouteDetailModalProps) {
  if (!route) return null;

  const [assignedSurcharges, setAssignedSurcharges] = useState<IntercitySeasonalSurchargeDto[]>([]);

  useEffect(() => {
    if (route?.id && isOpen) {
      getSurchargesByRoute(route.id).then(res => {
        if (res.data) setAssignedSurcharges(res.data);
      }).catch(() => setAssignedSurcharges([]));
    }
  }, [route?.id, isOpen]);

  const getRouteName = (r: IntercityRouteDto) => {
    const t = r.translations?.find(t => t.locale === "vi") || r.translations?.[0];
    return t?.name || `${r.originCity} ⇌ ${r.destinationCity}`;
  };

  const getCategoryName = (catId: number) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return `ID: ${catId}`;
    const t = cat.translations?.find((t: any) => t.locale === "vi") || cat.translations?.[0];
    return t?.name || cat.code;
  };

  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${url}`;
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-4xl bg-white dark:bg-[var(--bg-surface)] p-6 rounded-2xl shadow-2xl">
            <ModalHeader className="flex items-center justify-between p-0 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between w-full">
                <Typography type="h3" className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Chi tiết tuyến đường: {getRouteName(route)}
                </Typography>
                <Button
                  size="sm"
                  onClick={onEditRoute}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 size={14} /> Chỉnh sửa
                </Button>
              </div>
            </ModalHeader>

            <ModalBody className="gap-6 max-h-[75vh] overflow-y-auto pr-2 mt-4">
              {/* Route Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Thành phố đi (Origin)</p>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-accent" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{route.originCity}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Thành phố đến (Destination)</p>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-red-500" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{route.destinationCity}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Khoảng cách</p>
                      <div className="flex items-center gap-2">
                        <Navigation size={14} className="text-blue-500" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{route.distanceKm ? `${route.distanceKm} km` : "—"}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Thời gian di chuyển ước tính</p>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-amber-500" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{route.estimatedHours ? `${route.estimatedHours} giờ` : "—"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Trạng thái tuyến</p>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          {route.active ? "Đang hoạt động" : "Tạm ngưng"}
                        </span>
                      </div>
                      {route.active ? <CheckCircle size={20} className="text-success" /> : <XCircle size={20} className="text-warning" />}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Cấu hình giờ chạy</p>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          {route.hasDepartureTimes ? "Có giờ cố định" : "Tự do theo khách"}
                        </span>
                      </div>
                      <Chip
                        size="sm"
                        className="font-bold text-[10px]"
                        color={route.hasDepartureTimes ? "warning" : "default"}
                      >
                        {route.hasDepartureTimes ? "Giờ cố định" : "Tự do"}
                      </Chip>
                    </div>
                  </div>
                </div>

                {/* Banner Preview */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-black relative h-36 md:h-full flex items-center justify-center">
                  {route.thumbnailUrl ? (
                    <img
                      src={getImageUrl(route.thumbnailUrl)}
                      alt="Banner"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-400 italic">Chưa có banner</span>
                  )}
                </div>
              </div>

              {/* Vehicle Pricing Section */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                <Typography type="h4" className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Bảng giá dịch vụ theo dòng xe
                </Typography>

                {prices.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-400 italic">Chưa cấu hình bảng giá cho tuyến đường này.</p>
                  </div>
                ) : (
                  <Table className="w-full text-xs">
                    <Table.ScrollContainer>
                      <Table.Content>
                        <Table.Header>
                          <Table.Column isRowHeader>DÒNG XE</Table.Column>
                          <Table.Column>GIÁ 1 CHIỀU</Table.Column>
                          <Table.Column>GIÁ KHỨ HỒI</Table.Column>
                          <Table.Column>TRẠNG THÁI</Table.Column>
                        </Table.Header>
                        <Table.Body>
                          {prices.map((p) => (
                            <Table.Row key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                              <Table.Cell className="font-bold text-slate-700 dark:text-slate-200">
                                {getCategoryName(p.vehicleCategoryId)}
                              </Table.Cell>
                              <Table.Cell className="font-extrabold text-amber-500">
                                {p.oneWayAmount > 0 ? `${p.oneWayAmount.toLocaleString()} ${p.currency}` : "—"}
                              </Table.Cell>
                              <Table.Cell className="font-extrabold text-amber-500">
                                {p.roundTripAmount > 0 ? `${p.roundTripAmount.toLocaleString()} ${p.currency}` : "—"}
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

              {/* Seasonal Surcharges Section */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                <Typography type="h4" className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Phụ thu theo mùa áp dụng
                </Typography>

                {assignedSurcharges.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-400 italic">Không có phụ thu theo mùa nào được gán cho tuyến đường này.</p>
                  </div>
                ) : (
                  <Table className="w-full text-xs">
                    <Table.ScrollContainer>
                      <Table.Content>
                        <Table.Header>
                          <Table.Column isRowHeader>TÊN MÙA</Table.Column>
                          <Table.Column>NGÀY BẮT ĐẦU</Table.Column>
                          <Table.Column>NGÀY KẾT THÚC</Table.Column>
                          <Table.Column>MỨC PHỤ THU (%)</Table.Column>
                          <Table.Column>TRẠNG THÁI</Table.Column>
                        </Table.Header>
                        <Table.Body>
                          {assignedSurcharges.map((s) => (
                            <Table.Row key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                              <Table.Cell className="font-bold text-slate-700 dark:text-slate-200">
                                {s.seasonName}
                              </Table.Cell>
                              <Table.Cell>{s.startDate?.substring(0, 10)}</Table.Cell>
                              <Table.Cell>{s.endDate?.substring(0, 10)}</Table.Cell>
                              <Table.Cell className="font-extrabold text-amber-500">
                                +{s.surchargePercent}%
                              </Table.Cell>
                              <Table.Cell>
                                <Chip size="sm" color={s.active ? "success" : "warning"} className="text-[10px] font-bold">
                                  {s.active ? "Hoạt động" : "Tạm ẩn"}
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

              <div className="flex gap-2 justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
                <Button size="sm" variant="ghost" onClick={onClose}>Đóng</Button>
              </div>
            </ModalBody>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
