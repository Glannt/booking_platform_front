"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button, Label, toast } from "@heroui/react";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/context/LanguageContext";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/authStore";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { t, language } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await apiFetch<any>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (response && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        setAuth(user, accessToken, refreshToken);
        toast.success(t.auth.loginSuccess || "Logged in successfully!");
        
        // Redirect based on role
        if (user.role === "ADMIN") {
          router.push(`/${language}/admin/services`);
        } else {
          router.push(`/${language}`);
        }
      } else {
        throw new Error("Invalid response payload");
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      toast.danger(error.message || "Login failed. Please check your credentials.");
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
            <LogIn size={24} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t.auth.login}</h1>
          <p className="text-sm text-muted-foreground">{t.home.subtitle}</p>
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
                  className="w-full pl-10 pr-3 py-2.5 bg-default-100/50 border border-default-200 rounded-2xl text-sm font-medium outline-none focus:border-primary transition-colors text-foreground placeholder:text-default-400"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label className="block text-xs font-bold text-default-600">
                {t.auth.password} *
              </Label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 text-default-450 pointer-events-none" size={16} />
                <input
                  {...register("password")}
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
              {errors.password && (
                <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>
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
              {t.auth.submitLogin}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link
              href={`/${language}/register`}
              className="text-primary hover:underline font-medium transition-colors"
            >
              {t.auth.noAccount}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
