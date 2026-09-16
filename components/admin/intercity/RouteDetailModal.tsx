"use client";

import React, { useState } from "react";
import { Edit3, Navigation, CheckCircle, XCircle, ImageIcon, MapPin, Users, Car, Sparkles, Calendar, Clock, Tag } from "lucide-react";
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
import type { IntercityRouteDto, IntercityRoutePriceDto } from "@/lib/api/intercity";
import type { VehicleCategoryDto } from "@/lib/api/fleet";
import { calcIntercityPrivatePrice } from "@/lib/pricing";
import { parseRouteComponents, extractComponentContent, DEFAULT_COMPARISON_DATA, type ComparisonItemData } from "@/types/routeComponents";
import { ScopedDiscountTab } from "../discount/ScopedDiscountTab";

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
  const [activeTab, setActiveTab] = useState<"DETAILS" | "DISCOUNTS">("DETAILS");

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

  const componentData = extractComponentContent(parseRouteComponents(route.components));
  const comparisonData = componentData.comparisonData ?? DEFAULT_COMPARISON_DATA;

  const renderComparisonCard = (
    icon: React.ReactNode,
    chipColor: "accent" | "warning",
    items: ComparisonItemData[],
    cardAccent: string
  ) => {
    const title = items.find((i) => i.type === "title");
    const badges = items.filter((i) => i.type === "badge");
    const desc = items.find((i) => i.type === "description");
    const ticks = items.filter((i) => i.type === "tick");
    return (
      <div className={`p-3 bg-white dark:bg-[var(--bg-surface)] rounded-xl border ${cardAccent}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase">
              {title?.value || ""}
            </span>
          </div>
          {badges.map((badge, idx) => (
            <Chip key={idx} size="sm" color={chipColor} variant="soft" className="text-[10px] font-bold">
              {badge.value}
            </Chip>
          ))}
        </div>
        {desc && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-3">{desc.value}</p>
        )}
        <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
          {ticks.map((tick, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <CheckCircle size={12} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>{tick.value}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const getCategoryName = (catId: number) => {
    const cat = categories.find(c => Number(c.id) === Number(catId));
    if (!cat) return `Dòng xe #${catId}`;
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
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-slate-400">
                    {route.originCity} ➔ {route.destinationCity}
                  </p>
                  {route.slug && (
                    <span className="text-[10px] font-mono font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                      slug: {route.slug}
                    </span>
                  )}
                </div>
              </div>
            </ModalHeader>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[var(--bg-card)] shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("DETAILS")}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === "DETAILS"
                    ? "border-accent text-accent"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Navigation size={14} />
                <span>Chi tiết tuyến đường</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("DISCOUNTS")}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === "DISCOUNTS"
                    ? "border-accent text-accent"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Tag size={14} />
                <span>Khuyến mãi áp dụng</span>
              </button>
            </div>

            <ModalBody className="p-6 space-y-6 overflow-y-auto max-h-[65vh]">
              {activeTab === "DETAILS" ? (
                <>
                  {/* Route Image Banner */}
                  <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden border border-border bg-slate-100 dark:bg-[var(--bg-card)] shadow-inner">
                    {imageUrl ? (
                      <>
                        <img
                          src={imageUrl}
                          alt={routeName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex items-end p-4 sm:p-5">
                          <div className="flex items-center gap-2 text-white">
                            <div className="w-7 h-7 rounded-lg bg-accent/90 flex items-center justify-center font-bold text-accent-foreground shadow-sm">
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
                        <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-[var(--bg-card)] flex items-center justify-center text-slate-400 dark:text-slate-500">
                          <ImageIcon size={24} />
                        </div>
                        <span className="text-xs font-semibold">Chưa có hình ảnh đại diện cho tuyến đường này</span>
                        <span className="text-[11px] text-slate-400">Bạn có thể tải ảnh lên ở mục Chỉnh sửa tuyến đường</span>
                      </div>
                    )}
                  </div>

                  {/* General Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-3.5 rounded-2xl border border-separator">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Khoảng cách</span>
                      <span className="text-sm font-black text-slate-700 dark:text-slate-200">
                        {route.distanceKm ? `${route.distanceKm} km` : "Chưa cập nhật"}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-3.5 rounded-2xl border border-separator">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Thời gian dự kiến</span>
                      <span className="text-sm font-black text-slate-700 dark:text-slate-200">
                        {route.estimatedHours ? `${route.estimatedHours} giờ` : "Chưa cập nhật"}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-3.5 rounded-2xl border border-separator">
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
                    <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-2xl border border-separator space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Mô tả tuyến đường</span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                        {routeDescription}
                      </p>
                    </div>
                  )}

                  {/* Linked Shared Route Info Section */}
                  <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-2xl border border-separator space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Users size={14} className="text-amber-500" />
                        Liên kết Tuyến xe ghép chỗ (Shared)
                      </span>
                      <Chip size="sm" color={route.hasSharedRoute || route.linkedSharedRouteId ? "success" : "default"} className="text-[10px] font-bold">
                        {route.hasSharedRoute || route.linkedSharedRouteId ? "Đã liên kết" : "Chưa liên kết"}
                      </Chip>
                    </div>
                    {route.linkedSharedRouteId && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Tuyến xe liên tỉnh này đang được liên kết với Tuyến xe ghép mã <strong>#{route.linkedSharedRouteId}</strong>. Giá vé và lịch trình được quản lý độc lập tại tab Tuyến xe ghép.
                      </p>
                    )}
                  </div>

                  {/* Inclusions & Exclusions Preview */}
                  <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-2xl border border-separator space-y-3">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <CheckCircle size={14} className="text-emerald-500" />
                      Dịch vụ Bao gồm & Không bao gồm
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 bg-white dark:bg-[var(--bg-surface)] rounded-xl border border-emerald-100 dark:border-emerald-950/30">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block mb-2">
                          {componentData.inclusionsTitle}
                        </span>
                        <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                          {componentData.inclusions.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <CheckCircle size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-3 bg-white dark:bg-[var(--bg-surface)] rounded-xl border border-amber-100 dark:border-amber-950/30">
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block mb-2">
                          {componentData.exclusionsTitle}
                        </span>
                        <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                          {componentData.exclusions.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <XCircle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Comparison Preview (PRIVATE vs SHARED) */}
                  <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-2xl border border-separator space-y-3">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-500" />
                      {comparisonData.title || "So sánh hình thức di chuyển"}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {renderComparisonCard(
                        <Car size={14} className="text-accent" />,
                        "accent",
                        comparisonData.privateCard,
                        "border-emerald-100 dark:border-emerald-950/30"
                      )}
                      {renderComparisonCard(
                        <Users size={14} className="text-amber-500" />,
                        "warning",
                        comparisonData.sharedCard,
                        "border-amber-100 dark:border-amber-950/30"
                      )}
                    </div>
                  </div>

                  {/* Price Table Section */}
                  <div className="border-t border-separator pt-4 space-y-4">
                    <Typography type="h4" className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Bảng giá theo dòng xe
                    </Typography>

                    {prices.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 dark:bg-[var(--bg-card)] rounded-2xl border border-dashed border-border">
                        <p className="text-xs text-slate-400 italic">Chưa cấu hình giá cho dòng xe nào trên tuyến này.</p>
                      </div>
                    ) : (
                      <Table aria-label="Bảng giá chi tiết các loại xe" className="w-full text-xs">
                        <Table.ScrollContainer>
                          <Table.Content>
                            <Table.Header>
                              <Table.Column isRowHeader>DÒNG XE</Table.Column>
                              <Table.Column>PHÂN LOẠI</Table.Column>
                              <Table.Column>GIÁ 1 CHIỀU / THEO NGÀY</Table.Column>
                              <Table.Column>GIÁ KHỨ HỒI</Table.Column>
                              <Table.Column>ĐẶT CỌC</Table.Column>
                              <Table.Column>TRẠNG THÁI</Table.Column>
                            </Table.Header>
                            <Table.Body>
                              {prices.map((p) => {
                                const isDaily = p.priceTypeCode === "DAILY_RATE" || p.priceTypeCategory === "DAILY_RATE";
                                const isRoundTripType = p.priceTypeCode === "ROUND_TRIP_SAME_DAY";
                                const oneWay = p.oneWayPrice || p.fixedPriceOneWay || (!isDaily && !isRoundTripType ? p.basePrice : 0) || 0;
                                const roundTrip = p.roundTripPrice || p.fixedPriceRoundTrip || (isRoundTripType ? p.basePrice : (oneWay > 0 ? oneWay * 2 : 0)) || 0;
                                const dailyRate = p.dailyRatePrice || p.dailyRate || (isDaily ? p.basePrice : 0) || 0;

                                return (
                                  <Table.Row key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-[var(--bg-elevated)]">
                                    <Table.Cell className="font-bold text-slate-700 dark:text-slate-200">
                                      {getCategoryName(p.vehicleCategoryId)}
                                    </Table.Cell>
                                    <Table.Cell>
                                      {isDaily ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                          <Calendar size={11} /> Theo ngày
                                        </span>
                                      ) : isRoundTripType ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                          <Clock size={11} /> Khứ hồi trong ngày
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                          <Clock size={11} /> Một chiều
                                        </span>
                                      )}
                                    </Table.Cell>
                                    <Table.Cell className="font-extrabold text-amber-500">
                                      {isDaily ? (
                                        <div className="flex flex-col">
                                          <span>{dailyRate > 0 ? `${dailyRate.toLocaleString()} ${p.currency || "VND"}/ngày` : "—"}</span>
                                          <span className="text-[10px] text-slate-400 font-normal">Tối thiểu {p.minDays || p.minimumDays || 1} ngày</span>
                                        </div>
                                      ) : (
                                        <span>{oneWay > 0 ? `${oneWay.toLocaleString()} ${p.currency || "VND"}` : "—"}</span>
                                      )}
                                    </Table.Cell>
                                    <Table.Cell className="font-extrabold text-amber-500">
                                      {isDaily ? (
                                        <span className="text-slate-400 font-normal italic">Theo ngày</span>
                                      ) : (
                                        <div className="flex flex-col">
                                          <span>{roundTrip > 0 ? `${roundTrip.toLocaleString()} ${p.currency || "VND"}` : "—"}</span>
                                          {!p.roundTripPrice && !p.fixedPriceRoundTrip && !isRoundTripType && oneWay > 0 && (
                                            <span className="text-[10px] text-slate-400 font-normal">(2× một chiều)</span>
                                          )}
                                        </div>
                                      )}
                                    </Table.Cell>
                                    <Table.Cell className="font-semibold text-slate-700 dark:text-slate-300">
                                      {p.depositType === "FIXED" ? (
                                        <span className="font-bold text-amber-600 dark:text-amber-400">
                                          {p.depositAmount ? `${p.depositAmount.toLocaleString()} VND (Cố định)` : "Cố định"}
                                        </span>
                                      ) : (
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                          {p.depositRate ?? 20}% tổng giá
                                        </span>
                                      )}
                                    </Table.Cell>
                                    <Table.Cell>
                                      <Chip size="sm" color={p.active ? "success" : "warning"} className="text-[10px] font-bold">
                                        {p.active ? "Hoạt động" : "Tạm ẩn"}
                                      </Chip>
                                    </Table.Cell>
                                  </Table.Row>
                                );
                              })}
                            </Table.Body>
                          </Table.Content>
                        </Table.ScrollContainer>
                      </Table>
                    )}
                  </div>
                </>
              ) : (
                <ScopedDiscountTab
                  scopeType="INTERCITY_ROUTE"
                  scopeRefId={route.id}
                  scopeTitle={`Tuyến: ${routeName}`}
                />
              )}
            </ModalBody>

            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Đóng
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onClose();
                  onEditRoute();
                }}
                className="rounded-xl font-bold text-xs h-10 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/50 shadow-xs cursor-pointer transition-colors"
              >
                <Edit3 size={15} className="mr-1.5" />
                Chỉnh sửa
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
