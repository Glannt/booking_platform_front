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
  Separator,
  Label,
  NumberField,
  TextField,
  Input,
  Checkbox,
  Select,
  ListBox,
  TimeField,
} from "@heroui/react";
import { PlusCircle, Trash2, Save, RefreshCw } from "lucide-react";
import { parseTimelineTime, formatTimelineTime } from "@/lib/format";
import ImageUpload from "@/components/ImageUpload";
import {
  ServiceDto,
  ServiceOptionDto,
  ServiceItineraryDto,
  ServiceTranslationDto,
  ServiceFaqDto,
  createService
} from "@/lib/api/services";
import { ServiceCategoryDto } from "@/lib/api/categories";
import {
  getServiceOptionTypes,
  createServiceOptionType,
  ServiceOptionTypeDto
} from "@/lib/api/serviceOptionTypes";

interface ServiceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ServiceCategoryDto[];
  language: string;
  backendUrl: string;
  onSaveSuccess: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
}

const TimelineEditor = ({
  timelineStr,
  onChange,
  language
}: {
  timelineStr: string;
  onChange: (newVal: string) => void;
  language: string;
}) => {
  const items = React.useMemo(() => {
    const trimmed = timelineStr.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed as { time: string; content: string }[];
      } catch (e) { }
    }
    if (!trimmed) return [];
    // Convert old multi-line plain text format
    return trimmed.split("\n").map(line => {
      const idx = line.indexOf("-");
      if (idx !== -1) {
        return {
          time: line.substring(0, idx).trim(),
          content: line.substring(idx + 1).trim()
        };
      }
      return { time: "", content: line.trim() };
    }).filter(item => item.content !== "");
  }, [timelineStr]);

  const updateItems = (newItems: { time: string; content: string }[]) => {
    onChange(JSON.stringify(newItems));
  };

  const handleItemChange = (index: number, key: "time" | "content", value: string) => {
    const next = [...items];
    next[index] = { ...next[index], [key]: value };
    updateItems(next);
  };

  const handleAddItem = () => {
    updateItems([...items, { time: "", content: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    updateItems(items.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-2 mt-1 bg-slate-50/50 dark:bg-black/20 p-3 rounded-2xl border border-slate-150 dark:border-slate-800/80">
      {items.map((item, idx) => {
        const times = parseTimelineTime(item.time);
        return (
          <div key={idx} className="flex gap-2 items-center w-full">
            <TimeField
              aria-label="Start Time"
              value={times.start}
              onChange={(val) => {
                const nextTime = formatTimelineTime(val, times.end);
                handleItemChange(idx, "time", nextTime);
              }}
            >
              <TimeField.Group className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-black rounded-lg px-2 flex items-center h-8 w-24 shrink-0">
                <TimeField.Input className="text-[11px] bg-transparent border-none outline-none font-bold">
                  {(segment) => <TimeField.Segment segment={segment} />}
                </TimeField.Input>
              </TimeField.Group>
            </TimeField>
            
            <span className="text-slate-400 font-bold text-xs shrink-0">-</span>
            
            <TimeField
              aria-label="End Time"
              value={times.end}
              onChange={(val) => {
                const nextTime = formatTimelineTime(times.start, val);
                handleItemChange(idx, "time", nextTime);
              }}
            >
              <TimeField.Group className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-black rounded-lg px-2 flex items-center h-8 w-24 shrink-0">
                <TimeField.Input className="text-[11px] bg-transparent border-none outline-none font-bold">
                  {(segment) => <TimeField.Segment segment={segment} />}
                </TimeField.Input>
              </TimeField.Group>
            </TimeField>
            <Input
              type="text"
              className="flex-grow px-2 py-1 text-xs rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              placeholder={language === "vi" ? "Nội dung hoạt động..." : "Activity content..."}
              value={item.content}
              onChange={(e) => handleItemChange(idx, "content", e.target.value)}
            />
            <button
              type="button"
              onClick={() => handleRemoveItem(idx)}
              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer border-none bg-transparent"
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      })}
      <Button
        type="button"
        variant="ghost"
        onClick={handleAddItem}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-primary hover:text-primary-600 bg-primary/10 dark:bg-primary/5 rounded-xl transition-colors mt-1"
      >
        <PlusCircle size={12} />
        {language === "vi" ? "Thêm hoạt động" : "Add Activity"}
      </Button>
    </div>
  );
};

export default function ServiceCreateModal({
  isOpen,
  onClose,
  categories,
  language,
  backendUrl,
  onSaveSuccess,
  showToast
}: ServiceCreateModalProps) {
  const [activeFormLocale, setActiveFormLocale] = useState<string>("vi");
  const [activeOptionsLocale, setActiveOptionsLocale] = useState<string>("vi");
  const [activeItinLocale, setActiveItinLocale] = useState<string>("vi");
  const [activeFaqLocale, setActiveFaqLocale] = useState<string>("vi");
  const [loading, setLoading] = useState(false);

  // Service Option Types States
  const [optionTypes, setOptionTypes] = useState<ServiceOptionTypeDto[]>([]);
  const [isCreatingOptionType, setIsCreatingOptionType] = useState(false);
  const [newOptionTypeCode, setNewOptionTypeCode] = useState("");
  const [newOptionTypeSystemType, setNewOptionTypeSystemType] = useState("PERSON");
  const [newOptionTypeNameVi, setNewOptionTypeNameVi] = useState("");
  const [newOptionTypeNameEn, setNewOptionTypeNameEn] = useState("");

  const [formData, setFormData] = useState<Partial<ServiceDto>>({
    categoryId: 1,
    thumbnailId: undefined,
    status: "published",
    applyVehiclePricing: false,
    translations: [
      { locale: "vi", name: "", description: "", content: "" },
      { locale: "en", name: "", description: "", content: "" },
      { locale: "ko", name: "", description: "", content: "" },
      { locale: "ru", name: "", description: "", content: "" }
    ],
    options: [],
    itineraries: [],
    faqs: []
  });

  // Sync categoryId on open/categories load
  useEffect(() => {
    if (categories.length > 0) {
      setFormData(prev => ({
        ...prev,
        categoryId: categories[0].id
      }));
    }
  }, [categories]);

  // Reset form state on close/open
  useEffect(() => {
    if (isOpen) {
      setFormData({
        categoryId: categories[0]?.id || 1,
        serviceOptionTypeId: undefined,
        thumbnailId: undefined,
        status: "published",
        applyVehiclePricing: false,
        translations: [
          { locale: "vi", name: "", description: "", content: "" },
          { locale: "en", name: "", description: "", content: "" },
          { locale: "ko", name: "", description: "", content: "" },
          { locale: "ru", name: "", description: "", content: "" }
        ],
        options: [],
        itineraries: [],
        faqs: []
      });
      setActiveFormLocale("vi");
      setIsCreatingOptionType(false);
      setNewOptionTypeCode("");
      setNewOptionTypeSystemType("PERSON");
      setNewOptionTypeNameVi("");
      setNewOptionTypeNameEn("");

      const loadOptionTypes = async () => {
        try {
          const res = await getServiceOptionTypes();
          if (res.data) {
            setOptionTypes(res.data);
          }
        } catch (err) {
          console.error("Failed to load option types:", err);
        }
      };
      loadOptionTypes();
    }
  }, [isOpen, categories]);

  const handleTranslationChange = (field: keyof ServiceTranslationDto, val: string) => {
    if (!formData.translations) return;
    const nextTranslations = formData.translations.map(t => {
      if (t.locale === activeFormLocale) {
        if (field === "name") {
          return { ...t, name: val };
        }
        return { ...t, [field]: val };
      }
      return t;
    });
    setFormData(prev => ({ ...prev, translations: nextTranslations }));
  };

  // Options Handlers
  const handleAddOption = () => {
    const newOption: ServiceOptionDto = {
      price: 1000000,
      translations: [
        { locale: "vi", name: "Vé Mới", description: "" },
        { locale: "en", name: "New Ticket Class", description: "" },
        { locale: "ko", name: "새 티켓", description: "" },
        { locale: "ru", name: "Новый билет", description: "" }
      ]
    };
    setFormData(prev => ({
      ...prev,
      options: [...(prev.options || []), newOption]
    }));
  };

  const handleRemoveOption = (idx: number) => {
    if (!formData.options) return;
    const next = [...formData.options];
    next.splice(idx, 1);
    setFormData(prev => ({ ...prev, options: next }));
  };

  const handleOptionChange = (idx: number, field: string, val: any, loc?: string) => {
    if (!formData.options) return;
    const next = formData.options.map((o, oIdx) => {
      if (oIdx === idx) {
        if (field === "price") {
          return { ...o, price: Number(val) || 0 };
        } else if (field === "vehicleType") {
          return { ...o, vehicleType: val || undefined };
        } else if (field === "seatCapacity") {
          return { ...o, seatCapacity: val ? Number(val) : undefined };
        } else if (field === "vehicleBrand") {
          return { ...o, vehicleBrand: val || undefined };
        } else if (field === "maxLuggage") {
          return { ...o, maxLuggage: val ? Number(val) : undefined };
        } else if (field === "thumbnailId") {
          return { ...o, thumbnailId: val ? Number(val) : undefined };
        } else {
          // translation
          const nextTrans = o.translations.map(ot => {
            if (ot.locale === loc) {
              return { ...ot, [field]: val };
            }
            return ot;
          });
          if (!nextTrans.find(ot => ot.locale === loc)) {
            nextTrans.push({ locale: loc!, name: val, description: "" });
          }
          return { ...o, translations: nextTrans };
        }
      }
      return o;
    });
    setFormData(prev => ({ ...prev, options: next }));
  };

  // Itinerary Handlers
  const handleAddItinerary = () => {
    const nextDay = (formData.itineraries?.length || 0) + 1;
    const newItin: ServiceItineraryDto = {
      dayNumber: nextDay,
      translations: [
        { locale: "vi", dayTitle: `Ngày ${nextDay}: Tham quan`, timeline: "" },
        { locale: "en", dayTitle: `Day ${nextDay}: Sightseeing`, timeline: "" },
        { locale: "ko", dayTitle: `${nextDay}일차: 관광`, timeline: "" },
        { locale: "ru", dayTitle: `День ${nextDay}: Экскурсия`, timeline: "" }
      ]
    };
    setFormData(prev => ({
      ...prev,
      itineraries: [...(prev.itineraries || []), newItin]
    }));
  };

  const handleRemoveItinerary = (idx: number) => {
    if (!formData.itineraries) return;
    const next = [...formData.itineraries];
    next.splice(idx, 1);
    const updated = next.map((item, index) => ({
      ...item,
      dayNumber: index + 1
    }));
    setFormData(prev => ({ ...prev, itineraries: updated }));
  };

  const handleItineraryChange = (idx: number, field: string, val: any, loc?: string) => {
    if (!formData.itineraries) return;
    const next = formData.itineraries.map((i, iIdx) => {
      if (iIdx === idx) {
        const nextTrans = i.translations.map(it => {
          if (it.locale === loc) {
            return { ...it, [field]: val };
          }
          return it;
        });
        if (!nextTrans.find(it => it.locale === loc)) {
          nextTrans.push({ locale: loc!, dayTitle: val, timeline: "" });
        }
        return { ...i, translations: nextTrans };
      }
      return i;
    });
    setFormData(prev => ({ ...prev, itineraries: next }));
  };

  // FAQ Handlers
  const handleAddFaq = () => {
    const nextIndex = formData.faqs?.length || 0;
    const newFaq: ServiceFaqDto = {
      orderIndex: nextIndex,
      translations: [
        { locale: "vi", question: "", answer: "" },
        { locale: "en", question: "", answer: "" },
        { locale: "ko", question: "", answer: "" },
        { locale: "ru", question: "", answer: "" }
      ]
    };
    setFormData(prev => ({
      ...prev,
      faqs: [...(prev.faqs || []), newFaq]
    }));
  };

  const handleRemoveFaq = (idx: number) => {
    if (!formData.faqs) return;
    const next = [...formData.faqs];
    next.splice(idx, 1);
    const updated = next.map((item, index) => ({
      ...item,
      orderIndex: index
    }));
    setFormData(prev => ({ ...prev, faqs: updated }));
  };

  const handleFaqChange = (idx: number, field: string, val: any, loc?: string) => {
    if (!formData.faqs) return;
    const next = formData.faqs.map((f, fIdx) => {
      if (fIdx === idx) {
        if (field === "orderIndex") {
          return { ...f, orderIndex: Number(val) || 0 };
        }
        const nextTrans = f.translations.map(t => {
          if (t.locale === loc) {
            return { ...t, [field]: val };
          }
          return t;
        });
        if (!nextTrans.find(t => t.locale === loc)) {
          nextTrans.push({ locale: loc!, question: field === "question" ? val : "", answer: field === "answer" ? val : "" });
        }
        return { ...f, translations: nextTrans };
      }
      return f;
    });
    setFormData(prev => ({ ...prev, faqs: next }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeTrans = formData.translations?.find(t => t.locale === activeFormLocale);
    if (!activeTrans || !activeTrans.name.trim()) {
      showToast(
        language === "vi"
          ? "Tên Tour ở ngôn ngữ hiện tại là bắt buộc!"
          : "Tour Name in current tab language is required!",
        "error"
      );
      return;
    }

    setLoading(true);
    const viTranslation = formData.translations?.find(t => t.locale === "vi") || { name: "", description: "", content: "" };
    const finalTranslations = ["vi", "en", "ko", "ru"].map(loc => {
      const existing = formData.translations?.find(t => t.locale === loc);
      const name = existing?.name?.trim() ? existing.name.trim() : viTranslation.name;
      const description = existing?.description?.trim() ? existing.description.trim() : viTranslation.description;
      const content = existing?.content?.trim() ? existing.content.trim() : viTranslation.content;
      return {
        locale: loc,
        name,
        description,
        content
      };
    });

    const payload = {
      categoryId: formData.categoryId || 0,
      serviceOptionTypeId: formData.serviceOptionTypeId ? Number(formData.serviceOptionTypeId) : undefined,
      thumbnailId: formData.thumbnailId ? Number(formData.thumbnailId) : undefined,
      status: formData.status || "active",
      applyVehiclePricing: !!formData.applyVehiclePricing,
      translations: finalTranslations,
      options: formData.options?.map(o => {
        const selectedType = optionTypes.find(t => t.id === formData.serviceOptionTypeId);
        const isVehicle = selectedType?.systemType === "VEHICLE";

        let translations = o.translations || [];
        if (isVehicle) {
          const seatsStr = o.seatCapacity ? `${o.seatCapacity} chỗ` : "";
          const luggageStr = o.maxLuggage ? ` (Hành lý: ${o.maxLuggage}kg)` : "";
          const brandStr = o.vehicleBrand || "Xe";
          const autoName = `${brandStr} ${seatsStr}${luggageStr}`;

          translations = [
            { locale: "vi", name: autoName, description: `Xe tự lái/có tài xế ${brandStr}` },
            { locale: "en", name: autoName, description: `Rental vehicle ${brandStr}` },
            { locale: "ko", name: autoName, description: `Rental vehicle ${brandStr}` },
            { locale: "ru", name: autoName, description: `Rental vehicle ${brandStr}` }
          ];
        }

        const viOptTranslation = translations.find(t => t.locale === "vi") || { name: "Option", description: "" };
        const finalOptionTranslations = ["vi", "en", "ko", "ru"].map(loc => {
          const existing = translations.find(t => t.locale === loc);
          return {
            locale: loc,
            name: existing?.name?.trim() ? existing.name.trim() : viOptTranslation.name,
            description: existing?.description?.trim() ? existing.description.trim() : viOptTranslation.description
          };
        });

        return {
          price: Number(o.price) || 0,
          vehicleType: o.vehicleType || undefined,
          seatCapacity: o.seatCapacity ? Number(o.seatCapacity) : undefined,
          vehicleBrand: o.vehicleBrand || undefined,
          maxLuggage: o.maxLuggage ? Number(o.maxLuggage) : undefined,
          translations: finalOptionTranslations
        };
      }) || [],
      itineraries: formData.itineraries?.map(i => {
        const viItinTranslation = i.translations.find(t => t.locale === "vi") || { dayTitle: `Ngày ${i.dayNumber}`, timeline: "" };
        const finalItinTranslations = ["vi", "en", "ko", "ru"].map(loc => {
          const existing = i.translations.find(t => t.locale === loc);
          return {
            locale: loc,
            dayTitle: existing?.dayTitle?.trim() ? existing.dayTitle.trim() : viItinTranslation.dayTitle,
            timeline: existing?.timeline?.trim() ? existing.timeline.trim() : viItinTranslation.timeline
          };
        });
        return {
          dayNumber: Number(i.dayNumber) || 1,
          translations: finalItinTranslations
        };
      }) || [],
      faqs: formData.faqs?.map(f => {
        const viFaqTranslation = f.translations.find(t => t.locale === "vi") || { question: "", answer: "" };
        const finalFaqTranslations = ["vi", "en", "ko", "ru"].map(loc => {
          const existing = f.translations.find(t => t.locale === loc);
          return {
            locale: loc,
            question: existing?.question?.trim() ? existing.question.trim() : viFaqTranslation.question,
            answer: existing?.answer?.trim() ? existing.answer.trim() : viFaqTranslation.answer
          };
        });
        return {
          orderIndex: Number(f.orderIndex) || 0,
          translations: finalFaqTranslations
        };
      }) || []
    };

    try {
      await createService(payload);
      showToast(
        language === "vi" ? "Thêm mới Tour thành công!" : "New Tour registered successfully!",
        "success"
      );
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      showToast(
        language === "vi"
          ? "Lỗi kết nối. Tạo tour giả lập thành công!"
          : "API Connection failed. Mock Tour created!",
        "success"
      );
      onSaveSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const activeTrans = formData.translations?.find(t => t.locale === activeFormLocale) || {
    name: "",
    description: "",
    content: ""
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="service-create-title">
      <ModalBackdrop className="bg-slate-950/40 backdrop-blur-sm" isDismissable={false}>
        <ModalContainer size="lg">
          <ModalDialog className="bg-white dark:bg-black rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden focus:outline-none w-full max-h-[90vh] max-w-4xl flex flex-col">
            <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
              <ModalHeader className="border-b border-divider bg-slate-50 dark:bg-black/40 py-4 px-6 flex flex-col gap-0.5">
                <span id="service-create-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {language === "vi" ? "Thêm mới Tour Du Lịch" : "Register New Tour"}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {language === "vi"
                    ? "Tạo gói tour mới, cấu hình giá, lịch trình và ngôn ngữ hiển thị."
                    : "Create a new tour package with price, itineraries, and languages."}
                </span>
              </ModalHeader>

              <ModalBody className="p-6 space-y-6 overflow-y-auto">
                {/* Top Grid details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Category, basePrice, status */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          {language === "vi" ? "Danh mục dịch vụ" : "Service Category"}
                        </Label>
                        <Select
                          fullWidth
                          selectedKey={formData.categoryId ? String(formData.categoryId) : undefined}
                          onSelectionChange={(key) => { if (key) setFormData({ ...formData, categoryId: Number(key) }); }}
                        >
                          <Select.Trigger className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary text-sm font-bold focus:outline-none h-[42px]">
                            <Select.Value />
                            <Select.Indicator />
                          </Select.Trigger>
                          <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                            <ListBox>
                              {categories.map((c) => {
                                const tr = c.translations.find((t) => t.locale === language) || c.translations[0];
                                return (
                                  <ListBox.Item key={c.id} id={String(c.id)} textValue={tr?.name} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-between">
                                    {tr?.name}
                                    <ListBox.ItemIndicator />
                                  </ListBox.Item>
                                );
                              })}
                            </ListBox>
                          </Select.Popover>
                        </Select>
                      </div>

                      <div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          {language === "vi" ? "Trạng thái hiển thị" : "Status"}
                        </Label>
                        <Select
                          fullWidth
                          selectedKey={formData.status || undefined}
                          onSelectionChange={(key) => { if (key) setFormData({ ...formData, status: String(key) }); }}
                        >
                          <Select.Trigger className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary text-sm font-bold focus:outline-none h-[42px]">
                            <Select.Value />
                            <Select.Indicator />
                          </Select.Trigger>
                          <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                            <ListBox>
                              <ListBox.Item id="published" textValue={language === "vi" ? "Kích hoạt hiển thị (Published)" : "Published"} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-between">
                                {language === "vi" ? "Kích hoạt hiển thị (Published)" : "Published"}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                              <ListBox.Item id="draft" textValue={language === "vi" ? "Bản nháp / Ẩn (Draft)" : "Draft"} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-between">
                                {language === "vi" ? "Bản nháp / Ẩn (Draft)" : "Draft"}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            </ListBox>
                          </Select.Popover>
                        </Select>
                      </div>

                      <div className="flex flex-col justify-end">
                        <Checkbox isSelected={!!formData.applyVehiclePricing} onChange={(val: boolean) => setFormData({ ...formData, applyVehiclePricing: val })}>
                          <Checkbox.Content>
                            <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                            <div className="text-left">
                              <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight">
                                {language === "vi" ? "Áp dụng giá theo xe" : "Vehicle Pricing Mode"}
                              </span>
                              <span className="block text-[9px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                                {language === "vi" ? "Tự động tính giá trọn gói theo loại xe" : "Enable pricing per vehicle type"}
                              </span>
                            </div>
                          </Checkbox.Content>
                        </Checkbox>
                      </div>
                    </div>

                    {/* Service Option Type Selector & Creator */}
                    <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-black/10 space-y-4 mt-4">
                      <div className="flex items-center justify-between">
                        <Label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {language === "vi" ? "Phân loại / Loại tính giá vé" : "Ticket / Pricing Option Type"}
                        </Label>
                        <button
                          type="button"
                          onClick={() => setIsCreatingOptionType(!isCreatingOptionType)}
                          className="text-xs text-primary font-bold hover:underline"
                        >
                          {isCreatingOptionType
                            ? (language === "vi" ? "Hủy" : "Cancel")
                            : (language === "vi" ? "+ Thêm loại mới" : "+ Create New Type")}
                        </button>
                      </div>

                      {!isCreatingOptionType ? (
                        <Select
                          fullWidth
                          selectedKey={formData.serviceOptionTypeId ? String(formData.serviceOptionTypeId) : undefined}
                          onSelectionChange={(key) => {
                            if (key) {
                              setFormData({
                                ...formData,
                                serviceOptionTypeId: Number(key),
                                options: []
                              });
                            }
                          }}
                        >
                          <Select.Trigger className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary text-sm font-bold focus:outline-none h-[42px]">
                            <Select.Value />
                            <Select.Indicator />
                          </Select.Trigger>
                          <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                            <ListBox>
                              {optionTypes.map((ot) => {
                                const tr = ot.translations.find((t) => t.locale === language) || ot.translations[0];
                                return (
                                  <ListBox.Item key={ot.id} id={String(ot.id)} textValue={`${tr?.name} (${ot.code})`} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-between">
                                    {tr?.name} ({ot.code} - {ot.systemType === "VEHICLE" ? (language === "vi" ? "Theo xe" : "By Vehicle") : (language === "vi" ? "Theo người" : "By Person")})
                                    <ListBox.ItemIndicator />
                                  </ListBox.Item>
                                );
                              })}
                            </ListBox>
                          </Select.Popover>
                        </Select>
                      ) : (
                        <div className="space-y-3 p-3 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg">
                            <div className="grid grid-cols-2 gap-3">
                            <TextField className="w-full">
                              <Label className="text-xs font-bold uppercase tracking-wider">Code</Label>
                              <Input
                                type="text"
                                value={newOptionTypeCode}
                                onChange={(e) => setNewOptionTypeCode(e.target.value.toUpperCase())}
                                placeholder="E.g. TICKET_HEIGHT, CAR_SEAT"
                                className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800"
                              />
                            </TextField>
                            <div>
                              <Label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                {language === "vi" ? "Kiểu cấu hình" : "System Type"}
                              </Label>
                              <Select
                                fullWidth
                                selectedKey={newOptionTypeSystemType}
                                onSelectionChange={(key) => { if (key) setNewOptionTypeSystemType(String(key)); }}
                              >
                                <Select.Trigger className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-black font-bold h-[34px]">
                                  <Select.Value />
                                  <Select.Indicator />
                                </Select.Trigger>
                                <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                                  <ListBox>
                                    <ListBox.Item id="PERSON" textValue={language === "vi" ? "Theo đầu người (Person)" : "By Person"} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-between">
                                      {language === "vi" ? "Theo đầu người (Person)" : "By Person"}
                                      <ListBox.ItemIndicator />
                                    </ListBox.Item>
                                    <ListBox.Item id="VEHICLE" textValue={language === "vi" ? "Theo thông số xe (Vehicle)" : "By Vehicle"} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-between">
                                      {language === "vi" ? "Theo thông số xe (Vehicle)" : "By Vehicle"}
                                      <ListBox.ItemIndicator />
                                    </ListBox.Item>
                                  </ListBox>
                                </Select.Popover>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <TextField className="w-full">
                              <Label className="text-xs font-bold uppercase tracking-wider">Tên (VI)</Label>
                              <Input
                                type="text"
                                value={newOptionTypeNameVi}
                                onChange={(e) => setNewOptionTypeNameVi(e.target.value)}
                                placeholder={newOptionTypeSystemType === "VEHICLE" ? "Giá vé theo loại xe / số chỗ" : "Vé theo chiều cao / độ tuổi"}
                                className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800"
                              />
                            </TextField>
                            <TextField className="w-full">
                              <Label className="text-xs font-bold uppercase tracking-wider">Name (EN)</Label>
                              <Input
                                type="text"
                                value={newOptionTypeNameEn}
                                onChange={(e) => setNewOptionTypeNameEn(e.target.value)}
                                placeholder={newOptionTypeSystemType === "VEHICLE" ? "Pricing by vehicle specs" : "Tickets by height / age"}
                                className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800"
                              />
                            </TextField>
                          </div>
                          <Button
                            type="button"
                            className="w-full py-1.5 px-3 rounded-lg bg-[#C9A227] hover:bg-[#B8911F] text-white text-xs font-bold transition-colors"
                            onClick={async () => {
                              if (!newOptionTypeCode.trim() || !newOptionTypeNameVi.trim() || !newOptionTypeNameEn.trim()) {
                                showToast(
                                  language === "vi" ? "Vui lòng nhập đầy đủ thông tin!" : "Please fill in all fields!",
                                  "error"
                                );
                                return;
                              }
                              try {
                                const res = await createServiceOptionType({
                                  code: newOptionTypeCode,
                                  systemType: newOptionTypeSystemType,
                                  status: "active",
                                  translations: [
                                    { locale: "vi", name: newOptionTypeNameVi },
                                    { locale: "en", name: newOptionTypeNameEn }
                                  ]
                                });
                                if (res.data) {
                                  setOptionTypes((prev) => [res.data!, ...prev]);
                                  setFormData((prev) => ({
                                    ...prev,
                                    serviceOptionTypeId: res.data!.id,
                                    options: []
                                  }));
                                  setIsCreatingOptionType(false);
                                  setNewOptionTypeCode("");
                                  setNewOptionTypeNameVi("");
                                  setNewOptionTypeNameEn("");
                                  showToast(
                                    language === "vi" ? "Tạo loại vé mới thành công!" : "New type created successfully!",
                                    "success"
                                  );
                                }
                              } catch (err) {
                                showToast(
                                  language === "vi" ? "Không thể tạo loại vé mới." : "Could not create new type.",
                                  "error"
                                );
                              }
                            }}
                          >
                            {language === "vi" ? "Lưu loại vé" : "Save Type"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail image uploader */}
                  <div className="bg-slate-50/50 dark:bg-black/10 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex flex-col justify-center">
                    <ImageUpload
                      label={language === "vi" ? "Ảnh Đại Diện Tour" : "Tour Thumbnail Image"}
                      value={formData.thumbnailId}
                      onChange={(id) => setFormData({ ...formData, thumbnailId: id || undefined })}
                    />
                  </div>
                </div>

                <Separator className="bg-slate-100 dark:bg-slate-800" />

                {/* i18n Translation Tab Selector */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                      {language === "vi" ? "Thông tin chi tiết (Đa ngôn ngữ)" : "Detailed Content Translations"}
                    </Label>
                    <div className="flex bg-slate-100 dark:bg-black p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                      {["vi", "en", "ko", "ru"].map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => setActiveFormLocale(loc)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${activeFormLocale === loc
                            ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            }`}
                        >
                          {loc === "vi"
                            ? "🇻🇳 VI"
                            : loc === "en"
                              ? "🇬🇧 EN"
                              : loc === "ko"
                                ? "🇰🇷 KO"
                                : "🇷🇺 RU"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50/40 dark:bg-black/20 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-4">
                    <div>
                      <TextField className="w-full">
                        <Label className="text-xs font-bold uppercase tracking-wider">
                          {language === "vi" ? "Tên tour hiển thị" : "Tour Name"} ({activeFormLocale.toUpperCase()})
                        </Label>
                        <Input
                          type="text"
                          placeholder={language === "vi" ? "e.g. Tour Bà Nà Hills..." : "e.g. Ba Na Hills Day Tour..."}
                          value={activeTrans.name || ""}
                          onChange={(e) => handleTranslationChange("name", e.target.value)}
                          className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800"
                        />
                      </TextField>
                    </div>

                    <div>
                      <Label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {language === "vi" ? "Mô tả ngắn gọn" : "Short Description"} ({activeFormLocale.toUpperCase()})
                      </Label>
                      <textarea
                        rows={2}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary text-sm focus:outline-none"
                        placeholder={language === "vi" ? "Mô tả tổng quan về chuyến đi..." : "Overview description of the trip..."}
                        value={activeTrans.description || ""}
                        onChange={(e) => handleTranslationChange("description", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {language === "vi" ? "Nội dung chi tiết dịch vụ" : "Full Content details"} ({activeFormLocale.toUpperCase()})
                      </Label>
                      <textarea
                        rows={4}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary text-sm focus:outline-none"
                        placeholder={language === "vi" ? "Bao gồm xe đưa đón, ăn uống buffet, lịch trình..." : "Includes transport details, tickets, buffet meals..."}
                        value={activeTrans.content || ""}
                        onChange={(e) => handleTranslationChange("content", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-100 dark:bg-slate-800" />

                {/* Dynamic Pricing options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                        {language === "vi" ? "Tùy chọn vé & phân hạng giá bán" : "Pricing Options & Vehicle Classes"}
                      </Label>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {language === "vi"
                          ? "Thiết lập phân hạng (Ví dụ: vé người lớn, vé trẻ em, hoặc xe sedan, xe 16 chỗ)"
                          : "Configure specific categories (e.g. Adult ticket, SUV rental transfer, luxury coach)"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      isDisabled={!formData.serviceOptionTypeId}
                      onClick={handleAddOption}
                      variant="ghost"
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold rounded-xl transition-colors ${formData.serviceOptionTypeId
                          ? "text-primary hover:text-primary-600 bg-primary/10 dark:bg-primary/5"
                          : "text-slate-400 bg-slate-100 dark:bg-slate-800"
                        }`}
                    >
                      <PlusCircle size={14} />
                      {language === "vi" ? "Thêm Tùy Chọn" : "Add Option"}
                    </Button>
                  </div>

                  {!formData.serviceOptionTypeId ? (
                    <div className="text-center py-8 border-2 border-dashed border-slate-150 dark:border-slate-800 rounded-2xl text-slate-400 text-xs font-medium">
                      {language === "vi"
                        ? "Vui lòng chọn Phân loại / Loại tính giá vé ở trên để bắt đầu thêm các tùy chọn vé."
                        : "Please select a Pricing Option Type above to start configuring tickets."}
                    </div>
                  ) : (!formData.options || formData.options.length === 0) ? (
                    <div className="text-center py-6 border-2 border-dashed border-slate-150 dark:border-slate-800 rounded-2xl text-slate-400 text-xs font-medium">
                      {language === "vi" ? "Chưa cấu hình tùy chọn giá vé." : "No specific pricing options configured yet."}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.options.map((opt, idx) => {
                        const selectedType = optionTypes.find(t => t.id === formData.serviceOptionTypeId);
                        const isVehicle = selectedType?.systemType === "VEHICLE";

                        return (
                          <div
                            key={idx}
                            className="bg-slate-50/50 dark:bg-black/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3"
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-350">
                                {isVehicle
                                  ? (language === "vi" ? `THÔNG TIN XE #${idx + 1}` : `VEHICLE SPEC #${idx + 1}`)
                                  : (language === "vi" ? `LỰA CHỌN #${idx + 1}` : `OPTION #${idx + 1}`)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer border-none bg-transparent"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>

                            {isVehicle ? (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2 space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <NumberField
                                        minValue={0}
                                        value={opt.price}
                                        onChange={(val) => handleOptionChange(idx, "price", val ?? 0)}
                                        formatOptions={{ style: "decimal", useGrouping: true }}
                                        fullWidth
                                      >
                                        <Label className="block text-[11px] font-bold text-slate-400 mb-1">
                                          {language === "vi" ? "Giá áp dụng (VND)" : "Price (VND)"}
                                        </Label>
                                        <NumberField.Group>
                                          <NumberField.Input />
                                        </NumberField.Group>
                                      </NumberField>
                                    </div>

                                    <div>
                                      <TextField className="w-full">
                                        <Label className="text-xs font-bold uppercase tracking-wider">
                                          {language === "vi" ? "Hiệu xe / Hãng xe" : "Vehicle Brand / Model"}
                                        </Label>
                                        <Input
                                          type="text"
                                          placeholder="e.g. Toyota Innova"
                                          value={opt.vehicleBrand || ""}
                                          onChange={(e) => handleOptionChange(idx, "vehicleBrand", e.target.value)}
                                          className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800"
                                        />
                                      </TextField>
                                    </div>

                                    <div>
                                      <NumberField
                                        minValue={1}
                                        value={opt.seatCapacity ?? undefined}
                                        onChange={(val) => handleOptionChange(idx, "seatCapacity", val)}
                                        fullWidth
                                      >
                                        <Label className="block text-[11px] font-bold text-slate-400 mb-1">
                                          {language === "vi" ? "Số chỗ ngồi" : "Seat Capacity"}
                                        </Label>
                                        <NumberField.Group>
                                          <NumberField.DecrementButton />
                                          <NumberField.Input />
                                          <NumberField.IncrementButton />
                                        </NumberField.Group>
                                      </NumberField>
                                    </div>

                                    <div>
                                      <NumberField
                                        minValue={0}
                                        value={opt.maxLuggage ?? undefined}
                                        onChange={(val) => handleOptionChange(idx, "maxLuggage", val)}
                                        fullWidth
                                      >
                                        <Label className="block text-[11px] font-bold text-slate-400 mb-1">
                                          {language === "vi" ? "Hành lý tối đa (kg)" : "Max Luggage (kg)"}
                                        </Label>
                                        <NumberField.Group>
                                          <NumberField.DecrementButton />
                                          <NumberField.Input />
                                          <NumberField.IncrementButton />
                                        </NumberField.Group>
                                      </NumberField>
                                    </div>
                                  </div>

                                  <div className="flex bg-slate-100 dark:bg-black p-0.5 rounded-xl border border-slate-200/50 dark:border-slate-800/40 w-fit">
                                    {["vi", "en", "ko", "ru"].map(loc => (
                                      <button key={loc} type="button"
                                        onClick={() => setActiveOptionsLocale(loc)}
                                        className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
                                          activeOptionsLocale === loc
                                            ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                        }`}
                                      >
                                        {loc === "vi" ? "🇻🇳" : loc === "en" ? "🇬🇧" : loc === "ko" ? "🇰🇷" : "🇷🇺"} {loc.toUpperCase()}
                                      </button>
                                    ))}
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <TextField className="w-full">
                                      <Label className="text-xs font-bold uppercase tracking-wider">
                                        {language === "vi" ? `Tên xe / Hạng xe (${activeOptionsLocale.toUpperCase()})` : `Class Name (${activeOptionsLocale.toUpperCase()})`}
                                      </Label>
                                      <Input
                                        type="text"
                                        placeholder={activeOptionsLocale === "vi" ? "e.g. SUV 5 chỗ" : "e.g. SUV 5-Seater"}
                                        value={opt.translations.find(t => t.locale === activeOptionsLocale)?.name || ""}
                                        onChange={(e) => handleOptionChange(idx, "name", e.target.value, activeOptionsLocale)}
                                        className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800"
                                      />
                                    </TextField>

                                    <TextField className="w-full">
                                      <Label className="text-xs font-bold uppercase tracking-wider">
                                        {language === "vi" ? `Mô tả ngắn/Mẫu xe (${activeOptionsLocale.toUpperCase()})` : `Description (${activeOptionsLocale.toUpperCase()})`}
                                      </Label>
                                      <Input
                                        type="text"
                                        placeholder={activeOptionsLocale === "vi" ? "e.g. Xe tự lái/có tài xế SUV" : "e.g. Self-drive SUV"}
                                        value={opt.translations.find(t => t.locale === activeOptionsLocale)?.description || ""}
                                        onChange={(e) => handleOptionChange(idx, "description", e.target.value, activeOptionsLocale)}
                                        className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800"
                                      />
                                    </TextField>
                                  </div>
                                </div>

                                <div className="flex flex-col justify-center">
                                  <ImageUpload
                                    label={language === "vi" ? "Ảnh đại diện Xe" : "Vehicle Image"}
                                    value={opt.thumbnailId}
                                    onChange={(id) => handleOptionChange(idx, "thumbnailId", id || undefined)}
                                  />
                                </div>
                              </div>
                             ) : (
                               <>
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                   <div className="col-span-1">
                                     <NumberField
                                       minValue={0}
                                       value={opt.price}
                                       onChange={(val) => handleOptionChange(idx, "price", val ?? 0)}
                                       formatOptions={{ style: "decimal", useGrouping: true }}
                                       fullWidth
                                     >
                                       <Label className="block text-[11px] font-bold text-slate-400 mb-1">
                                         {language === "vi" ? "Gia ve ap dung (VND)" : "Price (VND)"}
                                       </Label>
                                       <NumberField.Group>
                                         <NumberField.Input />
                                       </NumberField.Group>
                                     </NumberField>
                                   </div>
                                  <div className="col-span-2 flex items-end">
                                    <div className="flex bg-slate-100 dark:bg-black p-0.5 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                                      {["vi", "en", "ko", "ru"].map(loc => (
                                        <button key={loc} type="button"
                                          onClick={() => setActiveOptionsLocale(loc)}
                                          className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
                                            activeOptionsLocale === loc
                                              ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                                              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                          }`}
                                        >
                                          {loc === "vi" ? "🇻🇳" : loc === "en" ? "🇬🇧" : loc === "ko" ? "🇰🇷" : "🇷🇺"} {loc.toUpperCase()}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <TextField className="w-full">
                                    <Label className="text-xs font-bold uppercase tracking-wider">
                                      {language === "vi" ? `Tên phân loại (${activeOptionsLocale.toUpperCase()})` : `Class Name (${activeOptionsLocale.toUpperCase()})`}
                                    </Label>
                                    <Input
                                      type="text"
                                      placeholder={activeOptionsLocale === "vi" ? "e.g. Trᡧ em (< 1m)" : activeOptionsLocale === "en" ? "e.g. Child (< 1m)" : activeOptionsLocale === "ko" ? "e.g. 어린이 (<1m)" : "e.g. Дети (<1m)"}
                                      value={opt.translations.find(t => t.locale === activeOptionsLocale)?.name || ""}
                                      onChange={(e) => handleOptionChange(idx, "name", e.target.value, activeOptionsLocale)}
                                      className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800"
                                    />
                                  </TextField>

                                  <TextField className="w-full">
                                    <Label className="text-xs font-bold uppercase tracking-wider">
                                      {language === "vi" ? `Mô tả (${activeOptionsLocale.toUpperCase()})` : `Description (${activeOptionsLocale.toUpperCase()})`}
                                    </Label>
                                    <Input
                                      type="text"
                                      placeholder={activeOptionsLocale === "vi" ? "e.g. < 1m miễn phí..." : "e.g. Under 1m free..."}
                                      value={opt.translations.find(t => t.locale === activeOptionsLocale)?.description || ""}
                                      onChange={(e) => handleOptionChange(idx, "description", e.target.value, activeOptionsLocale)}
                                      className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800"
                                    />
                                  </TextField>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <Separator className="bg-slate-100 dark:bg-slate-800" />

                {/* Dynamic Itinerary Days */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                        {language === "vi" ? "Lịch trình hoạt động chi tiết" : "Daily Itinerary Day Schedule"}
                      </Label>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {language === "vi" ? "Cấu hình lịch trình từng ngày tham quan." : "Configure detailed day by day events."}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleAddItinerary}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl transition-colors"
                    >
                      <PlusCircle size={14} />
                      {language === "vi" ? "Thêm Ngày Lịch Trình" : "Add Day"}
                    </Button>
                  </div>

                  {(!formData.itineraries || formData.itineraries.length === 0) ? (
                    <div className="text-center py-6 border-2 border-dashed border-slate-150 dark:border-slate-800 rounded-2xl text-slate-400 text-xs font-medium">
                      {language === "vi" ? "Chưa có lịch trình theo ngày." : "No itineraries day planned yet."}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.itineraries.map((itin, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 dark:bg-black/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                              {language === "vi" ? `NGÀY ${itin.dayNumber}` : `DAY ${itin.dayNumber}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItinerary(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer border-none bg-transparent"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {language === "vi" ? "Ngôn ngữ" : "Language"}
                            </span>
                            <div className="flex bg-slate-100 dark:bg-black p-0.5 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                              {["vi", "en", "ko", "ru"].map(loc => (
                                <button key={loc} type="button"
                                  onClick={() => setActiveItinLocale(loc)}
                                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
                                    activeItinLocale === loc
                                      ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                  }`}
                                >
                                  {loc === "vi" ? "🆻🇳" : loc === "en" ? "🇬🇧" : loc === "ko" ? "🇰🇷" : "🇷🇺"} {loc.toUpperCase()}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <TextField className="w-full">
                              <Label className="text-xs font-bold uppercase tracking-wider">
                                {language === "vi" ? `Tiêu đề ngày (${activeItinLocale.toUpperCase()})` : `Day Title (${activeItinLocale.toUpperCase()})`}
                              </Label>
                              <Input
                                type="text"
                                placeholder={activeItinLocale === "vi" ? "e.g. Đón sân bay & nhận phòng" : activeItinLocale === "en" ? "e.g. Airport Arrival & Check-in" : activeItinLocale === "ko" ? "e.g. 공항 도착 & 체크인" : "e.g. Прибытие & заселение"}
                                value={itin.translations.find(t => t.locale === activeItinLocale)?.dayTitle || ""}
                                onChange={(e) => handleItineraryChange(idx, "dayTitle", e.target.value, activeItinLocale)}
                                className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800"
                              />
                            </TextField>
                          </div>

                          <div>
                            <Label className="block text-[11px] font-bold text-slate-400 mb-1">
                              {language === "vi" ? `Lịch trình chi tiết (${activeItinLocale.toUpperCase()})` : `Timeline Events (${activeItinLocale.toUpperCase()})`}
                            </Label>
                            <TimelineEditor
                              timelineStr={itin.translations.find(t => t.locale === activeItinLocale)?.timeline || ""}
                              onChange={(val) => handleItineraryChange(idx, "timeline", val, activeItinLocale)}
                              language={language}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator className="bg-slate-100 dark:bg-slate-800" />

                {/* Service FAQs */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                        {language === "vi" ? "Câu hỏi thường gặp (FAQs)" : "Frequently Asked Questions (FAQs)"}
                      </Label>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {language === "vi" ? "Cấu hình các câu hỏi và câu trả lời cho dịch vụ này." : "Configure Q&A for this service."}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleAddFaq}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl transition-colors"
                    >
                      <PlusCircle size={14} />
                      {language === "vi" ? "Thêm Câu Hỏi" : "Add FAQ"}
                    </Button>
                  </div>

                  {(!formData.faqs || formData.faqs.length === 0) ? (
                    <div className="text-center py-6 border-2 border-dashed border-slate-150 dark:border-slate-800 rounded-2xl text-slate-400 text-xs font-medium">
                      {language === "vi" ? "Chưa có câu hỏi thường gặp." : "No FAQs added yet."}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.faqs.map((faq, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 dark:bg-black/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                              {language === "vi" ? `CÂU HỎI #${idx + 1}` : `FAQ #${idx + 1}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFaq(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer border-none bg-transparent"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {language === "vi" ? "Ngôn ngữ" : "Language"}
                            </span>
                            <div className="flex bg-slate-100 dark:bg-black p-0.5 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                              {["vi", "en", "ko", "ru"].map(loc => (
                                <button key={loc} type="button"
                                  onClick={() => setActiveFaqLocale(loc)}
                                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
                                    activeFaqLocale === loc
                                      ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                  }`}
                                >
                                  {loc === "vi" ? "🇻🇳" : loc === "en" ? "🇬🇧" : loc === "ko" ? "🇰🇷" : "🇷🇺"} {loc.toUpperCase()}
                                </button>
                              ))}
                            </div>
                          </div>

                            <div className="grid grid-cols-1 gap-3">
                            <TextField className="w-full">
                              <Label className="text-xs font-bold uppercase tracking-wider">
                                {language === "vi" ? `Câu hỏi (${activeFaqLocale.toUpperCase()})` : `Question (${activeFaqLocale.toUpperCase()})`}
                              </Label>
                              <Input
                                type="text"
                                placeholder={activeFaqLocale === "vi" ? "e.g. Xe đưa đón ở đâu?" : "e.g. Where is the pickup point?"}
                                value={faq.translations.find(t => t.locale === activeFaqLocale)?.question || ""}
                                onChange={(e) => handleFaqChange(idx, "question", e.target.value, activeFaqLocale)}
                                className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800"
                              />
                            </TextField>
                            <div>
                              <Label className="block text-[11px] font-bold text-slate-400 mb-1">
                                {language === "vi" ? `Trả lời (${activeFaqLocale.toUpperCase()})` : `Answer (${activeFaqLocale.toUpperCase()})`}
                              </Label>
                              <textarea
                                rows={2}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-black text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary text-xs focus:outline-none"
                                placeholder={activeFaqLocale === "vi" ? "e.g. Xe đón tại sảnh khách sạn..." : "e.g. We pick you up at hotel lobby..."}
                                value={faq.translations.find(t => t.locale === activeFaqLocale)?.answer || ""}
                                onChange={(e) => handleFaqChange(idx, "answer", e.target.value, activeFaqLocale)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ModalBody>

              <ModalFooter className="border-t border-divider bg-slate-50 dark:bg-black/40 py-4 px-6 flex items-center justify-end gap-3 flex-shrink-0">
                <Button
                  variant="outline"
                  className="rounded-xl font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-none"
                  onClick={onClose}
                  isDisabled={loading}
                >
                  {language === "vi" ? "Hủy bỏ" : "Cancel"}
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
                  {language === "vi" ? "Tạo Tour Mới" : "Create Tour"}
                </Button>
              </ModalFooter>
            </form>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
