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
  Input,
  Label,
  TextField,
  Checkbox,
  toast,
  Typography,
} from "@heroui/react";
import {
  createSharedOffice,
  updateSharedOffice,
  type SharedOfficeDto,
} from "@/lib/api/sharedRoute";
import { Building2, MapPin, RefreshCw, Save } from "lucide-react";

interface SharedOfficeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void | Promise<void>;
  editingOffice?: SharedOfficeDto | null;
}

export function SharedOfficeModal({
  isOpen,
  onClose,
  onSaveSuccess,
  editingOffice,
}: SharedOfficeModalProps) {
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    latitude: "",
    longitude: "",
    active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingOffice) {
      setForm({
        name: editingOffice.name || "",
        address: editingOffice.address || "",
        city: editingOffice.city || "",
        latitude: editingOffice.latitude != null ? String(editingOffice.latitude) : "",
        longitude: editingOffice.longitude != null ? String(editingOffice.longitude) : "",
        active: editingOffice.active ?? true,
      });
    } else {
      setForm({
        name: "",
        address: "",
        city: "",
        latitude: "",
        longitude: "",
        active: true,
      });
    }
  }, [editingOffice, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim() || !form.city.trim()) {
      toast.danger("Vui lòng nhập đầy đủ tên, địa chỉ và thành phố.");
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<SharedOfficeDto> = {
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        active: form.active,
      };

      if (editingOffice?.id) {
        await updateSharedOffice(editingOffice.id, payload);
        toast.success("Cập nhật văn phòng thành công!");
      } else {
        await createSharedOffice(payload);
        toast.success("Thêm mới văn phòng thành công!");
      }

      await onSaveSuccess?.();
      onClose();
    } catch {
      toast.danger("Có lỗi xảy ra khi lưu văn phòng.");
    } finally {
      setSaving(false);
    }
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
          <ModalDialog className="max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-accent/10 text-accent">
                  <Building2 size={20} />
                </div>
                <div>
                  <Typography type="h3" className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {editingOffice ? "Chỉnh sửa văn phòng đón/trả" : "Thêm mới văn phòng đón/trả"}
                  </Typography>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Văn phòng vật lý dùng cho điểm đón hoặc trả vé xe ghép
                  </p>
                </div>
              </div>
            </ModalHeader>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <ModalBody className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                <TextField isRequired className="w-full">
                  <Label className="text-xs font-bold uppercase tracking-wider mb-1 block">
                    Tên văn phòng
                  </Label>
                  <Input
                    placeholder="Ví dụ: VP Nha Trang - Trần Phú"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="px-3 py-2 border border-separator rounded-xl text-sm w-full bg-white dark:bg-[var(--bg-surface)]"
                  />
                </TextField>

                <TextField isRequired className="w-full">
                  <Label className="text-xs font-bold uppercase tracking-wider mb-1 block">
                    Thành phố / Tỉnh
                  </Label>
                  <Input
                    placeholder="Ví dụ: Nha Trang, Đà Lạt, Cam Ranh..."
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className="px-3 py-2 border border-separator rounded-xl text-sm w-full bg-white dark:bg-[var(--bg-surface)]"
                  />
                </TextField>

                <TextField isRequired className="w-full">
                  <Label className="text-xs font-bold uppercase tracking-wider mb-1 block">
                    Địa chỉ chi tiết
                  </Label>
                  <Input
                    placeholder="Ví dụ: 120 Trần Phú, Lộc Thọ, Nha Trang"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    className="px-3 py-2 border border-separator rounded-xl text-sm w-full bg-white dark:bg-[var(--bg-surface)]"
                  />
                </TextField>

                <div className="grid grid-cols-2 gap-3">
                  <TextField className="w-full">
                    <Label className="text-xs font-bold uppercase tracking-wider mb-1 block">
                      Vĩ độ (Latitude)
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="12.23879"
                      value={form.latitude}
                      onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                      className="px-3 py-2 border border-separator rounded-xl text-sm w-full bg-white dark:bg-[var(--bg-surface)]"
                    />
                  </TextField>

                  <TextField className="w-full">
                    <Label className="text-xs font-bold uppercase tracking-wider mb-1 block">
                      Kinh độ (Longitude)
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="109.19674"
                      value={form.longitude}
                      onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                      className="px-3 py-2 border border-separator rounded-xl text-sm w-full bg-white dark:bg-[var(--bg-surface)]"
                    />
                  </TextField>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Checkbox
                    id="office-active"
                    isSelected={form.active}
                    onChange={(val: boolean) => setForm((f) => ({ ...f, active: val }))}
                  >
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox.Content>
                  </Checkbox>
                  <Label htmlFor="office-active" className="text-sm font-extrabold cursor-pointer select-none">
                    Kích hoạt văn phòng
                  </Label>
                </div>
              </ModalBody>

              <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  isDisabled={saving}
                  className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  isDisabled={saving}
                  className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
                >
                  {saving ? (
                    <RefreshCw size={15} className="animate-spin mr-1.5" />
                  ) : (
                    <Save size={15} className="mr-1.5" />
                  )}
                  Lưu văn phòng
                </Button>
              </ModalFooter>
            </form>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}

export default SharedOfficeModal;
