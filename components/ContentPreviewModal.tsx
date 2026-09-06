"use client";

import React from "react";
import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalCloseTrigger,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { FormattedDescription } from "@/components/FormattedDescription";

interface ContentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  content?: string | null;
  closeLabel?: string;
}

/**
 * Reusable modal for previewing long text or descriptions with formatted paragraphs and bullet lists.
 * Adheres strictly to HeroUI Modal guidelines and dark theme tokens.
 */
export function ContentPreviewModal({
  isOpen,
  onClose,
  content,
  closeLabel = "Đóng",
}: ContentPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <ModalBackdrop className="bg-slate-950/50 backdrop-blur-xs">
        <ModalContainer>
          <ModalDialog className="sm:max-w-[360px] w-full max-h-[85vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden focus:outline-none relative">
            <ModalCloseTrigger />

            {/* Scrollable Content Body with slightly larger text for readability */}
            <ModalBody className="p-6 pt-10 overflow-y-auto max-h-[65vh] space-y-4">
              {content ? (
                <FormattedDescription
                  description={content}
                  className="space-y-3"
                  paragraphClassName="text-sm md:text-base text-slate-700 dark:text-slate-200 leading-relaxed font-normal"
                  bulletClassName="text-sm md:text-base text-slate-800 dark:text-slate-100 font-medium"
                />
              ) : (
                <p className="text-sm text-slate-400 italic text-center py-8">
                  Chưa có thông tin chi tiết.
                </p>
              )}
            </ModalBody>

            {/* Pinned Footer */}
            <ModalFooter className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end shrink-0 bg-slate-50/50 dark:bg-[var(--bg-card)]/50">
              <Button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[var(--bg-elevated)] dark:hover:bg-[var(--bg-card)] text-slate-700 dark:text-slate-200 cursor-pointer border-none"
              >
                {closeLabel}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}

