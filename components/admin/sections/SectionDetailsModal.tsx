"use client";

import React from "react";
import { Modal, ModalBackdrop, ModalContainer, ModalDialog, ModalHeader, ModalBody, Button, Label, Switch } from "@heroui/react";
import { SectionDto } from "@/lib/api/sections";
import { StatusChip } from "@/components/StatusChip";
import { Pencil, Trash2, ImageOff } from "lucide-react";
import { ContentDataViewer } from "./ContentDataViewer";

interface SectionDetailsModalProps {
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

export default function SectionDetailsModal({
  isOpen,
  onClose,
  section,
  onEdit,
}: SectionDetailsModalProps) {
  if (!section) return null;

  const viTrans = section.translations.find((t) => t.locale === "vi") || section.translations[0];

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="section-details-title">
      <ModalBackdrop className="bg-slate-950/40 backdrop-blur-sm">
        <ModalContainer className="max-w-4xl w-full">
          <ModalDialog className="bg-white dark:bg-black rounded-md border border-divider shadow-2xl overflow-hidden animate-scale-up w-full max-w-4xl relative">
            <ModalHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-divider bg-slate-50 dark:bg-black/40">
              <span id="section-details-title" className="text-lg font-extrabold text-slate-900 dark:text-white">Chi tiết Section</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="rounded-md font-bold bg-slate-200 hover:bg-slate-300 dark:bg-[var(--bg-card)] dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200 border-none px-4 py-2 h-9 text-xs"
                >
                  Đóng
                </Button>
                <Button
                  className="rounded-md font-bold bg-[#C9A227] hover:bg-[#b8912a] text-white flex items-center gap-1.5 h-9 px-4 py-2 text-xs shadow-md border-none"
                  onClick={onEdit}
                >
                  <Pencil size={14} />
                  Chỉnh sửa
                </Button>
              </div>
            </ModalHeader>
            <ModalBody className="space-y-6 max-h-[75vh] overflow-y-auto p-6">
        {/* Basic Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Thông tin cơ bản</h4>
            <StatusChip
              status={section.active ? "active" : "inactive"}
              type="active"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-slate-500 text-xs font-bold">ID</Label>
              <p className="font-semibold text-slate-800 dark:text-white">{section.id}</p>
            </div>
            <div>
              <Label className="text-slate-500 text-xs font-bold">Loại</Label>
              <p className="font-semibold text-slate-800 dark:text-white">
                {SECTION_TYPES[section.sectionType] || section.sectionType}
              </p>
            </div>
            <div>
              <Label className="text-slate-500 text-xs font-bold">Tên section</Label>
              <p className="font-semibold text-slate-800 dark:text-white">{section.sectionName}</p>
            </div>
            <div>
              <Label className="text-slate-500 text-xs font-bold">Trang</Label>
              <p className="font-semibold text-slate-800 dark:text-white font-mono text-xs">{section.pagePath}</p>
            </div>
            <div>
              <Label className="text-slate-500 text-xs font-bold">Thứ tự</Label>
              <p className="font-semibold text-slate-800 dark:text-white">{section.orderIndex}</p>
            </div>
            <div>
              <Label className="text-slate-500 text-xs font-bold">CSS Class</Label>
              <p className="font-semibold text-slate-800 dark:text-white font-mono text-xs">{section.cssClass || "—"}</p>
            </div>
            <div>
              <Label className="text-slate-500 text-xs font-bold">Màu chữ</Label>
              <p className="font-semibold text-slate-800 dark:text-white">{section.textColor || "—"}</p>
            </div>
            <div>
              <Label className="text-slate-500 text-xs font-bold">Màu nền</Label>
              <p className="font-semibold text-slate-800 dark:text-white">{section.bgColor || "—"}</p>
            </div>
          </div>

          {section.linkUrl && (
            <div className="text-sm">
              <Label className="text-slate-500 text-xs font-bold">Link URL</Label>
              <p className="font-mono text-xs text-blue-600">{section.linkUrl}</p>
            </div>
          )}

          {section.contentData && (
            <div className="text-sm">
              <Label className="text-slate-500 text-xs font-bold">Content Data</Label>
              <div className="mt-1">
                <ContentDataViewer contentData={section.contentData} sectionType={section.sectionType} />
              </div>
            </div>
          )}

          {section.imageUrls && section.imageUrls.length > 0 && (
            <div className="text-sm">
              <Label className="text-slate-500 text-xs font-bold">Hình ảnh</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {section.imageUrls.map((url, idx) => (
                  <div key={idx} className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                    <img src={url} alt={`Section image ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
          {(!section.imageUrls || section.imageUrls.length === 0) && (
            <div className="text-sm">
              <Label className="text-slate-500 text-xs font-bold">Hình ảnh</Label>
              <div className="mt-2 flex items-center gap-2 text-slate-400 text-xs">
                <ImageOff size={14} />
                <span>Chưa có hình ảnh</span>
              </div>
            </div>
          )}
        </div>

        {/* Translations */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Nội dung đa ngôn ngữ</h4>
          {section.translations.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Chưa có nội dung</p>
          ) : (
            <div className="space-y-3">
              {section.translations.map((t) => (
                <div key={t.locale} className="p-3 bg-slate-50 dark:bg-[var(--bg-muted)] rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-md uppercase">
                      {t.locale}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <Label className="text-slate-500 text-xs">Tiêu đề</Label>
                      <p className="font-semibold text-slate-800 dark:text-white">{t.title || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-slate-500 text-xs">Tiêu đề phụ</Label>
                      <p className="font-semibold text-slate-800 dark:text-white">{t.subtitle || "—"}</p>
                    </div>
                  </div>
                  {t.description && (
                    <div className="text-sm">
                      <Label className="text-slate-500 text-xs">Mô tả</Label>
                      <p className="text-slate-700 dark:text-slate-300">{t.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <Label className="text-slate-500 text-xs">Text nút</Label>
                      <p className="font-semibold text-slate-800 dark:text-white">{t.btnText || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-slate-500 text-xs">Link nút</Label>
                      <p className="font-mono text-xs text-blue-600">{t.btnLink || "—"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ModalBody>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
