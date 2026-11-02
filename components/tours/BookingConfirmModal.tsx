"use client";

import React from "react";
import { Modal, ModalBackdrop, ModalContainer, ModalDialog, ModalCloseTrigger, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { VehicleDto } from "@/lib/api/fleet";
import { TourDto, TourPackageDto } from "@/lib/api/tours";
import { DepositType } from "@/lib/pricing/deposit";
import { useI18n } from "@/context/LanguageContext";
import { formatPriceSync as _formatPrice } from "@/lib/format";
import { resolveLocalizedName, resolveTranslation } from "@/lib/i18n-helpers";

interface BookingConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedTour: TourDto | null;
  selectedPackage?: TourPackageDto | null;
  selectedVehicle?: VehicleDto | null;
  fullName: string;
  phone: string;
  email: string;
  date: string;
  guestCount: number;
  adultCount?: number;
  childCount?: number;
  infantCount?: number;
  totalAmount: number;
  depositAmount?: number;
  depositRate?: number;
  depositType?: DepositType;
  remainingAmount?: number;
  submitting: boolean;
}

export default function BookingConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  selectedTour,
  selectedPackage,
  selectedVehicle,
  fullName,
  phone,
  email,
  date,
  guestCount,
  adultCount,
  childCount,
  infantCount,
  totalAmount,
  depositAmount,
  depositRate,
  depositType,
  remainingAmount,
  submitting,
}: BookingConfirmModalProps) {
  const { language, t } = useI18n();

  const getLocalizedName = (srv: TourDto) => {
    return resolveLocalizedName(srv.translations, language, "Tour");
  };

  const getLocalizedPackageName = (pkg: TourPackageDto) => {
    const translation = resolveTranslation(pkg.translations, language);
    return translation?.name || pkg.code || t.tours.tourPackage;
  };

  const getLocalizedVehicleName = (v: VehicleDto) => {
    const cat = v.type;
    if (!cat) return `${v.brand} ${v.model}`;
    const translation = resolveTranslation(cat.translations, language);
    return translation ? `${translation.name} (${v.brand} ${v.model})` : `${v.brand} ${v.model}`;
  };

  const formatPrice = (value: number) => _formatPrice(value, language);

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="tour-confirm-title">
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-xs">
        <ModalContainer size="md">
          <ModalDialog className="bg-white dark:bg-[var(--bg-surface)] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden w-full max-w-lg relative flex flex-col">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h2 id="tour-confirm-title" className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle size={20} className="text-amber-500" />
                {t.tours.reviewBeforeBooking}
              </h2>
            </ModalHeader>

            <ModalBody className="p-6 space-y-4 text-sm font-semibold text-slate-700 dark:text-slate-200 overflow-y-auto max-h-[65vh]">
              <p className="text-slate-500 font-normal leading-relaxed text-sm">
                {t.common.reviewBeforeConfirm}
              </p>

              <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-normal">{t.tours.tourLabel}:</span>
                  <span className="text-slate-900 dark:text-white text-right max-w-[65%] line-clamp-2 font-bold">
                    {selectedTour ? getLocalizedName(selectedTour) : ""}
                  </span>
                </div>
                {selectedPackage ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-normal">{t.tours.packages}:</span>
                    <span className="text-slate-950 dark:text-white font-bold">
                      {getLocalizedPackageName(selectedPackage)}
                    </span>
                  </div>
                ) : selectedVehicle ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-normal">{t.tours.vehicleLabel}:</span>
                    <span className="text-slate-950 dark:text-white font-bold">
                      {getLocalizedVehicleName(selectedVehicle)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-normal">{t.tours.departureDate}:</span>
                  <span className="text-slate-900 dark:text-white font-bold">{date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-normal">{t.tours.numberOfGuestsLabel}:</span>
                  <div className="text-right">
                    <span className="text-slate-900 dark:text-white font-bold">{guestCount} {t.common.guests}</span>
                    {adultCount !== undefined && (
                      <div className="text-sm text-slate-400">
                        {adultCount} {t.tours.adults}
                        {childCount ? `, ${childCount} ${t.tours.children}` : ""}
                        {infantCount ? `, ${infantCount} ${t.tours.infants}` : ""}
                      </div>
                    )}
                  </div>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between text-sm">
                  <span className="text-slate-400 font-normal">{t.common.name}:</span>
                  <span className="text-slate-900 dark:text-white font-bold">{fullName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-normal">{t.common.phone}:</span>
                  <span className="text-slate-900 dark:text-white font-bold">{phone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-normal">{t.common.email}:</span>
                  <span className="text-slate-900 dark:text-white font-bold">{email}</span>
                </div>
              </div>

              <div className="bg-accent/5 dark:bg-[var(--bg-muted)] border border-accent/15 rounded-2xl p-4 space-y-2.5">
                {depositAmount !== undefined ? (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <div>
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {t.tours.totalBookingPrice}:
                        </span>
                        <span className="text-sm text-slate-400 font-normal block">
                          {t.tours.includesDriverFuel}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatPrice(totalAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm pb-2 border-b border-accent/10 dark:border-slate-800">
                      <span className="font-semibold text-accent flex items-center gap-1">
                        {t.common.depositAmount}
                        {depositRate ? ` (${depositRate}%)` : ""}:
                      </span>
                      <span className="font-bold text-accent text-base">
                        {formatPrice(depositAmount)}
                      </span>
                    </div>

                    {remainingAmount !== undefined && (
                      <div className="flex justify-between items-center text-sm pt-0.5">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {t.common.remainingAmount}:
                        </span>
                        <span className="font-black text-amber-500 text-base">
                          {formatPrice(remainingAmount)}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-sm text-accent uppercase tracking-wider font-extrabold block">
                        {t.tours.totalBookingPrice}
                      </span>
                      <span className="text-sm text-slate-400 font-normal mt-0.5 block">
                        {t.tours.includesDriverFuel}
                      </span>
                    </div>
                    <span className="text-lg sm:text-xl font-black text-amber-500">
                      {formatPrice(totalAmount)}
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
                {t.common.cancel}
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
