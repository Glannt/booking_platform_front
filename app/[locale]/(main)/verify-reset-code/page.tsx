"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button, Label, toast } from "@heroui/react";
import { ShieldCheck, Mail, Hash, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/context/LanguageContext";
import { verifyResetCode } from "@/lib/api/auth";

export default function VerifyResetCodePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";
  const { t, language } = useI18n();
  const [isLoading, setIsLoading] = useState(false);

  const verifyCodeSchema = z.object({
    email: z.string().email({ message: t.errors.invalidEmail }),
    code: z.string().regex(/^\d{6}$/, { message: t.auth.codePlaceholder }),
  });

  type VerifyCodeFormValues = z.infer<typeof verifyCodeSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyCodeFormValues>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: {
      email: emailFromQuery,
      code: "",
    },
  });

  const onSubmit = async (data: VerifyCodeFormValues) => {
    setIsLoading(true);
    try {
      await verifyResetCode(data.email, data.code);
      toast.success(t.auth.verifyCodeSuccess);
      router.push(`/${language}/reset-password?email=${encodeURIComponent(data.email)}&code=${data.code}`);
    } catch (error: any) {
      console.error("Verify code failed:", error);
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
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t.auth.verifyCodeTitle}</h1>
          <p className="text-sm text-muted-foreground text-center">{t.auth.verifyCodeSubtitle}</p>
        </div>
        <div className="py-2">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="space-y-1">
              <Label className="block text-xs font-bold text-default-600">
                {t.auth.email} *
              </Label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 text-default-450 pointer-events-none" size={16} />
                <input
                  {...register("email")}
                  type="email"
                  required
                  placeholder="name@example.com"
                  readOnly={!!emailFromQuery}
                  className="w-full pl-10 pr-3 py-2.5 bg-default-100/50 border border-default-200 rounded-2xl text-sm font-medium outline-none focus:border-primary transition-colors text-foreground placeholder:text-default-400 read-only:opacity-70 read-only:cursor-not-allowed"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label className="block text-xs font-bold text-default-600">
                {t.auth.verifyCode} *
              </Label>
              <div className="relative flex items-center">
                <Hash className="absolute left-3 text-default-450 pointer-events-none" size={16} />
                <input
                  {...register("code")}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  placeholder={t.auth.codePlaceholder}
                  className="w-full pl-10 pr-3 py-2.5 bg-default-100/50 border border-default-200 rounded-2xl text-sm font-medium outline-none focus:border-primary transition-colors text-foreground placeholder:text-default-400 tracking-widest text-center"
                />
              </div>
              {errors.code && (
                <p className="text-xs text-rose-500 mt-1">{errors.code.message}</p>
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
              {t.auth.verifyCodeSubmit}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link
              href={`/${language}/forgot-password`}
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
