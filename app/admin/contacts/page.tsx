"use client";
import React, { useState, useEffect } from "react";
import { TextField, Label, Input, Button, toast, Spinner } from "@heroui/react";
import { Phone, Save } from "lucide-react";
import { getContactSettings, updateContactSettings, type ContactSettingDto } from "@/lib/api/setting";

export default function ContactsSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [id, setId] = useState<number | undefined>();
  const [phone, setPhone] = useState("");
  const [zalo, setZalo] = useState("");
  const [kakaotalk, setKakaotalk] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await getContactSettings();
        if (res?.data) {
          setId(res.data.id);
          setPhone(res.data.phone || "");
          setZalo(res.data.zalo || "");
          setKakaotalk(res.data.kakaotalk || "");
          setWhatsapp(res.data.whatsapp || "");
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
        toast.danger("Không thể tải cấu hình liên hệ!");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: ContactSettingDto = {
        id,
        phone: phone.trim(),
        zalo: zalo.trim(),
        kakaotalk: kakaotalk.trim(),
        whatsapp: whatsapp.trim(),
      };
      const res = await updateContactSettings(payload);
      if (res?.data) {
        toast.success("Cập nhật thông tin liên hệ thành công!");
      } else {
        toast.danger("Cập nhật thất bại!");
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      toast.danger("Lỗi hệ thống khi cập nhật!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-2">
        <Spinner size="sm" />
        <span className="text-xs font-bold text-slate-500">Đang tải cấu hình...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black p-6 md:p-8 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">
          <TextField isRequired className="w-full">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Số điện thoại *
            </Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Phone size={16} />
              </span>
              <Input
                type="text"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary text-sm font-bold focus:outline-none"
                placeholder="Nhập số điện thoại..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </TextField>

          <TextField isRequired className="w-full">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Đường dẫn Zalo *
            </Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-black">
                Zalo
              </span>
              <Input
                type="text"
                className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary text-sm font-bold focus:outline-none"
                placeholder="Nhập link hoặc số điện thoại Zalo..."
                value={zalo}
                onChange={(e) => setZalo(e.target.value)}
              />
            </div>
          </TextField>

          <TextField className="w-full">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              KakaoTalk ID / Link
            </Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-black">
                Talk
              </span>
              <Input
                type="text"
                className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary text-sm font-bold focus:outline-none"
                placeholder="Nhập link hoặc ID KakaoTalk..."
                value={kakaotalk}
                onChange={(e) => setKakaotalk(e.target.value)}
              />
            </div>
          </TextField>

          <TextField className="w-full">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              WhatsApp Link
            </Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-black">
                WA
              </span>
              <Input
                type="text"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary text-sm font-bold focus:outline-none"
                placeholder="Nhập link WhatsApp..."
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>
          </TextField>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 rounded-xl border-none cursor-pointer"
          >
            {saving ? <Spinner size="sm" /> : <Save size={16} />}
            <span>Lưu cấu hình</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
