import { z } from "zod";

export const bookingUpdateFormSchema = z.object({
  customerName: z.string().min(1, "Tên khách hàng là bắt buộc"),
  customerPhone: z.string().min(8, "Số điện thoại không hợp lệ"),
  customerEmail: z.string().email("Email không hợp lệ"),
  customerNotes: z.string().optional().default(""),
  status: z.string().min(1, "Trạng thái là bắt buộc"),
  totalPrice: z.number().min(0, "Tổng giá không được âm"),
});

export type BookingUpdateFormValues = z.infer<typeof bookingUpdateFormSchema>;

export const bookingCancelFormSchema = z.object({
  reason: z.string().min(5, "Lý do hủy tối thiểu 5 ký tự"),
});

export type BookingCancelFormValues = z.infer<typeof bookingCancelFormSchema>;
