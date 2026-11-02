"use client";

import React, { useState, useEffect } from "react";
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
  TextField,
  Label,
  Input,
  toast,
} from "@heroui/react";
import { Save, RefreshCw, ShieldPlus, Edit3 } from "lucide-react";

import {
  createPermission,
  updatePermission,
  PermissionDto,
} from "@/lib/api/roles";

interface PermissionCreateUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  editingPermission?: PermissionDto | null;
}

export default function PermissionCreateUpdateModal({
  isOpen,
  onClose,
  onSaved,
  editingPermission,
}: PermissionCreateUpdateModalProps) {
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setCode(editingPermission?.code ?? "");
    setName(editingPermission?.name ?? "");
    setDescription(editingPermission?.description ?? "");
  }, [isOpen, editingPermission]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!editingPermission && !code.trim()) {
      toast.danger("Mã quyền (Code) là bắt buộc!");
      return;
    }
    if (!name.trim()) {
      toast.danger("Tên quyền là bắt buộc!");
      return;
    }

    setLoading(true);
    try {
      if (editingPermission) {
        await updatePermission(editingPermission.code, {
          name: name.trim(),
          description: description.trim(),
        });
        toast.success(`Đã cập nhật quyền ${editingPermission.code}!`);
      } else {
        await createPermission({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim(),
        });
        toast.success("Đã thêm quyền hạn mới!");
      }
      await onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.danger(err?.message || "Không thể lưu quyền hạn");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="permission-update-modal-title">
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden w-full max-w-lg flex flex-col max-h-[90vh]">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h2 id="permission-update-modal-title" className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  {editingPermission ? (
                    <>
                      <Edit3 className="text-accent" size={20} />
                      Chỉnh sửa Quyền hạn
                    </>
                  ) : (
                    <>
                      <ShieldPlus className="text-accent" size={20} />
                      Thêm Quyền hạn Mới
                    </>
                  )}
                </h2>
                <p className="text-xs text-slate-500">
                  {editingPermission
                    ? `Cập nhật thông tin hiển thị của quyền ${editingPermission.code}. Mã quyền không thể đổi.`
                    : "Tạo mã quyền mới rồi gán cho vai trò trong ma trận bên dưới."}
                </p>
              </div>
            </ModalHeader>
            <form onSubmit={handleSave}>
              <ModalBody className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                <TextField isRequired className="w-full">
                  <Label className="text-xs font-bold uppercase tracking-wider">Mã quyền (Code)</Label>
                  <Input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="VD: ADDON_UPDATE, SECTION_DELETE..."
                    disabled={!!editingPermission}
                    className="w-full p-2.5 rounded-xl text-xs font-semibold border-1 border-separator"
                  />
                </TextField>

                <TextField isRequired className="w-full">
                  <Label className="text-xs font-bold uppercase tracking-wider">Tên quyền</Label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Cập nhật phụ kiện"
                    className="w-full p-2.5 rounded-xl text-xs font-semibold border-1 border-separator"
                  />
                </TextField>

                <TextField className="w-full">
                  <Label className="text-xs font-bold uppercase tracking-wider">Mô tả</Label>
                  <Input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả ngắn về quyền này (tùy chọn)"
                    className="w-full p-2.5 rounded-xl text-xs font-semibold border-1 border-separator"
                  />
                </TextField>
              </ModalBody>

              <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
                <Button
                  variant="outline"
                  onClick={onClose}
                  isDisabled={loading}
                  className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  isDisabled={loading}
                  className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
                >
                  {loading ? <RefreshCw size={15} className="animate-spin mr-1.5" /> : <Save size={15} className="mr-1.5" />}
                  {editingPermission ? "Lưu thay đổi" : "Tạo mới"}
                </Button>
              </ModalFooter>
            </form>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}