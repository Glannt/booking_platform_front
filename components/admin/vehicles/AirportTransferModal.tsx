"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
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
import { Save, RefreshCw } from "lucide-react";

import {
  createAirportTransfer,
  updateAirportTransfer,
  AirportTransferPrice,
  AirportRouteDto,
  VehicleCategoryDto
} from "@/lib/api/fleet";

interface AirportTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  transfer: AirportTransferPrice | null;
  routes: AirportRouteDto[];
  categories: VehicleCategoryDto[];
  onSaveSuccess: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
}

export default function AirportTransferModal({
  isOpen,
  onClose,
  transfer,
  routes,
  categories,
  onSaveSuccess,
  showToast
}: AirportTransferModalProps) {
  const [loading, setLoading] = useState(false);

  const [airportRouteId, setAirportRouteId] = useState<number>(0);
  const [vehicleCategoryId, setVehicleCategoryId] = useState<number>(0);
  const [serviceType, setServiceType] = useState("ONE_WAY");
  const [price, setPrice] = useState<number>(0);
  const [currency, setCurrency] = useState("VND");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (transfer) {
        setAirportRouteId(transfer.airportRouteId);
        setVehicleCategoryId(transfer.vehicleCategoryId);
        setServiceType(transfer.serviceType || "ONE_WAY");
        setPrice(transfer.amount);
        setCurrency(transfer.currency || "VND");
        setActive(transfer.active);
      } else {
        setAirportRouteId(routes[0]?.id || 0);
        setVehicleCategoryId(categories[0]?.id || 0);
        setServiceType("ONE_WAY");
        setPrice(0);
        setCurrency("VND");
        setActive(true);
      }
    }
  }, [isOpen, transfer, routes, categories]);

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
      serviceType,
      amount: price,
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

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="airport-transfer-title">
      <ModalBackdrop className="bg-slate-950/40 backdrop-blur-sm">
        <ModalContainer size="md">
          <ModalDialog className="bg-white dark:bg-black rounded-3xl border border-divider shadow-2xl overflow-hidden animate-scale-up w-full max-w-lg relative">
            <Button
              isIconOnly
              variant="ghost"
              onClick={onClose}
              className="absolute top-4 right-4 z-50 rounded-xl text-slate-400 hover:text-slate-750 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] transition-colors cursor-pointer border-none"
            >
              ✕
            </Button>

            <ModalHeader className="px-6 py-4 border-b border-divider bg-slate-50 dark:bg-black/40 flex items-center justify-between">
              <div>
                <h2 id="airport-transfer-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {transfer ? "Chỉnh Sửa Giá Vé" : "Thêm Giá Vé Mới"}
                </h2>
                <p className="text-xs text-slate-500">
                  {"Thiết lập giá cho tuyến đường và loại xe."}
                </p>
              </div>
            </ModalHeader>

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
                    <Label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">
                      {"Tuyến Đường"}
                    </Label>
                    <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-55 dark:bg-black text-slate-808 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold flex items-center justify-between cursor-pointer h-[40px]">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                      <ListBox>
                        {routes.map((r) => {
                          const routeName = r.code;
                          return (
                            <ListBox.Item
                              key={r.id}
                              id={String(r.id)}
                              textValue={routeName}
                              className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] text-slate-800 dark:text-slate-100 flex items-center justify-between"
                            >
                              {routeName}
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          );
                        })}
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
                    <Label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">
                      {"Loại Xe"}
                    </Label>
                    <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-55 dark:bg-black text-slate-808 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold flex items-center justify-between cursor-pointer h-[40px]">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
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

                <div>
                  <Label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">
                    {"Loại chuyến"}
                  </Label>
                  <Select
                    fullWidth
                    selectedKey={serviceType}
                    onSelectionChange={(key) => { if (key) setServiceType(String(key)); }}
                  >
                    <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-55 dark:bg-black text-slate-805 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium cursor-pointer h-[40px]">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                      <ListBox>
                        <ListBox.Item key="ONE_WAY" id="ONE_WAY" textValue="Một chiều" className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] text-slate-800 dark:text-slate-100 flex items-center justify-between">
                          {"Một chiều"}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        <ListBox.Item key="ROUND_TRIP" id="ROUND_TRIP" textValue="Khứ hồi" className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] text-slate-800 dark:text-slate-100 flex items-center justify-between">
                          {"Khứ hồi"}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>

                <div>
                  <NumberField
                    className="w-full"
                    value={price}
                    onChange={(val) => setPrice(val || 0)}
                    minValue={0}
                  >
                    <Label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">
                      {"Đơn Giá"} ({currency})
                    </Label>
                    <NumberField.Group className="flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-55 dark:bg-black text-slate-850 dark:text-slate-100 overflow-hidden focus-within:ring-2 focus-within:ring-primary h-[40px]">
                      <NumberField.Input className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full font-bold" />
                      <div className="flex h-full flex-col border-l border-slate-200 dark:border-slate-800">
                        <NumberField.IncrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer bg-transparent">
                          ▲
                        </NumberField.IncrementButton>
                        <NumberField.DecrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer bg-transparent border-t border-slate-200 dark:border-slate-800">
                          ▼
                        </NumberField.DecrementButton>
                      </div>
                    </NumberField.Group>
                  </NumberField>
                </div>

                <div className="flex items-center gap-3 py-2">
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
                  <Label htmlFor="transfer-active" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    {"Kích hoạt"}
                  </Label>
                </div>
              </ModalBody>

              <ModalFooter className="px-6 py-4 border-t border-divider bg-slate-50 dark:bg-black/40 flex items-center justify-end gap-3 flex-shrink-0">
                <Button
                  variant="outline"
                  className="rounded-xl font-bold bg-slate-200 hover:bg-slate-300 dark:bg-[var(--bg-card)] dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200 border-none"
                  onClick={onClose}
                  isDisabled={loading}
                >
                  {"Hủy bỏ"}
                </Button>
                <Button
                  type="submit"
                  isDisabled={loading}
                  className="rounded-xl font-bold bg-[#C9A227] hover:bg-[#B8911F] text-white shadow-md border-none"
                >
                  {loading ? (
                    <RefreshCw size={16} className="animate-spin mr-1.5" />
                  ) : (
                    <Save size={16} className="mr-1.5" />
                  )}
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
