import {
  createEmptySlideCardItem,
  createEmptyFeatureItem,
  createEmptySlideReviewItem,
  createEmptyHeroBadge,
  createEmptyInspirationItem,
  createEmptyBookingStepItem,
  createEmptyFaqCategory,
  createEmptyFaqItem,
  createEmptyPromoContent,
  createEmptyCTAContent,
  createEmptyBannerContent,
  createEmptyText4,
  createEmptyText2,
} from "@/lib/api/section-templates";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "image"
  | "color"
  | "icon"
  | "multilingual4"
  | "select"
  | "styles_feature"
  | "nested_faq_items";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  description?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: any;
  options?: FieldOption[];
  colSpan?: 1 | 2;
}

export interface SectionEditorConfig {
  sectionType: string;
  title: string;
  description: string;
  iconName?: string;
  topLevelFields?: FieldConfig[];
  listKey?: string;
  itemTitleField?: string;
  itemSubtitleField?: string;
  itemFactory?: () => any;
  itemFields?: FieldConfig[];
  isSingleObject?: boolean;
  rootFactory?: () => any;
  singleFields?: FieldConfig[];
}

export const SECTION_EDITOR_CONFIGS: Record<string, SectionEditorConfig> = {
  SLIDE_CARD: {
    sectionType: "SLIDE_CARD",
    title: "Carousel Thẻ Card Dịch Vụ",
    description: "Quản lý danh sách các thẻ giới thiệu sản phẩm / tour / dịch vụ trượt ngang",
    iconName: "LayoutGrid",
    topLevelFields: [
      {
        key: "badgeTitle",
        label: "Tiêu đề Huy hiệu (Badge Header phía trên danh sách)",
        type: "multilingual4",
        description: "Văn bản huy hiệu nhỏ nổi bật trên đầu khối carousel (4 ngôn ngữ)",
        colSpan: 2,
      },
    ],
    listKey: "cards",
    itemTitleField: "title",
    itemSubtitleField: "badge",
    itemFactory: createEmptySlideCardItem,
    itemFields: [
      {
        key: "title",
        label: "Tiêu đề thẻ",
        type: "multilingual4",
        placeholder: "VD: Du thuyền ngắm hoàng hôn",
        required: true,
        colSpan: 2,
      },
      {
        key: "badge",
        label: "Huy hiệu thẻ (Badge)",
        type: "multilingual4",
        placeholder: "VD: Bán chạy nhất / Ưu đãi 20%",
        colSpan: 1,
      },
      {
        key: "price",
        label: "Giá hiển thị",
        type: "multilingual4",
        placeholder: "VD: từ 450.000đ",
        colSpan: 1,
      },
      {
        key: "imageUrl",
        label: "Hình ảnh thẻ",
        type: "image",
        description: "Tải ảnh từ máy tính hoặc dán URL trực tiếp",
        colSpan: 2,
      },
      {
        key: "linkUrl",
        label: "Liên kết khi bấm vào thẻ",
        type: "text",
        placeholder: "/tours/nha-trang-sunset",
        colSpan: 2,
      },
      {
        key: "description",
        label: "Mô tả ngắn thẻ",
        type: "multilingual4",
        placeholder: "Mô tả ngắn gọn đặc điểm nổi bật...",
        colSpan: 2,
      },
    ],
  },

  SLIDE_REVIEW: {
    sectionType: "SLIDE_REVIEW",
    title: "Carousel Đánh Giá Khách Hàng",
    description: "Quản lý các phản hồi, đánh giá thực tế của khách đã trải nghiệm dịch vụ",
    iconName: "MessageSquare",
    topLevelFields: [
      {
        key: "ratingSummary",
        label: "Chuỗi tóm tắt đánh giá chung",
        type: "text",
        placeholder: "VD: 4.9/5 từ hơn 1,500+ lượt trải nghiệm dịch vụ",
        description: "Dòng tóm tắt xếp hạng trung bình hiển thị bên cạnh tiêu đề",
        colSpan: 2,
      },
    ],
    listKey: "reviews",
    itemTitleField: "author",
    itemSubtitleField: "route",
    itemFactory: createEmptySlideReviewItem,
    itemFields: [
      {
        key: "author",
        label: "Tên khách hàng / Người đánh giá",
        type: "text",
        placeholder: "VD: Nguyễn Văn A (Hà Nội)",
        required: true,
        colSpan: 1,
      },
      {
        key: "route",
        label: "Tuyến xe / Dịch vụ đã dùng",
        type: "text",
        placeholder: "VD: Xe riêng Cam Ranh ⇌ Nha Trang",
        colSpan: 1,
      },
      {
        key: "rating",
        label: "Số sao đánh giá (1 - 5)",
        type: "number",
        defaultValue: 5,
        colSpan: 1,
      },
      {
        key: "avatarText",
        label: "Chữ viết tắt Avatar",
        type: "text",
        placeholder: "VD: NA",
        colSpan: 1,
      },
      {
        key: "avatarBg",
        label: "Màu nền Avatar (Tailwind class)",
        type: "text",
        placeholder: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400",
        colSpan: 2,
      },
      {
        key: "title",
        label: "Tiêu đề cảm nghĩ",
        type: "multilingual4",
        placeholder: "VD: Chuyến đi hoàn hảo, lái xe rất nhiệt tình!",
        colSpan: 2,
      },
      {
        key: "description",
        label: "Nội dung nhận xét chi tiết",
        type: "multilingual4",
        placeholder: "Chi tiết trải nghiệm của khách...",
        colSpan: 2,
      },
    ],
  },

  FEATURES: {
    sectionType: "FEATURES",
    title: "Danh Sách Tính Năng & Cam Kết",
    description: "Các điểm mạnh, cam kết chất lượng, bảo hiểm hoặc dịch vụ kèm theo",
    iconName: "ShieldCheck",
    listKey: "features",
    itemTitleField: "title",
    itemFactory: createEmptyFeatureItem,
    itemFields: [
      {
        key: "icon",
        label: "Biểu tượng tính năng (Icon SVG hoặc Lucide)",
        type: "icon",
        description: "Chọn hoặc dán mã SVG trực tiếp",
        colSpan: 2,
      },
      {
        key: "title",
        label: "Tiêu đề tính năng",
        type: "multilingual4",
        placeholder: "VD: Giá niêm yết trọn gói",
        required: true,
        colSpan: 2,
      },
      {
        key: "description",
        label: "Mô tả tính năng",
        type: "multilingual4",
        placeholder: "VD: Không phát sinh bất kỳ phụ phí nào trong suốt hành trình...",
        colSpan: 2,
      },
      {
        key: "styles",
        label: "Màu sắc Icon & Văn bản (Light & Dark mode)",
        type: "styles_feature",
        colSpan: 2,
      },
    ],
  },

  HERO_BANNER: {
    sectionType: "HERO_BANNER",
    title: "Huy Hiệu Hero Banner",
    description: "Các huy hiệu nhỏ gắn trên banner chính (Ví dụ: Cam kết đón đúng giờ, Xe đời mới)",
    iconName: "Sparkles",
    listKey: "badges",
    itemTitleField: "text",
    itemFactory: createEmptyHeroBadge,
    itemFields: [
      {
        key: "text",
        label: "Văn bản huy hiệu",
        type: "multilingual4",
        placeholder: "VD: Đón đúng giờ 100%",
        required: true,
        colSpan: 2,
      },
      {
        key: "icon",
        label: "Biểu tượng huy hiệu",
        type: "icon",
        colSpan: 2,
      },
      {
        key: "textColor",
        label: "Màu chữ huy hiệu",
        type: "color",
        defaultValue: "#ffffff",
        colSpan: 1,
      },
      {
        key: "bgColor",
        label: "Màu nền huy hiệu",
        type: "color",
        defaultValue: "#000000",
        colSpan: 1,
      },
    ],
  },

  INSPIRATION: {
    sectionType: "INSPIRATION",
    title: "Điểm Đến Truyền Cảm Hứng",
    description: "Bộ sưu tập các góc chụp đẹp, gợi ý địa điểm check-in và liên kết Instagram",
    iconName: "Camera",
    topLevelFields: [
      {
        key: "showInstagram",
        label: "Hiển thị khung Instagram",
        type: "boolean",
        description: "Bật để hiển thị badge/nút kết nối tài khoản Instagram",
        colSpan: 1,
      },
      {
        key: "instagramHandle",
        label: "Tài khoản Instagram",
        type: "text",
        placeholder: "@nhatrang.travel",
        colSpan: 1,
      },
    ],
    listKey: "items",
    itemTitleField: "title",
    itemSubtitleField: "subtitle",
    itemFactory: createEmptyInspirationItem,
    itemFields: [
      {
        key: "title",
        label: "Tên địa điểm / Chủ đề",
        type: "multilingual4",
        placeholder: "VD: Bãi Dài Cam Ranh",
        required: true,
        colSpan: 2,
      },
      {
        key: "subtitle",
        label: "Mô tả ngắn / Phụ đề",
        type: "multilingual4",
        placeholder: "VD: Bãi cát trắng mịn nguyên sơ",
        colSpan: 2,
      },
      {
        key: "imageUrl",
        label: "Hình ảnh địa điểm",
        type: "image",
        required: true,
        colSpan: 2,
      },
      {
        key: "linkUrl",
        label: "Đường dẫn liên kết",
        type: "text",
        placeholder: "/tours/bai-dai",
        colSpan: 2,
      },
    ],
  },

  BOOKING_PROCESS: {
    sectionType: "BOOKING_PROCESS",
    title: "Quy Trình Đặt Dịch Vụ",
    description: "Các bước hướng dẫn khách hàng đặt xe, tour một cách đơn giản, nhanh chóng",
    iconName: "ListOrdered",
    listKey: "steps",
    itemTitleField: "title",
    itemFactory: createEmptyBookingStepItem,
    itemFields: [
      {
        key: "step",
        label: "Thứ tự bước",
        type: "number",
        defaultValue: 1,
        colSpan: 1,
      },
      {
        key: "icon",
        label: "Biểu tượng bước",
        type: "icon",
        colSpan: 1,
      },
      {
        key: "title",
        label: "Tiêu đề bước",
        type: "multilingual4",
        placeholder: "VD: Chọn lịch trình & Loại xe",
        required: true,
        colSpan: 2,
      },
      {
        key: "description",
        label: "Mô tả chi tiết bước",
        type: "multilingual4",
        placeholder: "Nhập điểm đón, điểm đến và thời gian mong muốn...",
        colSpan: 2,
      },
    ],
  },

  FAQ: {
    sectionType: "FAQ",
    title: "Câu Hỏi Thường Gặp (FAQ)",
    description: "Nhóm các danh mục câu hỏi và câu trả lời giúp giải đáp thắc mắc cho khách",
    iconName: "HelpCircle",
    listKey: "categories",
    itemTitleField: "title",
    itemFactory: createEmptyFaqCategory,
    itemFields: [
      {
        key: "title",
        label: "Tên danh mục FAQ",
        type: "multilingual4",
        placeholder: "VD: Đặt xe & Thanh toán",
        required: true,
        colSpan: 2,
      },
      {
        key: "items",
        label: "Danh sách câu hỏi trong danh mục",
        type: "nested_faq_items",
        description: "Thêm các câu hỏi và câu trả lời thuộc danh mục này",
        colSpan: 2,
      },
    ],
  },

  PROMO: {
    sectionType: "PROMO",
    title: "Khung Khuyến Mãi / Voucher",
    description: "Khối giới thiệu mã giảm giá đặc biệt, phần trăm chiết khấu và hạn dùng",
    iconName: "Percent",
    isSingleObject: true,
    rootFactory: createEmptyPromoContent,
    singleFields: [
      {
        key: "badge",
        label: "Huy hiệu ưu đãi",
        type: "multilingual4",
        placeholder: "VD: Ưu đãi mùa hè",
        colSpan: 2,
      },
      {
        key: "promoCode",
        label: "Mã giảm giá",
        type: "text",
        placeholder: "VD: HE2024",
        required: true,
        colSpan: 1,
      },
      {
        key: "discountPercent",
        label: "Phần trăm giảm (%)",
        type: "number",
        defaultValue: 10,
        colSpan: 1,
      },
      {
        key: "expiryDate",
        label: "Hạn áp dụng",
        type: "text",
        placeholder: "VD: 31/12/2026",
        colSpan: 1,
      },
      {
        key: "termsUrl",
        label: "Liên kết điều khoản",
        type: "text",
        placeholder: "/terms#promo",
        colSpan: 1,
      },
    ],
  },

  CTA: {
    sectionType: "CTA",
    title: "Khối Kêu Gọi Hành Động (CTA)",
    description: "Khối liên hệ nhanh với hotline, email và Zalo tư vấn",
    iconName: "PhoneCall",
    isSingleObject: true,
    rootFactory: createEmptyCTAContent,
    singleFields: [
      {
        key: "highlightText",
        label: "Thông điệp nổi bật",
        type: "multilingual4",
        placeholder: "VD: Bạn cần tư vấn lịch trình tour riêng hoặc xe sự kiện?",
        colSpan: 2,
      },
      {
        key: "phone",
        label: "Số điện thoại Hotline",
        type: "text",
        placeholder: "0901 234 567",
        colSpan: 1,
      },
      {
        key: "email",
        label: "Hộp thư Email",
        type: "text",
        placeholder: "booking@dulichnhatrang.vn",
        colSpan: 1,
      },
      {
        key: "zaloUrl",
        label: "Liên kết Zalo Chat",
        type: "text",
        placeholder: "https://zalo.me/0901234567",
        colSpan: 2,
      },
    ],
  },

  BANNER: {
    sectionType: "BANNER",
    title: "Khối Banner Đơn",
    description: "Banner quảng cáo đơn lẻ với nút điều hướng",
    iconName: "Image",
    isSingleObject: true,
    rootFactory: createEmptyBannerContent,
    singleFields: [
      {
        key: "bannerType",
        label: "Kiểu Banner",
        type: "select",
        options: [
          { value: "FULL_WIDTH", label: "Toàn màn hình (Full Width)" },
          { value: "COMPACT", label: "Gọn gàng (Compact)" },
        ],
        colSpan: 1,
      },
      {
        key: "actionUrl",
        label: "Đường dẫn liên kết",
        type: "text",
        placeholder: "/tours",
        colSpan: 1,
      },
      {
        key: "caption",
        label: "Chú thích Banner",
        type: "multilingual4",
        placeholder: "VD: Khám phá các vùng đất mới",
        colSpan: 2,
      },
    ],
  },
};

/**
 * Returns default template content for a sectionType
 */
export function getDefaultContentDataForSection(sectionType: string): string {
  const config = SECTION_EDITOR_CONFIGS[sectionType];
  if (!config) return "{}";

  if (config.isSingleObject && config.rootFactory) {
    return JSON.stringify(config.rootFactory(), null, 2);
  }

  const result: Record<string, any> = {};

  if (config.topLevelFields) {
    for (const f of config.topLevelFields) {
      if (f.type === "multilingual4") result[f.key] = createEmptyText4();
      else if (f.type === "boolean") result[f.key] = false;
      else if (f.type === "number") result[f.key] = 0;
      else result[f.key] = "";
    }
  }

  if (config.listKey && config.itemFactory) {
    result[config.listKey] = [config.itemFactory()];
  }

  return JSON.stringify(result, null, 2);
}
