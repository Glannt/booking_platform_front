"use client";

import React from "react";
import { Modal, ModalBackdrop, ModalContainer, ModalDialog, ModalCloseTrigger, ModalHeader, ModalBody, ModalFooter, Button, Label, Switch } from "@heroui/react";
import { SectionDto } from "@/lib/api/sections";
import { StatusChip } from "@/components/StatusChip";
import { Edit3, Trash2, ImageOff } from "lucide-react";
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
  FEATURES: "Tính năng",
  SLIDE_CARD: "Carousel Thẻ",
  SLIDE_REVIEW: "Carousel Đánh giá",
  INSPIRATION: "Truyền cảm hứng",
  PROMO: "Khuyến mãi",
  TESTIMONIALS: "Đánh giá",
  CTA: "Call to Action",
  BANNER: "Banner",
};

export default function SectionDetailModal({
  isOpen,
  onClose,
  section,
  onEdit,
}: SectionDetailModalProps) {
  if (!section) return null;

  const viTrans = section.translations.find((t) => t.locale === "vi") || section.translations[0];

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="section-details-title">
      <ModalBackdrop className="bg-black/50 backdrop-blur-sm">
        <ModalContainer className="max-w-4xl w-full">
          <ModalDialog className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-divider shadow-2xl overflow-hidden w-full max-w-4xl flex flex-col max-h-[90vh]">
            <ModalCloseTrigger />
            <ModalHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-divider bg-default-50 dark:bg-[var(--bg-surface)] shrink-0">
              <span id="section-details-title" className="text-lg font-extrabold text-foreground">Chi tiết Section</span>
            </ModalHeader>
            <ModalBody className="space-y-6 max-h-[60vh] overflow-y-auto p-6">
        {/* Basic Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Thông tin cơ bản</h4>
            <StatusChip
              status={section.active ? "active" : "inactive"}
              type="active"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-foreground/70 text-xs font-bold">ID</Label>
              <p className="font-semibold text-foreground">{section.id}</p>
            </div>
            <div>
              <Label className="text-foreground/70 text-xs font-bold">Loại</Label>
              <p className="font-semibold text-foreground">
                {SECTION_TYPES[section.sectionType] || section.sectionType}
              </p>
            </div>
            <div>
              <Label className="text-foreground/70 text-xs font-bold">Tên section</Label>
              <p className="font-semibold text-foreground">{section.sectionName}</p>
            </div>
            <div>
              <Label className="text-foreground/70 text-xs font-bold">Trang</Label>
              <p className="font-semibold text-foreground font-mono text-xs">{section.pagePath}</p>
            </div>
            <div>
              <Label className="text-foreground/70 text-xs font-bold">Thứ tự</Label>
              <p className="font-semibold text-foreground">{section.orderIndex}</p>
            </div>
            <div>
              <Label className="text-foreground/70 text-xs font-bold">CSS Class</Label>
              <p className="font-semibold text-foreground font-mono text-xs">{section.cssClass || "—"}</p>
            </div>
            <div>
              <Label className="text-foreground/70 text-xs font-bold">Màu chữ</Label>
              <p className="font-semibold text-foreground">{section.textColor || "—"}</p>
            </div>
            <div>
              <Label className="text-foreground/70 text-xs font-bold">Màu nền</Label>
              <p className="font-semibold text-foreground">{section.bgColor || "—"}</p>
            </div>
          </div>

          {section.linkUrl && (
            <div className="text-sm">
              <Label className="text-foreground/70 text-xs font-bold">Link URL</Label>
              <p className="font-mono text-xs text-primary">{section.linkUrl}</p>
            </div>
          )}

          {section.contentData && (
            <div className="text-sm">
              <Label className="text-foreground/70 text-xs font-bold">Content Data</Label>
              <div className="mt-1">
                <ContentDataViewer contentData={section.contentData} sectionType={section.sectionType} />
              </div>
            </div>
          )}

          {section.imageUrls && section.imageUrls.length > 0 && (
            <div className="text-sm">
              <Label className="text-foreground/70 text-xs font-bold">Hình ảnh</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {section.imageUrls.map((url, idx) => (
                  <div key={idx} className="w-20 h-20 rounded-xl overflow-hidden border border-divider">
                    <img src={url} alt={`Section image ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
          {(!section.imageUrls || section.imageUrls.length === 0) && (
            <div className="text-sm">
              <Label className="text-foreground/70 text-xs font-bold">Hình ảnh</Label>
              <div className="mt-2 flex items-center gap-2 text-foreground/50 text-xs">
                <ImageOff size={14} />
                <span>Chưa có hình ảnh</span>
              </div>
            </div>
          )}
        </div>

        {/* Translations */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Nội dung đa ngôn ngữ</h4>
          {section.translations.length === 0 ? (
            <p className="text-sm text-foreground/50 italic">Chưa có nội dung</p>
          ) : (
            <div className="space-y-3">
              {section.translations.map((t) => (
                <div key={t.locale} className="p-4 bg-default-50 dark:bg-[var(--bg-muted)] border border-divider rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-md uppercase">
                      {t.locale}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <Label className="text-foreground/70 text-xs font-semibold">Tiêu đề</Label>
                      <p className="font-semibold text-foreground">{t.title || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-foreground/70 text-xs font-semibold">Tiêu đề phụ</Label>
                      <p className="font-semibold text-foreground">{t.subtitle || "—"}</p>
                    </div>
                  </div>
                  {t.description && (
                    <div className="text-sm">
                      <Label className="text-foreground/70 text-xs font-semibold">Mô tả</Label>
                      <p className="text-foreground/90">{t.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <Label className="text-foreground/70 text-xs font-semibold">Text nút</Label>
                      <p className="font-semibold text-foreground">{t.btnText || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-foreground/70 text-xs font-semibold">Link nút</Label>
                      <p className="font-mono text-xs text-primary">{t.btnLink || "—"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
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
  );
}
