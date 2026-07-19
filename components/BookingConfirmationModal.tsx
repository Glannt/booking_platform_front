"use client";

import React from "react";
import { Modal, ModalBackdrop, ModalContainer, ModalDialog, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { useI18n } from "@/context/LanguageContext";
import { formatPrice as _formatPrice } from "@/lib/format";

export interface SummaryItem {
  label: string;
  value: string;
  highlight?: boolean;
}

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  serviceType: string;
  summaryItems: SummaryItem[];
  totalAmount: number;
  totalLabel?: string;
  submitting: boolean;
}

export default function BookingConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  serviceType,
  summaryItems,
  totalAmount,
  totalLabel,
  submitting,
}: BookingConfirmationModalProps) {
  const { language, t } = useI18n();

  const formatPrice = (value: number) => _formatPrice(value, language);

  const modalTitle = title || t.airportTransfer.confirmTitle;

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop className="bg-slate-950/40 backdrop-blur-sm">
        <ModalContainer size="md">
          <ModalDialog className="bg-white dark:bg-black rounded-3xl border border-divider shadow-2xl overflow-hidden w-full max-w-md relative p-6 space-y-4">
            <ModalHeader className="p-0 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                {modalTitle}
              </h2>
            </ModalHeader>

            <ModalBody className="p-0 py-2 space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <p className="text-slate-500 font-normal leading-relaxed">
                {t.common.reviewBeforeConfirm}
              </p>

              <div className="bg-slate-50 dark:bg-black p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-2.5">
                <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 font-normal">{t.common.serviceType}:</span>
                  <span className="text-slate-950 dark:text-white font-bold">{serviceType}</span>
                </div>
                {summaryItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-slate-400 font-normal">{item.label}:</span>
                    <span className={`text-right max-w-[65%] line-clamp-2 ${item.highlight ? "text-accent font-bold" : "text-slate-900 dark:text-white"}`}>
                      {item.value || "-"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-end bg-accent/5 dark:bg-black border border-accent/10 rounded-2xl p-4">
                <div>
                  <span className="text-[10px] text-accent uppercase tracking-wider font-extrabold block">
                    {totalLabel || t.common.totalPrice}
                  </span>
                </div>
                <span className="text-lg font-black text-amber-500">
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </ModalBody>

            <ModalFooter className="p-0 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                className="rounded-xl font-bold bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-none px-4 py-2"
                onClick={onClose}
                isDisabled={submitting}
              >
                {t.common.edit}
              </Button>
              <Button
                type="button"
                isDisabled={submitting}
                onClick={onConfirm}
                className="rounded-xl font-bold bg-accent hover:bg-accent/90 text-white shadow-md border-none px-5 py-2.5 flex items-center gap-1.5 cursor-pointer"
              >
                {submitting ? (
                  t.common.bookingInProgress
                ) : (
                  <>
                    <CheckCircle size={15} />
                    {t.common.confirmBooking}
                  </>
                )}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
