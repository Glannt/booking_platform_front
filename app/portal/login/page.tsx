"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Label, FieldError, toast } from "@heroui/react";
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/authStore";
import { loginFormSchema, LoginFormValues } from "@/lib/schemas/auth.schema";

export default function PortalLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await apiFetch<any>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (response?.data) {
        const { user, accessToken, refreshToken } = response.data;
        const allowedRoles = ["ADMIN", "STAFF", "MODERATOR"];
        if (!allowedRoles.includes(user.role)) {
          toast.danger("Tài khoản này không có quyền truy cập cổng quản trị.");
          return;
        }
        setAuth(user, accessToken, refreshToken);
        toast.success("Đăng nhập thành công!");
        router.push("/portal");
      } else {
        throw new Error("Phản hồi không hợp lệ");
      }
    } catch (error: any) {
      toast.danger(error.message || "Đăng nhập thất bại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 bg-background">
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30 dark:opacity-20 pointer-events-none">
        <div className="h-[400px] w-[400px] rounded-full bg-accent filter blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-md border border-default-200/50 bg-background/60 backdrop-blur-md shadow-2xl rounded-2xl p-6">
        <div className="flex flex-col gap-1 items-center pb-4 pt-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent mb-2">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Cổng Quản trị & Vận hành</h1>
          <p className="text-sm text-muted-foreground">Minh Khoa Travel Portal</p>
        </div>
        <div className="py-2">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="space-y-1">
              <Label isRequired className="block text-xs font-bold mb-1">Email</Label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 text-default-450 pointer-events-none" size={16} />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-default-100/50 border border-default-200 rounded-2xl text-sm font-medium outline-none focus:border-accent transition-colors text-foreground placeholder:text-default-400"
                />
              </div>
              {errors.email && <FieldError className="text-xs text-rose-500 mt-1">{errors.email.message}</FieldError>}
            </div>

            <div className="space-y-1">
              <Label isRequired className="block text-xs font-bold mb-1">Mật khẩu</Label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 text-default-450 pointer-events-none" size={16} />
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-default-100/50 border border-default-200 rounded-2xl text-sm font-medium outline-none focus:border-accent transition-colors text-foreground placeholder:text-default-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 focus:outline-none opacity-70 hover:opacity-100 cursor-pointer bg-transparent border-none p-0 flex items-center"
                >
                  {showPassword ? <EyeOff className="text-default-400" size={16} /> : <Eye className="text-default-400" size={16} />}
                </button>
              </div>
              {errors.password && <FieldError className="text-xs text-rose-500 mt-1">{errors.password.message}</FieldError>}
            </div>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-accent hover:underline font-medium transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <Button
              type="submit"
              isDisabled={isLoading}
              className="w-full mt-2 font-bold text-xs h-10 rounded-xl shadow-sm border-none cursor-pointer flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-accent-foreground transition-colors"
            >
              {isLoading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
              Đăng nhập Portal
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
