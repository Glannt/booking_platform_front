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
  NumberField,
  TextField,
  Input
} from "@heroui/react";
import { Save, RefreshCw, Check, Layers, Sparkles, Car } from "lucide-react";

import {
  createVehicle,
  updateVehicle,
  getAddOnCategories,
  getAmenityCategories,
  VehicleDto,
  VehicleCategoryDto,
  AddOnCategoryDto,
  AmenityCategoryDto
} from "@/lib/api/fleet";
import MultiImageUpload from "@/components/MultiImageUpload";

export interface VehicleCreateUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingVehicle?: VehicleDto | null;
  categories: VehicleCategoryDto[];
  language?: string;
  backendUrl?: string;
  onSaveSuccess: (savedVehicle?: VehicleDto) => void | Promise<void>;
  showToast: (msg: string, type: "success" | "error") => void;
}

export default function VehicleCreateUpdateModal({
  isOpen,
  onClose,
  editingVehicle,
  categories,
  language = "vi",
  backendUrl,
  onSaveSuccess,
  showToast
}: VehicleCreateUpdateModalProps) {
  const isEdit = Boolean(editingVehicle && editingVehicle.id);
  const [loading, setLoading] = useState(false);

  // Form states
  const [brand, setBrand] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [licensePlate, setLicensePlate] = useState<string>("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [fuelType, setFuelType] = useState<string>("petrol");
  const [active, setActive] = useState<boolean>(true);
  const [canRent, setCanRent] = useState<boolean>(true);
  const [luggage, setLuggage] = useState<number>(2);
  const [luggageUnit, setLuggageUnit] = useState<string>("vali");
  const [typeId, setTypeId] = useState<number>(categories[0]?.id || 0);
  const [imageIds, setImageIds] = useState<number[]>([]);
  const [thumbnailId, setThumbnailId] = useState<number | null>(null);

  // Add-ons & Amenities categories and selected IDs
  const [addOnCategories, setAddOnCategories] = useState<AddOnCategoryDto[]>([]);
  const [amenityCategories, setAmenityCategories] = useState<AmenityCategoryDto[]>([]);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<number[]>([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<number[]>([]);

  // Reset or prepopulate when modal opens or editingVehicle changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingVehicle) {
      setBrand(editingVehicle.brand || "");
      setModel(editingVehicle.model || "");
      setLicensePlate(editingVehicle.licensePlate || "");
      setYear(editingVehicle.year || new Date().getFullYear());
      setFuelType(editingVehicle.fuelType || "petrol");
      setActive(editingVehicle.active ?? true);
      setCanRent(editingVehicle.canRent ?? true);
      setLuggage(editingVehicle.luggage ?? 2);
      setLuggageUnit(editingVehicle.luggageUnit || "vali");
      setTypeId(editingVehicle.type?.id || categories[0]?.id || 0);
      setImageIds(editingVehicle.imageIds || []);
      setThumbnailId(editingVehicle.thumbnailId ?? null);
      setSelectedAddOnIds(editingVehicle.addOns ? editingVehicle.addOns.map((ao) => ao.id) : []);
      setSelectedAmenityIds(editingVehicle.amenities ? editingVehicle.amenities.map((am) => am.id) : []);
    } else {
      setBrand("");
      setModel("");
      setLicensePlate("");
      setYear(new Date().getFullYear());
      setFuelType("petrol");
      setActive(true);
      setCanRent(true);
      setLuggage(2);
      setLuggageUnit("vali");
      setTypeId(categories[0]?.id || 0);
      setImageIds([]);
      setThumbnailId(null);
      setSelectedAddOnIds([]);
      setSelectedAmenityIds([]);
    }

    getAddOnCategories(true)
      .then((res) => {
        if (res?.data) setAddOnCategories(res.data);
      })
      .catch((err) => console.error("Failed to load add-on categories:", err));

    getAmenityCategories(true)
      .then((res) => {
        if (res?.data) setAmenityCategories(res.data);
      })
      .catch((err) => console.error("Failed to load amenity categories:", err));
  }, [isOpen, editingVehicle, categories]);

  const toggleAddOn = (id: number) => {
    setSelectedAddOnIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAmenity = (id: number) => {
    setSelectedAmenityIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!brand.trim() || !model.trim()) {
      showToast("Vui lòng nhập hãng xe và mẫu xe!", "error");
      return;
    }

    if (!typeId) {
      showToast("Vui lòng chọn danh mục xe!", "error");
      return;
    }

    const payload = {
      brand: brand.trim(),
      model: model.trim(),
      licensePlate: licensePlate.trim() || undefined,
      year,
      fuelType,
      active,
      canRent,
      luggage,
      luggageUnit,
      imageIds: imageIds.length > 0 ? imageIds : undefined,
      thumbnailId: thumbnailId ?? undefined,
      typeId,
      addOnIds: selectedAddOnIds,
      amenityIds: selectedAmenityIds,
    };

    setLoading(true);
    try {
      if (isEdit && editingVehicle?.id) {
        const res = await updateVehicle(editingVehicle.id, payload);
        showToast("Cập nhật xe thành công!", "success");
        await onSaveSuccess?.(res.data);
      } else {
        const res = await createVehicle(payload);
        showToast("Thêm xe mới thành công!", "success");
        await onSaveSuccess?.(res.data);
      }
      onClose();
    } catch (err) {
      showToast("Có lỗi xảy ra khi lưu xe.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      aria-labelledby="vehicle-form-title"
    >
      <ModalBackdrop className="bg-slate-950/40 backdrop-blur-sm">
        <ModalContainer size="full">
          <ModalDialog className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-border shadow-2xl overflow-hidden w-full max-w-5xl lg:max-w-6xl flex flex-col max-h-[90vh]">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent/10 text-accent">
                  <Car size={22} />
                </div>
                <div>
                  <h2 id="vehicle-form-title" className="text-lg font-extrabold">
                    {isEdit
                      ? (`Chỉnh Sửa Xe: ${brand} ${model} (${licensePlate || "Chưa có biển"})`): ("Thêm Xe Mới")}
                  </h2>
                  <p className="text-xs font-medium">
                    {"Thiết lập cấu hình thông số kỹ thuật xe, thuộc tính, tiện nghi và phân loại nhóm xe."}
                  </p>
                </div>
              </div>
            </ModalHeader>

            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <ModalBody className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Basic Specifications */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <TextField isRequired className="w-full">
                        <Label className="text-xs font-bold uppercase tracking-wider">
                          {"Hãng xe"}
                        </Label>
                        <Input
                          type="text"
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                          placeholder="Toyota, Honda, Kia..."
                          className="w-full p-2.5 rounded-xl text-sm font-semibold border border-separator bg-white dark:bg-[var(--bg-card)] outline-none"
                        />
                      </TextField>

                      <TextField isRequired className="w-full">
                        <Label className="text-xs font-bold uppercase tracking-wider">
                          {"Mẫu xe"}
                        </Label>
                        <Input
                          type="text"
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          placeholder="Camry, Vios, Carnival..."
                          className="w-full p-2.5 rounded-xl text-sm font-semibold border border-separator bg-white dark:bg-[var(--bg-card)] outline-none"
                        />
                      </TextField>

                      <TextField className="w-full">
                        <Label className="text-xs font-bold uppercase tracking-wider">
                          {"Biển số xe"}
                        </Label>
                        <Input
                          type="text"
                          value={licensePlate}
                          onChange={(e) => setLicensePlate(e.target.value)}
                          placeholder="51H-123.45"
                          className="w-full p-2.5 rounded-xl text-sm font-bold font-mono border border-separator bg-white dark:bg-[var(--bg-card)] outline-none"
                        />
                      </TextField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="w-full">
                        <Select
                          isRequired
                          fullWidth
                          name="typeId"
                          placeholder={"-- Chọn loại xe --"}
                          selectedKey={String(typeId)}
                          onSelectionChange={(key) => {
                            if (key) setTypeId(Number(key));
                          }}
                        >
                          <Label className="block text-xs font-bold uppercase tracking-wider mb-1">
                            {"Danh mục phân loại xe"}
                          </Label>
                          <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-separator bg-white dark:bg-[var(--bg-card)] focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold flex items-center justify-between cursor-pointer h-[42px]">
                            <Select.Value />
                            <Select.Indicator />
                          </Select.Trigger>
                          <Select.Popover className="bg-white dark:bg-[var(--bg-card)] border border-separator rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                            <ListBox>
                              {categories.map((c) => {
                                const tr = c.translations?.find((t) => t.locale === language) || c.translations?.[0];
                                const labelText = `${tr?.name || c.code} (${c.minSeat === c.maxSeat ? c.minSeat : `${c.minSeat}-${c.maxSeat}`} chỗ)`;
                                return (
                                  <ListBox.Item
                                    key={c.id}
                                    id={String(c.id)}
                                    textValue={labelText}
                                    className="px-3 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-muted flex items-center justify-between"
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
                          minValue={1990}
                          maxValue={new Date().getFullYear() + 2}
                        >
                          <Label className="block text-xs font-bold uppercase tracking-wider mb-1">
                            {"Năm sản xuất"}
                          </Label>
                          <NumberField.Group className="flex items-center w-full rounded-xl border border-separator bg-white dark:bg-[var(--bg-card)] overflow-hidden focus-within:ring-2 focus-within:ring-primary h-[42px]">
                            <NumberField.Input className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full font-bold" />
                          </NumberField.Group>
                        </NumberField>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Select
                          isRequired
                          fullWidth
                          name="fuelType"
                          selectedKey={fuelType}
                          onSelectionChange={(key) => {
                            if (key) setFuelType(String(key));
                          }}
                        >
                          <Label className="block text-xs font-bold uppercase tracking-wider mb-1">
                            {"Loại nhiên liệu"}
                          </Label>
                          <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-separator bg-white dark:bg-[var(--bg-card)] focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold flex items-center justify-between cursor-pointer h-[42px]">
                            <Select.Value />
                            <Select.Indicator />
                          </Select.Trigger>
                          <Select.Popover className="bg-white dark:bg-[var(--bg-card)] border border-separator rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                            <ListBox>
                              {[
                                { id: "petrol", label: "Xăng (Petrol)" },
                                { id: "diesel", label: "Dầu Diesel" },
                                { id: "electric", label: "Điện (Electric)" },
                                { id: "hybrid", label: "Hybrid" },
                              ].map((item) => (
                                <ListBox.Item
                                  key={item.id}
                                  id={item.id}
                                  textValue={item.label}
                                  className="px-3 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-muted flex items-center justify-between"
                                >
                                  {item.label}
                                  <ListBox.ItemIndicator />
                                </ListBox.Item>
                              ))}
                            </ListBox>
                          </Select.Popover>
                        </Select>
                      </div>

                      <div>
                        <NumberField
                          className="w-full"
                          value={luggage}
                          onChange={(val) => setLuggage(val || 0)}
                          minValue={0}
                        >
                          <Label className="block text-xs font-bold uppercase tracking-wider mb-1">
                            {"Số hành lý"}
                          </Label>
                          <NumberField.Group className="flex items-center w-full rounded-xl border border-separator bg-white dark:bg-[var(--bg-card)] overflow-hidden focus-within:ring-2 focus-within:ring-primary h-[42px]">
                            <NumberField.Input className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full font-bold" />
                          </NumberField.Group>
                        </NumberField>
                      </div>

                      <TextField className="w-full">
                        <Label className="block text-xs font-bold uppercase tracking-wider mb-1">
                          {"Đơn vị tính"}
                        </Label>
                        <Input
                          type="text"
                          value={luggageUnit}
                          onChange={(e) => setLuggageUnit(e.target.value)}
                          placeholder="vali, kiện..."
                          className="w-full p-2.5 rounded-xl text-sm font-semibold border border-separator bg-white dark:bg-[var(--bg-card)] outline-none h-[42px]"
                        />
                      </TextField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-border bg-muted/20">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="vehicle-active"
                          isSelected={active}
                          onChange={(val: boolean) => setActive(val)}
                        >
                          <Checkbox.Content>
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                          </Checkbox.Content>
                        </Checkbox>
                        <Label htmlFor="vehicle-active" className="text-sm font-bold cursor-pointer select-none">
                          {"Kích hoạt hoạt động"}
                        </Label>
                      </div>

                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="vehicle-can-rent"
                          isSelected={canRent}
                          onChange={(val: boolean) => setCanRent(val)}
                        >
                          <Checkbox.Content>
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                          </Checkbox.Content>
                        </Checkbox>
                        <Label htmlFor="vehicle-can-rent" className="text-sm font-bold cursor-pointer select-none">
                          {"Cho thuê tự lái"}
                        </Label>
                      </div>
                    </div>

                    <div className="pt-2">
                      <MultiImageUpload
                        imageIds={imageIds}
                        thumbnailId={thumbnailId}
                        onImageIdsChange={(newImageIds) => setImageIds(newImageIds)}
                        onThumbnailChange={(newThumbnailId) => setThumbnailId(newThumbnailId)}
                        label={"Hình ảnh Xe (Tải lên & Chọn ảnh đại diện)"}
                      />
                    </div>
                  </div>

                  {/* Right Column: Add-ons & Amenities Configuration */}
                  <div className="lg:col-span-6 space-y-6">
                    {/* Add-ons Configuration */}
                    {addOnCategories.length > 0 && (
                      <div className="p-4 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                            <Layers size={18} />
                          </div>
                          <div>
                            <span className="text-sm font-black text-black dark:text-white uppercase tracking-wider block">
                              {"Thuộc tính & Phụ kiện (Add-ons)"}
                            </span>
                            <span className="text-xs">
                              {"Chọn các thuộc tính cấu hình trang bị cho xe này"}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-4 pt-1">
                          {addOnCategories.map((cat) => {
                            const catTr = cat.translations?.find((t) => t.locale === language) || cat.translations?.[0];
                            const catTitle = catTr?.name || cat.code;
                            if (!cat.addOns || cat.addOns.length === 0) return null;
                            return (
                              <div key={cat.id} className="space-y-2">
                                <span className="text-sm font-bold uppercase tracking-wider block">
                                  {catTitle}
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {cat.addOns.map((ao) => {
                                    const aoTr = ao.translations?.find((t) => t.locale === language) || ao.translations?.[0];
                                    const isSelected = selectedAddOnIds.includes(ao.id);
                                    return (
                                      <button
                                        key={ao.id}
                                        type="button"
                                        onClick={() => toggleAddOn(ao.id)}
                                        className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer border-2 ${isSelected
                                          ? "bg-primary border-green-300 shadow-sm"
                                          : "bg-muted/40 border-border hover:border-primary/50"
                                          }`}
                                      >
                                        {isSelected && <Check size={14} />}
                                        <span>{aoTr?.name || ao.value || ao.code}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Amenities Configuration */}
                    {amenityCategories.length > 0 && (
                      <div className="p-4 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Sparkles size={18} />
                          </div>
                          <div>
                            <span className="text-sm font-black uppercase tracking-wider block">
                              {"Tiện nghi trang bị (Amenities)"}
                            </span>
                            <span className="text-xs">
                              {"Chọn các tiện nghi sẵn có trên xe cho khách hàng"}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-4 pt-1">
                          {amenityCategories.map((cat) => {
                            const catTr = cat.translations?.find((t) => t.locale === language) || cat.translations?.[0];
                            const catTitle = catTr?.name || cat.code;
                            if (!cat.amenities || cat.amenities.length === 0) return null;
                            return (
                              <div key={cat.id} className="space-y-2">
                                <span className="text-sm font-bold uppercase tracking-wider block">
                                  {catTitle}
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {cat.amenities.map((am) => {
                                    const amTr = am.translations?.find((t) => t.locale === language) || am.translations?.[0];
                                    const isSelected = selectedAmenityIds.includes(am.id);
                                    return (
                                      <button
                                        key={am.id}
                                        type="button"
                                        onClick={() => toggleAmenity(am.id)}
                                        className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer border-2 ${isSelected
                                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                          : "bg-muted/40 border-border hover:border-emerald-500/50"
                                          }`}
                                      >
                                        {isSelected && <Check size={14} />}
                                        <span>{amTr?.name || am.code}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ModalBody>

              <ModalFooter className="px-6 py-4 border-t border-border bg-muted/10 flex items-center justify-end gap-2.5 shrink-0">
                <Button
                  variant="outline"
                  onClick={onClose}
                  isDisabled={loading}
                  className="rounded-xl font-bold text-xs h-10 px-4 border border-border cursor-pointer transition-colors"
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
                  {isEdit ? ("Lưu thay đổi"): ("Tạo xe mới")}
                </Button>
              </ModalFooter>
            </form>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
