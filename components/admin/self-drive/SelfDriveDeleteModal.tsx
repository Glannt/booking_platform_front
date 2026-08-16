"use client";

import React from "react";
import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalCloseTrigger,
  Button,
} from "@heroui/react";
import { Trash2 } from "lucide-react";

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
          <ModalDialog className="max-w-md bg-white dark:bg-[var(--bg-surface)] p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center relative">
            <ModalCloseTrigger />
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
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={onClose}
                isDisabled={submitting}
                className="rounded-xl text-xs font-bold px-4 h-10 flex-1 border border-slate-200 dark:border-slate-700"
              >
                Hủy
              </Button>
              <Button
                onClick={onConfirm}
                isDisabled={submitting}
                className="rounded-xl text-xs font-black px-4 h-10 bg-rose-500 text-white hover:bg-rose-600 shadow-md cursor-pointer border-none flex-1"
              >
                {submitting ? "Đang xóa..." : "Xóa vĩnh viễn"}
              </Button>
            </div>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
