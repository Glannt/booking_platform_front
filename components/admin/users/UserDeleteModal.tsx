"use client";

import React, { useState } from "react";
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
} from "@heroui/react";
import { Trash2, AlertCircle, RefreshCw } from "lucide-react";
import { deleteUser, AdminUserDto } from "@/lib/api/users";

interface UserDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUserDto | null;
  onDeleteSuccess: (id: number) => void;
  showToast: (msg: string, type: "success" | "error") => void;
}

export default function UserDeleteModal({
  isOpen,
  onClose,
  user,
  onDeleteSuccess,
  showToast,
}: UserDeleteModalProps) {
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteUser(user.id);
      showToast("Đã xóa user thành công!", "success");
      onDeleteSuccess(user.id);
      onClose();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Lỗi xóa user!", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="user-delete-title">
      <ModalBackdrop className="bg-black/50 backdrop-blur-sm" isDismissable={false}>
        <ModalContainer size="sm">
          <ModalDialog className="max-w-md bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden focus:outline-none w-full flex flex-col">
            <ModalCloseTrigger aria-label="Đóng xác nhận xóa user" />
            <ModalHeader className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[var(--bg-page)]/40 py-4 px-6">
              <span id="user-delete-title" className="text-lg font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="text-rose-500" size={20} />
                Xác nhận xóa User
              </span>
            </ModalHeader>

            <ModalBody className="p-6 text-sm text-neutral-600 dark:text-neutral-300">
              <p>
                Bạn có chắc chắn muốn xóa user{" "}
                <strong className="text-primary font-bold">{user.fullname || user.email}</strong>?
              </p>
              <p className="mt-2 text-xs text-rose-500 font-bold">
                * Hành động này sẽ ẩn user khỏi danh sách quản lý.
              </p>
            </ModalBody>

            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
              <Button
                variant="outline"
                aria-label="Hủy thao tác xóa user"
                className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                onClick={onClose}
                isDisabled={loading}
              >
                Hủy
              </Button>
              <Button
                aria-label="Xác nhận xóa user"
                className="rounded-xl font-bold text-xs h-10 px-5 bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer border-none transition-colors"
                onClick={handleDelete}
                isDisabled={loading}
              >
                {loading ? (
                  <RefreshCw className="animate-spin mr-1.5" size={15} />
                ) : (
                  <Trash2 size={15} className="mr-1.5" />
                )}
                Xóa User
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
