"use client";

import React from "react";
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

  const getRouteName = (r: IntercityRouteDto) => {
    const t = r.translations?.find(t => t.locale === "vi") || r.translations?.[0];
    return t?.name || `${r.originCity} ⇌ ${r.destinationCity}`;
  };

  const getCategoryName = (catId: number) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return `ID: ${catId}`;
    return cat.translations?.find(t => t.locale === "vi")?.name || cat.code;
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalBackdrop />
      <ModalContainer>
        <ModalDialog className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl">
          <ModalHeader className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <Typography type="h3" className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-accent" />
                {getRouteName(route)}
              </Typography>
              <p className="text-xs text-slate-400 mt-1">
                {route.originCity} ➔ {route.destinationCity}
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="font-bold flex items-center gap-1.5"
              onClick={() => {
                onClose();
                onEditRoute();
              }}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Chỉnh sửa
            </Button>
          </ModalHeader>

          <ModalBody className="space-y-6 pt-4">
            {/* General Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Khoảng cách</span>
                <span className="text-sm font-black text-slate-700 dark:text-slate-200">
                  {route.distanceKm ? `${route.distanceKm} km` : "Chưa cập nhật"}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Thời gian dự kiến</span>
                <span className="text-sm font-black text-slate-700 dark:text-slate-200">
                  {route.estimatedHours ? `${route.estimatedHours} giờ` : "Chưa cập nhật"}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Khung giờ khởi hành</span>
                <span className="text-sm font-black text-slate-700 dark:text-slate-200 flex items-center gap-1">
                  {route.hasDepartureTimes ? (
                    <><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Có</>
                  ) : (
                    <><XCircle className="w-3.5 h-3.5 text-slate-400" /> Không</>
                  )}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Trạng thái</span>
                <span className="text-sm font-black flex items-center gap-1 mt-0.5">
                  <Chip size="sm" color={route.active ? "success" : "warning"} className="text-[10px] font-bold">
                    {route.active ? "Hoạt động" : "Tạm dừng"}
                  </Chip>
                </span>
              </div>
            </div>

            {/* Price Table Section */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
              <Typography type="h4" className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Bảng giá theo dòng xe (Per-KM)
              </Typography>

              {prices.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-400 italic">Chưa cấu hình giá cho dòng xe nào trên tuyến này.</p>
                </div>
              ) : (
                <Table className="w-full text-xs">
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
                          <Table.Row key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
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

            <div className="flex gap-2 justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button size="sm" variant="ghost" onClick={onClose}>Đóng</Button>
            </div>
          </ModalBody>
        </ModalDialog>
      </ModalContainer>
    </Modal>
  );
}
