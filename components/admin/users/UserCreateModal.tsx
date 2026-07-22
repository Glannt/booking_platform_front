"use client";

import React, { useState } from "react";
import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  ListBox,
  Label,
} from "@heroui/react";
import { UserPlus, RefreshCw } from "lucide-react";
import { createUser, AdminCreateUserRequest } from "@/lib/api/users";

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
}

export default function UserCreateModal({
  isOpen,
  onClose,
  onSaveSuccess,
  showToast,
}: UserCreateModalProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("CUSTOMER");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullname("");
    setPhone("");
    setRole("CUSTOMER");
  };

  const handleCreate = async () => {
    if (!email || !password || !fullname || !role) {
      showToast("Vui lòng điền đầy đủ thông tin bắt buộc", "error");
      return;
    }

    setLoading(true);
    try {
      const payload: AdminCreateUserRequest = {
        email,
        password,
        fullname,
        phone: phone || undefined,
        role,
      };
      await createUser(payload);
      showToast("Tạo user thành công!", "success");
      resetForm();
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Lỗi tạo user!", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) { resetForm(); onClose(); } }} aria-labelledby="user-create-title">
      <ModalBackdrop className="bg-slate-950/40 backdrop-blur-sm" isDismissable={false}>
        <ModalContainer size="md">
          <ModalDialog className="max-w-md bg-white dark:bg-black rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden focus:outline-none w-full flex flex-col">
            <ModalHeader className="border-b border-divider bg-slate-50 dark:bg-black/40 py-4 px-6">
              <span id="user-create-title" className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="text-accent" size={20} />
                Tạo User Mới
              </span>
            </ModalHeader>

            <ModalBody className="p-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider">Email *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider">Mật khẩu *</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider">Họ và tên *</Label>
                <Input
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider">Số điện thoại</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901 234 567"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider">Vai trò *</Label>
                <Select selectedKey={role} onSelectionChange={(key) => { if (key) setRole(key as string); }}>
                  <Select.Trigger className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black text-xs font-bold cursor-pointer">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-50">
                    <ListBox>
                      <ListBox.Item key="ADMIN" id="ADMIN" textValue="Admin">Admin<ListBox.ItemIndicator /></ListBox.Item>
                      <ListBox.Item key="STAFF" id="STAFF" textValue="Staff">Staff<ListBox.ItemIndicator /></ListBox.Item>
                      <ListBox.Item key="MODERATOR" id="MODERATOR" textValue="Moderator">Moderator<ListBox.ItemIndicator /></ListBox.Item>
                      <ListBox.Item key="CUSTOMER" id="CUSTOMER" textValue="Customer">Customer<ListBox.ItemIndicator /></ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>
            </ModalBody>

            <ModalFooter className="border-t border-divider bg-slate-50 dark:bg-black/40 py-3 px-6 justify-end gap-2.5">
              <Button
                className="rounded-xl font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                onClick={() => { resetForm(); onClose(); }}
                isDisabled={loading}
              >
                Hủy
              </Button>
              <Button
                className="rounded-xl font-bold bg-accent hover:bg-accent-hover text-white shadow-sm border border-transparent"
                onClick={handleCreate}
                isDisabled={loading}
              >
                {loading ? (
                  <RefreshCw className="animate-spin" size={16} />
                ) : (
                  <UserPlus size={16} className="mr-1.5" />
                )}
                Tạo User
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
