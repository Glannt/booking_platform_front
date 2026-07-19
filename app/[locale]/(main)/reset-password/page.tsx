"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button, Label, toast } from "@heroui/react";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/context/LanguageContext";
import { resetPassword } from "@/lib/api/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";
  const codeFromQuery = searchParams.get("code") || "";
  const { t, language } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const resetPasswordSchema = z.object({
    newPassword: z.string().min(6, { message: t.errors.passwordTooShort }),
    confirmPassword: z.string().min(6, { message: t.errors.passwordTooShort }),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t.auth.passwordMismatch,
    path: ["confirmPassword"],
  });

  type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    try {
      await resetPassword(emailFromQuery, codeFromQuery, data.newPassword);
      toast.success(t.auth.resetPasswordSuccess);
      router.push(`/${language}/login`);
    } catch (error: any) {
      console.error("Reset password failed:", error);
      toast.danger(error.message || t.errors.unexpected);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 py-12">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30 dark:opacity-20 pointer-events-none">
        <div className="h-[400px] w-[400px] rounded-full bg-primary filter blur-[80px]" />
        <div className="h-[300px] w-[300px] rounded-full bg-secondary filter blur-[60px] translate-x-20 -translate-y-20" />
      </div>

      <div className="relative z-10 w-full max-w-md border border-default-200/50 bg-background/60 backdrop-blur-md shadow-2xl rounded-2xl p-6">
        <div className="flex flex-col gap-1 items-center pb-4 pt-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
            <CheckCircle size={24} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t.auth.resetPasswordTitle}</h1>
          <p className="text-sm text-muted-foreground text-center">{t.auth.resetPasswordSubtitle}</p>
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
              {t.auth.resetPasswordSubmit}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link
              href={`/${language}/login`}
              className="text-primary hover:underline font-medium transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              {t.auth.backToLogin}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
