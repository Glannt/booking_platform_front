export interface ComponentItemWithIcon {
  type: "item_with_icon";
  icon?: string;
  content: string;
  props?: {
    is_first?: boolean;
    is_last?: boolean;
    [key: string]: any;
  };
}

export interface MarkdownComponentData {
  title: string;
  props: {
    field_key: "inclusive_of" | "not_inclusive_of" | string;
    height_limit?: boolean;
    fold_type?: number;
    [key: string]: any;
  };
  track?: {
    name: string;
    content: string;
  };
  render_obj: ComponentItemWithIcon[];
}

export type ComponentType =
  | "markdown"
  | "poi"
  | "texts"
  | "text"
  | "itinerary"
  | "sub_group"
  | "pick_up_meet_up_v2"
  | "comparison"
  | string;

export interface ComponentItem<T = any> {
  type: ComponentType;
  data: T;
}

export interface TextsComponentItem {
  icon?: string;
  title?: string;
  content?: string;
}

export interface TextsComponentData {
  title?: string;
  items?: TextsComponentItem[];
  render_obj?: ComponentItemWithIcon[];
}

export interface PoiComponentItem {
  name: string;
  description?: string;
  imageUrl?: string;
  tags?: string[];
}

export interface PoiComponentData {
  title?: string;
  items?: PoiComponentItem[];
}

export type RouteComponent = ComponentItem<MarkdownComponentData>;

// Dev-defined tracking metadata (no DB table needed)
export const INCLUSION_TRACK = {
  name: "Whats_included_LIST",
  content: "group_75",
};

export const EXCLUSION_TRACK = {
  name: "Whats_included_LIST",
  content: "group_76",
};

export const DEFAULT_INCLUSION_ICON =
  "https://res.klook.com/image/upload/v1785743656/ued/ttd/tours/___KIcon_KIcons.icon_check_circle_outlined_size__20_colors__colorScheme.colorAccent2.png";

export const DEFAULT_EXCLUSION_ICON =
  "https://res.klook.com/image/upload/v1685517321/UED_new/TnA/TnA_Itinerary_2305/icon_itinerary_notincluded_20.png";

// ── Dynamic Comparison (PRIVATE vs SHARED) ─────────────────────────
export const COMPARISON_TRACK = {
  name: "Whats_included_LIST",
  content: "group_77",
};

export interface ComparisonItemData {
  type: "title" | "badge" | "description" | "tick";
  value: string;
}

export interface ComparisonComponentData {
  title: string;
  subtitle: string;
  privateCard: ComparisonItemData[];
  sharedCard: ComparisonItemData[];
}

export const DEFAULT_COMPARISON_DATA: ComparisonComponentData = {
  title: "So sánh hình thức di chuyển",
  subtitle: "Loại hình dịch vụ",
  privateCard: [
    { type: "title", value: "Xe riêng hợp đồng" },
    { type: "badge", value: "Xe riêng 4-45 chỗ" },
    {
      type: "description",
      value: "Tự do chọn thời gian, không gian riêng tư, dừng nghỉ tùy thích, đón trả tận nơi.",
    },
    { type: "tick", value: "Giờ đón theo yêu cầu" },
    { type: "tick", value: "Đón trả tận nơi tại mọi địa chỉ" },
    { type: "tick", value: "Không đón thêm khách dọc đường" },
  ],
  sharedCard: [
    { type: "title", value: "Xe ghép chỗ chất lượng cao" },
    { type: "badge", value: "Dcar Limousine" },
    {
      type: "description",
      value: "Tối ưu chi phí cho khách lẻ / nhóm nhỏ, xuất bến đúng giờ theo lịch trình công bố.",
    },
    { type: "tick", value: "Chỉ từ {price} / vé" },
    { type: "tick", value: "Ghế ngồi bọc da massage cao cấp" },
    { type: "tick", value: "Lịch chạy cố định đảm bảo đúng giờ" },
  ],
};

export const DEFAULT_ROUTE_INCLUSIONS = [
  "Xe riêng đời mới, nội thất tiện nghi & điều hòa mát lạnh",
  "Tài xế chuyên nghiệp, lịch sự, đúng giờ",
  "Nước khoáng & khăn lạnh phục vụ trên xe",
  "Bảo hiểm hành khách theo quy định",
  "Toàn bộ chi phí xăng xe, cầu đường, bến bãi theo tuyến",
  "Đưa đón tận nơi tại trung tâm thành phố hoặc khách sạn",
];

export const DEFAULT_ROUTE_EXCLUSIONS = [
  "Thuế VAT 8-10% (nếu quý khách yêu cầu xuất hóa đơn)",
  "Chi phí cá nhân, ăn uống và phát sinh ngoài lộ trình",
  "Phụ phí đón/trả ngoài phạm vi trung tâm hoặc khu vực cách xa",
  "Tiền tip cho tài xế (tùy tâm, không bắt buộc)",
];

/**
 * Creates full Klook-compliant component array from titles and line arrays.
 */
export function buildRouteComponents(
  inclusionsTitle = "Bao gồm theo chương trình",
  inclusions: string[] = DEFAULT_ROUTE_INCLUSIONS,
  exclusionsTitle = "Chi phí tự túc nếu có nhu cầu",
  exclusions: string[] = DEFAULT_ROUTE_EXCLUSIONS,
  comparisonData: ComparisonComponentData | null = null
): RouteComponent[] {
  const incItems: ComponentItemWithIcon[] = inclusions
    .filter((s) => s.trim().length > 0)
    .map((content, idx, arr) => ({
      type: "item_with_icon",
      icon: DEFAULT_INCLUSION_ICON,
      content: content.trim(),
      props: {
        ...(idx === 0 ? { is_first: true } : {}),
        ...(idx === arr.length - 1 ? { is_last: true } : {}),
      },
    }));

  const excItems: ComponentItemWithIcon[] = exclusions
    .filter((s) => s.trim().length > 0)
    .map((content, idx, arr) => ({
      type: "item_with_icon",
      icon: DEFAULT_EXCLUSION_ICON,
      content: content.trim(),
      props: {
        ...(idx === 0 ? { is_first: true } : {}),
        ...(idx === arr.length - 1 ? { is_last: true } : {}),
      },
    }));

  const components: RouteComponent[] = [
    {
      type: "markdown",
      data: {
        title: inclusionsTitle || "Bao gồm theo chương trình",
        props: {
          field_key: "inclusive_of",
          height_limit: false,
          fold_type: 0,
        },
        track: INCLUSION_TRACK,
        render_obj: incItems,
      },
    },
    {
      type: "markdown",
      data: {
        title: exclusionsTitle || "Chi phí tự túc nếu có nhu cầu",
        props: {
          field_key: "not_inclusive_of",
          height_limit: false,
          fold_type: 0,
        },
        track: EXCLUSION_TRACK,
        render_obj: excItems,
      },
    },
  ];

  if (comparisonData) {
    components.push({
      type: "comparison",
      data: comparisonData,
    } as unknown as RouteComponent);
  }

  return components;
}

/**
 * Parses raw components (array or JSON string) into RouteComponent[].
 * If empty or invalid, provides default fallback components.
 */
export function parseRouteComponents(
  input?: ComponentItem[] | string | null
): RouteComponent[] {
  if (!input) {
    return buildRouteComponents();
  }

  if (Array.isArray(input)) {
    if (input.length > 0) return input as RouteComponent[];
    return buildRouteComponents();
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return buildRouteComponents();
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as RouteComponent[];
      }
      if (parsed.components && Array.isArray(parsed.components) && parsed.components.length > 0) {
        return parsed.components as RouteComponent[];
      }
    } catch {
      return buildRouteComponents();
    }
  }

  return buildRouteComponents();
}

/**
 * Extracts titles and string lists from RouteComponent[] for forms and modals.
 */
export function extractComponentContent(
  components?: ComponentItem[] | string | null
): {
  inclusionsTitle: string;
  inclusions: string[];
  exclusionsTitle: string;
  exclusions: string[];
  comparisonData: ComparisonComponentData | null;
} {
  const parsed = Array.isArray(components)
    ? (components as RouteComponent[])
    : parseRouteComponents(components);

  const incComp = parsed.find(
    (c) => c.data?.props?.field_key === "inclusive_of"
  );
  const excComp = parsed.find(
    (c) => c.data?.props?.field_key === "not_inclusive_of"
  );
  const compComp = parsed.find((c) => c.type === "comparison");

  return {
    inclusionsTitle: incComp?.data?.title || "Bao gồm theo chương trình",
    inclusions:
      incComp?.data?.render_obj?.map((item) => item.content) ||
      DEFAULT_ROUTE_INCLUSIONS,
    exclusionsTitle: excComp?.data?.title || "Chi phí tự túc nếu có nhu cầu",
    exclusions:
      excComp?.data?.render_obj?.map((item) => item.content) ||
      DEFAULT_ROUTE_EXCLUSIONS,
    comparisonData:
      (compComp?.data as unknown as ComparisonComponentData) ?? null,
  };
}
