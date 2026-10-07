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
  Label,
  Input,
  NumberField,
  Switch,
} from "@heroui/react";
import { Users, User, Baby, Save, Sparkles, Ruler, Calendar, ShieldCheck } from "lucide-react";
import {
  TourPackageDto,
  TourPackageTranslationDto,
  PriceListPerPersonDto,
  formatPassengerCondition,
} from "@/lib/api/tours";
import { useI18n } from "@/context/LanguageContext";

interface TourPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pkg: TourPackageDto) => void;
  initialData?: TourPackageDto | null;
  language?: string;
}

interface PassengerConditionState {
  price: number;
  applyAge: boolean;
  minAge: number | string;
  maxAge: number | string;
  applyHeight: boolean;
  minHeight: number | string;
  maxHeight: number | string;
}

const LOCALES = ["vi", "en", "ko", "ru"] as const;

export default function TourPackageModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  language = "vi",
}: TourPackageModalProps) {
  const { t } = useI18n();
  const [activeTabLocale, setActiveTabLocale] = useState<string>(language);
  const [isContactOnly, setIsContactOnly] = useState<boolean>(false);
  const [childPolicyNote, setChildPolicyNote] = useState<string>("");
  const [infantPolicyNote, setInfantPolicyNote] = useState<string>("");
  const [active, setActive] = useState<boolean>(true);

  // Deposit for this package. No default: "" (no deposit) until the admin enters a rate/amount,
  // which keeps an unconfigured package at 0đ, the same figure the server charges.
  const [depositType, setDepositType] = useState<"" | "PERCENT" | "FIXED">("");
  const [depositRate, setDepositRate] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<string>("");

  // Per-passenger condition states
  const [adultCond, setAdultCond] = useState<PassengerConditionState>({
    price: 0,
    applyAge: false,
    minAge: 12,
    maxAge: "",
    applyHeight: true,
    minHeight: 130,
    maxHeight: "",
  });

  const [childCond, setChildCond] = useState<PassengerConditionState>({
    price: 0,
    applyAge: false,
    minAge: 5,
    maxAge: 11,
    applyHeight: true,
    minHeight: 100,
    maxHeight: 129,
  });

  const [infantCond, setInfantCond] = useState<PassengerConditionState>({
    price: 0,
    applyAge: false,
    minAge: "",
    maxAge: 4,
    applyHeight: true,
    minHeight: "",
    maxHeight: 99,
  });

  // Multilingual translations for package name
  const [translations, setTranslations] = useState<Record<string, { name: string }>>({
    vi: { name: "" },
    en: { name: "" },
    ko: { name: "" },
    ru: { name: "" },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setIsContactOnly(initialData.isContactOnly || false);

        if (initialData.prices && initialData.prices.length > 0) {
          const adult = initialData.prices.find((p) => p.passengerType === "ADULT");
          const child = initialData.prices.find((p) => p.passengerType === "CHILD");
          const infant = initialData.prices.find((p) => p.passengerType === "INFANT");

          setAdultCond({
            price: adult?.pricePerPerson ?? initialData.adultPrice ?? 0,
            applyAge: adult?.applyAgeCondition ?? false,
            minAge: adult?.minAge ?? (adult?.applyAgeCondition ? "" : 12),
            maxAge: adult?.maxAge ?? "",
            applyHeight: adult?.applyHeightCondition ?? (adult?.minHeight != null || adult?.maxHeight != null),
            minHeight: adult?.minHeight ?? (adult?.applyHeightCondition ? "" : 130),
            maxHeight: adult?.maxHeight ?? "",
          });

          setChildCond({
            price: child?.pricePerPerson ?? initialData.childPrice ?? 0,
            applyAge: child?.applyAgeCondition ?? false,
            minAge: child?.minAge ?? (child?.applyAgeCondition ? "" : 5),
            maxAge: child?.maxAge ?? (child?.applyAgeCondition ? "" : 11),
            applyHeight: child?.applyHeightCondition ?? (child?.minHeight != null || child?.maxHeight != null),
            minHeight: child?.minHeight ?? (child?.applyHeightCondition ? "" : 100),
            maxHeight: child?.maxHeight ?? (child?.applyHeightCondition ? "" : 129),
          });

          setInfantCond({
            price: infant?.pricePerPerson ?? initialData.infantPrice ?? 0,
            applyAge: infant?.applyAgeCondition ?? false,
            minAge: infant?.minAge ?? "",
            maxAge: infant?.maxAge ?? (infant?.applyAgeCondition ? "" : 4),
            applyHeight: infant?.applyHeightCondition ?? (infant?.minHeight != null || infant?.maxHeight != null),
            minHeight: infant?.minHeight ?? "",
            maxHeight: infant?.maxHeight ?? (infant?.applyHeightCondition ? "" : 99),
          });
        } else {
          setAdultCond({
            price: initialData.adultPrice || 0,
            applyAge: false,
            minAge: 12,
            maxAge: "",
            applyHeight: true,
            minHeight: 130,
            maxHeight: "",
          });
          setChildCond({
            price: initialData.childPrice || 0,
            applyAge: false,
            minAge: 5,
            maxAge: 11,
            applyHeight: true,
            minHeight: 100,
            maxHeight: 129,
          });
          setInfantCond({
            price: initialData.infantPrice || 0,
            applyAge: false,
            minAge: "",
            maxAge: 4,
            applyHeight: true,
            minHeight: "",
            maxHeight: 99,
          });
        }

        setChildPolicyNote(initialData.childPolicyNote || "");
        setInfantPolicyNote(initialData.infantPolicyNote || "");
        setActive(initialData.active !== undefined ? initialData.active : true);

        setDepositType(
          initialData.depositType === "PERCENT" || initialData.depositType === "FIXED"
            ? initialData.depositType
            : "",
        );
        setDepositRate(initialData.depositRate != null ? Number(initialData.depositRate) : 0);
        setDepositAmount(initialData.depositAmount != null ? String(initialData.depositAmount) : "");

        const newTrans: Record<string, { name: string }> = {
          vi: { name: "" },
          en: { name: "" },
          ko: { name: "" },
          ru: { name: "" },
        };

        if (initialData.translations && initialData.translations.length > 0) {
          initialData.translations.forEach((tr) => {
            if (newTrans[tr.locale]) {
              newTrans[tr.locale].name = tr.name || "";
            }
          });
        }
        if (!newTrans.vi.name && initialData.code) {
          newTrans.vi.name = initialData.code;
        }

        setTranslations(newTrans);
      } else {
        setIsContactOnly(false);
        setAdultCond({
          price: 0,
          applyAge: false,
          minAge: 12,
          maxAge: "",
          applyHeight: true,
          minHeight: 130,
          maxHeight: "",
        });
        setChildCond({
          price: 0,
          applyAge: false,
          minAge: 5,
          maxAge: 11,
          applyHeight: true,
          minHeight: 100,
          maxHeight: 129,
        });
        setInfantCond({
          price: 0,
          applyAge: false,
          minAge: "",
          maxAge: 4,
          applyHeight: true,
          minHeight: "",
          maxHeight: 99,
        });
        setChildPolicyNote("");
        setInfantPolicyNote("");
        setActive(true);
        setDepositType("");
        setDepositRate(0);
        setDepositAmount("");
        setTranslations({
          vi: { name: "" },
          en: { name: "" },
          ko: { name: "" },
          ru: { name: "" },
        });
      }
      setActiveTabLocale(language);
    }
  }, [isOpen, initialData, language]);

  if (!isOpen) return null;

  const handleTranslationNameChange = (locale: string, val: string) => {
    setTranslations((prev) => ({
      ...prev,
      [locale]: { ...prev[locale], name: val },
    }));
  };

  const parseNumOrNull = (val: number | string | undefined | null): number | null => {
    if (val === "" || val === undefined || val === null) return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
  };

  const toPriceDto = (cond: PassengerConditionState, type: "ADULT" | "CHILD" | "INFANT"): PriceListPerPersonDto => ({
    passengerType: type,
    pricePerPerson: cond.price,
    minPax: 1,
    active: true,
    applyAgeCondition: cond.applyAge,
    minAge: cond.applyAge ? parseNumOrNull(cond.minAge) : null,
    maxAge: cond.applyAge ? parseNumOrNull(cond.maxAge) : null,
    applyHeightCondition: cond.applyHeight,
    minHeight: cond.applyHeight ? parseNumOrNull(cond.minHeight) : null,
    maxHeight: cond.applyHeight ? parseNumOrNull(cond.maxHeight) : null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const transList: TourPackageTranslationDto[] = LOCALES.map((loc) => ({
      locale: loc,
      name: translations[loc]?.name?.trim() || translations.vi?.name?.trim() || "",
    }));

    const mainName =
      translations[activeTabLocale]?.name?.trim() ||
      translations.vi?.name?.trim() ||
      translations.en?.name?.trim() ||
      "Gói Tour Mới";

    const prices: PriceListPerPersonDto[] = isContactOnly
      ? []
      : [
          toPriceDto(adultCond, "ADULT"),
          toPriceDto(childCond, "CHILD"),
          toPriceDto(infantCond, "INFANT"),
        ];

    const hasPercent = depositType === "PERCENT" && depositRate > 0;
    const hasFixed = depositType === "FIXED" && depositAmount.trim() !== "" && Number(depositAmount) > 0;

    const updatedPackage: TourPackageDto = {
      ...(initialData || {}),
      code: mainName,
      name: mainName,
      pricingType: "PER_PERSON",
      prices,
      isContactOnly,
      adultPrice: isContactOnly ? 0 : adultCond.price,
      childPrice: isContactOnly ? 0 : childCond.price,
      infantPrice: isContactOnly ? 0 : infantCond.price,
      childPolicyNote: childPolicyNote.trim() || undefined,
      infantPolicyNote: infantPolicyNote.trim() || undefined,
      active,
      translations: transList,
      // "" (empty) clears the stored deposit on the server; undefined rate/amount keep the
      // existing columns but a null type makes the policy read as unconfigured.
      depositType: hasPercent ? "PERCENT" : hasFixed ? "FIXED" : "",
      depositRate: hasPercent ? depositRate : undefined,
      depositAmount: hasFixed ? Number(depositAmount) : undefined,
    };

    onSave(updatedPackage);
    onClose();
  };

  const renderPassengerCard = (
    type: "ADULT" | "CHILD" | "INFANT",
    title: string,
    subtitle: string,
    icon: React.ReactNode,
    cond: PassengerConditionState,
    setCond: React.Dispatch<React.SetStateAction<PassengerConditionState>>,
    accentColor: string
  ) => {
    const previewDto = toPriceDto(cond, type);
    const conditionText = formatPassengerCondition(previewDto, language);
    return (
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 space-y-3.5">
        {/* Card Header: Type Title & Price Input */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${accentColor}`}>
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {title}
                </span>
                {conditionText ? (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-accent/15 text-accent-foreground border border-accent/25">
                    {conditionText}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-200/70 dark:bg-[var(--bg-elevated)] text-slate-500">
                    {"Không quy định điều kiện"}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">{subtitle}</span>
            </div>
          </div>

          <div className="w-full sm:w-48">
            <Label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {"Giá vé (VND)"}
            </Label>
            <NumberField
              minValue={0}
              step={10000}
              value={cond.price}
              onChange={(val) => setCond((prev) => ({ ...prev, price: val ?? 0 }))}
              formatOptions={{ style: "currency", currency: "VND" }}
              fullWidth
            >
              <NumberField.Group className="h-9 bg-white dark:bg-[var(--bg-surface)] border-1 border-separator rounded-xl">
                <NumberField.DecrementButton />
                <NumberField.Input className="text-xs font-black text-slate-800 dark:text-slate-100" />
                <NumberField.IncrementButton />
              </NumberField.Group>
            </NumberField>
          </div>
        </div>

        {/* Condition Switches & Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-0.5">
          {/* By Age Box */}
          <div className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
            cond.applyAge
              ? "bg-blue-500/5 border-blue-500/30 dark:bg-blue-950/20 dark:border-blue-500/30"
              : "bg-white dark:bg-[var(--bg-surface)] border-slate-200 dark:border-slate-800"
          }`}>
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => setCond((prev) => ({ ...prev, applyAge: !prev.applyAge }))}
            >
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                  cond.applyAge ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-[var(--bg-elevated)] text-slate-400"
                }`}>
                  <Calendar size={13} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    {"Xác định theo độ tuổi"}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {cond.applyAge ? ("Đang áp dụng giới hạn tuổi"): ("Không giới hạn tuổi")}
                  </span>
                </div>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <Switch
                  isSelected={cond.applyAge}
                  onChange={(checked) => setCond((prev) => ({ ...prev, applyAge: checked }))}
                  aria-label={"Xác định theo độ tuổi"}
                >
                  <Switch.Content className="cursor-pointer">
                    <Switch.Control className="border border-slate-300 dark:border-slate-700">
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Content>
                </Switch>
              </div>
            </div>

            {cond.applyAge ? (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <div>
                  <Label className="block text-[10px] font-bold text-slate-500 mb-1">
                    {"Từ tuổi (Tối thiểu)"}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder={type === "ADULT" ? "12" : type === "CHILD" ? "5" : "0"}
                    value={cond.minAge}
                    onChange={(e) => setCond((prev) => ({ ...prev, minAge: e.target.value }))}
                    className="w-full h-8 px-2.5 rounded-lg border-1 border-separator bg-white dark:bg-[var(--bg-card)] text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label className="block text-[10px] font-bold text-slate-500 mb-1">
                    {"Đến tuổi (Tối đa)"}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder={type === "ADULT" ? ("Trở lên"): type === "CHILD" ? "11" : "4"}
                    value={cond.maxAge}
                    onChange={(e) => setCond((prev) => ({ ...prev, maxAge: e.target.value }))}
                    className="w-full h-8 px-2.5 rounded-lg border-1 border-separator bg-white dark:bg-[var(--bg-card)] text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 italic pt-0.5 select-none">
                {"Bấm vào để kích hoạt điều kiện giới hạn độ tuổi cho vé này"}
              </p>
            )}
          </div>

          {/* By Height Box */}
          <div className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
            cond.applyHeight
              ? "bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-950/20 dark:border-emerald-500/30"
              : "bg-white dark:bg-[var(--bg-surface)] border-slate-200 dark:border-slate-800"
          }`}>
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => setCond((prev) => ({ ...prev, applyHeight: !prev.applyHeight }))}
            >
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                  cond.applyHeight ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-[var(--bg-elevated)] text-slate-400"
                }`}>
                  <Ruler size={13} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    {"Xác định theo chiều cao"}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {cond.applyHeight ? ("Đang áp dụng giới hạn chiều cao"): ("Không giới hạn chiều cao")}
                  </span>
                </div>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <Switch
                  isSelected={cond.applyHeight}
                  onChange={(checked) => setCond((prev) => ({ ...prev, applyHeight: checked }))}
                  aria-label={"Xác định theo chiều cao"}
                >
                  <Switch.Content className="cursor-pointer">
                    <Switch.Control className="border border-slate-300 dark:border-slate-700">
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Content>
                </Switch>
              </div>
            </div>

            {cond.applyHeight ? (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <div>
                  <Label className="block text-[10px] font-bold text-slate-500 mb-1">
                    {"Từ chiều cao (cm)"}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder={type === "ADULT" ? "130" : type === "CHILD" ? "100" : "0"}
                    value={cond.minHeight}
                    onChange={(e) => setCond((prev) => ({ ...prev, minHeight: e.target.value }))}
                    className="w-full h-8 px-2.5 rounded-lg border-1 border-separator bg-white dark:bg-[var(--bg-card)] text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <Label className="block text-[10px] font-bold text-slate-500 mb-1">
                    {"Đến chiều cao (cm)"}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder={type === "ADULT" ? ("Trở lên"): type === "CHILD" ? "129" : "99"}
                    value={cond.maxHeight}
                    onChange={(e) => setCond((prev) => ({ ...prev, maxHeight: e.target.value }))}
                    className="w-full h-8 px-2.5 rounded-lg border-1 border-separator bg-white dark:bg-[var(--bg-card)] text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 italic pt-0.5 select-none">
                {"Bấm vào để kích hoạt điều kiện giới hạn chiều cao cho vé này"}
              </p>
            )}
          </div>
        </div>

        {/* Logic OR notice when both toggles are ON */}
        {cond.applyAge && cond.applyHeight && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-semibold border border-amber-500/30">
            <Sparkles size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="leading-relaxed">
              <span className="font-extrabold text-amber-900 dark:text-amber-200 block">
                {"Quy tắc áp dụng: Logic OR (Thỏa mãn 1 trong 2 điều kiện)"}
              </span>
              <span className="text-[11px] text-amber-800/90 dark:text-amber-300/90 block mt-0.5">
                {"Hành khách chỉ cần thỏa mãn điều kiện theo Độ tuổi HOẶC theo Chiều cao là được áp dụng mức giá này."}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <ModalBackdrop
        className="bg-slate-950/60 backdrop-blur-xs z-[100050]"
        style={{ zIndex: 100050 }}
      >
        <ModalContainer>
          <ModalDialog className="max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    {initialData ? ("Chỉnh sửa gói tour"): ("Thêm gói tour mới")}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {"Định giá vé & tùy chỉnh điều kiện theo tuổi / chiều cao cho từng loại vé"}
                  </p>
                </div>
              </div>
            </ModalHeader>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <ModalBody className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
                {/* Status Switch */}
                <div
                  onClick={() => setActive(!active)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between ${
                    active
                      ? "bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-950/20 dark:border-emerald-500/30"
                      : "bg-slate-50 dark:bg-[var(--bg-card)] border-separator hover:bg-slate-100/70 dark:hover:bg-[var(--bg-elevated)]"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {"Trạng thái hoạt động"}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        active
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                          : "bg-slate-200 dark:bg-[var(--bg-elevated)] text-slate-500 border-transparent"
                      }`}>
                        {active ? ("Đang bật"): ("Tạm ngưng")}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      {"Cho phép khách hàng xem và đặt gói tour này"}
                    </span>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Switch
                      isSelected={active}
                      onChange={setActive}
                      aria-label={"Trạng thái hoạt động"}
                    >
                      <Switch.Content className="cursor-pointer">
                        <Switch.Control className="border border-slate-300 dark:border-slate-700">
                          <Switch.Thumb />
                        </Switch.Control>
                      </Switch.Content>
                    </Switch>
                  </div>
                </div>

                {/* Multilingual Name */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">
                      {"Tên gói tour"}
                    </Label>
                    <div className="flex items-center gap-1">
                      {LOCALES.map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                            activeTabLocale === loc
                              ? "bg-accent text-accent-foreground"
                              : "bg-white dark:bg-[var(--bg-surface)] text-slate-600 dark:text-slate-400 hover:bg-slate-200/50"
                          }`}
                          onClick={() => setActiveTabLocale(loc)}
                        >
                          {loc === "vi" ? "🇻🇳 VI" : loc === "en" ? "🇬🇧 EN" : loc === "ko" ? "🇰🇷 KO" : "🇷🇺 RU"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Input
                    type="text"
                    required
                    placeholder={"VD: Cano ghép – Tiêu chuẩn, Tour VIP riêng..."}
                    value={translations[activeTabLocale]?.name || ""}
                    onChange={(e) => handleTranslationNameChange(activeTabLocale, e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-surface)] text-slate-800 dark:text-slate-100 text-xs font-semibold outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>

                {/* Contact only switch */}
                <div
                  onClick={() => setIsContactOnly(!isContactOnly)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between ${
                    isContactOnly
                      ? "bg-amber-500/5 border-amber-500/30 dark:bg-amber-950/20 dark:border-amber-500/30"
                      : "bg-slate-50 dark:bg-[var(--bg-card)] border-separator hover:bg-slate-100/70 dark:hover:bg-[var(--bg-elevated)]"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {"Gói liên hệ báo giá"}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        isContactOnly
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                          : "bg-slate-200 dark:bg-[var(--bg-elevated)] text-slate-500 border-transparent"
                      }`}>
                        {isContactOnly ? ("Báo giá riêng"): ("Giá cố định")}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      {"Khách hàng liên hệ để được tư vấn giá chính xác, không bắt buộc cài đặt bảng giá bên dưới"}
                    </span>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Switch
                      isSelected={isContactOnly}
                      onChange={setIsContactOnly}
                      aria-label={"Gói liên hệ báo giá"}
                    >
                      <Switch.Content className="cursor-pointer">
                        <Switch.Control className="border border-slate-300 dark:border-slate-700">
                          <Switch.Thumb />
                        </Switch.Control>
                      </Switch.Content>
                    </Switch>
                  </div>
                </div>

                {/* Pricing & Condition Fields OR Contact-Only Notice */}
                {isContactOnly ? (
                  <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-2xs">
                    <Sparkles size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="text-xs font-black block">
                        {"Gói tour này đang ở chế độ Liên hệ báo giá"}
                      </span>
                      <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                        {"Khách hàng sẽ liên hệ với bạn để nhận tư vấn và báo giá chính xác. Bạn không cần thiết lập giá vé hoặc các điều kiện theo đầu người."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 block">
                        {"Bảng giá & điều kiện theo đầu người"}
                      </Label>
                      <span className="text-[11px] text-slate-400">
                        {"Tùy chỉnh linh hoạt theo tuổi và chiều cao"}
                      </span>
                    </div>

                    {/* 1. Adult Card */}
                    {renderPassengerCard(
                      "ADULT",
                      "Người lớn",
                      "Vé tiêu chuẩn người lớn",
                      <User size={16} />,
                      adultCond,
                      setAdultCond,
                      "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    )}

                    {/* 2. Child Card */}
                    {renderPassengerCard(
                      "CHILD",
                      "Trẻ em",
                      "Vé dành cho trẻ em",
                      <Users size={16} />,
                      childCond,
                      setChildCond,
                      "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    )}

                    {/* 3. Infant Card */}
                    {renderPassengerCard(
                      "INFANT",
                      "Em bé",
                      "Vé dành cho em bé (thường miễn phí)",
                      <Baby size={16} />,
                      infantCond,
                      setInfantCond,
                      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    )}

                    {/* Policy Notes */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 space-y-3">
                      <Label className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 block">
                        {"Ghi chú chính sách vé phụ thu (nếu có)"}
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            {"Ghi chú chính sách trẻ em"}
                          </Label>
                          <Input
                            type="text"
                            placeholder={"VD: Miễn phí 1 vé trẻ em cho mỗi 2 người lớn"}
                            value={childPolicyNote}
                            onChange={(e) => setChildPolicyNote(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-surface)] text-xs"
                          />
                        </div>
                        <div>
                          <Label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            {"Ghi chú chính sách em bé"}
                          </Label>
                          <Input
                            type="text"
                            placeholder={"VD: Miễn phí toàn bộ, ngồi chung với bố mẹ"}
                            value={infantPolicyNote}
                            onChange={(e) => setInfantPolicyNote(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-surface)] text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Deposit policy for this package — no default, empty = no deposit */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Label className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <ShieldCheck size={15} className="text-amber-500 shrink-0" />
                          {t.discounts.depositConfig}
                        </Label>
                        <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[var(--bg-surface)] p-0.5 shrink-0">
                          {([
                            { value: "", label: t.discounts.depositNone },
                            { value: "PERCENT", label: t.discounts.depositPercent },
                            { value: "FIXED", label: t.discounts.depositFixed },
                          ] as const).map((opt) => (
                            <button
                              key={opt.value || "NONE"}
                              type="button"
                              onClick={() => setDepositType(opt.value)}
                              className={`text-[11px] font-bold px-3 py-1 rounded-md transition-colors cursor-pointer ${
                                depositType === opt.value
                                  ? "bg-accent text-accent-foreground shadow-xs"
                                  : "text-foreground/60 hover:text-foreground"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {depositType === "PERCENT" && (
                        <div className="w-full sm:max-w-xs">
                          <Label className="block text-[11px] font-bold text-foreground/60 mb-1">
                            {t.discounts.depositRate}
                          </Label>
                          <NumberField
                            value={depositRate}
                            onChange={(v) => setDepositRate(v || 0)}
                            minValue={0}
                            maxValue={100}
                            className="w-full"
                          >
                            <NumberField.Group className="w-full">
                              <NumberField.Input className="w-full px-3 py-2 rounded-xl border border-separator bg-white dark:bg-[var(--bg-surface)] text-foreground text-sm font-bold h-[36px]" />
                            </NumberField.Group>
                          </NumberField>
                        </div>
                      )}

                      {depositType === "FIXED" && (
                        <div className="w-full sm:max-w-xs">
                          <Label className="block text-[11px] font-bold text-foreground/60 mb-1">
                            {t.discounts.fixedDepositAmount}
                          </Label>
                          <NumberField
                            value={Number(depositAmount)}
                            onChange={(v) => setDepositAmount(v !== undefined ? String(v) : "")}
                            minValue={0}
                            className="w-full"
                          >
                            <NumberField.Group className="w-full">
                              <NumberField.Input
                                placeholder={t.discounts.fixedDepositAmount}
                                className="w-full px-3 py-2 rounded-xl border border-separator bg-white dark:bg-[var(--bg-surface)] text-foreground text-sm font-semibold h-[36px] outline-none"
                              />
                            </NumberField.Group>
                          </NumberField>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </ModalBody>

              {/* Footer */}
              <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {"Hủy"}
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
                >
                  <Save size={15} className="mr-1.5" />
                  {"Lưu gói tour"}
                </Button>
              </ModalFooter>
            </form>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
