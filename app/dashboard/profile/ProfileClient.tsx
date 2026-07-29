"use client";
import React, { useState, useEffect } from "react";
import { Button, Input, toast } from "@heroui/react";
import { User, Mail, Phone, Save, X, Pencil, Loader2, MessageCircle } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { updateProfile } from "@/lib/api/auth";
import { useI18n } from "@/context/LanguageContext";

export default function ProfileClient() {
  const { language, t } = useI18n();
  const { user, setAuth, accessToken, refreshToken } = useAuthStore();
  const tr = t.profile;

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [zaloId, setZaloId] = useState("");
  const [kakaoTalkId, setKakaoTalkId] = useState("");
  const [fullnameError, setFullnameError] = useState("");

  useEffect(() => {
    if (user) {
      setFullname(user.fullname || "");
      setPhone(user.phone || "");
      setZaloId(user.zaloId || "");
      setKakaoTalkId(user.kakaoTalkId || "");
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
    setFullnameError("");
  };

  const handleCancel = () => {
    if (user) {
      setFullname(user.fullname || "");
      setPhone(user.phone || "");
      setZaloId(user.zaloId || "");
      setKakaoTalkId(user.kakaoTalkId || "");
    }
    setIsEditing(false);
    setFullnameError("");
  };

  const handleSave = async () => {
    if (!fullname.trim()) {
      setFullnameError(tr.fullnameRequired);
      return;
    }
    setFullnameError("");
    setSaving(true);
    try {
      const updated = await updateProfile({
        fullname: fullname.trim(),
        phone: phone.trim() || undefined,
        zaloId: zaloId.trim() || undefined,
        kakaoTalkId: kakaoTalkId.trim() || undefined,
      });
      if (accessToken && refreshToken) {
        setAuth(updated, accessToken, refreshToken);
      }
      setIsEditing(false);
      toast.success(tr.updateSuccess);
    } catch (err: any) {
      toast.danger(err?.message || t.errors.profileUpdateFailed);
    } finally {
      setSaving(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN": return "Admin";
      case "STAFF": return "Staff";
      case "CUSTOMER": return language === "vi" ? "Khách hàng" : language === "ko" ? "고객" : language === "ru" ? "Клиент" : "Customer";
      default: return role;
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {tr.title}
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
          {tr.subtitle}
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-background border border-divider rounded-2xl overflow-hidden shadow-sm">
        {/* Avatar Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-8 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-lg">
            {(user.fullname || user.email || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{user.fullname || user.email}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
            <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-2 font-bold">
              {getRoleLabel(user.role)}
            </span>
          </div>
        </div>

        {/* Fields */}
        <div className="px-6 py-6 space-y-5">
          {/* Fullname */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <User size={14} className="text-muted-foreground" />
              {tr.fullname}
            </label>
            {isEditing ? (
              <div>
                <Input
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  placeholder={tr.fullname}
                  className="w-full bg-default-50"
                />
                {fullnameError && (
                  <p className="text-xs text-danger mt-1">{fullnameError}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-foreground py-2.5 px-3 bg-default-50 rounded-xl border border-divider">
                {user.fullname || "\u2014"}
              </p>
            )}
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Mail size={14} className="text-muted-foreground" />
              {tr.email}
            </label>
            <div className="relative">
              <Input
                value={user.email}
                readOnly
                className="w-full bg-default-50 opacity-70"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="text-[0.625rem] bg-gray-300 dark:bg-gray-600 text-muted-foreground px-1.5 py-0.5 rounded font-medium">
                  {tr.emailReadOnly}
                </span>
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Phone size={14} className="text-muted-foreground" />
              {tr.phone}
            </label>
            {isEditing ? (
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={tr.phone}
                className="w-full bg-default-50"
              />
            ) : (
              <p className="text-sm text-foreground py-2.5 px-3 bg-default-50 rounded-xl border border-divider">
                {user.phone || "\u2014"}
              </p>
            )}
          </div>

          {/* Zalo ID */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MessageCircle size={14} className="text-muted-foreground" />
              {tr.zaloId}
            </label>
            {isEditing ? (
              <Input
                value={zaloId}
                onChange={(e) => setZaloId(e.target.value)}
                placeholder={tr.zaloIdPlaceholder}
                className="w-full bg-default-50"
              />
            ) : (
              <p className="text-sm text-foreground py-2.5 px-3 bg-default-50 rounded-xl border border-divider">
                {user.zaloId || "\u2014"}
              </p>
            )}
          </div>

          {/* KakaoTalk ID */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MessageCircle size={14} className="text-muted-foreground" />
              {tr.kakaoTalkId}
            </label>
            {isEditing ? (
              <Input
                value={kakaoTalkId}
                onChange={(e) => setKakaoTalkId(e.target.value)}
                placeholder={tr.kakaoTalkPlaceholder}
                className="w-full bg-default-50"
              />
            ) : (
              <p className="text-sm text-foreground py-2.5 px-3 bg-default-50 rounded-xl border border-divider">
                {user.kakaoTalkId || "\u2014"}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-divider bg-default-50/30 flex items-center justify-end gap-3">
          {isEditing ? (
            <>
              <Button
                onClick={handleCancel}
                isDisabled={saving}
                className="gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-divider bg-default-100 hover:bg-default-200 text-foreground"
              >
                <X size={14} />
                {tr.cancelButton}
              </Button>
              <Button
                onClick={handleSave}
                isDisabled={saving}
                className="gap-1.5 px-5 py-2 rounded-xl text-sm font-bold bg-accent text-white hover:bg-accent-hover shadow-md"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {tr.saveButton}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleEdit}
              className="gap-1.5 px-5 py-2 rounded-xl text-sm font-bold border border-accent text-accent bg-transparent hover:bg-accent/10"
            >
              <Pencil size={14} />
              {tr.editButton}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
