"use client";

import React from "react";
import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { AlertTriangle, X } from "lucide-react";

interface TourPolicyDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  policyCode?: string;
  submitting: boolean;
}

export const TourPolicyDeleteModal: React.FC<TourPolicyDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  policyCode,
  submitting,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-md bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400 font-black text-base">
                <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <span>Xác nhận xóa chính sách tour</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </ModalHeader>

            <ModalBody className="p-6 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Bạn có chắc chắn muốn xóa chính sách{" "}
                <span className="font-extrabold text-slate-900 dark:text-white font-mono bg-slate-100 dark:bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded">
                  {policyCode}
                </span>{" "}
                không?
              </p>
              <p className="text-[11px] text-slate-400">
                Lưu ý: Thao tác này không thể hoàn tác và chính sách này sẽ không còn hiển thị trên trang chi tiết tour.
              </p>
            </ModalBody>

            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
              <Button
                variant="outline"
                onClick={onClose}
                isDisabled={submitting}
                className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                onClick={onConfirm}
                isDisabled={submitting}
                className="rounded-xl font-bold text-xs h-10 px-5 bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer border-none transition-colors"
              >
                {submitting ? "Đang xóa..." : "Xác nhận xóa"}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
};
export default TourPolicyDeleteModal;
