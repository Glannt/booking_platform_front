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
  Input,
  Select,
  ListBox,
  Label,
} from "@heroui/react";
import { UserPlus, RefreshCw, Edit3, Shield, Save } from "lucide-react";
import { createUser, updateUser, AdminUserDto, AdminCreateUserRequest, AdminUpdateUserRequest } from "@/lib/api/users";
import { useAuthStore } from "@/lib/store/authStore";

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void | Promise<void>;
  showToast: (msg: string, type: "success" | "error") => void;
  editingUser?: AdminUserDto | null;
}

export default function UserCreateModal({
  isOpen,
  onClose,
  onSaveSuccess,
  showToast,
  editingUser,
}: UserCreateModalProps) {
  const { user: currentUser } = useAuthStore();
  const isModerator = currentUser?.role === "MODERATOR";

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("CUSTOMER");
  const [status, setStatus] = useState("active");
  const [reasonInactive, setReasonInactive] = useState("");
  const [zaloId, setZaloId] = useState("");
  const [kakaoTalkId, setKakaoTalkId] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullname("");
    setPhone("");
    setRole("CUSTOMER");
    setStatus("active");
    setReasonInactive("");
    setZaloId("");
    setKakaoTalkId("");
    setWhatsapp("");
  };

  useEffect(() => {
    if (editingUser) {
      setEmail(editingUser.email || "");
      setPassword("");
      setFullname(editingUser.fullname || "");
      setPhone(editingUser.phone || "");
      setRole(editingUser.role || "CUSTOMER");
      setStatus(editingUser.status || "active");
      setReasonInactive(editingUser.reasonInactive || "");
      setZaloId(editingUser.zaloId || "");
      setKakaoTalkId(editingUser.kakaoTalkId || "");
      setWhatsapp(editingUser.whatsapp || "");
    } else {
      resetForm();
    }
  }, [editingUser, isOpen]);

  const handleSave = async () => {
    if (isModerator) {
      if (!editingUser) {
        showToast("Moderator không có quyền tạo người dùng mới", "error");
        return;
      }
      setLoading(true);
      try {
        const payload: AdminUpdateUserRequest = {
          fullname: editingUser.fullname,
          phone: editingUser.phone || undefined,
          role: editingUser.role,
          status,
          reasonInactive: (status === "inactive" || status === "blocked") ? (reasonInactive.trim() || undefined) : undefined,
          zaloId: editingUser.zaloId || undefined,
          kakaoTalkId: editingUser.kakaoTalkId || undefined,
          whatsapp: editingUser.whatsapp || undefined,
        };
        await updateUser(editingUser.id, payload);
        showToast("Cập nhật trạng thái user thành công!", "success");
        resetForm();
        await onSaveSuccess?.();
        onClose();
      } catch (err: any) {
        console.error(err);
        showToast(err.message || "Cập nhật trạng thái thất bại!", "error");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email || (!editingUser && !password) || !fullname || !role) {
      showToast("Vui lòng điền đầy đủ thông tin bắt buộc", "error");
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!editingUser) {
      if (!password || !passwordRegex.test(password)) {
        showToast("Mật khẩu phải từ 8 ký tự trở lên, gồm ít nhất 1 chữ hoa và 1 ký tự đặc biệt", "error");
        return;
      }
    } else if (password.trim()) {
      if (!passwordRegex.test(password.trim())) {
        showToast("Mật khẩu mới phải từ 8 ký tự trở lên, gồm ít nhất 1 chữ hoa và 1 ký tự đặc biệt", "error");
        return;
      }
    }

    setLoading(true);
    try {
      if (editingUser) {
        const payload: AdminUpdateUserRequest = {
          fullname,
          phone: phone || undefined,
          password: password.trim() ? password.trim() : undefined,
          role,
          status,
          reasonInactive: (status === "inactive" || status === "blocked") ? (reasonInactive.trim() || undefined) : undefined,
          zaloId: zaloId || undefined,
          kakaoTalkId: kakaoTalkId || undefined,
          whatsapp: whatsapp || undefined,
        };
        await updateUser(editingUser.id, payload);
        showToast("Cập nhật user thành công!", "success");
      } else {
        const payload: AdminCreateUserRequest = {
          email: email.trim(),
          password: password.trim(),
          fullname: fullname.trim(),
          phone: phone.trim() || undefined,
          role,
          status,
          reasonInactive: (status === "inactive" || status === "blocked") ? (reasonInactive.trim() || undefined) : undefined,
          zaloId: zaloId.trim() || undefined,
          kakaoTalkId: kakaoTalkId.trim() || undefined,
          whatsapp: whatsapp.trim() || undefined,
        };
        await createUser(payload);
        showToast("Tạo user thành công!", "success");
      }
      resetForm();
      await onSaveSuccess?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Thao tác thất bại!", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) { resetForm(); onClose(); } }} aria-labelledby="user-create-title">
      <ModalBackdrop className="bg-black/50 backdrop-blur-sm" isDismissable={false}>
        <ModalContainer size="md">
          <ModalDialog className="max-w-lg bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden focus:outline-none w-full flex flex-col max-h-[90vh]">
            <ModalCloseTrigger aria-label="Đóng cửa sổ tạo hoặc chỉnh sửa user" />
            <ModalHeader className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[var(--bg-page)]/40 py-4 px-6 shrink-0">
              <span id="user-create-title" className="text-lg font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                {editingUser ? (
                  <>
                    <Edit3 className="text-accent" size={20} />
                    {isModerator ? "Cập nhật Trạng thái User" : "Chỉnh sửa User"}
                  </>
                ) : (
                  <>
                    <UserPlus className="text-accent" size={20} />
                    Tạo User Mới
                  </>
                )}
              </span>
            </ModalHeader>

            <ModalBody className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isModerator && (
                  <div className="sm:col-span-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
                    <Shield size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>Quyền Moderator: Bạn chỉ được phép thay đổi <strong>Trạng thái</strong> của người dùng.</span>
                  </div>
                )}

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label isRequired className="text-[10px] font-bold uppercase tracking-wider">Email</Label>
                  <Input
                    type="email"
                    aria-label="Địa chỉ Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    disabled={!!editingUser || isModerator}
                    className="border-1 border-separator"
                  />
                </div>

                {!isModerator && (
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label isRequired={!editingUser} className="text-[10px] font-bold uppercase tracking-wider">
                      {editingUser ? "Mật khẩu mới (Tùy chọn)" : "Mật khẩu"}
                    </Label>
                    <Input
                      type="password"
                      aria-label="Mật khẩu"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={editingUser ? "Để trống nếu không muốn đổi" : "Tối thiểu 8 ký tự, 1 hoa, 1 đặc biệt"}
                      className="border-1 border-separator"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <Label isRequired className="text-[10px] font-bold uppercase tracking-wider">Họ và tên</Label>
                  <Input
                    aria-label="Họ và tên"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    disabled={isModerator}
                    className="border-1 border-separator"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider">Số điện thoại</Label>
                  <Input
                    aria-label="Số điện thoại"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0901 234 567"
                    disabled={isModerator}
                    className="border-1 border-separator"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label isRequired className="text-[10px] font-bold uppercase tracking-wider">Vai trò</Label>
                  <Select aria-label="Chọn vai trò" selectedKey={role} onSelectionChange={(key) => { if (key) setRole(key as string); }} isDisabled={isModerator}>
                    <Select.Trigger className="h-10 px-3 rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-card)] text-xs font-bold cursor-pointer">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="bg-white dark:bg-[var(--bg-card)] border-1 border-separator rounded-xl shadow-xl p-1 z-50">
                      <ListBox>
                        <ListBox.Item key="ADMIN" id="ADMIN" textValue="Admin">Admin<ListBox.ItemIndicator /></ListBox.Item>
                        <ListBox.Item key="STAFF" id="STAFF" textValue="Staff">Staff<ListBox.ItemIndicator /></ListBox.Item>
                        <ListBox.Item key="MODERATOR" id="MODERATOR" textValue="Moderator">Moderator<ListBox.ItemIndicator /></ListBox.Item>
                        <ListBox.Item key="CUSTOMER" id="CUSTOMER" textValue="Customer">Customer<ListBox.ItemIndicator /></ListBox.Item>
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label isRequired className="text-[10px] font-bold uppercase tracking-wider">Trạng thái</Label>
                  <Select aria-label="Chọn trạng thái" selectedKey={status} onSelectionChange={(key) => { if (key) setStatus(key as string); }}>
                    <Select.Trigger className="h-10 px-3 rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-card)] text-xs font-bold cursor-pointer">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="bg-white dark:bg-[var(--bg-card)] border-1 border-separator rounded-xl shadow-xl p-1 z-50">
                      <ListBox>
                        <ListBox.Item key="active" id="active" textValue="Active">Hoạt động<ListBox.ItemIndicator /></ListBox.Item>
                        <ListBox.Item key="inactive" id="inactive" textValue="Inactive">Tạm khóa<ListBox.ItemIndicator /></ListBox.Item>
                        <ListBox.Item key="blocked" id="blocked" textValue="Blocked">Khóa vĩnh viễn<ListBox.ItemIndicator /></ListBox.Item>
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>

                {(status === "inactive" || status === "blocked") && (
                  <div className="flex flex-col gap-1.5 sm:col-span-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                      Lý do tạm khóa / chặn (reasonInactive) *
                    </Label>
                    <Input
                      aria-label="Lý do khóa hoặc chặn"
                      value={reasonInactive}
                      onChange={(e) => setReasonInactive(e.target.value)}
                      placeholder="Nhập lý do tài khoản bị tạm khóa hoặc chặn..."
                      className="w-full border-1 border-separator"
                    />
                  </div>
                )}

                {/* Social channels */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider">Zalo ID</Label>
                  <Input
                    aria-label="Zalo ID"
                    value={zaloId}
                    onChange={(e) => setZaloId(e.target.value)}
                    placeholder="0901234567"
                    disabled={isModerator}
                    className="border-1 border-separator"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider">KakaoTalk ID</Label>
                  <Input
                    aria-label="KakaoTalk ID"
                    value={kakaoTalkId}
                    onChange={(e) => setKakaoTalkId(e.target.value)}
                    placeholder="kakaouser"
                    disabled={isModerator}
                    className="border-1 border-separator"
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider">WhatsApp</Label>
                  <Input
                    aria-label="WhatsApp"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+84901234567"
                    disabled={isModerator}
                    className="border-1 border-separator"
                  />
                </div>
              </div>
            </ModalBody>

            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
              <Button
                variant="outline"
                aria-label="Hủy thao tác"
                className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                onClick={() => { resetForm(); onClose(); }}
                isDisabled={loading}
              >
                Hủy
              </Button>
              <Button
                aria-label={editingUser ? "Lưu thông tin user" : "Tạo user mới"}
                className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
                onClick={handleSave}
                isDisabled={loading}
              >
                {loading ? (
                  <RefreshCw className="animate-spin mr-1.5" size={15} />
                ) : editingUser ? (
                  <Save size={15} className="mr-1.5" />
                ) : (
                  <UserPlus size={15} className="mr-1.5" />
                )}
                {editingUser ? "Lưu thay đổi" : "Tạo User"}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
