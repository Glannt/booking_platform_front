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
import { Users, User, Baby, Save, Sparkles, Ruler, Calendar } from "lucide-react";
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
    const isVi = language === "vi";

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
                    {isVi ? "Không quy định điều kiện" : "No condition restriction"}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">{subtitle}</span>
            </div>
          </div>

          <div className="w-full sm:w-48">
            <Label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {isVi ? "Giá vé (VND)" : "Ticket Price (VND)"}
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
                    {isVi ? "Xác định theo độ tuổi" : "By Age Condition"}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {cond.applyAge ? (isVi ? "Đang áp dụng giới hạn tuổi" : "Age limit active") : (isVi ? "Không giới hạn tuổi" : "No age limit")}
                  </span>
                </div>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <Switch
                  isSelected={cond.applyAge}
                  onChange={(checked) => setCond((prev) => ({ ...prev, applyAge: checked }))}
                  aria-label={isVi ? "Xác định theo độ tuổi" : "By Age Condition"}
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
                    {isVi ? "Từ tuổi (Tối thiểu)" : "Min Age (From)"}
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
                    {isVi ? "Đến tuổi (Tối đa)" : "Max Age (To)"}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder={type === "ADULT" ? (isVi ? "Trở lên" : "No max") : type === "CHILD" ? "11" : "4"}
                    value={cond.maxAge}
                    onChange={(e) => setCond((prev) => ({ ...prev, maxAge: e.target.value }))}
                    className="w-full h-8 px-2.5 rounded-lg border-1 border-separator bg-white dark:bg-[var(--bg-card)] text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 italic pt-0.5 select-none">
                {isVi ? "Bấm vào để kích hoạt điều kiện giới hạn độ tuổi cho vé này" : "Click to enable age limit for this ticket"}
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
                    {isVi ? "Xác định theo chiều cao" : "By Height (cm)"}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {cond.applyHeight ? (isVi ? "Đang áp dụng giới hạn chiều cao" : "Height limit active") : (isVi ? "Không giới hạn chiều cao" : "No height limit")}
                  </span>
                </div>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <Switch
                  isSelected={cond.applyHeight}
                  onChange={(checked) => setCond((prev) => ({ ...prev, applyHeight: checked }))}
                  aria-label={isVi ? "Xác định theo chiều cao" : "By Height (cm)"}
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
                    {isVi ? "Từ chiều cao (cm)" : "Min Height (cm)"}
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
                    {isVi ? "Đến chiều cao (cm)" : "Max Height (cm)"}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder={type === "ADULT" ? (isVi ? "Trở lên" : "No max") : type === "CHILD" ? "129" : "99"}
                    value={cond.maxHeight}
                    onChange={(e) => setCond((prev) => ({ ...prev, maxHeight: e.target.value }))}
                    className="w-full h-8 px-2.5 rounded-lg border-1 border-separator bg-white dark:bg-[var(--bg-card)] text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 italic pt-0.5 select-none">
                {isVi ? "Bấm vào để kích hoạt điều kiện giới hạn chiều cao cho vé này" : "Click to enable height limit for this ticket"}
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
                {isVi
                  ? "Quy tắc áp dụng: Logic OR (Thỏa mãn 1 trong 2 điều kiện)"
                  : "Rule Applied: Logic OR (Either condition qualifies)"}
              </span>
              <span className="text-[11px] text-amber-800/90 dark:text-amber-300/90 block mt-0.5">
                {isVi
                  ? "Hành khách chỉ cần thỏa mãn điều kiện theo Độ tuổi HOẶC theo Chiều cao là được áp dụng mức giá này."
                  : "Passengers only need to meet either the Age OR Height condition to qualify for this rate."}
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
                    {initialData ? (language === "vi" ? "Chỉnh sửa gói tour" : "Edit Package") : (language === "vi" ? "Thêm gói tour mới" : "Add Package")}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {language === "vi" ? "Định giá vé & tùy chỉnh điều kiện theo tuổi / chiều cao cho từng loại vé" : "Configure per-person pricing & custom age / height criteria"}
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
                        {language === "vi" ? "Trạng thái hoạt động" : "Active Status"}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        active
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                          : "bg-slate-200 dark:bg-[var(--bg-elevated)] text-slate-500 border-transparent"
                      }`}>
                        {active ? (language === "vi" ? "Đang bật" : "Active") : (language === "vi" ? "Tạm ngưng" : "Inactive")}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      {language === "vi" ? "Cho phép khách hàng xem và đặt gói tour này" : "Enable for booking"}
                    </span>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Switch
                      isSelected={active}
                      onChange={setActive}
                      aria-label={language === "vi" ? "Trạng thái hoạt động" : "Active Status"}
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
                      {language === "vi" ? "Tên gói tour" : "Package Name"}
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
                    placeholder={language === "vi" ? "VD: Cano ghép – Tiêu chuẩn, Tour VIP riêng..." : "e.g. Standard Charter, VIP Tour..."}
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
                        {language === "vi" ? "Gói liên hệ báo giá" : "Contact for Quote"}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        isContactOnly
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                          : "bg-slate-200 dark:bg-[var(--bg-elevated)] text-slate-500 border-transparent"
                      }`}>
                        {isContactOnly ? (language === "vi" ? "Báo giá riêng" : "Quote only") : (language === "vi" ? "Giá cố định" : "Fixed price")}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      {language === "vi"
                        ? "Khách hàng liên hệ để được tư vấn giá chính xác, không bắt buộc cài đặt bảng giá bên dưới"
                        : "No fixed price displayed, customers contact support"}
                    </span>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Switch
                      isSelected={isContactOnly}
                      onChange={setIsContactOnly}
                      aria-label={language === "vi" ? "Gói liên hệ báo giá" : "Contact for Quote"}
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
                        {language === "vi"
                          ? "Gói tour này đang ở chế độ Liên hệ báo giá"
                          : "This package is set to Contact for Quote"}
                      </span>
                      <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                        {language === "vi"
                          ? "Khách hàng sẽ liên hệ với bạn để nhận tư vấn và báo giá chính xác. Bạn không cần thiết lập giá vé hoặc các điều kiện theo đầu người."
                          : "Customers will contact your support team for an exact price quote. You do not need to configure ticket prices or passenger conditions."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 block">
                        {language === "vi" ? "Bảng giá & điều kiện theo đầu người" : "Per-Person Pricing & Conditions"}
                      </Label>
                      <span className="text-[11px] text-slate-400">
                        {language === "vi" ? "Tùy chỉnh linh hoạt theo tuổi và chiều cao" : "Customizable by age and height"}
                      </span>
                    </div>

                    {/* 1. Adult Card */}
                    {renderPassengerCard(
                      "ADULT",
                      language === "vi" ? "Người lớn" : "Adult",
                      language === "vi" ? "Vé tiêu chuẩn người lớn" : "Standard adult passenger",
                      <User size={16} />,
                      adultCond,
                      setAdultCond,
                      "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    )}

                    {/* 2. Child Card */}
                    {renderPassengerCard(
                      "CHILD",
                      language === "vi" ? "Trẻ em" : "Child",
                      language === "vi" ? "Vé dành cho trẻ em" : "Child passenger",
                      <Users size={16} />,
                      childCond,
                      setChildCond,
                      "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    )}

                    {/* 3. Infant Card */}
                    {renderPassengerCard(
                      "INFANT",
                      language === "vi" ? "Em bé" : "Infant",
                      language === "vi" ? "Vé dành cho em bé (thường miễn phí)" : "Infant passenger (usually free)",
                      <Baby size={16} />,
                      infantCond,
                      setInfantCond,
                      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    )}

                    {/* Policy Notes */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 space-y-3">
                      <Label className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 block">
                        {language === "vi" ? "Ghi chú chính sách vé phụ thu (nếu có)" : "Policy Notes (Optional)"}
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            {language === "vi" ? "Ghi chú chính sách trẻ em" : "Child Policy Note"}
                          </Label>
                          <Input
                            type="text"
                            placeholder={language === "vi" ? "VD: Miễn phí 1 vé trẻ em cho mỗi 2 người lớn" : "Child policy note..."}
                            value={childPolicyNote}
                            onChange={(e) => setChildPolicyNote(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-surface)] text-xs"
                          />
                        </div>
                        <div>
                          <Label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            {language === "vi" ? "Ghi chú chính sách em bé" : "Infant Policy Note"}
                          </Label>
                          <Input
                            type="text"
                            placeholder={language === "vi" ? "VD: Miễn phí toàn bộ, ngồi chung với bố mẹ" : "Infant policy note..."}
                            value={infantPolicyNote}
                            onChange={(e) => setInfantPolicyNote(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-surface)] text-xs"
                          />
                        </div>
                      </div>
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
                  {language === "vi" ? "Hủy" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
                >
                  <Save size={15} className="mr-1.5" />
                  {language === "vi" ? "Lưu gói tour" : "Save Package"}
                </Button>
              </ModalFooter>
            </form>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
