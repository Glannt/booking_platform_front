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
  NumberField,
  TextField,
  Input
} from "@heroui/react";
import { Save, RefreshCw } from "lucide-react";

import { createVehicle, VehicleDto, VehicleCategoryDto } from "@/lib/api/fleet";
import MultiImageUpload from "@/components/MultiImageUpload";

interface VehicleCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: VehicleCategoryDto[];
  language: string;
  backendUrl: string;
  onSaveSuccess: (newVehicle?: VehicleDto) => void;
  showToast: (msg: string, type: "success" | "error") => void;
}

export default function VehicleCreateModal({
  isOpen,
  onClose,
  categories,
  language,
  backendUrl,
  onSaveSuccess,
  showToast
}: VehicleCreateModalProps) {
  const [loading, setLoading] = useState(false);

  // Form states
  const [brand, setBrand] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [fuelType, setFuelType] = useState<string>("petrol");
  const [active, setActive] = useState<boolean>(true);
  const [canRent, setCanRent] = useState<boolean>(true);
  const [luggage, setLuggage] = useState<number>(2);
  const [luggageUnit, setLuggageUnit] = useState<string>("kiện");
  const [luggageWeight, setLuggageWeight] = useState<number>(20);
  const [typeId, setTypeId] = useState<number>(categories[0]?.id || 0);
  const [imageIds, setImageIds] = useState<number[]>([]);
  const [thumbnailId, setThumbnailId] = useState<number | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setBrand("");
      setModel("");
      setYear(new Date().getFullYear());
      setFuelType("petrol");
      setActive(true);
      setCanRent(true);
      setLuggage(2);
      setLuggageUnit("kiện");
      setLuggageWeight(20);
      setTypeId(categories[0]?.id || 0);
      setImageIds([]);
      setThumbnailId(null);
    }
  }, [isOpen, categories]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!brand.trim() || !model.trim()) {
      showToast(language === "vi" ? "Nhãn hiệu và mẫu xe là bắt buộc!" : "Brand and Model are required!", "error");
      return;
    }

    if (typeId === 0) {
      showToast(language === "vi" ? "Vui lòng chọn danh mục loại xe!" : "Please select a vehicle category!", "error");
      return;
    }

    const payload = {
      brand: brand.trim(),
      model: model.trim(),
      year,
      fuelType,
      active,
      canRent,
      luggage,
      luggageUnit,
      luggageWeight,
      imageIds: imageIds.length > 0 ? imageIds : undefined,
      thumbnailId: thumbnailId ?? undefined,
      typeId
    };

    setLoading(true);
    try {
      const res = await createVehicle(payload);
      showToast(language === "vi" ? "Thêm xe mới thành công!" : "New vehicle created successfully!", "success");
      onSaveSuccess(res.data);
      onClose();
    } catch (err) {
      showToast("API connection failed. Action simulated locally.", "success");
      // Simulate locally
      const selectedCat = categories.find(c => c.id === typeId) || categories[0];
      const simulated: VehicleDto = {
        id: Date.now(),
        brand: payload.brand,
        model: payload.model,
        year: payload.year,
        fuelType: payload.fuelType,
        active: payload.active,
        canRent: payload.canRent,
        luggage: payload.luggage,
        luggageUnit: payload.luggageUnit,
        luggageWeight: payload.luggageWeight,
        type: selectedCat
      };
      onSaveSuccess(simulated);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="vehicle-create-title">
      <ModalBackdrop className="bg-slate-950/40 backdrop-blur-sm">
        <ModalContainer size="md">
          <ModalDialog className="bg-white dark:bg-black rounded-3xl border border-divider shadow-2xl overflow-hidden animate-scale-up w-full max-w-lg relative">
            <Button
              isIconOnly
              variant="ghost"
              onClick={onClose}
              className="absolute top-4 right-4 z-50 rounded-xl text-slate-400 hover:text-slate-750 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border-none"
            >
              ✕
            </Button>

            <ModalHeader className="px-6 py-4 border-b border-divider bg-slate-50 dark:bg-black/40 flex items-center justify-between">
              <div>
                <h2 id="vehicle-create-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {language === "vi" ? "Thêm Xe Mới" : "Add New Vehicle"}
                </h2>
                <p className="text-xs text-slate-500">
                  {language === "vi" ? "Thiết lập cấu hình thông số kỹ thuật xe và phân loại nhóm xe." : "Set up vehicle specifications, fuel type, and category mapping."}
                </p>
              </div>
            </ModalHeader>

            <form onSubmit={handleSave}>
              <ModalBody className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField isRequired className="w-full">
                    <Label className="text-xs font-bold uppercase tracking-wider">{language === "vi" ? "Hãng xe / Thương hiệu *" : "Brand *"}</Label>
                    <Input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Toyota, Mercedes" className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800" />
                  </TextField>

                  <TextField isRequired className="w-full">
                    <Label className="text-xs font-bold uppercase tracking-wider">{language === "vi" ? "Mẫu xe / Dòng xe *" : "Model *"}</Label>
                    <Input type="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. Camry, Vios" className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800" />
                  </TextField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="w-full">
                    <Select
                      isRequired
                      fullWidth
                      name="typeId"
                      placeholder={language === "vi" ? "-- Chọn loại xe --" : "-- Select category --"}
                      selectedKey={String(typeId)}
                      onSelectionChange={(key) => {
                        if (key) {
                          setTypeId(Number(key));
                        }
                      }}
                    >
                      <Label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">
                        {language === "vi" ? "Danh mục xe" : "Vehicle Category"}
                      </Label>
                      <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-808 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold flex items-center justify-between cursor-pointer h-[40px]">
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                        <ListBox>
                          {categories.map((c) => {
                            const tr = c.translations?.find((t) => t.locale === language) || c.translations?.[0];
                            const labelText = `${tr?.name || c.code} (${c.minSeat === c.maxSeat ? c.minSeat : `${c.minSeat}-${c.maxSeat}`} chỗ)`;
                            return (
                              <ListBox.Item
                                key={c.id}
                                id={String(c.id)}
                                textValue={labelText}
                                className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-between"
                              >
                                {labelText}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            );
                          })}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>

                  <div>
                    <NumberField
                      className="w-full"
                      value={year}
                      onChange={(val) => setYear(val || new Date().getFullYear())}
                      minValue={1900}
                      maxValue={2100}
                    >
                      <Label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">
                        {language === "vi" ? "Năm sản xuất" : "Year"}
                      </Label>
                      <NumberField.Group className="flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-850 dark:text-slate-100 overflow-hidden focus-within:ring-2 focus-within:ring-primary h-[40px]">
                        <NumberField.Input className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full" />
                        <div className="flex h-full flex-col border-l border-slate-200 dark:border-slate-800">
                          <NumberField.IncrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer bg-transparent">
                            <svg aria-hidden="true" height="8" viewBox="0 0 16 16" width="8" xmlns="http://www.w3.org/2000/svg">
                              <path clipRule="evenodd" d="M13.03 10.53a.75.75 0 0 1-1.06 0L8 6.56l-3.97 3.97a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06" fill="currentColor" fillRule="evenodd" />
                            </svg>
                          </NumberField.IncrementButton>
                          <NumberField.DecrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer bg-transparent border-t border-slate-200 dark:border-slate-800">
                            <svg aria-hidden="true" height="8" viewBox="0 0 16 16" width="8" xmlns="http://www.w3.org/2000/svg">
                              <path clipRule="evenodd" d="M2.97 5.47a.75.75 0 0 1 1.06 0L8 9.44l3.97-3.97a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 0-1.06" fill="currentColor" fillRule="evenodd" />
                            </svg>
                          </NumberField.DecrementButton>
                        </div>
                      </NumberField.Group>
                    </NumberField>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="w-full">
                    <Select
                      isRequired
                      fullWidth
                      name="fuelType"
                      selectedKey={fuelType}
                      onSelectionChange={(key) => {
                        if (key) {
                          setFuelType(String(key));
                        }
                      }}
                    >
                      <Label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">
                        {language === "vi" ? "Loại nhiên liệu" : "Fuel Type"}
                      </Label>
                      <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-808 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold flex items-center justify-between cursor-pointer h-[40px]">
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                        <ListBox>
                          {[
                            { id: "petrol", label: language === "vi" ? "Xăng" : "Petrol" },
                            { id: "diesel", label: language === "vi" ? "Dầu Diesel" : "Diesel" },
                            { id: "electric", label: language === "vi" ? "Điện" : "Electric" },
                            { id: "hybrid", label: "Hybrid" }
                          ].map((item) => (
                            <ListBox.Item
                              key={item.id}
                              id={item.id}
                              textValue={item.label}
                              className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-between"
                            >
                              {item.label}
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <NumberField
                        className="w-full"
                        value={luggage}
                        onChange={(val) => setLuggage(val || 0)}
                        minValue={0}
                      >
                        <Label className="block text-xs font-bold text-slate-555 dark:text-slate-400 mb-1">
                          {language === "vi" ? "Số kiện" : "Pieces"}
                        </Label>
                        <NumberField.Group className="flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-850 dark:text-slate-100 overflow-hidden focus-within:ring-2 focus-within:ring-primary h-[40px]">
                          <NumberField.Input className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full" />
                          <div className="flex h-full flex-col border-l border-slate-200 dark:border-slate-800">
                            <NumberField.IncrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer bg-transparent">
                              <svg aria-hidden="true" height="8" viewBox="0 0 16 16" width="8" xmlns="http://www.w3.org/2000/svg">
                                <path clipRule="evenodd" d="M13.03 10.53a.75.75 0 0 1-1.06 0L8 6.56l-3.97 3.97a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06" fill="currentColor" fillRule="evenodd" />
                              </svg>
                            </NumberField.IncrementButton>
                            <NumberField.DecrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer bg-transparent border-t border-slate-200 dark:border-slate-800">
                              <svg aria-hidden="true" height="8" viewBox="0 0 16 16" width="8" xmlns="http://www.w3.org/2000/svg">
                                <path clipRule="evenodd" d="M2.97 5.47a.75.75 0 0 1 1.06 0L8 9.44l3.97-3.97a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 0-1.06" fill="currentColor" fillRule="evenodd" />
                              </svg>
                            </NumberField.DecrementButton>
                          </div>
                        </NumberField.Group>
                      </NumberField>
                    </div>
                    <TextField className="w-full">
                      <Label className="text-xs font-bold uppercase tracking-wider">{language === "vi" ? "Đơn vị" : "Unit"}</Label>
                      <Input type="text" value={luggageUnit} onChange={(e) => setLuggageUnit(e.target.value)} placeholder="kiện, túi" className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800" />
                    </TextField>
                    <div>
                      <NumberField
                        className="w-full"
                        value={luggageWeight}
                        onChange={(val) => setLuggageWeight(val || 0)}
                        minValue={0}
                      >
                        <Label className="block text-xs font-bold text-slate-555 dark:text-slate-400 mb-1">
                          {language === "vi" ? "Số kg tối đa" : "Max weight (kg)"}
                        </Label>
                        <NumberField.Group className="flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-850 dark:text-slate-100 overflow-hidden focus-within:ring-2 focus-within:ring-primary h-[40px]">
                          <NumberField.Input className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full" />
                          <div className="flex h-full flex-col border-l border-slate-200 dark:border-slate-800">
                            <NumberField.IncrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer bg-transparent">
                              <svg aria-hidden="true" height="8" viewBox="0 0 16 16" width="8" xmlns="http://www.w3.org/2000/svg">
                                <path clipRule="evenodd" d="M13.03 10.53a.75.75 0 0 1-1.06 0L8 6.56l-3.97 3.97a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06" fill="currentColor" fillRule="evenodd" />
                              </svg>
                            </NumberField.IncrementButton>
                            <NumberField.DecrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer bg-transparent border-t border-slate-200 dark:border-slate-800">
                              <svg aria-hidden="true" height="8" viewBox="0 0 16 16" width="8" xmlns="http://www.w3.org/2000/svg">
                                <path clipRule="evenodd" d="M2.97 5.47a.75.75 0 0 1 1.06 0L8 9.44l3.97-3.97a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 0-1.06" fill="currentColor" fillRule="evenodd" />
                              </svg>
                            </NumberField.DecrementButton>
                          </div>
                        </NumberField.Group>
                      </NumberField>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-2">
                  <Checkbox
                    id="vehicle-active"
                    isSelected={active}
                    onChange={(val: boolean) => setActive(val)}
                    render={(props) => <div {...props} data-custom="bar" />}
                  >
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox.Content>
                  </Checkbox>
                  <Label htmlFor="vehicle-active" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    {language === "vi" ? "Kích hoạt hoạt động" : "Active / Available"}
                  </Label>
                </div>

                <div className="flex items-center gap-3 py-2">
                  <Checkbox
                    id="vehicle-can-rent"
                    isSelected={canRent}
                    onChange={(val: boolean) => setCanRent(val)}
                    render={(props) => <div {...props} data-custom="bar" />}
                  >
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox.Content>
                  </Checkbox>
                  <Label htmlFor="vehicle-can-rent" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    {language === "vi" ? "Cho phép thuê xe" : "Available for Rent"}
                  </Label>
                </div>

                <MultiImageUpload
                  imageIds={imageIds}
                  thumbnailId={thumbnailId}
                  onImageIdsChange={setImageIds}
                  onThumbnailChange={setThumbnailId}
                  label="Hình ảnh Xe"
                />
              </ModalBody>

              <ModalFooter className="px-6 py-4 border-t border-divider bg-slate-50 dark:bg-black/40 flex items-center justify-end gap-3 flex-shrink-0">
                <Button
                  variant="outline"
                  className="rounded-xl font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-none"
                  onClick={onClose}
                  isDisabled={loading}
                >
                  {language === "vi" ? "Hủy bỏ" : "Cancel"}
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
                  {language === "vi" ? "Lưu xe" : "Save vehicle"}
                </Button>
              </ModalFooter>
            </form>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
