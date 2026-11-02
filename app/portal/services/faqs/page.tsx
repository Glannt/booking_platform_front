"use client";

import React, { useState, useEffect } from "react";
import {
  Search, Plus, Trash2, Edit, RefreshCw, Star, MessageSquare
} from "lucide-react";
import {
  Button, Table, Modal, ModalBackdrop, ModalContainer, ModalDialog, ModalCloseTrigger,
  ModalHeader, ModalBody, ModalFooter, Separator, toast,
  Input, TextField, Label, NumberField, Select, ListBox, Tooltip
} from "@heroui/react";
import clsx from "clsx";
import {
  getAllFeedbacks, createFeedback, updateFeedback, deleteFeedback,
  FeedbackDto
} from "@/lib/api/feedback";
import { useI18n } from "@/context/LanguageContext";
import { headerColumns } from "@/config/headerColumns";
import { TableLoadingState, TableEmptyState } from "@/components/common";

export default function AdminFeedbackPage() {
  const { t } = useI18n();

  const [feedbacks, setFeedbacks] = useState<FeedbackDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [activeLocale, setActiveLocale] = useState("vi");
  const [savingId, setSavingId] = useState<number | undefined>(undefined);

  const [form, setForm] = useState<Partial<FeedbackDto>>({
    rating: 5,
    author: "",
    avatarBg: "bg-blue-100 text-blue-600",
    avatarText: "",
    route: "",
    showOnIndex: false,
    orderIndex: 0,
    translations: [
      { locale: "vi", title: "", review: "" },
      { locale: "en", title: "", review: "" },
      { locale: "ko", title: "", review: "" },
      { locale: "ru", title: "", review: "" },
    ]
  });

  const showToast = (msg: string, type: "success" | "error") => {
    type === "success" ? toast.success(msg) : toast.danger(msg);
  };

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await getAllFeedbacks();
      if (res.data) setFeedbacks(res.data);
    } catch {
      showToast("Cannot connect to API.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeedbacks(); }, []);

  const getTranslation = (fb: FeedbackDto) =>
    fb.translations.find(t => t.locale === "vi") ||
    fb.translations[0];

  const filtered = feedbacks.filter(fb => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      fb.author.toLowerCase().includes(term) ||
      fb.translations.some(t =>
        t.title.toLowerCase().includes(term) || t.review.toLowerCase().includes(term)
      )
    );
  });

  const resetForm = () => {
    setForm({
      rating: 5, author: "", avatarBg: "bg-blue-100 text-blue-600",
      avatarText: "", route: "", showOnIndex: false, orderIndex: 0,
      translations: [
        { locale: "vi", title: "", review: "" },
        { locale: "en", title: "", review: "" },
        { locale: "ko", title: "", review: "" },
        { locale: "ru", title: "", review: "" },
      ]
    });
    setActiveLocale("vi");
  };

  const handleOpenCreate = () => {
    setModalMode("create");
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEdit = (fb: FeedbackDto) => {
    setModalMode("edit");
    setSavingId(fb.id);
    const locales = ["vi", "en", "ko", "ru"];
    const translations = locales.map(loc => {
      const existing = fb.translations.find(t => t.locale === loc);
      return existing || { locale: loc, title: "", review: "" };
    });
    setForm({ ...fb, translations });
    setActiveLocale("vi");
    setModalOpen(true);
  };

  const handleTranslationChange = (locale: string, field: "title" | "review", val: string) => {
    setForm(prev => ({
      ...prev,
      translations: (prev.translations || []).map(t =>
        t.locale === locale ? { ...t, [field]: val } : t
      )
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.author?.trim()) {
      showToast("Tên tác giả là bắt buộc!", "error");
      return;
    }
    const validTrans = (form.translations || []).filter(t => t.title.trim());
    if (!validTrans.length) {
      showToast("Cần ít nhất 1 bản dịch tiêu đề!", "error");
      return;
    }
    const payload = {
      rating: form.rating || 5,
      author: form.author || "",
      avatarBg: form.avatarBg || "",
      avatarText: form.avatarText || (form.author?.substring(0, 2).toUpperCase() || ""),
      route: form.route || "",
      showOnIndex: !!form.showOnIndex,
      orderIndex: form.orderIndex || 0,
      translations: (form.translations || []).filter(t => t.title.trim())
    };
    try {
      setLoading(true);
      if (modalMode === "create") {
        await createFeedback(payload);
        showToast("Tạo feedback thành công!", "success");
      } else {
        await updateFeedback(savingId!, payload);
        showToast("Cập nhật feedback thành công!", "success");
      }
      await fetchFeedbacks();
      setModalOpen(false);
    } catch {
      showToast("Lỗi kết nối server.", "error");
      setLoading(false);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!confirm("Xóa feedback này?")) return;
    try {
      setLoading(true);
      await deleteFeedback(id);
      showToast("Đã xóa feedback!", "success");
      fetchFeedbacks();
    } catch {
      showToast("Error deleting feedback.", "error");
      setLoading(false);
    }
  };

  const handleToggleIndex = async (fb: FeedbackDto) => {
    try {
      await updateFeedback(fb.id!, { ...fb, showOnIndex: !fb.showOnIndex });
      fetchFeedbacks();
    } catch {
      showToast("Error updating.", "error");
    }
  };

  const activeTrans = (form.translations || []).find(t => t.locale === activeLocale);

  return (
    <div className="w-full space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-black p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            type="text"
            placeholder="Tìm kiếm feedback..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[var(--bg-card)] dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200 border-none shadow-sm" onClick={fetchFeedbacks}>
            <RefreshCw size={16} className="mr-1.5" />
            Làm mới
          </Button>
          <Button
            className="rounded-xl font-bold text-xs h-10 px-4 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none flex items-center gap-1.5 transition-colors"
            onClick={handleOpenCreate}
          >
            <Plus size={16} />
            <span>Thêm Feedback</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <TableLoadingState message="Đang tải..." />
        ) : filtered.length === 0 ? (
          <TableEmptyState
            icon={MessageSquare}
            title="Chưa có feedback nào"
            description="Tạo feedback để hiển thị trên trang chủ."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table aria-label="Feedback management table" className="w-full text-left">
              <Table.ScrollContainer>
                <Table.Content>
                  <Table.Header className="bg-slate-50 dark:bg-black/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    {headerColumns.serviceFaqs(t).map((col) => (
                      <Table.Column
                        key={col.id}
                        id={col.id}
                        isRowHeader={col.isRowHeader}
                        className={col.className}
                      >
                        {col.value}
                      </Table.Column>
                    ))}
                  </Table.Header>
                  <Table.Body className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filtered.map((fb, idx) => {
                      const tr = getTranslation(fb);
                      return (
                        <Table.Row key={fb.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-[var(--bg-page)]/20 transition-colors">
                          <Table.Cell className="px-6 py-4">
                            <div className="flex items-center gap-0.5 text-amber-500">
                              {Array.from({ length: fb.rating }).map((_, i) => (
                                <Star key={i} size={12} fill="currentColor" />
                              ))}
                            </div>
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${fb.avatarBg || "bg-slate-100 text-slate-600"}`}>
                                {fb.avatarText || fb.author.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 dark:text-white block text-sm">{fb.author}</span>
                                {fb.route && <span className="text-[10px] text-slate-400 block">{fb.route}</span>}
                              </div>
                            </div>
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4">
                            <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{tr?.title || "—"}</p>
                            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{tr?.review || "—"}</p>
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4">
                            <button
                              onClick={() => handleToggleIndex(fb)}
                              className={clsx(
                                "relative inline-flex w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer",
                                fb.showOnIndex ? "bg-accent" : "bg-slate-200 dark:bg-[var(--bg-elevated)]"
                              )}
                            >
                              <span className={clsx(
                                "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
                                fb.showOnIndex ? "translate-x-5" : "translate-x-0.5"
                              )} />
                            </button>
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Tooltip delay={300} closeDelay={100}>
                                <Tooltip.Trigger>
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="secondary"
                                    aria-label="Chỉnh sửa"
                                    onPress={() => handleOpenEdit(fb)}
                                  >
                                    <Edit size={15} />
                                  </Button>
                                </Tooltip.Trigger>
                                <Tooltip.Content>
                                  <Tooltip.Arrow />
                                  Chỉnh sửa
                                </Tooltip.Content>
                              </Tooltip>

                              <Tooltip delay={300} closeDelay={100}>
                                <Tooltip.Trigger>
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="danger"
                                    aria-label="Xóa"
                                    onPress={() => handleDelete(fb.id)}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </Tooltip.Trigger>
                                <Tooltip.Content className="text-rose-600 dark:text-rose-400">
                                  <Tooltip.Arrow />
                                  Xóa
                                </Tooltip.Content>
                              </Tooltip>
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onOpenChange={open => { if (!open) setModalOpen(false); }} aria-labelledby="faq-modal-title">
        <ModalBackdrop className="bg-slate-950/40 backdrop-blur-sm" isDismissable={false}>
          <ModalContainer size="lg">
            <ModalDialog className="max-w-3xl bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl w-full max-h-[90vh] flex flex-col focus:outline-none overflow-hidden">
              <ModalCloseTrigger />
              <form onSubmit={handleSave} className="flex flex-col h-full overflow-hidden">
                <ModalHeader className="border-b border-divider bg-slate-50/60 dark:bg-[var(--bg-surface)] py-4 px-6 shrink-0">
                  <span id="faq-modal-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {modalMode === "create" ? "Thêm Feedback mới" : "Chỉnh sửa Feedback"}
                  </span>
                </ModalHeader>

                <ModalBody className="p-6 space-y-5 overflow-y-auto">
                  {/* Author & Meta */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <TextField isRequired className="w-full">
                        <Label className="text-xs font-bold uppercase tracking-wider mb-2">
                          Tên tác giả *
                        </Label>
                        <Input
                          type="text"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-card)] text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary text-sm font-bold focus:outline-none"
                          placeholder="David L."
                          value={form.author || ""}
                          onChange={e => setForm(prev => ({ ...prev, author: e.target.value, avatarText: e.target.value.substring(0, 2).toUpperCase() }))}
                        />
                      </TextField>
                    </div>
                    <div>
                      <TextField className="w-full">
                        <Label className="text-xs font-bold uppercase tracking-wider mb-2">
                          Tuyến đường
                        </Label>
                        <Input
                          type="text"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-card)] text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary text-sm font-medium focus:outline-none"
                          placeholder="Hà Nội ➔ Nội Bài"
                          value={form.route || ""}
                          onChange={e => setForm(prev => ({ ...prev, route: e.target.value }))}
                        />
                      </TextField>
                    </div>
                    <div>
                      <Label className="block text-xs font-bold uppercase tracking-wider mb-2">
                        Rating (1–5)
                      </Label>
                      <Select
                        className="w-full"
                        selectedKey={form.rating ? String(form.rating) : "5"}
                        onSelectionChange={(key) => setForm(prev => ({ ...prev, rating: Number(key) }))}
                      >
                        <Select.Trigger className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-card)] text-slate-850 dark:text-slate-100 focus:ring-2 focus:ring-primary text-sm font-bold focus:outline-none h-[42px] flex items-center justify-between cursor-pointer">
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                          <ListBox>
                            {[1, 2, 3, 4, 5].map((n) => {
                              const label = `${"⭐".repeat(n)} (${n})`;
                              return (
                                <ListBox.Item key={n} id={String(n)} textValue={label}>
                                  {label}
                                  <ListBox.ItemIndicator />
                                </ListBox.Item>
                              );
                            })}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                    </div>
                    <div>
                      <TextField className="w-full">
                        <Label className="text-xs font-bold uppercase tracking-wider mb-2">
                          Quốc gia / Cờ (Emoji hoặc Text)
                        </Label>
                        <Input
                          type="text"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-card)] text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary text-sm font-bold focus:outline-none"
                          placeholder="🇺🇸 United States"
                          value={form.country || ""}
                          onChange={e => setForm(prev => ({ ...prev, country: e.target.value }))}
                        />
                      </TextField>
                    </div>
                  </div>

                  {/* Avatar Color */}
                  <div>
                    <Label className="block text-xs font-bold uppercase tracking-wider mb-2">
                      Màu avatar
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "bg-blue-100 text-blue-600",
                        "bg-emerald-100 text-emerald-600",
                        "bg-purple-100 text-purple-600",
                        "bg-amber-100 text-amber-600",
                        "bg-rose-100 text-rose-600",
                        "bg-indigo-100 text-indigo-600",
                      ].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, avatarBg: color }))}
                          className={clsx(
                            "w-9 h-9 rounded-full text-xs font-extrabold flex items-center justify-center border-2 transition-all cursor-pointer",
                            color,
                            form.avatarBg === color ? "border-primary scale-110" : "border-transparent"
                          )}
                        >
                          {form.avatarText || "AB"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* showOnIndex toggle */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, showOnIndex: !prev.showOnIndex }))}
                      className={clsx(
                        "relative inline-flex w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer",
                        form.showOnIndex ? "bg-accent" : "bg-slate-200 dark:bg-[var(--bg-elevated)]"
                      )}
                    >
                      <span className={clsx(
                        "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
                        form.showOnIndex ? "translate-x-5" : "translate-x-0.5"
                      )} />
                    </button>
                    <Label className="text-sm font-bold">
                      Hiển thị trên trang chủ
                    </Label>
                  </div>

                  <Separator className="bg-slate-100 dark:bg-[var(--bg-card)]" />

                  {/* Translations */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="block text-xs font-extrabold uppercase tracking-wider">
                        Nội dung đánh giá (Đa ngôn ngữ)
                      </Label>
                      <div className="flex bg-slate-100 dark:bg-[var(--bg-card)] p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                        {["vi", "en", "ko", "ru"].map(loc => (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => setActiveLocale(loc)}
                            className={clsx(
                              "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                              activeLocale === loc
                                ? "bg-white dark:bg-[var(--bg-surface)] text-primary shadow-sm"
                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            )}
                          >
                            {loc === "vi" ? "🇻🇳 VI" : loc === "en" ? "🇬🇧 EN" : loc === "ko" ? "🇰🇷 KO" : "🇷🇺 RU"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="bg-slate-50/40 dark:bg-[var(--bg-card)]/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-4">
                      <div>
                        <TextField className="w-full">
                          <Label className="block text-xs font-bold uppercase tracking-wider mb-2">
                            Tiêu đề đánh giá ({activeLocale.toUpperCase()})
                          </Label>
                          <Input
                            type="text"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary text-sm font-bold focus:outline-none"
                            placeholder={activeLocale === "vi" ? "VD: Dịch vụ tuyệt vời!" : "E.g. Excellent service!"}
                            value={activeTrans?.title || ""}
                            onChange={e => handleTranslationChange(activeLocale, "title", e.target.value)}
                          />
                        </TextField>
                      </div>
                      <div>
                        <Label className="block text-xs font-bold uppercase tracking-wider mb-2">
                          Nội dung nhận xét ({activeLocale.toUpperCase()})
                        </Label>
                        <textarea
                          rows={4}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary text-sm focus:outline-none"
                          placeholder={activeLocale === "vi" ? "Nhập nội dung đánh giá..." : "Enter review content..."}
                          value={activeTrans?.review || ""}
                          onChange={e => handleTranslationChange(activeLocale, "review", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </ModalBody>

                <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                    className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
                  >
                    Lưu
                  </Button>
                </ModalFooter>
              </form>
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </Modal>
    </div>
  );
}
