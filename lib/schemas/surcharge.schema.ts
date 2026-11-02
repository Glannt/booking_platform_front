import { z } from "zod";

export const surchargeRuleFormSchema = z.object({
  code: z
    .string()
    .min(1, "Mã phụ phí là bắt buộc")
    .max(50, "Mã phụ phí tối đa 50 ký tự"),
  name: z.string().min(1, "Tên phụ phí là bắt buộc").max(150),
  description: z.string().default(""),
  calculationType: z.enum(["FIXED", "PERCENT"]),
  calculationBase: z.enum(["BASE_PRICE", "RUNNING_TOTAL"]).default("BASE_PRICE"),
  value: z.number().min(0.01, "Giá trị phụ phí phải lớn hơn 0"),
  currency: z.string().default("VND"),
  priority: z.number().int().min(0).default(0),
  effectiveFrom: z.string().default(""),
  effectiveTo: z.string().default(""),
  active: z.boolean().default(true),
});

export type SurchargeRuleFormValues = z.infer<typeof surchargeRuleFormSchema>;
