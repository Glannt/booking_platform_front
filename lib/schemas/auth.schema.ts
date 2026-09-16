import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().email("Email không hợp lệ").min(1, "Email là bắt buộc"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const registerFormSchema = z.object({
  fullname: z.string().min(1, "Họ và tên là bắt buộc").max(100),
  email: z.string().email("Email không hợp lệ").min(1, "Email là bắt buộc"),
  phone: z
    .string()
    .min(8, "Số điện thoại không hợp lệ")
    .max(20)
    .regex(/^[0-9+ ]+$/, "Số điện thoại chỉ được chứa số"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  confirmPassword: z.string().min(6, "Vui lòng xác nhận mật khẩu"),
  role: z.string().default("CUSTOMER"),
  kakaoTalkId: z.string().optional().default(""),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const changePasswordFormSchema = z.object({
  oldPassword: z.string().min(1, "Mật khẩu hiện tại là bắt buộc"),
  newPassword: z.string().min(6, "Mật khẩu mới tối thiểu 6 ký tự"),
  confirmPassword: z.string().min(6, "Vui lòng xác nhận mật khẩu mới"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

export const forgotPasswordFormSchema = z.object({
  email: z.string().email("Email không hợp lệ").min(1, "Email là bắt buộc"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;
