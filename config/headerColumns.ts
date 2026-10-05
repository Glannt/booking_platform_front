import type { ReactNode } from "react";

export interface HeaderColumn {
  id: string;
  value: ReactNode;
  label?: string;
  isRowHeader?: boolean;
  className?: string;
  sortable?: boolean;
}

/**
 * Helper to create a HeaderColumn item with both `value` and fallback `label`
 */
function createCol(
  id: string,
  value: ReactNode,
  options?: {
    isRowHeader?: boolean;
    className?: string;
    sortable?: boolean;
  }
): HeaderColumn {
  return {
    id,
    value,
    label: typeof value === "string" ? value : id,
    ...options,
  };
}

/* ==========================================================================
   1. Discounts Table Columns
   ========================================================================== */
export const getDiscountHeaderColumns = (t: any): HeaderColumn[] => [
  createCol("code", t?.discounts?.code || "Mã", { isRowHeader: true }),
  createCol("issuanceType", t?.discounts?.issuanceType || "Phát hành"),
  createCol("scope", t?.discounts?.scopeType || "Phạm vi"),
  createCol("type", t?.discounts?.discountType || "Loại"),
  createCol("value", t?.discounts?.discountValue || "Giá trị"),
  createCol("period", t?.discounts?.validPeriod || "Thời hạn"),
  createCol("usage", t?.discounts?.usageCount || "Lượt dùng"),
  createCol("status", t?.discounts?.status || "Trạng thái"),
  createCol("actions", t?.common?.actions || t?.common?.details || "Thao tác", { className: "text-right pr-6" }),
];

/* ==========================================================================
   2. Bookings Table Columns (General & Specific Types)
   ========================================================================== */
export const getBookingHeaderColumns = (t: any): HeaderColumn[] => [
  createCol("code", t?.adminBookings?.bookingCode || "Mã đơn đặt", { isRowHeader: true, className: "px-6 py-4" }),
  createCol("customer", t?.adminBookings?.customer || "Khách hàng", { className: "px-6 py-4" }),
  createCol("finance", t?.adminBookings?.finance || "Tài chính", { className: "px-6 py-4" }),
  createCol("payment_dispatch", t?.adminBookings?.paymentAndDispatch || "Thanh toán & Vận hành", { className: "px-6 py-4" }),
  createCol("status", t?.adminBookings?.bookingStatus || "Trạng thái đơn", { className: "px-6 py-4" }),
  createCol("created_at", t?.adminBookings?.createdAt || "Ngày tạo", { className: "px-6 py-4" }),
  createCol("actions", t?.common?.actions || "Thao tác", { className: "px-6 py-4 text-right" }),
];

export const getBookingTypeHeaderColumns = (t: any): HeaderColumn[] => [
  createCol("id", "ID", { isRowHeader: true, className: "px-6 py-4" }),
  createCol("bookingCode", t?.adminBookings?.bookingCode || "Mã đặt chỗ", { className: "px-6 py-4" }),
  createCol("customer", t?.adminBookings?.customer || "Khách hàng", { className: "px-6 py-4" }),
  createCol("finance", t?.adminBookings?.finance || "Tài chính", { className: "px-6 py-4" }),
  createCol("payment_dispatch", t?.adminBookings?.paymentAndDispatch || "Thanh toán & Vận hành", { className: "px-6 py-4" }),
  createCol("status", t?.adminBookings?.bookingStatus || "Trạng thái", { className: "px-6 py-4" }),
  createCol("actions", t?.common?.actions || "Thao tác", { className: "px-6 py-4 text-right" }),
];

export const getRentalBookingHeaderColumns = (t: any): HeaderColumn[] => [
  createCol("id", "ID", { isRowHeader: true, className: "px-6 py-4" }),
  createCol("code", t?.adminBookings?.bookingCode || "Mã đặt chỗ", { className: "px-6 py-4" }),
  createCol("customer", t?.adminBookings?.customer || "Khách hàng", { className: "px-6 py-4" }),
  createCol("phone", "Số ĐT", { className: "px-6 py-4" }),
  createCol("type", "Loại", { className: "px-6 py-4" }),
  createCol("totalAmount", "Tổng tiền", { className: "px-6 py-4" }),
  createCol("status", t?.common?.status || "Trạng thái", { className: "px-6 py-4" }),
  createCol("actions", t?.common?.actions || "Thao tác", { className: "px-6 py-4 text-right" }),
];

/* ==========================================================================
   3. Users & Currencies & Flights
   ========================================================================== */
export const getUserHeaderColumns = (t: any): HeaderColumn[] => [
  createCol("email", "Email", { isRowHeader: true, className: "px-6 py-4" }),
  createCol("fullName", t?.auth?.fullName || "Họ và tên", { className: "px-6 py-4" }),
  createCol("phone", t?.auth?.phone || "Điện thoại", { className: "px-6 py-4" }),
  createCol("roles", t?.auth?.role || "Vai trò", { className: "px-6 py-4" }),
  createCol("status", t?.common?.status || "Trạng thái", { className: "px-6 py-4" }),
  createCol("actions", t?.common?.actions || "Thao tác", { className: "px-6 py-4 text-right" }),
];

export const getCurrencyHeaderColumns = (t: any): HeaderColumn[] => [
  createCol("code", "Mã", { isRowHeader: true }),
  createCol("symbol", "Ký hiệu"),
  createCol("name", "Tên (VI)"),
  createCol("rate", "1 Đơn vị = VND"),
  createCol("status", t?.common?.status || "Trạng thái"),
  createCol("actions", t?.common?.actions || "Thao tác", { className: "text-right" }),
];

export const getFlightHeaderColumns = (t: any): HeaderColumn[] => [
  createCol("flightNumber", "Số hiệu", { isRowHeader: true, className: "px-6 py-4" }),
  createCol("airline", "Hãng bay", { className: "px-6 py-4" }),
  createCol("route", "Lộ trình", { className: "px-6 py-4" }),
  createCol("scheduledDeparture", "Giờ khởi hành", { className: "px-6 py-4" }),
  createCol("status", t?.common?.status || "Trạng thái", { className: "px-6 py-4" }),
  createCol("lastCheckedAt", "Tra cứu lúc", { className: "px-6 py-4" }),
];

/* ==========================================================================
   4. Services (Services, Categories, FAQs)
   ========================================================================== */
export const getServiceHeaderColumns = (t: any): HeaderColumn[] => [
  createCol("id", "ID", { isRowHeader: true, className: "px-6 py-4" }),
  createCol("name", "Tên Tour / Dịch vụ", { className: "px-6 py-4" }),
  createCol("category", "Danh mục", { className: "px-6 py-4" }),
  createCol("price", "Giá gốc", { className: "px-6 py-4" }),
  createCol("status", t?.common?.status || "Trạng thái", { className: "px-6 py-4" }),
  createCol("actions", t?.common?.actions || "Thao tác", { className: "px-6 py-4 text-right" }),
];

export const getServiceCategoryHeaderColumns = (t: any): HeaderColumn[] => [
  createCol("id", "ID", { isRowHeader: true, className: "px-6 py-4" }),
  createCol("name", "Tên Danh Mục", { className: "px-6 py-4" }),
  createCol("slug", "Slug", { className: "px-6 py-4" }),
  createCol("icon", "Mã Biểu Tượng", { className: "px-6 py-4" }),
  createCol("status", t?.common?.status || "Trạng thái", { className: "px-6 py-4" }),
  createCol("actions", t?.common?.actions || "Thao tác", { className: "px-6 py-4 text-right" }),
];

export const getServiceFaqHeaderColumns = (t: any): HeaderColumn[] => [
  createCol("rating", "Rating", { isRowHeader: true, className: "px-6 py-4 w-16" }),
  createCol("author", "Tác giả", { className: "px-6 py-4" }),
  createCol("comment", "Đánh giá", { className: "px-6 py-4" }),
  createCol("isFeatured", "Hiện trang chủ", { className: "px-6 py-4 w-24" }),
  createCol("actions", t?.common?.actions || "Thao tác", { className: "px-6 py-4 text-right w-28" }),
];

/* ==========================================================================
   5. Tours Table Columns
   ========================================================================== */
export const getTourHeaderColumns = (t: any): HeaderColumn[] => [
  createCol("id", "ID", { isRowHeader: true, sortable: true }),
  createCol("image", "Ảnh", { sortable: false }),
  createCol("name", "Tên tour", { sortable: false }),
  createCol("category", "Danh mục", { sortable: false }),
  createCol("duration", "Thời lượng", { sortable: true }),
  createCol("minPrice", "Giá từ", { sortable: true }),
  createCol("status", t?.common?.status || "Trạng thái", { sortable: true }),
  createCol("actions", t?.common?.actions || "Hành động", { sortable: false }),
];

export const getTourPackageHeaderColumns = (t: any): HeaderColumn[] => [
  createCol("id", "ID", { isRowHeader: true, sortable: true }),
  createCol("tour", "Tour", { sortable: true }),
  createCol("name", "Gói Tour", { sortable: true }),
  createCol("pricing", "Bảng giá (Người lớn / Trẻ em / Em bé)", { sortable: false }),
  createCol("conditions", "Điều kiện áp dụng", { sortable: false }),
  createCol("guests", "Số lượng khách", { sortable: false }),
  createCol("status", t?.common?.status || "Trạng thái", { sortable: true }),
  createCol("actions", t?.common?.actions || "Thao tác", { sortable: false, className: "text-right" }),
];

/* ==========================================================================
   6. Vehicles & Vehicle Categories
   ========================================================================== */
export const getVehicleHeaderColumns = (t: any): HeaderColumn[] => [
  createCol("id", "ID", { isRowHeader: true, sortable: true }),
  createCol("images", "Hình ảnh", { sortable: false }),
  createCol("brandModel", "Thương hiệu / Mẫu", { sortable: false }),
  createCol("type", "Loại xe", { sortable: true }),
  createCol("luggage", "Hành lý", { sortable: false }),
  createCol("active", t?.common?.status || "Trạng thái", { sortable: true }),
  createCol("actions", t?.common?.actions || "Hành Động", { sortable: false }),
];

export const getVehicleCategoryHeaderColumns = (t: any): HeaderColumn[] => [
  createCol("id", "ID", { isRowHeader: true, sortable: true }),
  createCol("name", "Tên phân khúc", { sortable: true }),
  createCol("code", "Mã", { sortable: true }),
  createCol("seats", "Số chỗ", { sortable: false }),
  createCol("active", t?.common?.status || "Trạng thái", { sortable: true }),
  createCol("actions", t?.common?.actions || "Thao tác", { sortable: false }),
];

/* ==========================================================================
   7. Surcharges (Rules & Mappings)
   ========================================================================== */
export const getSurchargeRuleHeaderColumns = (t: any): HeaderColumn[] => [
  createCol("code", "Mã & Tên", { isRowHeader: true, sortable: true }),
  createCol("calculationType", "Loại tính toán", { sortable: true }),
  createCol("value", "Giá trị", { sortable: true }),
  createCol("condition", "Điều kiện", { sortable: false }),
  createCol("effective", "Hiệu lực", { sortable: false }),
  createCol("active", t?.common?.status || "Trạng thái", { sortable: true }),
  createCol("actions", t?.common?.actions || "Thao tác", { sortable: false }),
];

export const getSurchargeMappingHeaderColumns = (t: any): HeaderColumn[] => [
  createCol("moduleCode", "Module", { isRowHeader: true, sortable: true }),
  createCol("ruleName", "Quy tắc phụ thu", { sortable: true }),
  createCol("value", "Giá trị", { sortable: false }),
  createCol("applyOrder", "Thứ tự (Order)", { sortable: true }),
  createCol("isOptional", "Tùy chọn", { sortable: true }),
  createCol("active", t?.common?.status || "Trạng thái", { sortable: true }),
  createCol("actions", t?.common?.actions || "Thao tác", { sortable: false }),
];

/* ==========================================================================
   8. Self-Drive (Rentals & Policies)
   ========================================================================== */
export const getSelfDriveRentalHeaderColumns = (t: any): HeaderColumn[] => [
  createCol("id", "ID", { isRowHeader: true, sortable: true }),
  createCol("sortOrder", "Thứ tự", { sortable: true }),
  createCol("category", "Phân khúc xe", { sortable: true }),
  createCol("vehicles", "Số lượng xe", { sortable: false }),
  createCol("deposit", "Tiền cọc", { sortable: true }),
  createCol("minimumDays", "Số ngày tối thiểu", { sortable: true }),
  createCol("price", "Giá thuê / ngày", { sortable: false }),
  createCol("status", t?.common?.status || "Trạng thái", { sortable: false }),
  createCol("actions", t?.common?.actions || "Thao tác", { sortable: false }),
];

export const getSelfDrivePolicyHeaderColumns = (t: any): HeaderColumn[] => [
  createCol("id", "ID", { isRowHeader: true, sortable: true }),
  createCol("icon", "Biểu tượng", { sortable: false }),
  createCol("code", "Mã chính sách", { sortable: true }),
  createCol("name", "Tiêu đề chính sách", { sortable: true }),
  createCol("description", "Nội dung tóm tắt", { sortable: false }),
  createCol("sortOrder", "Thứ tự", { sortable: true }),
  createCol("status", t?.common?.status || "Trạng thái", { sortable: false }),
  createCol("actions", t?.common?.actions || "Thao tác", { sortable: false }),
];

/* ==========================================================================
   9. Intercity (Routes & Prices)
   ========================================================================== */
export const getIntercityRouteHeaderColumns = (t: any): HeaderColumn[] => [
  createCol("id", "ID", { isRowHeader: true, sortable: true }),
  createCol("name", "Tên tuyến", { sortable: true }),
  createCol("shared", "Vé xe ghép", { sortable: false }),
  createCol("distance", "Khoảng cách (km)", { sortable: true }),
  createCol("hours", "Thời gian (h)", { sortable: true }),
  createCol("active", t?.common?.status || "Trạng thái", { sortable: true }),
  createCol("actions", t?.common?.actions || "Thao tác", { sortable: false, className: "text-right" }),
];

export const getIntercityPriceHeaderColumns = (t: any): HeaderColumn[] => [
  createCol("id", "ID", { isRowHeader: true, sortable: true }),
  createCol("route", "Tuyến đường", { sortable: false }),
  createCol("category", "Loại xe", { sortable: false }),
  createCol("priceType", "Phân loại", { sortable: false }),
  createCol("price", "Giá", { sortable: false }),
  createCol("deposit", t?.selfDrive?.depositHeader || "Deposit", { sortable: false }),
  createCol("active", t?.common?.status || "Trạng thái", { sortable: true }),
  createCol("actions", t?.common?.actions || "Thao tác", { sortable: false }),
];

/* ==========================================================================
   10. Airport Transfers (Airports, Routes, Transfers)
   ========================================================================== */
export const getAirportHeaderColumns = (t: any): HeaderColumn[] => [
  createCol("id", "ID", { isRowHeader: true, sortable: true }),
  createCol("code", "Mã", { sortable: true }),
  createCol("name", "Tên", { sortable: true }),
  createCol("location", "Vị trí", { sortable: false }),
  createCol("active", t?.common?.status || "Trạng thái", { sortable: true }),
  createCol("actions", t?.common?.actions || "Thao tác", { sortable: false }),
];

export const getAirportRouteHeaderColumns = (t: any): HeaderColumn[] => [
  createCol("id", "ID", { isRowHeader: true, sortable: true }),
  createCol("code", "Mã tuyến", { sortable: true }),
  createCol("airport", "Sân bay", { sortable: false }),
  createCol("distanceKm", "Km", { sortable: true }),
  createCol("deposit", "Cọc mặc định", { sortable: false }),
  createCol("active", t?.common?.status || "Trạng thái", { sortable: true }),
  createCol("actions", t?.common?.actions || "Thao tác", { sortable: false }),
];

export const getAirportTransferHeaderColumns = (t: any): HeaderColumn[] => [
  createCol("id", "ID", { isRowHeader: true, sortable: true }),
  createCol("route", "Tuyến", { sortable: true }),
  createCol("category", "Loại xe", { sortable: true }),
  createCol("baseKm", "Km cơ bản", { sortable: true }),
  createCol("zoneBufferKm", "Vùng đệm Zone", { sortable: true }),
  createCol("baseAmount", "Giá trong km", { sortable: true }),
  createCol("perKmAmount", "Giá / km thêm", { sortable: true }),
  createCol("deposit", "Đặt cọc", { sortable: false }),
  createCol("active", t?.common?.status || "Trạng thái", { sortable: true }),
  createCol("actions", t?.common?.actions || "Thao tác", { sortable: false }),
];

/* ==========================================================================
   11. Sections Table Columns
   ========================================================================== */
export const getSectionHeaderColumns = (t: any): HeaderColumn[] => [
  createCol("id", "ID", { isRowHeader: true, sortable: true }),
  createCol("sectionType", "Loại", { sortable: true }),
  createCol("sectionName", "Tên section", { sortable: false }),
  createCol("title", "Tiêu đề (VI)", { sortable: false }),
  createCol("orderIndex", "Thứ tự", { sortable: true }),
  createCol("status", t?.common?.status || "Trạng thái", { sortable: true }),
  createCol("actions", t?.common?.actions || "Hành động", { sortable: false }),
];

/* ==========================================================================
   Aggregated Dictionary of All Portal Columns
   ========================================================================== */
export const headerColumns = {
  discounts: getDiscountHeaderColumns,
  bookings: getBookingHeaderColumns,
  bookingAirportTransfers: getBookingTypeHeaderColumns,
  bookingIntercity: getBookingTypeHeaderColumns,
  bookingSelfDrive: getBookingTypeHeaderColumns,
  rentalBookings: getRentalBookingHeaderColumns,
  users: getUserHeaderColumns,
  currencies: getCurrencyHeaderColumns,
  flights: getFlightHeaderColumns,
  services: getServiceHeaderColumns,
  serviceCategories: getServiceCategoryHeaderColumns,
  serviceFaqs: getServiceFaqHeaderColumns,
  tours: getTourHeaderColumns,
  tourPackages: getTourPackageHeaderColumns,
  vehicles: getVehicleHeaderColumns,
  vehicleCategories: getVehicleCategoryHeaderColumns,
  surchargeRules: getSurchargeRuleHeaderColumns,
  surchargeMappings: getSurchargeMappingHeaderColumns,
  selfDriveRentals: getSelfDriveRentalHeaderColumns,
  selfDrivePolicies: getSelfDrivePolicyHeaderColumns,
  intercityRoutes: getIntercityRouteHeaderColumns,
  intercityPrices: getIntercityPriceHeaderColumns,
  airports: getAirportHeaderColumns,
  airportRoutes: getAirportRouteHeaderColumns,
  airportTransfers: getAirportTransferHeaderColumns,
  sections: getSectionHeaderColumns,
};
