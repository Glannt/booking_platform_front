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
      <ModalBackdrop className="bg-slate-950/40 backdrop-blur-sm" isDismissable={false}>
        <ModalContainer size="sm">
          <ModalDialog className="max-w-md bg-white dark:bg-black rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden focus:outline-none w-full flex flex-col">
            <ModalCloseTrigger />
            <ModalHeader className="border-b border-divider bg-slate-50 dark:bg-black/40 py-4 px-6">
              <span id="user-delete-title" className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="text-rose-500" size={20} />
                Xác nhận xóa User
              </span>
            </ModalHeader>

            <ModalBody className="p-6 text-sm text-slate-600 dark:text-slate-350">
              <p>
                Bạn có chắc chắn muốn xóa user{" "}
                <strong className="text-primary font-bold">{user.fullname || user.email}</strong>?
              </p>
              <p className="mt-2 text-xs text-rose-500 font-bold">
                * Hành động này sẽ ẩn user khỏi danh sách quản lý.
              </p>
            </ModalBody>

            <ModalFooter className="border-t border-divider bg-slate-50 dark:bg-black/40 py-3 px-6 justify-end gap-2.5">
              <Button
                className="rounded-xl font-bold bg-slate-200 dark:bg-[var(--bg-card)] text-slate-700 dark:text-slate-200"
                onClick={onClose}
                isDisabled={loading}
              >
                Hủy
              </Button>
              <Button
                className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm border border-transparent"
                onClick={handleDelete}
                isDisabled={loading}
              >
                {loading ? (
                  <RefreshCw className="animate-spin" size={16} />
                ) : (
                  <Trash2 size={16} className="mr-1.5" />
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
