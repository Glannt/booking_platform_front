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
  Button
} from "@heroui/react";
import { AlertTriangle, Car, RefreshCw, Trash2 } from "lucide-react";
import { VehicleDto } from "@/lib/api/fleet";

interface CatalogDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** Mô tả đối tượng bị xóa (ví dụ: tên add-on/tiện nghi/danh mục) */
  itemLabel: string;
  /** Danh sách xe đang sử dụng đối tượng này (rỗng = không xe nào dùng) */
  usingVehicles: VehicleDto[];
  loading: boolean;
  onConfirm: () => void | Promise<void>;
}

const vehicleLabel = (v: VehicleDto) =>
  `${v.brand} ${v.model}${v.licensePlate ? ` (${v.licensePlate})` : ""}`;

export default function CatalogDeleteConfirmModal({
  isOpen,
  onClose,
  title,
  itemLabel,
  usingVehicles,
  loading,
  onConfirm
}: CatalogDeleteConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open && !loading) onClose(); }} aria-labelledby="catalog-delete-confirm-title">
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden w-full max-w-lg flex flex-col max-h-[90vh]">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h2 id="catalog-delete-confirm-title" className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle size={18} className="text-rose-600 dark:text-rose-400" />
                  {title}
                </h2>
                <p className="text-xs text-foreground/60 mt-1">
                  Hành động này không thể hoàn tác.
                </p>
              </div>
            </ModalHeader>
            <ModalBody className="p-6 space-y-4 overflow-y-auto max-h-[55vh]">
              <div className="bg-rose-500/5 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800/60 rounded-xl p-4">
                <p className="text-sm font-bold text-rose-700 dark:text-rose-300">
                  Xóa vĩnh viễn “{itemLabel}”
                </p>
                <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
                  {usingVehicles.length > 0
                    ? "Mục này đang được gắn trên các xe bên dưới. Sau khi xóa, hệ thống sẽ tự động gỡ mục này khỏi các xe đó."
                    : "Mục này hiện không được gắn trên xe nào, có thể xóa an toàn."}
                </p>
              </div>

              {usingVehicles.length > 0 ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">
                    {usingVehicles.length} xe đang sử dụng
                  </p>
                  <ul className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {usingVehicles.map((v) => (
                      <li
                        key={v.id}
                        className="flex items-center gap-2.5 bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5"
                      >
                        <Car size={15} className="text-foreground/50 shrink-0" />
                        <span className="text-xs font-bold text-foreground truncate">{vehicleLabel(v)}</span>
                        <span className="text-[10px] font-mono text-foreground/40 ml-auto shrink-0">#{v.id}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-xs text-foreground/50 italic">Chưa xe nào sử dụng mục này.</p>
              )}
            </ModalBody>
            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
              <Button
                variant="outline"
                onClick={onClose}
                isDisabled={loading}
                className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                {"Hủy"}
              </Button>
              <Button
                onPress={onConfirm}
                isDisabled={loading}
                className="rounded-xl font-bold text-xs h-10 px-5 bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer border-none transition-colors"
              >
                {loading ? <RefreshCw size={15} className="animate-spin mr-1.5" /> : <Trash2 size={15} className="mr-1.5" />}
                {"Xóa vĩnh viễn"}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}