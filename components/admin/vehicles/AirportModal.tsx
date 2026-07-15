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
  TextField,
  Input,
  Tabs,
} from "@heroui/react";
import { Save, RefreshCw, Pencil, X } from "lucide-react";

import { createAirport, updateAirport, AirportDto, AirportTranslationDto } from "@/lib/api/fleet";

const LOCALES = ["vi", "en", "ko", "ru"] as const;
const LOCALE_LABELS: Record<string, string> = { vi: "Tiếng Việt", en: "English", ko: "한국어", ru: "Русский" };

interface AirportModalProps {
  isOpen: boolean;
  onClose: () => void;
  airport: AirportDto | null;
  onSaveSuccess: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
}

export default function AirportModal({
  isOpen,
  onClose,
  airport,
  onSaveSuccess,
  showToast
}: AirportModalProps) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"view" | "edit" | "create">("create");
  const [activeLocale, setActiveLocale] = useState<string>("vi");

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [active, setActive] = useState(true);
  const [translations, setTranslations] = useState<Record<string, { name: string; description: string }>>({
    vi: { name: "", description: "" },
    en: { name: "", description: "" },
    ko: { name: "", description: "" },
    ru: { name: "", description: "" },
  });

  useEffect(() => {
    if (isOpen) {
      setActiveLocale("vi");
      if (airport) {
        setMode("view");
        setCode(airport.code || "");
        setName(airport.name || "");
        setLocation(airport.location || "");
        setActive(airport.active ?? true);

        const tMap: Record<string, { name: string; description: string }> = {
          vi: { name: "", description: "" },
          en: { name: "", description: "" },
          ko: { name: "", description: "" },
          ru: { name: "", description: "" },
        };
        airport.translations?.forEach(t => {
          if (t.locale in tMap) {
            tMap[t.locale] = { name: t.name || "", description: t.description || "" };
          }
        });
        setTranslations(tMap);
      } else {
        setMode("create");
        setCode("");
        setName("");
        setLocation("");
        setActive(true);
        setTranslations({
          vi: { name: "", description: "" },
          en: { name: "", description: "" },
          ko: { name: "", description: "" },
          ru: { name: "", description: "" },
        });
      }
    }
  }, [isOpen, airport]);

  const handleTranslationChange = (locale: string, field: "name" | "description", value: string) => {
    setTranslations(prev => ({
      ...prev,
      [locale]: { ...prev[locale], [field]: value }
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!code.trim() || !name.trim()) {
      showToast("Vui lòng điền mã và tên sân bay!", "error");
      return;
    }

    const translationPayload: AirportTranslationDto[] = LOCALES
      .filter(loc => translations[loc]?.name.trim())
      .map(loc => ({
        locale: loc,
        name: translations[loc].name.trim(),
        description: translations[loc].description.trim() || undefined,
      }));

    const payload = {
      code: code.trim(),
      name: name.trim(),
      location: location.trim(),
      active,
      translations: translationPayload,
    };

    setLoading(true);
    try {
      if (airport?.id) {
        await updateAirport(airport.id, payload);
        showToast("Cập nhật sân bay thành công!", "success");
      } else {
        await createAirport(payload);
        showToast("Tạo sân bay mới thành công!", "success");
      }
      onSaveSuccess();
      onClose();
    } catch (err) {
      showToast("Lưu thông tin thất bại!", "error");
    } finally {
      setLoading(false);
    }
  };

  const isView = mode === "view";

  const renderTranslationFields = () => (
    <div className="space-y-3">
      <TextField className="w-full">
        <Label className="text-xs font-bold uppercase tracking-wider">
          {"Tên"} ({activeLocale.toUpperCase()})
        </Label>
        <Input
          type="text"
          value={translations[activeLocale]?.name || ""}
          onChange={(e) => handleTranslationChange(activeLocale, "name", e.target.value)}
          readOnly={isView}
          className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800"
        />
      </TextField>
      <div>
        <Label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">
          {"Mô tả"} ({activeLocale.toUpperCase()})
        </Label>
        <textarea
          rows={3}
          readOnly={isView}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-55 dark:bg-black text-slate-805 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium resize-none"
          value={translations[activeLocale]?.description || ""}
          onChange={(e) => handleTranslationChange(activeLocale, "description", e.target.value)}
        />
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop className="bg-slate-950/40 backdrop-blur-sm">
        <ModalContainer size="lg">
          <ModalDialog className="bg-white dark:bg-black rounded-3xl border border-divider shadow-2xl overflow-hidden animate-scale-up w-full max-w-2xl relative">
            <Button
              isIconOnly
              variant="ghost"
              onClick={onClose}
              aria-label="Đóng"
              className="absolute top-4 right-4 z-50 rounded-xl text-slate-400 hover:text-slate-750 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border-none"
            >
              <X size={18} />
            </Button>

            <ModalHeader className="px-6 py-4 border-b border-divider bg-slate-50 dark:bg-black/40 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {isView ? "Chi Tiết Sân Bay" : airport ? "Chỉnh Sửa Sân Bay" : "Tạo Sân Bay Mới"}
                </h2>
                <p className="text-xs text-slate-500">
                  {isView ? "Xem thông tin mã, tên đa ngôn ngữ và vị trí sân bay." : "Quản lý mã, tên đa ngôn ngữ và vị trí sân bay."}
                </p>
              </div>
            </ModalHeader>

            {isView ? (
              <>
                <ModalBody className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">{"Mã Sân Bay (IATA)"}</Label>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{code || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">{"Vị Trí"}</Label>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{location || "—"}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">{"Tên Mặc Định"}</Label>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{name || "—"}</p>
                  </div>

                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">{"Trạng Thái"}</Label>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{active ? "Hoạt động" : "Ngừng hoạt động"}</p>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                    <Label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-3 uppercase tracking-wider">
                      {"Bản dịch đa ngôn ngữ"}
                    </Label>
                    <Tabs
                      aria-label="Chọn ngôn ngữ"
                      selectedKey={activeLocale}
                      onSelectionChange={(key) => setActiveLocale(key as string)}
                      className="w-full"
                    >
                      <Tabs.ListContainer>
                        <Tabs.List aria-label="Ngôn ngữ" className="dark:bg-black/10 border">
                          {LOCALES.map(loc => (
                            <Tabs.Tab key={loc} id={loc}>
                              {LOCALE_LABELS[loc]}
                              <Tabs.Indicator className="bg-[#ffcc00a4]" />
                            </Tabs.Tab>
                          ))}
                        </Tabs.List>
                      </Tabs.ListContainer>
                    </Tabs>
                    <div className="space-y-3 pt-3">
                      <div>
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {"Tên"} ({activeLocale.toUpperCase()})
                        </Label>
                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{translations[activeLocale]?.name || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {"Mô tả"} ({activeLocale.toUpperCase()})
                        </Label>
                        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{translations[activeLocale]?.description || "—"}</p>
                      </div>
                    </div>
                  </div>
                </ModalBody>

                <ModalFooter className="px-6 py-4 border-t border-divider bg-slate-50 dark:bg-black/40 flex items-center justify-end gap-3 flex-shrink-0">
                  <Button
                    variant="outline"
                    className="rounded-xl font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-none"
                    onClick={onClose}
                  >
                    {"Đóng"}
                  </Button>
                  <Button
                    className="rounded-xl font-bold bg-[#C9A227] hover:bg-[#B8911F] text-white shadow-md border-none"
                    onPress={() => setMode("edit")}
                  >
                    <Pencil size={16} className="mr-1.5" />
                    {"Chỉnh sửa"}
                  </Button>
                </ModalFooter>
              </>
            ) : (
              <form onSubmit={handleSave}>
                <ModalBody className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <TextField isRequired className="w-full">
                      <Label className="text-xs font-bold uppercase tracking-wider">
                        {"Mã Sân Bay (IATA)"}
                      </Label>
                      <Input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. CXR" className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800" />
                    </TextField>
                    <TextField className="w-full">
                      <Label className="text-xs font-bold uppercase tracking-wider">
                        {"Vị Trí"}
                      </Label>
                      <Input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Cam Ranh, Khánh Hòa" className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800" />
                    </TextField>
                  </div>

                  <TextField isRequired className="w-full">
                    <Label className="text-xs font-bold uppercase tracking-wider">
                      {"Tên Mặc Định"}
                    </Label>
                    <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cam Ranh International Airport" className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800" />
                  </TextField>

                  <div className="flex items-center gap-3 py-2">
                    <Checkbox
                      id="airport-active"
                      isSelected={active}
                      onChange={(val: boolean) => setActive(val)}
                    >
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                      </Checkbox.Content>
                    </Checkbox>
                    <Label htmlFor="airport-active" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                      {"Kích hoạt"}
                    </Label>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                    <Label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-3 uppercase tracking-wider">
                      {"Bản dịch đa ngôn ngữ"}
                    </Label>
                    <Tabs
                      aria-label="Chọn ngôn ngữ"
                      selectedKey={activeLocale}
                      onSelectionChange={(key) => setActiveLocale(key as string)}
                      className="w-full"
                    >
                      <Tabs.ListContainer>
                        <Tabs.List aria-label="Ngôn ngữ" className="dark:bg-black/10 border">
                          {LOCALES.map(loc => (
                            <Tabs.Tab key={loc} id={loc}>
                              {LOCALE_LABELS[loc]}
                              <Tabs.Indicator className="bg-[#ffcc00a4]" />
                            </Tabs.Tab>
                          ))}
                        </Tabs.List>
                      </Tabs.ListContainer>
                    </Tabs>
                    {renderTranslationFields()}
                  </div>
                </ModalBody>

                <ModalFooter className="px-6 py-4 border-t border-divider bg-slate-50 dark:bg-black/40 flex items-center justify-end gap-3 flex-shrink-0">
                  <Button
                    variant="outline"
                    className="rounded-xl font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-none"
                    onClick={() => airport ? setMode("view") : onClose()}
                    isDisabled={loading}
                  >
                    {"Hủy bỏ"}
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
                    {"Lưu lại"}
                  </Button>
                </ModalFooter>
              </form>
            )}
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
