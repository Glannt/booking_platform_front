"use client";

import React from "react";
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
  Typography,
} from "@heroui/react";
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Loader2 } from "lucide-react";

export interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "warning" | "danger" | "info" | "success";
  isLoading?: boolean;
}

export default function AlertModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Xác nhận hành động",
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  variant = "warning",
  isLoading = false,
}: AlertModalProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />,
          iconBg: "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/40",
          confirmBtn: "bg-red-600 hover:bg-red-700 text-white shadow-xs",
        };
      case "info":
        return {
          icon: <Info className="w-6 h-6 text-blue-500 shrink-0" />,
          iconBg: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/40",
          confirmBtn: "bg-blue-600 hover:bg-blue-700 text-white shadow-xs",
        };
      case "success":
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />,
          iconBg: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40",
          confirmBtn: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs",
        };
      case "warning":
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />,
          iconBg: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/40",
          confirmBtn: "bg-amber-500 hover:bg-amber-600 text-white shadow-xs",
        };
    }
  };

  const currentStyles = getVariantStyles();

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) onClose();
      }}
    >
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-md w-full flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <ModalCloseTrigger isDisabled={isLoading} />
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 shrink-0">
              <div className={`p-2 rounded-xl ${currentStyles.iconBg}`}>
                {currentStyles.icon}
              </div>
              <Typography
                type="h3"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                {title}
              </Typography>
            </ModalHeader>

            <ModalBody className="p-6 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed overflow-y-auto max-h-[60vh]">
              {description}
            </ModalBody>

            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 shrink-0 bg-slate-50/50 dark:bg-[var(--bg-page)]/50">
              <Button
                variant="outline"
                isDisabled={isLoading}
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                {cancelText}
              </Button>
              <Button
                type="button"
                isDisabled={isLoading}
                onClick={onConfirm}
                className={`px-5 py-2 text-xs font-bold rounded-xl border-none cursor-pointer flex items-center gap-1.5 ${currentStyles.confirmBtn}`}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  confirmText
                )}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
