import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import {
  getAdminDiscounts,
  getActiveDiscounts,
  getMyVouchers,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  PriceDiscountDto,
  PromotionDto,
  PromotionGrantDto,
} from "@/lib/api/discount";
import { DiscountFormValues } from "@/lib/schemas/discount.schema";

export function useAdminDiscounts(page = 0, size = 50, scopeType?: string, scopeRefId?: string) {
  return useQuery({
    queryKey: queryKeys.discounts.list({ page, size, scopeType, scopeRefId }),
    queryFn: async () => {
      const res = await getAdminDiscounts(page, size, scopeType, scopeRefId);
      return res.data;
    },
  });
}

export function useSaveDiscount(onSuccessCallback?: (data: PriceDiscountDto) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id?: number; data: Partial<PriceDiscountDto> | DiscountFormValues }) => {
      if (id) {
        const res = await updateDiscount(id, data);
        return res.data;
      } else {
        const res = await createDiscount(data);
        return res.data;
      }
    },
    onSuccess: (savedData) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.discounts.all });
      if (onSuccessCallback && savedData) {
        onSuccessCallback(savedData);
      }
    },
  });
}

export function useDeleteDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await deleteDiscount(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.discounts.all });
    },
  });
}

export function useActiveDiscounts(scopeType?: string, scopeRefId?: string) {
  return useQuery({
    queryKey: queryKeys.discounts.active({ scopeType, scopeRefId }),
    queryFn: async () => {
      const res = await getActiveDiscounts(scopeType, scopeRefId);
      return res.data || [];
    },
  });
}

export function useMyVouchers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.discounts.myVouchers(),
    queryFn: async () => {
      const res = await getMyVouchers();
      return res.data || [];
    },
    enabled,
  });
}
