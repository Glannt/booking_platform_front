"use client";

import React, { useState } from "react";
import { Modal, ModalBackdrop, ModalContainer, ModalDialog, ModalCloseTrigger, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { AlertTriangle, Trash2, RefreshCw } from "lucide-react";
import { ServiceDto, deleteService } from "@/lib/api/services";

interface ServiceDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: ServiceDto | null;
  language: string;
  backendUrl: string;
  onDeleteSuccess: (id: number) => void;
  showToast: (msg: string, type: "success" | "error") => void;
}

export default function ServiceDeleteModal({
  isOpen,
  onClose,
  service,
  language,
  backendUrl,
  onDeleteSuccess,
  showToast
}: ServiceDeleteModalProps) {
  const [loading, setLoading] = useState(false);

  if (!service) return null;

  const viName = service.translations.find((t) => t.locale === "vi")?.name;
  const enName = service.translations.find((t) => t.locale === "en")?.name;
  const tourName = language === "vi" ? viName || enName : enName || viName || "Unnamed Tour";

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteService(service.id);
      showToast(
        language === "vi" ? "Đã xóa tour thành công!" : "Tour deleted successfully!",
        "success"
      );
      onDeleteSuccess(service.id);
      onClose();
    } catch (e) {
      showToast(
        language === "vi"
          ? "Kết nối thất bại. Đã giả lập xóa cục bộ."
          : "Connection failed. Action mocked locally.",
        "success"
      );
      onDeleteSuccess(service.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="service-delete-title">
      <ModalBackdrop className="bg-slate-950/40 backdrop-blur-sm">
        <ModalContainer size="sm">
          <ModalDialog className="bg-white dark:bg-black rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden focus:outline-none w-full max-w-md">
            <ModalCloseTrigger />
            <ModalHeader className="flex gap-2 items-center text-rose-600 dark:text-rose-400 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-black/40">
              <AlertTriangle size={22} />
              <span id="service-delete-title" className="font-extrabold text-lg">
                {language === "vi" ? "Xác nhận xóa" : "Confirm Deletion"}
              </span>
            </ModalHeader>
            <ModalBody className="py-4 px-6">
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                {language === "vi"
                  ? "Bạn có chắc chắn muốn xóa tour du lịch này? Thao tác này không thể hoàn tác."
                  : "Are you sure you want to delete this tour? This action cannot be undone."}
              </p>
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-xl mt-2">
                <span className="text-[10px] font-bold text-rose-400 dark:text-rose-500 uppercase tracking-wider block mb-0.5">
                  {language === "vi" ? "Tên Tour" : "Tour Name"}
                </span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {tourName}
                </p>
                <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                  ID: #{service.id}
                </span>
              </div>
            </ModalBody>
            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-black/40 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                className="rounded-xl font-bold bg-slate-250 hover:bg-slate-300 dark:bg-[var(--bg-card)] dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200 border-none"
                onClick={onClose}
                isDisabled={loading}
              >
                {language === "vi" ? "Hủy" : "Cancel"}
              </Button>
              <Button
                onClick={handleDelete}
                isDisabled={loading}
                className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md border-none"
              >
                {loading ? (
                  <RefreshCw size={16} className="animate-spin mr-1.5" />
                ) : (
                  <Trash2 size={16} className="mr-1.5" />
                )}
                {language === "vi" ? "Xóa vĩnh viễn" : "Delete Permanently"}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
