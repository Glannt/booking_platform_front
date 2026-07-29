"use client";

import React, { useState, useEffect } from "react";
import {
  Modal, ModalBackdrop, ModalContainer, ModalDialog, ModalHeader, ModalBody, ModalFooter,
  Button, TextField, Input, Label, Switch
} from "@heroui/react";
import { Save, Trash2, Edit3 } from "lucide-react";

import { updateCurrency, deleteCurrency, CurrencyDto, CurrencyTranslationDto } from "@/lib/api/currencies";

interface CurrencyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: CurrencyDto;
  defaultEditMode?: boolean;
  onSaveSuccess: (updated?: CurrencyDto) => void;
  onDeleteSuccess: (id: number) => void;
  showToast: (msg: string, type: "success" | "error") => void;
}

const LOCALES = ["vi", "en", "ko", "ru"];
const LOCALE_FLAGS: Record<string, string> = { vi: "🇻🇳", en: "🇬🇧", ko: "🇰🇷", ru: "🇷🇺" };

export default function CurrencyDetailsModal({
  isOpen, onClose, currency, defaultEditMode = false,
  onSaveSuccess, onDeleteSuccess, showToast
}: CurrencyDetailsModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFormLocale, setActiveFormLocale] = useState("vi");

  const [code, setCode] = useState("");
  const [symbol, setSymbol] = useState("");
  const [rateToVnd, setRateToVnd] = useState("");
  const [active, setActive] = useState(true);
  const [translations, setTranslations] = useState<CurrencyTranslationDto[]>([]);

  useEffect(() => {
    if (isOpen && currency) {
      setCode(currency.code);
      setSymbol(currency.symbol);
      setRateToVnd(String(currency.rateToVnd));
      setActive(currency.active);
      // Deep copy translations, ensure all 4 locales exist
      const existing = currency.translations || [];
      const filled = LOCALES.map(loc => {
        const found = existing.find(t => t.locale === loc);
        return found ? { ...found } : { locale: loc, name: "" };
      });
      setTranslations(filled);
      setActiveFormLocale("vi");
      setIsEditMode(defaultEditMode);
    }
  }, [isOpen, currency, defaultEditMode]);

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
      const result = await updateCurrency(currency.id, {
        ...currency,
        code: code.trim().toUpperCase(),
        symbol: symbol.trim() || code.trim().toUpperCase(),
        rateToVnd: Number(rateToVnd),
        active,
        translations: cleanTranslations,
      });
      onSaveSuccess(result);
    } catch (err: any) {
      showToast(err?.message || "Lỗi khi cập nhật", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Xóa loại tiền tệ này?")) return;
    try {
      await deleteCurrency(currency.id);
      onDeleteSuccess(currency.id);
    } catch {
      showToast("Xóa thất bại", "error");
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop />
      <ModalContainer>
        <ModalDialog className="max-w-lg">
          <ModalHeader>
            <div className="flex items-center justify-between w-full">
              <h2 className="text-lg font-black">
                {isEditMode ? "Chỉnh sửa" : "Chi tiết"} — {currency.code}
              </h2>
              {!isEditMode && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 cursor-pointer border-none bg-transparent"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 cursor-pointer border-none bg-transparent"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </ModalHeader>
          <ModalBody className="gap-4">
            <div className="grid grid-cols-2 gap-3">
              <TextField>
                <Label className="text-xs font-bold">Mã tiền tệ</Label>
                {isEditMode ? (
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                ) : (
                  <div className="h-10 px-3 flex items-center font-mono font-bold text-sm bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    {code}
                  </div>
                )}
              </TextField>
              <TextField>
                <Label className="text-xs font-bold">Ký hiệu</Label>
                {isEditMode ? (
                  <Input
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                  />
                ) : (
                  <div className="h-10 px-3 flex items-center text-lg bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    {symbol}
                  </div>
                )}
              </TextField>
            </div>

            <TextField>
              <Label className="text-xs font-bold">1 Đơn vị = VND</Label>
              {isEditMode ? (
                <Input
                  type="number"
                  value={rateToVnd}
                  onChange={(e) => setRateToVnd(e.target.value)}
                  className="font-mono"
                />
              ) : (
                <div className="h-10 px-3 flex items-center font-mono font-bold text-sm text-amber-600 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  {Number(rateToVnd).toLocaleString("vi-VN")} ₫
                </div>
              )}
            </TextField>

            <div className="flex items-center gap-2">
              <Label className="text-xs font-bold">Hoạt động</Label>
              {isEditMode ? (
                <Switch isSelected={active} onChange={() => setActive(!active)} size="sm" />
              ) : (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  active ? "text-emerald-600 bg-emerald-50" : "text-slate-400 bg-slate-100"
                }`}>
                  {active ? "Hoạt động" : "Tắt"}
                </span>
              )}
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
                        ? "bg-accent text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
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
                {isEditMode ? (
                  <Input
                    value={translations.find(t => t.locale === activeFormLocale)?.name || ""}
                    onChange={(e) => handleTranslationNameChange(e.target.value)}
                  />
                ) : (
                  <div className="h-10 px-3 flex items-center text-sm bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    {translations.find(t => t.locale === activeFormLocale)?.name || "—"}
                  </div>
                )}
              </TextField>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-xs font-bold"
            >
              {isEditMode ? "Hủy" : "Đóng"}
            </Button>
            {isEditMode && (
              <Button
                onClick={handleSave}
                isDisabled={loading}
                className="bg-accent hover:bg-accent-hover text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 border-none cursor-pointer disabled:opacity-50"
              >
                <Save size={14} />
                {loading ? "Đang lưu..." : "Lưu"}
              </Button>
            )}
          </ModalFooter>
        </ModalDialog>
      </ModalContainer>
    </Modal>
  );
}
