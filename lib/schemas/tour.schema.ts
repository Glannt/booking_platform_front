import { z } from "zod";

export const tourPolicyFormSchema = z.object({
  code: z
    .string()
    .min(1, "Mã chính sách là bắt buộc")
    .max(50)
    .transform((v) => v.trim().toUpperCase()),
  icon: z.string().optional().default(""),
  sortOrder: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
  translations: z.array(
    z.object({
      locale: z.string(),
      name: z.string().min(1, "Tên chính sách không được để trống"),
      description: z.string().optional().default(""),
    })
  ).min(1, "Ít nhất phải có một bản dịch ngôn ngữ"),
});

export type TourPolicyFormValues = z.infer<typeof tourPolicyFormSchema>;

export const tourBookingFormSchema = z.object({
  fullName: z.string().min(1, "Họ và tên là bắt buộc").max(100),
  phone: z
    .string()
    .min(8, "Số điện thoại không hợp lệ")
    .max(20, "Số điện thoại tối đa 20 ký tự")
    .regex(/^[0-9+ ]+$/, "Số điện thoại chỉ được chứa số và dấu +"),
  email: z.string().email("Email không đúng định dạng"),
  zaloId: z.string().optional().default(""),
  kakaoTalkId: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  adultCount: z.number().int().min(1, "Tối thiểu 1 người lớn").default(2),
  childCount: z.number().int().min(0).default(0),
  infantCount: z.number().int().min(0).default(0),
  departureDate: z.string().min(1, "Ngày khởi hành là bắt buộc"),
  departureTime: z.string().min(1, "Giờ khởi hành là bắt buộc"),
  meetingPoint: z.string().min(1, "Điểm đón/gặp mặt là bắt buộc"),
});

export type TourBookingFormValues = z.infer<typeof tourBookingFormSchema>;
