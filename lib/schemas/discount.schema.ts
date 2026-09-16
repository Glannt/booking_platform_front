import { z } from "zod";

export const promotionScopeSchema = z.object({
  scopeType: z.string().min(1, "Loại phạm vi là bắt buộc"),
  scopeRefId: z.string().optional().default(""),
});

export const discountFormSchema = z.object({
  code: z
    .string()
    .max(50, "Mã giảm giá tối đa 50 ký tự")
    .optional()
    .default(""),
  name: z.string().min(1, "Tên chương trình là bắt buộc").max(255),
  description: z.string().default(""),
  issuanceType: z.enum(["PUBLIC", "PRIVATE_TARGETED", "AUTO_REWARD"]).default("PUBLIC"),
  discountType: z.enum(["PERCENT", "FIXED_AMOUNT"]).default("PERCENT"),
  discountValue: z.number().min(0.01, "Giá trị giảm giá phải lớn hơn 0"),
  maxDiscountAmount: z.number().min(0).optional(),
  minOrderAmount: z.number().min(0).default(0),
  minDays: z.number().min(0).default(0),
  maxUsageTotal: z.number().min(0).default(0),
  maxUsagePerUser: z.number().min(1, "Lượt dùng tối thiểu 1").default(1),
  validFrom: z.string().default(""),
  validTo: z.string().default(""),
  active: z.boolean().default(true),
  scopes: z.array(promotionScopeSchema).default([{ scopeType: "GLOBAL", scopeRefId: "" }]),
});

export type PromotionScopeFormValue = z.infer<typeof promotionScopeSchema>;
export type DiscountFormValues = z.infer<typeof discountFormSchema>;
