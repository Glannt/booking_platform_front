"use client";

import React from "react";
import { Modal, ModalBackdrop, ModalContainer, ModalDialog, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { VehicleDto } from "@/lib/api/fleet";
import { TourDto } from "@/lib/api/tours";
import { useI18n } from "@/context/LanguageContext";
import { formatPrice as _formatPrice } from "@/lib/format";

interface BookingConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedTour: TourDto | null;
  selectedVehicle: VehicleDto | null;
  fullName: string;
  phone: string;
  email: string;
  date: string;
  guestCount: number;
  totalAmount: number;
  submitting: boolean;
}

export default function BookingConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  selectedTour,
  selectedVehicle,
  fullName,
  phone,
  email,
  date,
  guestCount,
  totalAmount,
  submitting,
}: BookingConfirmModalProps) {
  const { language } = useI18n();
  const isVi = language === "vi";

  const getLocalizedName = (srv: TourDto) => {
    const translation = srv.translations?.find((tr) => tr.locale === language) || srv.translations?.[0];
    return translation ? translation.name : "Nha Trang Tour";
  };

  const getLocalizedVehicleName = (v: VehicleDto) => {
    const cat = v.type;
    if (!cat) return `${v.brand} ${v.model}`;
    const translation = cat.translations?.find((tr) => tr.locale === language) || cat.translations?.[0];
    return translation ? `${translation.name} (${v.brand} ${v.model})` : `${v.brand} ${v.model}`;
  };

  const formatPrice = (value: number) => _formatPrice(value, language);

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop className="bg-slate-950/40 backdrop-blur-sm">
        <ModalContainer size="md">
          <ModalDialog className="bg-white dark:bg-black rounded-3xl border border-divider shadow-2xl overflow-hidden w-full max-w-md relative p-6 space-y-4">
            <ModalHeader className="p-0 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                {isVi ? "Xác Nhận Thông Tin Đặt Tour" : "Confirm Tour Booking Details"}
              </h2>
            </ModalHeader>

            <ModalBody className="p-0 py-2 space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <p className="text-slate-500 font-normal leading-relaxed">
                {isVi
                  ? "Vui lòng kiểm tra kỹ các thông tin dưới đây trước khi hoàn tất yêu cầu đặt tour."
                  : "Please review the information below before finalizing your tour booking request."}
              </p>

              <div className="bg-slate-50 dark:bg-black p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-normal">{isVi ? "Tour du lịch:" : "Tour:"}</span>
                  <span className="text-slate-900 dark:text-white text-right max-w-[65%] line-clamp-2">
                    {selectedTour ? getLocalizedName(selectedTour) : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-normal">{isVi ? "Dòng xe phục vụ:" : "Vehicle class:"}</span>
                  <span className="text-slate-950 dark:text-white">
                    {selectedVehicle ? getLocalizedVehicleName(selectedVehicle) : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-normal">{isVi ? "Ngày khởi hành:" : "Date:"}</span>
                  <span className="text-slate-900 dark:text-white">{date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-normal">{isVi ? "Số khách tham gia:" : "Guests:"}</span>
                  <span className="text-slate-900 dark:text-white">{guestCount} {isVi ? "khách" : "guests"}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-850 pt-2 flex justify-between">
                  <span className="text-slate-400 font-normal">{isVi ? "Khách hàng:" : "Customer:"}</span>
                  <span className="text-slate-950 dark:text-white">{fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-normal">{isVi ? "Số điện thoại:" : "Phone:"}</span>
                  <span className="text-slate-950 dark:text-white">{phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-normal">{isVi ? "Địa chỉ Email:" : "Email:"}</span>
                  <span className="text-slate-950 dark:text-white">{email}</span>
                </div>
              </div>

              <div className="flex justify-between items-end bg-accent/5 dark:bg-black border border-accent/10 rounded-2xl p-4">
                <div>
                  <span className="text-[10px] text-accent uppercase tracking-wider font-extrabold block">
                    {isVi ? "Tổng chi phí trọn gói" : "Total Booking Price"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal mt-0.5 block">
                    {isVi ? "Đã bao gồm lái xe & xăng dầu" : "Includes private driver & fuel"}
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
                {isVi ? "Hủy bỏ" : "Cancel"}
              </Button>
              <Button
                type="button"
                isDisabled={submitting}
                onClick={onConfirm}
                className="rounded-xl font-bold bg-accent hover:bg-accent/90 text-white shadow-md border-none px-5 py-2.5 flex items-center gap-1.5 cursor-pointer"
              >
                {submitting ? (
                  isVi ? "Đang đặt..." : "Booking..."
                ) : (
                  <>
                    <CheckCircle size={15} />
                    {isVi ? "Xác nhận đặt" : "Confirm Book"}
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
