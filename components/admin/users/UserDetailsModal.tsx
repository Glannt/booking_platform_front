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
  Button,
} from "@heroui/react";
import { Eye, Mail, Phone, Shield, User as UserIcon, MessageSquare, Edit3 } from "lucide-react";
import { AdminUserDto } from "@/lib/api/users";

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUserDto | null;
  onEdit: () => void;
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  STAFF: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  MODERATOR: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CUSTOMER: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  inactive: "bg-slate-100 text-slate-700 dark:bg-[var(--bg-card)] dark:text-slate-400",
  blocked: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

export default function UserDetailsModal({ isOpen, onClose, user, onEdit }: UserDetailsModalProps) {
  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="user-details-title">
      <ModalBackdrop className="bg-slate-950/40 backdrop-blur-sm" isDismissable={false}>
        <ModalContainer size="md">
          <ModalDialog className="max-w-md bg-white dark:bg-black rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden focus:outline-none w-full flex flex-col">
            <ModalCloseTrigger />
            <ModalHeader className="border-b border-divider bg-slate-50 dark:bg-black/40 py-4 px-6">
              <div className="flex items-center justify-between w-full">
                <span id="user-details-title" className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye className="text-accent" size={20} />
                  Chi tiết User
                </span>
                <Button
                  size="sm"
                  onClick={onEdit}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 size={14} /> Chỉnh sửa
                </Button>
              </div>
            </ModalHeader>

            <ModalBody className="p-6 space-y-4">
              {/* Avatar + Name */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                  <UserIcon className="text-accent" size={28} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {user.fullname || "Chưa cập nhật"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                </div>
              </div>

              {/* Info rows */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <Mail size={14} className="text-slate-400 shrink-0" />
                  <span className="text-slate-500 w-24 shrink-0">Email</span>
                  <span className="font-bold text-slate-900 dark:text-white">{user.email}</span>
                </div>

                <div className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <Phone size={14} className="text-slate-400 shrink-0" />
                  <span className="text-slate-500 w-24 shrink-0">Điện thoại</span>
                  <span className="font-bold text-slate-900 dark:text-white">{user.phone || "Chưa cập nhật"}</span>
                </div>

                <div className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <MessageSquare size={14} className="text-slate-400 shrink-0" />
                  <span className="text-slate-500 w-24 shrink-0">Số Zalo</span>
                  <span className="font-bold text-slate-900 dark:text-white">{user.zaloId || "Chưa cập nhật"}</span>
                </div>

                <div className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <MessageSquare size={14} className="text-slate-400 shrink-0" />
                  <span className="text-slate-500 w-24 shrink-0">KakaoTalk ID</span>
                  <span className="font-bold text-slate-900 dark:text-white">{user.kakaoTalkId || "Chưa cập nhật"}</span>
                </div>

                <div className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <Shield size={14} className="text-slate-400 shrink-0" />
                  <span className="text-slate-500 w-24 shrink-0">Vai trò</span>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${roleColors[user.role] || "bg-slate-100 text-slate-600"}`}>
                    {user.role}
                  </span>
                </div>

                <div className="flex items-center gap-3 py-2">
                  <div className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                    <div className={`w-2.5 h-2.5 rounded-full ${user.status === "active" ? "bg-emerald-500" : user.status === "blocked" ? "bg-rose-500" : "bg-slate-400"}`} />
                  </div>
                  <span className="text-slate-500 w-24 shrink-0">Trạng thái</span>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[user.status] || "bg-slate-100 text-slate-600"}`}>
                    {user.status}
                  </span>
                </div>
              </div>
            </ModalBody>

            <ModalFooter className="border-t border-divider bg-slate-50 dark:bg-black/40 py-3 px-6 justify-end">
              <Button
                className="rounded-xl font-bold bg-slate-200 dark:bg-[var(--bg-card)] text-slate-700 dark:text-slate-200"
                onClick={onClose}
              >
                Đóng
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
