import { z } from "zod";

export const vehicleCategoryFormSchema = z.object({
  code: z
    .string()
    .min(1, "Mã hạng xe là bắt buộc")
    .max(50),
  minSeat: z.number().int().min(1, "Tối thiểu 1 chỗ"),
  maxSeat: z.number().int().min(1, "Tối thiểu 1 chỗ"),
  minLuggage: z.number().int().min(0).default(0),
  maxLuggage: z.number().int().min(0).default(0),
  unitLuggage: z.string().default("VALI"),
  active: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  thumbnailId: z.number().optional().nullable(),
  translations: z.array(
    z.object({
      locale: z.string(),
      name: z.string().min(1, "Tên hạng xe không được để trống"),
      description: z.string().default(""),
    })
  ).min(1, "Cần ít nhất một ngôn ngữ"),
});

export type VehicleCategoryFormValues = z.infer<typeof vehicleCategoryFormSchema>;

export const vehicleFormSchema = z.object({
  name: z.string().min(1, "Tên xe là bắt buộc"),
  licensePlate: z
    .string()
    .min(1, "Biển số xe là bắt buộc"),
  typeId: z.number().positive("Hạng xe không hợp lệ"),
  status: z.enum(["AVAILABLE", "BUSY", "MAINTENANCE"]).default("AVAILABLE"),
  color: z.string().default(""),
  yearOfManufacture: z.number().int().optional().nullable(),
  seatCapacity: z.number().int().min(1).default(4),
  thumbnailId: z.number().optional().nullable(),
  imageIds: z.array(z.number()).default([]),
  active: z.boolean().default(true),
});

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;
