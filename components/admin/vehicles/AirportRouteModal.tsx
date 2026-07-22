"use client";

import React, { useState, useEffect } from "react";
import {
  Modal, ModalBackdrop, ModalContainer, ModalDialog, ModalHeader,
  ModalBody, ModalFooter, Button, Checkbox, Label, TextField, Input,
  Select, ListBox
} from "@heroui/react";
import { Save, RefreshCw } from "lucide-react";

import { createAirportRoute, updateAirportRoute, AirportRouteDto, AirportDto } from "@/lib/api/fleet";

interface AirportRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: AirportRouteDto | null;
  airports: AirportDto[];
  onSaveSuccess: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
}

export default function AirportRouteModal({ isOpen, onClose, route, airports, onSaveSuccess, showToast }: AirportRouteModalProps) {
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [airportId, setAirportId] = useState<number | undefined>(undefined);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (route) {
        setCode(route.code || "");
        setAirportId(route.airportId);
        setActive(route.active ?? true);
      } else {
        setCode("");
        setAirportId(undefined);
        setActive(true);
      }
    }
  }, [isOpen, route]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!code.trim() || !airportId) {
      showToast("Vui lòng điền mã tuyến và chọn sân bay!", "error");
      return;
    }
    const payload: AirportRouteDto = { code: code.trim(), airportId, active };
    setLoading(true);
    try {
      if (route?.id) {
        await updateAirportRoute(route.id, payload);
        showToast("Cập nhật tuyến đường thành công!", "success");
      } else {
        await createAirportRoute(payload);
        showToast("Tạo tuyến đường mới thành công!", "success");
      }
      onSaveSuccess();
      onClose();
    } catch {
      showToast("Lưu thông tin thất bại!", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="airport-route-title">
      <ModalBackdrop className="bg-slate-950/40 backdrop-blur-sm">
        <ModalContainer size="md">
          <ModalDialog className="bg-white dark:bg-black rounded-3xl border border-divider shadow-2xl overflow-hidden animate-scale-up w-full max-w-md relative">
            <Button isIconOnly variant="ghost" onClick={onClose} className="absolute top-4 right-4 z-50 rounded-xl text-slate-400 hover:text-slate-750 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border-none">✕</Button>
            <ModalHeader className="px-6 py-4 border-b border-divider bg-slate-50 dark:bg-black/40">
              <h2 id="airport-route-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
                {route ? "Chi Tiết Tuyến Đường" : "Tạo Tuyến Đường Mới"}
              </h2>
            </ModalHeader>
            <form onSubmit={handleSave}>
              <ModalBody className="p-6 space-y-4">
                <TextField isRequired className="w-full">
                  <Label className="text-xs font-bold uppercase tracking-wider">
                    {"Mã Tuyến Đường"}
                  </Label>
                  <Input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. CXR-NT-CENTER" className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800" />
                </TextField>
                <div>
                  <Label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">
                    {"Sân Bay *"}
                  </Label>
                  <Select
                    fullWidth
                    isRequired
                    selectedKey={airportId ? String(airportId) : undefined}
                    onSelectionChange={(key) => { if (key) setAirportId(Number(key)); }}
                  >
                    <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-55 dark:bg-black text-slate-805 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium cursor-pointer h-[40px]">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                      <ListBox>
                        {airports.map((a) => (
                          <ListBox.Item key={a.id} id={String(a.id)} textValue={`${a.name} (${a.code})`} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-between">
                            {a.name} ({a.code})
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>
                <div className="flex items-center gap-3 py-2">
                  <Checkbox isSelected={active} onChange={(val: boolean) => setActive(val)}>
                    <Checkbox.Content><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control></Checkbox.Content>
                  </Checkbox>
                  <Label className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    {"Kích hoạt"}
                  </Label>
                </div>
              </ModalBody>
              <ModalFooter className="px-6 py-4 border-t border-divider bg-slate-50 dark:bg-black/40 flex items-center justify-end gap-3">
                <Button variant="outline" className="rounded-xl font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-none" onClick={onClose} isDisabled={loading}>
                  {"Hủy"}
                </Button>
                <Button type="submit" isDisabled={loading} className="rounded-xl font-bold bg-[#C9A227] hover:bg-[#B8911F] text-white shadow-md border-none">
                  {loading ? <RefreshCw size={16} className="animate-spin mr-1.5" /> : <Save size={16} className="mr-1.5" />}
                  {"Lưu"}
                </Button>
              </ModalFooter>
            </form>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
