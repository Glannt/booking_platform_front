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
  Button,
  Input,
  Label,
  NumberField,
  Select,
  ListBox,
  Switch,
  Calendar,
  DateField,
  DatePicker,
  TimeField,
  Checkbox,
  toast,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { X, Sparkles, Code2 } from "lucide-react";
import { SurchargeRuleDto } from "@/lib/api/surcharge";
import { formatTimeToString, parseTimeString } from "@/lib/format";
import { useI18n } from "@/context/LanguageContext";

interface SurchargeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: Partial<SurchargeRuleDto>) => Promise<void>;
  initialData?: SurchargeRuleDto | null;
  loading?: boolean;
}

const DAYS_OF_WEEK = [
  { key: "MONDAY", label: "T2 (Mon)" },
  { key: "TUESDAY", label: "T3 (Tue)" },
  { key: "WEDNESDAY", label: "T4 (Wed)" },
  { key: "THURSDAY", label: "T5 (Thu)" },
  { key: "FRIDAY", label: "T6 (Fri)" },
  { key: "SATURDAY", label: "T7 (Sat)" },
  { key: "SUNDAY", label: "CN (Sun)" },
];

export function SurchargeFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}: SurchargeFormModalProps) {
  const { t } = useI18n();
  const tr = t.surchargeEngine;

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [calculationType, setCalculationType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [calculationBase, setCalculationBase] = useState<"BASE_PRICE" | "RUNNING_TOTAL">("BASE_PRICE");
  const [value, setValue] = useState<number>(10);
  const [currency, setCurrency] = useState("VND");
  const [priority, setPriority] = useState<number>(0);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [active, setActive] = useState(true);

  // Condition State
  const [condType, setCondType] = useState<string>("date_range");
  const [fromTime, setFromTime] = useState("22:00");
  const [toTime, setToTime] = useState("05:00");
  const [fromDate, setFromDate] = useState("01-20");
  const [toDate, setToDate] = useState("02-15");
  const [selectedDays, setSelectedDays] = useState<string[]>(["SATURDAY", "SUNDAY"]);
  const [rawJson, setRawJson] = useState("");
  const [isRawJsonMode, setIsRawJsonMode] = useState(false);

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code || "");
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setCalculationType(initialData.calculationType || "PERCENT");
      setCalculationBase(initialData.calculationBase || "BASE_PRICE");
      setValue(initialData.value || 0);
      setCurrency(initialData.currency || "VND");
      setPriority(initialData.priority || 0);
      setEffectiveFrom(initialData.effectiveFrom || "");
      setEffectiveTo(initialData.effectiveTo || "");
      setActive(initialData.active !== undefined ? initialData.active : true);

      if (initialData.condition) {
        const cond = initialData.condition;
        setRawJson(JSON.stringify(cond, null, 2));
        const type = cond.type || "custom";
        setCondType(type);

        if (type === "time_range") {
          setFromTime(cond.from || "22:00");
          setToTime(cond.to || "05:00");
        } else if (type === "date_range" || type === "seasonal") {
          setFromDate(cond.from || "01-20");
          setToDate(cond.to || "02-15");
        } else if (type === "day_of_week" && Array.isArray(cond.days)) {
          setSelectedDays(cond.days);
        } else {
          setIsRawJsonMode(true);
        }
      } else {
        setCondType("date_range");
        setRawJson("");
        setIsRawJsonMode(false);
      }
    } else {
      setCode("");
      setName("");
      setDescription("");
      setCalculationType("PERCENT");
      setCalculationBase("BASE_PRICE");
      setValue(10);
      setCurrency("VND");
      setPriority(0);
      setEffectiveFrom("");
      setEffectiveTo("");
      setActive(true);
      setCondType("date_range");
      setFromTime("22:00");
      setToTime("05:00");
      setFromDate("01-20");
      setToDate("02-15");
      setSelectedDays(["SATURDAY", "SUNDAY"]);
      setRawJson("");
      setIsRawJsonMode(false);
    }
  }, [initialData, isOpen]);

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const buildConditionJson = () => {
    if (isRawJsonMode) {
      if (!rawJson.trim()) return null;
      try {
        return JSON.parse(rawJson);
      } catch {
        throw new Error("JSON điều kiện không hợp lệ!");
      }
    }

    if (condType === "time_range") {
      return { type: "time_range", from: fromTime, to: toTime };
    }
    if (condType === "date_range" || condType === "seasonal") {
      return { type: "date_range", from: fromDate, to: toDate };
    }
    if (condType === "day_of_week") {
      return { type: "day_of_week", days: selectedDays };
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      toast.danger("Vui lòng điền mã và tên phụ thu!");
      return;
    }

    let conditionObj;
    try {
      conditionObj = buildConditionJson();
    } catch (err: any) {
      toast.danger(err.message || "Lỗi cú pháp JSON điều kiện");
      return;
    }

    const dto: Partial<SurchargeRuleDto> = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim() || undefined,
      calculationType,
      calculationBase,
      value: Number(value),
      currency: currency.trim() || "VND",
      priority: Number(priority),
      effectiveFrom: effectiveFrom || undefined,
      effectiveTo: effectiveTo || undefined,
      active,
      condition: conditionObj,
    };

    await onSubmit(dto);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalBackdrop>
        <ModalContainer>
          <ModalDialog className="w-full max-w-2xl bg-white dark:bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {initialData ? tr.editRule : tr.createRule}
                </h2>
              </div>
            </ModalHeader>

            <ModalBody className="p-6 max-h-[80vh] overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Row 1: Code + Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                      {tr.code} <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="VD: SPRING_SURCHARGE, NIGHT_FEE"
                      required
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[var(--bg-surface)] text-sm font-semibold uppercase text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                      {tr.name} <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="VD: Phụ thu Tết Nguyên Đán, Phụ thu đêm"
                      required
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[var(--bg-surface)] text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                    {tr.descriptionLabel}
                  </Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả chi tiết mục đích và phạm vi áp dụng..."
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[var(--bg-surface)] text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Calculation Type & Base */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                      {tr.calcType}
                    </Label>
                    <Select
                      selectedKey={calculationType}
                      onSelectionChange={(key) => {
                        if (key) setCalculationType(key as "PERCENT" | "FIXED");
                      }}
                      className="w-full"
                    >
                      <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[var(--bg-surface)] text-slate-800 dark:text-slate-100 text-sm font-bold flex items-center justify-between cursor-pointer h-[40px]">
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover className="bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                        <ListBox>
                          <ListBox.Item key="PERCENT" id="PERCENT" textValue={tr.percent} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-800 dark:text-slate-100 flex items-center justify-between">
                            {tr.percent}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                          <ListBox.Item key="FIXED" id="FIXED" textValue={tr.fixed} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-800 dark:text-slate-100 flex items-center justify-between">
                            {tr.fixed}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                      {tr.calcBase}
                    </Label>
                    <Select
                      selectedKey={calculationBase}
                      onSelectionChange={(key) => {
                        if (key) setCalculationBase(key as "BASE_PRICE" | "RUNNING_TOTAL");
                      }}
                      className="w-full"
                    >
                      <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[var(--bg-surface)] text-slate-800 dark:text-slate-100 text-sm font-bold flex items-center justify-between cursor-pointer h-[40px]">
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover className="bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                        <ListBox>
                          <ListBox.Item key="BASE_PRICE" id="BASE_PRICE" textValue={tr.basePrice} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-800 dark:text-slate-100 flex items-center justify-between">
                            {tr.basePrice}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                          <ListBox.Item key="RUNNING_TOTAL" id="RUNNING_TOTAL" textValue={tr.runningTotal} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-800 dark:text-slate-100 flex items-center justify-between">
                            {tr.runningTotal}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>
                </div>

                {/* Value + Currency + Priority */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                      {tr.value} ({calculationType === "PERCENT" ? "%" : currency}) <span className="text-rose-500">*</span>
                    </Label>
                    <NumberField
                      minValue={0}
                      value={value}
                      onChange={(val) => setValue(val ?? 0)}
                      isRequired
                    >
                      <NumberField.Group className="flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[var(--bg-surface)] overflow-hidden focus-within:ring-2 focus-within:ring-primary h-10">
                        <NumberField.Input className="flex-1 bg-transparent px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none border-none h-full cursor-text" />
                        <NumberField.IncrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer bg-transparent">
                          ▲
                        </NumberField.IncrementButton>
                        <NumberField.DecrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer bg-transparent border-t border-slate-200 dark:border-slate-700">
                          ▼
                        </NumberField.DecrementButton>
                      </NumberField.Group>
                    </NumberField>
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                      Đơn vị tiền tệ
                    </Label>
                    <Input
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      placeholder="VND"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[var(--bg-surface)] text-sm text-slate-800 dark:text-slate-100 outline-none uppercase"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                      {tr.priority}
                    </Label>
                    <NumberField
                      minValue={0}
                      step={1}
                      value={priority}
                      onChange={(val) => setPriority(val ?? 0)}
                    >
                      <NumberField.Group className="flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[var(--bg-surface)] overflow-hidden focus-within:ring-2 focus-within:ring-primary h-10">
                        <NumberField.Input className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none border-none h-full cursor-text" />
                        <NumberField.IncrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer bg-transparent">
                          ▲
                        </NumberField.IncrementButton>
                        <NumberField.DecrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer bg-transparent border-t border-slate-200 dark:border-slate-700">
                          ▼
                        </NumberField.DecrementButton>
                      </NumberField.Group>
                    </NumberField>
                  </div>
                </div>

                {/* Condition Section */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[var(--bg-surface)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {tr.condition}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRawJsonMode(!isRawJsonMode)}
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      {isRawJsonMode ? "Chuyển sang Visual Builder" : "Chuyển sang Raw JSON"}
                    </button>
                  </div>

                  {isRawJsonMode ? (
                    <div>
                      <Label className="text-[11px] text-slate-500 mb-1 block">
                        {tr.conditionJson}
                      </Label>
                      <textarea
                        value={rawJson}
                        onChange={(e) => setRawJson(e.target.value)}
                        placeholder='{"type": "date_range", "from": "01-20", "to": "02-15"}'
                        rows={4}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--bg-card)] font-mono text-xs text-slate-800 dark:text-slate-100 outline-none"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-slate-600 dark:text-slate-300 mb-1 block">
                          {tr.conditionType}
                        </Label>
                        <Select
                          selectedKey={condType}
                          onSelectionChange={(key) => {
                            if (key) setCondType(key as string);
                          }}
                          className="w-full"
                        >
                          <Select.Trigger className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--bg-card)] text-slate-800 dark:text-slate-100 text-xs font-semibold flex items-center justify-between cursor-pointer h-[36px]">
                            <Select.Value />
                            <Select.Indicator />
                          </Select.Trigger>
                          <Select.Popover className="bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                            <ListBox>
                              <ListBox.Item key="date_range" id="date_range" textValue={tr.dateRange} className="px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-800 dark:text-slate-100 flex items-center justify-between">
                                {tr.dateRange}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                              <ListBox.Item key="time_range" id="time_range" textValue={tr.timeRange} className="px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-800 dark:text-slate-100 flex items-center justify-between">
                                {tr.timeRange}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                              <ListBox.Item key="day_of_week" id="day_of_week" textValue={tr.dayOfWeek} className="px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-800 dark:text-slate-100 flex items-center justify-between">
                                {tr.dayOfWeek}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            </ListBox>
                          </Select.Popover>
                        </Select>
                      </div>

                      {condType === "date_range" && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-[11px] text-slate-500 mb-1 block">
                              {tr.fromDate} (MM-dd hoặc YYYY-MM-DD)
                            </Label>
                            <Input
                              value={fromDate}
                              onChange={(e) => setFromDate(e.target.value)}
                              placeholder="01-20"
                              className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--bg-card)] text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px] text-slate-500 mb-1 block">
                              {tr.toDate} (MM-dd hoặc YYYY-MM-DD)
                            </Label>
                            <Input
                              value={toDate}
                              onChange={(e) => setToDate(e.target.value)}
                              placeholder="02-15"
                              className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--bg-card)] text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {condType === "time_range" && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-[11px] text-slate-500 mb-1 block">
                              {tr.fromTime} (HH:mm)
                            </Label>
                            <TimeField
                              value={parseTimeString(fromTime)}
                              onChange={(val) => setFromTime(formatTimeToString(val))}
                              aria-label={tr.fromTime}
                            >
                              <TimeField.Group className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--bg-card)] text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center">
                                <TimeField.Input className="w-full bg-transparent outline-none text-xs font-semibold">
                                  {(segment) => <TimeField.Segment segment={segment} />}
                                </TimeField.Input>
                              </TimeField.Group>
                            </TimeField>
                          </div>
                          <div>
                            <Label className="text-[11px] text-slate-500 mb-1 block">
                              {tr.toTime} (HH:mm)
                            </Label>
                            <TimeField
                              value={parseTimeString(toTime)}
                              onChange={(val) => setToTime(formatTimeToString(val))}
                              aria-label={tr.toTime}
                            >
                              <TimeField.Group className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--bg-card)] text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center">
                                <TimeField.Input className="w-full bg-transparent outline-none text-xs font-semibold">
                                  {(segment) => <TimeField.Segment segment={segment} />}
                                </TimeField.Input>
                              </TimeField.Group>
                            </TimeField>
                          </div>
                        </div>
                      )}

                      {condType === "day_of_week" && (
                        <div>
                          <Label className="text-[11px] text-slate-500 mb-1 block">
                            {tr.days}
                          </Label>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {DAYS_OF_WEEK.map((day) => (
                              <button
                                key={day.key}
                                type="button"
                                onClick={() => toggleDay(day.key)}
                                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${selectedDays.includes(day.key)
                                  ? "bg-primary text-white"
                                  : "bg-slate-200 dark:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                                  }`}
                              >
                                {day.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Effective Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                        Hiệu lực từ ngày (Tùy chọn)
                      </Label>
                      {effectiveFrom && (
                        <button
                          type="button"
                          onClick={() => setEffectiveFrom("")}
                          title="Xóa ngày"
                          className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <DatePicker
                      className="w-full"
                      value={effectiveFrom ? parseDate(effectiveFrom) : undefined}
                      onChange={(val) => {
                        if (val) {
                          setEffectiveFrom(`${val.year}-${String(val.month).padStart(2, "0")}-${String(val.day).padStart(2, "0")}`);
                        }
                      }}
                    >
                      <DateField.Group fullWidth className="h-10 bg-slate-50 dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-700 rounded-xl px-3 flex items-center justify-between">
                        <DateField.Input className="text-xs font-semibold bg-transparent border-none outline-none">
                          {(segment) => <DateField.Segment segment={segment} />}
                        </DateField.Input>
                        <DateField.Suffix>
                          <DatePicker.Trigger className="cursor-pointer">
                            <DatePicker.TriggerIndicator />
                          </DatePicker.Trigger>
                        </DateField.Suffix>
                      </DateField.Group>
                      <DatePicker.Popover className="bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-50">
                        <Calendar aria-label="Hiệu lực từ ngày">
                          <Calendar.Header className="flex items-center justify-between mb-2">
                            <Calendar.YearPickerTrigger className="text-xs font-bold flex items-center gap-1 cursor-pointer">
                              <Calendar.YearPickerTriggerHeading />
                              <Calendar.YearPickerTriggerIndicator />
                            </Calendar.YearPickerTrigger>
                            <div className="flex gap-1">
                              <Calendar.NavButton slot="previous" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer" />
                              <Calendar.NavButton slot="next" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer" />
                            </div>
                          </Calendar.Header>
                          <Calendar.Grid className="w-full">
                            <Calendar.GridHeader className="text-slate-400 text-[10px] font-bold">
                              {(day) => <Calendar.HeaderCell className="w-8 h-8 text-center">{day}</Calendar.HeaderCell>}
                            </Calendar.GridHeader>
                            <Calendar.GridBody>
                              {(date) => (
                                <Calendar.Cell
                                  date={date}
                                  className="w-8 h-8 text-xs font-semibold text-center cursor-pointer rounded-lg hover:bg-accent/10 hover:text-accent aria-selected:bg-accent aria-selected:text-white"
                                />
                              )}
                            </Calendar.GridBody>
                          </Calendar.Grid>
                          <Calendar.YearPickerGrid className="w-full mt-2 border-t pt-2">
                            <Calendar.YearPickerGridBody>
                              {({ year }) => (
                                <Calendar.YearPickerCell
                                  year={year}
                                  className="text-xs font-semibold px-2 py-1 cursor-pointer hover:bg-slate-100 rounded"
                                />
                              )}
                            </Calendar.YearPickerGridBody>
                          </Calendar.YearPickerGrid>
                        </Calendar>
                      </DatePicker.Popover>
                    </DatePicker>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                        Hiệu lực đến ngày (Tùy chọn)
                      </Label>
                      {effectiveTo && (
                        <button
                          type="button"
                          onClick={() => setEffectiveTo("")}
                          title="Xóa ngày"
                          className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <DatePicker
                      className="w-full"
                      value={effectiveTo ? parseDate(effectiveTo) : undefined}
                      onChange={(val) => {
                        if (val) {
                          setEffectiveTo(`${val.year}-${String(val.month).padStart(2, "0")}-${String(val.day).padStart(2, "0")}`);
                        }
                      }}
                    >
                      <DateField.Group fullWidth className="h-10 bg-slate-50 dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-700 rounded-xl px-3 flex items-center justify-between">
                        <DateField.Input className="text-xs font-semibold bg-transparent border-none outline-none">
                          {(segment) => <DateField.Segment segment={segment} />}
                        </DateField.Input>
                        <DateField.Suffix>
                          <DatePicker.Trigger className="cursor-pointer">
                            <DatePicker.TriggerIndicator />
                          </DatePicker.Trigger>
                        </DateField.Suffix>
                      </DateField.Group>
                      <DatePicker.Popover className="bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-50">
                        <Calendar aria-label="Hiệu lực đến ngày">
                          <Calendar.Header className="flex items-center justify-between mb-2">
                            <Calendar.YearPickerTrigger className="text-xs font-bold flex items-center gap-1 cursor-pointer">
                              <Calendar.YearPickerTriggerHeading />
                              <Calendar.YearPickerTriggerIndicator />
                            </Calendar.YearPickerTrigger>
                            <div className="flex gap-1">
                              <Calendar.NavButton slot="previous" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer" />
                              <Calendar.NavButton slot="next" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer" />
                            </div>
                          </Calendar.Header>
                          <Calendar.Grid className="w-full">
                            <Calendar.GridHeader className="text-slate-400 text-[10px] font-bold">
                              {(day) => <Calendar.HeaderCell className="w-8 h-8 text-center">{day}</Calendar.HeaderCell>}
                            </Calendar.GridHeader>
                            <Calendar.GridBody>
                              {(date) => (
                                <Calendar.Cell
                                  date={date}
                                  className="w-8 h-8 text-xs font-semibold text-center cursor-pointer rounded-lg hover:bg-accent/10 hover:text-accent aria-selected:bg-accent aria-selected:text-white"
                                />
                              )}
                            </Calendar.GridBody>
                          </Calendar.Grid>
                          <Calendar.YearPickerGrid className="w-full mt-2 border-t pt-2">
                            <Calendar.YearPickerGridBody>
                              {({ year }) => (
                                <Calendar.YearPickerCell
                                  year={year}
                                  className="text-xs font-semibold px-2 py-1 cursor-pointer hover:bg-slate-100 rounded"
                                />
                              )}
                            </Calendar.YearPickerGridBody>
                          </Calendar.YearPickerGrid>
                        </Calendar>
                      </DatePicker.Popover>
                    </DatePicker>
                  </div>
                </div>

                {/* Status Switch */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[var(--bg-surface)]">
                  <div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {tr.status}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {active ? tr.active : tr.inactive}
                    </div>
                  </div>
                  <Checkbox isSelected={active} onChange={(val: boolean) => setActive(val)}>
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox.Content>
                  </Checkbox>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="secondary"
                    onPress={onClose}
                    className="px-4 py-2 text-xs font-semibold rounded-xl"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    isDisabled={loading}
                    className="px-5 py-2 text-xs font-bold bg-primary text-white rounded-xl shadow-md shadow-primary/20 hover:opacity-90 transition-opacity"
                  >
                    {loading ? "Đang lưu..." : "Lưu quy tắc"}
                  </Button>
                </div>
              </form>
            </ModalBody>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}