"use client";

import React, { useState } from "react";
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
  Chip,
  Typography,
} from "@heroui/react";
import {
  Bus,
  Clock,
  MapPin,
  Building2,
  Calendar,
  DollarSign,
  ArrowRight,
  Link as LinkIcon,
  Edit3,
  Sparkles,
} from "lucide-react";
import {
  DAYS_OF_WEEK,
  type SharedRouteDto,
  type SharedOfficeDto,
  type SharedRouteDirectionDto,
} from "@/lib/api/sharedRoute";
import { ActivePromotionSection } from "@/components/admin/discount";

interface SharedRouteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: SharedRouteDto | null;
  offices?: SharedOfficeDto[];
  onEdit: () => void;
}

const ALL_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const WEEKDAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

export function SharedRouteDetailModal({
  isOpen,
  onClose,
  route,
  offices = [],
  onEdit,
}: SharedRouteDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"OUTBOUND" | "RETURN">("OUTBOUND");

  if (!route) return null;

  const outboundDir = route.directions?.find((d) => d.directionType === "OUTBOUND");
  const returnDir = route.directions?.find((d) => d.directionType === "RETURN");
  const currentDir = activeTab === "OUTBOUND" ? outboundDir : returnDir;

  const getOfficeName = (id: number) => {
    const found = offices.find((o) => o.id === id);
    return found ? `${found.name} (${found.city})` : `VP #${id}`;
  };

  const getOfficeAddress = (id: number) => {
    const found = offices.find((o) => o.id === id);
    return found?.address || "";
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
                  <Bus size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Typography type="h3" className="text-base font-bold text-foreground">
                      {route.name}
                    </Typography>
                    <Chip
                      size="sm"
                      variant="soft"
                      className={
                        route.active
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]"
                          : "bg-default-100 text-foreground/50 font-bold text-[10px]"
                      }
                    >
                      {route.active ? "Đang hoạt động" : "Tạm ngưng"}
                    </Chip>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground/60 mt-0.5">
                    <span>Dòng xe: <strong className="text-foreground">{route.vehicleName || "Chưa thiết lập"}</strong></span>
                    {route.linkedIntercityRouteId && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                          <LinkIcon size={12} />
                          Đã liên kết xe riêng #{route.linkedIntercityRouteId}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </ModalHeader>

            <ModalBody className="p-6 space-y-5 overflow-y-auto max-h-[65vh]">
              {/* Section 1: Khuyến Mãi Đang Áp Dụng */}
              {route.id && (
                <ActivePromotionSection
                  scopeType="SHARED_ROUTE"
                  scopeRefId={route.id}
                  showEmpty
                />
              )}

              {/* Section 2: Chọn Chiều Di Chuyển */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                    Thông tin lộ trình & Lịch chạy
                  </span>
                  <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[var(--bg-card)] rounded-xl border border-border">
                    <button
                      type="button"
                      onClick={() => setActiveTab("OUTBOUND")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "OUTBOUND"
                          ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-sm border border-border"
                          : "text-foreground/60 hover:text-foreground"
                      }`}
                    >
                      Chiều đi ({outboundDir?.originCity || "..."} ➔ {outboundDir?.destinationCity || "..."})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("RETURN")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "RETURN"
                          ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-sm border border-border"
                          : "text-foreground/60 hover:text-foreground"
                      }`}
                    >
                      Chiều về ({returnDir?.originCity || "..."} ➔ {returnDir?.destinationCity || "..."})
                    </button>
                  </div>
                </div>

                {currentDir ? (
                  <div className="space-y-4">
                    {/* Route Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-border space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-foreground/60">
                          <DollarSign size={14} className="text-emerald-500" />
                          <span>Giá vé / người</span>
                        </div>
                        <div className="text-lg font-black text-foreground">
                          {Number(currentDir.price || 0).toLocaleString("vi-VN")} ₫
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-border space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-foreground/60">
                          <MapPin size={14} className="text-accent" />
                          <span>Khoảng cách</span>
                        </div>
                        <div className="text-lg font-black text-foreground">
                          {currentDir.distanceKm != null ? `${currentDir.distanceKm} km` : "N/A"}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-border space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-foreground/60">
                          <Clock size={14} className="text-amber-500" />
                          <span>Thời gian ước tính</span>
                        </div>
                        <div className="text-lg font-black text-foreground">
                          {currentDir.estimatedHours != null ? `${currentDir.estimatedHours} giờ` : "N/A"}
                        </div>
                      </div>
                    </div>

                    {/* Offices Card */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-border space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                        <Building2 size={14} className="text-accent" />
                        <span>Văn phòng đón / trả khách</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        {/* Origin Offices */}
                        <div className="space-y-1.5">
                          <span className="font-semibold text-foreground/70 block">
                            Đầu đi: {currentDir.originCity}
                          </span>
                          {currentDir.originOfficeIds && currentDir.originOfficeIds.length > 0 ? (
                            <div className="space-y-1">
                              {currentDir.originOfficeIds.map((id) => (
                                <div
                                  key={id}
                                  className="p-2 rounded-lg bg-white dark:bg-[var(--bg-surface)] border border-border"
                                >
                                  <div className="font-bold text-foreground">{getOfficeName(id)}</div>
                                  {getOfficeAddress(id) && (
                                    <div className="text-[11px] text-foreground/60">{getOfficeAddress(id)}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-foreground/50 italic">Không giới hạn văn phòng cụ thể</span>
                          )}
                        </div>

                        {/* Destination Offices */}
                        <div className="space-y-1.5">
                          <span className="font-semibold text-foreground/70 block">
                            Đầu đến: {currentDir.destinationCity}
                          </span>
                          {currentDir.destinationOfficeIds && currentDir.destinationOfficeIds.length > 0 ? (
                            <div className="space-y-1">
                              {currentDir.destinationOfficeIds.map((id) => (
                                <div
                                  key={id}
                                  className="p-2 rounded-lg bg-white dark:bg-[var(--bg-surface)] border border-border"
                                >
                                  <div className="font-bold text-foreground">{getOfficeName(id)}</div>
                                  {getOfficeAddress(id) && (
                                    <div className="text-[11px] text-foreground/60">{getOfficeAddress(id)}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-foreground/50 italic">Không giới hạn văn phòng cụ thể</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Departure Schedules */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                          <Clock size={14} className="text-accent" />
                          <span>Lịch giờ xuất phát ({currentDir.schedules?.length || 0} chuyến)</span>
                        </div>
                      </div>

                      {currentDir.schedules && currentDir.schedules.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {currentDir.schedules.map((sch, idx) => {
                            const days = sch.operatingDays || ALL_DAYS;
                            const isAllDays = ALL_DAYS.every((d) => days.includes(d));
                            const isWeekdays =
                              WEEKDAYS.every((d) => days.includes(d)) &&
                              !days.includes("SATURDAY") &&
                              !days.includes("SUNDAY");

                            return (
                              <div
                                key={idx}
                                className="p-3 bg-white dark:bg-[var(--bg-surface)] rounded-xl border border-border space-y-1.5 shadow-2xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-sm text-foreground">
                                    {(sch.departureTime || "").substring(0, 5)}
                                  </span>
                                  {isAllDays ? (
                                    <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                      Hàng ngày
                                    </span>
                                  ) : isWeekdays ? (
                                    <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                                      Thứ 2 - Thứ 6
                                    </span>
                                  ) : (
                                    <div className="flex flex-wrap gap-0.5">
                                      {days.map((d) => {
                                        const found = DAYS_OF_WEEK.find((item) => item.key === d);
                                        return (
                                          <span
                                            key={d}
                                            className="text-[9px] font-bold bg-accent/15 text-accent px-1.5 py-0.2 rounded"
                                          >
                                            {found?.shortVi || d}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                                {sch.note && (
                                  <div className="text-[11px] text-foreground/60">{sch.note}</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-xs text-foreground/50">
                          Chưa thiết lập lịch giờ xuất phát
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-foreground/50">
                    Chưa có dữ liệu cấu hình cho chiều này
                  </div>
                )}
              </div>
            </ModalBody>

            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
              <Button
                variant="outline"
                onClick={onClose}
                className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-foreground/80 transition-colors cursor-pointer"
              >
                Đóng
              </Button>
              <Button
                variant="secondary"
                onClick={onEdit}
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

export default SharedRouteDetailModal;
