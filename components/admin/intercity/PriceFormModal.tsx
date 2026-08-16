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

interface PriceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: Partial<IntercityRoutePriceDto>) => Promise<void>;
  routes: IntercityRouteDto[];
  categories: VehicleCategoryDto[];
  editingPrice?: IntercityRoutePriceDto | null;
  routeId?: number; // Pre-filled if opened from a specific route
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
    perKmAmount: string;
    currency: string;
    active: boolean;
  }>({
    routeId: "",
    vehicleCategoryId: "",
    perKmAmount: "",
    currency: "VND",
    active: true,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingPrice) {
      setForm({
        routeId: String(editingPrice.routeId),
        vehicleCategoryId: String(editingPrice.vehicleCategoryId),
        perKmAmount: String(editingPrice.perKmAmount),
        currency: editingPrice.currency || "VND",
        active: editingPrice.active,
      });
    } else {
      setForm({
        routeId: routeId ? String(routeId) : (routes[0] ? String(routes[0].id) : ""),
        vehicleCategoryId: categories[0] ? String(categories[0].id) : "",
        perKmAmount: "",
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
    if (!form.routeId || !form.vehicleCategoryId || !form.perKmAmount) {
      toast.danger("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<IntercityRoutePriceDto> = {
        routeId: Number(form.routeId),
        vehicleCategoryId: Number(form.vehicleCategoryId),
        perKmAmount: Number(form.perKmAmount),
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
          <ModalDialog className="max-w-md max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <Typography type="h3" className="text-base font-bold text-slate-800 dark:text-slate-100">
                {editingPrice ? "Chỉnh sửa giá dịch vụ" : "Thêm giá dịch vụ mới"}
              </Typography>
            </ModalHeader>

            <ModalBody className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
              {/* Optional Route Selector (Only if routeId is not pre-defined) */}
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
                    <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
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

              <div className="flex flex-col gap-1 w-full">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Dòng xe</Label>
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
                  <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
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

              <NumberField value={form.perKmAmount ? Number(form.perKmAmount) : 0} onChange={val => setForm(f => ({ ...f, perKmAmount: String(val || 0) }))} minValue={0} className="w-full">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Giá / km (VND)</Label>
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
                const oneWay = perKm * routeObj.distanceKm;
                return (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[var(--bg-card)] rounded-xl px-3 py-2">
                    {`${routeObj.distanceKm} km × ${perKm.toLocaleString()} = ${Math.round(oneWay / 1000) * 1000} VND`}
                  </div>
                );
              })()}

              <TextField className="w-full">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Tiền tệ</Label>
                <Input placeholder="VND" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm w-full bg-white dark:bg-[var(--bg-surface)]" />
              </TextField>

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
