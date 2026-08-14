"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  Button,
  Input,
  Label,
  Select,
  ListBox,
  NumberField,
  Checkbox,
  TextField,
  Typography,
  toast
} from "@heroui/react";
import type { IntercityRoutePriceDto, IntercityRouteDto } from "@/lib/api/rental";
import { getIntercityRoutePrices } from "@/lib/api/rental";
import type { VehicleCategoryDto } from "@/lib/api/fleet";

interface PriceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeId?: number;
  editingPrice: IntercityRoutePriceDto | null;
  categories: VehicleCategoryDto[];
  routes?: IntercityRouteDto[];
  onSave: (payload: any) => Promise<void>;
}

export function PriceFormModal({
  isOpen,
  onClose,
  routeId,
  editingPrice,
  categories,
  routes = [],
  onSave,
}: PriceFormModalProps) {
  const [form, setForm] = useState({
    routeId: "",
    vehicleCategoryId: "",
    perKmAmount: "",
    currency: "VND",
    active: true
  });

  const [saving, setSaving] = useState(false);
  const [existingPrices, setExistingPrices] = useState<IntercityRoutePriceDto[]>([]);

  useEffect(() => {
    const activeRouteId = routeId || Number(form.routeId);
    if (!activeRouteId || !isOpen) {
      setExistingPrices([]);
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await getIntercityRoutePrices(activeRouteId);
        if (active && res.data) {
          setExistingPrices(Array.isArray(res.data) ? res.data : []);
        }
      } catch {
        setExistingPrices([]);
      }
    })();
    return () => { active = false; };
  }, [routeId, form.routeId, isOpen]);

  useEffect(() => {
    if (editingPrice) {
      setForm({
        routeId: String(editingPrice.routeId ?? ""),
        vehicleCategoryId: String(editingPrice.vehicleCategoryId),
        perKmAmount: String(editingPrice.perKmAmount),
        currency: editingPrice.currency || "VND",
        active: editingPrice.active ?? true
      });
    } else {
      setForm({
        routeId: routeId ? String(routeId) : "",
        vehicleCategoryId: "",
        perKmAmount: "",
        currency: "VND",
        active: true
      });
    }
  }, [editingPrice, routeId, isOpen]);

  const getCategoryName = (c: VehicleCategoryDto) => {
    const t = c.translations?.find(tr => tr.locale === "vi") || c.translations?.[0];
    return t?.name || c.code;
  };

  const getRouteName = (r: IntercityRouteDto) => {
    const t = r.translations?.find((tr: any) => tr.locale === "vi") || r.translations?.[0];
    return t?.name || `${r.originCity} ⇌ ${r.destinationCity}`;
  };

  const handleSave = async () => {
    const finalRouteId = routeId || Number(form.routeId);
    if (!finalRouteId) {
      toast.danger("Vui lòng chọn tuyến đường.");
      return;
    }
    if (!form.vehicleCategoryId) {
      toast.danger("Vui lòng chọn dòng xe.");
      return;
    }
    if (!form.perKmAmount.trim()) {
      toast.danger("Vui lòng nhập giá theo km.");
      return;
    }

    // Check unique constraint: routeId + vehicleCategoryId
    if (!editingPrice) {
      const alreadyExists = existingPrices.some(
        p => p.vehicleCategoryId === Number(form.vehicleCategoryId) && p.routeId === finalRouteId
      );
      if (alreadyExists) {
        toast.danger("Dòng xe này đã được cấu hình giá cho tuyến đường này. Vui lòng chỉnh sửa thay vì tạo mới.");
        return;
      }
    }

    const payload = {
      routeId: finalRouteId,
      vehicleCategoryId: Number(form.vehicleCategoryId),
      perKmAmount: Number(form.perKmAmount),
      currency: form.currency,
      active: form.active
    };

    setSaving(true);
    try {
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-md bg-white dark:bg-[var(--bg-surface)] p-6 rounded-2xl shadow-2xl">
            <ModalHeader className="flex items-center justify-between p-0 pb-4 border-b border-slate-100 dark:border-slate-800">
              <Typography type="h3" className="text-base font-bold text-slate-800 dark:text-slate-100">
                {editingPrice ? "Chỉnh sửa giá dịch vụ" : "Thêm giá dịch vụ mới"}
              </Typography>
            </ModalHeader>

            <ModalBody className="gap-4 mt-4">
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
                    <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] text-sm h-[40px]">
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

              <div className="flex flex-col gap-1 w-full mt-5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Dòng xe</Label>
                <Select
                  fullWidth
                  isRequired
                  placeholder="Chọn dòng xe"
                  selectedKey={form.vehicleCategoryId || undefined}
                  onSelectionChange={(key) => { if (key) setForm(f => ({ ...f, vehicleCategoryId: String(key) })); }}
                >
                  <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] text-sm h-[40px]">
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

              <NumberField value={form.perKmAmount ? Number(form.perKmAmount) : 0} onChange={val => setForm(f => ({ ...f, perKmAmount: String(val || 0) }))} minValue={0} className="w-full mt-5">
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
                    {`${routeObj.distanceKm} km × ${perKm.toLocaleString()} = ${Math.round(oneWay / 1000) * 1000}`}
                  </div>
                );
              })()}

              <TextField className="w-full mt-5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Tiền tệ</Label>
                <Input placeholder="VND" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="px-3 py-2 border rounded-xl text-sm w-full" />
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

              <div className="flex gap-2 justify-end border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                <Button size="sm" onClick={handleSave} isDisabled={saving}>Lưu</Button>
                <Button size="sm" variant="ghost" onClick={onClose} isDisabled={saving}>Hủy</Button>
              </div>
            </ModalBody>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
