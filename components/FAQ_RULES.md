# FAQ Component Rules

> **Purpose:** Quick reference for implementing FAQ sections using HeroUI Accordion.
> **Last updated:** 2026-07-16

---

## When to Use

- FAQ sections on any page (homepage, service pages, landing pages)
- Collapsible content sections
- Any expandable/collapsible list

## Components

| Component | Path | Use Case |
|---|---|---|
| `FaqSection` | `components/FaqSection.tsx` | Full FAQ section with heading + description + accordion |
| `FaqAccordion` | `components/FaqAccordion.tsx` | Just the accordion (no heading) |

---

## Quick Start

```tsx
import { FaqSection } from "@/components/FaqSection";

const categories = [
  {
    title: "General",
    items: [
      { title: "Question 1?", content: "Answer 1" },
      { title: "Question 2?", content: "Answer 2" },
    ],
  },
];

<FaqSection
  title="Câu hỏi thường gặp"
  description="Mọi thứ bạn cần biết."
  categories={categories}
/>
```

---

## Props

### FaqSection

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | `"Frequently Asked Questions"` | Section heading |
| `description` | `string` | `"Everything you need to know..."` | Section subtext |
| `categories` | `FaqCategory[]` | required | FAQ data |
| `className` | `string` | - | Additional classes |

### FaqAccordion

| Prop | Type | Default | Description |
|---|---|---|---|
| `categories` | `FaqCategory[]` | required | FAQ data |
| `variant` | `"default" \| "surface"` | `"surface"` | Visual variant |
| `allowsMultipleExpanded` | `boolean` | `true` | Allow multiple open |
| `className` | `string` | - | Additional classes |

### Types

```ts
interface FaqItem {
  title: string;
  content: string;
}

interface FaqCategory {
  title: string;
  items: FaqItem[];
}
```

---

## Styling (BEM)

Customize in `globals.css` using `@layer components`:

```css
@layer components {
  .accordion {
    @apply rounded-xl bg-gray-50 dark:bg-slate-900;
  }
  .accordion__trigger {
    @apply font-semibold text-lg;
  }
  .accordion--outline {
    @apply shadow-lg border-2;
  }
  .accordion__body {
    @apply text-sm text-slate-600 dark:text-slate-400 leading-relaxed;
  }
  .accordion__item {
    @apply border-b border-slate-200/60 dark:border-slate-700/60 last:border-0;
  }
}
```

### BEM Classes

| Class | Element |
|---|---|
| `.accordion` | Container |
| `.accordion__item` | Individual item |
| `.accordion__heading` | Heading wrapper |
| `.accordion__trigger` | Clickable trigger |
| `.accordion__indicator` | Expand/collapse icon |
| `.accordion__panel` | Collapsible panel |
| `.accordion__body` | Content body |
| `.accordion--outline` | Outline variant |

---

## Rules

1. **Always use HeroUI Accordion** — never build custom accordion with `useState` + `onClick`
2. **Use `@gravity-ui/icons`** for the ChevronDown indicator
3. **Support dark mode** — use `dark:` variants in custom CSS
4. **Use `variant="surface"`** for most FAQ sections (cleaner look)
5. **Set `allowsMultipleExpanded={true}`** for FAQ sections (users may want to compare answers)

---

## Example: i18n FAQ

```tsx
import { FaqSection } from "@/components/FaqSection";

// In your page component:
const vi = locale === "vi";

const categories = [
  {
    title: vi ? "Chung" : "General",
    items: [
      {
        title: vi ? "Làm sao để đặt hàng?" : "How do I place an order?",
        content: vi
          ? "Duyệt sản phẩm, thêm vào giỏ, thanh toán."
          : "Browse products, add to cart, checkout.",
      },
    ],
  },
];

<FaqSection categories={categories} />
```

---

## Replacing Inline FAQ Accordion

If you see this pattern in any page file:

```tsx
const [activeFaq, setActiveFaq] = useState<number | null>(null);
// ... manual accordion with useState
```

Replace with:

```tsx
import { FaqSection } from "@/components/FaqSection";

<FaqSection categories={categories} />
```

This ensures consistent styling, accessibility (ARIA attributes), and animations.
