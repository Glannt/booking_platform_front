"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";

import { useAuthStore } from "@/lib/store/authStore";

export default function RolesRedirectPage() {
  const router = useRouter();
  const { user: authUser } = useAuthStore();

  useEffect(() => {
    if (authUser?.role === "MODERATOR") {
      router.replace("/portal/users");
    } else {
      router.replace("/portal/users?tab=roles");
    }
  }, [router, authUser]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
      <Spinner size="lg" />
      <span className="text-xs font-bold text-neutral-500">Đang chuyển hướng đến Phân quyền...</span>
    </div>
  );
}
