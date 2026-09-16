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

<Label className="block text-xs font-bold uppercase tracking-wider mb-2">
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
  <Description className="text-[10px]">Optional helper text</Description>
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
  Lưu
</Button>

{/* Accent Yellow */}
<Button
  className="bg-[#FEE500] hover:bg-[#E6CF00] border-none"
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

## 11. Accordion / FAQ

> **QUAN TRỌNG:** Luôn dùng HeroUI `Accordion` component thay vì tự build accordion thủ công với `useState` + `onClick`.

❌ **Không dùng (custom accordion):**
```tsx
const [activeFaq, setActiveFaq] = useState<number | null>(null);

{faqs.map((faq, index) => {
  const isOpen = activeFaq === index;
  return (
    <div key={index}>
      <button onClick={() => setActiveFaq(isOpen ? null : index)}>
        {faq.title}
        <span>{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && <p>{faq.content}</p>}
    </div>
  );
})}
```

✅ **Dùng HeroUI Accordion:**
```tsx
import { Accordion } from "@heroui/react";
import { ChevronDown } from "@gravity-ui/icons";

<Accordion className="w-full" variant="surface" allowsMultipleExpanded>
  {faqs.map((faq, index) => (
    <Accordion.Item key={index}>
      <Accordion.Heading>
        <Accordion.Trigger>
          {faq.title}
          <Accordion.Indicator>
            <ChevronDown />
          </Accordion.Indicator>
        </Accordion.Trigger>
      </Accordion.Heading>
      <Accordion.Panel>
        <Accordion.Body>{faq.content}</Accordion.Body>
      </Accordion.Panel>
    </Accordion.Item>
  ))}
</Accordion>
```

### Sử dụng FaqAccordion component có sẵn

Dùng component `FaqAccordion` hoặc `FaqSection` có sẵn trong `components/`:

```tsx
import { FaqSection } from "@/components/FaqSection";

<FaqSection
  title="Câu hỏi thường gặp"
  description="Mọi thứ bạn cần biết."
  categories={[
    {
      title: "General",
      items: [
        { title: "How do I place an order?", content: "Browse our products..." },
      ],
    },
  ]}
/>
```

### Accordion Props
| Prop | Type | Default | Mô tả |
|---|---|---|---|
| `allowsMultipleExpanded` | `boolean` | `false` | Cho phép nhiều item mở cùng lúc |
| `defaultExpandedKeys` | `Iterable<Key>` | - | Các key mặc định mở |
| `expandedKeys` | `Iterable<Key>` | - | Controlled expanded keys |
| `onExpandedChange` | `(keys: Set<Key>) => void` | - | Handler khi thay đổi |
| `isDisabled` | `boolean` | `false` | Disable toàn bộ accordion |
| `variant` | `"default" \| "surface"` | `"default"` | Variant hiển thị |
| `hideSeparator` | `boolean` | `false` | Ẩn separator giữa các item |
| `className` | `string` | - | Tailwind classes |

### Accordion.Item Props
| Prop | Type | Default | Mô tả |
|---|---|---|---|
| `id` | `Key` | - | Unique identifier |
| `isDisabled` | `boolean` | `false` | Disable item |
| `defaultExpanded` | `boolean` | `false` | Mở mặc định |
| `isExpanded` | `boolean` | - | Controlled state |
| `onExpandedChange` | `(isExpanded: boolean) => void` | - | Handler |

### Accordion.Trigger Props
| Prop | Type | Mô tả |
|---|---|---|
| `className` | `string` | Tailwind classes |
| `children` | `ReactNode \| RenderFunction` | Trigger content |
| `onPress` | `() => void` | Additional press handler |
| `isDisabled` | `boolean` | Disable trigger |

### Accordion.Panel Props
| Prop | Type | Mô tả |
|---|---|---|
| `className` | `string` | Tailwind classes |
| `children` | `ReactNode` | Panel content |

### Accordion.Indicator Props
| Prop | Type | Mô tả |
|---|---|---|
| `className` | `string` | Tailwind classes |
| `children` | `ReactNode` | Custom indicator icon |

### Custom CSS Classes (BEM)

Accordion sử dụng BEM methodology. Có thể custom trong `globals.css`:

```css
@layer components {
  .accordion {
    @apply rounded-xl bg-gray-50;
  }
  .accordion__trigger {
    @apply font-semibold text-lg;
  }
  .accordion--outline {
    @apply shadow-lg border-2;
  }
}
```

### CSS Classes Reference
- `.accordion` — Base accordion container
- `.accordion__body` — Content body container
- `.accordion__heading` — Heading wrapper
- `.accordion__indicator` — Expand/collapse indicator icon
- `.accordion__item` — Individual accordion item
- `.accordion__panel` — Collapsible panel container
- `.accordion__trigger` — Clickable trigger button
- `.accordion--outline` — Outline variant with border and background

### Interactive States
- Hover: `:hover` or `[data-hovered="true"]` on trigger
- Focus: `:focus-visible` or `[data-focus-visible="true"]` on trigger
- Disabled: `:disabled` or `[aria-disabled="true"]` on trigger
- Expanded: `[aria-expanded="true"]` on trigger

---

## 12. Skeleton (Loading placeholder)

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

## 13. Tooltip & Table Action Cell (`Button isIconOnly` + `Tooltip`)

> **Nguyên tắc:** Trên các ô thao tác (`Table.Cell` actions) của bảng, **KHÔNG BAO GIỜ** dùng thẻ `<button>` thuần với thuộc tính `title="..."`. Luôn kết hợp HeroUI `Button` (với `isIconOnly`, `size="sm"`, `aria-label`) và bọc trong HeroUI `Tooltip` (`<Tooltip>`, `<Tooltip.Trigger>`, `<Tooltip.Content>`, `<Tooltip.Arrow />`).

### Ví dụ chuẩn trong Table Action Cell:

```tsx
import { Tooltip, Button } from "@heroui/react";
import { Eye, Edit3, Trash2 } from "lucide-react"; // hoặc import từ "@gravity-ui/icons"

<Table.Cell className="px-6 py-4 text-right">
  <div className="flex items-center justify-end gap-1.5">
    {/* Xem chi tiết */}
    <Tooltip delay={300} closeDelay={100}>
      <Tooltip.Trigger>
        <Button
          isIconOnly
          size="sm"
          variant="tertiary"
          aria-label={t.common.details}
          onPress={() => handleView(item)}
        >
          <Eye size={16} />
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content>
        <Tooltip.Arrow />
        {t.common.details}
      </Tooltip.Content>
    </Tooltip>

    {/* Chỉnh sửa */}
    <Tooltip delay={300} closeDelay={100}>
      <Tooltip.Trigger>
        <Button
          isIconOnly
          size="sm"
          variant="secondary"
          aria-label={t.common.edit}
          onPress={() => handleEdit(item)}
        >
          <Edit3 size={16} />
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content>
        <Tooltip.Arrow />
        {t.common.edit}
      </Tooltip.Content>
    </Tooltip>

    {/* Xóa / Hủy */}
    <Tooltip delay={300} closeDelay={100}>
      <Tooltip.Trigger>
        <Button
          isIconOnly
          size="sm"
          variant="danger"
          aria-label={t.common.clear}
          onPress={() => handleDelete(item.id)}
        >
          <Trash2 size={16} />
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content className="text-rose-600 dark:text-rose-400">
        <Tooltip.Arrow />
        {t.common.clear}
      </Tooltip.Content>
    </Tooltip>
  </div>
</Table.Cell>
```

### Quy ước Button Variant cho Thao tác Bảng:
* **Xem / Chi tiết / Info**: `variant="tertiary"` hoặc `variant="ghost"`
* **Chỉnh sửa / Cài đặt**: `variant="secondary"` hoặc `variant="ghost"`
* **Xóa / Hủy / Vô hiệu hóa**: `variant="danger"` hoặc `variant="danger-soft"` (kèm chữ đỏ ở tooltip content)
* **Thao tác phụ / Toggle**: `variant="ghost"`

### HeroUI Tooltip API Reference

#### `<Tooltip>` Props
| Prop | Type | Default | Mô tả |
|---|---|---|---|
| `children` | `ReactNode` | - | Trigger element và Content |
| `delay` | `number` | `700` | Thời gian trễ trước khi hiện (khuyên dùng `200`-`300`ms cho table actions) |
| `closeDelay` | `number` | `0` | Thời gian trễ trước khi ẩn (khuyên dùng `100`ms) |
| `trigger` | `"hover" \| "focus"` | `"hover"` | Cách kích hoạt tooltip |
| `isDisabled` | `boolean` | `false` | Vô hiệu hóa tooltip |
| `shouldSkipAnimation` | `boolean` | `false` | Bỏ qua animation khi rê chuột nhanh giữa các tooltip |

#### `<Tooltip.Content>` Props
| Prop | Type | Default | Mô tả |
|---|---|---|---|
| `children` | `ReactNode` | - | Nội dung hiển thị trong tooltip (bao gồm `<Tooltip.Arrow />`) |
| `showArrow` | `boolean` | `false` | Có hiển thị mũi tên hay không |
| `offset` | `number` | `3` (7 nếu có arrow) | Khoảng cách so với trigger button |
| `placement` | `"top" \| "bottom" \| "left" \| "right"` | `"top"` | Vị trí tooltip hiển thị |
| `className` | `string` | - | Tùy chỉnh class Tailwind |

#### `<Tooltip.Trigger>` & `<Tooltip.Arrow>` Props
* `<Tooltip.Trigger>`: Bọc nút kích hoạt (`Button`).
* `<Tooltip.Arrow>`: Mũi tên chỉ hướng của tooltip.

### Custom CSS Classes (BEM) & Styling Reference

Tooltip tuân thủ BEM methodology. Được định nghĩa đồng bộ trong `globals.css` tại `@layer components`:

```css
@layer components {
  .tooltip {
    @apply bg-white dark:bg-[var(--bg-card)] text-slate-800 dark:text-slate-100 text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl z-[999];
  }
  .tooltip__trigger {
    @apply inline-flex;
  }
  .tooltip [data-slot="overlay-arrow"] {
    @apply fill-white dark:fill-[var(--bg-card)] stroke-slate-200 dark:stroke-slate-800;
  }
}
```

* `.tooltip`: Container cơ bản của tooltip kèm animations
* `.tooltip__trigger`: Phần tử trigger
* `[data-entering]`: Trạng thái khi tooltip xuất hiện
* `[data-exiting]`: Trạng thái khi tooltip biến mất
* `[data-placement="*"]`: Trạng thái theo hướng hiển thị (`top`, `bottom`, `left`, `right`)

---

## 14. Quy chuẩn Màu sắc & Bố cục Action Buttons trong Modal & Toolbar

### A. Cấu trúc Khung `<ModalFooter>` Chuẩn
Mọi modal đều phải có `<ModalFooter>` đặt cố định ở đáy modal (`shrink-0`), có viền mỏng phía trên và màu nền đồng bộ:
```tsx
<ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
  {/* Các nút hành động */}
</ModalFooter>
```
* **CẤM DÙNG**: `dark:bg-black/40` hoặc `dark:bg-slate-*` (vi phạm Dark Mode token). Luôn dùng `dark:bg-[var(--bg-surface)]` hoặc `dark:bg-[var(--bg-card)]`.

### B. Nút Hủy / Đóng (Cancel / Close Button)
* **Vị trí**: Luôn nằm ở phía bên trái cụm hành động trong footer.
* **Variant**: `variant="outline"` hoặc `variant="secondary"`.
* **Light Mode**: Nền trắng `bg-white`, viền `border-slate-200`, text `text-slate-700`, hover `hover:bg-slate-100`.
* **Dark Mode**: Nền `dark:bg-[var(--bg-card)]`, viền `dark:border-slate-800`, text `dark:text-slate-300`, hover `dark:hover:bg-[var(--bg-elevated)]`.
```tsx
<Button
  variant="outline"
  onClick={onClose}
  isDisabled={loading}
  className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
>
  {isEditMode ? "Hủy" : "Đóng"}
</Button>
```

### C. Nút Chỉnh sửa (Edit Button trong Detail Modal)
* **Vị trí**: Trong Modal xem chi tiết, nằm cạnh nút "Đóng" để chuyển sang chế độ chỉnh sửa.
* **Icon**: `<Edit3 size={15} className="mr-1.5" />`
* **Màu sắc**: Tone hổ phách (amber) sang trọng:
  - Light: `bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 border border-amber-300/60`
  - Dark: `dark:bg-amber-500/15 dark:hover:bg-amber-500/25 dark:text-amber-400 dark:border-amber-700/50`
```tsx
<Button
  variant="secondary"
  onClick={() => setIsEditMode(true)}
  className="rounded-xl font-bold text-xs h-10 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/50 shadow-xs cursor-pointer transition-colors"
>
  <Edit3 size={15} className="mr-1.5" />
  Chỉnh sửa
</Button>
```

### D. Nút Lưu / Tạo mới / Xác nhận (Primary Action Button)
* **Vị trí**: Nằm ngoài cùng bên phải của `<ModalFooter>`.
* **Màu sắc & Contrast**:
  - Nền: `bg-accent hover:bg-accent-hover`
  - Chữ: **LUÔN DÙNG** `text-accent-foreground` (chữ sẫm màu ở Light mode, chữ sáng trắng ở Dark mode, đảm bảo chuẩn tương phản đọc WCAG).
  - **CẤM DÙNG**: Mã hex hardcoded `#C9A227` hay `bg-blue-600`.
```tsx
<Button
  type="submit"
  isDisabled={loading}
  className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
>
  {loading ? (
    <RefreshCw size={15} className="animate-spin mr-1.5" />
  ) : (
    <Save size={15} className="mr-1.5" />
  )}
  {isEdit ? "Lưu thay đổi" : "Tạo mới"}
</Button>
```

*(Đối với modal xác nhận xóa vĩnh viễn: Dùng `bg-rose-600 hover:bg-rose-700 text-white` kèm icon `<Trash2 size={15} className="mr-1.5" />`)*.

### E. Nút Thêm trên Toolbar (Toolbar Add Button)
* **Vị trí**: Nằm bên phải thanh công cụ (Toolbar) hàng đầu các trang `/portal/*`.
* **Màu sắc & Icon**: Nền `bg-accent hover:bg-accent-hover text-accent-foreground`, icon `<Plus size={16} />`.
* **Quy chuẩn Text**: Tiền tố "Thêm" + [Tên thực thể] ("Thêm Tour", "Thêm Xe", "Thêm Tuyến đường", "Thêm Dịch vụ", "Thêm User"...).
```tsx
<Button
  onClick={handleOpenCreate}
  className="rounded-xl font-bold text-xs h-10 px-4 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none flex items-center gap-1.5 transition-colors"
>
  <Plus size={16} />
  <span>Thêm Tour</span>
</Button>
```

---

## Khi nào được dùng HTML thuần?

| HTML Tag | Khi nào OK |
|---|---|
| `<div>`, `<span>`, `<p>`, `<h1>`-`<h6>` | Layout wrappers, text display — luôn OK |
| `<form>` | Form wrapper — luôn OK |
| `<input type="text/email/tel">` | ❌ **Không dùng** — luôn thay bằng `<Input>` hoặc `<TextField>` + `<Input>` từ HeroUI |
| `<textarea>` | HeroUI không có textarea riêng — OK dùng HTML |
| `<button>` | Tab switchers, close modal icons, inline toggle đơn giản — OK khi Button component quá nặng. ❌ **CẤM DÙNG** trong `Table.Cell` action buttons (phải dùng `Button isIconOnly` + `Tooltip`). |
| `<select>` | ❌ **Không dùng** — luôn thay bằng ComboBox hoặc Autocomplete |
| `<input type="number">` | ❌ **Không dùng** — luôn thay bằng NumberField |
| `<label>` | ❌ **Không dùng** — luôn thay bằng `<Label>` từ HeroUI |
