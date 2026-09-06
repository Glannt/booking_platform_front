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
  Select,
  ListBox,
  Input,
  Label,
  TextField,
  NumberField,
  Checkbox,
  toast,
  Typography
} from "@heroui/react";
import type { IntercityRouteDto, IntercityRoutePriceDto } from "@/lib/api/rental";
import type { VehicleCategoryDto } from "@/lib/api/fleet";
import { roundToThousand } from "@/lib/pricing";

interface PriceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: Partial<IntercityRoutePriceDto>) => Promise<void>;
  routes: IntercityRouteDto[];
  categories: VehicleCategoryDto[];
  editingPrice?: IntercityRoutePriceDto | null;
  routeId?: number;
}

export function PriceFormModal({
  isOpen,
  onClose,
  onSave,
  routes,
  categories,
  editingPrice,
  routeId,
}: PriceFormModalProps) {
  const [form, setForm] = useState<{
    routeId: string;
    vehicleCategoryId: string;
    pricingType: "PER_KM" | "FIXED";
    perKmAmount: string;
    fixedPriceOneWay: string;
    fixedPriceRoundTrip: string;
    roundTripPrice: string;
    roundTripPerKmAmount: string;
    currency: string;
    active: boolean;
  }>({
    routeId: "",
    vehicleCategoryId: "",
    pricingType: "PER_KM",
    perKmAmount: "",
    fixedPriceOneWay: "",
    fixedPriceRoundTrip: "",
    roundTripPrice: "",
    roundTripPerKmAmount: "",
    currency: "VND",
    active: true,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingPrice) {
      setForm({
        routeId: String(editingPrice.routeId),
        vehicleCategoryId: String(editingPrice.vehicleCategoryId),
        pricingType: editingPrice.pricingType === "FIXED" ? "FIXED" : "PER_KM",
        perKmAmount: editingPrice.perKmAmount ? String(editingPrice.perKmAmount) : "",
        fixedPriceOneWay: editingPrice.fixedPriceOneWay ? String(editingPrice.fixedPriceOneWay) : "",
        fixedPriceRoundTrip: editingPrice.fixedPriceRoundTrip ? String(editingPrice.fixedPriceRoundTrip) : "",
        roundTripPrice: editingPrice.roundTripPrice ? String(editingPrice.roundTripPrice) : "",
        roundTripPerKmAmount: editingPrice.roundTripPerKmAmount ? String(editingPrice.roundTripPerKmAmount) : "",
        currency: editingPrice.currency || "VND",
        active: editingPrice.active,
      });
    } else {
      setForm({
        routeId: routeId ? String(routeId) : (routes[0] ? String(routes[0].id) : ""),
        vehicleCategoryId: categories[0] ? String(categories[0].id) : "",
        pricingType: "PER_KM",
        perKmAmount: "",
        fixedPriceOneWay: "",
        fixedPriceRoundTrip: "",
        roundTripPrice: "",
        roundTripPerKmAmount: "",
        currency: "VND",
        active: true,
      });
    }
  }, [editingPrice, routeId, routes, categories, isOpen]);

  const getRouteName = (r: IntercityRouteDto) => {
    const t = r.translations?.find(t => t.locale === "vi") || r.translations?.[0];
    return t?.name || `${r.originCity} ⇌ ${r.destinationCity}`;
  };

  const getCategoryName = (c: VehicleCategoryDto) => {
    const t = c.translations?.find(t => t.locale === "vi") || c.translations?.[0];
    return t?.name || c.code;
  };

  const handleSave = async () => {
    if (!form.routeId || !form.vehicleCategoryId) {
      toast.danger("Vui lòng chọn tuyến đường và dòng xe.");
      return;
    }

    if (form.pricingType === "FIXED" && !form.fixedPriceOneWay) {
      toast.danger("Vui lòng nhập giá trọn gói 1 chiều.");
      return;
    }

    if (form.pricingType === "PER_KM" && !form.perKmAmount) {
      toast.danger("Vui lòng nhập đơn giá / km.");
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<IntercityRoutePriceDto> = {
        routeId: Number(form.routeId),
        vehicleCategoryId: Number(form.vehicleCategoryId),
        pricingType: form.pricingType,
        perKmAmount: form.perKmAmount ? Number(form.perKmAmount) : 0,
        fixedPriceOneWay: form.fixedPriceOneWay ? Number(form.fixedPriceOneWay) : undefined,
        fixedPriceRoundTrip: form.fixedPriceRoundTrip ? Number(form.fixedPriceRoundTrip) : undefined,
        roundTripPrice: form.roundTripPrice ? Number(form.roundTripPrice) : undefined,
        roundTripPerKmAmount: form.roundTripPerKmAmount ? Number(form.roundTripPerKmAmount) : undefined,
        currency: form.currency || "VND",
        active: form.active,
      };

      await onSave(payload);
      onClose();
    } catch {
      toast.danger("Có lỗi xảy ra khi lưu cấu hình giá.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <Typography type="h3" className="text-base font-bold text-slate-800 dark:text-slate-100">
                {editingPrice ? "Chỉnh sửa giá xe riêng" : "Thêm cấu hình giá xe riêng"}
              </Typography>
            </ModalHeader>

            <ModalBody className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
              {/* Optional Route Selector */}
              {!routeId && routes.length > 0 && (
                <div className="flex flex-col gap-1 w-full">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Tuyến đường</Label>
                  <Select
                    isRequired
                    fullWidth
                    placeholder="Chọn tuyến đường"
                    selectedKey={form.routeId || undefined}
                    onSelectionChange={(key) => { if (key) setForm(f => ({ ...f, routeId: String(key) })); }}
                  >
                    <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] text-sm h-[40px] cursor-pointer">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                      <ListBox>
                        {routes.map(r => (
                          <ListBox.Item key={r.id} id={String(r.id)} textValue={getRouteName(r)} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] text-slate-800 dark:text-slate-100 flex items-center justify-between">
                            {getRouteName(r)}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>
              )}

              {/* Vehicle Category */}
              <div className="flex flex-col gap-1 w-full">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Dòng xe áp dụng</Label>
                <Select
                  fullWidth
                  isRequired
                  placeholder="Chọn dòng xe"
                  selectedKey={form.vehicleCategoryId || undefined}
                  onSelectionChange={(key) => { if (key) setForm(f => ({ ...f, vehicleCategoryId: String(key) })); }}
                >
                  <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] text-sm h-[40px] cursor-pointer">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                    <ListBox>
                      {categories.map(c => (
                        <ListBox.Item key={c.id} id={String(c.id)} textValue={getCategoryName(c)} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] text-slate-800 dark:text-slate-100 flex items-center justify-between">
                          {getCategoryName(c)}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>

              {/* Pricing Type Switcher */}
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Hình thức tính giá</Label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-[var(--bg-card)] rounded-xl">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, pricingType: "PER_KM" }))}
                    className={`py-2 px-3 rounded-lg text-xs font-black transition cursor-pointer border-none ${
                      form.pricingType === "PER_KM"
                        ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-white bg-transparent"
                    }`}
                  >
                    Tính theo số KM
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, pricingType: "FIXED" }))}
                    className={`py-2 px-3 rounded-lg text-xs font-black transition cursor-pointer border-none ${
                      form.pricingType === "FIXED"
                        ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-white bg-transparent"
                    }`}
                  >
                    Giá trọn gói cố định
                  </button>
                </div>
              </div>

              {/* Fields for FIXED Pricing */}
              {form.pricingType === "FIXED" ? (
                <div className="space-y-3 p-3 bg-slate-50 dark:bg-[var(--bg-card)] rounded-xl border border-slate-100 dark:border-slate-800">
                  <TextField className="w-full">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                      Giá cố định 1 chiều (VND) *
                    </Label>
                    <Input
                      type="number"
                      placeholder="Ví dụ: 1200000"
                      value={form.fixedPriceOneWay}
                      onChange={e => setForm(f => ({ ...f, fixedPriceOneWay: e.target.value }))}
                      className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm w-full bg-white dark:bg-[var(--bg-surface)]"
                    />
                  </TextField>

                  <TextField className="w-full">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                      Giá cố định khứ hồi (VND) (Tùy chọn)
                    </Label>
                    <Input
                      type="number"
                      placeholder="Mặc định = 2 × giá 1 chiều nếu để trống"
                      value={form.fixedPriceRoundTrip}
                      onChange={e => setForm(f => ({ ...f, fixedPriceRoundTrip: e.target.value }))}
                      className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm w-full bg-white dark:bg-[var(--bg-surface)]"
                    />
                  </TextField>
                </div>
              ) : (
                /* Fields for PER_KM Pricing */
                <div className="space-y-3 p-3 bg-slate-50 dark:bg-[var(--bg-card)] rounded-xl border border-slate-100 dark:border-slate-800">
                  <NumberField
                    value={form.perKmAmount ? Number(form.perKmAmount) : 0}
                    onChange={val => setForm(f => ({ ...f, perKmAmount: String(val || 0) }))}
                    minValue={0}
                    className="w-full"
                  >
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                      Đơn giá / km (VND) *
                    </Label>
                    <NumberField.Group className="flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] overflow-hidden focus-within:ring-2 focus-within:ring-primary h-[40px]">
                      <NumberField.Input placeholder="Ví dụ: 10000" className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full" />
                      <div className="flex h-full flex-col border-l border-slate-200 dark:border-slate-800">
                        <NumberField.IncrementButton className="flex h-1/2 w-6 items-center justify-center border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer bg-transparent text-xs">▲</NumberField.IncrementButton>
                        <NumberField.DecrementButton className="flex h-1/2 w-6 items-center justify-center border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer bg-transparent text-xs border-t border-slate-200 dark:border-slate-800">▼</NumberField.DecrementButton>
                      </div>
                    </NumberField.Group>
                  </NumberField>

                  {(() => {
                    const routeObj = routes.find(r => r.id === (routeId || Number(form.routeId)));
                    const perKm = Number(form.perKmAmount || 0);
                    if (!routeObj?.distanceKm || !perKm) return null;
                    const oneWay = roundToThousand(perKm * routeObj.distanceKm);
                    return (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-white dark:bg-[var(--bg-surface)] rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-800">
                        {`${routeObj.distanceKm} km × ${perKm.toLocaleString()} = ${oneWay.toLocaleString()} VND (1 chiều)`}
                      </div>
                    );
                  })()}

                  <TextField className="w-full">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                      Giá trọn gói khứ hồi ghi đè (VND) (Tùy chọn)
                    </Label>
                    <Input
                      type="number"
                      placeholder="Ghi đè giá khứ hồi cố định thay vì nhân đôi"
                      value={form.roundTripPrice}
                      onChange={e => setForm(f => ({ ...f, roundTripPrice: e.target.value }))}
                      className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm w-full bg-white dark:bg-[var(--bg-surface)]"
                    />
                  </TextField>

                  <TextField className="w-full">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                      Đơn giá / km khi đi khứ hồi (VND) (Tùy chọn)
                    </Label>
                    <Input
                      type="number"
                      placeholder="Ví dụ: 8000 VND / km nếu giảm chiều về"
                      value={form.roundTripPerKmAmount}
                      onChange={e => setForm(f => ({ ...f, roundTripPerKmAmount: e.target.value }))}
                      className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm w-full bg-white dark:bg-[var(--bg-surface)]"
                    />
                  </TextField>
                </div>
              )}

              {/* Currency */}
              <TextField className="w-full">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Tiền tệ</Label>
                <Input
                  placeholder="VND"
                  value={form.currency}
                  onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm w-full bg-white dark:bg-[var(--bg-surface)]"
                />
              </TextField>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 my-2">
                <Checkbox
                  id="price-active"
                  isSelected={form.active}
                  onChange={(val: boolean) => setForm(f => ({ ...f, active: val }))}
                  render={(props) => <div {...props} data-custom="bar" />}
                >
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                  </Checkbox.Content>
                </Checkbox>
                <Label htmlFor="price-active" className="text-sm font-extrabold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  Kích hoạt bảng giá
                </Label>
              </div>
            </ModalBody>

            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0 bg-white dark:bg-[var(--bg-surface)]">
              <Button size="sm" variant="ghost" onClick={onClose} isDisabled={saving} className="rounded-xl font-bold cursor-pointer">
                Hủy
              </Button>
              <Button size="sm" onClick={handleSave} isDisabled={saving} className="bg-accent text-white font-bold rounded-xl cursor-pointer">
                Lưu
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
