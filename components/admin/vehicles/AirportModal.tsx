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
  TextField,
  Input,
  Tabs,
  SearchField,
} from "@heroui/react";
import { Save, RefreshCw, Pencil, Edit3, MapPin } from "lucide-react";
import dynamic from "next/dynamic";

import { createAirport, updateAirport, AirportDto, AirportTranslationDto } from "@/lib/api/fleet";
import { searchLocations, reverseGeocode, LocationSearchResult } from "@/lib/api/locations";

const PickupMap = dynamic(() => import("@/components/pickup-map").then((mod) => mod.PickupMap), { ssr: false });

const LOCALES = ["vi", "en", "ko", "ru"] as const;
const LOCALE_LABELS: Record<string, string> = { vi: "Tiếng Việt", en: "English", ko: "한국어", ru: "Русский" };

interface AirportModalProps {
  isOpen: boolean;
  onClose: () => void;
  airport: AirportDto | null;
  onSaveSuccess: () => void | Promise<void>;
  showToast: (msg: string, type: "success" | "error") => void;
  defaultEditMode?: boolean;
}

export default function AirportModal({
  isOpen,
  onClose,
  airport,
  onSaveSuccess,
  showToast,
  defaultEditMode
}: AirportModalProps) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"view" | "edit" | "create">("create");
  const [activeLocale, setActiveLocale] = useState<string>("vi");

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
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
        setMode(defaultEditMode ? "edit" : "view");
        setCode(airport.code || "");
        setName(airport.name || "");
        setLocation(airport.location || "");
        setLatitude(airport.latitude ?? null);
        setLongitude(airport.longitude ?? null);
        setSearchQuery(airport.location || "");
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
        setLatitude(null);
        setLongitude(null);
        setSearchQuery("");
        setSearchResults([]);
        setShowSearchDropdown(false);
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

  const handleSearchLocation = async (query: string) => {
    if (query.length < 2) { setSearchResults([]); return; }
    try {
      const res = await searchLocations(query, "vi", 8);
      setSearchResults(res?.data || []);
    } catch { setSearchResults([]); }
  };

  const handleMapPick = async (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    const addr = await reverseGeocode(lat, lng, "vi");
    if (addr) {
      setLocation(addr);
      setSearchQuery(addr);
    }
  };

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
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
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
      await onSaveSuccess?.();
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
          className="w-full p-2.5 rounded-xl text-xs font-semibold border-1 border-separator"
        />
      </TextField>
      <div>
        <Label className="block text-xs font-bold mb-1">
          {"Mô tả"} ({activeLocale.toUpperCase()})
        </Label>
        <textarea
          rows={3}
          readOnly={isView}
          className="w-full px-3 py-2 rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-card)] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium resize-none"
          value={translations[activeLocale]?.description || ""}
          onChange={(e) => handleTranslationChange(activeLocale, "description", e.target.value)}
        />
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="airport-modal-title">
      <ModalBackdrop className="bg-slate-950/40 backdrop-blur-sm">
        <ModalContainer size="lg">
          <ModalDialog className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-border-secondary shadow-2xl overflow-hidden w-full max-w-2xl flex flex-col max-h-[90vh]">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-separator flex items-center justify-between shrink-0">
              <div>
                <h2 id="airport-modal-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
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
                      <Label className="text-xs font-bold uppercase tracking-wider">{"Mã Sân Bay (IATA)"}</Label>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{code || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider">{"Vị Trí"}</Label>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{location || "—"}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider">{"Tọa Độ (Lat, Lng)"}</Label>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                      {latitude != null && longitude != null ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : "—"}
                    </p>
                    {latitude != null && longitude != null && (
                      <PickupMap lat={latitude} lng={longitude} label={name || location || code || "Sân bay"} />
                    )}
                  </div>

                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider">{"Tên Mặc Định"}</Label>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{name || "—"}</p>
                  </div>

                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider">{"Trạng Thái"}</Label>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{active ? "Hoạt động" : "Ngừng hoạt động"}</p>
                  </div>

                  <div className="border-t border-separator pt-4">
                    <Label className="block text-xs font-bold mb-3 uppercase tracking-wider">
                      {"Bản dịch đa ngôn ngữ"}
                    </Label>
                    <Tabs
                      aria-label="Chọn ngôn ngữ"
                      selectedKey={activeLocale}
                      onSelectionChange={(key) => setActiveLocale(key as string)}
                      className="w-full"
                    >
                      <Tabs.List aria-label="Ngôn ngữ" className="dark:bg-[var(--bg-muted)] border">
                        {LOCALES.map(loc => (
                          <Tabs.Tab key={loc} id={loc}>
                            {LOCALE_LABELS[loc]}
                            <Tabs.Indicator className="bg-[#ffcc00a4]" />
                          </Tabs.Tab>
                        ))}
                      </Tabs.List>
                    </Tabs>
                    <div className="space-y-3 pt-3">
                      <div>
                        <Label className="text-xs font-bold uppercase tracking-wider">
                          {"Tên"} ({activeLocale.toUpperCase()})
                        </Label>
                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{translations[activeLocale]?.name || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-bold uppercase tracking-wider">
                          {"Mô tả"} ({activeLocale.toUpperCase()})
                        </Label>
                        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{translations[activeLocale]?.description || "—"}</p>
                      </div>
                    </div>
                  </div>
                </ModalBody>

                <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
                  <Button
                    variant="outline"
                    className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    onClick={onClose}
                  >
                    {"Đóng"}
                  </Button>
                  <Button
                    type="button"
                    className="rounded-xl font-bold text-xs h-10 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/50 shadow-xs cursor-pointer transition-colors"
                    onPress={() => setMode("edit")}
                  >
                    <Edit3 size={15} className="mr-1.5" />
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
                      <Input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. CXR" className="w-full p-2.5 rounded-xl text-xs font-semibold border-1 border-separator" />
                    </TextField>
                    <div className="relative">
                      <Label className="block text-xs font-bold mb-1">
                        {"Vị Trí"}
                      </Label>
                      <SearchField
                        value={searchQuery}
                        onChange={(v) => {
                          setSearchQuery(v);
                          setLocation(v);
                          setShowSearchDropdown(true);
                          handleSearchLocation(v);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setShowSearchDropdown(true);
                            handleSearchLocation(searchQuery);
                          }
                        }}
                      >
                        <SearchField.Group className="border-1 border-separator">
                          <SearchField.SearchIcon />
                          <SearchField.Input placeholder="Nhập và chọn vị trí..." className="px-3 py-2 rounded-xl text-sm w-full" />
                          <SearchField.ClearButton onClick={() => { setSearchResults([]); setShowSearchDropdown(false); }} />
                        </SearchField.Group>
                      </SearchField>
                      {showSearchDropdown && searchResults.length > 0 && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowSearchDropdown(false)} />
                          <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[var(--bg-surface)] border border-border rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto divide-y divide-separator">
                            {searchResults.map((item) => (
                              <div
                                key={item.id}
                                onClick={() => {
                                  const addr = item.address || item.name;
                                  setSearchQuery(addr);
                                  setLocation(addr);
                                  setLatitude(item.latitude);
                                  setLongitude(item.longitude);
                                  setSearchResults([]);
                                  setShowSearchDropdown(false);
                                }}
                                className="p-2.5 hover:bg-blue-50/50 dark:hover:bg-[var(--bg-card)] cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2"
                              >
                                <MapPin size={12} className="text-blue-500 shrink-0" />
                                <div className="min-w-0">
                                  <span className="block truncate font-semibold">{item.name}</span>
                                  <span className="block truncate text-[10px] text-slate-400">{item.address}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <TextField isRequired className="w-full">
                    <Label className="text-xs font-bold uppercase tracking-wider">
                      {"Tên Mặc Định"}
                    </Label>
                    <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cam Ranh International Airport" className="w-full p-2.5 rounded-xl text-xs font-semibold border-1 border-separator" />
                  </TextField>

                  <div className="relative">
                    <Label className="block text-xs font-bold mb-1">
                      {"Vị Trí Trên Bản Đồ"}
                    </Label>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {latitude != null && longitude != null
                        ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
                        : "Chưa chọn tọa độ — nhấp vào bản đồ để chọn vị trí"}
                    </p>
                    <PickupMap
                      lat={latitude ?? 11.946457}
                      lng={longitude ?? 109.159797}
                      label={name || location || code || "Sân bay"}
                      onPick={handleMapPick}
                    />
                  </div>

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
                    <Label htmlFor="airport-active" className="text-sm font-bold cursor-pointer select-none">
                      {"Kích hoạt"}
                    </Label>
                  </div>

                  <div className="border-t border-separator pt-4">
                    <Label className="block text-xs font-bold mb-3 uppercase tracking-wider">
                      {"Bản dịch đa ngôn ngữ"}
                    </Label>
                    <Tabs
                      aria-label="Chọn ngôn ngữ"
                      selectedKey={activeLocale}
                      onSelectionChange={(key) => setActiveLocale(key as string)}
                      className="w-full"
                    >
                      <Tabs.List aria-label="Ngôn ngữ" className="dark:bg-[var(--bg-muted)] border">
                        {LOCALES.map(loc => (
                          <Tabs.Tab key={loc} id={loc}>
                            {LOCALE_LABELS[loc]}
                            <Tabs.Indicator className="bg-[#ffcc00a4]" />
                          </Tabs.Tab>
                        ))}
                      </Tabs.List>
                    </Tabs>
                    {renderTranslationFields()}
                  </div>
                </ModalBody>

                <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
                  <Button
                    variant="outline"
                    className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    onClick={() => airport ? setMode("view") : onClose()}
                    isDisabled={loading}
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
                    {airport ? "Lưu thay đổi" : "Tạo sân bay"}
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
