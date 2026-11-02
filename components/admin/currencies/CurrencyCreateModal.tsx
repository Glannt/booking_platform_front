"use client";

import React, { useState, useEffect } from "react";
import {
  Modal, ModalBackdrop, ModalContainer, ModalDialog, ModalCloseTrigger, ModalHeader, ModalBody, ModalFooter,
  Button, TextField, Input, Label, Switch
} from "@heroui/react";
import { Save, RefreshCw } from "lucide-react";

import { createCurrency, CurrencyDto, CurrencyTranslationDto } from "@/lib/api/currencies";

interface CurrencyCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (newCurrency?: CurrencyDto) => void | Promise<void>;
  showToast: (msg: string, type: "success" | "error") => void;
}

const LOCALES = ["vi", "en", "ko", "ru"];
const LOCALE_FLAGS: Record<string, string> = { vi: "🇻🇳", en: "🇬🇧", ko: "🇰🇷", ru: "🇷🇺" };

export default function CurrencyCreateModal({
  isOpen, onClose, onSaveSuccess, showToast
}: CurrencyCreateModalProps) {
  const [activeFormLocale, setActiveFormLocale] = useState("vi");
  const [loading, setLoading] = useState(false);

  const [code, setCode] = useState("");
  const [symbol, setSymbol] = useState("");
  const [rateToVnd, setRateToVnd] = useState("");
  const [active, setActive] = useState(true);
  const [translations, setTranslations] = useState<CurrencyTranslationDto[]>(
    LOCALES.map(locale => ({ locale, name: "" }))
  );

  useEffect(() => {
    if (isOpen) {
      setCode("");
      setSymbol("");
      setRateToVnd("");
      setActive(true);
      setTranslations(LOCALES.map(locale => ({ locale, name: "" })));
      setActiveFormLocale("vi");
    }
  }, [isOpen]);

  const handleTranslationNameChange = (val: string) => {
    setTranslations(prev =>
      prev.map(t => t.locale === activeFormLocale ? { ...t, name: val } : t)
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!code.trim()) {
      showToast("Mã tiền tệ là bắt buộc!", "error");
      return;
    }
    if (!rateToVnd || isNaN(Number(rateToVnd)) || Number(rateToVnd) <= 0) {
      showToast("Tỉ giá phải là số dương!", "error");
      return;
    }

    const cleanTranslations = translations.filter(t => t.name.trim() !== "");

    setLoading(true);
    try {
      const result = await createCurrency({
        code: code.trim().toUpperCase(),
        symbol: symbol.trim() || code.trim().toUpperCase(),
        rateToVnd: Number(rateToVnd),
        active,
        translations: cleanTranslations,
      });
      await onSaveSuccess?.(result);
    } catch (err: any) {
      showToast(err?.message || "Lỗi khi tạo", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-black">Thêm loại tiền tệ</h2>
            </ModalHeader>
            <ModalBody className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
              <div className="grid grid-cols-2 gap-3">
                <TextField isRequired>
                  <Label className="text-xs font-bold">Mã tiền tệ</Label>
                  <Input
                    placeholder="USD"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="font-mono border-1 border-separator"
                  />
                </TextField>
                <TextField>
                  <Label className="text-xs font-bold">Ký hiệu</Label>
                  <Input
                    placeholder="$"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                  />
                </TextField>
              </div>

              <TextField isRequired>
                <Label className="text-xs font-bold">1 Đơn vị = VND</Label>
                <Input
                  type="number"
                  placeholder="25000"
                  value={rateToVnd}
                  onChange={(e) => setRateToVnd(e.target.value)}
                  className="font-mono border-1 border-separator"
                />
              </TextField>

              <div className="flex items-center gap-2">
                <Label className="text-xs font-bold">Hoạt động</Label>
                <Switch isSelected={active} onChange={() => setActive(!active)} size="sm" />
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <Label className="text-xs font-bold mb-2 block">Tên theo ngôn ngữ</Label>
                <div className="flex gap-1 mb-3">
                  {LOCALES.map(loc => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setActiveFormLocale(loc)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold border-none cursor-pointer transition-all ${
                        activeFormLocale === loc
                          ? "bg-accent text-accent-foreground"
                          : "bg-slate-100 dark:bg-[var(--bg-elevated)] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      {LOCALE_FLAGS[loc]} {loc.toUpperCase()}
                    </button>
                  ))}
                </div>
                <TextField>
                  <Label className="text-xs font-bold">
                    Tên ({activeFormLocale.toUpperCase()})
                  </Label>
                  <Input
                    placeholder={`Tên tiền tệ bằng ${activeFormLocale.toUpperCase()}`}
                    value={translations.find(t => t.locale === activeFormLocale)?.name || ""}
                    onChange={(e) => handleTranslationNameChange(e.target.value)}
                  />
                </TextField>
              </div>
            </ModalBody>
            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                isDisabled={loading}
                className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                isDisabled={loading}
                className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
              >
                {loading ? (
                  <RefreshCw size={15} className="animate-spin mr-1.5" />
                ) : (
                  <Save size={15} className="mr-1.5" />
                )}
                Tạo mới
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
