"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Label,
  NumberField,
  Checkbox,
  toast,
  Typography,
} from "@heroui/react";
import {
  type IntercityRouteDto,
  type IntercityRoutePriceDto,
  type PriceListTranslationDto,
} from "@/lib/api/intercity";
import type { VehicleCategoryDto } from "@/lib/api/fleet";
import { Calendar, Clock, DollarSign, Car, Route as RouteIcon, Info, RefreshCw, Save } from "lucide-react";
import { MultiLanguageTranslationInput } from "@/components/admin/common";

interface PriceCreateUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: Partial<IntercityRoutePriceDto>) => Promise<void>;
  routes: IntercityRouteDto[];
  categories: VehicleCategoryDto[];
  editingPrice?: IntercityRoutePriceDto | null;
  routeId?: number;
}

export function PriceCreateUpdateModal({
  isOpen,
  onClose,
  onSave,
  routes,
  categories,
  editingPrice,
  routeId,
}: PriceCreateUpdateModalProps) {
  const [form, setForm] = useState<{
    routeId: string;
    vehicleCategoryId: string;
    category: "IN_DAY" | "DAILY_RATE";
    priceTypeCode: "ONE_WAY" | "ROUND_TRIP_SAME_DAY" | "DAILY_RATE";
    oneWayPrice: string;
    roundTripPrice: string;
    dailyRatePrice: string;
    waitingFee: string;
    maxWaitingMin: string;
    minDays: number;
    maxDays: string;
    kmIncludedPerDay: string;
    overagePricePerKm: string;
    currency: string;
    active: boolean;
  }>({
    routeId: "",
    vehicleCategoryId: "",
    category: "IN_DAY",
    priceTypeCode: "ONE_WAY",
    oneWayPrice: "",
    roundTripPrice: "",
    dailyRatePrice: "",
    waitingFee: "",
    maxWaitingMin: "",
    minDays: 1,
    maxDays: "",
    kmIncludedPerDay: "",
    overagePricePerKm: "",
    currency: "VND",
    active: true,
  });

  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({
    vi: { name: "" },
    en: { name: "" },
    ko: { name: "" },
    ru: { name: "" },
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingPrice) {
      const isDaily =
        editingPrice.priceTypeCode === "DAILY_RATE" ||
        editingPrice.priceTypeCategory === "DAILY_RATE";
      const isRoundTrip = editingPrice.priceTypeCode === "ROUND_TRIP_SAME_DAY";
      const editingActive = editingPrice.active ?? (editingPrice.status !== "INACTIVE");

      const category = isDaily ? "DAILY_RATE" : "IN_DAY";
      const priceTypeCode: "ONE_WAY" | "ROUND_TRIP_SAME_DAY" | "DAILY_RATE" = isDaily
        ? "DAILY_RATE"
        : isRoundTrip
          ? "ROUND_TRIP_SAME_DAY"
          : "ONE_WAY";

      const tMap: Record<string, Record<string, string>> = {
        vi: { name: "" },
        en: { name: "" },
        ko: { name: "" },
        ru: { name: "" },
      };
      editingPrice.translations?.forEach((t) => {
        if (t.locale in tMap) {
          tMap[t.locale] = { name: t.name || "" };
        }
      });
      setTranslations(tMap);

      const baseVal = editingPrice.basePrice != null ? String(editingPrice.basePrice) : "";

      setForm({
        routeId: String(editingPrice.routeId || editingPrice.scopeRefId || (routeId ? String(routeId) : "")),
        vehicleCategoryId: String(editingPrice.vehicleCategoryId || ""),
        category,
        priceTypeCode,
        oneWayPrice: editingPrice.oneWayPrice
          ? String(editingPrice.oneWayPrice)
          : priceTypeCode === "ONE_WAY"
            ? baseVal
            : "",
        roundTripPrice: editingPrice.roundTripPrice
          ? String(editingPrice.roundTripPrice)
          : priceTypeCode === "ROUND_TRIP_SAME_DAY"
            ? baseVal
            : "",
        dailyRatePrice: editingPrice.dailyRatePrice
          ? String(editingPrice.dailyRatePrice)
          : priceTypeCode === "DAILY_RATE"
            ? baseVal
            : "",
        waitingFee: editingPrice.waitingFee ? String(editingPrice.waitingFee) : "",
        maxWaitingMin: editingPrice.maxWaitingMin ? String(editingPrice.maxWaitingMin) : "",
        minDays: editingPrice.minDays ?? 1,
        maxDays: editingPrice.maxDays ? String(editingPrice.maxDays) : "",
        kmIncludedPerDay: editingPrice.kmIncludedPerDay ? String(editingPrice.kmIncludedPerDay) : "",
        overagePricePerKm: editingPrice.overagePricePerKm ? String(editingPrice.overagePricePerKm) : "",
        currency: editingPrice.currency || "VND",
        active: editingActive,
      });
    } else {
      setTranslations({
        vi: { name: "" },
        en: { name: "" },
        ko: { name: "" },
        ru: { name: "" },
      });
      setForm({
        routeId: routeId ? String(routeId) : routes[0] ? String(routes[0].id) : "",
        vehicleCategoryId: categories[0] ? String(categories[0].id) : "",
        category: "IN_DAY",
        priceTypeCode: "ONE_WAY",
        oneWayPrice: "",
        roundTripPrice: "",
        dailyRatePrice: "",
        waitingFee: "",
        maxWaitingMin: "",
        minDays: 1,
        maxDays: "",
        kmIncludedPerDay: "",
        overagePricePerKm: "",
        currency: "VND",
        active: true,
      });
    }
  }, [editingPrice, routeId, routes, categories, isOpen]);

  const getRouteName = (r: IntercityRouteDto) => {
    const t = r.translations?.find((tr) => tr.locale === "vi") || r.translations?.[0];
    return t?.name || `${r.originCity} ⇌ ${r.destinationCity}`;
  };

  const getCategoryName = (c: VehicleCategoryDto) => {
    const t = c.translations?.find((tr) => tr.locale === "vi") || c.translations?.[0];
    return t?.name || c.code;
  };

  const handleTranslationChange = (locale: string, fieldKey: string, value: string) => {
    setTranslations((prev) => ({
      ...prev,
      [locale]: {
        ...prev[locale],
        [fieldKey]: value,
      },
    }));
  };

  const handleCategoryChange = (val: string) => {
    const newCategory = val as "IN_DAY" | "DAILY_RATE";
    setForm((f) => ({
      ...f,
      category: newCategory,
      priceTypeCode: newCategory === "DAILY_RATE" ? "DAILY_RATE" : "ONE_WAY",
    }));
  };

  const handlePriceTypeChange = (val: string) => {
    setForm((f) => ({
      ...f,
      priceTypeCode: val as "ONE_WAY" | "ROUND_TRIP_SAME_DAY" | "DAILY_RATE",
    }));
  };

  const priceTypeOptions = useMemo(() => {
    if (form.category === "DAILY_RATE") {
      return [
        {
          id: "DAILY_RATE",
          title: "Thuê xe theo ngày",
          desc: "Tính đơn giá theo số ngày thuê",
          dotColor: "bg-amber-500",
        },
      ];
    }
    return [
      {
        id: "ONE_WAY",
        title: "Một chiều",
        desc: "Chuyến đi 1 chiều thẳng tới điểm đến",
        dotColor: "bg-blue-500",
      },
      {
        id: "ROUND_TRIP_SAME_DAY",
        title: "Khứ hồi trong ngày",
        desc: "Chuyến đi và về trong cùng ngày",
        dotColor: "bg-purple-500",
      },
    ];
  }, [form.category]);

  const handleSave = async () => {
    if (!form.routeId || !form.vehicleCategoryId) {
      toast.danger("Vui lòng chọn tuyến đường và dòng xe áp dụng.");
      return;
    }

    if (form.priceTypeCode === "ONE_WAY") {
      if (!form.oneWayPrice || Number(form.oneWayPrice) <= 0) {
        toast.danger("Vui lòng nhập giá chuyến một chiều hợp lệ.");
        return;
      }
    } else if (form.priceTypeCode === "ROUND_TRIP_SAME_DAY") {
      if (!form.roundTripPrice || Number(form.roundTripPrice) <= 0) {
        toast.danger("Vui lòng nhập giá chuyến khứ hồi trong ngày hợp lệ.");
        return;
      }
    } else if (form.priceTypeCode === "DAILY_RATE") {
      if (!form.dailyRatePrice || Number(form.dailyRatePrice) <= 0) {
        toast.danger("Vui lòng nhập đơn giá thuê mỗi ngày hợp lệ.");
        return;
      }
    }

    setSaving(true);
    try {
      const translationList: PriceListTranslationDto[] = ["vi", "en", "ko", "ru"]
        .filter((loc) => translations[loc]?.name?.trim())
        .map((loc) => ({
          locale: loc,
          name: translations[loc].name.trim(),
        }));

      const payload: Partial<IntercityRoutePriceDto> = {
        id: editingPrice?.id,
        routeId: Number(form.routeId),
        vehicleCategoryId: Number(form.vehicleCategoryId),
        priceTypeCategory: form.category,
        priceTypeCode: form.priceTypeCode,
        currency: form.currency || "VND",
        active: form.active,
        status: form.active ? "ACTIVE" : "INACTIVE",
        translations: translationList.length > 0 ? translationList : undefined,
        // No deposit fields: price_lists has no deposit policy. It used to be sent here and
        // silently dropped by the backend, so admins believed they had configured one.
      };

      if (form.priceTypeCode === "ONE_WAY") {
        const p = Number(form.oneWayPrice);
        payload.basePrice = p;
        payload.oneWayPrice = p;
        if (form.waitingFee) payload.waitingFee = Number(form.waitingFee);
        if (form.maxWaitingMin) payload.maxWaitingMin = Number(form.maxWaitingMin);
      } else if (form.priceTypeCode === "ROUND_TRIP_SAME_DAY") {
        const p = Number(form.roundTripPrice);
        payload.basePrice = p;
        payload.roundTripPrice = p;
        if (form.waitingFee) payload.waitingFee = Number(form.waitingFee);
        if (form.maxWaitingMin) payload.maxWaitingMin = Number(form.maxWaitingMin);
      } else {
        const p = Number(form.dailyRatePrice);
        payload.basePrice = p;
        payload.dailyRatePrice = p;
        payload.minDays = form.minDays || 1;
        if (form.maxDays) payload.maxDays = Number(form.maxDays);
        if (form.kmIncludedPerDay) payload.kmIncludedPerDay = Number(form.kmIncludedPerDay);
        if (form.overagePricePerKm) payload.overagePricePerKm = Number(form.overagePricePerKm);
      }

      await onSave(payload);
      onClose();
    } catch {
      toast.danger("Có lỗi xảy ra khi lưu cấu hình bảng giá.");
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
          <ModalDialog className="max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <Typography
                type="h3"
                className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"
              >
                <DollarSign size={18} className="text-accent" />
                {editingPrice ? "Chỉnh sửa bảng giá tuyến" : "Thêm mới bảng giá tuyến"}
              </Typography>
            </ModalHeader>

            <ModalBody className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
              {/* Route Selector */}
              {routes.length > 0 && (
                <div className="flex flex-col gap-1 w-full">
                  <Label isRequired className="text-xs font-bold uppercase tracking-wider mb-1">
                    Tuyến đường áp dụng
                  </Label>
                  <Select
                    isRequired
                    fullWidth
                    placeholder="Chọn tuyến đường"
                    selectedKey={form.routeId || undefined}
                    onSelectionChange={(key) => {
                      if (key) setForm((f) => ({ ...f, routeId: String(key) }));
                    }}
                  >
                    <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--bg-surface)] text-sm h-[40px] cursor-pointer">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                      <ListBox items={routes}>
                        {(r) => (
                          <ListBox.Item
                            key={r.id}
                            id={String(r.id)}
                            textValue={getRouteName(r)}
                            className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-800 dark:text-slate-100 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <RouteIcon size={14} className="text-accent" />
                              <span>{getRouteName(r)}</span>
                            </div>
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        )}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>
              )}

              {/* Vehicle Category Selector */}
              <div className="flex flex-col gap-1 w-full">
                <Label isRequired className="text-xs font-bold uppercase tracking-wider mb-1">
                  Dòng xe áp dụng
                </Label>
                <Select
                  fullWidth
                  isRequired
                  placeholder="Chọn dòng xe"
                  selectedKey={form.vehicleCategoryId || undefined}
                  onSelectionChange={(key) => {
                    if (key) setForm((f) => ({ ...f, vehicleCategoryId: String(key) }));
                  }}
                >
                  <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--bg-surface)] text-sm h-[40px] cursor-pointer">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                    <ListBox items={categories}>
                      {(c) => (
                        <ListBox.Item
                          key={c.id}
                          id={String(c.id)}
                          textValue={getCategoryName(c)}
                          className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-800 dark:text-slate-100 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Car size={14} className="text-accent" />
                            <span>{getCategoryName(c)}</span>
                          </div>
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      )}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>

              {/* 2 Linked Selects: Select 1 (Thời lượng) and Select 2 (Hình thức di chuyển) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200/70 dark:border-slate-800">
                {/* Select 1: Loại hình thời lượng */}
                <div className="flex flex-col gap-1">
                  <Label isRequired className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Loại hình thời lượng
                  </Label>
                  <Select
                    fullWidth
                    isRequired
                    selectedKey={form.category}
                    onSelectionChange={(key) => {
                      if (key) handleCategoryChange(String(key));
                    }}
                  >
                    <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--bg-surface)] text-xs sm:text-sm font-semibold h-[40px] cursor-pointer">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                      <ListBox>
                        <ListBox.Item
                          key="IN_DAY"
                          id="IN_DAY"
                          textValue="Chuyến trong ngày"
                          className="px-3 py-2 rounded-lg text-xs sm:text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-800 dark:text-slate-100"
                        >
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-primary" />
                            <div>
                              <p className="font-bold">Chuyến trong ngày</p>
                              <p className="text-[11px] text-slate-400">Đi một chiều hoặc khứ hồi hoàn thành trong ngày</p>
                            </div>
                          </div>
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        <ListBox.Item
                          key="DAILY_RATE"
                          id="DAILY_RATE"
                          textValue="Thuê theo ngày"
                          className="px-3 py-2 rounded-lg text-xs sm:text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-800 dark:text-slate-100"
                        >
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-accent" />
                            <div>
                              <p className="font-bold">Thuê theo ngày</p>
                              <p className="text-[11px] text-slate-400">Thuê xe có tài xế tính giá theo từng ngày</p>
                            </div>
                          </div>
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>

                {/* Select 2: Hình thức di chuyển (phụ thuộc vào Select 1) */}
                <div className="flex flex-col gap-1">
                  <Label isRequired className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Hình thức di chuyển
                  </Label>
                  <Select
                    key={`select-price-type-${form.category}`}
                    fullWidth
                    isRequired
                    selectedKey={form.priceTypeCode}
                    onSelectionChange={(key) => {
                      if (key) handlePriceTypeChange(String(key));
                    }}
                  >
                    <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--bg-surface)] text-xs sm:text-sm font-semibold h-[40px] cursor-pointer">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                      <ListBox items={priceTypeOptions}>
                        {(item) => (
                          <ListBox.Item
                            key={item.id}
                            id={item.id}
                            textValue={item.title}
                            className="px-3 py-2 rounded-lg text-xs sm:text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-800 dark:text-slate-100"
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${item.dotColor} shrink-0`} />
                              <div>
                                <p className="font-bold">{item.title}</p>
                                <p className="text-[11px] text-slate-400">{item.desc}</p>
                              </div>
                            </div>
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        )}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>
              </div>

              {/* Dynamic Form Fields Based on Select 2 (priceTypeCode) */}

              {/* CASE 1: ONE_WAY */}
              {form.priceTypeCode === "ONE_WAY" && (
                <div className="space-y-4 p-4 bg-slate-50 dark:bg-[var(--bg-card)] rounded-2xl border border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[var(--bg-surface)] border border-slate-200/70 dark:border-slate-800">
                    <div className="flex flex-col">
                      <Label htmlFor="price-active" className="text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer">
                        Kích hoạt bảng giá một chiều
                      </Label>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Áp dụng mức giá một chiều này cho khách hàng đặt xe trên tuyến
                      </span>
                    </div>
                    <Checkbox
                      id="price-active"
                      isSelected={form.active}
                      onChange={(val: boolean) => setForm((f) => ({ ...f, active: val }))}
                    >
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                      </Checkbox.Content>
                    </Checkbox>
                  </div>

                  {/* One-Way Price */}
                  <NumberField
                    value={form.oneWayPrice !== "" ? Number(form.oneWayPrice) : undefined}
                    onChange={(val) =>
                      setForm((f) => ({ ...f, oneWayPrice: val == null ? "" : String(val) }))
                    }
                    minValue={0}
                    className="w-full"
                  >
                    <Label isRequired className="text-xs font-bold uppercase tracking-wider mb-1 block">
                      Giá chuyến 1 chiều (VND)
                    </Label>
                    <NumberField.Group className="flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--bg-surface)] overflow-hidden focus-within:ring-2 focus-within:ring-primary h-[40px]">
                      <NumberField.Input
                        placeholder="Ví dụ: 800000"
                        className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full"
                      />
                    </NumberField.Group>
                  </NumberField>

                  {/* Optional Waiting Fee & Max Waiting Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <NumberField
                      value={form.waitingFee !== "" ? Number(form.waitingFee) : undefined}
                      onChange={(val) =>
                        setForm((f) => ({ ...f, waitingFee: val == null ? "" : String(val) }))
                      }
                      minValue={0}
                      className="w-full"
                    >
                      <Label className="text-xs font-bold uppercase tracking-wider mb-1 block">
                        Phí chờ phát sinh (VND/giờ)
                      </Label>
                      <NumberField.Group className="flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--bg-surface)] overflow-hidden h-[40px]">
                        <NumberField.Input
                          placeholder="Ví dụ: 100000"
                          className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full"
                        />
                      </NumberField.Group>
                    </NumberField>

                    <NumberField
                      value={form.maxWaitingMin !== "" ? Number(form.maxWaitingMin) : undefined}
                      onChange={(val) =>
                        setForm((f) => ({ ...f, maxWaitingMin: val == null ? "" : String(val) }))
                      }
                      minValue={0}
                      className="w-full"
                    >
                      <Label className="text-xs font-bold uppercase tracking-wider mb-1 block">
                        Thời gian chờ miễn phí (phút)
                      </Label>
                      <NumberField.Group className="flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--bg-surface)] overflow-hidden h-[40px]">
                        <NumberField.Input
                          placeholder="Ví dụ: 60"
                          className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full"
                        />
                      </NumberField.Group>
                    </NumberField>
                  </div>
                </div>
              )}

              {/* CASE 2: ROUND_TRIP_SAME_DAY */}
              {form.priceTypeCode === "ROUND_TRIP_SAME_DAY" && (
                <div className="space-y-4 p-4 bg-slate-50 dark:bg-[var(--bg-card)] rounded-2xl border border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[var(--bg-surface)] border border-slate-200/70 dark:border-slate-800">
                    <div className="flex flex-col">
                      <Label htmlFor="price-active" className="text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer">
                        Kích hoạt bảng giá khứ hồi trong ngày
                      </Label>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Áp dụng mức giá khứ hồi trong ngày này cho khách hàng đặt xe trên tuyến
                      </span>
                    </div>
                    <Checkbox
                      id="price-active"
                      isSelected={form.active}
                      onChange={(val: boolean) => setForm((f) => ({ ...f, active: val }))}
                    >
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                      </Checkbox.Content>
                    </Checkbox>
                  </div>

                  {/* Round-Trip Price */}
                  <NumberField
                    value={form.roundTripPrice !== "" ? Number(form.roundTripPrice) : undefined}
                    onChange={(val) =>
                      setForm((f) => ({ ...f, roundTripPrice: val == null ? "" : String(val) }))
                    }
                    minValue={0}
                    className="w-full"
                  >
                    <Label isRequired className="text-xs font-bold uppercase tracking-wider mb-1 block">
                      Giá chuyến khứ hồi trong ngày (VND)
                    </Label>
                    <NumberField.Group className="flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--bg-surface)] overflow-hidden focus-within:ring-2 focus-within:ring-primary h-[40px]">
                      <NumberField.Input
                        placeholder="Ví dụ: 1500000"
                        className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full"
                      />
                    </NumberField.Group>
                  </NumberField>

                  {/* Optional Waiting Fee & Max Waiting Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <NumberField
                      value={form.waitingFee !== "" ? Number(form.waitingFee) : undefined}
                      onChange={(val) =>
                        setForm((f) => ({ ...f, waitingFee: val == null ? "" : String(val) }))
                      }
                      minValue={0}
                      className="w-full"
                    >
                      <Label className="text-xs font-bold uppercase tracking-wider mb-1 block">
                        Phí chờ phát sinh (VND/giờ)
                      </Label>
                      <NumberField.Group className="flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--bg-surface)] overflow-hidden h-[40px]">
                        <NumberField.Input
                          placeholder="Ví dụ: 100000"
                          className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full"
                        />
                      </NumberField.Group>
                    </NumberField>

                    <NumberField
                      value={form.maxWaitingMin !== "" ? Number(form.maxWaitingMin) : undefined}
                      onChange={(val) =>
                        setForm((f) => ({ ...f, maxWaitingMin: val == null ? "" : String(val) }))
                      }
                      minValue={0}
                      className="w-full"
                    >
                      <Label className="text-xs font-bold uppercase tracking-wider mb-1 block">
                        Thời gian chờ miễn phí (phút)
                      </Label>
                      <NumberField.Group className="flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--bg-surface)] overflow-hidden h-[40px]">
                        <NumberField.Input
                          placeholder="Ví dụ: 60"
                          className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full"
                        />
                      </NumberField.Group>
                    </NumberField>
                  </div>
                </div>
              )}

              {/* CASE 3: DAILY_RATE */}
              {form.priceTypeCode === "DAILY_RATE" && (
                <div className="space-y-4 p-4 bg-slate-50 dark:bg-[var(--bg-card)] rounded-2xl border border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[var(--bg-surface)] border border-slate-200/70 dark:border-slate-800">
                    <div className="flex flex-col">
                      <Label htmlFor="price-active" className="text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer">
                        Kích hoạt bảng giá thuê theo ngày
                      </Label>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Cho phép khách hàng đặt xe theo hình thức thuê nhiều ngày trên tuyến này
                      </span>
                    </div>
                    <Checkbox
                      id="price-active"
                      isSelected={form.active}
                      onChange={(val: boolean) => setForm((f) => ({ ...f, active: val }))}
                    >
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                      </Checkbox.Content>
                    </Checkbox>
                  </div>

                  {/* Daily Rate Price */}
                  <NumberField
                    value={form.dailyRatePrice !== "" ? Number(form.dailyRatePrice) : undefined}
                    onChange={(val) =>
                      setForm((f) => ({ ...f, dailyRatePrice: val == null ? "" : String(val) }))
                    }
                    minValue={0}
                    className="w-full"
                  >
                    <Label isRequired className="text-xs font-bold uppercase tracking-wider mb-1 block">
                      Đơn giá thuê mỗi ngày (VND)
                    </Label>
                    <NumberField.Group className="flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--bg-surface)] overflow-hidden focus-within:ring-2 focus-within:ring-primary h-[40px]">
                      <NumberField.Input
                        placeholder="Ví dụ: 1500000"
                        className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full"
                      />
                    </NumberField.Group>
                  </NumberField>

                  {/* Min / Max Days */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <NumberField
                      value={form.minDays}
                      onChange={(val) => setForm((f) => ({ ...f, minDays: val || 1 }))}
                      minValue={1}
                      className="w-full"
                    >
                      <Label className="text-xs font-bold uppercase tracking-wider mb-1 block">
                        Số ngày thuê tối thiểu
                      </Label>
                      <NumberField.Group className="flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--bg-surface)] overflow-hidden h-[40px]">
                        <NumberField.Input className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full" />
                      </NumberField.Group>
                    </NumberField>

                    <NumberField
                      value={form.maxDays !== "" ? Number(form.maxDays) : undefined}
                      onChange={(val) =>
                        setForm((f) => ({ ...f, maxDays: val == null ? "" : String(val) }))
                      }
                      minValue={1}
                      className="w-full"
                    >
                      <Label className="text-xs font-bold uppercase tracking-wider mb-1 block">
                        Số ngày thuê tối đa (Tùy chọn)
                      </Label>
                      <NumberField.Group className="flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--bg-surface)] overflow-hidden h-[40px]">
                        <NumberField.Input
                          placeholder="Không giới hạn"
                          className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full"
                        />
                      </NumberField.Group>
                    </NumberField>
                  </div>

                  {/* Km included & Overage Price */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <NumberField
                      value={form.kmIncludedPerDay !== "" ? Number(form.kmIncludedPerDay) : undefined}
                      onChange={(val) =>
                        setForm((f) => ({ ...f, kmIncludedPerDay: val == null ? "" : String(val) }))
                      }
                      minValue={0}
                      className="w-full"
                    >
                      <Label className="text-xs font-bold uppercase tracking-wider mb-1 block">
                        Số km bao gồm / ngày (km)
                      </Label>
                      <NumberField.Group className="flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--bg-surface)] overflow-hidden h-[40px]">
                        <NumberField.Input
                          placeholder="Ví dụ: 250"
                          className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full"
                        />
                      </NumberField.Group>
                    </NumberField>

                    <NumberField
                      value={form.overagePricePerKm !== "" ? Number(form.overagePricePerKm) : undefined}
                      onChange={(val) =>
                        setForm((f) => ({ ...f, overagePricePerKm: val == null ? "" : String(val) }))
                      }
                      minValue={0}
                      className="w-full"
                    >
                      <Label className="text-xs font-bold uppercase tracking-wider mb-1 block">
                        Phụ phí vượt km (VND/km)
                      </Label>
                      <NumberField.Group className="flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--bg-surface)] overflow-hidden h-[40px]">
                        <NumberField.Input
                          placeholder="Ví dụ: 8000"
                          className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full"
                        />
                      </NumberField.Group>
                    </NumberField>
                  </div>
                </div>
              )}


              {/* MultiLanguage Translation Input */}
              <div className="pt-2">
                <MultiLanguageTranslationInput
                  title="Tên hiển thị bảng giá (Đa ngôn ngữ)"
                  fields={[
                    {
                      key: "name",
                      label: "Tên bảng giá",
                      placeholder:
                        form.priceTypeCode === "ONE_WAY"
                          ? "Một chiều"
                          : form.priceTypeCode === "ROUND_TRIP_SAME_DAY"
                            ? "Khứ hồi trong ngày"
                            : "Thuê theo ngày",
                    },
                  ]}
                  translations={translations}
                  onChange={handleTranslationChange}
                />
              </div>
            </ModalBody>

            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                isDisabled={saving}
                onClick={onClose}
                className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="button"
                isDisabled={saving}
                onClick={handleSave}
                className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
              >
                {saving ? (
                  <RefreshCw size={15} className="animate-spin mr-1.5" />
                ) : (
                  <Save size={15} className="mr-1.5" />
                )}
                {editingPrice ? "Cập nhật bảng giá" : "Tạo bảng giá"}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
