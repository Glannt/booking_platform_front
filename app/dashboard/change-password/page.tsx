"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button, Label, toast } from "@heroui/react";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/context/LanguageContext";
import { changePassword } from "@/lib/api/auth";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const changePasswordSchema = z.object({
    newPassword: z.string().min(6, { message: t.errors.passwordTooShort }),
    confirmPassword: z.string().min(6, { message: t.errors.passwordTooShort }),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t.auth.passwordMismatch,
    path: ["confirmPassword"],
  });

  type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ChangePasswordFormValues) => {
    setIsLoading(true);
    try {
      await changePassword(data.newPassword);
      toast.success(t.auth.changePasswordSuccess);
      router.push("/dashboard/profile");
    } catch (error: any) {
      console.error("Change password failed:", error);
      toast.danger(error.message || t.errors.unexpected);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-8">
      <div className="mb-6">
        <Link
          href="/dashboard/profile"
          className="text-primary hover:underline font-medium transition-colors inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft size={14} />
          {t.auth.backToLogin}
        </Link>
      </div>

      <div className="border border-default-200/50 bg-background/60 backdrop-blur-md shadow-xl rounded-2xl p-6">
        <div className="flex flex-col gap-1 items-center pb-4 pt-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
            <Lock size={24} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t.auth.changePasswordTitle}</h1>
        </div>
        <div className="py-2">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="space-y-1">
              <Label className="block text-xs font-bold text-default-600">
                {t.auth.newPassword} *
              </Label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 text-default-450 pointer-events-none" size={16} />
                <input
                  {...register("newPassword")}
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-default-100/50 border border-default-200 rounded-2xl text-sm font-medium outline-none focus:border-primary transition-colors text-foreground placeholder:text-default-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 focus:outline-none opacity-70 hover:opacity-100 cursor-pointer bg-transparent border-none p-0 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="text-default-400 pointer-events-none" size={16} />
                  ) : (
                    <Eye className="text-default-400 pointer-events-none" size={16} />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-xs text-rose-500 mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label className="block text-xs font-bold text-default-600">
                {t.auth.confirmPassword} *
              </Label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 text-default-450 pointer-events-none" size={16} />
                <input
                  {...register("confirmPassword")}
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-default-100/50 border border-default-200 rounded-2xl text-sm font-medium outline-none focus:border-primary transition-colors text-foreground placeholder:text-default-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 focus:outline-none opacity-70 hover:opacity-100 cursor-pointer bg-transparent border-none p-0 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="text-default-400 pointer-events-none" size={16} />
                  ) : (
                    <Eye className="text-default-400 pointer-events-none" size={16} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-rose-500 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              isDisabled={isLoading}
              className="w-full mt-2 font-semibold shadow-md border-none cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading && (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
              {t.auth.changePasswordSubmit}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
