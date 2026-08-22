"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button, Label, toast, Select, ListBox } from "@heroui/react";
import { Mail, Lock, User, Phone, Eye, EyeOff, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/context/LanguageContext";
import { apiFetch } from "@/lib/api/client";

export default function RegisterPage() {
  const router = useRouter();
  const { t, language } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const registerSchema = z.object({
    email: z.string().email({ message: t.errors.invalidEmail }),
    password: z.string().regex(/^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/, { message: t.errors.passwordRequirements }),
    fullname: z.string().min(2, { message: t.errors.fullnameRequired }),
    phone: z.string().min(10, { message: t.errors.phoneInvalid }),
    role: z.enum(["CUSTOMER", "STAFF", "ADMIN"]),
    kakaoTalkId: z.string().optional(),
  });

  type RegisterFormValues = z.infer<typeof registerSchema>;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      fullname: "",
      phone: "",
      role: "CUSTOMER",
      kakaoTalkId: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      await apiFetch("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });

      toast.success(t.auth.registerSuccess || "Registered successfully! Please log in.");
      router.push(`/${language}/login`);
    } catch (error: any) {
      console.error("Registration failed:", error);
      toast.danger(error.message || t.errors.registrationFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { key: "CUSTOMER", label: t.auth.customerRole },
    { key: "STAFF", label: t.auth.staffRole },
    { key: "ADMIN", label: t.auth.adminRole },
  ];

  return (
    <div className="relative flex min-h-[90vh] items-center justify-center overflow-hidden px-4 py-12">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30 dark:opacity-20 pointer-events-none">
        <div className="h-[500px] w-[500px] rounded-full bg-primary filter blur-[90px]" />
        <div className="h-[400px] w-[400px] rounded-full bg-secondary filter blur-[70px] -translate-x-20 translate-y-20" />
      </div>

      <div className="relative z-10 w-full max-w-lg border border-default-200/50 bg-background/60 backdrop-blur-md shadow-2xl rounded-2xl p-6">
        <div className="flex flex-col gap-1 items-center pb-4 pt-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
            <UserPlus size={24} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t.auth.register}</h1>
          <p className="text-sm text-muted-foreground">{t.home.subtitle}</p>
        </div>
        <div className="py-2">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="space-y-1">
              <Label className="block text-xs font-bold text-default-600">
                {t.auth.fullName} *
              </Label>
              <div className="relative flex items-center">
                <User className="absolute left-3 text-default-450 pointer-events-none" size={16} />
                <input
                  {...register("fullname")}
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full pl-10 pr-3 py-2.5 bg-default-100/50 border border-default-200 rounded-2xl text-sm font-medium outline-none focus:border-primary transition-colors text-foreground placeholder:text-default-400"
                />
              </div>
              {errors.fullname && (
                <p className="text-xs text-rose-500 mt-1">{errors.fullname.message}</p>
              )}
            </div>

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
                {t.auth.phone} *
              </Label>
              <div className="relative flex items-center">
                <Phone className="absolute left-3 text-default-450 pointer-events-none" size={16} />
                <input
                  {...register("phone")}
                  type="tel"
                  required
                  placeholder="0123456789"
                  className="w-full pl-10 pr-3 py-2.5 bg-default-100/50 border border-default-200 rounded-2xl text-sm font-medium outline-none focus:border-primary transition-colors text-foreground placeholder:text-default-400"
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-rose-500 mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="block text-xs font-bold text-default-600">
                  {t.auth.role} *
                </Label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select
                      className="w-full"
                      selectedKey={field.value}
                      onSelectionChange={(key) => field.onChange(key)}
                    >
                      <Select.Trigger className="w-full px-3 py-2.5 bg-default-100/50 border border-default-200 rounded-2xl text-sm font-semibold outline-none focus:border-primary transition-colors text-foreground h-[42px] flex items-center justify-between cursor-pointer">
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                        <ListBox>
                          {roleOptions.map((role) => (
                            <ListBox.Item key={role.key} id={role.key} textValue={role.label}>
                              {role.label}
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  )}
                />
                {errors.role && (
                  <p className="text-xs text-rose-500 mt-1">{errors.role.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="block text-xs font-bold text-default-600">
                  {t.auth.kakaoTalkId}
                </Label>
                <input
                  {...register("kakaoTalkId")}
                  type="text"
                  placeholder="Kakao ID"
                  className="w-full px-3 py-2.5 bg-default-100/50 border border-default-200 rounded-2xl text-sm font-medium outline-none focus:border-primary transition-colors text-foreground placeholder:text-default-400"
                />
                {errors.kakaoTalkId && (
                  <p className="text-xs text-rose-500 mt-1">{errors.kakaoTalkId.message}</p>
                )}
              </div>
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
              {t.auth.submitRegister}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link
              href={`/${language}/login`}
              className="text-primary hover:underline font-medium transition-colors"
            >
              {t.auth.hasAccount}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
