"use client";

import React, { useState, useEffect } from "react";
import {
  User as UserIcon,
  Lock,
  Shield,
  Save,
  RotateCw,
  Mail,
  Phone,
  MessageSquare,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { Button, Input, toast } from "@heroui/react";
import { useAuthStore } from "@/lib/store/authStore";
import { updateProfile, changePassword } from "@/lib/api/auth";
import { useI18n } from "@/context/LanguageContext";

export default function PortalSettingsPage() {
  const { t } = useI18n();
  const { user, updateUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  // Profile Form State
  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [kakaoTalkId, setKakaoTalkId] = useState("");
  const [zaloId, setZaloId] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFullname(user.fullname || "");
      setPhone(user.phone || "");
      setKakaoTalkId(user.kakaoTalkId || "");
      setZaloId(user.zaloId || "");
      setWhatsapp(user.whatsapp || "");
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullname.trim()) {
      toast.danger(t.profile.fullnameRequired);
      return;
    }

    setSavingProfile(true);
    try {
      const updated = await updateProfile({
        fullname: fullname.trim(),
        phone: phone.trim() || undefined,
        kakaoTalkId: kakaoTalkId.trim() || undefined,
        zaloId: zaloId.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
      });
      updateUser(updated);
      toast.success(t.profile.updateSuccess);
    } catch (err: any) {
      toast.danger(err?.message || t.profile.updateError);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!newPassword) {
      setPasswordError(t.errors?.requiredField || "Vui lòng nhập mật khẩu mới");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(t.errors?.passwordTooShort || "Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasSpecial = /[^a-zA-Z0-9]/.test(newPassword);
    if (!hasUpper || !hasSpecial) {
      setPasswordError(t.errors?.passwordRequirements || "Mật khẩu phải chứa ít nhất 1 chữ hoa và 1 ký tự đặc biệt");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t.auth.passwordMismatch);
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword(newPassword);
      toast.success(t.auth.changePasswordSuccess);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.danger(err?.message || "Đổi mật khẩu thất bại");
    } finally {
      setSavingPassword(false);
    }
  };

  const roleBadgeColor: Record<string, string> = {
    ADMIN: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    MODERATOR: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    STAFF: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    CUSTOMER: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  };

  return (
    <div className="w-full max-w-4xl space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          {t.nav?.myProfile || t.profile.title}
        </h1>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
          {t.profile.subtitle}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white dark:bg-[var(--bg-surface)] p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "profile"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          }`}
        >
          <UserIcon size={15} />
          <span>{t.profile.title}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "security"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          }`}
        >
          <KeyRound size={15} />
          <span>{t.auth.changePasswordTitle}</span>
        </button>
      </div>

      {/* Tab Content: Profile */}
      {activeTab === "profile" && (
        <div className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-[var(--bg-elevated)] flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-lg">
                {(user?.fullname || user?.email || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {user?.fullname || "Người dùng"}
                </h3>
                <p className="text-xs text-slate-400 font-semibold">{user?.email}</p>
              </div>
            </div>
            {user?.role && (
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-extrabold border ${
                  roleBadgeColor[user.role] || "bg-slate-100 text-slate-700 dark:bg-[var(--bg-card)] dark:text-slate-300"
                }`}
              >
                {user.role}
              </span>
            )}
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.profile.fullname} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 text-slate-400" size={16} />
                  <Input
                    type="text"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-page)] text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t.profile.fullname}
                  />
                </div>
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.profile.email}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
                  <Input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[var(--bg-card)] text-slate-500 dark:text-slate-400 text-xs font-semibold cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{t.profile.emailReadOnly}</p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.profile.phone}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-slate-400" size={16} />
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-page)] text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t.profile.phone}
                  />
                </div>
              </div>

              {/* Zalo ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.profile.zaloId}
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 text-slate-400" size={16} />
                  <Input
                    type="text"
                    value={zaloId}
                    onChange={(e) => setZaloId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-page)] text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t.profile.zaloIdPlaceholder}
                  />
                </div>
              </div>

              {/* KakaoTalk ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.profile.kakaoTalkId}
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 text-slate-400" size={16} />
                  <Input
                    type="text"
                    value={kakaoTalkId}
                    onChange={(e) => setKakaoTalkId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-page)] text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t.profile.kakaoTalkPlaceholder}
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.profile.whatsapp}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-slate-400" size={16} />
                  <Input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-page)] text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t.profile.whatsappPlaceholder}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                isDisabled={savingProfile}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl border-none cursor-pointer text-xs"
              >
                {savingProfile ? (
                  <RotateCw size={15} className="animate-spin mr-1.5" />
                ) : (
                  <Save size={15} className="mr-1.5" />
                )}
                {t.profile.saveButton}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Content: Security / Password */}
      {activeTab === "security" && (
        <div className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Shield size={16} className="text-blue-600 dark:text-blue-400" />
              <span>{t.auth.changePasswordTitle}</span>
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Đảm bảo mật khẩu của bạn có độ dài tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ hoa và 1 ký tự đặc biệt.
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            {passwordError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-xs font-bold text-red-600 dark:text-red-400">
                {passwordError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.auth.newPassword} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={16} />
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-page)] text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t.auth.newPassword}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.auth.confirmPassword} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <CheckCircle2 className="absolute left-3 top-3 text-slate-400" size={16} />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-page)] text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t.auth.confirmPassword}
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                isDisabled={savingPassword}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl border-none cursor-pointer text-xs"
              >
                {savingPassword ? (
                  <RotateCw size={15} className="animate-spin mr-1.5" />
                ) : (
                  <Lock size={15} className="mr-1.5" />
                )}
                {t.auth.changePasswordSubmit}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
