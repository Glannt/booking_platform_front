"use client";

import React from "react";
import { Modal, ModalBackdrop, ModalContainer, ModalDialog, ModalCloseTrigger, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { useI18n } from "@/context/LanguageContext";
import { formatPriceSync as _formatPrice } from "@/lib/format";
import { DepositType } from "@/lib/pricing/deposit";

export interface ContactInfo {
  fullName: string;
  phone: string;
  email: string;
  zaloId?: string;
  kakaoTalkId?: string;
  whatsapp?: string;
}

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
  serviceType?: string;
  summaryItems: SummaryItem[];
  totalAmount: number | string;
  totalLabel?: string;
  depositAmount?: number | string;
  depositRate?: number;
  depositType?: DepositType | string;
  remainingAmount?: number | string;
  submitting: boolean;
  contactInfo?: ContactInfo;
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
  depositAmount,
  depositRate,
  depositType,
  remainingAmount,
  submitting,
  contactInfo,
}: BookingConfirmationModalProps) {
  const { language, t } = useI18n();

  const formatPrice = (value: number) => _formatPrice(value, language);

  const modalTitle = title || t.airportTransfer.confirmTitle;

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="booking-confirm-title">
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-xs">
        <ModalContainer size="md">
          <ModalDialog className="bg-white dark:bg-[var(--bg-surface)] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden w-full max-w-lg relative flex flex-col">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h2 id="booking-confirm-title" className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle size={20} className="text-amber-500" />
                {modalTitle}
              </h2>
            </ModalHeader>

            <ModalBody className="p-6 space-y-4 text-sm font-semibold text-slate-700 dark:text-slate-200 overflow-y-auto max-h-[65vh]">
              <p className="font-normal leading-relaxed text-sm text-slate-500">
                {t.common.reviewBeforeConfirm}
              </p>

              <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2.5">
                {serviceType && (
                  <div className="flex items-start justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800 text-sm">
                    <span className="font-normal shrink-0 text-slate-400">{t.common.serviceType}:</span>
                    <span className="font-bold text-right break-words max-w-[70%]">{serviceType}</span>
                  </div>
                )}
                {summaryItems.map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-4 text-sm">
                    <span className="font-normal shrink-0 text-slate-400">{item.label}:</span>
                    <span className={`text-right break-words max-w-[70%] font-bold ${item.highlight ? "text-accent font-extrabold" : "text-slate-900 dark:text-white"}`}>
                      {item.value || "-"}
                    </span>
                  </div>
                ))}
              </div>

              {contactInfo && (
                <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2.5">
                  <h4 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    {t.airportTransfer.contactInfo}
                  </h4>
                  <div className="flex items-start justify-between gap-4 text-sm">
                    <span className="font-normal shrink-0 text-slate-400">{t.airportTransfer.fullName}:</span>
                    <span className="font-bold text-right break-words max-w-[70%]">{contactInfo.fullName}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4 text-sm">
                    <span className="font-normal shrink-0 text-slate-400">{t.airportTransfer.phone}:</span>
                    <span className="font-bold text-right break-words max-w-[70%]">{contactInfo.phone}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4 text-sm">
                    <span className="font-normal shrink-0 text-slate-400">Email:</span>
                    <span className="font-bold text-right break-words max-w-[70%]">{contactInfo.email}</span>
                  </div>
                  {contactInfo.zaloId && (
                    <div className="flex items-start justify-between gap-4 text-sm">
                      <span className="font-normal shrink-0 text-slate-400">Zalo:</span>
                      <span className="font-bold text-right break-words max-w-[70%]">{contactInfo.zaloId}</span>
                    </div>
                  )}
                  {contactInfo.kakaoTalkId && (
                    <div className="flex items-start justify-between gap-4 text-sm">
                      <span className="font-normal shrink-0 text-slate-400">KakaoTalk:</span>
                      <span className="font-bold text-right break-words max-w-[70%]">{contactInfo.kakaoTalkId}</span>
                    </div>
                  )}
                  {contactInfo.whatsapp && (
                    <div className="flex items-start justify-between gap-4 text-sm">
                      <span className="font-normal shrink-0 text-slate-400">WhatsApp:</span>
                      <span className="font-bold text-right break-words max-w-[70%]">{contactInfo.whatsapp}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-accent/5 dark:bg-[var(--bg-muted)] border border-accent/15 rounded-2xl p-4 space-y-2.5">
                {depositAmount !== undefined ? (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {totalLabel || t.common.totalPrice}:
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {typeof totalAmount === "number" ? formatPrice(totalAmount) : totalAmount}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm pb-2 border-b border-accent/10 dark:border-slate-800">
                      <span className="font-semibold text-accent flex items-center gap-1">
                        {t.common.depositAmount}
                        {depositRate ? ` (${depositRate}%)` : ""}:
                      </span>
                      <span className="font-bold text-accent text-base">
                        {typeof depositAmount === "number" ? formatPrice(depositAmount) : depositAmount}
                      </span>
                    </div>

                    {remainingAmount !== undefined && (
                      <div className="flex justify-between items-center text-sm pt-0.5">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {t.common.remainingAmount}:
                        </span>
                        <span className="font-black text-amber-500 text-base">
                          {typeof remainingAmount === "number" ? formatPrice(remainingAmount) : remainingAmount}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-sm text-accent uppercase tracking-wider font-extrabold block">
                        {totalLabel || t.common.totalPrice}
                      </span>
                    </div>
                    <span className="text-lg sm:text-xl font-black text-amber-500">
                      {typeof totalAmount === "number" ? formatPrice(totalAmount) : totalAmount}
                    </span>
                  </div>
                )}
              </div>
            </ModalBody>

            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
              <Button
                variant="outline"
                className="rounded-xl font-bold text-sm h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                onClick={onClose}
                isDisabled={submitting}
              >
                {t.common.edit}
              </Button>
              <Button
                type="button"
                isDisabled={submitting}
                onClick={onConfirm}
                className="rounded-xl font-bold text-sm h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm border-none flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {submitting ? (
                  t.common.bookingInProgress
                ) : (
                  <>
                    <CheckCircle size={16} />
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
