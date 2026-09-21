/**
 * Section Content Data Templates & Schema Hints
 * Provides TypeScript type definitions, empty schema factories, and property hints
 * for the dynamic Section Key-Value Editor.
 */

// ── Common Sub-schemas ──────────────────────────────────────────
export interface MultilingualText4 {
  vi: string;
  en: string;
  ko: string;
  ru: string;
}

export interface MultilingualText2 {
  vi: string;
  en: string;
}

export interface DestinationItem {
  id: string | number;
  name: string;
  activityCountText?: string;
  imageUrl: string;
  href: string;
  active?: boolean;
}

export const DEFAULT_TEMPLATE_DESTINATIONS: DestinationItem[] = [
  {
    id: "nha-trang",
    name: "Nha Trang",
    activityCountText: "35 tour & xe dịch vụ",
    imageUrl: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=600&q=80",
    href: "/tours",
    active: true,
  },
  {
    id: "da-lat",
    name: "Đà Lạt",
    activityCountText: "18 tuyến xe & tour",
    imageUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80",
    href: "/intercity?route=nha-trang-da-lat",
    active: true,
  },
  {
    id: "cam-ranh",
    name: "Cam Ranh",
    activityCountText: "Đưa đón sân bay 24/7",
    imageUrl: "https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=600&q=80",
    href: "/airport-transfer",
    active: true,
  },
  {
    id: "phan-thiet",
    name: "Phan Thiết - Mũi Né",
    activityCountText: "14 tour & tuyến xe",
    imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    href: "/intercity?route=nha-trang-phan-thiet",
    active: true,
  },
  {
    id: "quy-nhon",
    name: "Quy Nhơn",
    activityCountText: "12 chuyến xe & tour",
    imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80",
    href: "/intercity?route=nha-trang-quy-nhon",
    active: true,
  },
  {
    id: "dak-lak",
    name: "Đắk Lắk - Buôn Ma Thuột",
    activityCountText: "8 tour sinh thái",
    imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80",
    href: "/intercity?route=nha-trang-buon-ma-thuot",
    active: true,
  },
];

export const createEmptyText4 = (): MultilingualText4 => ({
  vi: "",
  en: "",
  ko: "",
  ru: "",
});

export const createEmptyText2 = (): MultilingualText2 => ({
  vi: "",
  en: "",
});

// ── 1. HERO_BANNER Schema ────────────────────────────────────────
export interface HeroBadgeSchema {
  text: MultilingualText4;
  textColor: string;
  bgColor: string;
  icon: string;
}

export interface HeroBannerContentSchema {
  badges: HeroBadgeSchema[];
}

export const createEmptyHeroBadge = (): HeroBadgeSchema => ({
  text: createEmptyText4(),
  textColor: "#ffffff",
  bgColor: "#000000",
  icon: "Star",
});

// ── 2. FEATURES Schema ───────────────────────────────────────────
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

// ── 3. SLIDE_CARD Schema (Home, Tours, Rent-Car, Airport) ────────
export interface SlideCardItemSchema {
  title: MultilingualText4;
  description: MultilingualText4;
  badge: MultilingualText4;
  price: MultilingualText4;
  imageUrl: string;
  linkUrl: string;
}

export interface SlideCardContentSchema {
  badgeTitle: MultilingualText4;
  cards: SlideCardItemSchema[];
}

export const createEmptySlideCardItem = (): SlideCardItemSchema => ({
  title: createEmptyText4(),
  description: createEmptyText4(),
  badge: createEmptyText4(),
  price: createEmptyText4(),
  imageUrl: "",
  linkUrl: "",
});

export const createEmptySlideCardSimple = () => ({
  title: createEmptyText4(),
  imageUrl: "",
  linkUrl: "",
});

// ── 4. SLIDE_REVIEW Schema ───────────────────────────────────────
export interface SlideReviewItemSchema {
  title: MultilingualText4;
  description: MultilingualText4;
  rating: number;
  author: string;
  avatarBg: string;
  avatarText: string;
  route: string;
}

export interface SlideReviewContentSchema {
  ratingSummary: string;
  reviews: SlideReviewItemSchema[];
}

export const createEmptySlideReviewItem = (): SlideReviewItemSchema => ({
  title: createEmptyText4(),
  description: createEmptyText4(),
  rating: 5,
  author: "",
  avatarBg: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400",
  avatarText: "",
  route: "",
});

// ── 5. INSPIRATION Schema ────────────────────────────────────────
export interface InspirationItemSchema {
  title: MultilingualText4;
  subtitle: MultilingualText4;
  imageUrl: string;
  linkUrl: string;
}

export interface InspirationContentSchema {
  items: InspirationItemSchema[];
  showInstagram: boolean;
  instagramHandle: string;
}

export const createEmptyInspirationItem = (): InspirationItemSchema => ({
  title: createEmptyText4(),
  subtitle: createEmptyText4(),
  imageUrl: "",
  linkUrl: "",
});

// ── 6. BOOKING_PROCESS Schema ────────────────────────────────────
export interface BookingStepSchema {
  step: number;
  icon: string;
  title: MultilingualText4;
  description: MultilingualText4;
}

export interface BookingProcessContentSchema {
  steps: BookingStepSchema[];
}

export const createEmptyBookingStepItem = (): BookingStepSchema => ({
  step: 1,
  icon: "Search",
  title: createEmptyText4(),
  description: createEmptyText4(),
});

// ── 7. PROMO Schema ──────────────────────────────────────────────
export interface PromoContentSchema {
  badge: MultilingualText4;
  discountPercent: number;
  promoCode: string;
  expiryDate: string;
  termsUrl: string;
}

export const createEmptyPromoContent = (): PromoContentSchema => ({
  badge: createEmptyText4(),
  discountPercent: 0,
  promoCode: "",
  expiryDate: "",
  termsUrl: "",
});

// ── 8. CTA Schema ────────────────────────────────────────────────
export interface CTAContentSchema {
  highlightText: MultilingualText4;
  phone: string;
  email: string;
  zaloUrl: string;
}

export const createEmptyCTAContent = (): CTAContentSchema => ({
  highlightText: createEmptyText4(),
  phone: "",
  email: "",
  zaloUrl: "",
});

// ── 9. BANNER Schema ────────────────────────────────────────────
export interface BannerContentSchema {
  bannerType: string;
  actionUrl: string;
  caption: MultilingualText4;
}

export const createEmptyBannerContent = (): BannerContentSchema => ({
  bannerType: "FULL_WIDTH",
  actionUrl: "",
  caption: createEmptyText4(),
});

// ── 10. FAQ Schema ───────────────────────────────────────────────
export interface FaqItemSchema {
  title: MultilingualText4;
  content: MultilingualText4;
}

export interface FaqCategorySchema {
  title: MultilingualText4;
  items: FaqItemSchema[];
}

export interface FaqContentSchema {
  categories: FaqCategorySchema[];
}

export const createEmptyFaqItem = (): FaqItemSchema => ({
  title: createEmptyText4(),
  content: createEmptyText4(),
});

export const createEmptyFaqCategory = (): FaqCategorySchema => ({
  title: createEmptyText4(),
  items: [createEmptyFaqItem()],
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
      label: "Mục Đánh giá chuẩn (title/description/rating/author/avatarBg/avatarText/route)",
      description: "Tạo cấu trúc đánh giá 4 ngôn ngữ (title, description, rating, author, avatarBg, avatarText, route)",
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
  categories: [
    {
      label: "Danh mục Câu hỏi FAQ (title/items 4 ngôn ngữ)",
      description: "Tạo danh mục nhóm các câu hỏi thường gặp",
      factory: createEmptyFaqCategory,
    },
  ],
  faqs: [
    {
      label: "Câu hỏi & Trả lời FAQ (title/content 4 ngôn ngữ)",
      description: "Tạo 1 câu hỏi và câu trả lời 4 ngôn ngữ",
      factory: createEmptyFaqItem,
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
  categories: () => [createEmptyFaqCategory()],
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
    description: "Cấu trúc Cảm hứng: mảng items, instagram handle",
  },
  SYSTEM_CATALOG: {
    keys: ["systemSource", "itemLimit", "viewAllLink"],
    description: "Cấu trúc Dữ liệu Hệ thống: nguồn dữ liệu (tours, xe tự lái, liên tỉnh, sân bay, điểm đến)",
  },
};

// ── 12. SYSTEM_CATALOG Schema (Dynamic data from system) ──────────
export type SystemSourceType = "tours" | "self-drive" | "intercity" | "airport-transfer" | "destinations";

export interface SystemCatalogContentSchema {
  systemSource: SystemSourceType;
  itemLimit: number;
  viewAllLink: string;
  badgeTitle?: MultilingualText4;
}

export const createEmptySystemCatalog = (source: SystemSourceType = "tours"): SystemCatalogContentSchema => ({
  systemSource: source,
  itemLimit: 8,
  viewAllLink:
    source === "tours"
      ? "/tours"
      : source === "self-drive"
      ? "/self-drive"
      : source === "intercity"
      ? "/intercity"
      : source === "airport-transfer"
      ? "/airport-transfer"
      : "/tours",
});

export const SECTION_PROPERTY_HINTS: Record<string, { keys: string[]; description: string }> = {
  HERO_BANNER: {
    keys: ["badges"],
    description: "Cấu trúc Hero Banner: mảng badges",
  },
  FEATURES: {
    keys: ["features"],
    description: "Cấu trúc Tính năng: mảng features",
  },
  SLIDE_CARD: {
    keys: ["badgeTitle", "cards"],
    description: "Cấu trúc Carousel Thẻ: badgeTitle và mảng cards",
  },
  SLIDE_REVIEW: {
    keys: ["ratingSummary", "reviews"],
    description: "Cấu trúc Carousel Đánh giá: ratingSummary và mảng reviews",
  },
  INSPIRATION: {
    keys: ["items", "showInstagram", "instagramHandle"],
    description: "Cấu trúc Cảm hứng du lịch: mảng items, showInstagram (bật/tắt) và instagramHandle",
  },
  BOOKING_PROCESS: {
    keys: ["steps"],
    description: "Cấu trúc Quy trình: mảng steps (các bước đặt chuyến đi)",
  },
  FAQ: {
    keys: ["categories"],
    description: "Cấu trúc Câu hỏi thường gặp: mảng categories gồm các danh mục và câu hỏi 4 ngôn ngữ",
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
  COMPANY_LOCATION: {
    keys: ["address", "workingHours", "hotline", "hub", "mapQuery", "directionsUrl"],
    description: "Cấu trúc Vị trí công ty: địa chỉ, giờ làm việc, hotline, hub trung chuyển, bản đồ Google Maps",
  },
  PARTNER_COOPERATION: {
    keys: ["badge", "partners", "benefits", "contactLink"],
    description: "Cấu trúc Hợp tác đối tác: badge, danh sách nhóm đối tác, cam kết quyền lợi và link liên hệ",
  },
  SYSTEM_CATALOG: {
    keys: ["systemSource", "itemLimit", "viewAllLink", "destinations"],
    description: "Cấu trúc Lấy từ hệ thống: nguồn dữ liệu (tours, self-drive, intercity, airport-transfer, destinations), giới hạn số lượng, link xem thêm và danh sách điểm đến",
  },
};

/**
 * Suggestions per Page Path
 */
export const PAGE_SECTION_RECOMMENDATIONS: Record<string, string[]> = {
  "/": [
    "HERO_BANNER",
    "SYSTEM_CATALOG",
    "FEATURES",
    "SLIDE_CARD",
    "COMPANY_LOCATION",
    "PARTNER_COOPERATION",
    "SLIDE_REVIEW",
    "INSPIRATION",
    "FAQ",
    "CTA",
  ],
  "/tours": ["HERO_BANNER", "SYSTEM_CATALOG", "FEATURES", "SLIDE_CARD", "BOOKING_PROCESS", "SLIDE_REVIEW", "FAQ", "CTA"],
  "/self-drive": ["HERO_BANNER", "SYSTEM_CATALOG", "FEATURES", "SLIDE_CARD", "BOOKING_PROCESS", "SLIDE_REVIEW", "FAQ", "CTA"],
  "/intercity": ["HERO_BANNER", "SYSTEM_CATALOG", "FEATURES", "SLIDE_CARD", "BOOKING_PROCESS", "SLIDE_REVIEW", "FAQ", "CTA"],
  "/intercity/routes": ["HERO_BANNER"],
  "/airport-transfer": ["HERO_BANNER", "SYSTEM_CATALOG", "FEATURES", "SLIDE_CARD", "BOOKING_PROCESS", "SLIDE_REVIEW", "FAQ", "CTA"],
};

/**
 * Bộ Sections mặc định cho Trang chủ (dùng khi Init Section)
 */
export const DEFAULT_HOME_SECTIONS = [
  {
    sectionName: "Hero Banner Trang Chủ",
    sectionType: "HERO_BANNER",
    pagePath: "/",
    orderIndex: 1,
    active: true,
    imageUrls: [],
    contentData: JSON.stringify({ badges: [] }),
    translations: [
      { locale: "vi", title: "Đến nơi. Khám phá. Trải nghiệm.", subtitle: "Dịch vụ vận chuyển thiết kế riêng cho mỗi hành trình.", description: "Dịch vụ vận chuyển thiết kế riêng cho mỗi hành trình." },
      { locale: "en", title: "Arrive. Discover. Experience.", subtitle: "Tailored transport services designed for every journey.", description: "Tailored transport services designed for every journey." },
      { locale: "ko", title: "도착. 탐험. 체험.", subtitle: "모든 여정에 맞춘 프리미엄 여행 운송 서비스.", description: "모든 여정에 맞춘 프리미엄 여행 운송 서비스." },
      { locale: "ru", title: "Прибытие. Открытия. Впечатления.", subtitle: "Индивидуальные транспортные услуги для любого путешествия.", description: "Индивидуальные транспортные услуги для любого путешествия." },
    ],
  },
  {
    sectionName: "Điểm Đến Nổi Bật",
    sectionType: "SYSTEM_CATALOG",
    pagePath: "/",
    orderIndex: 2,
    active: true,
    imageUrls: [],
    contentData: JSON.stringify({
      systemSource: "destinations",
      itemLimit: 6,
      viewAllLink: "/tours",
      destinations: DEFAULT_TEMPLATE_DESTINATIONS,
    }),
    translations: [
      { locale: "vi", title: "Bạn muốn đi đâu chơi?", subtitle: "Khám phá các điểm đến du lịch tuyệt vời gần Nha Trang và Nam Trung Bộ" },
      { locale: "en", title: "Where do you want to go?", subtitle: "Explore top exciting travel destinations around Nha Trang" },
      { locale: "ko", title: "어디로 여행을 떠나시겠습니까?", subtitle: "나트랑 주변의 멋진 여행 목적지를 탐험해 보세요" },
      { locale: "ru", title: "Куда вы хотите поехать?", subtitle: "Исследуйте лучшие направления вокруг Нячанга" },
    ],
  },
  {
    sectionName: "Tour Du Lịch Nổi Bật",
    sectionType: "SYSTEM_CATALOG",
    pagePath: "/",
    orderIndex: 3,
    active: true,
    imageUrls: [],
    contentData: JSON.stringify({
      systemSource: "tours",
      itemLimit: 8,
      viewAllLink: "/tours",
    }),
    translations: [
      { locale: "vi", title: "Các hoạt động nổi bật", subtitle: "Trải nghiệm tour du lịch và hoạt động giải trí không thể bỏ lỡ tại Nha Trang" },
      { locale: "en", title: "Featured Activities", subtitle: "Must-try guided sightseeing tours and island experiences in Nha Trang" },
      { locale: "ko", title: "주목할 만한 액티비티", subtitle: "나트랑에서 놓칠 수 없는 최고의 관광 투어 및 해양 액티비티" },
      { locale: "ru", title: "Популярные экскурсии", subtitle: "Незабываемые туры и развлечения в Нячанге" },
    ],
  },
  {
    sectionName: "Thuê Xe Tự Lái Nha Trang",
    sectionType: "SYSTEM_CATALOG",
    pagePath: "/",
    orderIndex: 4,
    active: true,
    imageUrls: [],
    contentData: JSON.stringify({
      systemSource: "self-drive",
      itemLimit: 4,
      viewAllLink: "/self-drive",
    }),
    translations: [
      { locale: "vi", title: "Thuê xe tự lái Nha Trang", subtitle: "Đa dạng dòng xe 4-7 chỗ đời mới, bảo hiểm toàn diện, giao xe tận nơi" },
      { locale: "en", title: "Self-Drive Car Rental Nha Trang", subtitle: "Modern 4-7 seater fleet, comprehensive insurance, doorstep delivery" },
      { locale: "ko", title: "나트랑 자차 렌터카", subtitle: "최신 4~7인승 차량, 종합 보험 포함, 원하는 위치 무료 배차" },
      { locale: "ru", title: "Аренда авто без водителя в Нячанге", subtitle: "Современный автопарк 4-7 мест, страховка, доставка к отелю" },
    ],
  },
  {
    sectionName: "Tuyến Xe Liên Tỉnh & Xe Ghép",
    sectionType: "SYSTEM_CATALOG",
    pagePath: "/",
    orderIndex: 5,
    active: true,
    imageUrls: [],
    contentData: JSON.stringify({
      systemSource: "intercity",
      itemLimit: 4,
      viewAllLink: "/intercity",
    }),
    translations: [
      { locale: "vi", title: "Tuyến xe liên tỉnh & Xe ghép", subtitle: "Di chuyển êm ái, đón tận nơi giữa Nha Trang và các tỉnh thành (Đà Lạt, Cam Ranh, Phan Thiết...)" },
      { locale: "en", title: "Intercity Private & Shared Transfers", subtitle: "Door-to-door comfort between Nha Trang and other cities (Da Lat, Cam Ranh, Mui Ne...)" },
      { locale: "ko", title: "도시 간 프라이빗 및 셔틀 차량", subtitle: "나트랑과 주요 도시(달랏, 깜란, 무이네) 간 편리한 도어투도어 이동" },
      { locale: "ru", title: "Междугородние трансферы и шаттлы", subtitle: "Комфортные поездки от двери до двери между Нячангом и другими городами" },
    ],
  },
  {
    sectionName: "Đưa Đón Sân Bay Cam Ranh ⇌ Nha Trang",
    sectionType: "SYSTEM_CATALOG",
    pagePath: "/",
    orderIndex: 6,
    active: true,
    imageUrls: [],
    contentData: JSON.stringify({
      systemSource: "airport-transfer",
      itemLimit: 4,
      viewAllLink: "/airport-transfer",
    }),
    translations: [
      { locale: "vi", title: "Đưa đón sân bay Cam Ranh ⇌ Nha Trang", subtitle: "Giá trọn gói cố định, miễn phí chờ chuyến bay delay, đón sảnh đúng giờ 24/7" },
      { locale: "en", title: "Cam Ranh Airport Transfers ⇌ Nha Trang", subtitle: "Fixed all-inclusive rates, free waiting for flight delays, 24/7 terminal pickup" },
      { locale: "ko", title: "깜란 공항 픽업 및 샌딩 ⇌ 나트랑", subtitle: "정찰제 올인클루시브 요금, 항공편 지연 무료 대기, 24/7 정시 픽업" },
      { locale: "ru", title: "Трансфер из аэропорта Камрань ⇌ Нячанг", subtitle: "Фиксированные цены, бесплатное ожидание рейса, круглосуточная встреча" },
    ],
  },
  {
    sectionName: "Tính Năng Nổi Bật",
    sectionType: "FEATURES",
    pagePath: "/",
    orderIndex: 7,
    active: true,
    imageUrls: [],
    contentData: JSON.stringify({
      features: [
        {
          icon: "ShieldCheck",
          title: { vi: "Thanh toán An toàn", en: "Secure Payment", ko: "안전한 결제", ru: "Безопасная оплата" },
          description: { vi: "Thanh toán bảo mật, xác nhận chuyến đi ngay lập tức.", en: "Encrypted payment, instant booking confirmation.", ko: "암호화 결제 및 즉시 예약 확정.", ru: "Защищенная оплата, мгновенное подтверждение." },
        },
        {
          icon: "UserCheck",
          title: { vi: "Tài xế Chuyên nghiệp", en: "Professional Drivers", ko: "전문 운전기사", ru: "Профессиональные водители" },
          description: { vi: "Đội ngũ lái xe giàu kinh nghiệm, lịch sự và chu đáo.", en: "Experienced, polite, and helpful drivers.", ko: "숙련되고 친절한 현지 기사.", ru: "Опытные и вежливые водители." },
        },
        {
          icon: "Car",
          title: { vi: "Xe Đời mới hiện đại", en: "Modern Fleet", ko: "최신형 차량", ru: "Новый автопарк" },
          description: { vi: "Đa dạng xe từ 4-45 chỗ, sạch sẽ và tiện nghi.", en: "Clean, comfortable 4 to 45 seater vehicles.", ko: "깨끗하고 쾌적한 4~45인승 전 차종 구비.", ru: "Чистые и удобные автомобили 4-45 мест." },
        },
        {
          icon: "Headset",
          title: { vi: "Hỗ trợ 24/7", en: "24/7 Support", ko: "24/7 고객 지원", ru: "Поддержка 24/7" },
          description: { vi: "Luôn sẵn sàng hỗ trợ bạn trên mọi hành trình.", en: "Always ready to assist you around the clock.", ko: "언제나 신속하게 응대하는 고객 지원.", ru: "Круглосуточная помощь на всех маршрутах." },
        },
      ],
    }),
    translations: [
      { locale: "vi", title: "Tại sao chọn Minh Khoa Travel?", subtitle: "Cam kết chất lượng dịch vụ vận tải và du lịch hàng đầu tại Khánh Hòa" },
      { locale: "en", title: "Why Choose Minh Khoa Travel?", subtitle: "Top-tier quality commitment for travel and transfers in Khanh Hoa" },
      { locale: "ko", title: "왜 민콰 트래블을 선택해야 할까요?", subtitle: "칸호아 최고의 여행 및 운송 서비스 품질 보장" },
      { locale: "ru", title: "Почему выбирают Minh Khoa Travel?", subtitle: "Гарантия высочайшего качества туристических перевозок" },
    ],
  },
  {
    sectionName: "Vị Trí Công Ty & Văn Phòng",
    sectionType: "COMPANY_LOCATION",
    pagePath: "/",
    orderIndex: 8,
    active: true,
    imageUrls: [],
    contentData: JSON.stringify({}),
    translations: [
      { locale: "vi", title: "Vị trí công ty & Văn phòng đón tiếp", subtitle: "Văn phòng trung tâm Nha Trang và mạng lưới xe sẵn sàng phục vụ 24/7." },
      { locale: "en", title: "Company Location & Office", subtitle: "Central Nha Trang office and vehicle network ready 24/7." },
      { locale: "ko", title: "회사 위치 및 고객 안내 데스크", subtitle: "나트랑 중심가 사무소 및 24시간 대기 차량 네트워크." },
      { locale: "ru", title: "Офис и расположение компании", subtitle: "Центральный офис в Нячанге и сеть автомобилей 24/7." },
    ],
  },
  {
    sectionName: "Nhận Hợp Tác Với Các Đối Tác",
    sectionType: "PARTNER_COOPERATION",
    pagePath: "/",
    orderIndex: 9,
    active: true,
    imageUrls: [],
    contentData: JSON.stringify({}),
    translations: [
      { locale: "vi", title: "Nhận hợp tác với các đối tác", subtitle: "Minh Khoa Travel chào đón nhà xe, đối tác khách sạn và đại lý du lịch cùng phát triển." },
      { locale: "en", title: "Partnership & Cooperation", subtitle: "Minh Khoa Travel welcomes fleet owners, hotels and travel agents to grow together." },
      { locale: "ko", title: "파트너십 및 제휴 안내", subtitle: "민콰 트래블은 차량 소유주, 호텔 및 여행사와의 제휴를 환영합니다." },
      { locale: "ru", title: "Партнерство и сотрудничество", subtitle: "Приглашаем к сотрудничеству автовладельцев, отели и турагентства." },
    ],
  },
];

