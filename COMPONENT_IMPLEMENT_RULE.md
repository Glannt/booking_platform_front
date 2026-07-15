# Component Implementation Rules

> **Nguyên tắc:** Luôn ưu tiên sử dụng HeroUI components thay vì HTML tags thuần (`<input>`, `<select>`, `<label>`, `<button>`...).
> Chỉ dùng HTML thuần khi HeroUI không có component tương đương hoặc cần layout wrapper đơn giản (`<div>`, `<span>`, `<form>`).

---

## 1. Label

❌ **Không dùng:**
```tsx
<label className="...">Tour Category</label>
```

✅ **Dùng:**
```tsx
import { Label } from "@heroui/react";

<Label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
  Tour Category
</Label>
```

---

## 2. NumberField (thay `<input type="number">`)

❌ **Không dùng:**
```tsx
<input type="number" min={0} value={value} onChange={(e) => setValue(Number(e.target.value))} />
```

✅ **Dùng:**
```tsx
import { NumberField, Label } from "@heroui/react";

<NumberField minValue={0} value={value} onChange={setValue}>
  <Label>Duration (Days)</Label>
  <NumberField.Group>
    <NumberField.DecrementButton />
    <NumberField.Input />
    <NumberField.IncrementButton />
  </NumberField.Group>
</NumberField>
```

### Sử dụng formatOptions (Định dạng hiển thị)
Có thể sử dụng thuộc tính `formatOptions` (`Intl.NumberFormatOptions`) để hiển thị tiền tệ, phần trăm, số thập phân hoặc đơn vị đo lường:

```tsx
import { Description, Label, NumberField } from "@heroui/react";

{/* Định dạng tiền tệ VND (Mặc định cho các giá trị tiền trong dự án) */}
<NumberField
  value={price}
  minValue={0}
  onChange={setPrice}
  formatOptions={{ style: "currency", currency: "VND" }}
  fullWidth
>
  <Label>Giá vé áp dụng</Label>
  <NumberField.Group>
    <NumberField.DecrementButton />
    <NumberField.Input />
    <NumberField.IncrementButton />
  </NumberField.Group>
</NumberField>

{/* Định dạng tiền tệ USD */}
<NumberField
  defaultValue={99.99}
  minValue={0}
  formatOptions={{ style: "currency", currency: "USD" }}
>
  <Label>Currency (USD)</Label>
  <NumberField.Group>
    <NumberField.DecrementButton />
    <NumberField.Input className="w-[120px]" />
    <NumberField.IncrementButton />
  </NumberField.Group>
</NumberField>

{/* Định dạng phần trăm */}
<NumberField
  defaultValue={0.5}
  formatOptions={{ style: "percent" }}
  maxValue={1}
  minValue={0}
  step={0.01}
>
  <Label>Percentage</Label>
  <NumberField.Group>
    <NumberField.DecrementButton />
    <NumberField.Input className="w-[120px]" />
    <NumberField.IncrementButton />
  </NumberField.Group>
</NumberField>

{/* Định dạng số thập phân */}
<NumberField
  defaultValue={1234.56}
  minValue={0}
  formatOptions={{
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "decimal",
  }}
>
  <Label>Decimal (2 decimal places)</Label>
  <NumberField.Group>
    <NumberField.DecrementButton />
    <NumberField.Input className="w-[120px]" />
    <NumberField.IncrementButton />
  </NumberField.Group>
</NumberField>
```

### Chi tiết NumberField Props

#### Base Props
* `children`: `React.ReactNode` - Các component con (`Label`, `Group`, `Input`, v.v.)
* `className`: `string` - CSS classes cho component
* `fullWidth`: `boolean` (mặc định: `false`) - Có chiếm toàn bộ chiều rộng container hay không
* `variant`: `"primary" | "secondary"` (mặc định: `"primary"`) - Variant hiển thị (primary có shadow, secondary không shadow)

#### Value & Formatting Props
* `value`: `number` - Giá trị hiện tại (controlled)
* `defaultValue`: `number` - Giá trị mặc định (uncontrolled)
* `onChange`: `(value: number | undefined) => void` - Callback khi thay đổi giá trị
* `formatOptions`: `Intl.NumberFormatOptions` - Tùy chọn format số
* `locale`: `string` - Locale cho format số

#### Validation & Range Props
* `isRequired`: `boolean` (mặc định: `false`) - Bắt buộc nhập
* `isInvalid`: `boolean` - Trạng thái không hợp lệ
* `minValue`: `number` - Giá trị nhỏ nhất
* `maxValue`: `number` - Giá trị lớn nhất
* `step`: `number` (mặc định: `1`) - Bước nhảy tăng/giảm

#### Composition Components
* `NumberField.Group`: Container chứa input và các nút tăng/giảm.
* `NumberField.Input`: Ô input số thực tế (có variant `"primary" | "secondary"`).
* `NumberField.IncrementButton`: Nút tăng giá trị (mặc định hiển thị dấu cộng).
* `NumberField.DecrementButton`: Nút giảm giá trị (mặc định hiển thị dấu trừ).
* `Label`: Nhãn mô tả trường nhập liệu.
* `Description`: Dòng text mô tả hoặc hướng dẫn phụ.
* `FieldError`: Thông báo lỗi khi validation thất bại.

---

## 2b. Input / TextField (thay `<input type="text/email/tel">`)

> **QUAN TRỌNG:** HeroUI v3 `Input` là component cơ bản, chỉ chấp nhận standard HTML `<input>` attributes. **KHÔNG** dùng `onValueChange`, `startContent`, `classNames.inputWrapper` (đây là API HeroUI v2 — không còn tồn tại).

❌ **Không dùng (v2 API):**
```tsx
<Input
  type="text"
  isRequired
  value={name}
  onValueChange={setName}           // ❌ không có trong v3
  startContent={<Icon />}           // ❌ không có trong v3
  classNames={{ inputWrapper: "..." }} // ❌ không có trong v3
/>
```

✅ **Dùng — Input cơ bản (không cần Label/Validation):**
```tsx
import { Input } from "@heroui/react";

<Input
  type="text"
  value={name}
  onChange={(e) => setName(e.target.value)}
  placeholder="Enter name..."
  className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800"
/>
```

✅ **Dùng — TextField + Input (có Label, Validation, Description):**
```tsx
import { TextField, Label, Input, FieldError, Description } from "@heroui/react";

<TextField isRequired name="fullName" className="w-full">
  <Label className="text-xs font-bold uppercase tracking-wider">
    Full Name
  </Label>
  <Input
    type="text"
    value={fullName}
    onChange={(e) => setFullName(e.target.value)}
    placeholder="Enter full name..."
    className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800"
  />
  <Description className="text-[10px] text-slate-400">Optional helper text</Description>
</TextField>

<TextField isRequired isInvalid={!!error} name="email" type="email" className="w-full">
  <Label className="text-xs font-bold uppercase tracking-wider">Email</Label>
  <Input placeholder="user@example.com" className="w-full p-2.5 rounded-xl text-xs" />
  <FieldError>{error}</FieldError>
</TextField>
```

### Input Props (HeroUI v3)
| Prop | Type | Default | Mô tả |
|---|---|---|---|
| `className` | `string` | - | Tailwind classes |
| `type` | `string` | `"text"` | Input type (text, email, password, number...) |
| `value` | `string` | - | Controlled value |
| `defaultValue` | `string` | - | Uncontrolled initial value |
| `onChange` | `(e: ChangeEvent) => void` | - | Change handler (**KHÔNG** dùng `onValueChange`) |
| `placeholder` | `string` | - | Placeholder |
| `disabled` | `boolean` | `false` | Disable input |
| `readOnly` | `boolean` | `false` | Read-only |
| `required` | `boolean` | `false` | Required for form |
| `name` | `string` | - | Form field name |
| `variant` | `"primary" \| "secondary"` | `"primary"` | Visual variant |
| `fullWidth` | `boolean` | `false` | Chiếm toàn bộ chiều rộng |

### TextField Props
Dùng `TextField` wrapper khi cần Label + validation:
| Prop | Type | Mô tả |
|---|---|---|
| `isRequired` | `boolean` | Bắt buộc nhập |
| `isInvalid` | `boolean` | Trạng thái lỗi |
| `name` | `string` | Field name |

---

---

## 3. ComboBox (thay `<select>` khi có tìm kiếm / async loading)

❌ **Không dùng:**
```tsx
<select value={selected} onChange={(e) => setSelected(e.target.value)}>
  <option value="">-- Select --</option>
  {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
</select>
```

✅ **Dùng:**
```tsx
import { ComboBox, Input, Label, ListBox, EmptyState, Collection } from "@heroui/react";

<ComboBox
  selectedKey={String(selectedId)}
  onSelectionChange={(key) => setSelectedId(Number(key))}
>
  <Label>Tour Category</Label>
  <ComboBox.InputGroup>
    <Input placeholder="Search..." />
    <ComboBox.Trigger />
  </ComboBox.InputGroup>
  <ComboBox.Popover>
    <ListBox renderEmptyState={() => <EmptyState />}>
      <Collection items={items}>
        {(item) => (
          <ListBox.Item key={item.id} id={String(item.id)} textValue={item.name}>
            {item.name}
            <ListBox.ItemIndicator />
          </ListBox.Item>
        )}
      </Collection>
    </ListBox>
  </ComboBox.Popover>
</ComboBox>
```

---

## 4. Autocomplete (thay `<select>` khi cần filter danh sách tĩnh lớn)

Dùng khi danh sách lớn (icons, countries...) và cần filter client-side.

```tsx
import { Autocomplete, SearchField, ListBox, EmptyState, useFilter } from "@heroui/react";

<Autocomplete>
  <Autocomplete.Trigger>
    <Autocomplete.Value />
    <Autocomplete.ClearButton />
    <Autocomplete.Indicator />
  </Autocomplete.Trigger>
  <Autocomplete.Popover>
    <Autocomplete.Filter filter={contains}>
      <SearchField>...</SearchField>
      <ListBox renderEmptyState={() => <EmptyState />}>
        {items.map(item => (
          <ListBox.Item key={item.id} id={item.id} textValue={item.name}>
            {item.name}
            <ListBox.ItemIndicator />
          </ListBox.Item>
        ))}
      </ListBox>
    </Autocomplete.Filter>
  </Autocomplete.Popover>
</Autocomplete>
```

---

## 5. Checkbox

```tsx
import { Checkbox, Label } from "@heroui/react";

<div className="flex items-center gap-3">
  <Checkbox
    id="my-checkbox"
    isSelected={checked}
    onChange={(val: boolean) => setChecked(val)}
    render={(props) => <div {...props} />}
  >
    <Checkbox.Content>
      <Checkbox.Control>
        <Checkbox.Indicator />
      </Checkbox.Control>
    </Checkbox.Content>
  </Checkbox>
  <Label htmlFor="my-checkbox" className="text-sm font-bold cursor-pointer select-none">
    Active
  </Label>
</div>
```

---

## 6. Button

❌ **Không dùng:**
```tsx
<button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Save</button>
```

✅ **Dùng:**
```tsx
import { Button } from "@heroui/react";

<Button type="submit" variant="primary" isDisabled={loading}>
  <Save size={14} />
  Save
</Button>
```

> **Ngoại lệ:** Các nút không phải action chính (close icon, tab switcher, mobile menu toggle) có thể dùng `<button>` thuần với styling thủ công nếu HeroUI Button không phù hợp về layout.

### Bảng màu Button

| Vai trò | Hex | Dùng khi |
|---|---|---|
| **Primary (Gold)** | `#C9A227` | CTA chính: Lưu, Xác nhận, Đặt ngay, Submit |
| **Accent (Yellow)** | `#FEE500` | Hành động phụ nổi bật: Thêm mới, Highlight, Badge |

```tsx
{/* Primary Gold */}
<Button
  type="submit"
  className="bg-[#C9A227] hover:bg-[#B8911F] text-white border-none"
>
  <Save size={14} />
  Lưu thay đổi
</Button>

{/* Accent Yellow */}
<Button
  className="bg-[#FEE500] hover:bg-[#E6CF00] text-slate-900 border-none"
>
  <Plus size={14} />
  Thêm mới
</Button>
```

> **Quy tắc:** Không dùng `bg-blue-500`, `bg-green-500` hoặc các màu Tailwind mặc định cho action buttons. Luôn dùng bảng màu brand ở trên.

---

## 7. ColorPicker

```tsx
import { ColorPicker, ColorSwatch, ColorArea, ColorSlider, ColorField, parseColor } from "@heroui/react";

<ColorPicker value={safeParseColor(hex)} onChange={(c) => setHex(c.toString("hex"))}>
  <ColorPicker.Trigger>
    <ColorSwatch className="size-6 rounded-lg" />
  </ColorPicker.Trigger>
  <ColorPicker.Popover>
    <ColorPicker.Content>
      <ColorArea />
      <ColorSlider channel="hue" />
      <ColorField />
    </ColorPicker.Content>
  </ColorPicker.Popover>
</ColorPicker>
```

---

## 8. DatePicker / TimePicker

```tsx
import { DatePicker, DateField, Label } from "@heroui/react";

<DatePicker value={dateValue} onChange={setDateValue}>
  <Label>Departure Date</Label>
  <DateField.Group fullWidth>
    <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
  </DateField.Group>
</DatePicker>
```

Với TimePicker, dùng component tự build `<TimePicker>` có sẵn trong project.

---

## 9. Modal

```tsx
import {
  Modal, ModalBackdrop, ModalContainer, ModalDialog,
  ModalHeader, ModalBody, ModalFooter
} from "@heroui/react";

<Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
  <ModalBackdrop>
    <ModalContainer size="lg">
      <ModalDialog>
        <ModalHeader>...</ModalHeader>
        <ModalBody>...</ModalBody>
        <ModalFooter>...</ModalFooter>
      </ModalDialog>
    </ModalContainer>
  </ModalBackdrop>
</Modal>
```

---

## 10. Separator

```tsx
import { Separator } from "@heroui/react";

<Separator className="bg-slate-100 dark:bg-slate-800" />
```

---

## 11. Skeleton (Loading placeholder)

> Dùng `Skeleton` để hiển thị placeholder khi data đang load. **Luôn dùng** trên các route frontend (trừ admin).

```tsx
import { Skeleton } from "@heroui/react";

// Cơ bản
<Skeleton className="h-20 w-32 rounded-full" />

// Shimmer (default)
<Skeleton animationType="shimmer" className="h-20 rounded-lg" />

// Pulse
<Skeleton animationType="pulse" className="h-3 w-3/5 rounded-lg" />

// Không animation
<Skeleton animationType="none" className="h-3 w-4/5 rounded-lg" />
```

### Skeleton Props
| Prop | Type | Default | Mô tả |
|---|---|---|---|
| `animationType` | `"shimmer" \| "pulse" \| "none"` | `"shimmer"` | Loại animation |
| `className` | `string` | - | Tailwind classes (chiều cao, rộng, border-radius) |

### Loading skeleton pattern cho danh sách
```tsx
function ListSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5 rounded-lg" />
            <Skeleton className="h-3 w-2/5 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
```

---

## Khi nào được dùng HTML thuần?

| HTML Tag | Khi nào OK |
|---|---|
| `<div>`, `<span>`, `<p>`, `<h1>`-`<h6>` | Layout wrappers, text display — luôn OK |
| `<form>` | Form wrapper — luôn OK |
| `<input type="text/email/tel">` | ❌ **Không dùng** — luôn thay bằng `<Input>` hoặc `<TextField>` + `<Input>` từ HeroUI |
| `<textarea>` | HeroUI không có textarea riêng — OK dùng HTML |
| `<button>` | Tab switchers, close icons, inline toggle — OK khi Button component quá nặng |
| `<select>` | ❌ **Không dùng** — luôn thay bằng ComboBox hoặc Autocomplete |
| `<input type="number">` | ❌ **Không dùng** — luôn thay bằng NumberField |
| `<label>` | ❌ **Không dùng** — luôn thay bằng `<Label>` từ HeroUI |
