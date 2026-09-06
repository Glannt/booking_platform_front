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
import { Box, Layers, DollarSign } from "lucide-react";
import clsx from "clsx";
import { TourPackageDto, TourPackageTranslationDto } from "@/lib/api/tours";

interface TourPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pkg: TourPackageDto) => void;
  initialData?: TourPackageDto | null;
  language?: string;
}

const LOCALES = ["vi", "en", "ko", "ru"] as const;

export default function TourPackageModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  language = "vi",
}: TourPackageModalProps) {
  const [activeTabLocale, setActiveTabLocale] = useState<string>(language);
  const [pricingType, setPricingType] = useState<"PER_PERSON" | "PRIVATE_CHARTER">("PER_PERSON");
  const [isContactOnly, setIsContactOnly] = useState<boolean>(false);
  const [adultPrice, setAdultPrice] = useState<number>(0);
  const [childPrice, setChildPrice] = useState<number>(0);
  const [infantPrice, setInfantPrice] = useState<number>(0);
  const [fixedPrice, setFixedPrice] = useState<number>(0);
  const [active, setActive] = useState<boolean>(true);

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
        setPricingType(initialData.pricingType || "PER_PERSON");
        setIsContactOnly(initialData.isContactOnly || false);
        setAdultPrice(initialData.adultPrice || 0);
        setChildPrice(initialData.childPrice || 0);
        setInfantPrice(initialData.infantPrice || 0);
        setFixedPrice(initialData.fixedPrice || 0);
        setActive(initialData.active !== undefined ? initialData.active : true);

        const newTrans: Record<string, { name: string }> = {
          vi: { name: "" },
          en: { name: "" },
          ko: { name: "" },
          ru: { name: "" },
        };

        if (initialData.translations && initialData.translations.length > 0) {
          initialData.translations.forEach((t) => {
            if (newTrans[t.locale]) {
              newTrans[t.locale].name = t.name || "";
            }
          });
        }
        if (!newTrans.vi.name && initialData.code) {
          newTrans.vi.name = initialData.code;
        }

        setTranslations(newTrans);
      } else {
        // Reset for new package
        setPricingType("PER_PERSON");
        setIsContactOnly(false);
        setAdultPrice(0);
        setChildPrice(0);
        setInfantPrice(0);
        setFixedPrice(0);
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

    const updatedPackage: TourPackageDto = {
      ...(initialData || {}),
      code: mainName,
      pricingType,
      isContactOnly,
      adultPrice: isContactOnly ? 0 : adultPrice,
      childPrice: isContactOnly ? 0 : childPrice,
      infantPrice: isContactOnly ? 0 : infantPrice,
      fixedPrice: isContactOnly ? 0 : fixedPrice,
      active,
      translations: transList,
    };

    onSave(updatedPackage);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <ModalBackdrop className="bg-slate-950/60 backdrop-blur-xs z-[60]">
        <ModalContainer>
          <ModalDialog className="max-w-xl w-full max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden focus:outline-none">
            {/* Header */}
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-[var(--bg-card)]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <Box size={16} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {initialData ? (language === "vi" ? "Chỉnh sửa gói tour" : "Edit Tour Package") : (language === "vi" ? "Tạo gói tour mới" : "Add Tour Package")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === "vi" ? "Cấu hình tên gói và biểu phí theo đầu người hoặc trọn gói" : "Configure package name and pricing details"}
                  </p>
                </div>
              </div>
              <ModalCloseTrigger />
            </ModalHeader>

            {/* Body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <ModalBody className="p-6 space-y-5 overflow-y-auto max-h-[65vh]">
                {/* Locale switcher for package name */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {language === "vi" ? "Tên gói tour" : "Package Name"} ({activeTabLocale.toUpperCase()})
                    </Label>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-[var(--bg-card)] p-0.5 rounded-xl">
                      {LOCALES.map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          className={clsx(
                            "px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase transition-all cursor-pointer border-none",
                            activeTabLocale === loc
                              ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-transparent"
                          )}
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
                    placeholder={language === "vi" ? "VD: Cano ghép – Tiêu chuẩn, Tour VIP riêng..." : "e.g. Standard Charter, VIP Private..."}
                    value={translations[activeTabLocale]?.name || ""}
                    onChange={(e) => handleTranslationNameChange(activeTabLocale, e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-card)] text-slate-800 dark:text-slate-100 text-xs font-semibold outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>

                {/* Pricing Model selection */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    {language === "vi" ? "Hình thức định giá" : "Pricing Model"}
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPricingType("PER_PERSON")}
                      className={clsx(
                        "flex items-start gap-3 p-3 rounded-2xl border text-left cursor-pointer transition-all",
                        pricingType === "PER_PERSON"
                          ? "border-accent bg-accent/5 ring-1 ring-accent text-slate-900 dark:text-white"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[var(--bg-card)]/50 text-slate-600 dark:text-slate-400"
                      )}
                    >
                      <Layers size={18} className={pricingType === "PER_PERSON" ? "text-accent" : "text-slate-400"} />
                      <div>
                        <span className="text-xs font-bold block">{language === "vi" ? "Theo đầu người" : "Per Person"}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          {language === "vi" ? "Người lớn / Trẻ em / Em bé" : "Adult / Child / Infant rates"}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPricingType("PRIVATE_CHARTER")}
                      className={clsx(
                        "flex items-start gap-3 p-3 rounded-2xl border text-left cursor-pointer transition-all",
                        pricingType === "PRIVATE_CHARTER"
                          ? "border-accent bg-accent/5 ring-1 ring-accent text-slate-900 dark:text-white"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[var(--bg-card)]/50 text-slate-600 dark:text-slate-400"
                      )}
                    >
                      <DollarSign size={18} className={pricingType === "PRIVATE_CHARTER" ? "text-accent" : "text-slate-400"} />
                      <div>
                        <span className="text-xs font-bold block">{language === "vi" ? "Trọn gói / Xe / Cano riêng" : "Private / Charter"}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          {language === "vi" ? "Giá cố định một nhóm khách" : "Fixed lump sum price"}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Contact only switch */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      {language === "vi" ? "Gói liên hệ báo giá" : "Contact for Quote"}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {language === "vi" ? "Khách hàng liên hệ để được tư vấn giá, không hiển thị số tiền cố định" : "No fixed price displayed, customers contact support"}
                    </span>
                  </div>
                  <Switch
                    isSelected={isContactOnly}
                    onChange={(checked) => setIsContactOnly(checked)}
                  />
                </div>

                {/* Pricing Fields */}
                {!isContactOnly && (
                  <div className="space-y-3 pt-1">
                    {pricingType === "PER_PERSON" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <Label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            {language === "vi" ? "Người lớn (≥ 1m3)" : "Adult (≥ 1m3)"}
                          </Label>
                          <NumberField
                            minValue={0}
                            step={10000}
                            value={adultPrice}
                            onChange={(val) => setAdultPrice(val ?? 0)}
                            formatOptions={{ style: "currency", currency: "VND" }}
                            fullWidth
                          >
                            <NumberField.Group className="bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl">
                              <NumberField.DecrementButton />
                              <NumberField.Input className="text-xs font-bold text-slate-800 dark:text-slate-100" />
                              <NumberField.IncrementButton />
                            </NumberField.Group>
                          </NumberField>
                        </div>

                        <div>
                          <Label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            {language === "vi" ? "Trẻ em (1m - 1m29)" : "Child (1m - 1m29)"}
                          </Label>
                          <NumberField
                            minValue={0}
                            step={10000}
                            value={childPrice}
                            onChange={(val) => setChildPrice(val ?? 0)}
                            formatOptions={{ style: "currency", currency: "VND" }}
                            fullWidth
                          >
                            <NumberField.Group className="bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl">
                              <NumberField.DecrementButton />
                              <NumberField.Input className="text-xs font-bold text-slate-800 dark:text-slate-100" />
                              <NumberField.IncrementButton />
                            </NumberField.Group>
                          </NumberField>
                        </div>

                        <div>
                          <Label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            {language === "vi" ? "Em bé (< 1m)" : "Infant (< 1m)"}
                          </Label>
                          <NumberField
                            minValue={0}
                            step={10000}
                            value={infantPrice}
                            onChange={(val) => setInfantPrice(val ?? 0)}
                            formatOptions={{ style: "currency", currency: "VND" }}
                            fullWidth
                          >
                            <NumberField.Group className="bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl">
                              <NumberField.DecrementButton />
                              <NumberField.Input className="text-xs font-bold text-slate-800 dark:text-slate-100" />
                              <NumberField.IncrementButton />
                            </NumberField.Group>
                          </NumberField>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                          {language === "vi" ? "Giá trọn gói (Cano / Xe riêng)" : "Charter / Lump Sum Price"}
                        </Label>
                        <NumberField
                          minValue={0}
                          step={50000}
                          value={fixedPrice}
                          onChange={(val) => setFixedPrice(val ?? 0)}
                          formatOptions={{ style: "currency", currency: "VND" }}
                          fullWidth
                        >
                          <NumberField.Group className="bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl">
                            <NumberField.DecrementButton />
                            <NumberField.Input className="text-xs font-bold text-slate-800 dark:text-slate-100" />
                            <NumberField.IncrementButton />
                          </NumberField.Group>
                        </NumberField>
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>

              {/* Footer */}
              <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0 bg-slate-50/50 dark:bg-[var(--bg-card)]/50">
                <Button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[var(--bg-elevated)] dark:hover:bg-[var(--bg-card)] text-slate-700 dark:text-slate-200 cursor-pointer border-none"
                >
                  {language === "vi" ? "Hủy" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-accent hover:bg-accent-hover text-white cursor-pointer border-none shadow-sm"
                >
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
