import { z } from "zod";

export const intercityRouteFormSchema = z.object({
  originName: z.string().min(1, "Điểm khởi hành là bắt buộc"),
  destinationName: z.string().min(1, "Điểm đến là bắt buộc"),
  distanceKm: z.number().min(0).default(0),
  durationHours: z.number().min(0).default(0),
  active: z.boolean().default(true),
  translations: z.array(
    z.object({
      locale: z.string(),
      name: z.string().min(1, "Tên tuyến đường không được để trống"),
      description: z.string().default(""),
    })
  ).min(1, "Cần ít nhất một ngôn ngữ"),
});

export type IntercityRouteFormValues = z.infer<typeof intercityRouteFormSchema>;

export const intercityPriceFormSchema = z.object({
  vehicleCategoryId: z.number().positive("Hạng xe không hợp lệ"),
  fixedPriceOneWay: z.number().min(0).default(0),
  fixedPriceRoundTrip: z.number().min(0).default(0),
  perKmAmount: z.number().min(0).default(0),
  roundTripPerKmAmount: z.number().min(0).default(0),
  currency: z.string().default("VND"),
  active: z.boolean().default(true),
});

export type IntercityPriceFormValues = z.infer<typeof intercityPriceFormSchema>;
