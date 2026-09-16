# Quy Tắc Kiến Trúc Frontend: React Query, React Hook Form, Zod Schemas & HeroUI Components (MANDATORY)

Tài liệu này là quy tắc bắt buộc (**MANDATORY**) cho tất cả AI Coding Agents khi phát triển và bảo trì frontend trong dự án `booking_travel_next_ui`. Mọi pull request, refactoring và code mới đều phải tuân thủ nghiêm ngặt 100%.

---

## 1. Phân Tách Trách Nhiệm Kiến Trúc (Architecture Separation of Concerns)

```
                            KIẾN TRÚC FRONTEND
                                    │
        ┌───────────────────────────┴───────────────────────────┐
        ▼                                                       ▼
   PUBLIC / CONTENT                                     INTERACTIVE / TRANSACTION
 (Server Components)                                       (Client Components)
        │                                                       │
        ├─ Tour Detail (/tours/[slug])                          ├─ Form State: React Hook Form (RHF)
        ├─ Route Detail (/intercity/[slug])                     ├─ Validation & DTO: Zod Schema
        ├─ Vehicle Detail (/self-drive/[slug])                  ├─ Server State: TanStack React Query
        ├─ Landing / SEO Pages                                  │   ├─ GET List / Search / Filter
        └─ Initial Metadata / Layout                            │   └─ Mutations (Create / Update / Delete)
                                                                └─ Local UI State: useState
                                                                    └─ isOpen (Modal), activeTab, drawer
```

### Bảng Phân Bổ Công Cụ:

| Phân hệ / Nghiệp vụ | Công nghệ chỉ định | Hướng dẫn & Quy định |
|---|---|---|
| **SEO & Trang chi tiết công khai** (`/tours/[slug]`, `/intercity/[slug]`, `/self-drive/[slug]`) | **Next.js Server Component** | Tối ưu SEO, FCP cực nhanh, fetch trực tiếp từ Spring Boot backend, không tốn client bundle React Query |
| **Widget đặt chỗ trên trang chi tiết** (Tour booking box, Intercity booking form) | **Client Component + RHF + Zod + RQ Mutation** | Chứa tương tác người dùng, form validation tức thì, mutate tạo đơn booking |
| **Danh sách & Bộ lọc Admin/Portal** (Tours, Vehicles, Routes, Bookings, Discounts) | **React Query (`useQuery`)** | Search, filter realtime, pagination, tự động refetch khi có mutation, cache hiệu quả |
| **Thao tác Thêm / Sửa / Xóa trong Modal** | **RHF + Zod + React Query (`useMutation`)** | Code gọn, validate chặt chẽ bằng Zod, tự động `invalidateQueries` sau khi lưu thành công |
| **Đăng ký, Đăng nhập, Đổi mật khẩu** | **RHF + Zod + React Query (`useMutation`)** | Validate mật khẩu/email bằng Zod, quản lý trạng thái submit qua `mutation.isPending` |
| **Tương tác UI cục bộ** (Modal mở/đóng, Accordion, Tab active, Menu) | **`useState` thuần** | **TUYỆT ĐỐI KHÔNG** dùng React Query hoặc Global Store cho local UI state |

---

## 2. Quy Tắc HeroUI: Cấm `<span>*</span>` Thủ Công, Bắt Buộc `isRequired` & `<FieldError>`

### 2.1. Cấm Tuyệt Đối (Forbidden Pattern)
```tsx
// ❌ CẤM: Tuyệt đối không gõ thủ công span chứa dấu sao hoặc text có dấu *
<Label className="text-xs font-bold">
  Tên trường <span className="text-rose-500">*</span>
</Label>
<Label className="text-xs font-bold">Email *</Label>

// ❌ CẤM: Tự chế thẻ <p className="text-red-500"> hiển thị lỗi bên dưới input
<input {...register("email")} />
{errors.email && <p className="text-xs text-rose-500">{errors.email.message}</p>}
```

### 2.2. Quy Tắc Chuẩn (Required Pattern)
- Mọi trường bắt buộc **PHẢI** sử dụng thuộc tính `isRequired` trên `<Label isRequired>` hoặc `<TextField isRequired>` / `<Select isRequired>`.
- Hệ thống đã cấu hình CSS rule trong `globals.css` để tự động render dấu `*` màu đỏ (`#f43f5e`) kế bên nhãn.
- Mọi ô input **PHẢI** có `<FieldError>` nằm trong component trường nhập để hiển thị lỗi validation từ Zod/RHF.

```tsx
// ✅ CHUẨN: TextField + Input + FieldError
<TextField isRequired isInvalid={!!errors.code} className="w-full">
  <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">
    {t.discounts.code}
  </Label>
  <Input
    {...register("code")}
    placeholder="SUMMER2026"
    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] font-mono font-bold uppercase text-xs"
  />
  <FieldError className="text-[11px] text-rose-500 font-medium mt-1">
    {errors.code?.message}
  </FieldError>
</TextField>
```

---

## 3. Quy Tắc Zod Schemas & DTOs (Data Transfer Objects)

1. **Vị trí lưu trữ**: Toàn bộ Zod schemas nằm tại `lib/schemas/*.schema.ts`.
2. **Xuất bản kiểu DTO qua `z.infer`**:
   ```ts
   import { z } from "zod";

   export const discountFormSchema = z.object({
     code: z.string().min(2, "Mã giảm giá tối thiểu 2 ký tự").max(50).toUpperCase(),
     name: z.string().min(1, "Tên giảm giá không được để trống"),
     discountType: z.enum(["PERCENT", "FIXED_AMOUNT"]),
     discountValue: z.number().positive("Giá trị giảm giá phải lớn hơn 0"),
     minOrderAmount: z.number().min(0).default(0),
     minDays: z.number().min(0).default(0),
     maxUsage: z.number().min(0).default(0),
     validFrom: z.string().optional(),
     validTo: z.string().optional(),
     scopeType: z.string().default("GLOBAL"),
     scopeRefId: z.string().optional(),
     active: z.boolean().default(true),
   });

   export type DiscountFormValues = z.infer<typeof discountFormSchema>;
   ```
3. **CẤM**: Tuyệt đối không khai báo schema Zod bên trong thân hàm của component React. Schemas phải được định nghĩa ở file riêng biệt để tái sử dụng làm DTO type contract giữa Frontend và Backend.

---

## 4. Quy Tắc React Hook Form (RHF) Với HeroUI v3

### 4.1. Uncontrolled Inputs (Input, Textarea)
Dùng trực tiếp `register` của RHF:
```tsx
<Input {...register("fieldName")} />
```

### 4.2. Controlled Inputs (Select, DatePicker, NumberField, Switch)
Bắt buộc dùng `<Controller>` từ `react-hook-form`:
```tsx
<Controller
  name="discountType"
  control={control}
  render={({ field, fieldState }) => (
    <Select
      isRequired
      isInvalid={fieldState.invalid}
      selectedKey={field.value}
      onSelectionChange={(key) => field.onChange(key)}
      className="w-full"
    >
      <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">
        {t.discounts.discountType}
      </Label>
      <Select.Trigger className="h-10 bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl px-3 w-full">
        <Select.Value className="text-xs font-semibold" />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xl">
        <ListBox>
          <ListBox.Item id="PERCENT" textValue="Phần trăm (%)">Phần trăm (%)</ListBox.Item>
          <ListBox.Item id="FIXED_AMOUNT" textValue="Số tiền cố định">Số tiền cố định</ListBox.Item>
        </ListBox>
      </Select.Popover>
      <FieldError className="text-[11px] text-rose-500 font-medium mt-1">
        {fieldState.error?.message}
      </FieldError>
    </Select>
  )}
/>
```

### 4.3. Đồng bộ Dữ Liệu Khi Mở Modal Chỉnh Sửa
```tsx
useEffect(() => {
  if (isOpen) {
    if (initialData) {
      reset(initialData);
    } else {
      reset(defaultFormValues);
    }
  }
}, [isOpen, initialData, reset]);
```

---

## 5. Quy Tắc TanStack React Query

1. **Query Keys tập trung**: Mọi query key phải lấy từ `lib/react-query/query-keys.ts` (`queryKeys.tours.list(...)`, `queryKeys.discounts.all`, v.v.). Không tự gõ chuỗi queryKey phân mảnh.
2. **Mutations**: Mọi thao tác thêm/sửa/xóa dùng `useMutation`. Khi thành công (`onSuccess`), **bắt buộc** gọi `queryClient.invalidateQueries` với key tương ứng để đồng bộ dữ liệu.
3. **CẤM**: Không dùng React Query cho các tương tác nội bộ của UI như modal mở/đóng, switch tab hay đóng mở dropdown (phải dùng `useState`).
