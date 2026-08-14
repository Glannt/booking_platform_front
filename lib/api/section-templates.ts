/**
 * Typed Section Content Schemas and Pure Key Factory Registry
 * Supports: /, /tours, /self-drive, /rent-car, /airport-transfer
 * and all section types (HERO_BANNER, FEATURES, SLIDE_CARD, SLIDE_REVIEW, INSPIRATION, BOOKING_PROCESS, PROMO, CTA, BANNER)
 */

// ── 1. Basic Multilingual Types ─────────────────────────────────
export type MultilingualText2 = { vi: string; en: string };
export type MultilingualText4 = { vi: string; en: string; ko: string; ru: string };

export const createEmptyText2 = (): MultilingualText2 => ({ vi: "", en: "" });
export const createEmptyText4 = (): MultilingualText4 => ({ vi: "", en: "", ko: "", ru: "" });

// ── 2. HERO_BANNER Schema ────────────────────────────────────────
export interface HeroBadgeSchema {
  text: MultilingualText2;
  textColor: string;
  bgColor: string;
  iconUrl: string;
}

export interface HeroBannerContentSchema {
  badges: HeroBadgeSchema[];
}

export const createEmptyHeroBadge = (): HeroBadgeSchema => ({
  text: createEmptyText2(),
  textColor: "",
  bgColor: "",
  iconUrl: "",
});

// ── 3. FEATURES Schema ───────────────────────────────────────────
export interface FeatureStyleSchema {
  iconBg: string;
  iconBgDark: string;
  iconColor: string;
  iconColorDark: string;
  titleColor: string;
  titleColorDark: string;
  descColor: string;
  descColorDark: string;
}

export interface FeatureItemSchema {
  icon: string;
  styles: FeatureStyleSchema;
  title: MultilingualText4;
  description: MultilingualText4;
}

export interface FeaturesContentSchema {
  features: FeatureItemSchema[];
}

export const createEmptyFeatureStyles = (): FeatureStyleSchema => ({
  iconBg: "rgba(59, 130, 246, 0.1)",
  iconBgDark: "rgba(30, 58, 138, 0.3)",
  iconColor: "rgba(37, 99, 235, 1)",
  iconColorDark: "rgba(96, 165, 250, 1)",
  titleColor: "rgba(30, 41, 59, 1)",
  titleColorDark: "rgba(226, 232, 240, 1)",
  descColor: "rgba(100, 116, 139, 1)",
  descColorDark: "rgba(148, 163, 184, 1)",
});

export const createEmptyFeatureItem = (): FeatureItemSchema => ({
  icon: "ShieldCheck",
  styles: createEmptyFeatureStyles(),
  title: createEmptyText4(),
  description: createEmptyText4(),
});

// ── 4. SLIDE_CARD Schema (Home, Tours, Rent-Car, Airport) ────────
export interface SlideCardItemSchema {
  title: MultilingualText2;
  description: MultilingualText2;
  badge: MultilingualText2;
  price: MultilingualText2;
  imageUrl: string;
  linkUrl: string;
}

export interface SlideCardContentSchema {
  badgeTitle: MultilingualText4;
  cards: SlideCardItemSchema[];
}

export const createEmptySlideCardItem = (): SlideCardItemSchema => ({
  title: createEmptyText2(),
  description: createEmptyText2(),
  badge: createEmptyText2(),
  price: createEmptyText2(),
  imageUrl: "",
  linkUrl: "",
});

export const createEmptySlideCardSimple = () => ({
  title: createEmptyText2(),
  imageUrl: "",
  linkUrl: "",
});

// ── 5. SLIDE_REVIEW Schema ───────────────────────────────────────
export interface SlideReviewItemSchema {
  author: string;
  avatar: string;
  rating: number;
  date: string;
  route: string;
  service: MultilingualText2;
  content: MultilingualText2;
}

export interface SlideReviewContentSchema {
  ratingSummary: string;
  reviews: SlideReviewItemSchema[];
}

export const createEmptySlideReviewItem = (): SlideReviewItemSchema => ({
  author: "",
  avatar: "",
  rating: 5,
  date: "",
  route: "",
  service: createEmptyText2(),
  content: createEmptyText2(),
});

// ── 6. INSPIRATION Schema ────────────────────────────────────────
export interface InspirationItemSchema {
  title: MultilingualText2;
  subtitle: MultilingualText2;
  imageUrl: string;
  linkUrl: string;
}

export interface InspirationContentSchema {
  items: InspirationItemSchema[];
  showInstagram: boolean;
  instagramHandle: string;
}

export const createEmptyInspirationItem = (): InspirationItemSchema => ({
  title: createEmptyText2(),
  subtitle: createEmptyText2(),
  imageUrl: "",
  linkUrl: "",
});

// ── 7. BOOKING_PROCESS Schema ────────────────────────────────────
export interface BookingStepItemSchema {
  stepNumber: number;
  icon: string;
  title: MultilingualText2;
  description: MultilingualText2;
}

export interface BookingProcessContentSchema {
  steps: BookingStepItemSchema[];
}

export const createEmptyBookingStepItem = (): BookingStepItemSchema => ({
  stepNumber: 1,
  icon: "CheckCircle",
  title: createEmptyText2(),
  description: createEmptyText2(),
});

// ── 8. PROMO Schema ──────────────────────────────────────────────
export interface PromoContentSchema {
  badge: MultilingualText2;
  discountPercent: number;
  promoCode: string;
  expiryDate: string;
  termsUrl: string;
}

export const createEmptyPromoContent = (): PromoContentSchema => ({
  badge: createEmptyText2(),
  discountPercent: 0,
  promoCode: "",
  expiryDate: "",
  termsUrl: "",
});

// ── 9. CTA Schema ────────────────────────────────────────────────
export interface CTAContentSchema {
  highlightText: MultilingualText2;
  phone: string;
  email: string;
  zaloUrl: string;
}

export const createEmptyCTAContent = (): CTAContentSchema => ({
  highlightText: createEmptyText2(),
  phone: "",
  email: "",
  zaloUrl: "",
});

// ── 10. BANNER Schema ────────────────────────────────────────────
export interface BannerContentSchema {
  bannerType: string;
  actionUrl: string;
  caption: MultilingualText2;
}

export const createEmptyBannerContent = (): BannerContentSchema => ({
  bannerType: "FULL_WIDTH",
  actionUrl: "",
  caption: createEmptyText2(),
});

// ── 11. Schema Registry Mapping ──────────────────────────────────
export interface TemplatePreset {
  label: string;
  description?: string;
  factory: () => any;
}

export const ITEM_SCHEMA_FACTORIES: Record<string, TemplatePreset[]> = {
  cards: [
    {
      label: "Thẻ Card chuẩn (title/desc/badge/price/img/link)",
      description: "Tạo cấu trúc thẻ với các trường rỗng",
      factory: createEmptySlideCardItem,
    },
    {
      label: "Thẻ Card rút gọn (title/img/link)",
      description: "Tạo cấu trúc thẻ ngắn gọn",
      factory: createEmptySlideCardSimple,
    },
  ],
  features: [
    {
      label: "Mục Tính năng chuẩn (icon/styles/title/desc)",
      description: "Tạo cấu trúc tính năng với 4 ngôn ngữ",
      factory: createEmptyFeatureItem,
    },
  ],
  reviews: [
    {
      label: "Mục Đánh giá chuẩn (author/rating/service/content)",
      description: "Tạo cấu trúc đánh giá khách hàng",
      factory: createEmptySlideReviewItem,
    },
  ],
  items: [
    {
      label: "Mục Địa điểm / Cảm hứng (title/subtitle/img/link)",
      description: "Tạo cấu trúc địa điểm gợi ý",
      factory: createEmptyInspirationItem,
    },
  ],
  steps: [
    {
      label: "Bước Quy trình đặt dịch vụ (step/icon/title/desc)",
      description: "Tạo cấu trúc bước quy trình",
      factory: createEmptyBookingStepItem,
    },
  ],
  badges: [
    {
      label: "Huy hiệu Banner (text/textColor/bgColor/icon)",
      description: "Tạo cấu trúc huy hiệu nổi bật",
      factory: createEmptyHeroBadge,
    },
  ],
};

export const ROOT_SCHEMA_FACTORIES: Record<string, () => any> = {
  badgeTitle: createEmptyText4,
  cards: () => [createEmptySlideCardItem()],
  features: () => [createEmptyFeatureItem()],
  ratingSummary: () => "",
  reviews: () => [createEmptySlideReviewItem()],
  items: () => [createEmptyInspirationItem()],
  steps: () => [createEmptyBookingStepItem()],
  showInstagram: () => false,
  instagramHandle: () => "",
  badges: () => [createEmptyHeroBadge()],
  highlightText: createEmptyText2,
  phone: () => "",
  email: () => "",
  zaloUrl: () => "",
  badge: createEmptyText2,
  discountPercent: () => 0,
  promoCode: () => "",
  expiryDate: () => "",
  termsUrl: () => "",
  bannerType: () => "FULL_WIDTH",
  actionUrl: () => "",
  caption: createEmptyText2,
};

// ── 12. Page & Section Type Hints ─────────────────────────────────
export interface SectionTypeHint {
  keys: string[];
  description: string;
}

export const SECTION_HINTS: Record<string, SectionTypeHint> = {
  HERO_BANNER: {
    keys: ["badges"],
    description: "Cấu trúc Hero Banner: mảng badges (huy hiệu nổi bật)",
  },
  FEATURES: {
    keys: ["features"],
    description: "Cấu trúc Features: mảng features (icon, màu sắc, tiêu đề, mô tả 4 ngôn ngữ)",
  },
  SLIDE_CARD: {
    keys: ["badgeTitle", "cards"],
    description: "Cấu trúc Carousel Thẻ: badgeTitle (tiêu đề huy hiệu) và mảng cards (thẻ dịch vụ)",
  },
  SLIDE_REVIEW: {
    keys: ["ratingSummary", "reviews"],
    description: "Cấu trúc Đánh giá: ratingSummary (chuỗi tổng hợp) và mảng reviews (danh sách đánh giá)",
  },
  INSPIRATION: {
    keys: ["items", "showInstagram", "instagramHandle"],
    description: "Cấu trúc Cảm hứng du lịch: mảng items, showInstagram (bật/tắt) và instagramHandle",
  },
  BOOKING_PROCESS: {
    keys: ["steps"],
    description: "Cấu trúc Quy trình: mảng steps (các bước đặt chuyến đi)",
  },
  PROMO: {
    keys: ["badge", "discountPercent", "promoCode", "expiryDate", "termsUrl"],
    description: "Cấu trúc Khuyến mãi: mã giảm giá, phần trăm, hạn dùng và điều khoản",
  },
  CTA: {
    keys: ["highlightText", "phone", "email", "zaloUrl"],
    description: "Cấu trúc Call to Action: hotline, email, link Zalo và văn bản nổi bật",
  },
  BANNER: {
    keys: ["bannerType", "actionUrl", "caption"],
    description: "Cấu trúc Banner phụ: loại banner, đường dẫn hành động và chú thích",
  },
};

/**
 * Suggestions per Page Path
 */
export const PAGE_SECTION_RECOMMENDATIONS: Record<string, string[]> = {
  "/": ["HERO_BANNER", "FEATURES", "SLIDE_CARD", "SLIDE_REVIEW", "INSPIRATION", "CTA"],
  "/tours": ["HERO_BANNER", "FEATURES", "SLIDE_CARD", "BOOKING_PROCESS", "SLIDE_REVIEW", "CTA"],
  "/self-drive": ["HERO_BANNER", "FEATURES", "SLIDE_CARD", "BOOKING_PROCESS", "SLIDE_REVIEW", "CTA"],
  "/rent-car": ["HERO_BANNER", "FEATURES", "SLIDE_CARD", "BOOKING_PROCESS", "SLIDE_REVIEW", "CTA"],
  "/airport-transfer": ["HERO_BANNER", "FEATURES", "SLIDE_CARD", "BOOKING_PROCESS", "SLIDE_REVIEW", "CTA"],
};
