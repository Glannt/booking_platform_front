import { z } from "zod";

export const promotionScopeSchema = z.object({
  scopeType: z.string().min(1, "Loại phạm vi là bắt buộc"),
  scopeRefId: z.string().optional().default(""),
});

export const discountFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .max(50, "Mã giảm giá tối đa 50 ký tự")
      .default(""),
    name: z
      .string()
      .trim()
      .min(1, "Tên chương trình là bắt buộc")
      .max(255, "Tên chương trình tối đa 255 ký tự"),
    description: z.string().trim().default(""),
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
  })
  .superRefine((data, ctx) => {
    if (data.issuanceType === "PUBLIC") {
      if (!data.code || data.code.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Mã khuyến mãi là bắt buộc đối với chương trình công khai",
          path: ["code"],
        });
      } else if (data.code.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Mã khuyến mãi phải từ 2 ký tự trở lên",
          path: ["code"],
        });
      }
    } else if (data.code && data.code.trim().length > 0 && data.code.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mã khuyến mãi phải từ 2 ký tự trở lên",
        path: ["code"],
      });
    }
  });

export type PromotionScopeFormValue = z.infer<typeof promotionScopeSchema>;
export type DiscountFormValues = z.infer<typeof discountFormSchema>;
