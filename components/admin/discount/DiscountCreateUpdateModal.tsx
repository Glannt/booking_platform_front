"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Label,
  Input,
  TextField,
  FieldError,
  NumberField,
  Switch,
  Select,
  ListBox,
  DatePicker,
  DateField,
  Calendar,
  SwitchContent,
} from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { parseDate } from "@internationalized/date";
import { Tag, RefreshCw, Save, Layers, Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import { type PromotionDto, type PromotionScopeDto } from "@/lib/api/discount";
import { discountFormSchema, type DiscountFormValues, type PromotionScopeFormValue } from "@/lib/schemas/discount.schema";
import { useSaveDiscount } from "@/lib/queries/useDiscounts";
import { useI18n } from "@/context/LanguageContext";

const parseDateSafe = (dStr?: string) => {
  if (!dStr) return undefined;
  try {
    return parseDate(dStr.slice(0, 10));
  } catch {
    return undefined;
  }
};

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (saved: PromotionDto) => void | Promise<void>;
  initialData?: PromotionDto | null;
  defaultScopeType?: string;
  defaultScopeRefId?: string;
  lockScope?: boolean;
}

export interface DiscountCreateUpdateModalProps extends DiscountModalProps {}

export function DiscountCreateUpdateModal({
  isOpen,
  onClose,
  onSaveSuccess,
  initialData,
  defaultScopeType = "GLOBAL",
  defaultScopeRefId,
  lockScope = false,
}: DiscountModalProps) {
  const { t } = useI18n();

  const [selectedScopes, setSelectedScopes] = useState<PromotionScopeFormValue[]>([
    { scopeType: defaultScopeType, scopeRefId: defaultScopeRefId || "" },
  ]);

  const {
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DiscountFormValues>({
    resolver: zodResolver(discountFormSchema) as any,
    defaultValues: {
      code: "",
      name: "",
      description: "",
      issuanceType: "PUBLIC",
      discountType: "PERCENT",
      discountValue: 10,
      maxDiscountAmount: 0,
      minOrderAmount: 0,
      minDays: 0,
      maxUsageTotal: 0,
      maxUsagePerUser: 1,
      validFrom: new Date().toISOString().slice(0, 10),
      validTo: "",
      active: true,
      scopes: [{ scopeType: defaultScopeType, scopeRefId: defaultScopeRefId || "" }],
    },
  });

  const saveMutation = useSaveDiscount(async (saved) => {
    await onSaveSuccess?.(saved);
    onClose();
  });

  const currentDiscountType = watch("discountType");
  const currentIssuanceType = watch("issuanceType");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const initialScopes: PromotionScopeFormValue[] =
          initialData.scopes && initialData.scopes.length > 0
            ? initialData.scopes.map((s) => ({
                scopeType: s.scopeType || "GLOBAL",
                scopeRefId: s.scopeRefId || "",
              }))
            : [{ scopeType: initialData.scopeType || defaultScopeType, scopeRefId: initialData.scopeRefId || defaultScopeRefId || "" }];

        setSelectedScopes(initialScopes);
        setValue("scopes", initialScopes);

        reset({
          code: initialData.code || "",
          name: initialData.name || "",
          description: initialData.description || "",
          issuanceType: (initialData.issuanceType as "PUBLIC" | "PRIVATE_TARGETED" | "AUTO_REWARD") || "PUBLIC",
          discountType: (initialData.discountType as "PERCENT" | "FIXED_AMOUNT") || "PERCENT",
          discountValue: initialData.discountValue || 0,
          maxDiscountAmount: initialData.maxDiscountAmount || 0,
          minOrderAmount: initialData.minOrderAmount || 0,
          minDays: initialData.minDays || 0,
          maxUsageTotal: initialData.maxUsageTotal || initialData.maxUsage || 0,
          maxUsagePerUser: initialData.maxUsagePerUser || 1,
          validFrom: initialData.validFrom ? initialData.validFrom.slice(0, 10) : "",
          validTo: initialData.validTo ? initialData.validTo.slice(0, 10) : "",
          active: initialData.active !== undefined ? initialData.active : true,
          scopes: initialScopes,
        });
      } else {
        const defaultScopes: PromotionScopeFormValue[] = [
          { scopeType: defaultScopeType, scopeRefId: defaultScopeRefId || "" },
        ];
        setSelectedScopes(defaultScopes);
        setValue("scopes", defaultScopes);

        reset({
          code: "",
          name: "",
          description: "",
          issuanceType: "PUBLIC",
          discountType: "PERCENT",
          discountValue: 10,
          maxDiscountAmount: 0,
          minOrderAmount: 0,
          minDays: 0,
          maxUsageTotal: 0,
          maxUsagePerUser: 1,
          validFrom: new Date().toISOString().slice(0, 10),
          validTo: "",
          active: true,
          scopes: defaultScopes,
        });
      }
    }
  }, [isOpen, initialData, defaultScopeType, defaultScopeRefId, reset, setValue]);

  const handleAddScope = () => {
    const updated = [...selectedScopes, { scopeType: "TOUR", scopeRefId: "" }];
    setSelectedScopes(updated);
    setValue("scopes", updated);
  };

  const handleRemoveScope = (index: number) => {
    if (selectedScopes.length <= 1) return;
    const updated = selectedScopes.filter((_, i) => i !== index);
    setSelectedScopes(updated);
    setValue("scopes", updated);
  };

  const handleScopeTypeChange = (index: number, type: string) => {
    const updated = [...selectedScopes];
    updated[index] = {
      ...updated[index],
      scopeType: type,
      scopeRefId: type === "GLOBAL" ? "" : updated[index].scopeRefId,
    };
    setSelectedScopes(updated);
    setValue("scopes", updated);
  };

  const handleScopeRefIdChange = (index: number, refId: string) => {
    const updated = [...selectedScopes];
    updated[index] = {
      ...updated[index],
      scopeRefId: refId,
    };
    setSelectedScopes(updated);
    setValue("scopes", updated);
  };

  const onSubmit = (values: DiscountFormValues) => {
    const sanitizedScopes = selectedScopes.map((s) => ({
      scopeType: s.scopeType,
      scopeRefId: s.scopeType === "GLOBAL" || !s.scopeRefId?.trim() ? undefined : s.scopeRefId.trim(),
    }));

    const payload: Partial<PromotionDto> = {
      ...values,
      name: values.name.trim(),
      code: values.code?.trim() ? values.code.trim().toUpperCase() : undefined,
      description: values.description?.trim() || undefined,
      maxDiscountAmount: values.maxDiscountAmount && values.maxDiscountAmount > 0 ? values.maxDiscountAmount : undefined,
      minOrderAmount: values.minOrderAmount > 0 ? values.minOrderAmount : undefined,
      minDays: values.minDays > 0 ? values.minDays : undefined,
      maxUsageTotal: values.maxUsageTotal > 0 ? values.maxUsageTotal : undefined,
      maxUsagePerUser: values.maxUsagePerUser > 0 ? values.maxUsagePerUser : 1,
      validFrom: values.validFrom ? `${values.validFrom}T00:00:00` : undefined,
      validTo: values.validTo ? `${values.validTo}T23:59:59` : undefined,
      scopes: sanitizedScopes,
      // Fallback for legacy compatibility
      scopeType: sanitizedScopes[0]?.scopeType || "GLOBAL",
      scopeRefId: sanitizedScopes[0]?.scopeRefId,
    };

    saveMutation.mutate({ id: initialData?.id, data: payload as any });
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold">
                  <Tag size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">
                    {initialData?.id ? t.discounts.editDiscount : t.discounts.addDiscount}
                  </h3>
                  <p className="text-xs text-foreground/60">{t.discounts.description}</p>
                </div>
              </div>
            </ModalHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <ModalBody className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                {saveMutation.isError && (
                  <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900">
                    {saveMutation.error instanceof Error ? saveMutation.error.message : "Có lỗi xảy ra khi lưu"}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <Controller
                    name="name"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField isRequired isInvalid={fieldState.invalid} value={field.value || ""} onChange={field.onChange} className="w-full">
                        <Label isRequired className="text-xs font-bold uppercase tracking-wider mb-1.5 block">
                          {t.discounts.name}
                        </Label>
                        <Input
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          placeholder="Ưu đãi mùa hè 2026"
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] text-xs font-semibold"
                        />
                        <FieldError className="text-[11px] text-rose-500 font-medium mt-1">
                          {fieldState.error?.message}
                        </FieldError>
                      </TextField>
                    )}
                  />

                  {/* Code */}
                  <Controller
                    name="code"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        isRequired={currentIssuanceType === "PUBLIC"}
                        isInvalid={fieldState.invalid}
                        value={field.value || ""}
                        onChange={(val) => field.onChange(val.toUpperCase())}
                        className="w-full"
                      >
                        <Label isRequired={currentIssuanceType === "PUBLIC"} className="text-xs font-bold uppercase tracking-wider mb-1.5 block">
                          {t.discounts.code} {currentIssuanceType !== "PUBLIC" ? "(Tùy chọn)" : ""}
                        </Label>
                        <Input
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          placeholder="SUMMER2026"
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] font-mono font-bold uppercase text-xs"
                        />
                        <FieldError className="text-[11px] text-rose-500 font-medium mt-1">
                          {fieldState.error?.message}
                        </FieldError>
                      </TextField>
                    )}
                  />

                  {/* Issuance Type */}
                  <Controller
                    name="issuanceType"
                    control={control}
                    render={({ field, fieldState }) => (
                      <div className="sm:col-span-2">
                        <Label isRequired className="text-xs font-bold uppercase tracking-wider mb-1.5 block">
                          {t.discounts.issuanceType}
                        </Label>
                        <Select
                          isRequired
                          isInvalid={fieldState.invalid}
                          aria-label={t.discounts.issuanceType}
                          selectedKey={field.value}
                          onSelectionChange={(key) => { if (key) field.onChange(String(key)); }}
                          className="w-full"
                        >
                          <Select.Trigger className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] text-xs font-semibold flex items-center justify-between cursor-pointer w-full shadow-2xs">
                            <Select.Value />
                            <Select.Indicator />
                          </Select.Trigger>
                          <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-50 w-[var(--trigger-width)]">
                            <ListBox>
                              <ListBox.Item key="PUBLIC" id="PUBLIC" textValue={t.discounts.public}>
                                <div className="flex flex-col">
                                  <span className="font-bold text-xs">{t.discounts.public}</span>
                                  <span className="text-[11px] text-foreground/50">Bất kỳ khách hàng nào cũng có thể nhập và dùng</span>
                                </div>
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                              <ListBox.Item key="PRIVATE_TARGETED" id="PRIVATE_TARGETED" textValue={t.discounts.privateTargeted}>
                                <div className="flex flex-col">
                                  <span className="font-bold text-xs">{t.discounts.privateTargeted}</span>
                                  <span className="text-[11px] text-foreground/50">Chỉ khách hàng được Admin cấp quyền mới được áp dụng</span>
                                </div>
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                              <ListBox.Item key="AUTO_REWARD" id="AUTO_REWARD" textValue={t.discounts.autoReward}>
                                <div className="flex flex-col">
                                  <span className="font-bold text-xs">{t.discounts.autoReward}</span>
                                  <span className="text-[11px] text-foreground/50">Tự động phát khi đạt cột mốc đơn đặt hoặc sinh nhật</span>
                                </div>
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            </ListBox>
                          </Select.Popover>
                        </Select>
                      </div>
                    )}
                  />

                  {/* Description (Full Width) */}
                  <div className="sm:col-span-2">
                    <Controller
                      name="description"
                      control={control}
                      render={({ field, fieldState }) => (
                        <TextField isInvalid={fieldState.invalid} value={field.value || ""} onChange={field.onChange} className="w-full">
                          <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">
                            {t.discounts.desc}
                          </Label>
                          <Input
                            name={field.name}
                            ref={field.ref}
                            onBlur={field.onBlur}
                            placeholder="Mô tả chi tiết chương trình ưu đãi..."
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] text-xs font-semibold"
                          />
                          <FieldError className="text-[11px] text-rose-500 font-medium mt-1">
                            {fieldState.error?.message}
                          </FieldError>
                        </TextField>
                      )}
                    />
                  </div>

                  {/* Scopes Section (Multi-scope) */}
                  <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers size={15} className="text-accent" />
                        <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                          {t.discounts.scopes}
                        </span>
                      </div>
                      {!lockScope && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={handleAddScope}
                          className="text-xs font-bold text-accent cursor-pointer flex items-center gap-1 p-1 h-auto"
                        >
                          <Plus size={13} />
                          {t.discounts.addScope}
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      {selectedScopes.map((scopeItem, idx) => (
                        <div
                          key={`scope-row-${idx}`}
                          className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white dark:bg-[var(--bg-surface)] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs"
                        >
                          <div className={clsx(scopeItem.scopeType !== "GLOBAL" ? "sm:col-span-6" : "sm:col-span-11")}>
                            <Select
                              aria-label={t.discounts.scopeType}
                              selectedKey={scopeItem.scopeType}
                              onSelectionChange={(k) => { if (k) handleScopeTypeChange(idx, String(k)); }}
                              isDisabled={lockScope}
                              className="w-full"
                            >
                              <Select.Trigger className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center justify-between cursor-pointer w-full">
                                <Select.Value />
                                <Select.Indicator />
                              </Select.Trigger>
                              <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-50 w-[var(--trigger-width)]">
                                <ListBox>
                                  <ListBox.Item key="GLOBAL" id="GLOBAL" textValue={t.discounts.scopeGlobal}>
                                    {t.discounts.scopeGlobal}
                                    <ListBox.ItemIndicator />
                                  </ListBox.Item>
                                  <ListBox.Item key="TOUR" id="TOUR" textValue={t.discounts.scopeTour}>
                                    {t.discounts.scopeTour}
                                    <ListBox.ItemIndicator />
                                  </ListBox.Item>
                                  <ListBox.Item key="SELF_DRIVE" id="SELF_DRIVE" textValue={t.discounts.scopeSelfDrive}>
                                    {t.discounts.scopeSelfDrive}
                                    <ListBox.ItemIndicator />
                                  </ListBox.Item>
                                  <ListBox.Item key="INTERCITY_ROUTE" id="INTERCITY_ROUTE" textValue={t.discounts.scopeRoute}>
                                    {t.discounts.scopeRoute}
                                    <ListBox.ItemIndicator />
                                  </ListBox.Item>
                                  <ListBox.Item key="AIRPORT_TRANSFER" id="AIRPORT_TRANSFER" textValue={t.discounts.scopeAirport}>
                                    {t.discounts.scopeAirport}
                                    <ListBox.ItemIndicator />
                                  </ListBox.Item>
                                  <ListBox.Item key="SHARED_ROUTE" id="SHARED_ROUTE" textValue="Xe ghép / xe chung tuyến">
                                    Xe ghép / xe chung tuyến
                                    <ListBox.ItemIndicator />
                                  </ListBox.Item>
                                </ListBox>
                              </Select.Popover>
                            </Select>
                          </div>

                          {scopeItem.scopeType !== "GLOBAL" && (
                            <div className="sm:col-span-5">
                              <Input
                                value={scopeItem.scopeRefId || ""}
                                onChange={(e) => handleScopeRefIdChange(idx, e.target.value)}
                                disabled={lockScope}
                                placeholder="ID mục (Để trống = Cả module)"
                                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-card)] font-mono text-xs font-semibold"
                              />
                            </div>
                          )}

                          {!lockScope && selectedScopes.length > 1 && (
                            <div className="sm:col-span-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleRemoveScope(idx)}
                                className="p-1.5 text-foreground/50 hover:text-rose-500 rounded-lg cursor-pointer border-none bg-transparent"
                                aria-label="Remove scope"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Discount Type & Value */}
                  <Controller
                    name="discountType"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <Label isRequired className="text-xs font-bold uppercase tracking-wider mb-1.5 block">
                          {t.discounts.discountType}
                        </Label>
                        <div className="flex p-1 bg-slate-100 dark:bg-[var(--bg-card)] rounded-xl border border-slate-200 dark:border-slate-800 h-10 gap-1">
                          <button
                            type="button"
                            onClick={() => field.onChange("PERCENT")}
                            className={clsx(
                              "flex-1 rounded-lg text-xs font-bold transition-all cursor-pointer border-none flex items-center justify-center gap-1",
                              field.value === "PERCENT"
                                ? "bg-accent text-accent-foreground shadow-xs"
                                : "text-foreground/70 hover:text-foreground bg-transparent"
                            )}
                          >
                            {t.discounts.percent}
                          </button>
                          <button
                            type="button"
                            onClick={() => field.onChange("FIXED_AMOUNT")}
                            className={clsx(
                              "flex-1 rounded-lg text-xs font-bold transition-all cursor-pointer border-none flex items-center justify-center gap-1",
                              field.value === "FIXED_AMOUNT"
                                ? "bg-accent text-accent-foreground shadow-xs"
                                : "text-foreground/70 hover:text-foreground bg-transparent"
                            )}
                          >
                            {t.discounts.fixedAmount}
                          </button>
                        </div>
                      </div>
                    )}
                  />

                  <Controller
                    name="discountValue"
                    control={control}
                    render={({ field, fieldState }) => (
                      <NumberField
                        isRequired
                        isInvalid={fieldState.invalid}
                        minValue={0}
                        maxValue={currentDiscountType === "PERCENT" ? 100 : undefined}
                        step={currentDiscountType === "PERCENT" ? 1 : 10000}
                        value={field.value}
                        onChange={(val) => field.onChange(typeof val === "number" && !isNaN(val) ? val : 0)}
                        className="w-full"
                      >
                        <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">
                          {t.discounts.discountValue} ({currentDiscountType === "PERCENT" ? "%" : "VND"})
                        </Label>
                        <NumberField.Group className="h-10 bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl">
                          <NumberField.DecrementButton />
                          <NumberField.Input className="font-extrabold text-accent text-sm text-center" />
                          <NumberField.IncrementButton />
                        </NumberField.Group>
                        <FieldError className="text-[11px] text-rose-500 font-medium mt-1">
                          {fieldState.error?.message}
                        </FieldError>
                      </NumberField>
                    )}
                  />

                  {/* Max Discount Amount (Only for PERCENT) */}
                  {currentDiscountType === "PERCENT" && (
                    <Controller
                      name="maxDiscountAmount"
                      control={control}
                      render={({ field }) => (
                        <NumberField
                          minValue={0}
                          step={10000}
                          value={field.value || 0}
                          onChange={(val) => field.onChange(typeof val === "number" && !isNaN(val) ? val : 0)}
                          className="w-full"
                        >
                          <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">
                            {t.discounts.maxDiscountAmount}
                          </Label>
                          <NumberField.Group className="h-10 bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl">
                            <NumberField.DecrementButton />
                            <NumberField.Input placeholder="0 = Không giới hạn trần" className="font-semibold text-xs text-center" />
                            <NumberField.IncrementButton />
                          </NumberField.Group>
                        </NumberField>
                      )}
                    />
                  )}

                  {/* Minimum order */}
                  <Controller
                    name="minOrderAmount"
                    control={control}
                    render={({ field }) => (
                      <NumberField
                        minValue={0}
                        step={10000}
                        value={field.value}
                        onChange={(val) => field.onChange(typeof val === "number" && !isNaN(val) ? val : 0)}
                        className="w-full"
                      >
                        <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">
                          {t.discounts.minOrderAmount} (VND)
                        </Label>
                        <NumberField.Group className="h-10 bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl">
                          <NumberField.DecrementButton />
                          <NumberField.Input className="font-semibold text-xs text-center" />
                          <NumberField.IncrementButton />
                        </NumberField.Group>
                      </NumberField>
                    )}
                  />

                  {/* Usage Limits */}
                  <Controller
                    name="maxUsageTotal"
                    control={control}
                    render={({ field }) => (
                      <NumberField
                        minValue={0}
                        step={1}
                        value={field.value}
                        onChange={(val) => field.onChange(typeof val === "number" && !isNaN(val) ? val : 0)}
                        className="w-full"
                      >
                        <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">
                          {t.discounts.maxUsage}
                        </Label>
                        <NumberField.Group className="h-10 bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl">
                          <NumberField.DecrementButton />
                          <NumberField.Input placeholder="0 = Không giới hạn" className="font-semibold text-xs text-center" />
                          <NumberField.IncrementButton />
                        </NumberField.Group>
                      </NumberField>
                    )}
                  />

                  <Controller
                    name="maxUsagePerUser"
                    control={control}
                    render={({ field }) => (
                      <NumberField
                        minValue={1}
                        step={1}
                        value={field.value}
                        onChange={(val) => field.onChange(typeof val === "number" && !isNaN(val) ? val : 1)}
                        className="w-full"
                      >
                        <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">
                          {t.discounts.maxUsagePerUser}
                        </Label>
                        <NumberField.Group className="h-10 bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl">
                          <NumberField.DecrementButton />
                          <NumberField.Input className="font-semibold text-xs text-center" />
                          <NumberField.IncrementButton />
                        </NumberField.Group>
                      </NumberField>
                    )}
                  />

                  {/* Valid Dates */}
                  <Controller
                    name="validFrom"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        className="w-full"
                        value={parseDateSafe(field.value)}
                        onChange={(val) => {
                          if (val) {
                            const d = val as DateValue;
                            field.onChange(`${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`);
                          } else {
                            field.onChange("");
                          }
                        }}
                      >
                        <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">
                          {t.discounts.validFrom}
                        </Label>
                        <DateField.Group fullWidth className="h-10 bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex items-center justify-between">
                          <DateField.Input className="text-xs font-semibold bg-transparent border-none outline-none">
                            {(segment) => <DateField.Segment segment={segment} />}
                          </DateField.Input>
                          <DateField.Suffix>
                            <DatePicker.Trigger className="cursor-pointer">
                              <DatePicker.TriggerIndicator />
                            </DatePicker.Trigger>
                          </DateField.Suffix>
                        </DateField.Group>
                        <DatePicker.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-50">
                          <Calendar aria-label={t.discounts.validFrom}>
                            <Calendar.Header className="flex items-center justify-between mb-2">
                              <Calendar.YearPickerTrigger className="text-xs font-bold flex items-center gap-1 cursor-pointer">
                                <Calendar.YearPickerTriggerHeading />
                                <Calendar.YearPickerTriggerIndicator />
                              </Calendar.YearPickerTrigger>
                              <div className="flex gap-1">
                                <Calendar.NavButton slot="previous" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer" />
                                <Calendar.NavButton slot="next" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer" />
                              </div>
                            </Calendar.Header>
                            <Calendar.Grid className="w-full">
                              <Calendar.GridHeader className="text-foreground/50 text-[10px] font-bold">
                                {(day) => <Calendar.HeaderCell className="w-8 h-8 text-center">{day}</Calendar.HeaderCell>}
                              </Calendar.GridHeader>
                              <Calendar.GridBody>
                                {(date) => (
                                  <Calendar.Cell
                                    date={date}
                                    className="w-8 h-8 text-xs font-semibold text-center cursor-pointer rounded-lg hover:bg-accent/10 hover:text-accent aria-selected:bg-accent aria-selected:text-accent-foreground"
                                  />
                                )}
                              </Calendar.GridBody>
                            </Calendar.Grid>
                          </Calendar>
                        </DatePicker.Popover>
                      </DatePicker>
                    )}
                  />

                  <Controller
                    name="validTo"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        className="w-full"
                        value={parseDateSafe(field.value)}
                        onChange={(val) => {
                          if (val) {
                            const d = val as DateValue;
                            field.onChange(`${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`);
                          } else {
                            field.onChange("");
                          }
                        }}
                      >
                        <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">
                          {t.discounts.validTo}
                        </Label>
                        <DateField.Group fullWidth className="h-10 bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex items-center justify-between">
                          <DateField.Input className="text-xs font-semibold bg-transparent border-none outline-none">
                            {(segment) => <DateField.Segment segment={segment} />}
                          </DateField.Input>
                          <DateField.Suffix>
                            <DatePicker.Trigger className="cursor-pointer">
                              <DatePicker.TriggerIndicator />
                            </DatePicker.Trigger>
                          </DateField.Suffix>
                        </DateField.Group>
                        <DatePicker.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-50">
                          <Calendar aria-label={t.discounts.validTo}>
                            <Calendar.Header className="flex items-center justify-between mb-2">
                              <Calendar.YearPickerTrigger className="text-xs font-bold flex items-center gap-1 cursor-pointer">
                                <Calendar.YearPickerTriggerHeading />
                                <Calendar.YearPickerTriggerIndicator />
                              </Calendar.YearPickerTrigger>
                              <div className="flex gap-1">
                                <Calendar.NavButton slot="previous" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer" />
                                <Calendar.NavButton slot="next" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer" />
                              </div>
                            </Calendar.Header>
                            <Calendar.Grid className="w-full">
                              <Calendar.GridHeader className="text-foreground/50 text-[10px] font-bold">
                                {(day) => <Calendar.HeaderCell className="w-8 h-8 text-center">{day}</Calendar.HeaderCell>}
                              </Calendar.GridHeader>
                              <Calendar.GridBody>
                                {(date) => (
                                  <Calendar.Cell
                                    date={date}
                                    className="w-8 h-8 text-xs font-semibold text-center cursor-pointer rounded-lg hover:bg-accent/10 hover:text-accent aria-selected:bg-accent aria-selected:text-accent-foreground"
                                  />
                                )}
                              </Calendar.GridBody>
                            </Calendar.Grid>
                          </Calendar>
                        </DatePicker.Popover>
                      </DatePicker>
                    )}
                  />

                  {/* Active Toggle */}
                  <Controller
                    name="active"
                    control={control}
                    render={({ field }) => (
                      <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200/80 dark:border-slate-800">
                        <Label className="text-xs font-bold uppercase tracking-wider cursor-pointer">
                          {t.discounts.status}
                        </Label>
                        <Switch
                          isSelected={field.value}
                          onChange={(isSelected) => field.onChange(isSelected)}
                          aria-label={t.discounts.status}
                        >
                          <SwitchContent className={`flex items-center gap-2 ${field.value ? 'text-emerald-500' : 'text-rose-500'}`}>
                            <Switch.Control>
                              <Switch.Thumb />
                            </Switch.Control>
                            {field.value ? t.discounts.active : t.discounts.inactive}
                          </SwitchContent>
                        </Switch>
                      </div>
                    )}
                  />
                </div>
              </ModalBody>

              <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
                <Button
                  variant="outline"
                  onClick={onClose}
                  isDisabled={saveMutation.isPending}
                  className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-foreground/80 transition-colors cursor-pointer"
                >
                  {t.common.cancel}
                </Button>
                <Button
                  type="submit"
                  isDisabled={saveMutation.isPending}
                  className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
                >
                  {saveMutation.isPending ? (
                    <RefreshCw size={15} className="animate-spin mr-1.5" />
                  ) : (
                    <Save size={15} className="mr-1.5" />
                  )}
                  {initialData?.id ? t.common.confirm : t.discounts.addDiscount}
                </Button>
              </ModalFooter>
            </form>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}

export { DiscountCreateUpdateModal as DiscountModal };
