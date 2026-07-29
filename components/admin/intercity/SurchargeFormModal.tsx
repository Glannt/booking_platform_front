"use client";

import React, { useState, useEffect } from "react";
import type { Key } from "@heroui/react";
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
  TextField,
  Typography,
  toast
} from "@heroui/react";
import type { IntercitySeasonalSurchargeDto, IntercityRouteDto } from "@/lib/api/rental";

interface SurchargeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSurcharge: IntercitySeasonalSurchargeDto | null;
  routes: IntercityRouteDto[];
  onSave: (payload: any) => Promise<void>;
}

export function SurchargeFormModal({
  isOpen,
  onClose,
  editingSurcharge,
  routes,
  onSave,
}: SurchargeFormModalProps) {
  const [form, setForm] = useState({
    seasonName: "",
    startDate: "",
    endDate: "",
    surchargePercent: "",
    routeIds: [] as Key[]
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingSurcharge) {
      setForm({
        seasonName: editingSurcharge.seasonName || "",
        startDate: editingSurcharge.startDate?.substring(0, 10) || "",
        endDate: editingSurcharge.endDate?.substring(0, 10) || "",
        surchargePercent: String(editingSurcharge.surchargePercent ?? ""),
        routeIds: (editingSurcharge.routeIds || []).map(String)
      });
    } else {
      setForm({
        seasonName: "",
        startDate: "",
        endDate: "",
        surchargePercent: "",
        routeIds: []
      });
    }
  }, [editingSurcharge, isOpen]);

  const getRouteName = (r: IntercityRouteDto) => {
    const t = r.translations?.find(tr => tr.locale === "vi") || r.translations?.[0];
    return t?.name || `${r.originCity} ⇌ ${r.destinationCity}`;
  };

  const handleSave = async () => {
    if (!form.seasonName.trim()) {
      toast.danger("Vui lòng nhập tên mùa phụ thu.");
      return;
    }
    if (!form.startDate || !form.endDate) {
      toast.danger("Vui lòng nhập ngày bắt đầu và ngày kết thúc.");
      return;
    }
    if (!form.surchargePercent.trim()) {
      toast.danger("Vui lòng nhập phần trăm phụ thu.");
      return;
    }

    const payload = {
      seasonName: form.seasonName,
      startDate: form.startDate,
      endDate: form.endDate,
      surchargePercent: Number(form.surchargePercent),
      routeIds: form.routeIds.map(Number),
      active: true
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
                {editingSurcharge ? "Chỉnh sửa phụ thu theo mùa" : "Thêm phụ thu theo mùa mới"}
              </Typography>
            </ModalHeader>

            <ModalBody className="gap-4 mt-4">
              <TextField className="w-full">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Tên mùa phụ thu</Label>
                <Input placeholder="Ví dụ: Tết Nguyên Đán, Mùa hè" value={form.seasonName} onChange={e => setForm(f => ({ ...f, seasonName: e.target.value }))} className="px-3 py-2 border rounded-xl text-sm w-full" />
              </TextField>

              <div className="grid grid-cols-2 gap-4 mt-5">
                <TextField className="w-full">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Ngày bắt đầu</Label>
                  <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="px-3 py-2 border rounded-xl text-sm w-full" />
                </TextField>

                <TextField className="w-full">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Ngày kết thúc</Label>
                  <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="px-3 py-2 border rounded-xl text-sm w-full" />
                </TextField>
              </div>

              <NumberField value={form.surchargePercent ? Number(form.surchargePercent) : 0} onChange={val => setForm(f => ({ ...f, surchargePercent: String(val || 0) }))} minValue={0} maxValue={100} className="w-full mt-5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Phụ thu (%)</Label>
                <NumberField.Group className="flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] overflow-hidden focus-within:ring-2 focus-within:ring-primary h-[40px]">
                  <NumberField.Input placeholder="Ví dụ: 10" className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full" />
                  <div className="flex h-full flex-col border-l border-slate-200 dark:border-slate-800">
                    <NumberField.IncrementButton className="flex h-1/2 w-6 items-center justify-center border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer bg-transparent text-xs">▲</NumberField.IncrementButton>
                    <NumberField.DecrementButton className="flex h-1/2 w-6 items-center justify-center border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer bg-transparent text-xs border-t border-slate-200 dark:border-slate-800">▼</NumberField.DecrementButton>
                  </div>
                </NumberField.Group>
              </NumberField>

              <div className="flex flex-col gap-1 w-full mt-5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Tuyến đường áp dụng</Label>
                <Select
                  fullWidth
                  selectionMode="multiple"
                  placeholder="Chọn tuyến đường áp dụng"
                  value={form.routeIds}
                  onChange={(keys) => { setForm(f => ({ ...f, routeIds: [...(keys || [])] as Key[] })); }}
                >
                  <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] text-sm h-[40px]">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                    <ListBox selectionMode="multiple">
                      {routes.map(r => (
                        <ListBox.Item key={r.id} id={String(r.id)} textValue={getRouteName(r)} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] text-slate-800 dark:text-slate-100 flex items-center justify-between">
                          {getRouteName(r)}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
                {form.routeIds.length > 0 && (
                  <p className="text-xs text-slate-400 mt-1">Đã chọn {form.routeIds.length} tuyến đường</p>
                )}
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
