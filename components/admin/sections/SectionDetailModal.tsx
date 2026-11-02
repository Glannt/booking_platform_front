"use client";

import React, { useState } from "react";
import { Modal, ModalBackdrop, ModalContainer, ModalDialog, ModalCloseTrigger, ModalHeader, ModalBody, ModalFooter, Button, Label, Switch, toast } from "@heroui/react";
import { SectionDto } from "@/lib/api/sections";
import { StatusChip } from "@/components/StatusChip";
import { Edit3, Trash2, ImageOff, ZoomIn, X, ExternalLink, Copy } from "lucide-react";
import { ContentDataViewer } from "./ContentDataViewer";

interface SectionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: SectionDto | null;
  onEdit: () => void;
  onRefresh: () => void;
}

const SECTION_TYPES: Record<string, string> = {
  HERO_BANNER: "Hero Banner",
  SYSTEM_CATALOG: "Dữ liệu hệ thống (Tour, Xe, Sân bay...)",
  FEATURES: "Tính năng",
  SLIDE_CARD: "Carousel Thẻ",
  SLIDE_REVIEW: "Carousel Đánh giá",
  INSPIRATION: "Truyền cảm hứng",
  PROMO: "Khuyến mãi",
  TESTIMONIALS: "Đánh giá",
  COMPANY_LOCATION: "Vị trí công ty & Văn phòng",
  PARTNER_COOPERATION: "Nhận hợp tác đối tác",
  CTA: "Call to Action",
  BANNER: "Banner",
};

export default function SectionDetailModal({
  isOpen,
  onClose,
  section,
  onEdit,
}: SectionDetailModalProps) {
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title?: string } | null>(null);
  const [activeDetailLocale, setActiveDetailLocale] = useState<"vi" | "en" | "ko" | "ru">("vi");
  if (!section) return null;

  const DETAIL_LOCALES = [
    { code: "vi", label: "Tiếng Việt", flag: "🇻🇳 VI" },
    { code: "en", label: "English", flag: "🇬🇧 EN" },
    { code: "ko", label: "한국어", flag: "🇰🇷 KO" },
    { code: "ru", label: "Русский", flag: "🇷🇺 RU" },
  ] as const;

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="section-details-title">
        <ModalBackdrop className="bg-black/50 backdrop-blur-sm">
          <ModalContainer className="max-w-7xl w-full">
            <ModalDialog className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-divider shadow-2xl overflow-hidden w-full max-w-7xl flex flex-col max-h-[90vh]">
              <ModalCloseTrigger />
              <ModalHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-divider bg-default-50 dark:bg-[var(--bg-surface)] shrink-0">
                <span id="section-details-title" className="text-lg font-extrabold text-foreground">Chi tiết Section</span>
              </ModalHeader>
              <ModalBody className="space-y-6 max-h-[60vh] overflow-y-auto p-6">
                {/* Basic Info */}
                <div className="p-4 rounded-xl border border-divider bg-default-50/50 dark:bg-[var(--bg-muted)] space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-extrabold text-foreground">Thông tin cơ bản</h4>
                    <StatusChip
                      status={section.active ? "active" : "inactive"}
                      type="active"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-base">
                    <div>
                      <Label className="text-foreground/70 text-sm font-semibold">ID</Label>
                      <p className="font-semibold text-foreground">{section.id}</p>
                    </div>
                    <div>
                      <Label className="text-foreground/70 text-sm font-semibold">Loại</Label>
                      <p className="font-semibold text-foreground">
                        {SECTION_TYPES[section.sectionType] || section.sectionType}
                      </p>
                    </div>
                    <div>
                      <Label className="text-foreground/70 text-sm font-semibold">Tên section</Label>
                      <p className="font-semibold text-foreground">{section.sectionName}</p>
                    </div>
                    <div>
                      <Label className="text-foreground/70 text-sm font-semibold">Trang</Label>
                      <p className="font-semibold text-foreground font-mono text-sm">{section.pagePath}</p>
                    </div>
                    <div>
                      <Label className="text-foreground/70 text-sm font-semibold">Thứ tự</Label>
                      <p className="font-semibold text-foreground">{section.orderIndex}</p>
                    </div>
                    <div>
                      <Label className="text-foreground/70 text-sm font-semibold">Màu chữ</Label>
                      <p className="flex items-center gap-1.5 font-semibold text-foreground">
                        <span className="w-4 h-4 rounded-full border border-divider shrink-0" style={{ backgroundColor: section.textColor || "transparent" }} />
                        {section.textColor || "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-foreground/70 text-sm font-semibold">Màu nền</Label>
                      <p className="flex items-center gap-1.5 font-semibold text-foreground">
                        <span className="w-4 h-4 rounded-full border border-divider shrink-0" style={{ backgroundColor: section.bgColor || "transparent" }} />
                        {section.bgColor || "—"}
                      </p>
                    </div>
                  </div>

                  {section.linkUrl && (
                    <div className="text-base">
                      <Label className="text-foreground/70 text-sm font-semibold">Link URL</Label>
                      <p className="font-mono text-sm text-primary">{section.linkUrl}</p>
                    </div>
                  )}

                  {section.contentData && (
                    <div className="text-base">
                      <Label className="text-foreground/70 text-sm font-semibold">Dữ liệu nội dung</Label>
                      <div className="mt-1">
                        <ContentDataViewer contentData={section.contentData} sectionType={section.sectionType} />
                      </div>
                    </div>
                  )}

                  {section.imageUrls && section.imageUrls.length > 0 && (
                    <div className="text-base">
                      <Label className="text-foreground/70 text-sm font-semibold">Hình ảnh</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {section.imageUrls.map((url, idx) => (
                          <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-divider bg-default-100 shadow-xs">
                            <img src={url} alt={`Section image ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => setZoomedImage({ url, title: `${section.sectionName} - Ảnh #${idx + 1}` })}
                                className="p-1.5 rounded-full bg-white/30 hover:bg-white/50 text-white backdrop-blur-xs transition-colors cursor-pointer border-none shadow-sm"
                                title="Phóng to ảnh"
                              >
                                <ZoomIn size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(!section.imageUrls || section.imageUrls.length === 0) && (
                    <div className="text-base">
                      <Label className="text-foreground/70 text-sm font-semibold">Hình ảnh</Label>
                      <div className="mt-2 flex items-center gap-2 text-foreground/50 text-sm">
                        <ImageOff size={14} />
                        <span>Chưa có hình ảnh</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Translations with 4 tabs */}
                <div className="p-4 rounded-xl border border-divider bg-default-50/50 dark:bg-[var(--bg-muted)] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h4 className="text-lg font-extrabold text-foreground">Nội dung đa ngôn ngữ</h4>
                    <div className="flex items-center gap-1 p-0.5 rounded-xl bg-default-100 dark:bg-[var(--bg-card)] border border-divider">
                      {DETAIL_LOCALES.map(({ code, flag }) => {
                        const isActive = activeDetailLocale === code;
                        return (
                          <button
                            key={code}
                            type="button"
                            onClick={() => setActiveDetailLocale(code)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${isActive
                                ? "bg-accent text-accent-foreground shadow-xs"
                                : "text-foreground/70 hover:text-foreground hover:bg-default-200/50"
                              }`}
                          >
                            <span>{flag}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {(() => {
                    const t = section.translations.find((item) => item.locale === activeDetailLocale);
                    const locInfo = DETAIL_LOCALES.find((item) => item.code === activeDetailLocale);

                    if (!t || (!t.title && !t.subtitle && !t.description && !t.btnText)) {
                      return (
                        <div className="p-4 bg-default-50 dark:bg-[var(--bg-muted)] border border-divider rounded-xl text-center">
                          <p className="text-sm text-foreground/50 italic">
                            Chưa có nội dung cho ngôn ngữ {locInfo?.flag || activeDetailLocale.toUpperCase()} ({locInfo?.label || activeDetailLocale})
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="p-4 bg-default-50 dark:bg-[var(--bg-muted)] border border-divider rounded-xl space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-divider/60">
                          <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-md uppercase flex items-center gap-1">
                            <span>{locInfo?.flag || t.locale.toUpperCase()}</span>
                            <span>{locInfo?.label || t.locale}</span>
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <Label className="text-foreground/70 text-sm font-semibold">Tiêu đề</Label>
                            <p className="font-semibold text-foreground">{t.title || "—"}</p>
                          </div>
                          <div>
                            <Label className="text-foreground/70 text-sm font-semibold">Tiêu đề phụ</Label>
                            <p className="font-semibold text-foreground">{t.subtitle || "—"}</p>
                          </div>
                        </div>
                        {t.description && (
                          <div className="text-sm">
                            <Label className="text-foreground/70 text-sm font-semibold">Mô tả</Label>
                            <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{t.description}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <Label className="text-foreground/70 text-sm font-semibold">Text nút</Label>
                            <p className="font-semibold text-foreground">{t.btnText || "—"}</p>
                          </div>
                          <div>
                            <Label className="text-foreground/70 text-sm font-semibold">Link nút</Label>
                            <p className="font-mono text-xs text-primary">{t.btnLink || "—"}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </ModalBody>
              <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-foreground transition-colors cursor-pointer"
                >
                  Đóng
                </Button>
                <Button
                  type="button"
                  onClick={onEdit}
                  className="rounded-xl font-bold text-xs h-10 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/50 shadow-xs cursor-pointer transition-colors"
                >
                  <Edit3 size={15} className="mr-1.5" />
                  Chỉnh sửa
                </Button>
              </ModalFooter>
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </Modal>

      {/* Lightbox Modal phóng to ảnh z-[99999] */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[92vh] bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800 bg-neutral-950/80 text-white shrink-0">
              <div className="flex items-center gap-2 truncate max-w-md">
                <ZoomIn size={16} className="text-accent shrink-0" />
                <span id="detail-zoomed-title" className="text-sm font-bold text-white truncate">
                  {zoomedImage?.title || "Xem ảnh phóng to"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {zoomedImage?.url && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(zoomedImage.url);
                      toast.success("Đã sao chép URL ảnh!");
                    }}
                    className="h-8 w-8 text-neutral-300 hover:text-white hover:bg-white/10 rounded-full"
                    aria-label="Sao chép URL"
                  >
                    <Copy size={14} />
                  </Button>
                )}
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  onClick={() => setZoomedImage(null)}
                  className="h-8 w-8 text-neutral-300 hover:text-white hover:bg-white/10 rounded-full cursor-pointer"
                  aria-label="Đóng"
                >
                  <X size={18} />
                </Button>
              </div>
            </div>
            <div className="flex-1 min-h-0 flex items-center justify-center p-4 bg-black/90 overflow-hidden">
              {zoomedImage?.url && (
                <img
                  src={zoomedImage.url}
                  alt={zoomedImage.title || "Zoomed"}
                  className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-2xl select-none"
                />
              )}
            </div>
            {zoomedImage?.url && (
              <div className="px-5 py-2.5 bg-neutral-950/90 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 shrink-0">
                <span className="truncate max-w-xl font-mono text-[11px] select-all">
                  {zoomedImage.url}
                </span>
                <a
                  href={zoomedImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline flex items-center gap-1 font-semibold text-[11px] shrink-0 ml-2"
                >
                  Mở tab mới
                  <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
