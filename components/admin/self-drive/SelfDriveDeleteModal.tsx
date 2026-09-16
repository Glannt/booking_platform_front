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
import { Trash2, RefreshCw } from "lucide-react";

interface SelfDriveDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  submitting?: boolean;
}

export function SelfDriveDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  submitting = false,
}: SelfDriveDeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-md bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <ModalCloseTrigger />
            <ModalBody className="p-6 space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center mx-auto">
                <Trash2 size={26} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Xác nhận xóa cấu hình xe?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Hành động này không thể hoàn tác và sẽ xóa cấu hình xe tự lái này khỏi hệ thống.
                </p>
              </div>
            </ModalBody>
            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                isDisabled={submitting}
                className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={onConfirm}
                isDisabled={submitting}
                className="rounded-xl font-bold text-xs h-10 px-5 bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer border-none transition-colors"
              >
                {submitting ? (
                  <RefreshCw size={15} className="animate-spin mr-1.5" />
                ) : (
                  <Trash2 size={15} className="mr-1.5" />
                )}
                Xóa vĩnh viễn
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
