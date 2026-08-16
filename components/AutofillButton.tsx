"use client";

import { UserRoundCog } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useI18n } from "@/context/LanguageContext";

interface AutofillData {
  fullname: string;
  phone: string;
  email: string;
  zaloId?: string;
  kakaoTalkId?: string;
  whatsapp?: string;
}

interface AutofillButtonProps {
  onFill: (data: AutofillData) => void;
  label?: string;
}

export function AutofillButton({ onFill, label }: AutofillButtonProps) {
  const { user, isAuthenticated } = useAuthStore();
  const { t } = useI18n();

  if (!isAuthenticated || !user) return null;

  return (
    <button
      type="button"
      onClick={() =>
        onFill({
          fullname: user.fullname ?? "",
          phone: user.phone ?? "",
          email: user.email ?? "",
          zaloId: user.zaloId ?? "",
          kakaoTalkId: user.kakaoTalkId ?? "",
          whatsapp: user.whatsapp ?? "",
        })
      }
      title={label ?? t.common.autoFill}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-accent bg-accent/5 hover:bg-accent/10 border border-accent/20 rounded-xl transition-colors cursor-pointer"
    >
      <UserRoundCog size={12} />
      {label ?? t.common.autoFill}
    </button>
  );
}
