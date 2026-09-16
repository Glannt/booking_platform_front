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
  Checkbox,
  Label,
  Select,
  ListBox,
  NumberField
} from "@heroui/react";
import { Save, RefreshCw, Pencil, Edit3, Info } from "lucide-react";

import {
  createAirportTransfer,
  updateAirportTransfer,
  AirportTransferPrice,
  AirportRouteDto,
  VehicleCategoryDto
} from "@/lib/api/fleet";
import { calcAirportPrice } from "@/lib/pricing";

interface AirportTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  transfer: AirportTransferPrice | null;
  routes: AirportRouteDto[];
  categories: VehicleCategoryDto[];
  onSaveSuccess: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
  defaultEditMode?: boolean;
}

export default function AirportTransferModal({
  isOpen,
  onClose,
  transfer,
  routes,
  categories,
  onSaveSuccess,
  showToast,
  defaultEditMode
}: AirportTransferModalProps) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"view" | "edit" | "create">("create");

  const [airportRouteId, setAirportRouteId] = useState<number>(0);
  const [vehicleCategoryId, setVehicleCategoryId] = useState<number>(0);
  const [baseKm, setBaseKm] = useState<number>(35);
  const [zoneBufferKm, setZoneBufferKm] = useState<number>(2.0);
  const [baseAmount, setBaseAmount] = useState<number>(0);
  const [perKmAmount, setPerKmAmount] = useState<number>(0);
  const [fixedOvercharge, setFixedOvercharge] = useState<boolean>(false);
  const [feeOverchargeFixed, setFeeOverchargeFixed] = useState<number>(100000);
  const [currency, setCurrency] = useState("VND");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (transfer) {
        setMode(defaultEditMode ? "edit" : "view");
        setAirportRouteId(transfer.airportRouteId);
        setVehicleCategoryId(transfer.vehicleCategoryId);
        setBaseKm(transfer.baseKm ?? 35);
        setZoneBufferKm(transfer.zoneBufferKm ?? 2.0);
        setBaseAmount(transfer.baseAmount ?? 0);
        setPerKmAmount(transfer.perKmAmount ?? 0);
        setFixedOvercharge(transfer.fixedOvercharge ?? false);
        setFeeOverchargeFixed(transfer.feeOverchargeFixed ?? 100000);
        setCurrency(transfer.currency || "VND");
        setActive(transfer.active);
      } else {
        setMode("create");
        setAirportRouteId(routes[0]?.id || 0);
        setVehicleCategoryId(categories[0]?.id || 0);
        setBaseKm(35);
        setZoneBufferKm(2.0);
        setBaseAmount(0);
        setPerKmAmount(0);
        setFixedOvercharge(false);
        setFeeOverchargeFixed(100000);
        setCurrency("VND");
        setActive(true);
      }
    }
  }, [isOpen, transfer, routes, categories, defaultEditMode]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!airportRouteId || !vehicleCategoryId) {
      showToast("Vui lòng chọn đầy đủ tuyến đường và loại xe!", "error");
      return;
    }

    const payload: AirportTransferPrice = {
      airportRouteId,
      vehicleCategoryId,
      baseKm,
      zoneBufferKm,
      baseAmount,
      perKmAmount,
      fixedOvercharge,
      feeOverchargeFixed: fixedOvercharge ? feeOverchargeFixed : undefined,
      currency,
      active
    };

    setLoading(true);
    try {
      if (transfer?.id) {
        await updateAirportTransfer(transfer.id, payload);
      } else {
        await createAirportTransfer(payload);
      }

      showToast("Lưu cấu hình giá thành công!", "success");
      onSaveSuccess();
      onClose();
    } catch (err) {
      showToast("Lưu cấu hình thất bại!", "error");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (vcId: number) => {
    const vc = categories.find(c => c.id === vcId);
    if (!vc) return "Chưa phân loại";
    const trans = vc.translations?.find(t => t.locale === "vi") || vc.translations?.[0];
    return trans?.name || vc.code;
  };

  const getRouteName = (rId: number) => {
    const r = routes.find(routeObj => routeObj.id === rId);
    return r?.code || `#${rId}`;
  };

  const maxZoneKm = baseKm + zoneBufferKm;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-xl max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-border-secondary overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-separator flex items-center justify-between flex-shrink-0">
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                {mode === "create" && "Thêm Cấu Hình Giá Sân Bay Mới"}
                {mode === "edit" && "Chỉnh Sửa Cấu Hình Giá Sân Bay"}
                {mode === "view" && "Chi Tiết Cấu Hình Giá Sân Bay"}
              </h3>
            </ModalHeader>

            {mode === "view" ? (
              <>
                <ModalBody className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider">{"Tuyến Đường"}</Label>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{getRouteName(airportRouteId)}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider">{"Loại Xe"}</Label>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{getCategoryName(vehicleCategoryId)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider">{"Km Cơ Bản"}</Label>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{baseKm} km</p>
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider">{"Vùng Đệm Zone (Km)"}</Label>
                      <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        +{zoneBufferKm} km (Áp dụng giá gốc đến {maxZoneKm.toFixed(1)} km)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider">{"Giá Trong Km Cơ Bản"}</Label>
                      <p className="mt-1 text-sm font-bold text-primary">
                        {baseAmount.toLocaleString()} {currency}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider">
                        {fixedOvercharge ? "Mức Phí Cố Định" : "Đơn Giá Mỗi Km Thêm"}
                      </Label>
                      <p className="mt-1 text-sm font-bold text-amber-500">
                        {fixedOvercharge
                          ? `${feeOverchargeFixed.toLocaleString()} ${currency}`
                          : `${perKmAmount.toLocaleString()} ${currency}/km`}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider">{"Trạng Thái"}</Label>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{active ? "Kích hoạt" : "Ngừng hoạt động"}</p>
                  </div>

                  {/* Live Zone Preview */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-border space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                      <Info size={14} className="text-primary" />
                      <span>Xem trước tính giá theo Vùng đệm Zone:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      {(() => {
                        const inBase = calcAirportPrice({ baseKm, zoneBufferKm, baseAmount, perKmAmount, fixedOvercharge, feeOverchargeFixed }, baseKm);
                        const inZone = calcAirportPrice({ baseKm, zoneBufferKm, baseAmount, perKmAmount, fixedOvercharge, feeOverchargeFixed }, baseKm + zoneBufferKm * 0.7);
                        const overZone = calcAirportPrice({ baseKm, zoneBufferKm, baseAmount, perKmAmount, fixedOvercharge, feeOverchargeFixed }, maxZoneKm + 4);
                        return (
                          <>
                            <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-border">
                              <span className="text-slate-500 dark:text-slate-400 block">{baseKm} km (Cơ bản)</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{inBase.oneWay.toLocaleString()} ₫</span>
                            </div>
                            <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-border">
                              <span className="text-slate-500 dark:text-slate-400 block">{(baseKm + zoneBufferKm * 0.7).toFixed(1)} km (Trong Zone)</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{inZone.oneWay.toLocaleString()} ₫ (Giá gốc)</span>
                            </div>
                            <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-border">
                              <span className="text-slate-500 dark:text-slate-400 block">{(maxZoneKm + 4).toFixed(1)} km (Vượt Zone)</span>
                              <span className="font-bold text-amber-600 dark:text-amber-400">{overZone.oneWay.toLocaleString()} ₫</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </ModalBody>

                <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
                  <Button
                    variant="outline"
                    className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    onClick={onClose}
                  >
                    {"Đóng"}
                  </Button>
                  <Button
                    type="button"
                    className="rounded-xl font-bold text-xs h-10 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/50 shadow-xs cursor-pointer transition-colors"
                    onPress={() => setMode("edit")}
                  >
                    <Edit3 size={15} className="mr-1.5" />
                    {"Chỉnh sửa"}
                  </Button>
                </ModalFooter>
              </>
            ) : (
              <form onSubmit={handleSave}>
                <ModalBody className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                  <div>
                    <Select
                      isRequired
                      fullWidth
                      name="airportRouteId"
                      selectedKey={String(airportRouteId)}
                      onSelectionChange={(key) => { if (key) setAirportRouteId(Number(key)); }}
                    >
                      <Label className="block text-xs font-bold mb-1">
                        {"Tuyến Đường"}
                      </Label>
                      <Select.Trigger className="w-full px-3 py-2 rounded-xl border-1 border-separator bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-slate-100 text-sm font-bold flex items-center justify-between cursor-pointer h-[40px]">
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-border-secondary rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                        <ListBox>
                          {routes.map((r) => (
                            <ListBox.Item
                              key={r.id}
                              id={String(r.id)}
                              textValue={r.code}
                              className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] text-slate-800 dark:text-slate-100 flex items-center justify-between"
                            >
                              {r.code}
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>

                  <div>
                    <Select
                      isRequired
                      fullWidth
                      name="vehicleCategoryId"
                      selectedKey={String(vehicleCategoryId)}
                      onSelectionChange={(key) => { if (key) setVehicleCategoryId(Number(key)); }}
                    >
                      <Label className="block text-xs font-bold mb-1">
                        {"Loại Xe"}
                      </Label>
                      <Select.Trigger className="w-full px-3 py-2 rounded-xl border-1 border-separator bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-slate-100 text-sm font-bold flex items-center justify-between cursor-pointer h-[40px]">
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-border-secondary rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                        <ListBox>
                          {categories.map((c) => {
                            const tr = c.translations?.find((t) => t.locale === "vi") || c.translations?.[0];
                            const catName = tr?.name || c.code;
                            return (
                              <ListBox.Item
                                key={c.id}
                                id={String(c.id)}
                                textValue={catName}
                                className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] text-slate-800 dark:text-slate-100 flex items-center justify-between"
                              >
                                {catName}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            );
                          })}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <NumberField
                        className="w-full"
                        value={baseKm}
                        onChange={(val) => setBaseKm(val || 0)}
                        minValue={0}
                      >
                        <Label className="block text-xs font-bold mb-1">
                          {"Km Cơ Bản"}
                        </Label>
                        <NumberField.Group className="flex items-center w-full rounded-xl border-1 border-separator bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-slate-100 overflow-hidden h-[40px]">
                          <NumberField.Input className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full font-bold" />
                          <div className="flex h-full flex-col border-l border-border">
                            <NumberField.IncrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer bg-transparent">
                              ▲
                            </NumberField.IncrementButton>
                            <NumberField.DecrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer bg-transparent border-t border-border">
                              ▼
                            </NumberField.DecrementButton>
                          </div>
                        </NumberField.Group>
                      </NumberField>
                    </div>

                    <div>
                      <NumberField
                        className="w-full"
                        value={zoneBufferKm}
                        onChange={(val) => setZoneBufferKm(val ?? 0)}
                        minValue={0}
                        step={0.5}
                      >
                        <Label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                          {"Vùng Đệm Zone (Km)"}
                        </Label>
                        <NumberField.Group className="flex items-center w-full rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/40 dark:bg-emerald-950/20 text-slate-800 dark:text-slate-100 overflow-hidden h-[40px]">
                          <NumberField.Input className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full font-bold text-emerald-700 dark:text-emerald-300" />
                          <div className="flex h-full flex-col border-l border-emerald-200 dark:border-emerald-800">
                            <NumberField.IncrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 text-emerald-600 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 cursor-pointer bg-transparent">
                              ▲
                            </NumberField.IncrementButton>
                            <NumberField.DecrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 text-emerald-600 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 cursor-pointer bg-transparent border-t border-emerald-200 dark:border-emerald-800">
                              ▼
                            </NumberField.DecrementButton>
                          </div>
                        </NumberField.Group>
                      </NumberField>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-2">
                    Dung sai bán kính: Khoảng cách từ 0 đến <strong className="text-emerald-600 dark:text-emerald-400">{maxZoneKm.toFixed(1)} km</strong> sẽ áp dụng giá gốc, không bị đôn giá km phát sinh.
                  </p>

                  <div>
                    <NumberField
                      className="w-full"
                      value={baseAmount}
                      onChange={(val) => setBaseAmount(val || 0)}
                      minValue={0}
                    >
                      <Label className="block text-xs font-bold mb-1">
                        {"Giá Trong Km Cơ Bản"} ({currency})
                      </Label>
                      <NumberField.Group className="flex items-center w-full rounded-xl border-1 border-separator bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-slate-100 overflow-hidden h-[40px]">
                        <NumberField.Input className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full font-bold" />
                        <div className="flex h-full flex-col border-l border-border">
                          <NumberField.IncrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer bg-transparent">
                            ▲
                          </NumberField.IncrementButton>
                          <NumberField.DecrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer bg-transparent border-t border-border">
                            ▼
                          </NumberField.DecrementButton>
                        </div>
                      </NumberField.Group>
                    </NumberField>
                  </div>

                  <div className="flex items-center gap-3 py-1">
                    <Checkbox
                      id="transfer-fixed-overcharge"
                      isSelected={fixedOvercharge}
                      onChange={(val: boolean) => setFixedOvercharge(val)}
                    >
                      <Checkbox.Content>
                        <Checkbox.Control className="border-1 border-separator rounded-full">
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                      </Checkbox.Content>
                    </Checkbox>
                    <Label htmlFor="transfer-fixed-overcharge" className="text-xs sm:text-sm font-bold cursor-pointer select-none">
                      {"Sử dụng phí phụ trội cố định khi vượt zone"}
                    </Label>
                  </div>

                  {fixedOvercharge ? (
                    <div>
                      <NumberField
                        className="w-full"
                        value={feeOverchargeFixed}
                        onChange={(val) => setFeeOverchargeFixed(val || 0)}
                        minValue={0}
                      >
                        <Label className="block text-xs font-bold mb-1">
                          {"Phí Phụ Trội Cố Định (khi vượt Zone)"} ({currency})
                        </Label>
                        <NumberField.Group className="flex items-center w-full rounded-xl border-1 border-separator bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-slate-100 overflow-hidden h-[40px]">
                          <NumberField.Input className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full font-bold" />
                          <div className="flex h-full flex-col border-l border-border">
                            <NumberField.IncrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer bg-transparent">
                              ▲
                            </NumberField.IncrementButton>
                            <NumberField.DecrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer bg-transparent border-t border-border">
                              ▼
                            </NumberField.DecrementButton>
                          </div>
                        </NumberField.Group>
                      </NumberField>
                    </div>
                  ) : (
                    <div>
                      <NumberField
                        className="w-full"
                        value={perKmAmount}
                        onChange={(val) => setPerKmAmount(val || 0)}
                        minValue={0}
                      >
                        <Label className="block text-xs font-bold mb-1">
                          {"Giá Mỗi Km Thêm (khi vượt Zone)"} ({currency})
                        </Label>
                        <NumberField.Group className="flex items-center w-full rounded-xl border-1 border-separator bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-slate-100 overflow-hidden h-[40px]">
                          <NumberField.Input className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full font-bold" />
                          <div className="flex h-full flex-col border-l border-border">
                            <NumberField.IncrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer bg-transparent">
                              ▲
                            </NumberField.IncrementButton>
                            <NumberField.DecrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer bg-transparent border-t border-border">
                              ▼
                            </NumberField.DecrementButton>
                          </div>
                        </NumberField.Group>
                      </NumberField>
                    </div>
                  )}

                  {/* Live Calculation Preview */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-border space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                      <Info size={14} className="text-primary" />
                      <span>Xem trước tính giá tức thì theo các mốc Km:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      {(() => {
                        const inBase = calcAirportPrice({ baseKm, zoneBufferKm, baseAmount, perKmAmount, fixedOvercharge, feeOverchargeFixed }, baseKm);
                        const inZone = calcAirportPrice({ baseKm, zoneBufferKm, baseAmount, perKmAmount, fixedOvercharge, feeOverchargeFixed }, baseKm + zoneBufferKm * 0.7);
                        const overZone = calcAirportPrice({ baseKm, zoneBufferKm, baseAmount, perKmAmount, fixedOvercharge, feeOverchargeFixed }, maxZoneKm + 4);
                        return (
                          <>
                            <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-border">
                              <span className="text-slate-500 dark:text-slate-400 block">{baseKm} km (Cơ bản)</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{inBase.oneWay.toLocaleString()} ₫</span>
                            </div>
                            <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-border">
                              <span className="text-slate-500 dark:text-slate-400 block">{(baseKm + zoneBufferKm * 0.7).toFixed(1)} km (Trong Zone)</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{inZone.oneWay.toLocaleString()} ₫</span>
                            </div>
                            <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-border">
                              <span className="text-slate-500 dark:text-slate-400 block">{(maxZoneKm + 4).toFixed(1)} km (Vượt Zone)</span>
                              <span className="font-bold text-amber-600 dark:text-amber-400">{overZone.oneWay.toLocaleString()} ₫</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 py-1">
                    <Checkbox
                      id="transfer-active"
                      isSelected={active}
                      onChange={(val: boolean) => setActive(val)}
                    >
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                      </Checkbox.Content>
                    </Checkbox>
                    <Label htmlFor="transfer-active" className="text-xs sm:text-sm font-bold cursor-pointer select-none">
                      {"Kích hoạt cấu hình giá này"}
                    </Label>
                  </div>
                </ModalBody>

                <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
                  <Button
                    variant="outline"
                    className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    onClick={onClose}
                    isDisabled={loading}
                  >
                    {"Hủy"}
                  </Button>
                  <Button
                    type="submit"
                    isDisabled={loading}
                    className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
                  >
                    {loading ? (
                      <RefreshCw size={15} className="animate-spin mr-1.5" />
                    ) : (
                      <Save size={15} className="mr-1.5" />
                    )}
                    {mode === "create" ? "Tạo cấu hình giá" : "Lưu thay đổi"}
                  </Button>
                </ModalFooter>
              </form>
            )}
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
